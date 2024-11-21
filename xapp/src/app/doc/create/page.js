"use client";

import { useContext, useEffect, useState } from "react";

import { AppContext } from "@/context/AppContext";

import { toast } from "react-toastify";

import PageLoading from "@/components/PageLoader";
import Dropzone from "@/components/UI/Dropzone";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FiUpload } from "react-icons/fi";

export default function PageCreate() {
  const { account, isLoading, xumm } = useContext(AppContext);
  const [file, setFile] = useState(null);
  const [isUploading, setIsAwaiting] = useState(false);

  const { push } = useRouter();

  useEffect(() => {
    if (!isLoading && !account) {
      push("/login");
    }
  }, [account, isLoading]);

  function handleFileChange(acceptedFile) {
    setFile(acceptedFile);
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsAwaiting(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("owner", account);

    console.log(file);

    const headers = {
      'Authorization': `Bearer ${await xumm.environment.bearer}`,
    }

    await axios
      .post(`${process.env.NEXT_PUBLIC_API_URL}/doc/create`, formData, {
        headers
      })
      .then((response) => {
        const {
          data: { id },
        } = response.data;

        setIsAwaiting(false);

        toast.success("Document sent successfully!");
        push(`/doc/${id}/add-signers`);
      }).catch((error) => {
        toast.error(error.message);
        setIsAwaiting(false);
      });
  };

  if (isLoading) return <PageLoading />;

  return (
    <>
      <div className="container mx-auto pt-10 px-4 w-full lg:w-1/2">
        
        <h1 className="text-4xl font-bold pb-4">
          Send your document
        </h1>

        <p className="mb-4">Select or drag and drop your documents to be signed below.</p>

        <Dropzone onFileChange={handleFileChange} />

        {file && (
          <div className="mt-4">
            <button
              onClick={handleSubmit}
              className={`btn btn-primary shadow-lg`}
              disabled={isUploading}
            >
              {isUploading && <span className="loading loading-spinner"></span>}
              {!isUploading && <FiUpload />}
              Send File
            </button>
          </div>
        )}
      </div>
    </>
  );
}
