import { parse as parseToml } from "@iarna/toml";
import axios from "axios";
import { Buffer } from "buffer";
import crypto from "crypto";
import { Client, deriveAddress } from "xrpl";
import { decode, encodeForSigning } from 'ripple-binary-codec';
import { verify } from "ripple-keypairs";

export type VerifyPayload = {
    sha256: string;
    signature?: string | null;
    rAddress: string;
    id?: string | null;
};

export type VerifyResultBody =
    | { valid: true; message?: string; details?: any }
    | { valid: false; reason?: string; details?: any }
    | { message: string; error?: string };

export type VerifyResult = {
    status: number;
    body: VerifyResultBody;
};

export type NormalizeError = { step: string; error: string };
export type NormalizeResult = {
    ok: boolean;
    spki?: Buffer;
    method?: string;
    fingerprint?: string;
    errors: NormalizeError[];
    notes?: string[];
};

type PubKeyInfo = { kind: "pem"; pem: string } | { kind: "unknown" };

export class SignatureService {
    /**
     * WebSocket URL for connecting to the Xahau ledger.
     */
    private readonly xahauWsUrl = "wss://xahau.network";

    /**
     * Convert hex string to Buffer strictly.
     * Returns null on invalid input (non-hex, odd length, empty).
     * Valid input: optional 0x prefix, even-length hex digits only.
     * @return Buffer or null.
     */
    private hexToBufferStrict(hex: string): Buffer | null {
        if (!hex) return null;
        const s = String(hex).trim().replace(/\s+/g, "");
        const cleaned = s.startsWith("0x") ? s.slice(2) : s;
        if (cleaned.length === 0) return null;
        if (cleaned.length % 2 !== 0) return null;
        if (!/^[0-9a-fA-F]+$/.test(cleaned)) return null;
        return Buffer.from(cleaned, "hex");
    }

    /**
     * Trim trailing 0x00 bytes which sometimes appear due to extraction padding.
     * Returns an object with the trimmed buffer and how many bytes were removed.
     */
    private trimTrailingNulls(buf: Buffer): { buf: Buffer; trimmed: number } {
        let end = buf.length;
        while (end > 0 && buf[end - 1] === 0x00) end--;
        if (end === buf.length) return { buf, trimmed: 0 };
        return { buf: buf.slice(0, end), trimmed: buf.length - end };
    }

    /**
     * Calculate SHA-256 fingerprint (hex) of given SPKI DER Buffer.
     * @return hex string
     */
    public spkiFingerprintHex(spki: Buffer): string {
        return crypto.createHash("sha256").update(spki).digest("hex");
    }

