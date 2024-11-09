"use client";

import { useContext, useEffect, useRef, useState } from "react";

import { AppContext } from "@/context/AppContext";
import { addDocument, getContract } from "@/services/Web3Service";

import { toast } from "react-toastify";

import { useParams, useRouter } from "next/navigation";

import PageLoader from "@/components/PageLoader";
import { getDocument, updateDocumentStatus } from "@/services/APIService";

import { SiHiveBlockchain } from "react-icons/si";

export function useContractEvent(eventName, options = {}) {
  const subscription = useRef(null);

  useEffect(() => {
    const contract = getContract();

    const initEventListener = async () => {
      try {
        if (subscription.current) {
          subscription.current.unsubscribe();
        }

        subscription.current = contract.events[eventName]({
          fromBlock: options.fromBlock || "latest",
          ...options,
        });

        subscription.current.on("connected", (subscriptionId) => {
          console.log("Connected to subscription:", subscriptionId);
        });

        subscription.current.on("data", (event) => {
          console.log("Evento recebido:", event);

          if (options.txHash && options.onMatchingEvent) {
            if (event.transactionHash === options.txHash) {
              options.onMatchingEvent(event);
            }
          } else if (options.onEvent) {
            options.onEvent(event);
          }
        });

        subscription.current.on("error", (error) => {
          console.error("Erro no evento:", error);
          if (options.onError) options.onError(error);
        });
      } catch (error) {
        console.error("Erro ao inicializar evento:", error);
        if (options.onError) options.onError(error);
      }
    };

    initEventListener();

    return () => {
      if (subscription.current) {
        console.log("Cancelando subscription do evento");
        subscription.current.off();
        subscription.current.unsubscribe();
        subscription.current.removeAllListeners();
        subscription.current = null;
      }
    };
  }, [eventName, options]);
}

export default function PageBlockchainConfirmation() {
  const { account, isLoading } = useContext(AppContext);

  const [isAwaiting, setIsAwaiting] = useState(false);
  const [document, setDocument] = useState({});
  const [authorizedSigners, setAuthorizedSigners] = useState([]);
  const [authorizedSignersHash, setAuthorizedSignersHash] = useState([]);
  const [txHash, setTxHash] = useState(null);
  const [isFinished, setFinished] = useState(false);

  const { docId } = useParams();

  const { push } = useRouter();

  useContractEvent("DocumentCreated", {
    fromBlock: "latest",
    txHash: txHash,
    onMatchingEvent: (event) => {
      const { transactionHash } = event;
      const { storageKey } = event.returnValues;

      if (isFinished) return;

      console.log("txHash: ", txHash);
      console.log("transactionHash: ", transactionHash);

      if (txHash !== null && transactionHash == txHash) {
        setFinished(true);
        updateDocumentStatus(docId, "On Blockchain", {
          contractStorageKey: storageKey,
        })
          .then(() => {
            toast.success("Success! Now your document is on the blockchain!");

            setTimeout(() => {
              setIsAwaiting(false);
              push(`/doc/${docId}/success`);
            }, 1000);
          })
          .catch((error) => {
            setIsAwaiting(false);
            console.error("Erro:", error);
            toast.error(processError(error));
          });
      }
      console.log("New event:", event);
    },
    onError: (error) => {
      console.error("Erro:", error);
    },
  });

  useEffect(() => {
    getDocument(docId).then(({ document }) => {
      setDocument(document);
      setAuthorizedSigners(document.authorizedSigners);
      setAuthorizedSignersHash(document.authorizedSignersHash);
    });
  }, []);

  const addHexPrefix = (value) => (value ? `0x${value}` : null);

  const handleSubmit = async (event) => {
    setIsAwaiting(true);
    event.preventDefault();

    const documentHashWithPrefix = addHexPrefix(document.hash);
    const expiration = parseInt(
      new Date(document.expirationTime).getTime() / 1000
    );

    try {
      toast.info("Adding document to blockchain...");

      const transactionHash = await addDocument(
        documentHashWithPrefix,
        authorizedSignersHash,
        expiration
      );

      setTxHash(transactionHash);

      await updateDocumentStatus(docId, "Waiting for Blockchain Confirmation", {
        transactionHash,
      }).then(() => {
        toast.info(
          "Document sent to the blockchain! Waiting for confirmation."
        );
        console.log(transactionHash);
      });
    } catch (error) {
      setIsAwaiting(false);
      console.log(error);
      toast.error(processError(error));
    }
  };

  const processError = (error) => {
    if (error.code === "CALL_EXCEPTION") {
      const reason =
        error.data?.message ||
        error.reason ||
        "An unexpected error has occurred.";
      return translateError(reason);
    } else {
      return "Unexpected error. Please try again.";
    }
  };

  const translateError = (reason) => {
    switch (reason) {
      case "Document already exists":
        return "Este documento já existe.";
      case "Insufficient funds":
        return "Saldo insuficiente para a transação.";
      case "Transaction has been reverted":
        return "A transação falhou. Verifique os dados.";
      default:
        return "Erro desconhecido. Tente novamente.";
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      <div className="container mx-auto pt-10 px-4 w-100">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4">
            {document.hash && (
              <iframe
                src={`${process.env.NEXT_PUBLIC_API_URL}/file/${document.hash}`}
                width="100%"
                style={{ height: "50vh" }}
                scrolling="no"
              />
            )}

            <div className="badge badge-primary badge-outline">
              {document.name}
            </div>
          </div>
          <div className="p-4">
            <h2 className="text-4xl font-bold pb-4">Blockchain</h2>

            <p className="mb-4">
              Last step is to register the document on the blockchain.
            </p>

            <p className="mb-4">Authorized signers:</p>

            <ul className="list-disc list-inside mb-4">
              {authorizedSigners.map((signer) => (
                <li key={signer}>{signer}</li>
              ))}
            </ul>

            <p className="mb-4">
              Click button below to put the document on the blockchain.
            </p>

            <button
              onClick={handleSubmit}
              className={`btn btn-primary shadow-lg`}
              disabled={isAwaiting}
            >
              {isAwaiting && <span className="loading loading-spinner"></span>}
              {!isAwaiting && <SiHiveBlockchain />}
              Register on Blockchain
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
