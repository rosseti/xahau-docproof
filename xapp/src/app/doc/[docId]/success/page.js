"use client";

import { useContext, useEffect, useState } from "react";

import { AppContext } from "@/context/AppContext";

import { useParams, useRouter } from "next/navigation";

import PageLoading from "@/components/PageLoader";
import ApiService from "@/services/APIService";

// const confetti = require('canvas-confetti');
import confetti from "canvas-confetti";

export default function PageSuccess() {
  const { account, isLoading } = useContext(AppContext);
  const [document, setDocument] = useState({});
  const { docId } = useParams();
  const { push } = useRouter();
  const [apiService, setApiService] = useState(null);
  const { xumm } = useContext(AppContext);

  useEffect(() => {
    if (!isLoading && !account) {
      push("/login");
    }
  }, [account, isLoading]);

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

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  useEffect(() => {
    if (isLoading) return;

    const numBursts = 5;
    const delayBetweenBursts = 250;

    setTimeout(() => {
      for (let i = 0; i < numBursts; i++) {
        setTimeout(() => {
          confetti({
            angle: randomInRange(55, 125),
            spread: randomInRange(50, 70),
            particleCount: randomInRange(50, 100),
            origin: { y: 0.6 }
          });
        }, i * delayBetweenBursts);
      }
    }, 1000);

  }, [isLoading]);

  if (isLoading) return <PageLoading />;

  return (
    <>
      <div className="container mx-auto pt-10 px-4 w-1/2">
        <div class="flex flex-col items-center mb-4">

          <img src="/icon-paper-send.png" style={{height: '120px'}} />
          <h1 className="text-2xl  font-bold pb-4">{document.name}</h1>
          <h2 className="text-6xl text-blue-700 font-bold pb-4 font-signature">Sent successfully!</h2>
        </div>

        <p className="mb-4 text-center">
          Your document has been dispatched, and all participants have received an email invitation to sign it. You will be notified as soon as any participant signs or takes action on document.
        </p>

        <div className="pb-4 flex flex-col items-center">
          <button
            className="btn btn-primary shadow-lg"
            onClick={() => push(`/doc/${document.id}/status`)}
          >
            Check Status
          </button>
        </div>
      </div>
    </>
  );
}
