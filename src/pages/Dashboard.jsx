import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { BrowserProvider } from "ethers";
import { meta } from "@eslint/js";
import { ethers } from "ethers";
import "./Dashboard.css";
const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const [steps, setSteps] = useState(null);
  const [leaderboards, setLeaderboards] = useState([]);
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [showMintDialog, setShowMintDialog] = useState(false); 
  const [topic, setTopic] = useState("");
   // State for dialog visibility

  // Import local images
  const images = [
    { id: 1, src: "src\\pages\\images\\image1.jpeg", alt: "Image_1" },
    { id: 2, src: "src\\pages\\images\\image2.webp", alt: "Image_2" },
    { id: 3, src: "src\\pages\\images\\image3.webp", alt: "Image_3" },
    { id: 4, src: "src\\pages\\images\\image4.jpeg", alt: "Image_4" },
  ];

  // Fetch Google Fit access and refresh tokens from the database
  useEffect(() => {
    const fetchTokens = async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("google_fit_access_token, google_fit_refresh_token")
        .eq("email", email)
        .single();

      if (error) {
        console.error("Error fetching Google Fit tokens:", error);
      } else {
        setAccessToken(data?.google_fit_access_token);
        setRefreshToken(data?.google_fit_refresh_token);
      }
    };

    fetchTokens();
  }, [email]);
  
  // Refresh the access token using the refresh token
  const refreshAccessToken = async () => {
    if (!refreshToken) {
      console.error("No refresh token available");
      return;
    }

    try {
      const res = await axios.post("https://oauth2.googleapis.com/token", null, {
        params: {
          client_id: "YOUR_CLIENT_ID", // Replace with your client ID
          client_secret: "YOUR_CLIENT_SECRET", // Replace with your client secret
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        },
      });

      const newAccessToken = res.data.access_token;
      await supabase
        .from("user_profiles")
        .update({ google_fit_access_token: newAccessToken })
        .eq("email", email);

      setAccessToken(newAccessToken);
    } catch (error) {
      console.error("Error refreshing Google Fit access token:", error);
    }
  };
// Fetch leaderboards function
async function fetchLeaderboards(email) {
  try {
    const filter = JSON.stringify([{ email }]); // Ensure proper JSON formatting
    const { data, error } = await supabase
      .from('leaderboards')
      .select('*')
      .filter('users', 'cs', filter); // Use the 'cs' operator with a stringified filter

    if (error) {
      throw error;
    }

    console.log('Fetched leaderboard:', data);
    return data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
  }
}
// Fetch leaderboards when component mounts or when email changes
useEffect(() => {
  const getLeaderboards = async () => {
    const boards = await fetchLeaderboards(email);
    setLeaderboards(boards);
  };

  if (email) {
    getLeaderboards();
  }
}, [email]);

const handleCreateLeaderboard = () => {
  navigate("/create-leaderboard", { state: { email } });
};

