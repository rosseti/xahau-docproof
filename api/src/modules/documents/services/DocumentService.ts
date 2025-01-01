import { DocumentStatus } from "@/enums/DocumentStatus";
import {
  BadRequestException,
  HttpException,
  NotFoundException,
} from "@/exceptions";
import DIDCreator from "@/modules/did/creators/DIDCreator";
import UserDocument, {
  IUserDocument,
  Signer,
} from "@/modules/documents/models/UserDocument";
import crypto from "crypto";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { NotificationService } from "./NotificationService";
import { InternalServerErrorException } from "@/exceptions/InternalServerErrorException";

export class DocumentService {
  static async getDocuments(
    wallet: string,
    page: number,
    limit: number
  ): Promise<{ documents: any[]; total: number }> {
    if (!wallet || typeof wallet !== "string" || wallet.trim().length === 0) {
      throw new BadRequestException("A valid owner wallet is required");
    }

    const skip = (page - 1) * limit;

    const documents = await UserDocument.find({ owner: wallet }) 
      .sort({ createdAt: -1 }) 
      .skip(skip) 
      .limit(limit) 
      .lean();

    const total = await UserDocument.countDocuments({ owner: wallet });

    return { documents, total };
  }

  static markDocumentAsSigned = async (
    documentId: string,
    signerId: string,
    wallet: string,
    txid: string
  ): Promise<IUserDocument | null> => {
    if (!documentId) {
      throw new BadRequestException("Document ID is required.");
    }

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException("Invalid document ID format.");
    }

    const document = await UserDocument.findOne({
      _id: documentId,
      signers: { $elemMatch: { _id: signerId } },
    }).exec();

    if (!document) {
      throw new HttpException(404, "Document not found.");
    }

    let hasSigned = false;
    const notification = new NotificationService();

    document.signers.forEach((signer) => {
      if (signer.id === signerId && signer.signed === false) {
        signer.signed = true;
        signer.signedAt = new Date();
        signer.wallet = wallet;
        signer.txHash = txid;

        hasSigned = true;

        notification.notifyPushNotification(
          document.userToken,
          "Document Signed",
          `Your document has been signed by ${signer.email}.`
        );
      }
    });

    const totalSigners = document.signers.length;
    const totalSigned = document.signers.filter(
      (signer) => signer.signed
    ).length;

    if (totalSigners === totalSigned) {
      document.status = DocumentStatus.FullySigned;
    } else if (totalSigners > totalSigned && hasSigned) {
      document.status = DocumentStatus.PartiallySigned;
    }

    if (document.status === DocumentStatus.FullySigned) {
      console.log("Sending push notification");
      notification.notifyPushNotification(
        document.userToken,
        "Document Fully Signed",
        `Your document is now fully signed.`
      );
    }

    await document.save();

    return document;
  };

  static getDocumentById = async (documentId: string): Promise<any> => {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException("Invalid document ID format.");
    }

    const document = await UserDocument.findById(documentId).exec();
    if (!document) {
      throw new HttpException(404, "Document not found");
    }

    const {
      id,
      hash,
      name,
      size,
      extension,
      owner,
      status,
      expirationTime,
      signers,
      pageCount,
      createdAt,
    } = document;

    const newSigners = signers.map((signer) => {
      let returnSigner = {
        id: signer.id,
        email: signer.email,
        wallet: signer.wallet,
        signed: signer.signed,
        signedAt: signer.signedAt,
        txHash: signer.txHash,
        did: "",
      };

      if (signer.signed) {
        const didCreator = new DIDCreator();
        returnSigner.did = didCreator.createDID(signer.txHash);
      }

      return returnSigner;
    });

    return {
      id,
      hash,
      name,
      size,
      extension,
      owner,
      status,
      expirationTime,
      signers: newSigners,
      pageCount,
      createdAt,
    };
  };

  static getDocumentByIdAndSignerId = async (
    documentId: string,
    signerId: string
  ): Promise<any> => {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException("Invalid document ID format.");
    }

    if (!mongoose.Types.ObjectId.isValid(signerId)) {
      throw new BadRequestException("Invalid signer ID format.");
    }

    const document = await UserDocument.findOne({
      _id: documentId,
      signers: { $elemMatch: { _id: signerId } },
    }).exec();

    if (!document) {
      throw new HttpException(404, "Document not found");
    }

    const idHash = crypto
      .createHash("sha256")
      .update(documentId)
      .digest("hex")
      .toUpperCase();

    const { id, hash, name, size, extension, owner, status, expirationTime } =
      document;

    const signers = document.signers.filter((signer) => signer.id === signerId);

    return {
      id,
      hash,
      name,
      size,
      extension,
      owner,
      status,
      expirationTime,
      signers,
      idHash,
    };
  };

  static saveAndNotifySigners = async (
    documentId: string,
    signers: string[]
  ): Promise<any> => {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException("Invalid document ID format.");
    }

    if (!Array.isArray(signers) || signers.length === 0) {
      throw new HttpException(400, "Invalid signers list or empty.");
    }

    const document = await UserDocument.findById(documentId).exec();
    if (!document) {
      throw new NotFoundException("Document not found");
    }

    document.signers = [];
    for (const email of signers) {
      const signer = new Signer({
        email,
        status: false,
      });
      document.signers.push(signer);
    }

    const notificationService = new NotificationService();
    await notificationService.notifySignersForReview(document);

    document.status = DocumentStatus.AwaitingSignatures;
    await document.save();

    return document.signers;
  };

  static createDocument = async (req: any): Promise<any> => {
    if (!req.file) {
      throw new BadRequestException("File is required.");
    }

    const hash = crypto.createHash("sha256");
    hash.update(req.file.buffer);
    const fileHash = hash.digest("hex");

    const ext = path.extname(req.file.originalname);
    const filename = `${fileHash}${ext}`;

    const storagePath = process.env.STORAGE_PATH || "/storage";

    const filePath = path.join(storagePath, filename);
    fs.writeFileSync(filePath, req.file.buffer);

    const expirationTime = new Date(Date.now() + 20 * (24 * 60 * 60 * 1000));

    const originalFilename = Buffer.from(
      req.file.originalname,
      "latin1"
    ).toString("utf8");

    const pageCount = await this.getDocumentPageCount(filePath);

    const newDocument = new UserDocument({
      hash: fileHash,
      name: originalFilename,
      size: req.file.size,
      extension: ext,
      signers: req.body.signers || [],
      expirationTime,
      owner: req.user.sub,
      userToken: req.user.usertoken_uuidv4,
      pageCount,
    });

    await newDocument.save();

    return newDocument;
  };

  static getDocumentPageCount = async (pdfPath: string) => {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    const pageCount = pdfDoc.getPageCount();

    console.log(`PDF has ${pageCount} pages.`);
    return pageCount;
  };
}
