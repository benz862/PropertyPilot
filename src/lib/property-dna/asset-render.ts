import PDFDocument from "pdfkit";
import QRCode from "qrcode";

/** Render markdown-ish text content as a simple PDF buffer. */
export async function renderTextPdf(title: string, content: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "LETTER" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text(title, { align: "left" });
    doc.moveDown();
    doc.fontSize(10).text(content.replace(/^#+\s/gm, ""), { align: "left" });
    doc.end();
  });
}

/** Render a QR code as a PNG buffer. */
export async function renderQrPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, { type: "png", width: 512, margin: 2 });
}

export const PDF_ASSET_TYPES = new Set([
  "feature_sheet",
  "buyer_brochure",
  "open_house_flyer",
  "qr_sign",
]);

export const PNG_ASSET_TYPES = new Set(["qr_code_png"]);
