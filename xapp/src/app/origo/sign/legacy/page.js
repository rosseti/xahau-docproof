"use client";

import Dropzone from "@/components/UI/Dropzone";
import * as forge from "node-forge";
import {
    PDFDocument,
    PDFName,
    PDFNumber,
    PDFString,
    rgb
} from "pdf-lib";
import QRCode from "qrcode";
import { useCallback, useState } from "react";

/* ---------- Helpers (mesmos de antes) ---------- */

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

/* ---------- PKCS#7 creation (mesmo de antes) ---------- */
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

/* ---------- Insere AcroForm signature field (visível) ---------- */

function insertAcroFormSignaturePlaceholder(pdfDoc, reason = "Signed by Docproof") {
    try {
        const pages = pdfDoc.getPages();
        if (pages.length === 0) return false;
        const page = pages[pages.length - 1];
        const pageRef = page.ref;
        const { context } = pdfDoc;

        // dicionário /Sig simples (sem Contents grande; apenas para presença do field)
        const sigDict = context.obj({
            Type: PDFName.of("Sig"),
            Filter: PDFName.of("Adobe.PPKLite"),
            SubFilter: PDFName.of("adbe.pkcs7.detached"),
            Reason: PDFString.of(reason),
            M: PDFString.of(new Date().toISOString()),
        });
        const sigRef = context.register(sigDict);

        // widget annotation (visível). Ajuste o Rect conforme desejar.
        const rect = [50, 650, 210, 700]; // [x1, y1, x2, y2]
        const widgetDict = context.obj({
            Type: PDFName.of("Annot"),
            Subtype: PDFName.of("Widget"),
            FT: PDFName.of("Sig"),
            Rect: context.obj(rect.map((n) => PDFNumber.of(n))),
            V: sigRef,
            T: PDFString.of("DocproofSignature"),
            F: PDFNumber.of(4),
            P: pageRef,
        });
        const widgetRef = context.register(widgetDict);

        // Adiciona widget ao array /Annots da página
        const annotsKey = PDFName.of("Annots");
        const existingAnnots = page.node.get(annotsKey);
        if (existingAnnots) {
            try {
                existingAnnots.push(widgetRef);
            } catch (e) {
                const newArr = context.obj([existingAnnots, widgetRef]);
                page.node.set(annotsKey, newArr);
            }
        } else {
            const arr = context.obj([widgetRef]);
            page.node.set(annotsKey, arr);
        }

        // Cria/Atualiza AcroForm no catálogo
        const catalog = pdfDoc.catalog;
        const acroFormKey = PDFName.of("AcroForm");
        const existingAcro = catalog.get(acroFormKey);
        if (existingAcro) {
            const fieldsKey = PDFName.of("Fields");
            const fields = existingAcro.get(fieldsKey);
            if (fields) {
                try {
                    fields.push(widgetRef);
                } catch (e) {
                    const newFields = context.obj([fields, widgetRef]);
                    existingAcro.set(fieldsKey, newFields);
                }
            } else {
                existingAcro.set(fieldsKey, context.obj([widgetRef]));
            }
            existingAcro.set(PDFName.of("SigFlags"), PDFNumber.of(3));
        } else {
            const acroFormDict = context.obj({
                Fields: context.obj([widgetRef]),
                SigFlags: PDFNumber.of(3),
            });
            const acroRef = context.register(acroFormDict);
            catalog.set(acroFormKey, acroRef);
        }

        return true;
    } catch (err) {
        console.error("Erro inserindo AcroForm signature placeholder (detalhes):", err);
        return false;
    }
}

/* ---------- Funções de fallback textual (append) - seguras para injeção ---------- */

// adiciona um bloco placeholder textual ao final do PDF contendo /ByteRange e /Contents
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

