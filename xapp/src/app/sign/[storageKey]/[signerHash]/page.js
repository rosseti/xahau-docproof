"use client";

import { useContext, useEffect, useState } from "react";

import { AppContext } from "@/context/AppContext";


import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useParams, useRouter } from "next/navigation";

import PageLoader from "@/components/PageLoader";
import {
  getContract,
  getDocument,
  signDocument as signDocumentWeb3,
} from "@/services/Web3Service";
import { processError } from "@/utils/solidity";
import { FiAtSign } from "react-icons/fi";
import { FileSignature } from "lucide-react";

export default function PageSign() {
  const { storageKey, signerHash } = useParams();

  const [document, setDocument] = useState({});
  const [authorizedSignerCount, setAuthorizedSignerCount] = useState(0);
  const [signatureCount, setSignatureCount] = useState(0);

  const [isSigning, setSigning] = useState(false);
  const [isAlreadySigned, setAlreadySigned] = useState(false);

  const { account, isLoading } = useContext(AppContext);
  const router = useRouter();

  const signDocumentClickHandler = async (event) => {
    setSigning(true);
    event.preventDefault();
    try {
      console.log(storageKey, document.documentHash, signerHash);
      const txHash = await signDocumentWeb3(
        storageKey,
        document.documentHash,
        signerHash,
        document.expirationTime
      );

      console.log(txHash);
      toast.success("Document signed successfully!");
    } catch (error) {
      console.error(error);
      toast.error(processError(error));
    }
    setSigning(false);
  };

  const signDocument = () => {
    return document.documentHash ? document.documentHash.replace("0x", "") : "";
  };

  useEffect(() => {
    if (!isLoading) {
      getDocument(storageKey).then((document) => {
        setDocument(document);
        console.log(document);
        setAuthorizedSignerCount(Number(document.authorizedSignerCount));
        setSignatureCount(Number(document.signatureCount));
      });
    }
  }, [account, isLoading]);

  useEffect(() => {
    const checkSigner = async () => {
      const contract = await getContract();
      const response = await contract.methods.signatures(storageKey, signerHash).call();
      if (response !== "0x") {
        setAlreadySigned(true);
      }
      console.log('SignerAddrExists:', response);
    }

    checkSigner();
  }, [document]);

  if (isLoading) return <PageLoader />;

  return (
    <>
      <ToastContainer />

      {signDocument() && (
        <iframe
          src={`http://localhost:3000/api/file/${signDocument()}`}
          width="100%"
          style={{ height: "100vh" }}
          scrolling="no"
        />
      )}

      <div className="fixed bottom-4 right-10 z-10">
        <button
          onClick={signDocumentClickHandler}
          className="btn btn-primary shadow-lg"
          disabled={isSigning || isAlreadySigned}
        >
          {isSigning && <span className="loading loading-spinner"></span>}
          {!isSigning && <FileSignature />}
          Sign document
        </button>
      </div>
    </>
  );
}
