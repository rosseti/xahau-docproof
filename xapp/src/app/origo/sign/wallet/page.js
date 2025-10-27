"use client";


import PageLoading from "@/components/PageLoader";
import Dropzone from "@/components/UI/Dropzone";
import { AppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { PDFDocument, rgb } from "pdf-lib";
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

function injectByteRangeAndSignature(pdfU8, byteRangePos, contentsHexStart, contentsHexEnd, numWidth, signatureHex) {
    // Validações básicas
    if (!(pdfU8 instanceof Uint8Array)) throw new Error("pdfU8 deve ser Uint8Array");
    [byteRangePos, contentsHexStart, contentsHexEnd, numWidth].forEach((v) => {
        if (!Number.isInteger(v) || v < 0) throw new Error("Parâmetros de posição devem ser inteiros não-negativos");
    });
    if (contentsHexStart >= contentsHexEnd) throw new Error("contentsHexStart deve ser < contentsHexEnd");
    if (contentsHexEnd > pdfU8.length) throw new Error("contentsHexEnd fora do arquivo");

    // calculos de comprimento e offsets
    const posOfOpeningBracket = contentsHexStart - 1; // posição do '<'
    if (posOfOpeningBracket < 0) throw new Error("contentsHexStart inválido (sem '<' antes)");
    const length1 = posOfOpeningBracket; // bytes antes do '<'
    const posOfClosingBracket = contentsHexEnd; // posição do '>' (assumindo que não há espaços)
    const offset2 = posOfClosingBracket + 1; // byte depois de '>'
    if (offset2 > pdfU8.length) throw new Error("offset2 calculado além do final do arquivo");
    const length2 = pdfU8.length - offset2;

    // função para formatar números com zero-padding
    const pad = (v) => {
        const s = String(v);
        if (s.length > numWidth) return s; // não truncar — o caller deve garantir numWidth suficiente
        return s.padStart(numWidth, "0");
    };

    // 1) Substituir os 4 números dentro do placeholder /ByteRange mantendo o mesmo comprimento total do segmento
    const brStart = byteRangePos;
    // encontrar o final do segmento de ByteRange (o primeiro ']' depois de brStart)
    let brEnd = -1;
    for (let i = brStart; i < pdfU8.length; i++) {
        if (pdfU8[i] === 0x5d) { // ']' ASCII 0x5D
            brEnd = i;
            break;
        }
    }
    if (brEnd === -1) throw new Error("ByteRange ']' não encontrado quando injetando.");

    // extrair segmento como string latin1
    const oldSegmentStr = u8ToLatin1(pdfU8.subarray(brStart, brEnd + 1));

    // procurar os 4 grupos numéricos dentro do segmento antigo e substituí-los por padded numbers
    const numbersRE = /(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/;
    const match = numbersRE.exec(oldSegmentStr);
    let newSegmentStr;
    if (match) {
        // substitui apenas os números (preserva espaços e outros caracteres)
        const padded1 = pad(0); // normalmente start1 será 0
        const padded2 = pad(length1);
        const padded3 = pad(offset2);
        const padded4 = pad(length2);
        newSegmentStr = oldSegmentStr.replace(numbersRE, `${padded1} ${padded2} ${padded3} ${padded4}`);
        if (newSegmentStr.length !== oldSegmentStr.length) {
            // se o comprimento mudou (por algum motivo), falhar em vez de deslocar o arquivo
            throw new Error("Substituição mudou o comprimento do placeholder ByteRange — ajuste numWidth ou placeholder.");
        }
    } else {
        // fallback: construir novo segmento e centralizar dentro do espaço disponível (menos ideal)
        const newBr = `/ByteRange [${pad(0)} ${pad(length1)} ${pad(offset2)} ${pad(length2)}]`;
        if (newBr.length > oldSegmentStr.length) {
            throw new Error("Não foi possível injetar ByteRange: novo segmento maior que o placeholder.");
        }
        const diff = oldSegmentStr.length - newBr.length;
        const padLeft = Math.floor(diff / 2);
        const padRight = diff - padLeft;
        newSegmentStr = " ".repeat(padLeft) + newBr + " ".repeat(padRight);
    }

    // escrever newSegmentStr de volta para o pdfU8
    const newSegmentU8 = latin1ToU8(newSegmentStr);
    pdfU8.set(newSegmentU8, brStart);

    // 2) Escrever a assinatura hex no intervalo reservado (contentsHexStart..contentsHexEnd - exclusivo)
    const hexStartIdx = contentsHexStart;
    const hexEndIdx = contentsHexEnd;
    const reservedLen = hexEndIdx - hexStartIdx;
    if (signatureHex.length > reservedLen) {
        throw new Error("Assinatura maior que espaço reservado. Aumente placeholderSize.");
    }
    const paddedSignatureHex = signatureHex + "0".repeat(reservedLen - signatureHex.length);
    // validar caracteres hex (opcional)
    if (!/^[0-9A-Fa-f]*$/.test(paddedSignatureHex)) throw new Error("signatureHex contém caracteres não hexadecimais");

    // escrever ASCII hex bytes
    for (let i = 0; i < paddedSignatureHex.length; i++) {
        pdfU8[hexStartIdx + i] = paddedSignatureHex.charCodeAt(i);
    }

    return pdfU8; // modificado in-place (retornamos por conveniência)
}

/* Convert base64 to hex (helper in case wallet returns base64) */
function base64ToHex(b64) {
    const bin = atob(b64);
    let hex = "";
    for (let i = 0; i < bin.length; ++i) {
        hex += ("0" + bin.charCodeAt(i).toString(16)).slice(-2);
    }
    return hex;
}

/* ---------- Wallet signing-specific logic ---------- */

async function requestSignatureFromWallet(xumm, digestU8, account) {
    // Valida parâmetros

    if (!xumm) throw new Error("Xumm SDK não está disponível no contexto.");
    if (!(digestU8 instanceof Uint8Array)) throw new Error("digestU8 deve ser um Uint8Array.");

    // Converte Uint8Array para hexadecimal
    const digestHex = Array.from(digestU8)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');

    // Cria o payload de SignIn
    const payload = {
        txjson: {
            TransactionType: 'AccountSet',  // Tipo oficial que pode ser usado off-ledger
            Account: account,               // conta que vai assinar
            Fee: '0',                       // Nenhuma taxa, não será submetido
            Flags: 0,                        // Sem alterações de flags
            Memos: [
                {
                    Memo: {
                        MemoData: digestHex, // hash do documento
                        MemoType: Buffer.from('DocumentHash').toString('hex'),   // identificador do memo
                    },
                },
            ],
        },
        options: {
            submit: false,  // Apenas assinar, não submeter
            expire: 5,      // expira em 5 minutos
        },
        instructions: `Assine o hash do documento: ${digestHex.substring(0, 10)}...`, // instrução curta
    };
    console.log(payload);

    try {
        const { created, resolved } = await xumm.payload.createAndSubscribe(
            payload,
            (eventMessage) => {
                if (eventMessage.data.signed) {
                    return eventMessage;
                }
                if (eventMessage.data.rejected) {
                    throw new Error('Assinatura rejeitada pelo usuário.');
                }
                if (eventMessage.data.expired) {
                    throw new Error('O payload expirou antes de ser assinado.');
                }
            }
        );

        return resolved
            .then((payload) => {
                const response = payload.payload.response;
                console.log(response);
                if (response && response.hex) {
                    const signature = response.hex.replace(/^0x/, ''); // Remove prefixo 0x
                    return signature; // Retorna a assinatura em hex
                } else {
                    throw new Error('Assinatura não encontrada na resposta.');
                }
            })
            .catch((error) => {
                throw new Error(`Error processing signature: ${error.message}`);
            });
    } catch (error) {
        throw new Error(`Error creating signature payload: ${error.message}`);
    }
}

export default function WalletSignPage() {
    const [pdfFile, setPdfFile] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);

    const { account, isLoading, xumm } = useContext(AppContext);

    const { push } = useRouter();

    useEffect(() => {
        if (!isLoading && !account) {
            push("/login");
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
    const calcDigestExcluindoAssinatura = (pdfU8, contentsHexStart, contentsHexEnd) => {
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

            const hashBuf = await calcDigestExcluindoAssinatura(pdfForSign, contentsHexStart, contentsHexEnd);
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
            alert("Error: " + (err.message || String(err)));
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