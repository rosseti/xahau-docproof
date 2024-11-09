"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Web3 from "web3";
const beautify = require("js-beautify").js;

export default function PageTransactionViewer() {
  const [transactionHash, setTransactionHash] = useState("");
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [error, setError] = useState(null);
  const { txHash } = useParams();

  const fetchTransaction = async (hash) => {
    if (hash.length != 66) {
      setError("Invalid hash. Please verify.");
      return;
    }

    const web3 = new Web3(window.ethereum);

    try {
      setTransactionDetails(null);
      setError(null);

      const transaction = await web3.eth.getTransaction(hash);
      const receipt = await web3.eth.getTransactionReceipt(hash);
      const events = receipt.logs.map((log) => {
        return {
          address: log.address,
          data: log.data,
          topics: log.topics,
        };
      });
      console.log("Events:", events);

      if (!transaction) {
        setError("Transação não encontrada. Verifique o hash.");
        return;
      }

      const formattedTransaction = JSON.parse(
        JSON.stringify(transaction, (key, value) => {
          if (typeof value === "bigint") return value.toString();
          return value;
        })
      );

      setTransactionDetails({
        transaction: formattedTransaction,
        receipt,
        events,
      });
    } catch (err) {
      setError("Erro ao buscar os detalhes da transação.");
      console.log(err);
      console.error(err);
    }
  };

  useEffect(() => {
    if (txHash.length > 0 && window.ethereum) {
      const tx = txHash.shift();
      if (tx) {
        fetchTransaction(tx);
        setTransactionHash(tx);
      }
    }
  }, [txHash]);

  const handleFetchClick = () => {
    fetchTransaction(transactionHash);
  };

  return (
    <div className="container mx-auto pt-10 px-4 w-100">
      <h1 className="text-4xl font-bold pb-4">Tx Viewer</h1>
      <input
        type="text"
        className="input input-bordered input-primary w-full max-w-xs mr-4"
        placeholder="Digite o hash da transação"
        value={transactionHash}
        onChange={(e) => setTransactionHash(e.target.value)}
      />
      <button className="btn btn-primary" onClick={handleFetchClick}>
        Buscar Transação
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {transactionDetails && (
        <div>
          <h2>Detalhes da Transação:</h2>
          <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-auto">
            <code className="language-javascript">
              {beautify(
                JSON.stringify(
                  transactionDetails,
                  (key, value) =>
                    typeof value === "bigint" ? value.toString() : value,
                  null,
                  2
                )
              )}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
}
