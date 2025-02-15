"use client";

import { useContext, useEffect, useState } from "react";

import { AppContext } from "@/context/AppContext";

import { useParams, useRouter } from "next/navigation";

import PDFViewer from "@/components/PDFViewer";
import PageLoader from "@/components/PageLoader";

export default function PageFile() {
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
      <div
        style={{
          height: "100vh",
          width: "100%"
        }}
        className="z-50 fixed top-0 left-0 right-0 bottom-0"
      >
        {hash && <PDFViewer hash={hash} />}
      </div>
    </>
  );
}
