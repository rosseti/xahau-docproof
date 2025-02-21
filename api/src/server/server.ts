import dotenv from "dotenv";

dotenv.config();

import express from "express";
import fs from "fs";
import morgan from "morgan";
import path from "path";
import connectToDatabase from "../infra/database";

/* c8 ignore next */
const PORT: number = parseInt(`${process.env.API_PORT || 3001}`);

const app = express();

/* c8 ignore start */
if (process.argv.includes("--run")) app.use(morgan("tiny"));
/* c8 ignore end */

app.use(express.json());

import { authenticateJWT } from "@/modules/auth/middleware/authenticateJWT";
import DIDCreator from "@/modules/did/creators/DIDCreator";
import UserDocument from "@/modules/documents/models/UserDocument";
import { DocumentService } from "@/modules/documents/services/DocumentService";
import QrcodeService from "@/modules/documents/services/QrcodeService";
import { EmailService } from "@/modules/email/services/EmailService";
import { router } from "@/shared/infra/http/routes";
const pdf = require("html-pdf");

app.use("/api", router);

function generatePdfAsync(html: string, options: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    pdf.create(html, options).toBuffer((err: any, buffer: any) => {
      if (err) {
        reject(err); // Rejeita a Promise caso ocorra um erro
      } else {
        resolve(buffer); // Resolve com o conteúdo do PDF em memória
      }
    });
  });
}

app.get("/api/proof/:docId", async (req: any, res: any) => {
  const { docId } = req.params;

  try {
    const document = await DocumentService.getDocumentById(docId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const didCreator = new DIDCreator();

    const owner = document.owner;
    const documentQr = await QrcodeService.generateQRCode(
      `${process.env.XAPP_URL}file/${document.hash}`
    );

    let normalizedSigners: Array<any> = [];

    for (const signer of document.signers) {
      const did = didCreator.createDID(signer.txHash);
      const qrcode = await QrcodeService.generateQRCode(
        `${process.env.XAPP_URL}did/${encodeURIComponent(did)}`
      );
      normalizedSigners.push({
        email: signer.email,
        wallet: signer.wallet,
        signed: signer.signed,
        txHash: signer.txHash,
        signedAt: signer.signedAt,
        qrcode,
        did,
      });
    }

    const emailService = new EmailService();
    const htmlContent = await emailService.loadTemplate("doc_proof.html", {
      owner,
      documentId: document.id,
      documentHash: document.hash,
      documentQr,
      createdAt: document.createdAt,
      signers: normalizedSigners,
      app_url: process.env.XAPP_URL,
      generationTimestamp: new Date(),
    });

    const options = {
      format: "A4",
      orientation: "portrait",
      border: "1mm",
      paginationOffset: 1,
      quality: 100,
      childProcessOptions: {
        env: {
          OPENSSL_CONF: "/dev/null",
        },
      },
    };

    const pdfBuffer = await generatePdfAsync(htmlContent, options);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${document.hash}-proof.pdf`
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).send("Error generating PDF: " + error.message);
  }
});

app.get("/api/file/:hash", authenticateJWT, async (req: any, res: any) => {
  const { hash } = req.params;
  const userWallet = req.user!.sub;
  const { docId, signerId } = req.query;

  let document;

  if (docId && signerId) {
    document = await DocumentService.getDocumentByIdAndSignerId(
      docId,
      signerId
    );
  } else {
    document = await UserDocument.findOne({
      hash,
      $or: [{ owner: userWallet }, { "signers.wallet": userWallet }],
    }).exec();
  }

  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }

  const storagePath = process.env.STORAGE_PATH || "/storage";

  const filePath = path.resolve(storagePath, `${hash}.pdf`);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ message: "File not found on filesystem" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${hash}.pdf"`);

    res.sendFile(filePath, (err: Error) => {
      if (err) {
        res.status(500).json({ message: "Error sending file" });
      }
    });
  });
});

app.get("/api/health", async (req: any, res: any) => {
  return res.status(200).json({ status: "ok" });
});

/* c8 ignore start */
if (process.argv.includes("--run"))
  app.listen(PORT, async () => {
    console.log(`Server server running at ${PORT}.`);
    await connectToDatabase();
  });
/* c8 ignore end */

app.disable("x-powered-by");

export { app };
