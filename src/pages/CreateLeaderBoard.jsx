import { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";

const CreateLeaderboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [leaderboardName, setLeaderboardName] = useState("");
  const [type, setType] = useState(""); // For selecting type
  const [time, setTime] = useState(""); // For selecting time
  const [topic, setTopic] = useState(""); // For selecting topic (quiz-specific)

  // Predefined values for type and time
  const typeOptions = ["gym", "daily", "quiz"];
  const timeOptions = {
    gym: ["1/2 hour", "1 day", "1 week", "1 month"],
    daily: ["1/2 hour", "1 day", "1 week", "1 month"],
    quiz: ["1/2 hour"], // Quiz only allows "1/2 hour"
  };

  const createLeaderboard = async () => {
    if (!leaderboardName.trim()) {
      alert("Please enter a leaderboard name.");
      return;
    }

    if (!type || !time) {
      alert("Please select both a type and time.");
      return;
    }

    if (type === "quiz" && !topic.trim()) {
      alert("Please enter a topic for the quiz.");
      return;
    }

    const uniqueId = Date.now().toString(); // Generate a unique ID

    // Fetch the user's nickname from user_profiles
    const { data: userProfile, error: fetchError } = await supabase
      .from("user_profiles")
      .select("nickname, steps")
      .eq("email", email)
      .single();

    if (fetchError) {
      console.error("Error fetching user profile:", fetchError);
      alert("Failed to fetch user data. Please try again.");
      return;
    }

    const userNickname = userProfile?.nickname || "Anonymous"; // Default nickname if not set
    const userSteps = userProfile?.steps || 0; // Default steps if not set
    const newLeaderboard = {
      id: uniqueId,
      name: leaderboardName,
      type, // Store selected type
      time, // Store selected time
      topic: type === "quiz" ? topic : null, // Store topic only for quiz
      users: [
        {
          email,
          position: 1,
          nickname: userNickname, // Include the fetched nickname
          steps: type !== "quiz" ? userSteps : null, // Include steps only for non-quiz types
          stake: "unpaid", // Add stake field with default value "unpaid"
          score: 0, // Initialize score to 0
          quiz_status: 0,
          time:0,
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
      <br />
      <label>
        Select Type:
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setTime(""); // Reset time when type changes
            setTopic(""); // Reset topic when type changes
          }}
        >
          <option value="">--Select--</option>
          {typeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <br />
      <label>
        Select Time:
        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          disabled={!type} // Disable time selection if no type is selected
        >
          <option value="">--Select--</option>
          {type && timeOptions[type].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <br />
      {type === "quiz" && (
        <div>
          <label>
            Enter Topic:
            <input
              type="text"
              placeholder="Enter quiz topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </label>
        </div>
      )}
      <br />
      <button onClick={createLeaderboard}>Create</button>
    </div>
  );
};

export default CreateLeaderboard;
