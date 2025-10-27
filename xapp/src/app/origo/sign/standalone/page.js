"use client";

import PageLoading from "@/components/PageLoader";
import Dropzone from "@/components/UI/Dropzone";
import { AppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import * as forge from "node-forge";
import {
    PDFDocument,
    rgb
} from "pdf-lib";
import QRCode from "qrcode";
import { useCallback, useContext, useEffect, useState } from "react";

const bufferToHex = (buffer) =>
    Array.prototype.map
        .call(new Uint8Array(buffer), (x) => ("00" + x.toString(16)).slice(-2))
        .join("");

const u8ToLatin1 = (u8) => {
    const CHUNK = 0x8000;
    let res = "";
    for (let i = 0; i < u8.length; i += CHUNK) {
        res += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + CHUNK)));
    }
    return res;
};
const latin1ToU8 = (str) => {
    const u8 = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) u8[i] = str.charCodeAt(i);
    return u8;
};
const uint8ToBinaryString = (u8) => u8ToLatin1(u8);

/**
 * Creates a PKCS#7 detached signature from the SHA-256 digest of the provided data.
 * @param {Uint8Array} pdfBytesForDigestU8 - Data to be signed.
 * @param {ArrayBuffer} pfxArrayBuffer - PFX certificate as ArrayBuffer.
 * @param {string} passphrase - Passphrase for the PFX.
 * @returns {Uint8Array} - PKCS#7 detached signature bytes.
 */
async function createPkcs7DetachedFromDigest(pdfBytesForDigestU8, pfxArrayBuffer, passphrase) {
    const hashBuf = await crypto.subtle.digest("SHA-256", pdfBytesForDigestU8);
    const hashU8 = new Uint8Array(hashBuf);
    const hashBinary = uint8ToBinaryString(hashU8);

    const pfxDerBinary = u8ToLatin1(new Uint8Array(pfxArrayBuffer));
    const pfxAsn1 = forge.asn1.fromDer(pfxDerBinary);
    const p12 = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, passphrase || "");

    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
        forge.pki.oids.pkcs8ShroudedKeyBag
    ];
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];

    if (!keyBags || keyBags.length === 0) throw new Error("Chave privada não encontrada no PFX.");
    if (!certBags || certBags.length === 0) throw new Error("Certificado não encontrado no PFX.");

    const privateKey = keyBags[0].key;
    const certificate = certBags[0].cert;

    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(uint8ToBinaryString(pdfBytesForDigestU8));
    p7.addCertificate(certificate);

    p7.addSigner({
        key: privateKey,
        certificate: certificate,
        digestAlgorithm: forge.pki.oids.sha256,
        authenticatedAttributes: [
            { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
            { type: forge.pki.oids.messageDigest, value: hashBinary },
            { type: forge.pki.oids.signingTime, value: new Date() },
        ],
    });

    p7.sign({ detached: true });

    const raw = forge.asn1.toDer(p7.toAsn1()).getBytes();
    const sigU8 = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) sigU8[i] = raw.charCodeAt(i);
    return sigU8;
}


/**
 * Appends a signature placeholder block to the end of the PDF.
 * Returns the new PDF Uint8Array and positions for ByteRange and Contents.
 * @param {Uint8Array} pdfU8 - Original PDF bytes.
 * @param {number} placeholderSizeBytes - Size of the signature placeholder in bytes.
 * @param {string} reason - Reason for signing.
 * @returns {Object} - { newPdfU8, contentsHexStart, contentsHexEnd, byteRangePos, numWidth, hexPlaceholderLen }
 */
