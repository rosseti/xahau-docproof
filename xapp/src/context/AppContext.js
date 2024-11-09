// src/context/AppContext.js

"use client";

import { createContext, useState, useEffect } from "react";
// import { doLogin } from "@/services/Web3Service";
import { useRouter } from "next/navigation";
import { Xumm } from "xumm";
import { toast } from "react-toastify";
// import { Xumm } from "xumm";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { push } = useRouter();
  const [xumm, setXumm] = useState(null);

  useEffect(() => {
    const savedAccount = localStorage.getItem("wallet");
    if (savedAccount) {
      setAccount(savedAccount);
    }
    setIsLoading(false);

    setXumm(new Xumm(process.env.NEXT_PUBLIC_XAMAN_API_KEY));
  }, []);

  useEffect(() => {
    const xummReady = () => {
      console.log("XUMM Ready.");
    };
    const xummError = async () => (error) => {
      toast.error(error.message);
    };

    const xummSuccess = async () => {
      {
        xumm.user.account.then((account) => {
          localStorage.setItem("wallet", account);
          setAccount(account);
        });
      }
    };

    if (xumm) {
      xumm.on("ready", () => xummReady);

      xumm.on("success", async () => xummSuccess);

      xumm.on("error", xummError);
    }

    return () => {
      if (xumm) {
        xumm.off("ready", xummReady);
        xumm.off("success", xummSuccess);
        xumm.off("error", xummError);
      }
    };
  }, [xumm]);

  const connectMetaMask = () => {
    xumm.authorize();
  };

  const logout = async () => {
    await xumm.logout();
    localStorage.removeItem("wallet");
    setAccount(null);
    push("/login");
  };

  return (
    <AppContext.Provider
      value={{ account, connectMetaMask, logout, isLoading, xumm }}
    >
      {children}
    </AppContext.Provider>
  );
};
