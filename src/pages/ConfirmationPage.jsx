import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
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
  const [nickname, setNickname] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isNicknameStep, setIsNicknameStep] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const confirmUser = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const email = params.get("email");

      // Log token and email for debugging
      console.log("Extracted Token:", token);
      console.log("Extracted Email:", email);

      if (!token || !email) {
        alert("Missing token or email in the URL!");
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          type: "signup",
          token,
          email,
        });

        if (error) {
          console.error("Supabase Error:", error);
          alert(`Email confirmation failed: ${error.message}`);
          return;
        }

        // Successfully confirmed
        window.localStorage.setItem("email_confirmed", "true");
        setUserEmail(email);
        setEmailConfirmed(true);
      } catch (err) {
        console.error("Error during email confirmation:", err);
        alert("An unexpected error occurred during confirmation.");
      }
    };

    confirmUser();
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3.eth.getAccounts();
        setWalletAddress(accounts[0]);
        setWalletConnected(true);
      } catch (error) {
        console.error("MetaMask connection error:", error);
        alert("MetaMask connection failed!");
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const handleGoogleFitLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const accessToken = tokenResponse.access_token;
      const refreshToken = tokenResponse.refresh_token;

      setGoogleFitAccessToken(accessToken);
      setGoogleFitRefreshToken(refreshToken);
      setGoogleFitConnected(true);

      try {
        const res = await axios.post(
          "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
          {
            aggregateBy: [{ dataTypeName: "com.google.step_count.delta" }],
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
        console.error("Google Fit API error:", error);
        alert("Failed to fetch Google Fit data!");
      }
    },
    onError: (error) => {
      console.error("Google Fit login error:", error);
      alert("Google Fit login failed!");
    },
    scope: "https://www.googleapis.com/auth/fitness.activity.read",
  });

  const handleInterestsSubmit = async () => {
    if (!interests) {
      alert("Please enter your interests!");
      return;
    }

    try {
      const { error } = await supabase.from("user_profiles").upsert(
        {
          email: userEmail,
          wallet_address: walletAddress,
          google_fit_access_token: googleFitAccessToken,
          google_fit_refresh_token: googleFitRefreshToken,
          steps,
          interests,
        },
        { onConflict: "email" }
      );

      if (error) {
        throw error;
      }

      setIsNicknameStep(true);
    } catch (error) {
      console.error("Error saving interests:", error);
      alert(`Error saving interests: ${error.message}`);
    }
  };

  const handleNicknameSubmit = async () => {
    if (!nickname) {
      alert("Please enter your nickname!");
      return;
    }

    try {
      const { error } = await supabase.from("user_profiles").upsert(
        {
          email: userEmail,
          nickname,
        },
        { onConflict: "email" }
      );

      if (error) {
        throw error;
      }

      alert("Profile saved successfully!");
      navigate("/dashboard", { state: { email: userEmail } });
    } catch (error) {
      console.error("Error saving nickname:", error);
      alert(`Error saving nickname: ${error.message}`);
    }
  };

  return (
    <div>
      {emailConfirmed ? (
        walletConnected ? (
          googleFitConnected ? (
            isNicknameStep ? (
              <div>
                <h2>Enter Your Nickname</h2>
                <input
                  type="text"
                  placeholder="Enter your nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
                <button onClick={handleNicknameSubmit}>Save Nickname</button>
              </div>
            ) : (
              <div>
                <h2>Steps Data Fetched: {steps}</h2>
                <input
                  type="text"
                  placeholder="Enter your interests"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                />
                <button onClick={handleInterestsSubmit}>Next</button>
              </div>
            )
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
