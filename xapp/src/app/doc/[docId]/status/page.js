"use client";

import { useContext, useEffect, useState } from "react";

import { AppContext } from "@/context/AppContext";

import "react-toastify/dist/ReactToastify.css";

import { useParams, useRouter } from "next/navigation";

import PageLoader from "@/components/PageLoader";
import ProgressBar from "@/components/UI/ProgressBar";
import ApiService from "@/services/APIService";
import {
  FiCheckCircle,
  FiDownload,
  FiEye,
  FiFile,
  FiLoader,
  FiUsers,
} from "react-icons/fi";

export default function PageStatus() {
  const { docId } = useParams();

  const [apiService, setApiService] = useState(null);
  const { xumm, connectWallet } = useContext(AppContext);

  const [document, setDocument] = useState({});

  const [totalSigned, setTotalSigned] = useState(0);
  const [totalSigners, setTotalSigners] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  const { account, isLoading } = useContext(AppContext);
  const router = useRouter();

  const fetchDocument = () => {
    if (!apiService) return;
    console.log("Fetching document...");
    apiService.getDocument(docId).then(({ document }) => {
      const totalSigned = document.signers.filter((s) => s.signed).length;
      setDocument(document);
      setTotalSigned(totalSigned);
      setTotalSigners(document.signers.length);
      setPageCount(document.pageCount);

      if (totalSigned !== document.signers.length) {
        setTimeout(() => {
          fetchDocument();
        }, 10000);
      }
    });
  }

  useEffect(() => {
    if (!isLoading && !account) {
      router.push("/login");
    }
  }, [account, isLoading]);

  useEffect(() => {
    if (!xumm) return;
    setApiService(ApiService(xumm));
  }, [xumm]);

  useEffect(() => {
    fetchDocument();
  }, [apiService]);

  if (isLoading) return <PageLoader />;

  return (
    <>
      <div className="container mx-auto pt-10 px-4 w-full lg:w-1/2">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4 ">
          <div className="p-4 flex flex-col items-center align-center text-gray-400">
            <img
              src="/images/app/pdf-placeholder.png"
              width={150}
              className="mb-4"
            />

            <div className="pb-2 flex flex-row items-center text-xs">
              <FiUsers className="mr-2" />
              <span>
                {totalSigners} {`signer${totalSigners > 1 ? "s" : ""}`}
              </span>
            </div>

            <div className="pb-4 flex flex-row items-center text-xs">
              <FiFile className="mr-2" />
              <span>
                {pageCount} {`page${pageCount > 1 ? "s" : ""}`}
              </span>
            </div>

            <button
              className="btn btn-default mb-4 w-full shadow-lg"
              onClick={() =>
                window.open(
                  `${process.env.NEXT_PUBLIC_APP_URL}file/${document.hash}`
                )
              }
            >
              <FiEye /> View Document
            </button>

            {document.status == "Fully Signed" && (
              <button
                onClick={() =>
                  window.open(
                    `${process.env.NEXT_PUBLIC_API_URL}/proof/${docId}`
                  )
                }
                className="btn btn-primary w-full shadow-lg"
              >
                <FiDownload /> Signature Proof
              </button>
            )}
          </div>
          <div className="p-4">
            <div className="mb-4">
              <h2 className="text-2xl font-bold break-words w-96">{document.name}</h2>
              {document.status == "Fully Signed" && (
                <div className="text-success font-bold text-xs">
                  Signing completed
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              <ProgressBar progress={100} description="Document uploaded" />
              <ProgressBar
                progress={document.signers?.length > 0 ? 100 : 0}
                description={
                  document.signers?.length > 0
                    ? "Sent to participants"
                    : "Add signers"
                }
              />
              <ProgressBar
                progress={
                  totalSigners > 0 ? (totalSigned * 100) / totalSigners : 0
                }
                description={
                  totalSigners > 0
                    ? `Signed by ${totalSigned} of ${totalSigners}`
                    : `Waiting signers`
                }
              />
              <ProgressBar
                progress={
                  totalSigners > 0 && totalSigned == totalSigners ? 100 : 0
                }
                description="Completed"
              />
            </div>

            {document.signers && document.signers.length > 0 && (
              <>
                <h3 className="text-1xl font-bold mb-4">Signing Status</h3>

                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="rounded-tl-lg bg-gray-200 text-gray-700">
                        E-mail
                      </th>
                      <th className="rounded-tr-lg bg-gray-200 text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {document.signers.map((signer, rowIndex) => (
                      <tr key={rowIndex}>
                        <td>{signer.email}</td>
                        <td>
                          {signer.signed && (
                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                              <FiCheckCircle className="mr-1" /> Signed
                            </span>
                          )}

                          {!signer.signed && (
                            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                              <FiLoader className="mr-1" /> Pending
                            </span>
                          )}

                          {signer.signed && (
                            <button
                              onClick={() =>
                                window.open(
                                  `${
                                    process.env.NEXT_PUBLIC_APP_URL
                                  }did/${encodeURIComponent(signer.did)}`
                                )
                              }
                              className="btn btn-ghost btn-xs ml-2"
                            >
                              <FiEye /> DID
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
