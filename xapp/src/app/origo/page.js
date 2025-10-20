"use client";

import React, { useContext, useState } from "react";
import Link from "next/link";
import { AppContext } from "@/context/AppContext";

/**
 * Origo landing + quick domain association UI (Next.js + Tailwind + DaisyUI)
 *
 * - Marketing content about features / How it works
 * - Xaman Wallet quick flow to set Domain on XRPL (AccountSet Domain)
 * - xahau.toml DOCPROOF example with copy button
 *
 * Notes about Xaman Wallet integration:
 * - This code attempts to use window.xaman (common pattern for wallet browser extensions).
 * - Wallet APIs vary. The code attempts a few guarded calls and falls back to showing
 *   the prepared XRPL transaction object for manual signing/submission.
 *
 * IMPORTANT: This component runs client-side only ("use client").
 */

const XAHauTOML_EXAMPLE = `[[DOCPROOF]]
address = "rNqe9wrMJM3D6hwcTtNmYTtfcjbHsHRDSg" # Raddress
id = "429f076e-0b1c-412c-b1b0-c678cc6cb173" # Unique ID v4
desc = "Xahau Docproof" # Account description
pubkey = """
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiGxxxxxxxMFNVCSTJz+xGW3PlPHayRRGTgps
-----END PUBLIC KEY-----
"""`;

