import { Buffer } from "buffer";
import { decode, encodeForSigning } from "ripple-binary-codec";
import { verify } from "xrpl-keypairs";
import { deriveAddress } from "xrpl";

export interface OffchainVerifyResult {
    valid: boolean;
    documentHash?: string;
    rAddress?: string;
    signingPubKey?: string;
    reason?: string;
}

export class SignatureService {
    public static async verifyOffchainSignature(signatureHex: string): Promise<OffchainVerifyResult> {
        try {
            if (!/^[0-9a-fA-F]+$/.test(signatureHex)) {
                return { valid: false, reason: "Signature must be a valid hex string" };
            }

            // Decode and trim trailing null bytes if present
            const sigBuf = Buffer.from(String(signatureHex), "hex");
            const trimmed = this.trimTrailingNulls(sigBuf);
            const hex = trimmed.buf.toString("hex");

            // decode the serialized transaction (hex) into object
            const decoded: any = decode(hex);

            const signingPubKey: string | undefined = decoded.SigningPubKey;
            const txnSignature: string | undefined = decoded.TxnSignature;

            if (!signingPubKey || !txnSignature) {
                return { valid: false, reason: "Missing SigningPubKey or TxnSignature" };
            }

            // Derive account address from public key (works for ed25519/secp256k1 formats supported by xrpl lib)
            const rAddress = deriveAddress(signingPubKey);

            // Build the signing blob correctly using encodeForSigning
            // encodeForSigning will produce the exact hex payload that was signed
            const signingBlobHex: string = encodeForSigning(decoded);

            // Ensure signature and pubkey are normalized hex strings (no 0x prefix)
            const sigHex = txnSignature.startsWith("0x") ? txnSignature.slice(2) : txnSignature;
            const pubHex = signingPubKey.startsWith("0x") ? signingPubKey.slice(2) : signingPubKey;

            // Verify signature: message = signingBlobHex, signature = sigHex, publicKey = pubHex
            const isValid = verify(signingBlobHex, sigHex, pubHex);

            if (!isValid) {
                return { valid: false, reason: "Invalid signature for payload" };
            }

            // Extract memo (document hash) if present
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