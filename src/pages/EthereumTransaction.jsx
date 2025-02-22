import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";

const EthereumTransaction = ({ id, defaultWalletAddress, userEmail }) => {
  const [amount, setAmount] = useState("");
  const [transactionHash, setTransactionHash] = useState(null);
  const [error, setError] = useState(null);
  const [stake, setStake] = useState(0);

  useEffect(() => {
    const fetchStake = async () => {
      if (!id) {
        console.error("Error: Id is undefined");
        return;
      }

      const { data, error } = await supabase
        .from("leaderboards")
        .select("users")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching stake:", error);
        return;
      }

      if (!data || !data.users) {
        console.error("No data found for the given Id.");
        return;
      }
      
      const userData = data.users.find((user) => user.email === userEmail);
      if (!userData) {
        console.error("User not found in users JSON.");
        return;
      }

      setStake(userData.stake ?? 0);
    };

    fetchStake();
  }, [id, userEmail]);

  const handleSendTransaction = async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed.");
      return;
    }


    setError("");
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const sender = accounts[0];

      const transactionParameters = {
        to: defaultWalletAddress,
        from: sender,
        value: (parseFloat(amount) * 1e18).toString(16),
      };

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      });

      setTransactionHash(txHash);

      // Fetch the latest users data
      const { data, error: fetchError } = await supabase
        .from("leaderboards")
        .select("users")
        .eq("id", id)
        .single();

      if (fetchError || !data) {
        console.error("Error fetching users JSON:", fetchError);
        setError("Transaction succeeded, but failed to fetch users data.");
        return;
      }

      // Update stake for the logged-in user
      const updatedUsers = data.users.map((user) =>
        user.email === userEmail ? { ...user, stake: Number(amount) } : user
      );

      // Update Supabase
      const { error: updateError } = await supabase
        .from("leaderboards")
        .update({ users: updatedUsers })
        .eq("id", id);

      if (updateError) {
        console.error("Error updating stake in Supabase:", updateError);
        setError("Transaction succeeded, but failed to update stake.");
      } else {
        console.log("Stake updated successfully.");
        setStake(Number(amount));
      }
    } catch (error) {
      console.error(error);
      setError("Transaction failed. Please try again.");
    }
  };

  return (
    <div>
      <h3>Send ETH to the Leaderboard Wallet</h3>
      {Number(stake ?? 0) === 0|| stake == "unpaid" ? (
        <>
          <input
            type="text"
            placeholder="Enter amount in ETH"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button onClick={handleSendTransaction}>Send</button>
        </>
      ) : (
        <p>You have already staked. No need to send ETH again.</p>
      )}

      {transactionHash && (
        <p>
          Transaction successful! Hash:{" "}
          <a
            href={'https://etherscan.io/tx/${transactionHash}'}
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