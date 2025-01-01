"use client";

import { useContext, useEffect, useState } from "react";

import { AppContext } from "@/context/AppContext";

import { useRouter } from "next/navigation";

import PageLoader from "@/components/PageLoader";
import ApiService from "@/services/APIService";
import Link from "next/link";
import InfiniteScroll from "react-infinite-scroll-component";

export default function PageList() {
  const { account, isLoading, xumm } = useContext(AppContext);
  const [documents, setDocuments] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [apiService, setApiService] = useState(null);
  const { push } = useRouter();

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
    loadDocuments();
  }, [apiService]);

  const loadDocuments = async () => {
    try {
      const { documents: newDocuments, total } = await apiService.getDocuments(
        page
      );

      if (documents.length + newDocuments.length >= total) {
        setHasMore(false);
      }

      setDocuments((prev) => [...prev, ...newDocuments]);
      setPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error("Error loading documents:", error);
      setHasMore(false);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      <div className="container mx-auto pt-10 px-4 w-full lg:w-1/2">
        <h1 className="text-4xl font-bold pb-4">My documents</h1>

        <p className="mb-4">
          Here you can see the list of documents you have created.
        </p>

        <InfiniteScroll
          dataLength={documents.length}
          next={loadDocuments}
          hasMore={hasMore}
          loader={
            <div className="text-center py-4 flex justify-center">
              <span className="loading loading-spinner mr-5"></span> Loading...
            </div>
          }
          scrollThreshold={0.9}
        >
          <div className="w-full  text-gray-700">
            <div className="grid grid-cols-[1fr_200px] bg-gray-200 text-gray-700 font-semibold p-2 rounded-tl-lg rounded-tr-lg">
              <div className="p-2">Name</div>
              <div className="p-2">Status</div>
            </div>

            {documents.map((document) => (
              <div
                key={document._id}
                className="grid grid-cols-[1fr_200px] border-b border-gray-300 p-2 hover:bg-gray-50"
              >
                <div title={document.name} className="truncate p-2">
                  <Link
                    href={
                      document.status == "Pending"
                        ? `/doc/${document._id}/add-signers`
                        : `/doc/${document._id}/status`
                    }
                  >
                    {document.name}
                  </Link>
                </div>
                <div className="p-2">{document.status}</div>
              </div>
            ))}
          </div>
        </InfiniteScroll>
      </div>
    </>
  );
}
