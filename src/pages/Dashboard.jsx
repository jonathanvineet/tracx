import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const [steps, setSteps] = useState(null);
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [showMintDialog, setShowMintDialog] = useState(false); // State for dialog visibility

  // Import local images
  const images = [
    { id: 1, src: "src\\pages\\images\\image1.jpeg", alt: "Image 1" },
    { id: 2, src: "src\\pages\\images\\image2.webp", alt: "Image 2" },
    { id: 3, src: "src\\pages\\images\\image3.webp", alt: "Image 3" },
    { id: 4, src: "src\\pages\\images\\image4.jpeg", alt: "Image 4" },
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

  // Update the leaderboard when the steps change
  const updateLeaderboard = async (newSteps) => {
    try {
      const { data, error } = await supabase
        .from("leaderboards")
        .select("id, users")
        .contains("users", `[{"email": "${email}"}]`)
        .single();

      if (error) {
        console.error("Error fetching leaderboard:", error);
        return;
      }

      const leaderboardId = data?.id;
      const users = data?.users;

      const updatedUsers = users.map((user) =>
        user.email === email ? { ...user, steps: newSteps } : user
      );

      const { error: updateError } = await supabase
        .from("leaderboards")
        .update({ users: updatedUsers })
        .eq("id", leaderboardId);

      if (updateError) {
        console.error("Error updating leaderboard:", updateError);
        return;
      }

      console.log("Leaderboard updated successfully!");
    } catch (error) {
      console.error("Error updating leaderboard:", error);
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
          updateLeaderboard(stepData);
        } catch (error) {
          console.error("Failed to fetch steps data:", error);
          if (error.response && error.response.status === 401) {
            await refreshAccessToken();
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
    <div>
      <h1>Welcome to the Dashboard!</h1>
      <p>Your Steps Today: {steps !== null ? steps : "Loading..."}</p>
      <button onClick={showLeaderboards}>Show My Leaderboards</button>
      <button onClick={showRequests}>Requests</button>
      <button onClick={() => handleGoogleFitLogin()}>Connect to Google Fit</button>
      <button onClick={toggleMintDialog}>Mint NFT</button>

      {showMintDialog && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            zIndex: 1000,
          }}
        >
          <h2>Select an Image to Mint as NFT</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "10px",
            }}
          >
            {images.map((image) => (
              <img
                key={image.id}
                src={image.src}
                alt={image.alt}
                style={{
                  width: "100%",
                  height: "auto",
                  cursor: "pointer",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
                onClick={() => {
                  alert(`Minting NFT for ${image.alt}`);
                  toggleMintDialog();
                }}
              />
            ))}
          </div>
          <button onClick={toggleMintDialog} style={{ marginTop: "20px" }}>
            Close
          </button>
        </div>
      )}

      {showMintDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 999,
          }}
          onClick={toggleMintDialog}
        ></div>
      )}
    </div>
  );
};

export default Dashboard;


//https://ipfs.io/ipfs/bafkreic44ctaitgayuu66p5heb2y5i5tfchtiiyksvgkphmssthked4zha
//