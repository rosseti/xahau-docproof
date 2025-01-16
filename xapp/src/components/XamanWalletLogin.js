// src/components/XamanWalletLogin.js
"use client";

import { useContext } from "react";
import Image from "next/image";
import { AppContext } from "@/context/AppContext";
import { SiXrp } from "react-icons/si";

const XamanWalletLogin = () => {
  const { account, connectWallet } = useContext(AppContext);

  return (
    <div>
      <button onClick={connectWallet} className="btn glass shadow-lg w-full">
        <Image src="/xaman-app-icon-tick.svg" alt="Xaman Wallet" width={25} height={25} />
        Connect with Xaman Wallet
      </button>
    </div>
  );
};

export default XamanWalletLogin;
