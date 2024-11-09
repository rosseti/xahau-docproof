// src/components/MetaMaskLogin.js
"use client";

import { useContext } from "react";
import Image from "next/image";
import { AppContext } from "@/context/AppContext";
import { SiXrp } from "react-icons/si";

const MetaMaskLogin = () => {
  const { account, connectMetaMask } = useContext(AppContext);

  return (
    <div>
      <button onClick={connectMetaMask} className="btn glass shadow-lg w-full">
        {/* <Image src="/metamask.svg" alt="MetaMask" width={25} height={25} /> */}
        <SiXrp size={25} />
        Connect with Xaman Wallet
      </button>
    </div>
  );
};

export default MetaMaskLogin;
