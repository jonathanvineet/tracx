import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient"; // Ensure this is configured
import { useGoogleLogin } from "@react-oauth/google";
import Web3 from "web3";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ConfirmationPage = () => {
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [googleFitConnected, setGoogleFitConnected] = useState(false);
  const [googleFitAccessToken, setGoogleFitAccessToken] = useState("");
  const [googleFitRefreshToken, setGoogleFitRefreshToken] = useState("");
  const [steps, setSteps] = useState(0);
  const [interests, setInterests] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const navigate = useNavigate();

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
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3.eth.getAccounts();
        setWalletAddress(accounts[0]);
        setWalletConnected(true);
      } catch (error) {
        alert("MetaMask connection failed!");
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // Handle Google Fit Login and retrieve access token & refresh token
  const handleGoogleFitLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const accessToken = tokenResponse.access_token;
      const refreshToken = tokenResponse.refresh_token; // Get the refresh token
      setGoogleFitAccessToken(accessToken);
      setGoogleFitRefreshToken(refreshToken); // Store the refresh token
      setGoogleFitConnected(true);

      try {
        const res = await axios.post(
          "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
          {
            aggregateBy: [
              { dataTypeName: "com.google.step_count.delta" },
            ],
            bucketByTime: { durationMillis: 86400000 },
            startTimeMillis: new Date().setHours(0, 0, 0, 0),
            endTimeMillis: new Date().getTime(),
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        const stepData = res.data.bucket.reduce((total, bucket) => {
          if (bucket.dataset[0].point.length > 0) {
            return total + bucket.dataset[0].point[0].value[0].intVal;
          }
          return total;
        }, 0);

        setSteps(stepData);
      } catch (error) {
        alert("Failed to fetch Google Fit data!");
      }
    },
    onError: (error) => {
      alert("Google Fit login failed!");
      console.error(error);
    },
    scope: "https://www.googleapis.com/auth/fitness.activity.read",
  });

  // Handle Interests Form Submission
  const handleInterestsSubmit = async () => {
    if (!interests) {
      alert("Please enter your interests!");
      return;
    }

    const { error } = await supabase.from("user_profiles").upsert(
      {
        email: userEmail,
        wallet_address: walletAddress,
        google_fit_access_token: googleFitAccessToken,
        google_fit_refresh_token: googleFitRefreshToken, // Save the refresh token as well
        steps,
        interests,
      },
      { onConflict: "email" }
    );

    if (error) {
      alert(`Error saving user profile: ${error.message}`);
      return;
    }

    alert("Profile saved successfully!");
    navigate("/dashboard", { state: { email: userEmail } });
  };

  return (
    <div>
      {emailConfirmed ? (
        walletConnected ? (
          googleFitConnected ? (
            <div>
              <h2>Steps Data Fetched: {steps}</h2>
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
              <h2>Connect Google Fit</h2>
              <button onClick={handleGoogleFitLogin}>Connect Google Fit</button>
            </div>
          )
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
