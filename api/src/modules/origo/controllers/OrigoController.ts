import { DocumentService } from "@/modules/documents/services/DocumentService";
import { AuthRequest } from "@/shared/types/AuthRequest";
import { Response } from "express";
import fs from "fs";
import { plainAddPlaceholder } from "node-signpdf";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import signatureService, { VerifyPayload } from "../services/SignatureService";
const signer = require("node-signpdf").default;

export class OrigoController {
  static async verifySignature(req: AuthRequest, res: Response) {
    try {
      const { sha256, signature, rAddress, id } = req.body || {};

      const result = await signatureService.verifyPayload({
        sha256,
        signature,
        rAddress,
        id,
        useXamanWallet: true
      } as VerifyPayload);
      
      return res.status(result.status).json(result.body);
    } catch (err: any) {
      console.error("verify-signature route error:", err);
      return res.status(500).json({ message: `Internal server error: ${err.message}` });
    }
  }

  static async sign(req: any, res: Response) {
    try {
      const pdfFile = req.files?.["pdf"]?.[0];
      const p12File = req.files?.["cert"]?.[0];
      const passphrase = req.body.passphrase || "";
      const wallet = req.body.wallet || "";

      if (!pdfFile || !p12File) {
        return res
          .status(400)
          .json({ error: "PDF and P12 files are required." });
      }

      const validationUrl = `${process.env.XAPP_URL}genesis/${wallet}`;
      const qrImageBuffer = await QRCode.toBuffer(validationUrl);
      const pdfDoc = await PDFDocument.load(pdfFile.buffer);
      const qrPage = pdfDoc.addPage([595, 842]);
      const pngImage = await pdfDoc.embedPng(qrImageBuffer);
      qrPage.drawImage(pngImage, {
        x: 50,
        y: 650,
        width: 150,
        height: 150,
      });

      qrPage.drawText("Docproof - Proof of Origin", {
        x: 50,
        y: 600,
        size: 24,
        color: rgb(0, 0.2, 0.6),
      });

      qrPage.drawText(
        "Scan the QR code to validate this document on the Xahau Docproof.",
        {
          x: 50,
          y: 570,
          size: 16,
          color: rgb(0, 0, 0),
        }
      );

      qrPage.drawText(`Validation URL: ${validationUrl}`, {
        x: 50,
        y: 540,
        size: 12,
        color: rgb(0, 0, 0),
      });

      let pdfWithQrBuffer = await pdfDoc.save({ useObjectStreams: false });

      const watermarkPath = path.join(
        __dirname,
        "/../../assets/app-logo-horizontal-dark.png"
      );
      if (fs.existsSync(watermarkPath)) {
        pdfWithQrBuffer = await DocumentService.addWatermark(
          Buffer.from(pdfWithQrBuffer),
          watermarkPath
        );
      }

      const pdfWithPlaceholder = plainAddPlaceholder({
        pdfBuffer: Buffer.from(pdfWithQrBuffer),
        reason: "Document signed via Docproof",
      });

      const signedPdf = signer.sign(pdfWithPlaceholder, p12File.buffer, {
        passphrase,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=document-signed.pdf"
      );
      res.send(signedPdf);
    } catch (error: any) {
      console.error("Error signing PDF:", error.message);
      res.status(500).json({ error: "Failed to sign PDF." });
    }
  }
}
