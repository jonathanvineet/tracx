import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { useLocation } from "react-router-dom";

const ShowLeaderboard = () => {
  const location = useLocation();
  const leaderboardId = location.state?.leaderboardId;
  const email = location.state?.email;
  const [leaderboard, setLeaderboard] = useState(null);
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [recipientNickname, setRecipientNickname] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");

  // Fetch leaderboard details
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!leaderboardId) return;

      const { data, error } = await supabase
        .from("leaderboards")
        .select("*")
        .eq("id", leaderboardId)
        .single();

      if (error) {
        console.error("Error fetching leaderboard:", error);
        alert("Failed to fetch leaderboard. Please try again.");
        return;
      }

      setLeaderboard(data);
    };

    fetchLeaderboard();
  }, [leaderboardId]);

  // Invite a user by nickname
  const inviteUser = async () => {
    setInviteStatus("");

    if (!recipientNickname.trim()) {
      setInviteStatus("Please enter a valid nickname.");
      return;
    }

    // Fetch the recipient's email, steps, and nickname using their nickname
    const { data: recipient, error: recipientError } = await supabase
      .from("user_profiles")
      .select("email, steps, nickname")
      .eq("nickname", recipientNickname)
      .single();

    if (recipientError || !recipient) {
      setInviteStatus("The nickname is not registered.");
      return;
    }

    // Add the user to the leaderboard's users list
    const updatedUsers = [
      ...leaderboard.users,
      {
        email: recipient.email,
        position: leaderboard.users.length + 1,
        steps: recipient.steps,
        nickname: recipient.nickname,
      },
    ];

    const { error: updateError } = await supabase
      .from("leaderboards")
      .update({ users: updatedUsers })
      .eq("id", leaderboardId);

    if (updateError) {
      console.error("Error updating leaderboard:", updateError);
      setInviteStatus("Failed to add user. Please try again.");
      return;
    }

    setLeaderboard({ ...leaderboard, users: updatedUsers });
    setInviteStatus(`${recipientNickname} has been added to the leaderboard!`);
    setRecipientNickname("");
    setShowInvitePopup(false);
  };

  if (!leaderboard) {
    return <p>Loading leaderboard...</p>;
  }

  return (
    <div>
      <h1>{leaderboard.name}</h1>
      <h2>Participants:</h2>
      <ul>
        {leaderboard.users.map((user, index) => (
          <li key={index}>
            {user.nickname} - Position: {user.position}, Steps: {user.steps}
          </li>
        ))}
      </ul>
      <p>Your email: {email}</p>

      {/* Invite Button */}
      <button onClick={() => setShowInvitePopup(true)}>Invite People</button>

      {/* Invite Popup */}
      {showInvitePopup && (
        <div style={{ border: "1px solid black", padding: "1rem", margin: "1rem 0" }}>
          <h3>Invite Someone to {leaderboard.name}</h3>
          <input
            type="text"
            placeholder="Enter recipient's nickname"
            value={recipientNickname}
            onChange={(e) => setRecipientNickname(e.target.value)}
          />
          <button onClick={inviteUser}>Send Invite</button>
          <button onClick={() => setShowInvitePopup(false)}>Cancel</button>
          {inviteStatus && <p>{inviteStatus}</p>}
        </div>
      )}
    </div>
  );
};

export default ShowLeaderboard;