export default function Origo() {
  const [domainInput, setDomainInput] = useState("");
  const [accountInput, setAccountInput] = useState("");
  const [assocStatus, setAssocStatus] = useState(null);
  const [assocError, setAssocError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { account, isLoading, xumm } = useContext(AppContext);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setAssocStatus("Copied to clipboard");
      setTimeout(() => setAssocStatus(null), 1500);
    } catch (e) {
      setAssocError("Failed to copy to clipboard");
      setTimeout(() => setAssocError(null), 2000);
    }
  };

  /**
   * Prepare an XRPL AccountSet tx to set Domain.
   * Domain must be ASCII bytes encoded as hex (upper or lower-case).
   */
  const prepareAccountSetDomainTx = (account, domain) => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(domain);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    const tx = {
      TransactionType: "AccountSet",
      Account: account,
      Domain: hex,
    };
    return tx;
  };

  /**
   * Try to use Xaman Wallet (window.xaman) to sign+submit the prepared transaction.
   * This is best-effort: many wallets have different method names -> try common variants.
   */
  const associateDomainWithWallet = async () => {
    setAssocError(null);
    setAssocStatus(null);

    const domain = domainInput.trim();
    const account = accountInput.trim();
    if (!domain) {
      setAssocError("Please enter a domain (e.g. example.com).");
      return;
    }
    if (!account) {
      setAssocError("Please enter your XRPL account (rAddress).");
      return;
    }

    const tx = prepareAccountSetDomainTx(account, domain);

    try {
      setSubmitting(true);

      if (!xumm) {
        // Some wallets inject 'xrpl' or expose a generic provider; inform user and show tx to copy
        setAssocError(
          "Xumm Wallet not detected in this page (window.xumm). You can copy the prepared transaction and sign/submit it with your wallet."
        );
        setAssocStatus(JSON.stringify(tx, null, 2));
        setSubmitting(false);
        return;
      }

      // 3) request with method name (EIP-1193 style for custom provider)
      console.log(typeof xumm.payload.create);
      if (typeof xumm.payload === 'object' && typeof xumm.payload.create === 'function') {
        // try a common RPC style call used by some wallets; this is exploratory
        try {
          const res = await xumm.payload.create({ txjson: tx }).then(payload => {
            setAssocStatus(`Submitted: ${JSON.stringify(payload, null, 2)}`);
            // document.getElementById('payload').innerHTML = JSON.stringify(payload, null, 2)
            xumm.xapp.openSignRequest(payload)
          });
          setAssocStatus(`Submitted: ${JSON.stringify(res)}`);
          setSubmitting(false);
          return;
        } catch (e) {
          console.error("xumm.payload.create failed:", e);
          // ignore and fallback
        }
      }

      // If we reached here, we couldn't call a signer method. Provide tx for manual flow.
      setAssocError(
        "Connected Xaman provider does not expose a known signing method. You may copy the prepared transaction to sign/submit using wallet UI or CLI."
      );
      setAssocStatus(JSON.stringify(tx, null, 2));
      setSubmitting(false);
      return;
    } catch (err) {
      setAssocError(String(err?.message || err));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 relative bg-[#040612]">
      {/* Animated background layers */}
      <div className="origo-bg">
        <div
          className="star-layer slow"
          style={{
            backgroundImage:
              "radial-gradient(#ffffff22 1px, transparent 1px), radial-gradient(#ffffff11 1px, transparent 1px)",
            backgroundPosition: "0 0, 50px 50px",
            backgroundSize: "120px 120px, 200px 200px",
          }}
        />
        <div className="star-layer faster" style={{ backgroundImage: "radial-gradient(#ffffff33 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
        <div className="orb" />
        <div className="ring" />
      </div>

      <main className="max-w-6xl mx-auto px-4 pt-20 pb-24">
        {/* HERO */}
        <header className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="code-badge">Beta</span>
            <span className="text-xs text-slate-400">Launch special</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl hero-title leading-tight">
            Origo — Verify origin. Ensure trust.
          </h1>

          <p className="mt-6 text-lg text-slate-300">
            Verify signatures of documents against Xahau trusted domains. Instantly confirm the source and integrity of PDFs across the decentralized web.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="#get-started" className="btn btn-lg btn-primary">
              Get started — it's free
            </Link>
            <a href="#how" className="btn btn-ghost btn-lg border text-slate-200">
              How it works
            </a>
          </div>
        </header>

        {/* FEATURES */}
        <section id="features" className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-lg shadow">
            <h3 className="font-semibold text-slate-100">Decentralized trust</h3>
            <p className="text-slate-300 mt-2 text-sm">Resolve domain public keys from the Xahau ledger and compare signature certificates to authoritative keys.</p>
          </div>

          <div className="glass-card p-6 rounded-lg shadow">
            <h3 className="font-semibold text-slate-100">Privacy-first</h3>
            <p className="text-slate-300 mt-2 text-sm">We don't store your documents — send the digest and signature blob, or upload a PDF for browser extraction.</p>
          </div>

          <div className="glass-card p-6 rounded-lg shadow">
            <h3 className="font-semibold text-slate-100">DER & PKCS#7 support</h3>
            <p className="text-slate-300 mt-2 text-sm">
              Accepts DER-encoded certificate blobs and PKCS#7 containers (if node-forge is enabled), with detailed diagnostics when extraction is required.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="mt-16 grid md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 p-6 bg-white/3 rounded-lg glass-card">
            <h3 className="text-xl font-semibold text-slate-100">How Origo works</h3>
            <ol className="mt-4 space-y-2 text-slate-300 list-decimal list-inside">
              <li>
                Upload a signed PDF or submit the signature blob (DER / PKCS#7). Origo can extract certificates from the PDF when provided.
              </li>
              <li>Origo looks up the domain listed on the XRPL account (Xahau) and downloads <code>/.well-known/xahau.toml</code>.</li>
              <li>We extract the public key from the signature blob (certificate or PKCS#7) and compare it against the DOCPROOF entry in the toml.</li>
              <li>If the public key matches the domain's declared key, Origo returns a concise "VALID" result; otherwise it returns diagnostics to help you troubleshoot.</li>
            </ol>

            <p className="mt-4 text-slate-400 text-sm">
              Note: Current flow compares public key material. Full cryptographic verification of PDF byte-range signed attributes (CMS SignedData) is supported when PKCS#7 extraction is available and the PDF byte-range digest is provided.
            </p>
          </div>

          <div className="p-6 bg-white/3 rounded-lg glass-card">
            <h4 className="font-semibold text-slate-100">Ideal for</h4>
            <ul className="mt-3 text-slate-300 space-y-2 text-sm">
              <li>Legal & compliance teams</li>
              <li>Document workflows & audits</li>
              <li>Decentralized organizations</li>
            </ul>
          </div>
        </section>

        {/* XAMAN WALLET / DOMAIN ASSOCIATE */}
        <section id="xaman" className="mt-16 grid md:grid-cols-2 gap-6 items-start">
          <div className="p-6 bg-white/3 rounded-lg glass-card">
            <h3 className="text-xl font-semibold text-slate-100">Associate a domain to your XRPL account (quick tx)</h3>

            <p className="mt-2 text-slate-300 text-sm">
              Origo can read the <code>Domain</code> field from XRPL account root. Use this quick flow to set the domain for your account using Xaman Wallet (AccountSet Domain).
            </p>

            <div className="mt-4 space-y-3">
              <label className="text-xs text-slate-300">Domain (e.g. example.com)</label>
              <input
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="example.com"
                className="input input-bordered w-full bg-white/5 text-slate-100"
              />

              <label className="text-xs text-slate-300">Your XRPL account (rAddress)</label>
              <input
                value={accountInput}
                onChange={(e) => setAccountInput(e.target.value)}
                placeholder="rPT... (your account)"
                className="input input-bordered w-full bg-white/5 text-slate-100"
              />

              <div className="flex items-center gap-3">
                {account && (<button
                  onClick={associateDomainWithWallet}
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Associate domain to my account (Xaman Wallet)"}
                </button>)}

                <button
                  onClick={() => {
                    // copy a prepared tx to clipboard for manual use
                    if (!domainInput || !accountInput) {
                      setAssocError("Enter both domain and account to prepare tx.");
                      setTimeout(() => setAssocError(null), 1800);
                      return;
                    }
                    const tx = prepareAccountSetDomainTx(accountInput.trim(), domainInput.trim());
                    copyToClipboard(JSON.stringify(tx, null, 2));
                  }}
                  className="btn btn-ghost"
                >
                  Copy prepared TX (manual)
                </button>
              </div>

              {assocStatus && (
                <div className="mt-2 text-sm text-emerald-300">
                  <strong>Status:</strong> <span className="font-mono text-xs">{assocStatus}</span>
                </div>
              )}
              {assocError && (
                <div className="mt-2 text-sm text-rose-300">
                  <strong>Error:</strong> <span>{assocError}</span>
                </div>
              )}

              <div className="mt-3 text-xs text-slate-400">
                If you have Xaman Wallet installed and connected, the page will attempt to request a signature/submission from it. If that fails, you can copy the prepared transaction and sign/submit it manually using your wallet or CLI.
              </div>
            </div>
          </div>

          <div className="p-6 bg-white/3 rounded-lg glass-card">
            <h4 className="font-semibold text-slate-100">Why set Domain on XRPL?</h4>
            <p className="text-slate-300 text-sm mt-2">
              Setting the Domain field on your XRPL account lets Origo (and other services) fetch <code>https://&lt;your-domain&gt;/.well-known/xahau.toml</code> to discover your DOCPROOF entries and public keys. This decentralizes trust and allows verifiers to confirm the origin of documents.
            </p>

            <div className="mt-4">
              <h5 className="text-sm font-semibold text-slate-100">Security notes</h5>
              <ul className="text-slate-400 text-xs mt-2 space-y-2">
                <li>AccountSet transactions change account fields — sign them only with your wallet.</li>
                <li>Domain is stored on ledger as hex of ASCII; Origo converts and fetches <code>/.well-known/xahau.toml</code>.</li>
                <li>Double-check domain ownership before submitting tx on mainnet.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* xahau.toml guide */}
        <section id="toml" className="mt-16">
          <div className="p-6 bg-white/3 rounded-lg glass-card">
            <h3 className="text-xl font-semibold text-slate-100">How to publish your xahau.toml (.well-known/xahau.toml)</h3>

            <p className="mt-2 text-slate-300 text-sm">
              Add a <code>/.well-known/xahau.toml</code> file on your domain with one or more <code>[[DOCPROOF]]</code> entries to declare which public keys are authoritative for document proofs.
            </p>

            <div className="mt-4">
              <div className="text-xs text-slate-300 mb-2">Example <code>xahau.toml</code> (copy below):</div>
              <pre className="bg-black/20 p-4 rounded text-xs text-slate-200 overflow-auto">
                {XAHauTOML_EXAMPLE}
              </pre>

              <div className="mt-3 flex gap-3">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => copyToClipboard(XAHauTOML_EXAMPLE)}
                >
                  Copy example toml
                </button>
                <a
                  className="btn btn-sm btn-ghost"
                  href="https://xrpl.org/docs/references/xrp-ledger-toml"
                  target="_blank"
                  rel="noreferrer"
                >
                  Toml docs (example)
                </a>
              </div>

              <div className="mt-4 text-slate-400 text-xs">
                Important: Make sure the <code>pubkey</code> contains the public key (PEM) you want verifiers to match. Origo will attempt to parse PEM and DER forms from the signature blob to compare public key bytes.
              </div>
            </div>
          </div>
        </section>

        {/* Get started / CTA */}
        <section id="get-started" className="mt-16">
          <div className="p-8 bg-gradient-to-br from-origo-400 to-origo-600 rounded-lg shadow-lg text-slate-900">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-2xl font-semibold">Get started with Origo</h3>
              <p className="mt-2 text-slate-900/80">Set your domain on XRPL and publish <code>xahau.toml</code> to enable trusted document verification.</p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="#xaman" className="btn btn-lg btn-neutral">
                  Associate domain (Xaman Wallet)
                </Link>
                <a href="#toml" className="btn btn-ghost btn-lg">
                  Learn how to publish toml
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
