import { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";

const CreateLeaderboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const [leaderboardName, setLeaderboardName] = useState("");

  const createLeaderboard = async () => {
    if (!leaderboardName.trim()) {
      alert("Please enter a leaderboard name.");
      return;
    }

    const uniqueId = Date.now().toString(); // Generate a unique ID

    // Fetch the user's current steps and nickname from user_profiles
    const { data: userProfile, error: fetchError } = await supabase
      .from("user_profiles")
      .select("steps, nickname")
      .eq("email", email)
      .single();

    if (fetchError) {
      console.error("Error fetching user profile:", fetchError);
      alert("Failed to fetch user data. Please try again.");
      return;
    }

    const userSteps = userProfile?.steps || 0; // Use the fetched steps or default to 0
    const userNickname = userProfile?.nickname || "Anonymous"; // Default nickname if not set

    const newLeaderboard = {
      id: uniqueId,
      name: leaderboardName,
      users: [
        {
          email,
          position: 1,
          steps: userSteps,
          nickname: userNickname, // Include the fetched nickname
        },
      ],
    };

    // Add the leaderboard to the "leaderboards" table
    const { error: leaderboardError } = await supabase
      .from("leaderboards")
      .insert(newLeaderboard);

    if (leaderboardError) {
      console.error("Error creating leaderboard:", leaderboardError);
      alert("Failed to create leaderboard. Please try again.");
      return;
    }

    // Fetch the current leaderboards array for the user
    const { data: userLeaderboards, error: leaderboardsFetchError } = await supabase
      .from("user_profiles")
      .select("leaderboards")
      .eq("email", email)
      .single();

    if (leaderboardsFetchError) {
      console.error("Error fetching user leaderboards:", leaderboardsFetchError);
      alert("Failed to fetch user data. Please try again.");
      return;
    }

    const updatedLeaderboards = userLeaderboards?.leaderboards
      ? [...userLeaderboards.leaderboards, uniqueId]
      : [uniqueId]; // Initialize if undefined

    // Update the user's profile with the new leaderboard ID
    const { error: userError } = await supabase
      .from("user_profiles")
      .update({ leaderboards: updatedLeaderboards })
      .eq("email", email);

    if (userError) {
      console.error("Error updating user profile:", userError);
      alert("Failed to update user profile. Please try again.");
      return;
    }

    alert(`Leaderboard "${leaderboardName}" created successfully!`);

    // Navigate to the "Show Leaderboard" page with the leaderboard ID and email
    navigate("/show-leaderboard", {
      state: { leaderboardId: uniqueId, email },
    });
  };

  return (
    <div>
      <h1>Create a Leaderboard</h1>
      <input
        type="text"
        placeholder="Enter leaderboard name"
        value={leaderboardName}
        onChange={(e) => setLeaderboardName(e.target.value)}
      />
      <button onClick={createLeaderboard}>Create</button>
    </div>
  );
};

export default CreateLeaderboard;