const handleViewLeaderboard = (leaderboardId) => {
  navigate("/show-leaderboard", { state: { leaderboardId, email } });
};
  

  const mintNFT = async (metadataURL) => {
    try {
      console.log("Metadata URL:", metadataURL);
  
      // Check if MetaMask is available
      if (!window.ethereum) {
        console.error("MetaMask is not installed or not accessible.");
        alert("Please install MetaMask to use this feature.");
        return;
      }
  
      console.log("Ethereum provider detected:", window.ethereum);
  
      // Initialize provider and signer
      let provider;
      try {
        provider = new BrowserProvider(window.ethereum);
        console.log("BrowserProvider initialized:", provider);
      } catch (err) {
        console.error("Error initializing BrowserProvider:", err);
        alert("Failed to connect to Ethereum provider. Please try again.");
        return;
      }
  
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log("Signer Address:", signerAddress);
  
      // Verify network (Sepolia Testnet)
      const network = await provider.getNetwork();
      console.log("Connected Network:", network);
  
      // Fetch wallet address from Supabase
      const { data, error } = await supabase
        .from("user_profiles")
        .select("wallet_address")
        .eq("email", email)
        .single();
  
      if (error || !data?.wallet_address) {
        console.error("Error fetching wallet address:", error || "No wallet address found");
        alert("Failed to retrieve wallet address. Please try again.");
        return;
      }
  
      const walletAddress = data.wallet_address;
      console.log("Fetched Wallet Address:", walletAddress);
  
      // Define the contract
      const contractAddress = "0x6d203Bb93DdB6fD534Fb68031955C71927F93318"; // Replace with your deployed contract address
      const contractABI = [
        {
          "inputs": [
            { "internalType": "address", "name": "recipient", "type": "address" },
            { "internalType": "string", "name": "tokenURI", "type": "string" }
          ],
          "name": "mintNFT",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];
  
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      console.log("Contract Instance:", contract);
  
      // Call the mint function
      console.log(`Calling mint function with: walletAddress=${walletAddress}, metadataURL=${metadataURL}`);
      const tx = await contract.mintNFT(walletAddress, metadataURL);
      console.log("Transaction sent:", tx);
  
      // Wait for the transaction to complete
      const receipt = await tx.wait();
      console.log("Transaction Receipt:", receipt);
  
      alert("NFT minted successfully!");
    } catch (err) {
      console.error("Error during NFT minting:", err.message);
      alert(err.message || "An error occurred while minting the NFT. Please try again.");
    }
  };
  
  // Update steps in the leaderboard
  const updateLeaderboard = async (newSteps) => {
    try {
      const leaderboards = await fetchLeaderboards(email); // Fetch all leaderboards for the user
      if (!leaderboards || leaderboards.length === 0) {
        console.log("No leaderboards found for the user.");
        return;
      }
  
      // Iterate through each leaderboard and update the user's steps
      for (const leaderboard of leaderboards) {
        const { id, users } = leaderboard;
  
        // Update the steps for the user in the `users` array
        const updatedUsers = users.map((user) =>
          user.email === email ? { ...user, steps: newSteps } : user
        );
  
        // Sort users by steps in descending order
        updatedUsers.sort((a, b) => b.steps - a.steps);
  
        // Update positions based on the sorted order
        updatedUsers.forEach((user, index) => {
          user.position = index + 1;
        });
  
        // Update the leaderboard in the database
        const { error } = await supabase
          .from("leaderboards")
          .update({ users: updatedUsers })
          .eq("id", id);
  
        if (error) {
          console.error(`Error updating leaderboard with ID ${id}:`, error);
          return;
        }
      }
  
      console.log("All relevant leaderboards updated successfully!");
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };  
  // Fetch steps from Google Fit
  useEffect(() => {
    const fetchSteps = async () => {
      if (accessToken) {
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
    
          setSteps(stepData); // Update state
    
          // Update steps in user_profiles table
          const { error: profileError } = await supabase
            .from("user_profiles")
            .update({ steps: stepData }) // Ensure `steps` column exists
            .eq("email", email);
    
          if (profileError) {
            console.error("Error updating steps in user_profiles:", profileError);
          } else {
            console.log("Updated steps in user_profiles:", stepData);
          }
    
          // Update leaderboard
          await updateLeaderboard(stepData);
        } catch (error) {
          console.error("Failed to fetch steps data:", error);
          if (error.response && error.response.status === 401) {
            await refreshAccessToken(); // Refresh the token if unauthorized
          }
        }
      }
    };
    
    fetchSteps();
    const interval = setInterval(fetchSteps, 10000);

    return () => clearInterval(interval);
  }, [accessToken, refreshToken]);

  const handleGoogleFitLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const newAccessToken = tokenResponse.access_token;
      const newRefreshToken = tokenResponse.refresh_token;

      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);

      try {
        await supabase
          .from("user_profiles")
          .update({
            google_fit_access_token: newAccessToken,
            google_fit_refresh_token: newRefreshToken,
          })
          .eq("email", email);

        alert("Google Fit connected successfully!");
      } catch (error) {
        console.error("Error saving Google Fit tokens:", error);
        alert("Failed to connect to Google Fit!");
      }
    },
    onError: (error) => {
      console.error("Google Fit login error:", error);
      alert("Google Fit login failed!");
    },
    scope: "https://www.googleapis.com/auth/fitness.activity.read",
  });

  const showLeaderboards = () => {
    navigate("/leaderboards", { state: { email } });
  };

  const showRequests = () => {
    navigate("/requests", { state: { email } });
  };

  const toggleMintDialog = () => {
    setShowMintDialog(!showMintDialog);
  };


  return (
    <div className="dashboard-container">
      <h1>Welcome to the Dashboard!</h1>
      <p className="steps-counter">
        Your Steps Today: {steps !== null ? steps : "Loading..."}
      </p>
  
      {/* Leaderboards Container */}
      <div className="leaderboard-container">
        <h2>User Leaderboards</h2>
        {leaderboards && leaderboards.length > 0 ? (
          <ul className="leaderboard-list">
            {leaderboards.map((leaderboard) => (
              <li key={leaderboard.id} className="leaderboard-item">
                <span>{leaderboard.name}</span>
                <button
                  className="leaderboard-button"
                  onClick={() => handleViewLeaderboard(leaderboard.id)}
                >
                  View
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No leaderboards found. Create one to get started!</p>
        )}
  
        <button onClick={handleCreateLeaderboard} className="add-button">
          +
        </button>
      </div>
  
      {/* Other Buttons */}
      <button onClick={showRequests}>Requests</button>
      <button onClick={() => handleGoogleFitLogin()}>Connect to Google Fit</button>
      <button onClick={toggleMintDialog}>Mint NFT</button>
  
      {showMintDialog && (
        <div className="modal">
          <h2>Select an Image to Mint as NFT</h2>
          <div className="image-grid">
            {images.map((image) => (
              <img
                key={image.id}
                src={image.src}
                alt={image.alt}
                onClick={async () => {
                  console.log(`Photo clicked: ${image.alt}`);
  
                  try {
                    const { data, error } = await supabase
                      .from("nfts")
                      .select("metadata_url, photo_name")
                      .eq("photo_name", image.alt);
  
                    if (error) {
                      console.error("Error fetching metadata URL:", error);
                      alert("Failed to fetch NFT metadata.");
                      return;
                    }
  
                    if (data && data.length === 1) {
                      alert(`Metadata URL: ${data[0].metadata_url}`);
                      await mintNFT(data[0].metadata_url);
                    } else if (data && data.length === 0) {
                      alert("No metadata URL found for the selected image.");
                    } else {
                      alert("Multiple rows found. Check your database.");
                    }
                  } catch (err) {
                    console.error("Error selecting image for minting:", err);
                    alert("An unexpected error occurred.");
                  }
                }}
              />
            ))}
          </div>
          <button onClick={toggleMintDialog} className="close-button">
            Close
          </button>
        </div>
      )}
    </div>
  );
  
};

export default Dashboard;