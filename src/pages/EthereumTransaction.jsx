import { useState } from "react";

const EthereumTransaction = ({ defaultWalletAddress }) => {
  const [amount, setAmount] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [error, setError] = useState("");

  const handleSendTransaction = async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed.");
      return;
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    setError("");
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const sender = accounts[0];

      const transactionParameters = {
        to: defaultWalletAddress, // The recipient address
        from: sender, // The sender's MetaMask wallet address
        value: (parseFloat(amount) * 1e18).toString(16), // Amount in wei (1 ETH = 10^18 wei)
      };

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      });

      setTransactionHash(txHash);
      setAmount("");
    } catch (err) {
      console.error(err);
      setError("Transaction failed. Please try again.");
    }
  };

  return (
    <div>
      <h3>Send ETH to the Leaderboard Wallet</h3>
      <input
        type="text"
        placeholder="Enter amount in ETH"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleSendTransaction}>Send</button>
      {transactionHash && (
        <p>
          Transaction successful! Hash:{" "}
          <a
            href={`https://etherscan.io/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {transactionHash}
          </a>
        </p>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default EthereumTransaction;
