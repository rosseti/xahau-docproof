"use client";

import { AppContext } from "@/context/AppContext";
import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import PageLoader from "./PageLoader";

const PDFViewer = ({ hash, docId, signerId }) => {
  const { xumm } = useContext(AppContext);
  const [ isLoading, setLoading ] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (!hash) return;

    const fetchPdf = async () => {
      let headers;
      let queryString = "";

      if (docId && signerId) {
        queryString += `?docId=${docId}&signerId=${signerId}`;
      }

      try {
        const bearer = await xumm.environment.bearer;
        if (!bearer) throw new Error('No bearer token available');
        headers = {
          Authorization: `Bearer ${bearer}`,
        };

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/file/${hash}${queryString}`,
          {
            headers,
            responseType: "blob",
          }
        );

        const fileURL = URL.createObjectURL(
          new Blob([response.data], { type: "application/pdf" })
        );
        setPdfUrl(fileURL);
      } catch (error) {
        toast.error(`Authentication failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPdf();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [hash]);

  if (isLoading) return <PageLoader />;

  return (
    <>
      {pdfUrl && (
        <iframe
          src={pdfUrl}
          width="100%"
          height="100%"
          style={{ display: "block" }}
        />
      )}
    </>
  );
};

export default PDFViewer;
