"use client";


import PageLoading from "@/components/PageLoader";
import Dropzone from "@/components/UI/Dropzone";
import { AppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { useCallback, useContext, useEffect, useState } from "react";

/**
 * Convert a buffer (ArrayBuffer or Uint8Array) to a hex string
 * @param {ArrayBuffer | Uint8Array} buffer - The input buffer
 * @returns {string} - The resulting hex string
 */
const bufferToHex = (buffer) =>
    Array.prototype.map
        .call(new Uint8Array(buffer), (x) => ("00" + x.toString(16)).slice(-2))
        .join("");

/**
 * Convert a Uint8Array to a Latin1 string
 * @param {Uint8Array} u8 - The input Uint8Array
 * @returns {string} - The resulting Latin1 string
 */
const u8ToLatin1 = (u8) => {
    const CHUNK = 0x8000;
    let res = "";
    for (let i = 0; i < u8.length; i += CHUNK) {
        res += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + CHUNK)));
    }
    return res;
};

/**
 * Convert a Latin1 string to Uint8Array
 * @param {string} str - The Latin1 encoded string
 * @returns {Uint8Array} - The resulting Uint8Array
 */
const latin1ToU8 = (str) => {
    const u8 = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) u8[i] = str.charCodeAt(i);
    return u8;
};

/**
 * Append a signature placeholder to a PDF Uint8Array
 * @param {Uint8Array} pdfU8 - The original PDF as a Uint8Array
 * @param {number} placeholderSizeBytes - Size in bytes of the signature placeholder
 * @param {string} reason - Reason for signing to include in the signature block
 * @returns {object} - Object containing the new PDF Uint8Array and positions for signature injection
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
 * Inject ByteRange and signature into the PDF Uint8Array
 */
