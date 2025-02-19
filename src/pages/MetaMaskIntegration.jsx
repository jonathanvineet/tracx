/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://iobhdcqrpnizrwvfgtqt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvYmhkY3FycG5penJ3dmZndHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MDk2NzgsImV4cCI6MjA1NTI4NTY3OH0.V0Si0jS6V1MirBlQB2oMUBlS8tH9VrbvNslVFxmkMKo"
);

const MetaMaskIntegration = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract email from the previous page's state
  useEffect(() => {
    if (location.state && location.state.email) {
      setUserEmail(location.state.email);
    } else {
      console.error("Email not found. Redirecting to confirmation page...");
      navigate("/confirmation");
    }
  }, [location.state, navigate]);

  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const address = accounts[0];
        setWalletAddress(address);

        // Update user profile with wallet address
        const { error } = await supabase
          .from("user_profiles")
          .update({ wallet_address: address })
          .eq("email", userEmail);

        if (error) {
          console.error("Error saving wallet address:", error);
          return;
        }

        console.log("Wallet address saved successfully!");

        // Navigate to Google Fit integration
        navigate("/google-fit", { state: { email: userEmail, walletAddress: address } });
      } catch (error) {
        console.error("Error connecting MetaMask:", error);
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask and try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-xl font-bold mb-4">MetaMask Wallet Connection</h1>
      <button
        onClick={connectMetaMask}
        className="px-4 py-2 bg-yellow-500 text-white rounded-lg"
      >
        Connect MetaMask
      </button>
      {walletAddress && (
        <div className="mt-6 text-lg font-semibold">
          Wallet Address: {walletAddress}
        </div>
      )}
    </div>
  );
};

export default MetaMaskIntegration;
