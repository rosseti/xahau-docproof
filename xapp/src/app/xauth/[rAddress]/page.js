"use client";

import PageLoader from "@/components/PageLoader";
import Dropzone from "@/components/UI/Dropzone";
import { parse } from "@iarna/toml";
import { Buffer } from "buffer";
import { useParams, useSearchParams } from "next/navigation";

import forge from "node-forge";
import { getCertificatesInfoFromPDF } from "pdf-signature-reader";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Client } from "xrpl";

const PDFCertificateExtractor = () => {
  const { rAddress } = useParams();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [file, setFile] = useState(null);
  const [certificates, setCertificates] = useState([]);

  const [domain, setDomain] = useState(null);
  const [toml, setToml] = useState(null);
  const [addressPubKey, setAddressPubKey] = useState([]);

  const handleFileChange = async (acceptedFile) => {
    const selectedFile = acceptedFile;
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setCertificates([]);
      await extractCertificate(selectedFile);
    } else {
      alert("Please select a valid PDF file");
    }
  };

  const extractCertificate = async (pdfFile) => {
    try {
      console.log("Starting certificate extraction...");

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);

      const certs = getCertificatesInfoFromPDF(pdfBuffer);
      console.log("Certificates extracted:", certs);

      if (certs.length > 0 && certs[0].length > 0) {
        setCertificates(certs[0]);
      } else {
        toast.error(
          "No digital signature found in the PDF. Check if the PDF is signed."
        );
      }
    } catch (error) {
      console.error("Error processing the PDF:", error);
      toast.error(`Error extracting the certificate: ${error.message}`);
    }
  };

  const fetchDomainFromLedger = async (accountAddress) => {
    return "localhost:3000";
    const client = new Client("wss://xahau.network");
    client.apiVersion = 1;
    try {
      await client.connect();
      const response = await client.request({
        command: "account_info",
        account: accountAddress,
      });

      if (
        response.result &&
        response.result.account_data &&
        response.result.account_data.Domain
      ) {
        const domainHex = response.result.account_data.Domain;
        const domain = await Buffer.from(domainHex, "hex").toString("ascii");
        return domain;
      } else {
        throw new Error("Domain not found for this rAddress");
      }
    } catch (err) {
      throw new Error(`Error fetching domain: ${err.message}`);
    } finally {
      await client.disconnect();
    }
  };

  const fetchXrplToml = async () => {
    try {
      console.log(domain);
      const response = await fetch(`http://${domain}/.well-known/xahau.toml`);
      if (!response.ok) throw new Error("xahau.toml not found");
      const tomlText = await response.text();
      const parsedToml = parse(tomlText);
      setToml(parsedToml);
      console.log(parsedToml);
      return parsedToml;
    } catch (err) {
      throw new Error(`Error fetching xahau.toml: ${err.message}`);
    }
  };

  const validateToml = (tomlData, ledgerDomain) => {
    const validation = {
      rAddress: null,
      isValidAddress: false,
      domainMatches: false,
      messages: [],
    };

    if (tomlData.VALIDATORS && tomlData.VALIDATORS.length > 0) {
      validation.rAddress = tomlData.VALIDATORS[0].public_key;
    } else if (tomlData.VALIDATOR && tomlData.VALIDATOR.public_key) {
      validation.rAddress = tomlData.VALIDATOR.public_key;
    }

    if (validation.rAddress) {
      validation.isValidAddress = isValidAddress(validation.rAddress);
      if (!validation.isValidAddress) {
        validation.messages.push("Invalid rAddress format.");
      }
    } else {
      validation.messages.push("No rAddress found in the TOML.");
    }

    if (tomlData.DOMAIN && tomlData.DOMAIN.domain) {
      validation.domainMatches =
        tomlData.DOMAIN.domain.toLowerCase() === ledgerDomain.toLowerCase();
      if (!validation.domainMatches) {
        validation.messages.push(
          `Domain of TOML (${tomlData.DOMAIN.domain}) not matching the ledger (${ledgerDomain}).`
        );
      }
    } else {
      validation.messages.push("No domain found in the TOML.");
    }

    return validation;
  };

  const validateCertificate = (extractedCert, pubKeyPem) => {
    try {
      const extractedCertObj = forge.pki.certificateFromPem(
        extractedCert.pemCertificate
      );
      const extractedPubKeyPem = forge.pki.publicKeyToPem(
        extractedCertObj.publicKey
      );

      // Converte a chave pública em PEM para objeto Forge
      console.log(pubKeyPem);
      const pubKeyObj = forge.pki.publicKeyFromPem(pubKeyPem);
      const inputPubKeyPem = forge.pki.publicKeyToPem(pubKeyObj);

      const isValid = extractedPubKeyPem === inputPubKeyPem;

      const extractedFingerprint = forge.md.sha256
        .create()
        .update(
          forge.asn1
            .toDer(forge.pki.certificateToAsn1(extractedCertObj))
            .getBytes()
        )
        .digest()
        .toHex();

      return {
        isValid,
        fingerprintMatches: null,
        extractedFingerprint,
        message: isValid
          ? "Public key matches the declared pubkey"
          : "Public key does not match the declared pubkey",
      };
    } catch (err) {
      return {
        isValid: false,
        fingerprintMatches: false,
        message: `Error validating certificate: ${err.message}`,
      };
    }
  };

  useEffect(() => {
    let isMounted = true;

    const getDomain = async () => {
      try {
        setDomain(await fetchDomainFromLedger(rAddress));

        if (isMounted) {
          toast.success("Domain fetched successfully");
          console.log(domain);
        }
      } catch (error) {
        if (isMounted) {
          toast.error(error.message);
          console.error("Error:", error.message);
        }
      }
    };

    getDomain();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const getToml = async () => {
      try {
        const tomlData = await fetchXrplToml();

        if (isMounted) {
          setToml(tomlData);
        }

        toast.success("Toml fetched successfully");
      } catch (error) {
        if (isMounted) {
          toast.error(error.message);
          console.error("Error:", error.message);
        }
      }
    };

    if (domain !== null) getToml();

    return () => {
      isMounted = false;
    };
  }, [domain]);

  useEffect(() => {
    let isMounted = true;

    const getAddressPubKey = async () => {
      try {
        for (const docproof in toml.DOCPROOF) {
          const docproofData = toml.DOCPROOF[docproof];
          if (
            (docproofData.address === rAddress &&
              id !== null &&
              docproofData.id === id) ||
            (docproofData.address === rAddress && id === null)
          ) {
            const pubkey = docproofData.pubkey;
            setAddressPubKey(pubkey);
            break;
          }
        }
      } catch (error) {
        if (isMounted) {
          toast.error(error.message);
          console.error("Error fetching pubKey:", error.message);
        }
      }
    };

    if (domain !== null) getAddressPubKey();

    return () => {
      isMounted = false;
    };
  }, [toml]);

  if (!domain || !toml || !addressPubKey) return <PageLoader />;

  return (
    <div className="container mx-auto pt-5 px-4">
      <h1 className="text-4xl font-bold pb-4">XAuth</h1>
      {id && <p className="mb-4">ID: {id}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Dropzone */}
        <div className="p-4 border rounded-lg bg-gray-50 shadow-md">
          <h3 className="text-lg font-medium pb-2">
            Select or drag and drop your document below
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            No worries, we don't store your files.
          </p>
          <Dropzone onFileChange={handleFileChange} />
        </div>

        {/* Right Column - Validation Info */}
        <div className="p-4 border rounded-lg bg-gray-50 shadow-md">
          {certificates.length > 0
            ? certificates.map((cert, index) => {
                const validation = validateCertificate(cert, addressPubKey);
                const isValid = validation.isValid;

                return (
                  <div
                    key={index}
                    className={`p-4 mb-4 border rounded-lg shadow-md ${
                      isValid
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">
                        Certificate {index + 1}
                      </h4>
                      <span
                        className={`px-3 py-1 text-sm font-bold rounded ${
                          isValid
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {isValid ? "Valid" : "Invalid"}
                      </span>
                    </div>

                    <p>
                      <strong>Issued By:</strong> {cert.issuedBy.commonName}
                    </p>
                    <p>
                      <strong>Valid From:</strong>{" "}
                      {new Date(cert.validityPeriod.notBefore).toLocaleString()}
                    </p>
                    <p>
                      <strong>Valid To:</strong>{" "}
                      {new Date(cert.validityPeriod.notAfter).toLocaleString()}
                    </p>

                    {validation.message && (
                      <p
                        className={`mt-2 text-sm font-medium ${
                          isValid ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {validation.message}
                      </p>
                    )}
                  </div>
                );
              })
            : null}

          {domain && rAddress && (
            <div className="mb-4 p-3 border rounded bg-white shadow-sm">
              <h3 className="text-lg font-medium pb-2">Account Information</h3>
              <p>
                <strong>Domain:</strong> {domain}
              </p>
              <p>
                <strong>rAddress:</strong> {rAddress}
              </p>
              {toml.PRINCIPALS.length > 0 &&
                toml.PRINCIPALS.map((principal, index) => (
                  <div key={index}>
                    <h4 className="text-md font-semibold">
                      Principal {index + 1}
                    </h4>
                    {principal.name && (
                      <p>
                        <strong>Name:</strong> {principal.name}
                      </p>
                    )}
                    {principal.description && (
                      <p>
                        <strong>Description:</strong> {principal.description}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFCertificateExtractor;
