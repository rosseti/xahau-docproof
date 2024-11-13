"use client";

import { useContext, useEffect, useState } from "react";

import { AppContext } from "@/context/AppContext";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useParams, useRouter } from "next/navigation";

import PageLoader from "@/components/PageLoader";
import { processError } from "@/utils/solidity";
import { FileSignature } from "lucide-react";
import ApiService from "@/services/APIService";

export default function PageSign() {
  const { docId, signerId } = useParams();

  const [apiService, setApiService] = useState(null);
  const { xumm } = useContext(AppContext);

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
      const networkId = await xumm.user.networkId;

      xumm.payload
        .createAndSubscribe(
          {
            TransactionType: "Invoke",
            Destination: "rsARu8NWSKAp1FvRXx7wXfkYMFuAVhnQTK",
            NetworkID: networkId,
            Memos: [
              {
                Memo: {
                  MemoData: document.hash,
                  MemoFormat: "746578742F686578", // text/hex
                  MemoType: "736861323536", // sha256
                },
              },
            ],
          },
          async (eventMessage) => {
            if ("opened" in eventMessage.data) {
              // Update the UI? The payload was opened.
              console.log("aberto");
            }
            
            console.log(eventMessage.data);

            if ("signed" in eventMessage.data) {

              const { payload_uuidv4 } = eventMessage.data;
              console.log(eventMessage.data);

              const txInfo = await xumm.payload.get(payload_uuidv4);
              console.log(txInfo.response.dispatched_result);

              if (txInfo.response.dispatched_result === 'tesSUCCESS') {
                // here we go!
                // @todo atualizar status da assinatura
              }

              return eventMessage;
            }
          }
        )
        .then(({ created, resolved }) => {
          console.log("Payload URL:", created.next.always);
          console.log("Payload QR:", created.refs.qr_png);

          return resolved;
        })
        .then((payload) => async () => {
          await xumm.xapp.openSignRequest(payload);
          setSigning(false);
        });

      // console.log(txHash);
      // toast.success("Document signed successfully!");
    } catch (error) {
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
    apiService.getDocument(docId).then(({ document }) => {
      setDocument(document);
    });
  }, [apiService]);

  if (isLoading) return <PageLoader />;

  return (
    <>
      <ToastContainer />

      {document.hash && (
        <iframe
          src={`http://localhost:3000/api/file/${document.hash}`}
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
