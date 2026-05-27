/**
 * StandardFonts (Helvetica) WinAnsi ile uyumlu metin — pdf-lib drawText patlamasını önler.
 */
export function pdfSafeAsciiForStandardFonts(s: string): string {
  const t = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return t
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "G")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "U")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "O")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C")
    .replace(/…/g, "...")
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/═/g, "=")
    .replace(/•/g, "*")
    .replace(/\u2022/g, "*")
    .replace(/·/g, "-")
    .replace(/’/g, "'")
    .replace(/‘/g, "'")
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/[^\n\r\x20-\x7E]/g, "?");
}
