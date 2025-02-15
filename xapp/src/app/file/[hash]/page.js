"use client";

import { useContext, useEffect, useState } from "react";

import { AppContext } from "@/context/AppContext";

import { useParams, useRouter } from "next/navigation";

import PDFViewer from "@/components/PDFViewer";
import PageLoader from "@/components/PageLoader";

export default function PageAddSigners() {
  const { account, isLoading } = useContext(AppContext);
  const { hash } = useParams();
  const { push } = useRouter();

  useEffect(() => {
    if (!isLoading && !account) {
      push("/login");
    }
  }, [account, isLoading]);

  if (isLoading) return <PageLoader />;

  return (
    <>
      <div className="container mx-auto pt-10 px-4 w-100">
        <div className="p-4">
          <div
            style={{
              height: "100vh",
              width: "100%",
              position: "fixed",
              top: "0",
              left: "0",
            }}
          >
            {hash && <PDFViewer hash={hash} />}
          </div>
        </div>
      </div>
    </>
  );
}
