import type { NextConfig } from "next";

/**
 * Arkadaşlarla paylaşım (Cloudflare Tunnel, ngrok vb.) sırasında Next.js,
 * farklı hosttan gelen `/_next` isteklerini güvenlik için keser.
 * Sabit tek hostname yerine joker kullan; aksi halde her yeni tünel linki açılmaz.
 */
const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.loca.lt",
  ],
};

export default nextConfig;
