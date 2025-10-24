"use client";

import React, { useContext, useState } from "react";
import Link from "next/link";
import { AppContext } from "@/context/AppContext";
import { Shield } from "lucide-react";
import { Key } from "lucide-react";
import { Search } from "lucide-react";
import { SiTeamspeak } from "react-icons/si";
import { UserSquare } from "lucide-react";
import { UserCircle } from "lucide-react";

const XAHAU_TOML_EXAMPLE = `[[DOCPROOF]]
id = "429f076e-0b1c-412c-b1b0-c678cc6cb173" # UUIDv4 - https://www.uuidgenerator.net/version4
address = "rNqe9wrMJM3D6hwcTtNmYTtfcjbHsHRDSg" # rAddress of the Xahau Account
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
  const { account, xumm } = useContext(AppContext);

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
        setAssocError(
          "Xumm Wallet not detected in this page (window.xumm). You can copy the prepared transaction and sign/submit it with your wallet."
        );
        setAssocStatus(JSON.stringify(tx, null, 2));
        setSubmitting(false);
        return;
      }

      try {
        const res = await xumm.payload.create({ txjson: tx }).then(payload => {
          setAssocStatus(`Submitted: ${JSON.stringify(payload, null, 2)}`);
          xumm.xapp.openSignRequest(payload)
        });
        setAssocStatus(`Submitted: ${JSON.stringify(res)}`);
        setSubmitting(false);
        return;
      } catch (e) {
        console.error("xumm.payload.create failed:", e);
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
    <div className="min-h-screen text-slate-100 relative bg-gradient-to-br from-[#1a237e] via-[#512da8] to-[#040612]">
      
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a237e88] via-[#512da888] to-[#040612ee]" />
        <div className="star-layer slow" style={{ backgroundImage: "radial-gradient(#ffffff22 1px, transparent 1px)", backgroundSize: "120px 120px" }} />
        <div className="star-layer faster" style={{ backgroundImage: "radial-gradient(#ffffff33 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
      </div>

      <main className="max-w-6xl mx-auto px-4 pt-24 pb-24">
        {/* HERO */}
        <header className="text-center max-w-3xl mx-auto pt-8 pb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="code-badge">Beta</span>
          </div>

          <h1 className="text-5xl font-extrabold text-white mb-2 drop-shadow-lg">
            Meet Origo
          </h1>
          <div className="text-2xl font-semibold text-indigo-100 mb-4 drop-shadow-sm">
            The new standard for document trust
          </div>

          <p className="text-xl text-indigo-200 font-semibold mb-2">
            Instantly verify, sign, and audit documents — no barriers, no lock-in.
          </p>

          <p className="text-lg text-slate-200 mb-6">
            Origo empowers you to prove authenticity and integrity for any document, from legacy certificates to blockchain wallets. Trust, verified in seconds.
          </p>

          <div className="flex justify-center gap-4">
            <Link href="/origo/sign" className="btn btn-lg btn-primary shadow-lg">
              Get Started Free
            </Link>
            <Link href="#how" className="btn btn-lg btn-ghost border text-white">
              See How It Works
            </Link>
          </div>
          <p className="mt-4 text-slate-400 text-sm">
            Built for legal, web3, and modern teams.
          </p>
        </header>

        {/* FEATURES */}
        <section id="features" className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-lg shadow flex flex-col items-center">
            <Shield className="mb-3" size={48} color="#ffffff" alt="Decentralized Trust" />
            <h3 className="font-semibold text-slate-100">Decentralized Trust</h3>
            <p className="text-slate-300 mt-2 text-sm text-center">Resolve domain public keys from the Xahau ledger and compare signature certificates to authoritative keys. No middlemen, no walled gardens.</p>
          </div>

          <div className="glass-card p-6 rounded-lg shadow flex flex-col items-center">
            <Key className="mb-3" size={48} color="#ffffff" alt="Privacy-First" />
            <h3 className="font-semibold text-slate-100">Privacy-First</h3>
            <p className="text-slate-300 mt-2 text-sm text-center">We never store your documents. Send only the digest and signature blob, or upload a PDF for secure browser extraction.</p>
          </div>

          <div className="glass-card p-6 rounded-lg shadow flex flex-col items-center">
            <Search className="mb-3" size={48} color="#ffffff" alt="Auditability" />
            <h3 className="font-semibold text-slate-100">Actionable Diagnostics & Auditability</h3>
            <p className="text-slate-300 mt-2 text-sm text-center">
              Get detailed, actionable verification reports — parse errors, certificate fingerprints and extraction logs — so you can fix issues and keep auditable records.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="mt-14 grid gap-6 items-start">
          <div className="md:col-span-2 p-6 bg-white/3 rounded-lg glass-card">
            <h3 className="text-xl font-semibold text-slate-100">How Origo Works</h3>
            <p className="mt-2 text-slate-300 text-lg">
              <strong>Origo unlocks trust for every document.</strong> Sign with your legacy certificate or Xaman Wallet, verify instantly against decentralized domains, and get audit-ready results. No vendor lock-in. No barriers.
            </p>

            <ol className="mt-4 space-y-2 text-slate-300 list-decimal list-inside text-base">
              <li>
                <strong>Sign your way:</strong> Use your existing digital certificate (PFX/PKCS#7) or sign directly with your Xaman Wallet using Xahau Docproof.
              </li>
              <li>
                <strong>Decentralized lookup:</strong> Origo fetches your domain and public keys from the XRPL ledger (<code>/.well-known/xahau.toml</code>), ensuring authenticity.
              </li>
              <li>
                <strong>Seamless verification:</strong> Origo extracts and matches your public key against trusted DOCPROOF entries. Instant “VALID” verdict or actionable diagnostics.
              </li>
            </ol>

            <p className="mt-4 text-slate-400 text-sm">
              <strong>Legacy or future-proof:</strong> Origo empowers legal teams, DAOs, and innovators to prove document origin and integrity with confidence.<br/>
              <span className="block mt-2">Full cryptographic verification of PDF byte-range signed attributes is supported when PKCS#7 extraction is available and the PDF byte-range digest is provided.</span>
            </p>
          </div>
        </section>

        {/* WHO IS ORIGO FOR */}
        <section id="who" className="mt-14">
          <div className="p-6 bg-white/3 rounded-lg glass-card flex flex-col items-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <UserCircle className="text-slate-100" size={32} />
              <span className="text-lg font-bold text-slate-100 tracking-wide">Who is Origo for?</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-2">
              <div className="flex flex-col items-center bg-white/10 rounded-lg p-4 shadow-sm h-full">
                <span className="text-2xl">⚖️</span>
                <span className="mt-2 font-semibold text-slate-100">Legal & Compliance</span>
                <span className="text-xs text-slate-300 mt-1 text-center">Reliable signature validation for contracts, policies, and sensitive docs.</span>
              </div>
              <div className="flex flex-col items-center bg-white/10 rounded-lg p-4 shadow-sm h-full">
                <span className="text-2xl">📄</span>
                <span className="mt-2 font-semibold text-slate-100">Workflows & Audits</span>
                <span className="text-xs text-slate-300 mt-1 text-center">Automate document flows, ensure authenticity, and keep audit trails.</span>
              </div>
              <div className="flex flex-col items-center bg-white/10 rounded-lg p-4 shadow-sm h-full">
                <span className="text-2xl">🌐</span>
                <span className="mt-2 font-semibold text-slate-100">Decentralized Orgs</span>
                <span className="text-xs text-slate-300 mt-1 text-center">Empower DAOs and web3 teams with blockchain-based trust.</span>
              </div>
              <div className="flex flex-col items-center bg-white/10 rounded-lg p-4 shadow-sm h-full">
                <span className="text-2xl">🔗</span>
                <span className="mt-2 font-semibold text-slate-100">Modern Teams</span>
                <span className="text-xs text-slate-300 mt-1 text-center">Transition from legacy PFX signing to wallet-based digital signatures.</span>
              </div>
            </div>
          </div>
        </section>


        {/* XAMAN WALLET / DOMAIN ASSOCIATE */}
        <section id="xaman" className="mt-14 grid md:grid-cols-2 gap-6 items-start">
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
                value={accountInput || account || ""}
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
                  {submitting ? "Submitting..." : "Associate domain (Xaman)"}
                </button>)}

                <button
                  onClick={() => {
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
        <section id="toml" className="mt-14">
          <div className="p-6 bg-white/3 rounded-lg glass-card">
            <h3 className="text-xl font-semibold text-slate-100">How to publish your xahau.toml (.well-known/xahau.toml)</h3>

            <p className="mt-2 text-slate-300 text-sm">
              Add a <code>/.well-known/xahau.toml</code> file on your domain with one or more <code>[[DOCPROOF]]</code> entries to declare which public keys are authoritative for document proofs.
            </p>

            <div className="mt-4">
              <div className="text-xs text-slate-300 mb-2">Example <code>xahau.toml</code> (copy below):</div>
              <pre className="bg-black/20 p-4 rounded text-xs text-slate-200 overflow-auto">
                {XAHAU_TOML_EXAMPLE}
              </pre>

              <div className="mt-3 flex gap-3">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => copyToClipboard(XAHAU_TOML_EXAMPLE)}
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
                Important: For legacy model, make sure the <code>pubkey</code> contains the public key (PEM) you want verifiers to match. Origo will attempt to parse PEM and DER forms from the signature blob to compare public key bytes.
              </div>
            </div>
          </div>
        </section>

        {/* Get started / CTA */}
        <section id="get-started" className="mt-14">
          <div className="p-8 bg-gradient-to-br from-[#232946] to-[#16161a] rounded-xl shadow-2xl text-white border border-[#232946]/40">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-3xl font-extrabold mb-2">Ready to unlock trusted documents?</h3>
              <p className="mt-2 text-lg text-slate-200">Start verifying, signing, and auditing with Origo — the bridge between legacy and the decentralized future. No risk, no lock-in, just trust.</p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="#xaman" className="btn btn-lg btn-primary shadow-lg">
                  Start Now with Xaman Wallet
                </Link>
                <Link href="#toml" className="btn btn-lg btn-outline border-white text-white hover:bg-white/10">
                  How to publish your xahau.toml
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
