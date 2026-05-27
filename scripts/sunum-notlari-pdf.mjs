#!/usr/bin/env node
// Sunum notlarını (sunum/*.md) tek bir PDF'e bastırır.
// Kullanım: node scripts/sunum-notlari-pdf.mjs
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const SUNUM_DIR = path.join(ROOT, "sunum");
const OUT_PDF = path.join(SUNUM_DIR, "shackwork-sunum-notlari.pdf");
const OUT_HTML = path.join(SUNUM_DIR, "shackwork-sunum-notlari.html");

// İçinde olmasını istediğim dosyalar (sıralı).
const FILES_IN_ORDER = [
  "BENI-OKU.md",
  "SUNUM-ANLATIM-SIRASI.md",
  "KONUSMA-METNI-6DK.md",
  "KONUSMA-METNI.md",
  "KODU-BILMIYORUM-NE-DERIM.md",
  "01-genel-mimari.md",
  "02-veritabani.md",
  "03-auth-ve-guvenlik.md",
  "04-ana-panel.md",
  "05-api-katmani.md",
  "06-ai-ve-haftalik-plan.md",
  "07-koc-sistemi.md",
  "DOSYA-HARITASI.md",
];

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Çok basit Markdown -> HTML (bağımlılık eklemeden). */
function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let inCode = false;
  let codeBuf = [];
  let listType = null;
  let inTable = false;
  let tableRows = [];

  const flushList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };
  const flushTable = () => {
    if (inTable && tableRows.length) {
      const [header, sep, ...body] = tableRows;
      out.push('<table class="md-table">');
      out.push(
        "<thead><tr>" +
          header
            .map((c) => `<th>${inlineFmt(c.trim())}</th>`)
            .join("") +
          "</tr></thead>",
      );
      out.push("<tbody>");
      for (const row of body) {
        out.push(
          "<tr>" + row.map((c) => `<td>${inlineFmt(c.trim())}</td>`).join("") + "</tr>",
        );
      }
      out.push("</tbody></table>");
    }
    inTable = false;
    tableRows = [];
  };

  const inlineFmt = (text) => {
    // Önce escape, sonra inline kalıpları geri uygula.
    let s = escapeHtml(text);
    // backtick code
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    // bold **x**
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // italic *x* veya _x_
    s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");
    // links [text](url)
    s = s.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2">$1</a>',
    );
    return s;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    // code block ```
    if (raw.startsWith("```")) {
      if (!inCode) {
        flushList();
        flushTable();
        inCode = true;
        codeBuf = [];
      } else {
        inCode = false;
        out.push(
          `<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`,
        );
        codeBuf = [];
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(raw);
      continue;
    }

    const line = raw;

    // Yatay çizgi
    if (/^---+\s*$/.test(line)) {
      flushList();
      flushTable();
      out.push("<hr />");
      continue;
    }

    // Tablo satırı
    if (/^\|.*\|\s*$/.test(line)) {
      flushList();
      const cells = line
        .replace(/^\|/, "")
        .replace(/\|\s*$/, "")
        .split("|");
      if (!inTable) inTable = true;
      tableRows.push(cells);
      continue;
    } else {
      flushTable();
    }

    // Başlıklar
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushList();
      const lvl = h[1].length;
      out.push(`<h${lvl}>${inlineFmt(h[2])}</h${lvl}>`);
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      flushList();
      out.push(
        `<blockquote>${inlineFmt(line.replace(/^>\s?/, ""))}</blockquote>`,
      );
      continue;
    }

    // Liste — sırasız
    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    if (ul) {
      if (listType !== "ul") {
        flushList();
        out.push("<ul>");
        listType = "ul";
      }
      out.push(`<li>${inlineFmt(ul[1])}</li>`);
      continue;
    }
    // Liste — sıralı
    const ol = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (ol) {
      if (listType !== "ol") {
        flushList();
        out.push("<ol>");
        listType = "ol";
      }
      out.push(`<li>${inlineFmt(ol[1])}</li>`);
      continue;
    }

    if (line.trim() === "") {
      flushList();
      out.push("");
      continue;
    }

    flushList();
    out.push(`<p>${inlineFmt(line)}</p>`);
  }
  flushList();
  flushTable();
  if (inCode && codeBuf.length) {
    out.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
  }
  return out.join("\n");
}

