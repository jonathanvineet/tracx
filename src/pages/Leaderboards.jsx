import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Leaderboards.css";
const Leaderboards = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const [leaderboards, setLeaderboards] = useState([]);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      if (email) {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("leaderboards")
          .eq("email", email)
          .single();

        if (error) {
          console.error("Error fetching leaderboards:", error);
        } else {
          setLeaderboards(data?.leaderboards || []);
        }
      }
    };

    fetchLeaderboards();
  }, [email]);

  const handleCreateLeaderboard = () => {
    navigate("/create-leaderboard", { state: { email } });
  };

  const handleViewLeaderboard = (leaderboardId) => {
    navigate("/show-leaderboard", { state: { leaderboardId, email } });
  };

  return (
    <div>
      <h1>My Leaderboards</h1>

      {leaderboards.length > 0 ? (
        <ul>
          {leaderboards.map((id, index) => (
            <li key={index}>
              <button onClick={() => handleViewLeaderboard(id)}>
                View Leaderboard {id}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No leaderboards found. Create one to get started!</p>
      )}

      <button onClick={handleCreateLeaderboard}>Create Leaderboard</button>
    </div>
  );
};

export default Leaderboards;
