"use client";

import { createContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Xumm } from "xumm";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { push } = useRouter();
  const [xumm, setXumm] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(false);

    setXumm(new Xumm(process.env.NEXT_PUBLIC_XAMAN_API_KEY));
  }, []);

  useEffect(() => {
    const xummReady = () => {
      console.log("XUMM Ready.");
      
      xumm.user.account.then((usrAccount) => {
        setAccount(usrAccount);
        console.log('usrAccount', usrAccount);
      });
    };
    const xummSuccess = async () => {
      {
        xumm.user.account.then((account) => {
          setAccount(account);
          console.log(account);
        });
      }
    };

    const xummError = (err) => {
      setError(err.message || "Unknown error.");
      console.error("XUMM Error:", err);
    };

    if (xumm) {
      xumm.on("ready", xummReady);

      xumm.on("success", xummSuccess);

      xumm.on("error", xummError);
    }

    return () => {
      if (xumm) {
        xumm.off("ready", xummReady);
        xumm.off("success", xummSuccess);
        xumm.off("error", xummError);
      }
    };
  }, [xumm, isLoading]);

  const connectWallet = () => {
    xumm.authorize();
  };

  const logout = async () => {
    await xumm.logout();
    setAccount(null);
    push("/login");
  };

  return (
    <AppContext.Provider
      value={{ account, connectWallet, logout, isLoading, xumm, error, setError }}
    >
      {children}
    </AppContext.Provider>
  );
};
