"use client";

import { useContext, useEffect, useState } from "react";

import { AppContext } from "@/context/AppContext";

import { useRouter } from "next/navigation";

import PageLoading from "@/components/PageLoader";
import ApiService, { getDocuments } from "@/services/APIService";

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
    setApiService(ApiService(xumm));  // Passando o objeto Xumm para a lib
  }, [xumm]);

  useEffect(() => {
    if (!apiService) return;
    apiService.getDocuments().then((documents) => {
      if (documents.length == 0) return;
      setDocuments(documents);
      console.log(documents);
    });
  }, [apiService]);
  // useEffect(() => {
  //   getDocuments().then((documents) => {
  //     if (documents.length == 0) return;
  //     setDocuments(documents);
  //     console.log(documents);
  //   });
  // }, []);

  if (isLoading) return <PageLoading />;

  return (
    <>
      <div className="container mx-auto pt-10 px-4 w-1/2">
        <h1 className="text-4xl font-bold pb-4">My documents</h1>

        <p className="mb-4">
          Here you can see the list of documents you have created.
        </p>

        {/* {documents && <Table header={headers} body={documents} />} */}
        {documents && (
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document, rowIndex) => (
                <tr key={rowIndex}>
                  <td>{document.name}</td>
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
