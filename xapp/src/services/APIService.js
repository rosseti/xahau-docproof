import axios from "axios";

const ApiService = (xumm) => {
  if (!xumm) {
    throw new Error("Xumm object is required for API calls");
  }

  async function getDocuments() {
    try {
      const headers = {
        Authorization: `Bearer ${await xumm.environment.bearer}`,
      };

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/doc/list`,
        {
          headers,
        }
      );

      const { documents } = response.data;

      return documents;
    } catch (error) {
      console.error("Error getting documents:", error);
    }
  }

  async function getDocument(documentId) {
    try {
      const headers = {
        Authorization: `Bearer ${await xumm.environment.bearer}`,
      };

      console.log(headers);

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

  async function markDocumentAsSigned(documentId, signerId, txid) {
    try {
      const headers = {
        Authorization: `Bearer ${await xumm.environment.bearer}`,
      };

      const data = {
        txid,
      };

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/doc/${documentId}/${signerId}/sign`,
        data,
        {
          headers,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error updating status: ", error.response.data);
    }
  }

  return {
    getDocuments,
    getDocument,
    addAuthorizedSigners,
    getDocumentByIdAndSignerId,
    markDocumentAsSigned,
  };
};

export default ApiService;