    /**
     * Try to normalize a DER Buffer into an SPKI DER Buffer.
     * This function tries several formats in a safe order:
     *  - SPKI DER
     *  - PKCS#1 (RSA public key)
     *  - PKCS#8 (private key structure containing public key) - sometimes relevant
     *  - X.509 certificate DER (using X509Certificate)
     *  - Retry the above on a trimmed buffer (remove trailing 0x00)
     *  - Finally, try PKCS#7 parsing with node-forge (optional)
     *
     * Returns SPKI DER Buffer when successful, otherwise null.
     */
    private tryNormalizeBufferToSpkiDer(buf: Buffer, errors: NormalizeError[], notes: string[] = []): Buffer | null {
        const tryCreatePublicKey = (b: Buffer, format: "spki" | "pkcs1" | "pkcs8") => {
            try {
                const keyObj = crypto.createPublicKey({ key: b, format: "der", type: format } as any);
                const der = keyObj.export({ type: "spki", format: "der" }) as Buffer;
                return Buffer.from(der);
            } catch (err: any) {
                errors.push({ step: `${format}-der`, error: String(err?.message ?? err) });
                return null;
            }
        };

        const spki = tryCreatePublicKey(buf, "spki");
        if (spki) {
            notes.push("imported-as-spki");
            return spki;
        }

        const pkcs1 = tryCreatePublicKey(buf, "pkcs1");
        if (pkcs1) {
            notes.push("imported-as-pkcs1");
            return pkcs1;
        }

        const pkcs8 = tryCreatePublicKey(buf, "pkcs8");
        if (pkcs8) {
            notes.push("imported-as-pkcs8");
            return pkcs8;
        }

        try {
            // runtime check
            // @ts-ignore
            const X509Certificate = (crypto as any).X509Certificate;
            if (X509Certificate) {
                try {
                    // @ts-ignore
                    const cert = new X509Certificate(buf);
                    const pub = cert.publicKey;
                    if (pub) {
                        const der = pub.export({ type: "spki", format: "der" }) as Buffer;
                        notes.push("extracted-from-x509-cert");
                        return Buffer.from(der);
                    }
                } catch (err: any) {
                    errors.push({ step: "x509cert", error: String(err?.message ?? err) });
                }
            } else {
                errors.push({ step: "x509cert", error: "X509Certificate not available in Node runtime" });
            }
        } catch (err: any) {
            errors.push({ step: "x509cert", error: String(err?.message ?? err) });
        }

        const trimmedResult = this.trimTrailingNulls(buf);
        if (trimmedResult.trimmed > 0) {
            notes.push(`trimmed-trailing-zero-bytes=${trimmedResult.trimmed}`);
            const b = trimmedResult.buf;

            const spkiT = tryCreatePublicKey(b, "spki");
            if (spkiT) {
                notes.push("imported-as-spki-after-trim");
                return spkiT;
            }

            const pkcs1T = tryCreatePublicKey(b, "pkcs1");
            if (pkcs1T) {
                notes.push("imported-as-pkcs1-after-trim");
                return pkcs1T;
            }

            const pkcs8T = tryCreatePublicKey(b, "pkcs8");
            if (pkcs8T) {
                notes.push("imported-as-pkcs8-after-trim");
                return pkcs8T;
            }

            try {
                // @ts-ignore
                const X509Certificate = (crypto as any).X509Certificate;
                if (X509Certificate) {
                    try {
                        // @ts-ignore
                        const cert = new X509Certificate(b);
                        const pub = cert.publicKey;
                        if (pub) {
                            const der = pub.export({ type: "spki", format: "der" }) as Buffer;
                            notes.push("extracted-from-x509-cert-after-trim");
                            return Buffer.from(der);
                        }
                    } catch (err: any) {
                        errors.push({ step: "x509-after-trim", error: String(err?.message ?? err) });
                    }
                } else {
                    errors.push({ step: "x509-after-trim", error: "X509Certificate not available in Node runtime" });
                }
            } catch (err: any) {
                errors.push({ step: "x509-after-trim", error: String(err?.message ?? err) });
            }
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const forge = require("node-forge");
            const tryParsePkcs7 = (b: Buffer): Buffer | null => {
                try {
                    const binary = b.toString("binary"); // forge expects binary string
                    const asn1 = forge.asn1.fromDer(binary);
                    const p7 = forge.pkcs7.messageFromAsn1(asn1);
                    if (p7 && Array.isArray(p7.certificates) && p7.certificates.length > 0) {
                        const cert = p7.certificates[0];
                        const pem = forge.pki.certificateToPem(cert);
                        const keyObj = crypto.createPublicKey(pem);
                        const der = keyObj.export({ type: "spki", format: "der" }) as Buffer;
                        return Buffer.from(der);
                    }
                } catch (err) {
                    // parsing failed - return null quietly; caller will have errors
                }
                return null;
            };

            const pkcs7Original = tryParsePkcs7(buf);
            if (pkcs7Original) {
                notes.push("extracted-from-pkcs7-via-forge-original");
                return pkcs7Original;
            }

            if (trimmedResult.trimmed > 0) {
                const pkcs7Trimmed = tryParsePkcs7(trimmedResult.buf);
                if (pkcs7Trimmed) {
                    notes.push("extracted-from-pkcs7-via-forge-trimmed");
                    return pkcs7Trimmed;
                }
            }
            errors.push({ step: "pkcs7-parse", error: "node-forge parse attempted but no cert extracted" });
        } catch (err: any) {
            errors.push({ step: "pkcs7-require", error: "node-forge not installed or require failed" });
        }

        return null;
    }

    public normalizeHexDerToSpkiDer(hexOrBuffer: string | Buffer): Buffer | null {
        const errors: NormalizeError[] = [];
        const notes: string[] = [];

        try {
            let buf: Buffer;
            if (Buffer.isBuffer(hexOrBuffer)) {
                buf = hexOrBuffer;
            } else if (typeof hexOrBuffer === "string") {
                const maybeBuf = this.hexToBufferStrict(hexOrBuffer);
                if (!maybeBuf) return null;
                buf = maybeBuf;
            } else {
                return null;
            }

            const spki = this.tryNormalizeBufferToSpkiDer(buf, errors, notes);
            return spki ?? null;
        } catch {
            return null;
        }
    }

