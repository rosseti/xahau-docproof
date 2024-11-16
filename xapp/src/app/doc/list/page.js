"use client";

import { useContext, useEffect, useState } from "react";

import { AppContext } from "@/context/AppContext";

import { useRouter } from "next/navigation";

import PageLoader from "@/components/PageLoader";
import ApiService from "@/services/APIService";
import Link from "next/link";

export default function PageList() {
  const { account, isLoading, xumm } = useContext(AppContext);
  const [documents, setDocuments] = useState(null);
  const [apiService, setApiService] = useState(null);
  const { push } = useRouter();

  useEffect(() => {
    if (!isLoading && !account) {
      console.log("Levando pra login");
      push("/login");
    }
  }, [account, isLoading]);

  useEffect(() => {
    if (!xumm) return;
    setApiService(ApiService(xumm));
  }, [xumm]);

  useEffect(() => {
    if (!apiService) return;
    apiService.getDocuments().then((documents) => {
      if (documents.length == 0) return;
      setDocuments(documents);
      console.log(documents);
    });
  }, [apiService]);

  if (isLoading) return <PageLoader />;

  return (
    <>
      <div className="container mx-auto pt-10 px-4 w-1/2">
        <h1 className="text-4xl font-bold pb-4">My documents</h1>

        <p className="mb-4">
          Here you can see the list of documents you have created.
        </p>

        {documents && (
          <table className="table w-full">
            <thead>
              <tr>
                <th className="rounded-tl-lg bg-gray-200 text-gray-700">Name</th>
                <th className="rounded-tr-lg bg-gray-200 text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document, rowIndex) => (
                <tr key={rowIndex}>
                  <td>
                    <Link href={`/doc/${document._id}/status`}>
                      {document.name}
                    </Link>
                  </td>
                  <td>{document.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
