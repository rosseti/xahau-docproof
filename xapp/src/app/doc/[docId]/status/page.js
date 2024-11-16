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
import ProgressBar from "@/components/UI/ProgressBar";
import {
  FiAtSign,
  FiCheckCircle,
  FiDownload,
  FiEye,
  FiLoader,
} from "react-icons/fi";

export default function PageStatus() {
  const { docId } = useParams();

  const [apiService, setApiService] = useState(null);
  const { xumm, connectWallet } = useContext(AppContext);

  const [document, setDocument] = useState({});

  const [totalSigned, setTotalSigned] = useState(0);
  const [totalSigners, setTotalSigners] = useState(0);

  const { account, isLoading } = useContext(AppContext);
  const router = useRouter();

  useEffect(() => {
    if (!xumm) return;
    setApiService(ApiService(xumm));
  }, [xumm]);

  useEffect(() => {
    if (!apiService) return;
    apiService.getDocument(docId).then(({ document }) => {
      setDocument(document);
      setTotalSigned(document.signers.filter((s) => s.signed).length);
      setTotalSigners(document.signers.length);
    });
  }, [apiService]);

  if (isLoading) return <PageLoader />;

  return (
    <>
      <div className="container mx-auto pt-10 px-4 w-full lg:w-1/2">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4 ">
          <div className="p-4 flex flex-col items-center align-center">
            <img
              src="/images/app/pdf-placeholder.png"
              width={150}
              className="mb-4"
            />
            <button className="btn btn-default mb-4 w-full">
              <FiEye /> View Document
            </button>

            <button className="btn btn-primary w-full">
              <FiDownload /> Signature Proof
            </button>
          </div>
          <div className="p-4">
            <h2 className="text-2xl font-bold pb-4">{document.name}</h2>

            <div className="grid grid-cols-4 gap-2 mb-4">
              <ProgressBar progress={100} description="Document uploaded" />
              <ProgressBar
                progress={document.signers?.length > 0 ? 100 : 0}
                description={
                  document.signers?.length > 0
                    ? "Sent to participants"
                    : "Waiting to send"
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
                            <span class="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                              <FiLoader className="mr-1" /> Pending
                            </span>
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