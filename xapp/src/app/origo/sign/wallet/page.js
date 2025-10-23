"use client";

import Dropzone from "@/components/UI/Dropzone";
import { useCallback, useContext, useState } from "react";
import QRCode from "qrcode";
import { PDFDocument, rgb } from "pdf-lib";
// NOTE: adjust the import path for your AppContext where "xumm" is provided
import { AppContext } from "@/context/AppContext";
import { sign } from "crypto";

/* ---------- Helpers ---------- */

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
    let pdfStr = u8ToLatin1(pdfU8);

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

    const newByteRange = `/ByteRange [${pad(0)} ${pad(length1)} ${pad(offset2)} ${pad(length2)}]`;
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
                throw new Error(`Erro ao processar assinatura: ${error.message}`);
            });
    } catch (error) {
        throw new Error(`Erro ao criar payload de assinatura: ${error.message}`);
    }
}

/* ---------- Component (focus exclusivo em Xaman Wallet) ---------- */

export default function WalletSignPage() {
    const { xumm, account } = useContext(AppContext) || {}; // expecting { xumm } shape in AppContext
    const [pdfFile, setPdfFile] = useState(null);
    const [walletAddress, setWalletAddress] = useState("");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);

    const handleDropzoneFile = useCallback(async (file) => {
        if (!file) {
            setPdfFile(null);
            return;
        }
        if (file.type !== "application/pdf") {
            alert("Por favor selecione um arquivo PDF.");
            return;
        }
        setPdfFile(file);
        setMessage(null);
    }, []);

    const handleSignWithWallet = async () => {
        setMessage(null);

        if (!pdfFile) {
            alert("Selecione um PDF pelo dropzone.");
            return;
        }

        if (!xumm) {
            alert("Xumm (Xaman Wallet) não disponível no contexto.");
            return;
        }

        setBusy(true);

        try {
            // 1️⃣ Carrega PDF original
            const pdfArrayBuffer = await pdfFile.arrayBuffer();
            const pdfBytes = new Uint8Array(pdfArrayBuffer);
            const pdfDoc = await PDFDocument.load(pdfBytes);

            // 2️⃣ Adiciona página QR e informações
            const origin =
                (typeof window !== "undefined" && window.location && window.location.origin) || "https://xahau.network";
            const fullValidationUrl = walletAddress ? `${origin}/origo/${encodeURIComponent(walletAddress)}` : origin;
            const qrDataUrl = await QRCode.toDataURL(fullValidationUrl, { margin: 1, scale: 6 });

            const qrPage = pdfDoc.addPage([595, 842]);
            const pngImage = await pdfDoc.embedPng(qrDataUrl);
            qrPage.drawImage(pngImage, { x: 50, y: 650, width: 160, height: 160 });
            qrPage.drawText("Xahau Docproof Origo (Wallet Signed)", { x: 50, y: 620, size: 16, color: rgb(0, 0.2, 0.6) });
            qrPage.drawText(`Validation URL: ${fullValidationUrl}`, { x: 50, y: 590, size: 10 });
            qrPage.drawText(`Signed at: ${new Date().toISOString()}`, { x: 50, y: 560, size: 10 });

            // 3️⃣ Salva PDF sem ByteRange real
            const pdfWithFieldBytes = await pdfDoc.save({ useObjectStreams: false });
            const pdfWithFieldU8 = new Uint8Array(pdfWithFieldBytes);

            // 4️⃣ Adiciona placeholder para assinatura
            const placeholderSize = 8192;
            const appended = appendSignaturePlaceholder(pdfWithFieldU8, placeholderSize, "Signed via Xaman Wallet");
            const pdfForSign = appended.newPdfU8;
            const { byteRangePos, contentsHexStart, contentsHexEnd, numWidth } = appended;

            // 5️⃣ Calcula SHA-256 do PDF final excluindo placeholder
            const posOfOpeningBracket = contentsHexStart - 1;
            const posOfClosingBracket = contentsHexEnd;
            const part1 = pdfForSign.subarray(0, posOfOpeningBracket);
            const part2 = pdfForSign.subarray(posOfClosingBracket + 1);
            const concat = new Uint8Array(part1.length + part2.length);
            concat.set(part1, 0);
            concat.set(part2, part1.length);

            const hashBuf = await crypto.subtle.digest("SHA-256", concat);
            const hashU8 = new Uint8Array(hashBuf);

            // 6️⃣ Converte para hex para MemoData
            const memoHex = Array.from(hashU8).map(b => b.toString(16).padStart(2, '0')).join('');

            // 7️⃣ Cria payload para assinatura no Xaman Wallet
            const payload = {
                txjson: {
                    TransactionType: 'AccountSet', // off-ledger
                    Account: account,
                    Fee: '0',
                    Flags: 0,
                    Memos: [
                        {
                            Memo: {
                                MemoData: memoHex,
                                MemoType: Buffer.from('DocumentHash').toString('hex'),
                            },
                        },
                    ],
                },
                options: { submit: false, expire: 5 },
                instructions: `Assine o hash do documento: ${memoHex.substring(0, 10)}...`,
            };

            // 8️⃣ Solicita assinatura ao Xaman Wallet
            const signatureHex = await requestSignatureFromWallet(xumm, hashU8, account);
            const normalizedSignatureHex = signatureHex.replace(/^0x/, "");

            // 9️⃣ Injeta ByteRange e assinatura no placeholder
            const finalPdfU8 = injectByteRangeAndSignature(
                pdfForSign,
                byteRangePos,
                contentsHexStart,
                contentsHexEnd,
                numWidth,
                normalizedSignatureHex
            );

            // 🔟 Download do PDF final
            const blob = new Blob([finalPdfU8], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "document-signed-wallet.pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            // 1️⃣1️⃣ SHA-256 do PDF final (após injetar assinatura)
            const finalDigestHex = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", finalPdfU8)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            setMessage({
                status: "ok",
                text: `PDF assinado via Xaman Wallet. SHA256 do arquivo final: ${finalDigestHex}`,
            });
        } catch (err) {
            console.error("Erro ao assinar com wallet:", err);
            setMessage({ status: "error", text: err.message || String(err) });
            alert("Erro: " + (err.message || String(err)));
        } finally {
            setBusy(false);
        }
    };


    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-3">Origo &ndash; Sign PDF (Xaman Wallet)</h1>
            <p className="text-sm text-slate-600 mb-6">
                Página dedicada exclusivamente ao fluxo de assinatura usando a Xaman Wallet (xumm). Arraste um PDF, clique para assinar
                pela wallet e um PDF com a assinatura embutida será gerado.
            </p>

            <div className="space-y-6">
                <div className="p-6 bg-white border rounded-lg shadow-sm">
                    <h2 className="font-semibold mb-2">1) Selecione o documento (PDF)</h2>
                    <p className="text-xs text-slate-500 mb-3">Arraste e solte ou selecione um PDF. Não armazenamos nada.</p>
                    <Dropzone onFileChange={handleDropzoneFile} />
                    {pdfFile && <div className="mt-3 text-sm">Arquivo selecionado: <strong>{pdfFile.name}</strong></div>}
                </div>

                <div className="p-6 bg-white border rounded-lg shadow-sm">
                    <h2 className="font-semibold mb-2">2) Endereço Xahau para validação (opcional)</h2>
                    <input
                        placeholder="Insira a carteira Xahau (wallet) que será incluída no PDF"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="input input-bordered w-full"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className={`btn btn-primary ${busy ? "loading" : ""}`}
                        onClick={handleSignWithWallet}
                        disabled={busy}
                    >
                        {busy ? "Assinando..." : "Assinar e Gerar PDF (via Xaman Wallet)"}
                    </button>

                    <button
                        className="btn btn-ghost"
                        onClick={() => {
                            setPdfFile(null);
                            setWalletAddress("");
                            setMessage(null);
                        }}
                    >
                        Limpar
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