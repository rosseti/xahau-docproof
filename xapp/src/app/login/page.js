"use client";

import MetaMaskLogin from "@/components/MetaMaskLogin";
import PageLoader from "@/components/PageLoader";
import XrplSidechainButton from "@/components/XrplSidechainButton";
import { AppContext } from "@/context/AppContext";
import { Lock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";
import { toast } from "react-toastify";
// import { Xumm } from "xumm";

// const xumm = new Xumm(process.env.NEXT_PUBLIC_XAMAN_API_KEY);

const LoginPage = () => {
  const router = useRouter();
  const { account, isLoading } = useContext(AppContext);

  useEffect(() => {
    if (account) {
      toast.success("You are now logged in.");
      router.push("/doc/list");
    }
  }, [account]);

  if (isLoading) return <PageLoader />;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg p-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20 mb-8">
          <div className="flex flex-col items-center mb-8">
            {/* <ShieldCheck className="w-16 h-16 text-blue-400 mt-4" /> */}
            <h1 className="text-3xl font-bold text-white mb-2">
              <img
                src="/logo-xahau-docsign.svg"
                alt="EVM | XSign"
                style={{ width: "300px", height: "150px" }}
              />
            </h1>
            <p className="text-blue-200 text-center">
              Connect your wallet to sign documents securely
            </p>
          </div>

          <div className="mb-8">
            <div className="flex flex-col">
              <MetaMaskLogin />
            </div>
          </div>

          <div className="text-center text-sm text-blue-200 opacity-40">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lock className="w-4 h-4" />
              <span>Secure Connection via Xaman App</span>
            </div>
            <p>Your private keys never leave your wallet</p>
          </div>
        </div>

        {/* <div className="text-center text-sm opacity-80">
          <XrplSidechainButton />
        </div> */}
      </div>
    </div>
  );
};

export default LoginPage;
