"use client";

import { useContext, useEffect, useState } from "react";

import { AppContext } from "@/context/AppContext";

import { useParams, useRouter } from "next/navigation";

import PageLoading from "@/components/PageLoader";
import { getDocument } from "@/services/APIService";

export default function PageSuccess() {
  const { account, isLoading } = useContext(AppContext);
  const [document, setDocument] = useState({});
  const { docId } = useParams();
  const { push } = useRouter();

  useEffect(() => {
    if (!isLoading && !account) {
      push("/login");
    }
  }, [account, isLoading]);

  useEffect(() => {
    getDocument(docId).then(({ document }) => {
      setDocument(document);
    });
  }, []);

  if (isLoading) return <PageLoading />;

  return (
    <>
      <div className="container mx-auto pt-10 px-4 w-1/2">
        <h1 className="text-4xl font-bold pb-4">Congrats!</h1>

        <p className="mb-4">
          The document <em>{document.name}</em> has been sent successfully.
        </p>

        <div className="pb-4">
          <button
            className="btn btn-primary"
            onClick={() => push(`/tx/${document.transactionHash}`)}
          >
            Verify transaction details
          </button>
        </div>

        <p className="mb-4">
          Now all signers will be notified by email to sign the document.
        </p>
      </div>
    </>
  );
}
