import { DocumentStatus } from "@/enums/DocumentStatus";
import {
  BadRequestException,
  HttpException,
  NotFoundException,
} from "@/exceptions";
import UserDocument, { IUserDocument } from "@/models/UserDocument";
import crypto from "crypto";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";

export class DocumentService {
  static getDocuments = async (wallet: string): Promise<IUserDocument[]> => {
    if (!wallet) {
      throw new BadRequestException("Owner wallet is required");
    }

    const documents: IUserDocument[] = await UserDocument.find({
      owner: wallet,
    })
      .select(
        "-transactionHash -contractStorageKey -authorizedSigners -signedSigners"
      )
      .sort({ createdAt: -1 });

    return documents;
  };

  static updateDocumentStatus = async (
    documentId: string,
    newStatus: DocumentStatus,
    params: { transactionHash?: string; contractStorageKey?: string } = {}
  ): Promise<IUserDocument | null> => {
    if (!documentId) {
      throw new BadRequestException("Document ID is required.");
    }

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException("Invalid document ID format.");
    }

    const document = await UserDocument.findById(documentId);

    if (!document) {
      throw new HttpException(404, "Document not found.");
    }

    const validTransitions: Record<DocumentStatus, DocumentStatus[]> = {
      [DocumentStatus.Pending]: [
        DocumentStatus.WaitingForBlockchainConfirmation,
        DocumentStatus.Rejected,
      ],
      [DocumentStatus.WaitingForBlockchainConfirmation]: [
        DocumentStatus.OnBlockchain,
      ],
      [DocumentStatus.OnBlockchain]: [DocumentStatus.AwaitingSignatures],
      [DocumentStatus.AwaitingSignatures]: [
        DocumentStatus.PartiallySigned,
        DocumentStatus.FullySigned,
      ],
      [DocumentStatus.PartiallySigned]: [
        DocumentStatus.FullySigned,
        DocumentStatus.Rejected,
      ],
      [DocumentStatus.FullySigned]: [],
      [DocumentStatus.Rejected]: [],
      [DocumentStatus.Archived]: [],
    };

    const currentStatus = document.status;

    // if (validTransitions[currentStatus]?.includes(newStatus)) {
    document.status = newStatus;

    if (params.transactionHash)
      document.transactionHash = params.transactionHash;

    if (params.contractStorageKey)
      document.contractStorageKey = params.contractStorageKey;

    await document.save();

    return document;
  };

  static getDocumentById = async (documentId: string): Promise<any> => {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException("Invalid document ID format.");
    }

    const document = await UserDocument.findById(documentId);
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
      authorizedSigners,
      transactionHash,
      contractStorageKey,
    } = document;

    const authorizedSignersHash = authorizedSigners?.map((signer: string) => {
      return (
        "0x" +
        crypto
          .createHash("sha256")
          .update(hash + signer)
          .digest("hex")
      );
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
      authorizedSigners,
      authorizedSignersHash,
      transactionHash,
      contractStorageKey,
    };
  };

  static updateAuthorizedSigners = async (
    documentId: string,
    authorizedSigners: string[]
  ): Promise<any> => {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException("Invalid document ID format.");
    }

    if (!Array.isArray(authorizedSigners) || authorizedSigners.length === 0) {
      throw new HttpException(400, "Invalid authorizedSigners list or empty.");
    }

    const document = await UserDocument.findById(documentId);
    if (!document) {
      throw new NotFoundException("Document not found");
    }

    document.authorizedSigners = authorizedSigners;

    const authorizedSignersHash = authorizedSigners.map((signer) => {
      return (
        "0x" +
        crypto
          .createHash("sha256")
          .update(document.hash + signer)
          .digest("hex")
      );
    });

    await document.save();

    return authorizedSignersHash;
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

    const filePath = path.join("storage", filename);
    fs.writeFileSync(filePath, req.file.buffer);

    const expirationTime = new Date(Date.now() + 20 * (24 * 60 * 60 * 1000));

    const originalFilename = Buffer.from(
      req.file.originalname,
      "latin1"
    ).toString("utf8");

    const newDocument = new UserDocument({
      hash: fileHash,
      name: originalFilename,
      size: req.file.size,
      extension: ext,
      authorizedSigners: req.body.authorizedSigners || [],
      expirationTime,
      owner: req.user.sub,
    });

    await newDocument.save();

    return newDocument;
  };
}
