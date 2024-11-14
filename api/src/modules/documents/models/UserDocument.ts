import mongoose, { Schema, Document } from 'mongoose';
import { DocumentStatus } from '@/enums/DocumentStatus';

export interface ISigner extends Document {
  email: string;
  signed: boolean;
  signedAt: Date;
  wallet: string;
  txHash: string;
}

export interface IUserDocument extends Document {
  name: string;
  extension: string;
  hash: string;
  size: number;
  createdAt: Date;
  updatedAt?: Date;
  signers: ISigner[];
  expirationTime: Date;
  owner: string;
  userToken: string;
  status: DocumentStatus;
}

const SignerSchema: Schema = new Schema({
  email: { type: String, required: true },
  signed: { type: Boolean, required: false, default: false },
  notifiedAt: { type: Date, required: false },
  signedAt: { type: Date, required: false },
  wallet: { type: String, required: false },
  txHash: { type: String, required: false },
});

const UserDocumentSchema: Schema = new Schema({
  name: { type: String, required: true },
  extension: { type: String, required: true },
  hash: { type: String, required: true },
  size: { type: Number, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: false },
  signers: { type: [SignerSchema], required: false },
  expirationTime: { type: Date, required: true },
  owner: { type: String, required: true },
  userToken: { type: String, required: true },
  status: {
    type: String,
    enum: Object.values(DocumentStatus), // Utilizando o enum
    required: false,
    default: DocumentStatus.Pending
  }
});

UserDocumentSchema.pre<IUserDocument>('save', function (next) {
  this.updatedAt = new Date(); // Atualiza o campo updatedAt
  next();
});

const UserDocument = mongoose.model<IUserDocument>('UserDocument', UserDocumentSchema);
export const Signer = mongoose.model<ISigner>('Signer', SignerSchema);

export default UserDocument;
