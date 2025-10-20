"use client";

import PageLoader from "@/components/PageLoader";
import Dropzone from "@/components/UI/Dropzone";
import { parse } from "@iarna/toml";
import { Buffer } from "buffer";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const bufferToHex = (buffer) =>
    Array.prototype.map
        .call(new Uint8Array(buffer), (x) => ("00" + x.toString(16)).slice(-2))
        .join("");

const Origo = () => {
    const { rAddress } = useParams();
    const searchParams = useSearchParams();
    const id = searchParams.get("id") || null;

    const [file, setFile] = useState(null);
    const [domain, setDomain] = useState(null);
    const [toml, setToml] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState(null);
    

    const handleFileChange = async (acceptedFile) => {
        const selectedFile = acceptedFile;
        console.log("Selected file:", selectedFile);

        if (selectedFile == null) {
            setFile(null);
            setVerifyResult(null);
            return;
        }

        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile);
            setVerifyResult(null);
            await extractSignature(selectedFile);
        } else {
            alert("Please select a valid PDF file");
        }
    };

    const uint8ArrayToLatin1 = (u8) => {
        let CHUNK = 0x8000;
        let c = [];
        for (let i = 0; i < u8.length; i += CHUNK) {
            c.push(String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK)));
        }
        return c.join("");
    };

    const findByteRangeAndContents = (pdfStr) => {
        const brRegex = /\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/m;
        const brMatch = brRegex.exec(pdfStr);
        if (!brMatch) return null;

        const byteRange = brMatch.slice(1, 5).map((v) => Number.parseInt(v, 10));

        const contentsRegex = /\/Contents\s*<([\s0-9A-Fa-f\r\n\t]+)>/m;
        const contMatch = contentsRegex.exec(pdfStr);

        if (!contMatch) {
            const contParenRegex = /\/Contents\s*\(\s*([\s\S]*?)\s*\)/m;
            const contParenMatch = contParenRegex.exec(pdfStr);
            if (!contParenMatch) return { byteRange, contentsHex: null };
            return { byteRange, contentsHex: null };
        }

        const rawHex = contMatch[1].replaceAll(/[\s\r\n\t]+/g, "");
        return { byteRange, contentsHex: rawHex };
    };

    const computeSha256HexForByteRange = async (u8, byteRange) => {
        // byteRange = [off1, len1, off2, len2]
        const [o1, l1, o2, l2] = byteRange;
        const part1 = u8.subarray(o1, o1 + l1);
        const part2 = u8.subarray(o2, o2 + l2);
        const concat = new Uint8Array(part1.length + part2.length);
        concat.set(part1, 0);
        concat.set(part2, part1.length);

        const digest = await crypto.subtle.digest("SHA-256", concat);
        return bufferToHex(digest);
    };

    const extractSignature = async (pdfFile) => {
        try {
            console.log("Starting signature extraction...");

            const arrayBuffer = await pdfFile.arrayBuffer();
            const u8 = new Uint8Array(arrayBuffer);
            const pdfLatin1 = uint8ArrayToLatin1(u8);

            const sigInfo = findByteRangeAndContents(pdfLatin1);

            if (!sigInfo) {
                toast.error("Please provide a signed PDF with a valid ByteRange");
            }

            let sha256ByteRangeHex = null;
            if (sigInfo && sigInfo.byteRange) {
                try {
                    sha256ByteRangeHex = await computeSha256HexForByteRange(u8, sigInfo.byteRange);
                    console.log("Computed sha256 over ByteRange:", sha256ByteRangeHex);
                } catch (e) {
                    console.error("Error computing sha256 over ByteRange:", e);
                }
            }

            let signatureHex = sigInfo && sigInfo.contentsHex ? sigInfo.contentsHex : null;

            if (!signatureHex) {
                toast.warn(
                    "Signature contents not found in hex format; complex parsing not implemented."
                );
            }

            const payload = {
                sha256: sha256ByteRangeHex,
                signature: signatureHex || null,
                rAddress,
            };

            if (id) payload.id = id;

            console.log("Payload ->", payload);

            setVerifying(true);

            const res = await fetch("/api/origo/verify-signature", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            setVerifying(false);
            setVerifyResult(json);

            if (res.ok) {
                toast.success(json.message || "Validation complete");
            } else {
                toast.error(json.message || json.reason || "Validation failed");
            }
        } catch (error) {
            console.error("Error processing the PDF:", error);
            toast.error(`Error extracting the certificate/signature: ${error.message}`);
            setVerifying(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const fetchDomainFromLedger = async (accountAddress) => {
            const { Client } = await import("xrpl");
            const client = new Client("wss://xahau.network");
            client.apiVersion = 1;
            try {
                await client.connect();
                const response = await client.request({
                    command: "account_info",
                    account: accountAddress,
                });

                if (
                    response.result &&
                    response.result.account_data &&
                    response.result.account_data.Domain
                ) {
                    const domainHex = response.result.account_data.Domain;
                    const domain = Buffer.from(domainHex, "hex").toString("ascii");
                    return domain;
                } else {
                    throw new Error("Domain not found for this rAddress");
                }
            } catch (err) {
                throw new Error(`Error fetching domain: ${err.message}`);
            } finally {
                await client.disconnect();
            }
        };

        const getDomain = async () => {
            try {
                const d = await fetchDomainFromLedger(rAddress);
                if (isMounted) {
                    setDomain(d);
                    toast.success("Domain fetched successfully");
                }
            } catch (error) {
                if (isMounted) {
                    toast.error(error.message);
                    console.error("Error:", error.message);
                }
            }
        };

        if (rAddress) getDomain();

        return () => {
            isMounted = false;
        };
    }, [rAddress]);

    useEffect(() => {
        let isMounted = true;
        const fetchXrplToml = async () => {
            try {
                if (!domain) return;
                const response = await fetch(`https://${domain}/.well-known/xahau.toml`);
                if (!response.ok) throw new Error("xahau.toml not found");
                const tomlText = await response.text();
                const parsedToml = parse(tomlText);
                if (isMounted) {
                    setToml(parsedToml);
                    toast.success("Toml fetched successfully");
                }
            } catch (err) {
                if (isMounted) {
                    toast.error(err.message);
                    console.error("Error:", err.message);
                }
            }
        };

        if (domain) fetchXrplToml();

        return () => {
            isMounted = false;
        };
    }, [domain]);

    if (!domain || !toml) return <PageLoader />;

    return (
        <div className="max-w-6xl mx-auto pt-8 px-4">
            <header className="mb-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                            Origo
                        </h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Verify signatures of documents against Xahau trusted domain.
                        </p>
                    </div>

                    <div className="text-right">
                        {id && <div className="text-sm text-slate-500">ID: <span className="font-medium text-slate-700">{id}</span></div>}
                        <div className="mt-2 inline-flex space-x-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 text-xs font-medium text-slate-700">
                                {rAddress || "rAddress not provided"}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="lg:col-span-2 space-y-6">
                    <div className="p-6 bg-white border rounded-lg shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-800 mb-2">Select Document (PDF)</h2>
                        <p className="text-sm text-slate-500 mb-4">Drag and drop or select a signed PDF. We do not store your files.</p>

                        <div className="mb-4">
                            <Dropzone onFileChange={handleFileChange} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-600">
                                {verifying ? (
                                    <span className="inline-flex items-center gap-2">
                                        <svg className="w-4 h-4 animate-spin text-slate-500" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                                            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                        Validating signature...
                                    </span>
                                ) : (
                                    <span className="text-slate-500">Ready to verify.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        {verifyResult ? (
                            <div
                                className={`p-6 border rounded-lg shadow-sm ${verifyResult.valid ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className={`text-lg font-semibold ${verifyResult.valid ? "text-emerald-800" : "text-rose-800"}`}>
                                            Validation Result
                                        </h4>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {verifyResult.valid ? "Signature matches the key declared in the domain." : "Signature does not match the domain key."}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${verifyResult.valid ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
                                            {verifyResult.valid ? "VALID" : "INVALID"}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-700"><strong>Reason:</strong> {verifyResult.reason || verifyResult.message || "—"}</p>
                                        <p className="mt-2 text-xs text-slate-500">Details (diagnosis):</p>
                                    </div>

                                    <div className="text-right">
                                        <button
                                            onClick={() => {
                                                navigator.clipboard?.writeText(JSON.stringify(verifyResult.details || {}, null, 2));
                                            }}
                                            className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-slate-50 hover:bg-slate-100 border"
                                        >
                                            Copy Diagnosis
                                        </button>
                                    </div>
                                </div>

                                <pre className="mt-3 max-h-64 overflow-auto text-xs bg-white border rounded p-3 text-slate-700 whitespace-pre-wrap">
                                    {JSON.stringify(verifyResult.details || {}, null, 2)}
                                </pre>
                            </div>
                        ) : (
                            <div className="p-6 border rounded-lg bg-white shadow-sm text-center text-slate-500">
                                <div className="text-sm">No verification has been done yet.</div>
                                <div className="mt-2 text-xs">Upload a signed PDF to get started.</div>
                            </div>
                        )}
                    </div>
                </section>

                <aside className="space-y-6">
                    <div className="p-6 bg-white border rounded-lg shadow-sm">
                        <h3 className="text-md font-semibold text-slate-800 mb-3">Account Information</h3>

                        <div className="text-sm text-slate-700 space-y-2">
                            <div><span className="font-medium">Domain:</span> <span className="text-slate-600">{domain || "—"}</span></div>
                            <div><span className="font-medium">rAddress:</span> <span className="text-slate-600 break-all">{rAddress || "—"}</span></div>
                        </div>

                        <div className="mt-4">
                            <h4 className="text-sm font-medium text-slate-800 mb-2">Principals</h4>
                            {toml?.PRINCIPALS && toml.PRINCIPALS.length > 0 ? (
                                <ul className="space-y-3">
                                    {toml.PRINCIPALS.map((principal, i) => (
                                        <li key={i} className="p-3 bg-slate-50 border rounded text-sm">
                                            <div className="font-medium text-slate-800">{principal.name || `Principal ${i + 1}`}</div>
                                            {principal.description && <div className="text-xs text-slate-600 mt-1">{principal.description}</div>}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-sm text-slate-500">No principals declared.</div>
                            )}
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default Origo;