import { HttpException } from "@/exceptions";
import { AuthRequest } from "@/shared/types/AuthRequest";
import { Request, Response } from "express";
import { DocumentService } from "../services/DocumentService";
import { EmailService } from "@/modules/email/services/EmailService";
import QrcodeService from "../services/QrcodeService";
import DIDCreator from "@/modules/did/creators/DIDCreator";

export class DocumentController {
  static async getDocuments(req: AuthRequest, res: Response): Promise<any> {
    const wallet = req.user!.sub;
    const page = parseInt(req.query.page as string) || 1; 
    const limit = parseInt(req.query.limit as string) || 10;

    try {
      const { documents, total } = await DocumentService.getDocuments(wallet, page, limit);

      return res.status(200).json({
        documents,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Internal server error. ", error });
    }
  }

  static async markDocumentAsSigned(
    req: AuthRequest,
    res: Response
  ): Promise<any> {
    const wallet = req.user!.sub;
    const { documentId, signerId } = req.params;
    const { txid } = req.body;

    try {
      await DocumentService.markDocumentAsSigned(
        documentId,
        signerId,
        wallet,
        txid
      );

      return res.status(200).json({
        status: "ok",
      });
    } catch (error: any) {
      const statusCode =
        error instanceof HttpException ? error.statusCode : 500;
      return res.status(statusCode).json({
        message: `Error: ${error.message}`,
      });
    }
  }

  static async getDocumentById(req: AuthRequest, res: Response): Promise<any> {
    const { documentId } = req.params;
    try {
      const document = await DocumentService.getDocumentById(documentId);

      return res.status(200).json({
        document,
      });
    } catch (error: any) {
      const statusCode =
        error instanceof HttpException ? error.statusCode : 500;
      return res.status(statusCode).json({
        message: `Error: ${error.message}`,
      });
    }
  }

  static async getDocumentByIdAndSignerId(
    req: Request,
    res: Response
  ): Promise<any> {
    const { documentId, signerId } = req.params;
    try {
      const document = await DocumentService.getDocumentByIdAndSignerId(
        documentId,
        signerId
      );

      return res.status(200).json({
        document,
      });
    } catch (error: any) {
      const statusCode =
        error instanceof HttpException ? error.statusCode : 500;
      return res.status(statusCode).json({
        message: `Error: ${error.message}`,
      });
    }
  }

  static async saveAndNotifySigners(
    req: AuthRequest,
    res: Response
  ): Promise<any> {
    const { documentId } = req.params;
    const { signers } = req.body;

    try {
      const response = await DocumentService.saveAndNotifySigners(
        documentId,
        signers
      );

      return res.status(200).json({
        response,
      });
    } catch (error: any) {
      const statusCode =
        error instanceof HttpException ? error.statusCode : 500;
      return res.status(statusCode).json({
        message: `Error: ${error.message}`,
      });
    }
  }

  static async createDocument(req: any, res: any): Promise<any> {
    console.log(req.user);
    try {
      const newDocument = await DocumentService.createDocument(req);

      console.log(newDocument);

      return res.status(200).json({
        status: "ok",
        message: "File created successfully",
        data: {
          id: newDocument._id,
          hash: newDocument.hash,
          expirationTime: newDocument.expirationTime,
        },
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Internal server error. ", error });
    }
  }

  static async reviewAndSign(req: any, res: any): Promise<any> {
    const signingLink = `${process.env.XAPP_URL}sign/xyz/zzz`;
    const emailSubject = `Review and Sign: doc.pdf`;
    const normalizedSigners = [
      { email: "john@doe.com", signed: false },
      { email: "diana@doe.com", signed: false },
    ];
    const emailService = new EmailService();
    const emailBody = await emailService.loadTemplate("review_and_sign.html", {
      email: "signer@mail.com",
      link: signingLink,
      doc_name: "doc.pdf",
      signers: normalizedSigners,
      subject: emailSubject,
      app_url: process.env.XAPP_URL,
    });

    return res.status(200).send(emailBody);
  }

  static async generatePDFProof(req: any, res: any): Promise<any> {
    const hash =
      "a0c2f6a2c45a6652fbaf416c4c31cb77175ec913692dfbcf3f453af92c478eda";
    const owner = "rM21rCMcTnifB7KyiYqBUrEdxkeecAeZdw";
    const emailSubject = `Review and Sign: doc.pdf`;

    const txHash1 =
      "F9E0155050D5C1B02BB7CEBFE603E15D01674F48E059C28560E0F1D25A254EFD";
    const txHash2 =
      "2A4A4DD2DFA89671980318E09135DF776EFF4270835D32D29A6D3ED06D9CE430";

    const didCreator = new DIDCreator();

    const did1 = didCreator.createDID(txHash1);
    const did2 = didCreator.createDID(txHash2);

    const qrcode1 = await QrcodeService.generateQRCode(
      `${process.env.XAPP_URL}did/${did1}`
    );
    const qrcode2 = await QrcodeService.generateQRCode(
      `${process.env.XAPP_URL}did/${did2}`
    );

    const documentQr = await QrcodeService.generateQRCode(
      `${process.env.XAPP_URL}file/${hash}`
    );

    const normalizedSigners = [
      {
        email: "john@doe.com",
        wallet: "rM21rCMcTnifB7KyiYqBUrEdxkeecAeZdw",
        signed: true,
        qrcode: qrcode1,
        txHash: txHash1,
        signedAt: new Date(),
        did: did1,
      },
      {
        email: "diana@doe.com",
        wallet: "rG8GgCWM48j8wsjzEbnMhS91ar8V9h8QFS",
        signed: true,
        qrcode: qrcode2,
        txHash: txHash2,
        signedAt: new Date(),
        did: did2,
      },
    ];
    const emailService = new EmailService();
    const emailBody = await emailService.loadTemplate("doc_proof.html", {
      email: "signer@mail.com",
      owner,
      documentQr,
      documentId: "673b047e266d6ee66db5c013",
      documentHash:
        "605f3e53913765bd9ed7d2a299dab30ed30803be287b90da96489d8f2c171a73",
      createdAt: new Date(),
      signers: normalizedSigners,
      subject: emailSubject,
      app_url: process.env.XAPP_URL,
      generationTimestamp: new Date(),
    });

    return res.status(200).send(emailBody);
  }
}
