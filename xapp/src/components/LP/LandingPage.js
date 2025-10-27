import {
  Bell,
  ChevronRight,
  Fingerprint,
  Lock,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { FiSend } from "react-icons/fi";

import Footer from "./Footer";
import OrigoSection from "./OrigoSection";

const LandingPage = () => {
  const router = useRouter();
  return (
    <div className="bg-white text-gray-900">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img
              src="/app-logo-horizontal-dark.svg"
              alt="Xaman Logo"
              width={160}
            />
          </div>
          <nav className="flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-gray-600 hover:text-gray-900"
            >
              How it Works
            </a>
            <button
              onClick={() => router.push("/login")}
              className="bg-blue-600 font-sans text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Get Started
            </button>
          </nav>
        </div>
      </header>

      <main className="pt-10">
        {/* Hero Section */}

        <section
          id="hero"
          className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-200 via-blue-300 to-blue-400"></div>
            <div className="absolute -top-1/4 -right-1/4 w-[50%] h-[50%] bg-blue-300/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-1/4 -left-1/4 w-[50%] h-[50%] bg-indigo-300/20 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto py-24 px-4 grid md:grid-cols-2 gap-16 items-center relative z-10">
            <div className="space-y-6">
              <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm tracking-wide">
                Powered by Xahau Blockchain
              </div>
              <h1 className="text-5xl font-sans font-extrabold tracking-tight text-gray-900 mb-6">
                Secure Document Signing on Blockchain Network
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Transform document workflows with cryptographically sealed,
                instantly verifiable digital signatures powered by cutting-edge
                blockchain technology.
              </p>
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => router.push("/login")}
                  className="btn btn-primary"
                >
                  Get Started <ChevronRight className="ml-2" />
                </button>
                <a href="/XahauDocproof-Whitepaper.pdf" className="btn btn-outlined" target="_blank">
                  Download Whitepaper
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" size="18" class="lucide lucide-file-digit-icon"><rect width="4" height="6" x="2" y="12" rx="2"></rect><path d="M14 2v6h6"></path><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path><path d="M10 12h2v6"></path><path d="M10 18h4"></path></svg>
                </a>
              </div>
            </div>
            <div className="relative">
              <div
                style={{
                  position: "relative",
                  paddingBottom: "56.25%",
                  height: 0,
                }}
              >
                <iframe
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                  }}
                  src="https://www.youtube.com/embed/vM8IWlYkHPA?si=MPz20vGHmKMmBVRU&amp;rel=0&amp;controls=1&amp;showinfo=0&amp;autoplay=1&amp;mute=1"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white shadow-lg rounded-lg">
              <ShieldCheck className="mx-auto mb-4 text-blue-600" size={60} />
              <h3 className="text-xl  font-bold mb-2">Blockchain Security</h3>
              <p className="">
                Cryptographically sealed documents with Xahau's robust
                blockchain infrastructure.
              </p>
            </div>
            <div className="text-center p-6 bg-white shadow-lg rounded-lg">
              <Fingerprint className="mx-auto mb-4 text-green-600" size={60} />
              <h3 className="text-xl  font-bold mb-2">Digital Signatures</h3>
              <p className="">
                Unique cryptographic signatures that guarantee document
                authenticity.
              </p>
            </div>
            <div className="text-center p-6 bg-white shadow-lg rounded-lg">
              <Lock className="mx-auto mb-4 text-purple-600" size={60} />
              <h3 className="text-xl  font-bold mb-2">Tamper-Proof</h3>
              <p className="">
                Immutable record preventing unauthorized modifications.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-16 text-gray-800">
              How DocProof Works
            </h2>
            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  Icon: null,
                  iconSrc: "/xaman-app-icon-tick.svg",
                  color: "text-purple-600",
                  title: "1. Authenticate with Xaman",
                  description:
                    "Use Xaman App Wallet for secure, blockchain-based authentication.",
                  badge: "New",
                },
                {
                  Icon: Upload,
                  color: "text-blue-500",
                  title: "2. Upload Document",
                  description: "Securely upload your document to the platform.",
                },
                {
                  Icon: FiSend,
                  color: "text-green-500",
                  title: "3. Mark Stakeholders",
                  description:
                    "Mark the parties involved in the document signing process by email.",
                },
                {
                  Icon: Fingerprint,
                  color: "text-purple-500",
                  title: "4. Stakeholders Sign",
                  description:
                    "Securely sign the document with Xaman App Wallet.",
                },
                {
                  Icon: null,
                  iconSrc: "/xahau-icon-yellow.svg",
                  color: "text-yellow-500",
                  title: "5. Immutable Record",
                  description:
                    "Document and signature permanently recorded on Xahau network.",
                },
                {
                  Icon: Bell,
                  color: "text-indigo-500",
                  title: "6. Notifications",
                  description: "Get notified when the document is signed.",
                },
              ].map((step, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                >
                  {step.Icon ? (
                    <step.Icon
                      className={`mx-auto mb-4 ${step.color}`}
                      size={50}
                    />
                  ) : (
                    <img
                      src={step.iconSrc}
                      alt="Step Icon"
                      className="mx-auto mb-4"
                      style={{ width: "50px", height: "50px" }}
                    />
                  )}
                  <h3 className="text-xl font-bold mb-2 text-gray-800">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 font-normal">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <OrigoSection />

        {/* CTA Section */}
        <section className="relative py-24 px-4 overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-center">
          {/* Efeitos de fundo */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-1/2 -right-1/2 w-[150%] h-[150%] bg-white/5 rotate-45 blur-3xl"></div>
            <div className="absolute -bottom-1/2 -left-1/2 w-[150%] h-[150%] bg-white/10 rotate-45 blur-3xl"></div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-5xl font-sans font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-blue-200"
            >
              Ready to Secure Your Documents?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-xl mb-10 text-blue-100 max-w-2xl mx-auto"
            >
              Join the future of document authentication with blockchain-powered
              security
            </motion.p>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 10,
              }}
            >
              <button
                onClick={() => router.push("/login")}
                className="group relative px-12 py-4 rounded-full text-lg font-bold 
          bg-white text-blue-600 
          hover:bg-blue-50 
          transition duration-300 
          shadow-2xl hover:shadow-blue-500/50
          flex items-center justify-center mx-auto
          overflow-hidden"
              >
                <span className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                Get Started Now
                <ChevronRight className="ml-2 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>

            <div className="mt-10 flex justify-center items-center space-x-4 opacity-70">
              <Lock size={24} />
              <span className="text-sm">256-bit Encryption</span>
              <div className="w-px h-6 bg-white/30 mx-4"></div>
              <Shield size={24} />
              <span className="text-sm">Blockchain Verified</span>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </div>
  );
};

export default LandingPage;