    /**
     * Normalize a domain public key (PEM or hex DER) into SPKI DER Buffer.
     * Returns Buffer or null on failure.
     * @return Buffer or null.
     */
    public normalizeDomainPubKeyToSpkiDer(domainPubKey: string): Buffer | null {
        if (!domainPubKey) return null;
        const s = String(domainPubKey).trim();

        if (/-----BEGIN [A-Z ]+-----/.test(s)) {
            try {
                const keyObj = crypto.createPublicKey(s);
                const der = keyObj.export({ type: "spki", format: "der" }) as Buffer;
                return Buffer.from(der);
            } catch {
                // fallthrough to hex
            }
        }

        if (/^(0x)?[0-9a-fA-F]+$/.test(s)) {
            return this.normalizeHexDerToSpkiDer(s);
        }

        return null;
    }

    /**
     * Compare domain pubkey (PEM or hex) with signature blob given as hex DER.
     * Returns { ok, details } with diagnostics when normalization fails.
     */
    public compareDomainWithSignatureHex(domainPubKey: string, signatureHex: string) {
        const details: any = { steps: [] };

        const domainSpki = this.normalizeDomainPubKeyToSpkiDer(domainPubKey);
        if (!domainSpki) {
            details.steps.push("failed-to-normalize-domain-pubkey-to-spki");
            return { ok: false, details };
        }
        details.domainSpkiFingerprint = this.spkiFingerprintHex(domainSpki);

        const sigSpki = this.normalizeHexDerToSpkiDer(signatureHex);
        if (!sigSpki) {
            details.steps.push("failed-to-normalize-signature-hex-to-spki");
            details.diagnostic = this.diagnoseAndNormalizeSignatureHex(signatureHex);
            return { ok: false, details };
        }
        details.signatureSpkiFingerprint = this.spkiFingerprintHex(sigSpki);

        const ok = domainSpki.equals(sigSpki);
        details.steps.push(ok ? "spki-bytes-equal" : "spki-bytes-differ");
        return { ok, details };
    }

    public diagnoseAndNormalizeSignatureHex(signatureHex: string): NormalizeResult {
        const result: NormalizeResult = { ok: false, errors: [], notes: [] };

        const buf = this.hexToBufferStrict(signatureHex);
        if (!buf) {
            result.errors.push({ step: "hex-parse", error: "Invalid hex (empty, odd length, or non-hex chars)" });
            return result;
        }

        result.notes?.push(`inputLength=${buf.length} bytes, prefix=${buf.slice(0, 6).toString("hex")}`);

        // PEM detection via trying utf8 (rare)
        try {
            const asUtf8 = buf.toString("utf8");
            if (/-----BEGIN [A-Z ]+-----/.test(asUtf8)) {
                try {
                    const keyObj = crypto.createPublicKey(asUtf8);
                    const spki = keyObj.export({ type: "spki", format: "der" }) as Buffer;
                    result.ok = true;
                    result.spki = Buffer.from(spki);
                    result.method = "pem-detected-after-utf8";
                    result.fingerprint = this.spkiFingerprintHex(spki);
                    return result;
                } catch (err: any) {
                    result.errors.push({ step: "pem-after-utf8", error: String(err?.message ?? err) });
                }
            }
        } catch (err: any) {
            result.errors.push({ step: "utf8-check", error: String(err?.message ?? err) });
        }

        // Try normalization heuristics
        const spki = this.tryNormalizeBufferToSpkiDer(buf, result.errors, result.notes!);
        if (spki) {
            result.ok = true;
            result.spki = spki;
            result.method = "normalized-from-der";
            result.fingerprint = this.spkiFingerprintHex(spki);
            return result;
        }

        // Heuristics notes
        result.notes?.push(`final-heuristic: raw-length=${buf.length}`);
        if (buf.length === 64) result.notes?.push("length 64 -> likely raw ECDSA signature (r||s), not a certificate");
        if (buf.length < 100) result.notes?.push("blob small (<100 bytes) -> unlikely cert/PKCS7; maybe raw sig or small SPKI");
        if (buf.length > 200 && buf.length < 4000) result.notes?.push("blob size looks like cert/PKCS7; ensure full blob transmitted");

        result.errors.push({ step: "normalize-failed", error: "All normalization attempts failed (SPKI/PKCS1/PKCS8/X509/PKCS7)" });
        return result;
    }

