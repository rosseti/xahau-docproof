"use client";

import { useContext, useEffect, useState } from "react";

import { AppContext } from "@/context/AppContext";

import { toast } from "react-toastify";

import EmailRecipients from "@/components/UI/EmailRecipients";
import { useParams, useRouter } from "next/navigation";

import PDFViewer from "@/components/PDFViewer";
import PageLoader from "@/components/PageLoader";
import ApiService from "@/services/APIService";
import { FiArrowRight } from "react-icons/fi";

export default function PageAddSigners() {
  const { account, isLoading } = useContext(AppContext);
  const [signers, setAuthorizedSigners] = useState([]);
  const [isAwaiting, setIsAwaiting] = useState(false);
  const [document, setDocument] = useState({});
  const [apiService, setApiService] = useState(null);
  const { xumm } = useContext(AppContext);

  const { docId } = useParams();

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
    apiService.getDocument(docId).then(({ document }) => {
      setDocument(document);
    });
  }, [apiService]);

  const handleEmailsChange = (newEmails) => {
    setAuthorizedSigners(newEmails);
    console.log("Emails atualizados:", newEmails);
  };

  const handleSubmit = async (event) => {
    setIsAwaiting(true);

    console.log("Sending to:", signers);

    event.preventDefault();

    await apiService.addAuthorizedSigners(docId, signers)
      .then(({ data }) => {
        toast.success("Sent successfully!");
        push(`/doc/${docId}/success`);
      })
      .catch((error) => {
        toast.error("Error associating parts!", error);
      })
      .finally(() => {
        setIsAwaiting(false);
      });
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      <div className="container mx-auto pt-10 px-4 w-100">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4">
            <div style={{ height: "50vh" }}>
            {document.hash && (
              <PDFViewer hash={document.hash} />
            )}
            </div>

            <div className="badge badge-primary badge-outline">
              {document.name}
            </div>
          </div>
          <div className="p-4">
            <h2 className="text-4xl font-bold pb-4">Add Signers</h2>

            <p className="mb-4">
              Here you can add the emails of the people that will be able to
              sign the document.
            </p>

            <EmailRecipients
              emails={signers}
              onEmailsChange={handleEmailsChange}
              maxEmails={5}
              className="mb-4"
            />

            
            <button
              onClick={handleSubmit}
              className={`btn btn-primary shadow-lg`}
              disabled={isAwaiting}
            >
              Send 
              {isAwaiting && <span className="loading loading-spinner"></span>}
              {!isAwaiting && <FiArrowRight />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
