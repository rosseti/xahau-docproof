"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function OrigoSection() {
    return (
        <section className="relative py-20 bg-gradient-to-b from-gray-950 to-black text-white overflow-hidden">
            <div className="max-w-5xl mx-auto px-6 text-center">
                <motion.h2
                    className="text-4xl md:text-5xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    Beyond On-Chain: Meet <span className="text-blue-400">Origo</span>
                </motion.h2>

                <motion.p
                    className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                >
                    Origo extends Docproof’s on-chain verification model into the off-chain world —
                    enabling digital attestation and authentication without uploading documents
                    or relying on centralized storage.
                </motion.p>

                <motion.div
                    className="grid md:grid-cols-3 gap-8 text-left md:text-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                >
                    <div>
                        <h3 className="text-xl font-medium mb-2 text-blue-400">Zero-Knowledge Validation</h3>
                        <p className="text-gray-400">
                            Prove authenticity and integrity without exposing private data.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-xl font-medium mb-2 text-blue-400">Domain-Based Identity</h3>
                        <p className="text-gray-400">
                            Signatures are verifiable and tied to authoritative domains.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-xl font-medium mb-2 text-blue-400">Seamless Integration</h3>
                        <p className="text-gray-400">
                            Bring decentralized authentication to your system without new infrastructure.
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    className="mt-12"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <Link
                        href="/origo"
                        className="inline-block px-8 py-4 bg-blue-500 hover:bg-blue-600 rounded-2xl text-lg font-semibold transition-all shadow-lg shadow-blue-500/20"
                    >
                        Discover Origo →
                    </Link>
                    <p className="text-sm text-gray-500 mt-4">
                        A new standard for off-chain authenticity.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