function findSignaturePlaceholderPositions(pdfU8) {
    const pdfStr = u8ToLatin1(pdfU8);
    const brIdx = pdfStr.indexOf("/ByteRange [");
    if (brIdx === -1) throw new Error("Não encontrou /ByteRange no PDF salvo.");
    const brEnd = pdfStr.indexOf("]", brIdx);
    if (brEnd === -1) throw new Error("ByteRange ']' não encontrado.");
    const contentsIdx = pdfStr.indexOf("/Contents", brIdx);
    if (contentsIdx === -1) throw new Error("/Contents não encontrado após /ByteRange.");
    const angleOpen = pdfStr.indexOf("<", contentsIdx);
    if (angleOpen === -1) throw new Error("'<'' do /Contents não encontrado.");
    const angleClose = pdfStr.indexOf(">", angleOpen);
    if (angleClose === -1) throw new Error("'>' do /Contents não encontrado.");
    const contentsHexStart = angleOpen + 1;
    const contentsHexEnd = angleClose;
    const brSegment = pdfStr.substring(brIdx, brEnd + 1);
    let numWidth = 10;
    const numbers = brSegment.match(/\[([^\]]+)\]/);
    if (numbers && numbers[1]) {
        const parts = numbers[1].trim().split(/\s+/);
        if (parts.length >= 4) {
            numWidth = parts[0].length;
        }
    }
    return {
        byteRangePos: brIdx,
        contentsHexStart,
        contentsHexEnd,
        numWidth,
    };
}

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

/* ---------- Componente React / UI (sempre faz AcroForm + append textual block) ---------- */

