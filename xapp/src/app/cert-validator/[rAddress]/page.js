"use client";

import React, { useState, useEffect, useContext } from "react";
import { getCertificatesInfoFromPDF } from "pdf-signature-reader";
import { Buffer } from "buffer";
import { useParams } from "next/navigation";
import { AppContext } from "@/context/AppContext";
import { Client } from "xrpl";
import { parse } from "@iarna/toml";
import forge from "node-forge";
import PageLoader from "@/components/PageLoader";

const PDFCertificateExtractor = () => {
  const { rAddress } = useParams();
  const [file, setFile] = useState(null);
  const [certificates, setCertificates] = useState([]);

  const [domain, setDomain] = useState(null);
  const [toml, setToml] = useState(null);
  const [domainPubCert, setDomainPubCert] = useState([]);

  const [error, setError] = useState(null);
  const { xumm } = useContext(AppContext);

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setCertificates([]);
      setError(null);
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
        setError(
          "No digital signature found in the PDF. Check if the PDF is signed."
        );
      }
    } catch (error) {
      console.error("Error processing the PDF:", error);
      setError(`Error extracting the certificate: ${error.message}`);
    }
  };

  const fetchDomainFromLedger = async (accountAddress) => {
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
      const response = await fetch(`https://${domain}/.well-known/xahau.toml`);
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

  const fetchXahauDocProofCert = async () => {
    try {
      const response = await fetch(
        `https://${domain}/.well-known/xahaudocproof-cert.pem`
      );
      if (!response.ok) throw new Error("xahaudocproof-cert.pem not found");
      const certificate = await response.text();

      setDomainPubCert(certificate);

      return certificate;
    } catch (err) {
      throw new Error(`Error fetching xahaudocproof-cert.pem: ${err.message}`);
    }
  };

  const validateCertificate = (extractedCert, domainCertPem) => {
    try {
      
      const extractedCertObj = forge.pki.certificateFromPem(
        extractedCert.pemCertificate
      );
      const domainCertObj = forge.pki.certificateFromPem(domainCertPem);

      
      const extractedPubKey = forge.pki.publicKeyToPem(
        extractedCertObj.publicKey
      );
      const domainPubKey = forge.pki.publicKeyToPem(domainCertObj.publicKey);

      
      const isValid = extractedPubKey === domainPubKey;

      
      const extractedFingerprint = forge.md.sha256
        .create()
        .update(
          forge.asn1
            .toDer(forge.pki.certificateToAsn1(extractedCertObj))
            .getBytes()
        )
        .digest()
        .toHex();
      const domainFingerprint = forge.md.sha256
        .create()
        .update(
          forge.asn1
            .toDer(forge.pki.certificateToAsn1(domainCertObj))
            .getBytes()
        )
        .digest()
        .toHex();

      return {
        isValid,
        fingerprintMatches: extractedFingerprint === domainFingerprint,
        message: isValid
          ? "Public key matches the domain"
          : "Public key does not match the domain",
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
          console.log(domain);
        }
      } catch (error) {
        if (isMounted) {
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
      } catch (error) {
        if (isMounted) {
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

    const getDomainPubCert = async () => {
      try {
        const certificate = await fetchXahauDocProofCert();
        if (isMounted) {
          setDomainPubCert(certificate);
        }
      } catch (error) {
        if (isMounted) {
          console.error(
            "Error fetching xahaudocproof-cert.pem:",
            error.message
          );
        }
      }
    };

    if (domain !== null) getDomainPubCert();

    return () => {
      isMounted = false;
    };
  }, [toml]);

  if (!domain || !toml || !domainPubCert) return <PageLoader />;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {rAddress}
      {domain}
      {domainPubCert}
      <h2>Extract Certificate from Signed PDF</h2>
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        style={{ marginBottom: "10px" }}
      />
      {file && <p>Selected file: {file.name}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {certificates.length > 0 && (
        <div>
          <h3>Certificates Found:</h3>
          {certificates.map((cert, index) => {
            const validation = validateCertificate(cert, domainPubCert); 

            return (
              <div
                key={index}
                style={{
                  marginBottom: "20px",
                  border: "1px solid #ccc",
                  padding: "10px",
                }}
              >
                <h4>Certificate {index + 1}</h4>
                <pre>
                  <strong>VALID:</strong> {validation.isValid ? "Yes" : "No"}
                  <br />
                  <strong>Issued To:</strong> {cert.issuedTo.commonName}
                  <br />
                  <strong>Issued By:</strong> {cert.issuedBy.commonName}
                  <br />
                  <strong>Serial Number:</strong> {cert.serialNumber || "N/A"}
                  <br />
                  <strong>Valid From:</strong>{" "}
                  {new Date(cert.validityPeriod.notBefore).toLocaleString()}
                  <br />
                  <strong>Valid To:</strong>{" "}
                  {new Date(cert.validityPeriod.notAfter).toLocaleString()}
                  <br />
                  <strong>PEM Certificate:</strong>
                  <br />
                  {cert.pemCertificate}
                </pre>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PDFCertificateExtractor;