function appendSignaturePlaceholder(pdfU8, placeholderSizeBytes = 8192, reason = "Document signed") {
    const pdfStr = u8ToLatin1(pdfU8);
    const numWidth = 10;
    const numPlaceholder = "0".repeat(numWidth);
    const hexPlaceholder = "0".repeat(placeholderSizeBytes * 2);

    const block =
        "\n%--sig-block-start--\n" +
        `/ByteRange [${numPlaceholder} ${numPlaceholder} ${numPlaceholder} ${numPlaceholder}]\n` +
        `/Contents <${hexPlaceholder}>\n` +
        `%--sig-block-end--\n`;

    const newPdfStr = pdfStr + block;
    const newPdfU8 = latin1ToU8(newPdfStr);

    const blockStart = pdfStr.length;
    const byteRangePos = newPdfStr.indexOf("/ByteRange [", blockStart);
    const contentsAngleOpen = newPdfStr.indexOf("<", byteRangePos);
    const contentsHexStart = contentsAngleOpen + 1;
    const contentsHexEnd = contentsHexStart + hexPlaceholder.length;

    return {
        newPdfU8,
        contentsHexStart,
        contentsHexEnd,
        byteRangePos,
        numWidth,
        hexPlaceholderLen: hexPlaceholder.length,
    };
}

/**
 * Injects the actual ByteRange and signature into the PDF.
 * @param {Uint8Array} pdfU8 - PDF bytes with placeholder.
 * @param {number} byteRangePos - Position of ByteRange in the PDF string.
 * @param {number} contentsHexStart - Start position of Contents hex in the PDF string.
 * @param {number} contentsHexEnd - End position of Contents hex in the PDF string.
 * @param {number} numWidth - Width of the numbers in ByteRange.
 * @param {string} signatureHex - Hexadecimal string of the signature to inject.
 * @returns {Uint8Array} - Updated PDF bytes with injected ByteRange and signature.
 */
function injectByteRangeAndSignature(pdfU8, byteRangePos, contentsHexStart, contentsHexEnd, numWidth, signatureHex) {
    let pdfStr = u8ToLatin1(pdfU8);

    const offset1 = 0;
    const posOfOpeningBracket = contentsHexStart - 1;
    const length1 = posOfOpeningBracket;
    const posOfClosingBracket = contentsHexEnd;
    const offset2 = posOfClosingBracket + 1;
    const length2 = pdfStr.length - offset2;

    const pad = (v) => {
        const s = String(v);
        if (s.length > numWidth) return s;
        return s.padStart(numWidth, "0");
    };

    const brStart = byteRangePos;
    const brEnd = pdfStr.indexOf("]", brStart);
    if (brEnd === -1) throw new Error("ByteRange ']' not found when injecting.");

    const newByteRange = `/ByteRange [${pad(offset1)} ${pad(length1)} ${pad(offset2)} ${pad(length2)}]`;
    const oldSegment = pdfStr.substring(brStart, brEnd + 1);
    if (newByteRange.length !== oldSegment.length) {
        if (newByteRange.length < oldSegment.length) {
            const diff = oldSegment.length - newByteRange.length;
            const padLeft = Math.floor(diff / 2);
            const padRight = diff - padLeft;
            const padded = " ".repeat(padLeft) + newByteRange + " ".repeat(padRight);
            pdfStr = pdfStr.slice(0, brStart) + padded + pdfStr.slice(brEnd + 1);
        } else {
            throw new Error("Não foi possível injetar ByteRange: novo segmento maior que o placeholder.");
        }
    } else {
        pdfStr = pdfStr.slice(0, brStart) + newByteRange + pdfStr.slice(brEnd + 1);
    }

    const hexStartIdx = contentsHexStart;
    const hexEndIdx = contentsHexEnd;
    if (signatureHex.length > hexEndIdx - hexStartIdx) {
        throw new Error("Assinatura maior que espaço reservado. Aumente placeholderSize.");
    }
    const paddedSignatureHex = signatureHex + "0".repeat((hexEndIdx - hexStartIdx) - signatureHex.length);
    pdfStr = pdfStr.slice(0, hexStartIdx) + paddedSignatureHex + pdfStr.slice(hexEndIdx);

    return latin1ToU8(pdfStr);
}

/**
 * Signs the PDF using byte range method.
 * @param {Uint8Array} pdfU8 - PDF bytes to sign.
 * @param {number} contentsHexStart - Start position of Contents hex in the PDF string.
 * @param {number} contentsHexEnd - End position of Contents hex in the PDF string.
 * @param {ArrayBuffer} pfxArrayBuffer - PFX certificate as ArrayBuffer.
 * @param {string} passphrase - Passphrase for the PFX.
 * @returns {Uint8Array} - Signature bytes.
 */
