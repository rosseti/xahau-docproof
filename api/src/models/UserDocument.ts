import mongoose, { Schema, Document } from 'mongoose';
import { DocumentStatus } from '@/enums/DocumentStatus';

export interface IUserDocument extends Document {
  name: string;
  extension: string;
  hash: string;
  size: number;
  createdAt: Date;
  updatedAt?: Date;
  authorizedSigners: string[];
  signedSigners: string[];
  expirationTime: Date;
  owner: string;
  contractStorageKey: string;
  status: DocumentStatus;
  transactionHash?: string;
}

const UserDocumentSchema: Schema = new Schema({
  name: { type: String, required: true },
  extension: { type: String, required: true },
  hash: { type: String, required: true },
  size: { type: Number, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: false },
  authorizedSigners: { type: [String], required: false },
  signedSigners: { type: [String], required: false },
  expirationTime: { type: Date, required: true },
  owner: { type: String, required: true },
  contractStorageKey: { type: String, required: false },
  status: {
    type: String,
    enum: Object.values(DocumentStatus), // Utilizando o enum
    required: false,
    default: DocumentStatus.Pending
  },
  transactionHash: { type: String, required: false },
});

UserDocumentSchema.pre<IUserDocument>('save', function (next) {
  this.updatedAt = new Date(); // Atualiza o campo updatedAt
  next();
});

const UserDocument = mongoose.model<IUserDocument>('UserDocument', UserDocumentSchema);

export default UserDocument;
