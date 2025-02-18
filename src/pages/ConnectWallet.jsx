/* eslint-disable react/prop-types */
import { useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { supabase } from "../utils/supabaseClient";
const ConnectWallet = ({ userEmail }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [error, setError] = useState("");

  const connectWallet = async () => {
    const provider = await detectEthereumProvider();

    if (provider) {
      try {
        // Request account access
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        const userWalletAddress = accounts[0];

        setWalletAddress(userWalletAddress);
        storeWalletAddress(userEmail, userWalletAddress); // Store wallet address in your table
      } catch (err) {
        setError("Error connecting to wallet: " + err.message);
      }
    } else {
      setError("MetaMask is not installed.");
    }
  };

  const storeWalletAddress = async (email, walletAddress) => {
    const { data, error } = await supabase
      .from("users_wallets") // Ensure you have created this table
      .insert([
        {
          email: email,
          wallet_address: walletAddress,
        },
      ]);

    if (error) {
      console.error("Error storing wallet address: ", error);
    } else {
      console.log("Wallet address stored successfully:", data);
    }
  };

  return (
    <div>
      <h2>Connect Your Wallet</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!walletAddress ? (
        <button onClick={connectWallet}>Connect MetaMask</button>
      ) : (
        <p>Connected Wallet: {walletAddress}</p>
      )}
    </div>
  );
};

export default ConnectWallet;
