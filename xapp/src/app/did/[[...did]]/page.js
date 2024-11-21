"use client";

import JsonView from '@uiw/react-json-view';
import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FiLoader, FiSearch } from "react-icons/fi";
import { toast } from "react-toastify";
const beautify = require("js-beautify").js;

export default function PageDid() {
  const { did } = useParams();
  const [userDID, setUserDID] = useState("");
  const [didDetails, setDidDetails] = useState(null);
  const [isLoading, setLoading] = useState(false);

  async function resolveDID(did) {
    setLoading(true);

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/did/resolve/${encodeURIComponent(
          did
        )}`
      );

      setDidDetails(response.data);
      setUserDID(decodeURIComponent(did));

      if (response.data.didDocument !== null) {
        toast.success("DID Document resolved successfully!");
      }

      setLoading(false);

      return response.data;
    } catch (error) {
      console.error("Error getting did: ", error);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (did !== undefined && did.length > 0) {
      const myDid = did.shift();
      if (myDid)
        setUserDID(decodeURIComponent(myDid));
    }
  }, [did]);

  useEffect(() => {
    if (userDID.length > 0)
      resolveDID(userDID);
  }, [userDID]);

  const handleFetchClick = () => {
    resolveDID(userDID);
  };

  return (
    <div className="container mx-auto pt-10 px-4 w-100">
      <h1 className="text-4xl font-bold pb-4">DID Resolver</h1>
      <div className="flex flex-row">
        <input
          type="text"
          className="input input-bordered input-primary w-full max-w-5xl mr-4"
          placeholder="Type your DID Document ID here..."
          value={userDID}
          onChange={(e) => setUserDID(e.target.value)}
        />
        <button
          disabled={isLoading}
          className="btn btn-primary shadow-lg"
          onClick={handleFetchClick}
        >
          {isLoading && <span className="loading loading-spinner"></span>}
          {!isLoading && <FiSearch />}
          Look up
        </button>
      </div>

      <div>
        <a target='_blank' className='text-blue-500 text-xs' href='https://www.w3.org/TR/did-core/'>W3C DID Specification</a>
      </div>

      {didDetails && (
        <div>
          <div className="grid grid-cols-2 gap-4">
            {/* <!-- DID Document --> */ }
            <div>
              <h2 className="text-2xl font-bold my-4">DID Document:</h2>
              <pre className="p-4 rounded-lg overflow-auto">
                <JsonView value={didDetails.didDocument} />
              </pre>
            </div>

            {/* <!-- Blockchain Tx --> */ }
            <div>
              <h2 className="text-2xl font-bold my-4">Blockchain Tx:</h2>

              <pre className=" p-4 rounded-lg overflow-auto">
                <JsonView value={didDetails.metadata.data} />
              </pre>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
