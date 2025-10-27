"use client";

import PageLoader from "@/components/PageLoader";
import XamanWalletLogin from "@/components/XamanWalletLogin";
import { AppContext } from "@/context/AppContext";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";
import { toast } from "react-toastify";

const isSafeRedirect = (url) => {
  // Only allow relative paths, not protocol or domain
  try {
    const u = new URL(url, 'http://dummy');
    return u.origin === 'http://dummy' && url.startsWith('/');
  } catch {
    return false;
  }
};

const LoginPage = () => {
  const router = useRouter();
  const { account, isLoading, error, setError } = useContext(AppContext);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");

    if (account) {
      toast.success("You are now logged in.");
      if (redirect && isSafeRedirect(redirect)) {
        router.push(redirect);
      } else {
        router.push("/doc/list");
      }
    }

    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [account, error, router]);

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
            <h1 className="text-3xl font-bold text-white mb-2">
              <img
                src="/app-logo-white.svg"
                alt="Xahau | DocProof"
                style={{ width: "300px", height: "150px" }}
              />
            </h1>
            <p className="text-blue-200 text-center">
              Connect your wallet to sign documents securely
            </p>
          </div>

          <div className="mb-8">
            <div className="flex flex-col">
              <XamanWalletLogin />
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
      </div>
    </div>
  );
};

export default LoginPage;