function injectByteRangeAndSignature(pdfU8, byteRangePos, contentsHexStart, contentsHexEnd, numWidth, signatureHex) {
    if (!(pdfU8 instanceof Uint8Array)) throw new Error("pdfU8 deve ser Uint8Array");
    [byteRangePos, contentsHexStart, contentsHexEnd, numWidth].forEach((v) => {
        if (!Number.isInteger(v) || v < 0) throw new Error("Parâmetros de posição devem ser inteiros não-negativos");
    });
    if (contentsHexStart >= contentsHexEnd) throw new Error("contentsHexStart deve ser < contentsHexEnd");
    if (contentsHexEnd > pdfU8.length) throw new Error("contentsHexEnd fora do arquivo");

    const posOfOpeningBracket = contentsHexStart - 1;
    if (posOfOpeningBracket < 0) throw new Error("contentsHexStart invalid (without '<' before)");
    const length1 = posOfOpeningBracket;
    const posOfClosingBracket = contentsHexEnd;
    const offset2 = posOfClosingBracket + 1;
    if (offset2 > pdfU8.length) throw new Error("offset2 calculated beyond the end of the file");
    const length2 = pdfU8.length - offset2;

    const pad = (v) => {
        const s = String(v);
        if (s.length > numWidth) return s;
        return s.padStart(numWidth, "0");
    };

    const brStart = byteRangePos;

    let brEnd = -1;
    for (let i = brStart; i < pdfU8.length; i++) {
        if (pdfU8[i] === 0x5d) { // ']' ASCII 0x5D
            brEnd = i;
            break;
        }
    }
    if (brEnd === -1) throw new Error("ByteRange ']' not found when injecting.");

    const oldSegmentStr = u8ToLatin1(pdfU8.subarray(brStart, brEnd + 1));

    const numbersRE = /(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/;
    const match = numbersRE.exec(oldSegmentStr);
    let newSegmentStr;
    if (match) {
        const padded1 = pad(0);
        const padded2 = pad(length1);
        const padded3 = pad(offset2);
        const padded4 = pad(length2);
        newSegmentStr = oldSegmentStr.replace(numbersRE, `${padded1} ${padded2} ${padded3} ${padded4}`);
        if (newSegmentStr.length !== oldSegmentStr.length) {
            throw new Error("Changed replacement in ByteRange placeholder length — adjust numWidth or placeholder");
        }
    } else {
        const newBr = `/ByteRange [${pad(0)} ${pad(length1)} ${pad(offset2)} ${pad(length2)}]`;
        if (newBr.length > oldSegmentStr.length) {
            throw new Error("Could not inject ByteRange: new segment larger than placeholder.");
        }
        const diff = oldSegmentStr.length - newBr.length;
        const padLeft = Math.floor(diff / 2);
        const padRight = diff - padLeft;
        newSegmentStr = " ".repeat(padLeft) + newBr + " ".repeat(padRight);
    }

    const newSegmentU8 = latin1ToU8(newSegmentStr);
    pdfU8.set(newSegmentU8, brStart);

    const hexStartIdx = contentsHexStart;
    const hexEndIdx = contentsHexEnd;
    const reservedLen = hexEndIdx - hexStartIdx;
    if (signatureHex.length > reservedLen) {
        throw new Error("Signature too long to fit in the reserved /Contents space.");
    }
    const paddedSignatureHex = signatureHex + "0".repeat(reservedLen - signatureHex.length);

    if (!/^[0-9A-Fa-f]*$/.test(paddedSignatureHex)) throw new Error("signatureHex contains non-hexadecimal characters");

    for (let i = 0; i < paddedSignatureHex.length; i++) {
        pdfU8[hexStartIdx + i] = paddedSignatureHex.charCodeAt(i);
    }

    return pdfU8;
}

/**
 * Convert a base64 string to hex string
 * @param {string} b64 - Base64 encoded string
 * @returns {string} - Hexadecimal encoded string
 */
function base64ToHex(b64) {
    const bin = atob(b64);
    let hex = "";
    for (let i = 0; i < bin.length; ++i) {
        hex += ("0" + bin.charCodeAt(i).toString(16)).slice(-2);
    }
    return hex;
}

/**
 * Request document signature from Xumm wallet
 * @param {object} xumm - Xumm SDK instance
 * @param {Uint8Array} digestU8 - Document hash to be signed
 * @param {string} account - Xahau wallet address
 * @returns {Promise<string>} - Promise resolving to the signature in hex format
 */
async function requestSignatureFromWallet(xumm, digestU8, account) {
    if (!xumm) throw new Error("Xumm SDK instance is required.");
    if (!(digestU8 instanceof Uint8Array)) throw new Error("digestU8 must be a Uint8Array.");

    const digestHex = Array.from(digestU8)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

    const payload = {
        txjson: {
            TransactionType: "SignIn",
            Account: account,
            Fee: "0",
            Flags: 0,
            Memos: [
                {
                    Memo: {
                        MemoData: digestHex,
                        MemoType: Buffer.from("DocumentHash").toString("hex"),
                    },
                },
            ],
        },
        options: { submit: false, expire: 5 },
        custom_meta: { instruction: `Sign this document hash:\n${digestHex}` },
    };

    return new Promise((resolve, reject) => {
        xumm.payload
            .createAndSubscribe(payload, (eventMessage) => {
                const data = eventMessage?.data ?? {};
                if (data.signed === true) return eventMessage;
                if (data.signed === false) reject(new Error("The signing request was rejected by the user."));
                if (data.expired) reject(new Error("The signing request expired before completion."));
            })
            .then(({ resolved }) => {
                resolved
                    .then((payloadResult) => {
                        const response = payloadResult?.payload?.response;
                        if (response && response.hex) {
                            resolve(response.hex.replace(/^0x/, ""));
                        } else {
                            reject(new Error("No signature returned from wallet response."));
                        }
                    })
                    .catch((err) => reject(new Error(`Error resolving payload: ${err.message || String(err)}`)));
            })
            .catch((err) => reject(new Error(`Error creating payload: ${err.message || String(err)}`)));
    });
}

export default function WalletSignPage() {
    const [pdfFile, setPdfFile] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);

    const { account, isLoading, xumm } = useContext(AppContext);

    const { push } = useRouter();

    useEffect(() => {
        if (!isLoading && !account) {
            push("/login?redirect=/origo/sign/wallet");
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

    /**
     * Auxiliar function to calculate hash excluding the signature field (/Contents)
     * @param {Uint8Array} pdfU8 - The PDF document as a Uint8Array
     * @param {number} contentsHexStart - Start position of the /Contents hex string
     * @param {number} contentsHexEnd - End position of the /Contents hex string
     * @returns {Promise<Uint8Array>} - The SHA-256 hash of the PDF document excluding the signature field
     */
    const calcDigestExcludingSignature = (pdfU8, contentsHexStart, contentsHexEnd) => {
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
        return crypto.subtle.digest("SHA-256", concat);
    };

    /**
     * Handle the signing process with the wallet
     */
    const handleSignWithWallet = async () => {
        setMessage(null);
        if (!pdfFile) {
            alert("Please select a valid PDF file.");
            return;
        }
        if (!xumm) {
            alert("Xumm (Xaman Wallet) not available in context.");
            return;
        }

        setBusy(true);
        try {
            const pdfArrayBuffer = await pdfFile.arrayBuffer();
            const pdfBytes = new Uint8Array(pdfArrayBuffer);
            const pdfDoc = await PDFDocument.load(pdfBytes);

            pdfDoc.setCreator("xahau.network");
            pdfDoc.setProducer("Xahau Docproof Origo");
            pdfDoc.setCreationDate(new Date("2000-01-01T00:00:00Z"));
            pdfDoc.setModificationDate(new Date("2000-01-01T00:00:00Z"));

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
            const appended = appendSignaturePlaceholder(pdfWithFieldU8, placeholderSize, "Signed via Xaman Wallet");
            const pdfForSign = appended.newPdfU8;
            const { byteRangePos, contentsHexStart, contentsHexEnd, numWidth } = appended;

            const hashBuf = await calcDigestExcludingSignature(pdfForSign, contentsHexStart, contentsHexEnd);
            const hashU8 = new Uint8Array(hashBuf);
            const hashHex = bufferToHex(hashU8);

            const signatureHex = await requestSignatureFromWallet(xumm, hashU8, account);

            const normalizedSignatureHex = signatureHex.replace(/^0x/, "");

            const finalPdfU8 = injectByteRangeAndSignature(
                pdfForSign,
                byteRangePos,
                contentsHexStart,
                contentsHexEnd,
                numWidth,
                normalizedSignatureHex
            );

            const blob = new Blob([finalPdfU8], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "document-signed-wallet.pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            setMessage({
                status: "ok",
                text: `PDF signed via Xaman Wallet. SHA256 of the file (excluding signature): ${hashHex}`,
            });
        } catch (err) {
            console.error("Error signing with wallet:", err);
            setMessage({ status: "error", text: err.message || String(err) });
        } finally {
            setBusy(false);
        }
    };

    if (isLoading) return <PageLoading />;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-3">Origo &ndash; Sign PDF (Xaman Wallet)</h1>
            <p className="text-sm text-slate-600 mb-6">
                Dedicated page exclusively for the signing workflow using the Xaman Wallet (xumm). Drag a PDF, click to sign via the wallet, and a PDF with the embedded signature will be generated.
            </p>

            <div className="space-y-6">
                <div className="p-6 bg-white border rounded-lg shadow-sm">
                    <h2 className="font-semibold mb-2">1) Choose Document (PDF)</h2>
                    <p className="text-xs text-slate-500 mb-3">Drag and drop or select a PDF. We do not store anything.</p>
                    <Dropzone onFileChange={handleDropzoneFile} />
                    {pdfFile && <div className="mt-3 text-sm">Selected file: <strong>{pdfFile.name}</strong></div>}
                </div>

                <div className="p-6 bg-white border rounded-lg shadow-sm">
                    <h2 className="font-semibold mb-2">2) Xahau Address for Validation</h2>
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
                        onClick={handleSignWithWallet}
                        disabled={busy}
                    >
                        {busy ? "Signing..." : "Sign and Generate PDF (via Xaman Wallet)"}
                    </button>

                    <button
                        className="btn btn-ghost"
                        onClick={() => {
                            setPdfFile(null);
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