async function main() {
  const allMd = await fs.readdir(SUNUM_DIR).catch(() => []);
  // Sıralı listeye olmayanları sona ekle
  const set = new Set(FILES_IN_ORDER);
  const extras = allMd
    .filter((f) => f.endsWith(".md") && !set.has(f))
    .sort();
  const files = [...FILES_IN_ORDER, ...extras];

  const sections = [];
  for (const f of files) {
    const fp = path.join(SUNUM_DIR, f);
    try {
      const content = await fs.readFile(fp, "utf8");
      const html = mdToHtml(content);
      sections.push(`
        <section class="doc">
          <p class="filebadge">${escapeHtml(f)}</p>
          ${html}
        </section>
      `);
    } catch {
      // dosya yok, atla
    }
  }

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>shackWork — Sunum Notları</title>
<style>
  @page { size: A4; margin: 18mm 14mm 18mm 14mm; }
  * { box-sizing: border-box; }
  html, body {
    font-family: "Segoe UI", -apple-system, "Inter", system-ui, "Noto Sans", sans-serif;
    color: #1a1a1a;
    background: #ffffff;
    font-size: 11pt;
    line-height: 1.5;
    margin: 0;
    padding: 0;
  }
  .cover {
    page-break-after: always;
    text-align: center;
    padding: 60mm 10mm 20mm;
  }
  .cover h1 {
    font-size: 36pt;
    margin: 0 0 6mm;
    color: #047857;
    letter-spacing: -0.5px;
  }
  .cover .tag {
    display: inline-block;
    padding: 3mm 6mm;
    background: #ecfdf5;
    color: #047857;
    border-radius: 999px;
    font-weight: 600;
    font-size: 11pt;
    margin-bottom: 8mm;
  }
  .cover .subtitle {
    font-size: 14pt;
    color: #555;
    margin: 0 0 14mm;
  }
  .cover .meta {
    font-size: 10pt;
    color: #888;
    line-height: 1.8;
  }
  section.doc { page-break-before: always; padding-bottom: 8mm; }
  section.doc:first-of-type { page-break-before: avoid; }
  .filebadge {
    display: inline-block;
    font-family: ui-monospace, "Cascadia Code", "Consolas", monospace;
    font-size: 9pt;
    color: #047857;
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    padding: 1mm 3mm;
    border-radius: 4px;
    margin: 0 0 6mm 0;
  }
  h1 {
    font-size: 22pt;
    color: #064e3b;
    margin: 0 0 4mm;
    border-bottom: 2px solid #d1fae5;
    padding-bottom: 2mm;
  }
  h2 {
    font-size: 16pt;
    color: #065f46;
    margin: 8mm 0 3mm;
  }
  h3 {
    font-size: 13pt;
    color: #047857;
    margin: 6mm 0 2mm;
  }
  h4 {
    font-size: 11pt;
    color: #047857;
    margin: 4mm 0 1mm;
  }
  p { margin: 0 0 2.5mm; }
  ul, ol { margin: 0 0 3mm 6mm; padding: 0; }
  li { margin: 0 0 1mm; }
  blockquote {
    border-left: 3px solid #10b981;
    background: #f0fdf4;
    margin: 3mm 0;
    padding: 2.5mm 4mm;
    color: #064e3b;
    font-style: italic;
  }
  blockquote > * { font-style: italic; }
  code {
    font-family: ui-monospace, "Cascadia Code", "Consolas", monospace;
    background: #f4f4f5;
    color: #1e293b;
    padding: 0.5mm 1.5mm;
    border-radius: 3px;
    font-size: 9.5pt;
    border: 1px solid #e4e4e7;
  }
  pre {
    background: #18181b;
    color: #f4f4f5;
    padding: 3mm 4mm;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 9.5pt;
    line-height: 1.45;
    margin: 3mm 0 4mm;
    page-break-inside: avoid;
  }
  pre code { background: transparent; color: inherit; border: 0; padding: 0; }
  hr {
    border: 0;
    border-top: 1px dashed #d4d4d8;
    margin: 6mm 0;
  }
  table.md-table {
    border-collapse: collapse;
    width: 100%;
    margin: 3mm 0 4mm;
    font-size: 10pt;
    page-break-inside: avoid;
  }
  .md-table th, .md-table td {
    border: 1px solid #e4e4e7;
    padding: 2mm 3mm;
    text-align: left;
    vertical-align: top;
  }
  .md-table th { background: #f0fdf4; color: #064e3b; font-weight: 600; }
  .md-table tr:nth-child(even) td { background: #fafafa; }
  a { color: #047857; text-decoration: none; border-bottom: 1px solid #a7f3d0; }
  strong { color: #064e3b; }
</style>
</head>
<body>
  <div class="cover">
    <div class="tag">Bitirme / Vize Sunumu — Kod anlatımı</div>
    <h1>shackWork</h1>
    <p class="subtitle">Kişisel antrenman, beslenme ve gelişim takip uygulaması</p>
    <p class="meta">
      Sunum notları derlemesi<br/>
      ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}<br/>
      Hazırlayan: Deniz Karakoçoğlu
    </p>
  </div>
  ${sections.join("\n")}
</body>
</html>`;

  await fs.writeFile(OUT_HTML, html, "utf8");

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(OUT_HTML).href, { waitUntil: "load" });
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: OUT_PDF,
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });
  } finally {
    await browser.close();
  }

  console.log("PDF yazıldı:", OUT_PDF);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
