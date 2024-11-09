import { FiPlus } from "react-icons/fi";
import { SiRipple, SiXrp } from "react-icons/si";
import { toast } from "react-toastify";

const XrplSidechainButton = () => {
  const addXrplEvmNetwork = async () => {
    if (window.ethereum) {
      try {
        // Detalhes da XRPL EVM
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x15F902",
              chainName: "XRPL EVM",
              rpcUrls: ["https://rpc-url.xrpl-evm.com"], 
              nativeCurrency: {
                name: "XRP",
                symbol: "XRP",
                decimals: 18,
              },
              blockExplorerUrls: ["https://explorer.xrplevm.org/"],
            },
          ],
        });

        toast.success("XRPL EVM added to MetaMask successfully!");
      } catch (error) {
        toast.error("Error adding XRPL EVM to MetaMask: ", error);
      }
    } else {
      toast.error("Metamask not found. Please, install it.");
    }
  };

  return (
    <button
      onClick={addXrplEvmNetwork}
      className="btn btn-default shadow-lg"
    >
      <SiXrp /> Add XRPL to MetaMask
    </button>
  );
};

export default XrplSidechainButton;