    /**
     * Top-level verifier which will decide whether to verify as Xumm or Standalone.
     * Strategy: validate base fields, then attempt to decode as Xumm.
     * If decode succeeds and contains SigningPubKey & TxnSignature -> Xumm path.
     * Otherwise -> fallback to Standalone path.
     */
    public async verifyPayload(payload: VerifyPayload): Promise<VerifyResult> {
        const baseValidation = this.ensureBaseFields(payload);
        if (baseValidation) return baseValidation;

        const sigHex = String(payload.signature);
        let sigBuf: Buffer;
        try {
            sigBuf = Buffer.from(sigHex, "hex");
        } catch (err: any) {
            return this.verifyStandalonePayload(payload);
        }

        const { buf: trimmedBuf } = this.trimTrailingNulls(sigBuf);
        try {
            const decoded = decode(trimmedBuf.toString("hex"));
            if (decoded?.SigningPubKey && decoded?.TxnSignature) {
                return this.verifyPayloadXumm(payload, decoded);
            } else {
                return this.verifyStandalonePayload(payload);
            }
        } catch (_err) {
            return this.verifyStandalonePayload(payload);
        }
    }

    /**
     * Explicit Xumm verification.
     * If decodedParam is provided we reuse it (avoid double-decoding).
     */
    public async verifyPayloadXumm(payload: VerifyPayload, decodedParam?: any): Promise<VerifyResult> {
        try {
            const { sha256, signature, rAddress, id } = payload;

            const baseValidation = this.ensureBaseFields(payload);
            if (baseValidation) return baseValidation;

            if (!/^(0x)?[0-9a-fA-F]{64}$/.test(String(sha256))) {
                return { status: 400, body: { message: "sha256 must be a 32-byte hex string" } };
            }

            let decoded: any = decodedParam;
            try {
                if (!decoded) {
                    const sigBuf = Buffer.from(String(signature), "hex");
                    const trimmed = this.trimTrailingNulls(sigBuf);
                    decoded = decode(trimmed.buf.toString("hex"));
                }
            } catch (err) {
                return { status: 400, body: { valid: false, reason: "Erro ao decodificar assinatura", details: String(err) } };
            }

            const signingPubKey = decoded.SigningPubKey;
            const txnSignature = decoded.TxnSignature;

            if (!signingPubKey || !txnSignature) {
                return { status: 400, body: { valid: false, reason: "Campos SigningPubKey ou TxnSignature ausentes" } };
            }

            const derivedAddress = deriveAddress(signingPubKey);
            if (derivedAddress !== rAddress) {
                return {
                    status: 200,
                    body: {
                        valid: false,
                        reason: "Assinatura não corresponde ao endereço informado",
                        details: { derivedAddress, expected: rAddress },
                    },
                };
            }

            const txForSigning = { ...decoded };

            console.log('Sha256', sha256);
            console.log('Memodata', txForSigning.Memos[0].Memo.MemoData);

            txForSigning.Sequence = Number(decoded.Sequence);
            if (decoded.LastLedgerSequence !== undefined) txForSigning.LastLedgerSequence = Number(decoded.LastLedgerSequence);
            if (decoded.NetworkID !== undefined) txForSigning.NetworkID = Number(decoded.NetworkID);
            txForSigning.Fee = String(decoded.Fee);

            const blob = encodeForSigning(txForSigning);
            const isValid: boolean = verify(blob, txnSignature, signingPubKey);

            if (!isValid) {
                return { status: 200, body: { valid: false, reason: "Invalid signature for the provided payload" } };
            }

            if (txForSigning.Memos && Array.isArray(txForSigning.Memos) && txForSigning.Memos.length > 0) {
                const memoDataHex = txForSigning.Memos[0].Memo.MemoData;
                if (sha256.toLowerCase() !== memoDataHex.toLowerCase()) {
                    return {
                        status: 200,
                        body: {
                            valid: false,
                            reason: "SHA256 hash does not match MemoData in transaction",
                            details: { expected: sha256, found: memoDataHex },
                        },
                    };
                }
            }

            const domain = await this.getDomainFromLedger(rAddress).catch(() => undefined);

            let domainInfo = null;
            if (domain) {
                const toml = await this.fetchToml(domain).catch(() => null);
                if (toml) {
                    const docproofs = toml?.DOCPROOF ?? [];
                    const found = Array.isArray(docproofs)
                        ? docproofs.find((d: any) => d.address === rAddress && (!id || d.id === id))
                        : null;
                    domainInfo = found ?? null;
                }
            }

            return {
                status: 200,
                body: {
                    valid: true,
                    message: "Valid signature",
                    details: {
                        signingPubKey,
                        derivedAddress,
                        sha256,
                        domain,
                        domainInfo,
                    },
                },
            };
        } catch (err: any) {
            console.error("SignatureService.verifyPayloadXumm error:", err);
            return { status: 500, body: { message: `Internal error: ${String(err?.message ?? err)}` } };
        }
    }

