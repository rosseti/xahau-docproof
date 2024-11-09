import ABI from "@/abi/ABI.json";
import { keccak256 } from "ethers";
import Web3 from "web3";

export const doLogin = () => {
  xumm.authorize();
};

export const getContract = () => {
  if (!window.ethereum) throw new Error(`Metamask not installed`);

  const from = localStorage.getItem("wallet");

  const web3 = new Web3(window.ethereum);

  return new web3.eth.Contract(ABI, process.env.NEXT_PUBLIC_CONTRACT_ADDRESS, {
    from,
  });
};

export const getWeb3 = () => {
  if (!window.ethereum) throw new Error(`Metamask not installed`);

  return new Web3(window.ethereum);
};

export const getGasPrice = async () => {
  const web3 = new Web3(window.ethereum);
  return await web3.eth.getGasPrice();
};

export const isOwner = async () => {
  const contract = getContract();
  return await contract.methods.isOwner().call();
};

export const addDocument = async (
  documentHash,
  authorizedSigners,
  expirationTime
) => {
  const contract = getContract();

  const gas = await contract.methods
    .addDocument(documentHash, authorizedSigners, expirationTime)
    .estimateGas();

  const gasPrice = await getGasPrice();

  console.log(documentHash, authorizedSigners, expirationTime);

  const receipt = await contract.methods
    .addDocument(documentHash, authorizedSigners, expirationTime)
    .send({
      gas,
      gasPrice,
    });

  return receipt.transactionHash;
};

export const getDocument = async (storageKey) => {
  const contract = getContract();
  return await contract.methods.documents(storageKey).call();
};

export const signDocument = async (
  contractStorageKey,
  docHash,
  signer,
  expirationTime
) => {
  const wallet = localStorage.getItem("wallet");
  const web3 = new Web3(window.ethereum);
  const contract = getContract();

  console.log(wallet);
  const userNonce = await contract.methods.userNonce(wallet).call();

  const messageHash = keccak256(
    web3.eth.abi.encodeParameters(
      ["bytes32", "bytes32", "uint256", "uint256"],
      [docHash, signer, userNonce, expirationTime]
    )
  );

  console.log("messageHash", messageHash);

  const signature = await web3.eth.personal.sign(messageHash, wallet, "");

  const gas = await contract.methods
    .signDocument(contractStorageKey, signer, signature, expirationTime)
    .estimateGas();

  const gasPrice = await getGasPrice();

  const receipt = await contract.methods
    .signDocument(contractStorageKey, signer, signature, expirationTime)
    .send({
      gas,
      gasPrice,
    });

  return receipt.transactionHash;
};
