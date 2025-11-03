"use client";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "@/context/AppContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams } from "next/navigation";
import PageLoader from "@/components/PageLoader";
import PDFViewer from "@/components/PDFViewer";
import ApiService from "@/services/APIService";
import { FileSignature } from "lucide-react";
import { FiCheckCircle } from "react-icons/fi";
import { processError } from "@/utils/solidity";

export default function PageSign() {
  const { docId, signerId } = useParams();
  const { xumm, connectWallet, account, isLoading } = useContext(AppContext);

  const [apiService, setApiService] = useState(null);
  const [document, setDocument] = useState({});
  const [isSigning, setSigning] = useState(false);
  const [isAlreadySigned, setAlreadySigned] = useState(false);
  //const [signMode, setSignMode] = useState<"onchain" | "offchain" | "email">("onchain");
  const [signMode, setSignMode] = useState("onchain");

  // --- 1️⃣ Shared document load
  const fetchDocument = () => {
    if (!apiService) return;
    apiService.getDocumentByIdAndSignerId(docId, signerId).then(({ document }) => {
      setDocument(document);
      if (document.signers.some((s) => s.signed)) setAlreadySigned(true);
    });
  };

  useEffect(() => {
    if (xumm) setApiService(ApiService(xumm));
  }, [xumm]);

  useEffect(() => {
    fetchDocument();
  }, [apiService]);

  // --- 2️⃣ ONCHAIN flow (existing)
  const handleOnchainSign = async () => {
    setSigning(true);
    event.preventDefault();
    try {
      const txjson = {
        TransactionType: "Payment",
        Amount: "1000000", // 1 XAH
        Destination: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
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

      await xumm.payload
        .createAndSubscribe(
          {
            custom_meta: {
              blob: {
                docHash: document.hash,
                docId: docId,
                signerId: signerId
              },
            },
            txjson
          },
          (eventMessage) => {

            if ("pre_signed" in eventMessage.data) {
              toast.info("Pre-signed");
            }

            if ("signed" in eventMessage.data) {
              toast.info("Signed");
              return eventMessage;
            }
          }
        )
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
            setAlreadySigned(true);
            toast.success("Document signed successfully!");
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

  // --- 3️⃣ OFFCHAIN flow (wallet signature only)
  const handleOffchainSign = async () => {
    setSigning(true);

    try {
      const txjson = {
        TransactionType: "SignIn",
        Account: account,
        Fee: "0",
        Flags: 0,
        NetworkID: process.env.NEXT_PUBLIC_NETWORK_ID,
        Amount: "0",
        Memos: [
          {
            Memo: {
              MemoData: document.hash,
              MemoType: Buffer.from("DocHash").toString("hex"),
            },
          },
        ],
      };

      const message = `Sign this document hash:\n${document.hash}`;

      const { created, resolved } = await xumm.payload.createAndSubscribe(
        {
          txjson,
          options: {
            submit: false,
            expire: 5,
          },
          custom_meta: {
            instruction: message,
            blob: {
              docHash: document.hash,
              docId,
              signerId,
            },
          },
        },
        (eventMessage) => {
          if ("opened" in eventMessage.data) {
            toast.info("Signature request opened in XUMM.");
          }

          if ("signed" in eventMessage.data) {
            return eventMessage;
          }

          if ("declined" in eventMessage.data) {
            return eventMessage;
          }
        }
      );

      console.log("Payload URL:", created.next.always);
      console.log("Payload QR:", created.refs.qr_png);

      const payload = await resolved;
      const response = payload.payload?.response;

      console.log(response);

      if (payload?.data?.signed) {
        const signature = response.hex;
        const txid = response.txid;

        console.log('Off-chain signature details:', {
          docId,
          signerId,
          txid,
          signature,
        });

        await apiService.registerOffchainSignature({
          docId,
          signerId,
          txid,
          signature,
        });

        toast.success("Off-chain signature recorded!");
        setAlreadySigned(true);
      } else {
        toast.warning("Signature was not completed.");
      }
    } catch (error) {
      console.error(error);
      toast.error(processError(error));
    } finally {
      setSigning(false);
    }
  };

  // --- 4️⃣ EMAIL flow
  const handleEmailSign = async () => {
    setSigning(true);
    try {
      const { ok } = await apiService.sendEmailSignatureLink({ docId, signerId });
      if (ok) toast.info("Check your email for the signature link!");
    } catch (err) {
      toast.error(processError(err));
    } finally {
      setSigning(false);
    }
  };

  // --- 5️⃣ Wrapper
  const signDocumentClickHandler = async (e) => {
    e.preventDefault();
    if (signMode === "onchain") return handleOnchainSign();
    if (signMode === "offchain") return handleOffchainSign();
    if (signMode === "email") return handleEmailSign();
  };

  if (isLoading || !xumm) return <PageLoader />;

  return (
    <>
      <ToastContainer />
      {!isLoading && !account && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-85">
          <button onClick={connectWallet} className="btn btn-primary shadow-lg">
            Sign in to continue
          </button>
        </div>
      )}

      {document.hash && (
        <div className="fixed top-0 left-0 w-full h-screen z-0">
          <PDFViewer hash={document.hash} docId={docId} signerId={signerId} />
        </div>
      )}

      <div className="fixed bottom-4 right-10 z-10 flex gap-3">
        {!isAlreadySigned && (
          <>
            <select
              value={signMode}
              onChange={(e) => setSignMode(e.target.value)}
              className="select select-bordered"
            >
              <option value="onchain">On-chain</option>
              <option value="offchain">Off-chain (wallet)</option>
              <option value="email">Email-based</option>
            </select>

            <button
              onClick={signDocumentClickHandler}
              className="btn btn-primary shadow-lg"
              disabled={isSigning}
            >
              {isSigning && <span className="loading loading-spinner"></span>}
              {!isSigning && <FileSignature />}
              Sign document
            </button>
          </>
        )}

        {isAlreadySigned && (
          <button className="btn btn-success shadow-lg">
            <FiCheckCircle /> Document signed
          </button>
        )}
      </div>
    </>
  );
}