    /**
     * Standalone verification (DOCPROOF public key comparison).
     * This method mirrors your original verifyStandalonePayload but reuses helpers.
     */
    public async verifyStandalonePayload(payload: VerifyPayload): Promise<VerifyResult> {
        try {
            const { sha256, signature, rAddress, id } = payload;

            const baseValidation = this.ensureBaseFields(payload);
            if (baseValidation) return baseValidation;

            if (!/^(0x)?[0-9a-fA-F]{64}$/.test(String(sha256))) {
                return { status: 400, body: { message: "sha256 must be a 32-byte hex string" } };
            }

            let domain: string | undefined;
            try {
                domain = await this.getDomainFromLedger(rAddress);
                if (!domain) {
                    return { status: 500, body: { message: "Unable to resolve domain from ledger" } };
                }
            } catch (err: any) {
                return { status: 500, body: { message: `Ledger error: ${String(err?.message ?? err)}` } };
            }

            const toml = await this.fetchToml(domain).catch((err) => {
                return null;
            });

            if (!toml) {
                return { status: 500, body: { message: "xahau.toml not found on domain" } };
            }

            if (!Array.isArray(toml?.DOCPROOF) || toml.DOCPROOF.length === 0) {
                return { status: 400, body: { message: "No DOCPROOF entries in toml" } };
            }

            const found = this.findDocProofEntry(toml.DOCPROOF, rAddress, id ? String(id) : undefined);

            if (!found) return { status: 404, body: { message: "No matching DOCPROOF entry found" } };
            if (!found.pubkey) return { status: 400, body: { message: "No pubkey in DOCPROOF entry" } };

            const cmp = this.compareDomainWithSignatureHex(found.pubkey, String(signature));
            if (cmp.ok) {
                return { status: 200, body: { valid: true, message: "Public keys match", details: cmp.details } };
            } else {
                return { status: 200, body: { valid: false, reason: "Public keys do not match", details: cmp.details } };
            }
        } catch (err: any) {
            console.error("SignatureService.verifyStandalonePayload error:", err);
            return { status: 500, body: { message: `Internal error: ${String(err?.message ?? err)}` } };
        }
    }

    /**
     * Ensure that the payload contains the required base fields.
     * Returns VerifyResult with 400 status on missing fields, otherwise null.
     * @return VerifyResult | null
     */
    private ensureBaseFields(payload: VerifyPayload): VerifyResult | null {
        if (!payload) return { status: 400, body: { message: "Missing payload" } };
        const { sha256, signature, rAddress } = payload;
        if (!sha256) return { status: 400, body: { message: "Missing sha256 in body" } };
        if (!rAddress) return { status: 400, body: { message: "Missing rAddress in body" } };
        if (!signature) return { status: 400, body: { message: "Missing signature hex in body" } };
        return null;
    }

    /**
     * Fetches the Domain string stored in the account_data.Domain field on ledger.
     * Resolves to domain string (ascii) or throws on ledger errors.
     */
    private async getDomainFromLedger(rAddress: string): Promise<string | undefined> {
        const client = new Client(this.xahauWsUrl);
        (client as any).apiVersion = 1;
        try {
            await client.connect();
            const response = await client.request({ command: "account_info", account: rAddress });
            if (response.result?.account_data?.Domain) {
                const domainHex = response.result.account_data.Domain;
                return Buffer.from(String(domainHex), "hex").toString("ascii");
            } else {
                return undefined;
            }
        } finally {
            try {
                await client.disconnect();
            } catch (_) { }
        }
    }

    /**
     * Fetches and parses xahau.toml from the given domain root.
     * Throws on network or parse issues; caller can catch.
     */
    private async fetchToml(domain: string): Promise<any> {
        const resp = await axios.get(`https://${domain}/.well-known/xahau.toml`, {
            responseType: "text",
            validateStatus: () => true,
        });
        if (!resp || resp.status !== 200) {
            throw new Error(`toml not found (${resp?.status})`);
        }
        return parseToml(resp.data);
    }

    /**
     * Finds a DOCPROOF entry matching the given rAddress and optional id.
     * Returns the entry object or null if not found.
     * @param entries Array of DOCPROOF entries from toml
     * @param rAddress Ripple address to match
     * @param id Optional id to match
     * @return matching entry or null
     */
    private findDocProofEntry(entries: any[], rAddress: string, id?: string | number): any | null {
        for (const docproof of entries) {
            const addrMatch = docproof.address === rAddress;
            const idMatch = id ? docproof.id === id : true;
            if (addrMatch && idMatch) return docproof;
        }
        return null;
    }
}

export default new SignatureService();