import axios from "axios";

const ApiService = (xumm) => {
  if (!xumm) {
    throw new Error("Xumm object is required for API calls");
  }

  console.log("Carregou XUMM", xumm);

  async function getDocuments() {
    try {
      const headers = {
        'Authorization': `Bearer ${await xumm.environment.bearer}`,
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

  return {
    getDocuments,
  };
};

export default ApiService;

// const { xumm } = useContext(AppContext);
// export const getRequestHeaders = async () => {
//   console.log(xumm);

//   const bearer = await xumm.environment.bearer;
//   console.log(bearer);
//   // const wallet = localStorage.getItem("wallet");
//   // const signature = localStorage.getItem("signature");
//   // const message = localStorage.getItem("message");

//   return {
//     'Authorization': `Bearer ${bearer}}`,
//   }
// }

// export async function getDocument(documentId) {
//   try
//   {
//     const headers = await getRequestHeaders();
//     const response = await axios.get(
//       `${process.env.NEXT_PUBLIC_API_URL}/doc/${documentId}`,
//       {
//         headers
//       }
//     );

//     return response.data;
//   } catch (error) {
//     console.error("Error getting document: ", error);
//   }
// }

// export async function addAuthorizedSigners(documentId, authorizedSigners) {
//   try
//   {
//     const headers = await getRequestHeaders();
//     const response = await axios.put(
//       `${process.env.NEXT_PUBLIC_API_URL}/doc/${documentId}/authorized-signers`,
//       {
//         authorizedSigners
//       },
//       {
//         headers
//       }
//     );

//     return response.data;
//   } catch (error) {
//     console.error("Error adding authorized signers:", error);
//   }
// }

// export async function getDocuments() {
//   try
//   {
//     const headers = await getRequestHeaders();

//     const response = await axios.get(
//       `${process.env.NEXT_PUBLIC_API_URL}/doc/list`,
//       {
//         headers
//       }
//     );

//     const { documents } = response.data;

//     return documents;
//   } catch (error) {
//     console.error("Error getting documents:", error);
//   }
// }

// export async function updateDocumentStatus(documentId, newStatus, params = {}) {
//   try {
//     const data = {
//       newStatus,
//     };

//     if (typeof params.transactionHash !== undefined) {
//       data.transactionHash = params.transactionHash;
//     }

//     if (typeof params.contractStorageKey !== undefined) {
//       data.contractStorageKey = params.contractStorageKey;
//     }

//     const headers = getRequestHeaders();
//     const response = await axios.put(
//       `${process.env.NEXT_PUBLIC_API_URL}/doc/${documentId}/status`,
//       data,
//       {
//         headers
//       }
//     );

//     return response.data;
//   } catch (error) {
//     console.error("Error updating status: ", error.response.data);
//   }
// }
