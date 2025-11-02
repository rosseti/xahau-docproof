import axios from "axios";

const ApiService = (xumm) => {
  if (!xumm) {
    throw new Error("Xumm object is required for API calls");
  }

  async function getDocuments(page) {
    try {
      const headers = {
        Authorization: `Bearer ${await xumm.environment.bearer}`,
      };

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/doc/list?page=${page}&limit=10`,
        {
          headers,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error getting documents:", error);
    }
  }

  async function getDocument(documentId) {
    try {
      const headers = {
        Authorization: `Bearer ${await xumm.environment.bearer}`,
      };

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/doc/${documentId}`,
        {
          headers,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error getting document: ", error);
    }
  }

  async function getDocumentByIdAndSignerId(documentId, signerId) {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/doc/${documentId}/${signerId}`,
        {}
      );

      return response.data;
    } catch (error) {
      console.error("Error getting document: ", error);
    }
  }

  async function addAuthorizedSigners(documentId, signers) {
    const headers = {
      Authorization: `Bearer ${await xumm.environment.bearer}`,
    };

    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_API_URL}/doc/${documentId}/save-notify-signers`,
      {
        signers,
      },
      {
        headers,
      }
    );

    return response;
  }

  async function registerOffchainSignature({ docId, signerId, signature, txid }) {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/doc/${docId}/${signerId}/sign/offchain`,
        {
          signature,
          txid
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error registering off-chain signature: ", error);
      throw error;
    }
  }

  return {
    getDocuments,
    getDocument,
    addAuthorizedSigners,
    registerOffchainSignature,
    getDocumentByIdAndSignerId
  };
};

export default ApiService;
