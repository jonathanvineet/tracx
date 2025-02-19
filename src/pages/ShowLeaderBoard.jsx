import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { useLocation } from "react-router-dom";

const ShowLeaderboard = () => {
  const location = useLocation();
  const leaderboardId = location.state?.leaderboardId;
  const email = location.state?.email;
  const [leaderboard, setLeaderboard] = useState(null);
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
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

  // Invite a user
  const inviteUser = async () => {
    setInviteStatus("");

    // Validate email input
    if (!recipientEmail.trim()) {
      setInviteStatus("Please enter a valid email address.");
      return;
    }

    // Check if recipient exists in user_profiles
    const { data: user, error: userError } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("email", recipientEmail)
      .single();

    if (userError || !user) {
      setInviteStatus("The email address is not registered.");
      return;
    }

    // Add to requests table
    const { error: requestError } = await supabase.from("requests").insert({
      sender_email: email,
      receiver_email: recipientEmail,
      leaderboard_id: leaderboardId,
      leaderboard_name: leaderboard.name,
    });

    if (requestError) {
      console.error("Error sending invitation:", requestError);
      setInviteStatus("Failed to send invitation. Please try again.");
      return;
    }

    setInviteStatus(`Invitation sent to ${recipientEmail}!`);
    setRecipientEmail(""); // Clear input field
    setShowInvitePopup(false); // Close popup
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
            {user.email} - Position: {user.position}, Steps: {user.steps}
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
            type="email"
            placeholder="Enter recipient's email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
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