async function signPdfWithByteRange(pdfU8, contentsHexStart, contentsHexEnd, pfxArrayBuffer, passphrase) {
    const posOfOpeningBracket = contentsHexStart - 1;
    const posOfClosingBracket = contentsHexEnd;
    const offset1 = 0;
    const length1 = posOfOpeningBracket;
    const offset2 = posOfClosingBracket + 1;
    const length2 = pdfU8.length - offset2;

    const part1 = pdfU8.subarray(offset1, offset1 + length1);
    const part2 = pdfU8.subarray(offset2, offset2 + length2);

    const concat = new Uint8Array(part1.length + part2.length);
    concat.set(part1, 0);
    concat.set(part2, part1.length);

    const signatureU8 = await createPkcs7DetachedFromDigest(concat, pfxArrayBuffer, passphrase);
    return signatureU8;
}

/**
 * Main Page Component for Standalone Signing
 * @return {JSX.Element}
 */
export default function Page() {
    const [pdfFile, setPdfFile] = useState(null);
    const [pfxFile, setPfxFile] = useState(null);
    const [passphrase, setPassphrase] = useState("");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);

    const { account, isLoading } = useContext(AppContext);

    const { push } = useRouter();

    useEffect(() => {
        if (!isLoading && !account) {
            push("/login?redirect=/origo/sign/standalone");
        }
    }, [account, isLoading]);

    const handleDropzoneFile = useCallback(async (file) => {
        if (!file) {
            setPdfFile(null);
            return;
        }
        if (file.type !== "application/pdf") {
            alert("Please select a valid PDF file.");
            return;
        }
        setPdfFile(file);
        setMessage(null);
    }, []);

    const handlePfxChange = (ev) => {
        const f = ev.target.files?.[0] || null;
        setPfxFile(f);
    };

    const handleSignAndGenerate = async () => {
        setMessage(null);
        if (!pdfFile) {
            alert("Please select a PDF file from the dropzone.");
            return;
        }
        if (!pfxFile) {
            alert("Please select the PFX file (.pfx / .p12).");
            return;
        }

        setBusy(true);

        try {
            const pdfArrayBuffer = await pdfFile.arrayBuffer();
            const pdfBytes = new Uint8Array(pdfArrayBuffer);
            const pdfDoc = await PDFDocument.load(pdfBytes);

            const origin = process.env.NEXT_PUBLIC_APP_URL;
            const fullValidationUrl = `${origin}origo/${encodeURIComponent(account)}`;
            const qrDataUrl = await QRCode.toDataURL(fullValidationUrl, { margin: 1, scale: 6 });

            const logoUrl = `${origin}app-logo-horizontal-dark.png`;
            const logoResp = await fetch(logoUrl);
            const logoBuf = await logoResp.arrayBuffer();
            const logoPng = await pdfDoc.embedPng(logoBuf);
            const logoWidth = 200;
            const logoHeight = 69;

            const qrPage = pdfDoc.addPage([595, 842]);

            qrPage.drawImage(logoPng, { x: 50, y: 700, width: logoWidth, height: logoHeight });
            qrPage.drawText("Xahau Docproof Origo", { x: 50, y: 620, size: 20, color: rgb(0, 0.2, 0.6) });
            qrPage.drawText("Scan the QR code to validate this document on the Xahau Docproof.", { x: 50, y: 590, size: 12 });
            qrPage.drawText(`Validation URL: ${fullValidationUrl}`, { x: 50, y: 572, size: 10 });
            const now = new Date();
            qrPage.drawText(`Signed at: ${now.toISOString()}`, { x: 50, y: 540, size: 10 });
            if (account) qrPage.drawText(`Xahau wallet: ${account}`, { x: 50, y: 520, size: 10 });

            const qrPngImage = await pdfDoc.embedPng(qrDataUrl);
            const qrWidth = 120;
            const qrHeight = 120;
            qrPage.drawImage(qrPngImage, { x: 50, y: 80, width: qrWidth, height: qrHeight });
            qrPage.drawText("Scan to verify", { x: 50, y: 70, size: 10, color: rgb(0, 0.2, 0.6) });

            const pdfWithFieldBytes = await pdfDoc.save({ useObjectStreams: false });
            const pdfWithFieldU8 = new Uint8Array(pdfWithFieldBytes);

            const placeholderSize = 8192;
            const appended = appendSignaturePlaceholder(pdfWithFieldU8, placeholderSize, "Document signed via Docproof");
            const pdfForSign = appended.newPdfU8;
            const byteRangePos = appended.byteRangePos;
            const contentsHexStart = appended.contentsHexStart;
            const contentsHexEnd = appended.contentsHexEnd;
            const numWidth = appended.numWidth;

            const pfxArrayBuffer = await pfxFile.arrayBuffer();
            const signatureU8 = await signPdfWithByteRange(pdfForSign, contentsHexStart, contentsHexEnd, pfxArrayBuffer, passphrase);

            const signatureHex = bufferToHex(signatureU8);

            const finalPdfU8 = injectByteRangeAndSignature(pdfForSign, byteRangePos, contentsHexStart, contentsHexEnd, numWidth, signatureHex);

            const blob = new Blob([finalPdfU8], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "document-signed.pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            const digestHex = await (async () => {
                const hash = await crypto.subtle.digest("SHA-256", finalPdfU8);
                return bufferToHex(hash);
            })();

            setMessage({
                status: "ok",
                text: `PDF generated successfully: ${digestHex}`,
            });
        } catch (err) {
            console.error("Error signing/generating PDF:", err);
            setMessage({ status: "error", text: err.message || String(err) });
            alert("Error: " + (err.message || String(err)));
        } finally {
            setBusy(false);
        }
    };

    if (isLoading) return <PageLoading />;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-3">Origo &ndash; Sign PDF (Standalone)</h1>
            <p className="text-sm text-slate-600 mb-6">
                Generate a PDF with a validation page (QR), insert a signature field (AcroForm) for readers to show the field,
                and embed the PKCS#7 signature in an appended textual block (robust method for /ByteRange and /Contents injection).
            </p>

            <div className="space-y-6">
                <div className="p-6 bg-white border rounded-lg shadow-sm">
                    <h2 className="font-semibold mb-2">1) Choose the document (PDF)</h2>
                    <p className="text-xs text-slate-500 mb-3">Drag and drop or select a PDF. We don’t store anything.</p>
                    <Dropzone onFileChange={handleDropzoneFile} />
                    {pdfFile && <div className="mt-3 text-sm">Selected file: <strong>{pdfFile.name}</strong></div>}
                </div>

                <div className="p-6 bg-white border rounded-lg shadow-sm">
                    <h2 className="font-semibold mb-2">2) Choose the PFX / Passphrase</h2>
                    <div className="flex flex-col sm:flex-row gap-3 items-start">
                        <input
                            type="file"
                            accept=".p12,.pfx,application/x-pkcs12"
                            onChange={handlePfxChange}
                            className="file-input file-input-bordered file-input-sm w-full max-w-xs"
                        />
                        <input
                            type="password"
                            placeholder="Passphrase for PFX (if any)"
                            value={passphrase}
                            onChange={(e) => setPassphrase(e.target.value)}
                            className="input input-bordered input-sm w-full max-w-xs"
                        />
                    </div>
                    {pfxFile && <div className="mt-3 text-sm">PFX selecionado: <strong>{pfxFile.name}</strong></div>}
                </div>

                <div className="p-6 bg-white border rounded-lg shadow-sm">
                    <h2 className="font-semibold mb-2">3) Xahau Address for Validation</h2>
                    <input
                        placeholder="Enter the Xahau wallet address to be included in the PDF"
                        value={account}
                        disabled
                        readOnly
                        className="input input-bordered w-full"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className={`btn btn-primary ${busy ? "loading" : ""}`}
                        onClick={handleSignAndGenerate}
                        disabled={busy}
                    >
                        {busy ? "Generating..." : "Generate PDF (embedded signature)"}
                    </button>

                    <button
                        className="btn btn-ghost"
                        onClick={() => {
                            setPdfFile(null);
                            setPfxFile(null);
                            setPassphrase("");
                            setMessage(null);
                        }}
                    >
                        Clear
                    </button>
                </div>

                {message && (
                    <div className={`mt-4 p-4 rounded ${message.status === "ok" ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                        <div className="text-sm">
                            {message.text}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}