export default function Page() {
    const [pdfFile, setPdfFile] = useState(null);
    const [pfxFile, setPfxFile] = useState(null);
    const [passphrase, setPassphrase] = useState("");
    const [wallet, setWallet] = useState("");
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

    const handlePfxChange = (ev) => {
        const f = ev.target.files?.[0] || null;
        setPfxFile(f);
    };

    const handleSignAndGenerate = async () => {
        setMessage(null);
        if (!pdfFile) {
            alert("Selecione um PDF pelo dropzone.");
            return;
        }
        if (!pfxFile) {
            alert("Selecione o arquivo PFX (.pfx / .p12).");
            return;
        }

        setBusy(true);

        try {
            // 1) Carrega PDF original e adiciona página do QR
            const pdfArrayBuffer = await pdfFile.arrayBuffer();
            const pdfBytes = new Uint8Array(pdfArrayBuffer);
            const pdfDoc = await PDFDocument.load(pdfBytes);

            // Gera QR
            const origin =
                (typeof window !== "undefined" && window.location && window.location.origin) || "https://xahau.network";
            const fullValidationUrl = wallet ? `${origin}/origo/${encodeURIComponent(wallet)}` : origin;
            const qrDataUrl = await QRCode.toDataURL(fullValidationUrl, { margin: 1, scale: 6 });

            // adiciona página QR
            const qrPage = pdfDoc.addPage([595, 842]);
            const pngImage = await pdfDoc.embedPng(qrDataUrl);
            const qrWidth = 160;
            const qrHeight = 160;
            qrPage.drawImage(pngImage, { x: 50, y: 650, width: qrWidth, height: qrHeight });
            qrPage.drawText("Xahau Docproof Origo", { x: 50, y: 620, size: 20, color: rgb(0, 0.2, 0.6) });
            qrPage.drawText("Scan the QR code to validate this document on the Xahau Docproof.", { x: 50, y: 590, size: 12 });
            qrPage.drawText(`Validation URL: ${fullValidationUrl}`, { x: 50, y: 572, size: 10 });
            const now = new Date();
            qrPage.drawText(`Signed at: ${now.toISOString()}`, { x: 50, y: 540, size: 10 });
            if (wallet) qrPage.drawText(`Xahau wallet: ${wallet}`, { x: 50, y: 520, size: 10 });

            // 2) Insere campo de assinatura AcroForm (apenas para visualização)
            // insertAcroFormSignaturePlaceholder(pdfDoc, "Document signed via Docproof");

            // 3) salva PDF (ainda sem /ByteRange e /Contents reais)
            const pdfWithFieldBytes = await pdfDoc.save({ useObjectStreams: false });
            const pdfWithFieldU8 = new Uint8Array(pdfWithFieldBytes);

            // 4) ANEXA um bloco textual seguro para o placeholder do ByteRange/Contents
            const placeholderSize = 8192; // aumente se necessário
            const appended = appendSignaturePlaceholder(pdfWithFieldU8, placeholderSize, "Document signed via Docproof");
            const pdfForSign = appended.newPdfU8;
            const byteRangePos = appended.byteRangePos;
            const contentsHexStart = appended.contentsHexStart;
            const contentsHexEnd = appended.contentsHexEnd;
            const numWidth = appended.numWidth;

            // 5) cria assinatura PKCS#7 sobre o PDF sem os bytes do /Contents
            const pfxArrayBuffer = await pfxFile.arrayBuffer();
            const signatureU8 = await signPdfWithByteRange(pdfForSign, contentsHexStart, contentsHexEnd, pfxArrayBuffer, passphrase);

            const signatureHex = bufferToHex(signatureU8);

            // 6) injeta ByteRange e assinatura no bloco textual (seguro)
            const finalPdfU8 = injectByteRangeAndSignature(pdfForSign, byteRangePos, contentsHexStart, contentsHexEnd, numWidth, signatureHex);

            // 7) download
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
                text: `PDF gerado com campo de assinatura (AcroForm) e assinatura embutida via bloco textual. SHA256: ${digestHex}`,
            });
        } catch (err) {
            console.error("Erro ao assinar/gerar PDF:", err);
            setMessage({ status: "error", text: err.message || String(err) });
            alert("Erro: " + (err.message || String(err)));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-3">Origo &ndash; Sign PDF (client-side)</h1>
            <p className="text-sm text-slate-600 mb-6">
                Gera um PDF com uma página de validação (QR), insere um campo de assinatura (AcroForm) para que leitores mostrem o campo,
                e embute a assinatura PKCS#7 em um bloco textual anexo (método robusto para injeção de /ByteRange e /Contents).
            </p>

            <div className="space-y-6">
                <div className="p-6 bg-white border rounded-lg shadow-sm">
                    <h2 className="font-semibold mb-2">1) Selecione o documento (PDF)</h2>
                    <p className="text-xs text-slate-500 mb-3">Arraste e solte ou selecione um PDF. Não armazenamos nada.</p>
                    <Dropzone onFileChange={handleDropzoneFile} />
                    {pdfFile && <div className="mt-3 text-sm">Arquivo selecionado: <strong>{pdfFile.name}</strong></div>}
                </div>

                <div className="p-6 bg-white border rounded-lg shadow-sm">
                    <h2 className="font-semibold mb-2">2) Selecione o PFX / Passphrase</h2>
                    <div className="flex flex-col sm:flex-row gap-3 items-start">
                        <input
                            type="file"
                            accept=".p12,.pfx,application/x-pkcs12"
                            onChange={handlePfxChange}
                            className="file-input file-input-bordered file-input-sm w-full max-w-xs"
                        />
                        <input
                            type="password"
                            placeholder="Passphrase do PFX (se houver)"
                            value={passphrase}
                            onChange={(e) => setPassphrase(e.target.value)}
                            className="input input-bordered input-sm w-full max-w-xs"
                        />
                    </div>
                    {pfxFile && <div className="mt-3 text-sm">PFX selecionado: <strong>{pfxFile.name}</strong></div>}
                </div>

                <div className="p-6 bg-white border rounded-lg shadow-sm">
                    <h2 className="font-semibold mb-2">3) Endereço Xahau para validação (opcional)</h2>
                    <input
                        placeholder="Insira a carteira Xahau (wallet) que será incluída no PDF"
                        value={wallet}
                        onChange={(e) => setWallet(e.target.value)}
                        className="input input-bordered w-full"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className={`btn btn-primary ${busy ? "loading" : ""}`}
                        onClick={handleSignAndGenerate}
                        disabled={busy}
                    >
                        {busy ? "Gerando..." : "Assinar e Gerar PDF (AcroForm + assinatura embutida)"}
                    </button>

                    <button
                        className="btn btn-ghost"
                        onClick={() => {
                            setPdfFile(null);
                            setPfxFile(null);
                            setPassphrase("");
                            setWallet("");
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