import { createContext, useContext, useEffect, useState } from "react";
import { Xumm } from "xumm-sdk";

const XummContext = createContext();

export const XummProvider = ({ children }) => {
  const [xumm, setXumm] = useState(null);
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const xummInstance = new Xumm(process.env.NEXT_PUBLIC_XAMAN_API_KEY);
    setXumm(xummInstance);

    const handleSuccess = () => {
      xummInstance.user.account.then((account) => {
        setAccount(account);
        localStorage.setItem("wallet", account);
      });
    };

    const handleError = (err) => {
      setError(err.message || "Erro desconhecido");
      console.error("XUMM Error:", err);
    };

    if (xummInstance) {
      xummInstance.on("success", handleSuccess);
      xummInstance.on("error", handleError);
    }

    // Cleanup listeners on unmount
    return () => {
      if (xummInstance) {
        xummInstance.off("success", handleSuccess);
        xummInstance.off("error", handleError);
      }
    };
  }, []);

  return (
    <XummContext.Provider value={{ xumm, account, error }}>
      {children}
    </XummContext.Provider>
  );
};

export const useXumm = () => useContext(XummContext);
