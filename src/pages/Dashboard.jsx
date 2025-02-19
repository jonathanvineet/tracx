import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const [steps, setSteps] = useState(null);
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");

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
      // Save the new access token in the database
      await supabase
        .from("user_profiles")
        .update({ google_fit_access_token: newAccessToken })
        .eq("email", email);

      setAccessToken(newAccessToken); // Update the state with the new access token
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
        .contains("users", `[{"email": "${email}"}]`) // Corrected query to match the user email
        .single();

      if (error) {
        console.error("Error fetching leaderboard:", error);
        return;
      }

      const leaderboardId = data?.id;
      const users = data?.users;

      // Find the user in the leaderboard and update their steps
      const updatedUsers = users.map((user) =>
        user.email === email ? { ...user, steps: newSteps } : user
      );

      // Update leaderboard with the new users array
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

          // Update the leaderboard with the new step data
          updateLeaderboard(stepData);
        } catch (error) {
          console.error("Failed to fetch steps data:", error);
          // If 401 Unauthorized error, refresh the token
          if (error.response && error.response.status === 401) {
            await refreshAccessToken();
          }
        }
      }
    };

    // Fetch steps initially and every 10 seconds
    fetchSteps();
    const interval = setInterval(fetchSteps, 10000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [accessToken, refreshToken]);

  // Navigate to the leaderboards page
  const showLeaderboards = () => {
    navigate("/leaderboards", { state: { email } });
  };

  // Navigate to the requests page
  const showRequests = () => {
    navigate("/requests", { state: { email } });
  };

  return (
    <div>
      <h1>Welcome to the Dashboard!</h1>
      <p>Your Steps Today: {steps !== null ? steps : "Loading..."}</p>
      <button onClick={showLeaderboards}>Show My Leaderboards</button>
      <button onClick={showRequests}>Requests</button>
    </div>
  );
};

export default Dashboard;
