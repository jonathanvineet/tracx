import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { useLocation } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const location = useLocation();
  const email = location.state?.email;
  const [steps, setSteps] = useState(null);
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    const fetchAccessToken = async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("google_fit_access_token")
        .eq("email", email)
        .single();

      if (error) {
        console.error("Error fetching Google Fit access token:", error);
      } else {
        setAccessToken(data?.google_fit_access_token);
      }
    };

    fetchAccessToken();
  }, [email]);

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
        } catch (error) {
          console.error("Failed to fetch steps data:", error);
        }
      }
    };

    // Fetch steps initially and every 10 seconds
    fetchSteps();
    const interval = setInterval(fetchSteps, 10000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [accessToken]);

  return (
    <div>
      <h1>Welcome to the Dashboard!</h1>
      <p>Your Steps Today: {steps !== null ? steps : "Loading..."}</p>
    </div>
  );
};

export default Dashboard;
