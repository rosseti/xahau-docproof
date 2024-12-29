"use client";

import { useContext, useEffect, useState } from "react";

import { AppContext } from "@/context/AppContext";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useParams, useRouter } from "next/navigation";

import PageLoader from "@/components/PageLoader";
import ApiService from "@/services/APIService";
import { processError } from "@/utils/solidity";
import { FileSignature } from "lucide-react";
import { FiCheckCircle } from "react-icons/fi";

export default function PageSign() {
  const { docId, signerId } = useParams();

  const [apiService, setApiService] = useState(null);
  const { xumm, connectWallet } = useContext(AppContext);

  const [document, setDocument] = useState({});

  const [isSigning, setSigning] = useState(false);
  const [isAlreadySigned, setAlreadySigned] = useState(false);

  const { account, isLoading } = useContext(AppContext);
  const router = useRouter();

  const signDocumentClickHandler = async (event) => {
    setSigning(true);
    event.preventDefault();
    try {

      const txjson = {
        TransactionType: "Invoke",
        Destination: "rsARu8NWSKAp1FvRXx7wXfkYMFuAVhnQTK",
        NetworkID: process.env.NEXT_PUBLIC_NETWORK_ID,
        HookParameters: [
          {
            HookParameter: {
              HookParameterName: "446F6348617368", // DocHash
              HookParameterValue: document.hash,
            },
          },
          {
            HookParameter: {
              HookParameterName: "446F634964", // DocId
              HookParameterValue: document.idHash,
            },
          },
        ]
      };

      console.log(txjson);

      await xumm.payload
        .createAndSubscribe(txjson, (eventMessage) => {
          if ("pre_signed" in eventMessage.data) {
            toast.info("Pre-signed");
          }

          if ("signed" in eventMessage.data) {
            toast.info("Signed");
            return eventMessage;
          }
        })
        .then(({ created, resolved }) => {
          console.log("Payload URL:", created.next.always);
          console.log("Payload QR:", created.refs.qr_png);

          return resolved;
        })
        .then((payload) => {
          const response = payload.payload.response;

          console.log(response.dispatched_result);
          console.log(response.txid);

          if (response.dispatched_result === "tesSUCCESS") {
            apiService
              .markDocumentAsSigned(docId, signerId, response.txid)
              .then((response) => {
                console.log(response);
                setAlreadySigned(true);
                toast.success("Document signed successfully!");
              });
          } else {
            toast.error(
              `Error signing document: ${response.dispatched_result}`
            );
          }

          setSigning(false);
        })
        .catch((error) => {
          toast.error(processError(error));
          setSigning(false);
        });
    } catch (error) {
      setSigning(false);
      console.error(error);
      toast.error(processError(error));
    }
  };

  useEffect(() => {
    if (!xumm) return;
    setApiService(ApiService(xumm));
  }, [xumm]);

  useEffect(() => {
    if (!apiService) return;
    apiService
      .getDocumentByIdAndSignerId(docId, signerId)
      .then(({ document }) => {
        setDocument(document);
        document.signers.map((signer) => {
          if (signer.signed) {
            setAlreadySigned(true);
          }
        });
      });
  }, [apiService]);
  
  if (isLoading || !xumm) return <PageLoader />;

  return (
    <>
      <ToastContainer />
      {!isLoading && !account && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 
          bg-black bg-opacity-85"
        >
          <button onClick={connectWallet} className="btn btn-primary shadow-lg">
            Sign in to continue
          </button>
        </div>
      )}

      {document.hash && (
        <iframe
          src={`${process.env.NEXT_PUBLIC_API_URL}/file/${document.hash}`}
          width="100%"
          style={{ height: "100vh" }}
          scrolling="no"
        />
      )}

      <div className="fixed bottom-4 right-10 z-10">
        {!isAlreadySigned && (
          <button
            onClick={signDocumentClickHandler}
            className="btn btn-primary shadow-lg"
            disabled={isSigning || isAlreadySigned}
          >
            {isSigning && <span className="loading loading-spinner"></span>}
            {!isSigning && <FileSignature />}
            Sign document
          </button>
        )}

        {isAlreadySigned && (
          <button className="btn btn-success shadow-lg">
            <FiCheckCircle />
            Document signed
          </button>
        )}
      </div>
    </>
  );
}
