import  { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient"; // Make sure to set up your supabase client
import Web3 from "web3";

const ConfirmationPage = () => {
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [interests, setInterests] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Check for email confirmation
  useEffect(() => {
    const confirmUser = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const email = params.get("email");

      if (!token || !email) {
        alert("Missing token or email!");
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        type: "signup",
        token,
        email,
      });

      if (error) {
        alert(`Confirmation failed: ${error.message}`);
        return;
      }

      window.localStorage.setItem("email_confirmed", "true");
      setUserEmail(email);
      setEmailConfirmed(true);
    };

    confirmUser();
  }, []);

  // Handle MetaMask Wallet Connection
  const connectWallet = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      try {
        // Request wallet connection
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3.eth.getAccounts();
        setWalletAddress(accounts[0]);
        setWalletConnected(true);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        alert("MetaMask connection failed!");
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // Handle Interests Form Submission
  const handleInterestsSubmit = async () => {
    if (!interests) {
      alert("Please enter your interests!");
      return;
    }

    // Insert the email, wallet address, and interests into the database
    // eslint-disable-next-line no-unused-vars
    const { data, error } = await supabase.from("user_profiles").insert([
      {
        email: userEmail,
        wallet_address: walletAddress,
        interests: interests,
      },
    ]);

    if (error) {
      alert(`Error saving user profile: ${error.message}`);
      return;
    }

    alert("Profile saved successfully!");
    window.location.href = "/dashboard"; // Redirect to the dashboard page
  };

  return (
    <div>
      {emailConfirmed ? (
        walletConnected ? (
          <div>
            <h2>Your Wallet is Connected!</h2>
            <input
              type="text"
              placeholder="Enter your interests"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
            />
            <button onClick={handleInterestsSubmit}>Save Interests</button>
          </div>
        ) : (
          <div>
            <h2>Connect Your Wallet</h2>
            <button onClick={connectWallet}>Connect MetaMask</button>
          </div>
        )
      ) : (
        <h1>Confirming...</h1>
      )}
    </div>
  );
};

export default ConfirmationPage;
