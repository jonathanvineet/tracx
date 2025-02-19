import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";

const MyLeaderboards = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [leaderboards, setLeaderboards] = useState([]);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      const { data: userProfile, error } = await supabase
        .from("user_profiles")
        .select("leaderboards")
        .eq("email", email)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return;
      }

      const leaderboardIds = userProfile?.leaderboards || [];
      if (leaderboardIds.length > 0) {
        const { data, error: leaderboardsError } = await supabase
          .from("leaderboards")
          .select("*")
          .in("id", leaderboardIds);

        if (leaderboardsError) {
          console.error("Error fetching leaderboards:", leaderboardsError);
          return;
        }

        setLeaderboards(data);
      }
    };

    fetchLeaderboards();
  }, [email]);

  const createLeaderboard = () => {
    navigate("/create-leaderboard", { state: { email } });
  };

  const viewLeaderboard = (leaderboardId) => {
    navigate("/show-leaderboard", { state: { leaderboardId, email } });
  };

  return (
    <div>
      <h1>My Leaderboards</h1>
      <button onClick={createLeaderboard}>Create New Leaderboard</button>
      <ul>
        {leaderboards.map((lb) => (
          <li key={lb.id}>
            {lb.name}{" "}
            <button onClick={() => viewLeaderboard(lb.id)}>View</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyLeaderboards;
