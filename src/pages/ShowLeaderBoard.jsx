import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { useLocation } from "react-router-dom";
import EthereumTransaction from "/src/pages/EthereumTransaction.jsx";


const ShowLeaderboard = () => {
  const location = useLocation();
  const leaderboardId = location.state?.leaderboardId;
  const email = location.state?.email;
  const [leaderboard, setLeaderboard] = useState(null);
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [recipientNickname, setRecipientNickname] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const [stakeStatus, setStakeStatus] = useState("");
  const [transactionHash, setTransactionHash] = useState(null);
  const defaultWalletAddress = "0x2B5c206516c34896D41DB511BAB9E878F8C1C109"

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
// Invite a user
const inviteUser = async () => {
  setInviteStatus("");

  // Validate nickname input
  if (!recipientNickname.trim()) {
    setInviteStatus("Please enter a valid nickname.");
    return;
  }

  // Check if recipient exists in user_profiles by nickname
  const { data: user, error: userError } = await supabase
    .from("user_profiles")
    .select("email, nickname")
    .eq("nickname", recipientNickname)
    .single();

  if (userError || !user) {
    setInviteStatus("The nickname is not registered.");
    return;
  }

  // Add to requests table
  const { error: requestError } = await supabase.from("requests").insert({
    sender_email: email, // Sender's email
    receiver_email: user.email, // Recipient's email fetched by nickname
    leaderboard_id: leaderboardId, // Current leaderboard ID
    leaderboard_name: leaderboard.name, // Current leaderboard name
  });

  if (requestError) {
    console.error("Error sending invitation:", requestError);
    setInviteStatus("Failed to send invitation. Please try again.");
    return;
  }

  setInviteStatus(`Invitation sent to ${recipientNickname} (${user.email})!`);
  setRecipientNickname(""); // Clear input field
  setShowInvitePopup(false); // Close popup
};

  
  const handleTransactionSuccess = async (txHash) => {
    setTransactionHash(txHash);
    setStakeStatus("Transaction successful! Updating leaderboard...");

    const updatedUsers = leaderboard.users.map((user) =>
      user.email === email
        ? { ...user, stake: true, transactionHash: txHash }
        : user
    );

    const { error: updateError } = await supabase
      .from("leaderboards")
      .update({ users: updatedUsers })
      .eq("id", leaderboardId);

    if (updateError) {
      console.error("Error updating leaderboard:", updateError);
      setStakeStatus("Failed to update leaderboard. Please try again.");
      return;
    }

    setLeaderboard({ ...leaderboard, users: updatedUsers });
    setStakeStatus("Stake successful! You are now added to the leaderboard.");
  };

  // Handle ETH transaction failure
  const handleTransactionFailure = (error) => {
    console.error("Transaction failed:", error);
    setStakeStatus("Failed to stake ETH. Please try again.");
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
      {user.nickname} ({user.email}) - Position: {user.position}, Steps: {user.steps}
    </li>
  ))}
</ul>

      <p>Your email: {email}</p>

      {/* Invite Button */}
      <button onClick={() => setShowInvitePopup(true)}>Invite People</button>
      {leaderboard.type === "quiz" && (
        <div>
          <h3>Stake ETH to Join</h3>
          <EthereumTransaction
            defaultWalletAddress={defaultWalletAddress}
            onSuccess={handleTransactionSuccess}
            onFailure={handleTransactionFailure}
          />
          {stakeStatus && <p>{stakeStatus}</p>}
        </div>
      )}
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