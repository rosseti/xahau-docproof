import { Buffer } from "buffer";
import { decode, encodeForSigning } from "ripple-binary-codec";
import { verify } from "xrpl-keypairs";
import { deriveAddress } from "xrpl";

export interface OffchainVerifyResult {
    valid: boolean;
    documentHash?: string;
    rAddress?: string;
    signingPubKey?: string;
    txData?: any;
    reason?: string;
}

export class SignatureService {
    public static async verifyOffchainSignature(signatureHex: string): Promise<OffchainVerifyResult> {
        try {
            if (!/^[0-9a-fA-F]+$/.test(signatureHex)) {
                return { valid: false, reason: "Signature must be a valid hex string" };
            }

            const sigBuf = Buffer.from(String(signatureHex), "hex");
            const trimmed = this.trimTrailingNulls(sigBuf);
            const hex = trimmed.buf.toString("hex");

            const decoded: any = decode(hex);

            const signingPubKey: string | undefined = decoded.SigningPubKey;
            const txnSignature: string | undefined = decoded.TxnSignature;

            if (!signingPubKey || !txnSignature) {
                return { valid: false, reason: "Missing SigningPubKey or TxnSignature" };
            }

            const rAddress = deriveAddress(signingPubKey);

            const signingBlobHex: string = encodeForSigning(decoded);

            const sigHex = txnSignature.startsWith("0x") ? txnSignature.slice(2) : txnSignature;
            const pubHex = signingPubKey.startsWith("0x") ? signingPubKey.slice(2) : signingPubKey;

            const isValid = verify(signingBlobHex, sigHex, pubHex);

            if (!isValid) {
                return { valid: false, reason: "Invalid signature for payload" };
            }

            let documentHash: string | undefined;
            if (decoded.Memos && Array.isArray(decoded.Memos) && decoded.Memos.length > 0) {
                const memoDataHex = decoded.Memos[0].Memo?.MemoData;
                if (memoDataHex) {
                    documentHash = memoDataHex.toLowerCase();
                }
            }

            return {
                valid: true,
                documentHash,
                rAddress,
                signingPubKey,
                txData: decoded,
            };
        } catch (err: any) {
            console.error("verifyOffchainSignature error:", err);
            return { valid: false, reason: `Internal error: ${String(err.message ?? err)}` };
        }
    }

    private static trimTrailingNulls(buf: Buffer): { buf: Buffer; trimmed: number } {
        let end = buf.length;
        while (end > 0 && buf[end - 1] === 0x00) end--;
        if (end === buf.length) return { buf, trimmed: 0 };
        return { buf: buf.slice(0, end), trimmed: buf.length - end };
    }
}