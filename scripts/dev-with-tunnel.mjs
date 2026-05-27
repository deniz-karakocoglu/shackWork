/**
 * Geliştirme sunucusu + Cloudflare Quick Tunnel.
 * Link: metrics /quicktunnel JSON (tercih) veya log ayrıştırma; panoya + .dev-tunnel-url + tarayıcı.
 */
import { spawn, execFileSync } from "node:child_process";
import { existsSync, writeFileSync, unlinkSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const urlFile = path.join(root, ".dev-tunnel-url");
/** Log satırından yakala (yedek). */
const TUNNEL_LINE_RE = /https:\/\/[a-z0-9.-]+\.trycloudflare\.com\/?/i;

const METRICS_PORT = Number(process.env.CF_TUNNEL_METRICS_PORT || "35641");

let announced = false;
let nextChild = null;
let tunnelChild = null;

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function copyToClipboard(text) {
  try {
    if (process.platform === "win32") {
      execFileSync("clip", { input: text, stdio: ["pipe", "ignore", "ignore"] });
    } else if (process.platform === "darwin") {
      execFileSync("pbcopy", { input: text, stdio: ["pipe", "ignore", "ignore"] });
    } else {
      execFileSync("xclip", ["-selection", "clipboard"], {
        input: text,
        stdio: ["pipe", "ignore", "ignore"],
      });
    }
  } catch {
    // xclip vb. yoksa sessiz geç
  }
}

function openBrowser(url) {
  if (process.env.CF_TUNNEL_SKIP_BROWSER === "1") return;
  try {
    if (process.platform === "win32") {
      spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    } else if (process.platform === "darwin") {
      spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
    } else {
      spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
    }
  } catch {
    /* ignore */
  }
}

function normalizeTunnelUrl(hostOrUrl) {
  const s = String(hostOrUrl ?? "").trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s.replace(/\/+$/, "");
  return `https://${s.replace(/^\/+/, "")}`.replace(/\/+$/, "");
}

/** Tünel DNS’e düşene kadar bekle; hemen açınca NXDOMAIN olabiliyor. */
const OPEN_DELAY_MS = Number(process.env.CF_TUNNEL_OPEN_DELAY_MS || "8000");

async function announceUrl(raw) {
  if (announced) return;
  const clean = normalizeTunnelUrl(raw);
  if (!clean || !clean.includes(".trycloudflare.com")) return;
  announced = true;

  writeFileSync(urlFile, `${clean}\n`, "utf8");
  copyToClipboard(clean);

  console.log("\n\x1b[32m━━━━━━━━ Paylaşım linki (panoya kopyalandı)\x1b[0m");
  console.log(`\x1b[36m${clean}\x1b[0m`);
  console.log(
    "\x1b[33mÖnemli:\x1b[0m Bu adres \x1b[1myalnızca bu terminal + cloudflared çalışırken\x1b[0m geçerlidir.",
  );
  console.log(
    "  • Ctrl+C veya pencereyi kapatırsan link \x1b[31mölür\x1b[0m; sonra aynı adrese gidersen \x1b[31mDNS_PROBE_FINISHED_NXDOMAIN\x1b[0m görürsün.",
  );
  console.log(
    "  • Eski link, yer imi veya panelde kalan önceki adresi kullanma; \x1b[32mher çalıştırmada yeni URL\x1b[0m üretilir.",
  );
  console.log(
    `  • Tarayıcı ${OPEN_DELAY_MS / 1000} sn sonra açılacak (DNS hazır olsun). Beklemeden açmak için: set CF_TUNNEL_OPEN_DELAY_MS=0`,
  );
  if (process.env.CF_TUNNEL_SKIP_BROWSER === "1") {
    console.log("  • CF_TUNNEL_SKIP_BROWSER=1 → tarayıcı otomatik açılmıyor; linki elle yapıştır.\n");
    return;
  }
  console.log("");

  await delay(OPEN_DELAY_MS);
  openBrowser(clean);
  console.log("\x1b[90mTarayıcı açıldı; hata devam ederse VPN kapatıp yeniden dene.\x1b[0m\n");
}

function tryParseUrl(chunk, acc) {
  acc.buf += chunk.toString("utf8");
  const m = acc.buf.match(TUNNEL_LINE_RE);
  if (m) void announceUrl(m[0]);
}

async function pollQuickTunnelFromMetrics() {
  const base = `http://127.0.0.1:${METRICS_PORT}`;
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline && !announced) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2500);
      const r = await fetch(`${base}/quicktunnel`, { signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) {
        await delay(350);
        continue;
      }
      const j = await r.json().catch(() => ({}));
      const host = j.hostname ?? j.url;
      if (typeof host === "string" && host.length > 0) {
        void announceUrl(host);
        return;
      }
    } catch {
      /* metrics henüz ayakta değil */
    }
    await delay(350);
  }
}

function waitPort(port, host = "127.0.0.1", timeoutMs = 120_000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryOnce = () => {
      const socket = net.createConnection({ port, host }, () => {
        socket.end();
        resolve();
      });
      socket.on("error", () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Port ${port} hazır olmadı (${timeoutMs} ms).`));
        } else {
          setTimeout(tryOnce, 400);
        }
      });
    };
    tryOnce();
  });
}

function shutdown() {
  try {
    if (existsSync(urlFile)) unlinkSync(urlFile);
  } catch {
    /* ignore */
  }
  for (const c of [tunnelChild, nextChild]) {
    if (c && !c.killed) {
      try {
        c.kill("SIGTERM");
      } catch {
        /* ignore */
      }
    }
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

async function main() {
  const shell = process.platform === "win32";
  nextChild = spawn(
    "npx",
    ["--yes", "next", "dev", "--hostname", "0.0.0.0", "--port", "3000"],
    { cwd: root, stdio: "inherit", shell },
  );

  nextChild.on("exit", (code) => {
    shutdown();
    process.exit(code ?? 0);
  });

  try {
    await waitPort(3000);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    shutdown();
    process.exit(1);
  }

  const acc = { buf: "" };
  const metricsAddr = `127.0.0.1:${METRICS_PORT}`;
  tunnelChild = spawn(
    "npx",
    [
      "--yes",
      "cloudflared",
      "tunnel",
      "--url",
      "http://127.0.0.1:3000",
      "--metrics",
      metricsAddr,
    ],
    { cwd: root, stdio: ["ignore", "pipe", "pipe"], shell },
  );

  const tee = (d) => {
    process.stderr.write(d);
    tryParseUrl(d, acc);
  };
  tunnelChild.stdout?.on("data", tee);
  tunnelChild.stderr?.on("data", tee);

  void pollQuickTunnelFromMetrics();

  tunnelChild.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`cloudflared çıktı (kod ${code}). Port ${METRICS_PORT} meşgulse CF_TUNNEL_METRICS_PORT ile başka port dene.`);
    }
  });
}

main().catch((e) => {
  console.error(e);
  shutdown();
  process.exit(1);
});
