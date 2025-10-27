"use client";

import { AppContext } from "@/context/AppContext";
import { Key, Search, Shield, UserCircle } from "lucide-react";
import Link from "next/link";
import { useContext, useState } from "react";

const XAHAU_TOML_EXAMPLE = `[[DOCPROOF]]
id = "429f076e-0b1c-412c-b1b0-c678cc6cb173" # UUIDv4 - https://www.uuidgenerator.net/version4
# UUIDv4 unique identifier for this DOCPROOF entry.
# Useful when an organization has multiple pubkeys for the same wallet,
# enabling verifiers to distinguish between them without creating multiple wallets.
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
            The new standard for digital proof
          </div>

          <p className="text-xl text-indigo-200 font-semibold mb-2">
            Sign, verify, and audit.<br />All without intermediaries.
            Real trust, cryptographically proven.
          </p>

          <p className="text-lg text-slate-200 mb-6">
            From standalone certificates to blockchain wallets,
            Origo bridges traditional compliance and decentralized identity —
            making document authenticity verifiable in seconds.
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
            Trusted by legal, web3, and enterprise teams.
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
              <strong className="mr-2">Origo turns every signature into a source of truth.</strong> 
              Sign with your existing certificate or your Xaman Wallet — Origo verifies it instantly against decentralized domains, delivering verifiable, audit-ready trust.
              No uploads. No lock-in. Just proof.
            </p>

            <ol className="mt-4 space-y-2 text-slate-300 list-decimal list-inside text-base">
              <li>
                <strong className="mr-2">Sign your way:</strong> 
                Use your traditional PFX/PKCS#7 certificate or sign natively with your Xaman Wallet through Xahau Docproof Origo. Both paths lead to verifiable authenticity.
              </li>
              <li>
                <strong className="mr-2">Decentralized lookup:</strong>
                Origo retrieves domain-linked identities and public keys directly from the XRPL ledger
                (<code>/.well-known/xahau.toml</code>) — removing intermediaries and ensuring genuine trust.
              </li>
              <li>
                <strong className="mr-2">Instant verification:</strong>
                Origo extracts the signature data, matches the public key, and returns a tamper-proof verdict:
                <strong className="text-green-400">VALID</strong> or diagnostic insights in seconds.
              </li>
            </ol>

            <p className="mt-4 text-slate-400 text-sm">
              <strong className="mr-2">Standalone or Wallet-based:</strong>
              Origo proves both origin and integrity of your documents — entirely cryptographically.
              <span className="block mt-2">
                Supports full PDF byte-range validation using PKCS#7 signature and digest data.
              </span>
            </p>
          </div>
        </section>

        <section id="testimonial" className="mt-20 max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-[#2a2f4a]/40 to-[#1b1e2f]/50 rounded-3xl p-10 backdrop-blur-md border border-white/10 shadow-lg">
            <svg className="mx-auto mb-4 w-10 h-10 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7.17 6A5.001 5.001 0 0 0 2 11v4a1 1 0 0 0 1 1h4a5.001 5.001 0 0 0 5-5V7a1 1 0 0 0-1-1H7.17zm10 0A5.001 5.001 0 0 0 12 11v4a1 1 0 0 0 1 1h4a5.001 5.001 0 0 0 5-5V7a1 1 0 0 0-1-1h-4.83z" />
            </svg>

            <p className="text-lg text-gray-300 italic leading-relaxed mb-6">
              “The work I am doing is my way of giving back to the accounting community.
              Small businesses can now operate and make payments with confidence.
              <strong>Xaman Wallet</strong>, <strong>FrontAccounting</strong>, and <strong>Origo</strong> make this possible.”
            </p>

            <div>
              <p className="text-white font-semibold text-sm">
                <a href="https://www.linkedin.com/in/leslie-proud-75abb788/" target="_blank">
                  Leslie Proud
                </a>
              </p>
              <p className="text-gray-400 text-xs">AuditsLtd — <a href="https://iaudits.com.au" target="_blank">iaudits.com.au</a></p>
            </div>
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
                <span className="text-xs text-slate-300 mt-1 text-center">
                  Protect every agreement with verifiable cryptographic signatures — compliant, tamper-proof, and fully auditable.
                </span>
              </div>

              <div className="flex flex-col items-center bg-white/10 rounded-lg p-4 shadow-sm h-full">
                <span className="text-2xl">📄</span>
                <span className="mt-2 font-semibold text-slate-100">Workflows & Audits</span>
                <span className="text-xs text-slate-300 mt-1 text-center">
                  Automate document flows, validate authenticity instantly, and keep a provable audit trail across teams.
                </span>
              </div>

              <div className="flex flex-col items-center bg-white/10 rounded-lg p-4 shadow-sm h-full">
                <span className="text-2xl">🌐</span>
                <span className="mt-2 font-semibold text-slate-100">Decentralized Orgs</span>
                <span className="text-xs text-slate-300 mt-1 text-center">
                  Empower DAOs and Web3 projects to issue, sign, and verify documents using blockchain-based trust.
                </span>
              </div>

              <div className="flex flex-col items-center bg-white/10 rounded-lg p-4 shadow-sm h-full">
                <span className="text-2xl">🔗</span>
                <span className="mt-2 font-semibold text-slate-100">Modern Teams</span>
                <span className="text-xs text-slate-300 mt-1 text-center">
                  Evolve from static PFX signatures to wallet-based signing — simpler, safer, and future-ready.
                </span>
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
                Important: For standalone model, make sure the <code>pubkey</code> contains the public key (PEM) you want verifiers to match. Origo will attempt to parse PEM and DER forms from the signature blob to compare public key bytes.

                <div className="mt-2">
                  <strong>About <code>id</code>:</strong> Each <code>[[DOCPROOF]]</code> entry has an <code>id</code> field (UUIDv4) that uniquely identifies it. This lets organizations use multiple public keys with a single wallet, making verification easier without managing multiple accounts.
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Get started / CTA */}
        <section id="get-started" className="mt-14">
          <div className="p-8 bg-gradient-to-br from-[#232946] to-[#16161a] rounded-xl shadow-2xl text-white border border-[#232946]/40">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-3xl font-extrabold mb-2">Turn signatures into verifiable trust.</h3>
              <p className="mt-2 text-lg text-slate-200">
                Origo lets you prove where a document came from — and that it hasn’t changed.
                Sign, verify, and audit with blockchain-grade assurance, whether you’re using a wallet or your own certificate.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="#xaman" className="btn btn-lg btn-primary shadow-lg">
                  Start with Xaman Wallet
                </Link>
                <Link href="#toml" className="btn btn-lg btn-outline border-white text-white hover:bg-white/10">
                  Publish your xahau.toml
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
