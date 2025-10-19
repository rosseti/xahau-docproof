"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import React, { useState } from "react";
import Link from "next/link";

/**
 * Landing page for Origo
 * Marketing oriented. No verification logic here.
 */

const Origo = () => {

  return (
    <div className="min-h-screen text-slate-100 relative bg-[#040612]">
      {/* Animated background layers */}
      <div className="origo-bg">
        <div className="star-layer slow" style={{ backgroundImage: "radial-gradient(#ffffff22 1px, transparent 1px), radial-gradient(#ffffff11 1px, transparent 1px)", backgroundPosition: "0 0, 50px 50px", backgroundSize: "120px 120px, 200px 200px" }} />
        <div className="star-layer faster" style={{ backgroundImage: "radial-gradient(#ffffff33 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
        <div className="orb" />
        <div className="ring" />
      </div>

      <main className="max-w-6xl mx-auto px-4 pt-20 pb-24">
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
            <Link href="#get-started" className="btn btn-lg btn-primary">Get started — it's free</Link>
            <a href="#how" className="btn btn-ghost btn-lg border text-slate-200">How it works</a>
          </div>
        </header>

        {/* Features */}
        <section id="features" className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-lg shadow">
            <h3 className="font-semibold text-slate-100">Decentralized Trust</h3>
            <p className="text-slate-300 mt-2 text-sm">Resolve domain pubkeys from Xahau ledger and verify document signatures against the authoritative source.</p>
          </div>
          <div className="glass-card p-6 rounded-lg shadow">
            <h3 className="font-semibold text-slate-100">Privacy First</h3>
            <p className="text-slate-300 mt-2 text-sm">No documents are stored. You can send only the signature blob and digest for verification when appropriate.</p>
          </div>
          <div className="glass-card p-6 rounded-lg shadow">
            <h3 className="font-semibold text-slate-100">Multi-Format Support</h3>
            <p className="text-slate-300 mt-2 text-sm">Supports certificate or DER-based signature blobs, with diagnostics when extraction is required.</p>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mt-16 grid md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 p-6 bg-white/3 rounded-lg glass-card">
            <h3 className="text-xl font-semibold text-slate-100">How Origo works</h3>
            <ol className="mt-4 space-y-2 text-slate-300">
              <li><strong>1.</strong> You upload a signed PDF or submit signature data.</li>
              <li><strong>2.</strong> Origo extracts signature/certificate data and retrieves the domain's public key from Xahau ledger.</li>
              <li><strong>3.</strong> We compare public key material and return a concise verification result with diagnostics.</li>
            </ol>
          </div>

          <div className="p-6 bg-white/3 rounded-lg glass-card">
            <h4 className="font-semibold text-slate-100">Perfect for</h4>
            <ul className="mt-3 text-slate-300 space-y-8 text-sm">
              <li>Legal teams validating origin</li>
              <li>Organizations requiring auditability</li>
              <li>Decentralized networks & builders</li>
            </ul>
          </div>
        </section>

        {/* Pricing 
        <section id="pricing" className="mt-16">
          <h3 className="text-2xl font-semibold text-slate-100">Pricing</h3>
          <p className="text-slate-400 mt-2">Simple pricing to get started. No surprise fees.</p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white/3 rounded-lg glass-card">
              <div className="text-sm text-slate-300">Starter</div>
              <div className="mt-3 text-3xl font-bold text-slate-100">$0 <span className="text-sm text-slate-400">/ month</span></div>
              <ul className="mt-4 text-slate-300 space-y-2 text-sm">
                <li>Up to 500 verifications / month</li>
                <li>Email support</li>
              </ul>
              <div className="mt-6">
                <a href="#get-started" className="btn btn-block btn-outline btn-neutral">Get started</a>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-origo-400 to-origo-600 rounded-lg shadow-lg text-slate-900">
              <div className="text-sm">Pro</div>
              <div className="mt-3 text-3xl font-bold">$49 <span className="text-sm text-slate-900">/ month</span></div>
              <ul className="mt-4 text-slate-900 space-y-2 text-sm">
                <li>Up to 50k verifications / month</li>
                <li>Priority support</li>
                <li>Audit logs & team accounts</li>
              </ul>
              <div className="mt-6">
                <a href="#get-started" className="btn btn-block btn-accent">Start free trial</a>
              </div>
            </div>

            <div className="p-6 bg-white/3 rounded-lg glass-card">
              <div className="text-sm">Enterprise</div>
              <div className="mt-3 text-3xl font-bold text-slate-100">Custom</div>
              <ul className="mt-4 text-slate-300 space-y-2 text-sm">
                <li>Unlimited verifications</li>
                <li>On-premise & SLAs</li>
              </ul>
              <div className="mt-6">
                <a href="#contact" className="btn btn-block btn-outline btn-neutral">Contact sales</a>
              </div>
            </div>
          </div>
        </section> */}

      </main>
    </div>
  );
};

export default Origo;