import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";
import EthereumTransaction from"./EthereumTransaction.jsx";
import axios from "axios";

const ShowLeaderboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { leaderboardId, email, fromResultsPage = false } = location.state || {}; 
  const [leaderboard, setLeaderboard] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null); // Remaining time for the timer
  const [topic, setTopic] = useState(""); // Initialize topic state
  const [inviteStatus, setInviteStatus] = useState("");
  const [recipientNickname, setRecipientNickname] = useState("");
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [allUsersStaked, setAllUsersStaked] = useState(false);
  const [remainingStakes, setRemainingStakes] = useState(0); 
  const [stakeStatus, setStakeStatus] = useState("");
  const [transactionHash, setTransactionHash] = useState(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [winnerWallet, setWinnerWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]); 
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [usersPaid, setUsersPaid] = useState(false);
  const defaultWalletAddress = "0x2B5c206516c34896D41DB511BAB9E878F8C1C109";
  const [azar, setAzar] = useState(fromResultsPage ? "results" : transactionHash);
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

      console.log("📌 Fetched leaderboard data:", data);
      setAzar(fromResultsPage ? "results" : transactionHash);

      setLeaderboard(data);
      setTopic(data.topic || "");
if(fromResultsPage){
      const winnerEmail = data.users.find(user => user.position === 1)?.email;

      if (winnerEmail) {
        fetchWinnerWallet(winnerEmail); // ✅ Only passing the email
      } else {
        console.error("❌ No winner found in leaderboard data.");
      }}

      // ✅ Only fetch users of this leaderboard
      const users = data.users || [];

      // ✅ Check if all users have staked ETH
      const usersNeedingStake = users.filter((user) => parseFloat(user.stake || 0) <= 0);
      setRemainingStakes(usersNeedingStake.length);
      setAllUsersStaked(usersNeedingStake.length === 0);

      console.log(`🔍 Users needing stake: ${usersNeedingStake.length}`);

      // ✅ Sort users by score and assign positions
      const sortedUsers = [...users].sort((a, b) => b.score - a.score);
      sortedUsers.forEach((user, index) => (user.position = index + 1));

      // ✅ Check if all users completed the quiz
      const allCompleted = sortedUsers.every((user) => user.score > 0);

      // ✅ Update leaderboard with sorted users
      const { error: updateError } = await supabase
        .from("leaderboards")
        .update({ users: sortedUsers })
        .eq("id", leaderboardId);

      if (updateError) {
        console.error("❌ Error updating positions in leaderboard:", updateError);
      } else {
        console.log("✅ Leaderboard positions updated successfully!");
      }

      setLeaderboard({ ...data, users: sortedUsers, allCompleted });
    };

    fetchLeaderboard();
  }, [leaderboardId, azar]);
  
  useEffect(() => {
    if (quizStartTime) {
      const timer = setTimeout(() => {
        alert("The quiz is now available!");
      }, 5 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [quizStartTime]);

  // Update remaining time
  const updateRemainingTime = (endTime) => {
    if (!endTime) return;

    const endTimeDate = new Date(endTime);
    const interval = setInterval(() => {
      const now = new Date();
      const difference = endTimeDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        setRemainingTime("Time's up!");
      } else {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setRemainingTime(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  };

  const calculateEndTime = (time) => {
    const now = new Date();
    console.log("Leaderboard Time:", time); // Debugging the time value
    switch (time) {
      case "1/2 day":
        return new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(); // Add 12 hours
      case "1 day":
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // Add 24 hours
      case "1 week":
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Add 7 days
      case "1 month":
        return new Date(now.setMonth(now.getMonth() + 1)).toISOString(); // Add 1 month
      default:
        console.error("Invalid time value provided. Defaulting to 1 day.");
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // Default to 1 day
    }
  };
  
  const startLeaderboard = async () => {
    if (!leaderboard) {
      alert("Leaderboard not loaded.");
      return;
    }
  
    console.log("Leaderboard Time Column Value:", leaderboard.time); // Debugging time column
  
    const startTime = new Date().toISOString();
    const endTime = calculateEndTime(leaderboard.time);
  
    console.log("Start Time:", startTime);
    console.log("End Time:", endTime);
  
    // Update leaderboard with start_time and end_time
    const { error } = await supabase
      .from("leaderboards")
      .update({ start_time: startTime, end_time: endTime })
      .eq("id", leaderboardId);
  
    if (error) {
      console.error("Error starting leaderboard:", error);
      alert("Failed to start the leaderboard.");
      return;
    }
  
    alert("Leaderboard started successfully!");
    setLeaderboard({ ...leaderboard, start_time: startTime, end_time: endTime });
    updateRemainingTime(endTime);
  };
  
  const handleQuizCompletion = async (leaderboardId, userEmail, score) => {
    const { data, error } = await supabase
      .from("leaderboards")
      .select("users")
      .eq("id", leaderboardId)
      .single();

    if (error || !data) return;

    const updatedUsers = data.users.map((user) =>
      user.email === userEmail
        ? { ...user, score, endTime: Date.now(), timeTaken: Date.now() - quizStartTime }
        : user
    );

    await supabase.from("leaderboards").update({ users: updatedUsers }).eq("id", leaderboardId);

    const sortedUsers = [...updatedUsers].sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken);
    sortedUsers.forEach((user, index) => (user.position = index + 1));
    await supabase.from("leaderboards").update({ users: sortedUsers }).eq("id", leaderboardId);
  };
  
  

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

 
  const handleStartQuiz = async () => {
    const fetchAndUpdateTotalStake = async () => {
          if (!leaderboardId) return;
      
          try {
            // ✅ Fetch the specific leaderboard where type is "quiz"
            const { data, error } = await supabase
              .from("leaderboards")
              .select("users, totalstake")
              .eq("id", leaderboardId)
              .eq("type", "quiz") // ✅ Ensure it's a quiz leaderboard
              .single();
      
            if (error) {
              console.error("Error fetching leaderboard:", error);
              return;
            }
      
            if (!data.users || !Array.isArray(data.users)) {
              console.error("Error: users data is missing or not an array.");
              return;
            }
      
            // ✅ Extract and sum up the stake of all users
            const totalStakeAmount = data.users.reduce(
              (sum, user) => sum + parseFloat(user.stake || 0),
              0
            ).toFixed(6); 
      
            console.log(`Total Stake Calculated: ${totalStakeAmount} ETH`);
      
            // ✅ Update the totalStake column in the leaderboard
            const { error: updateError } = await supabase
              .from("leaderboards")
              .update({ totalstake: totalStakeAmount })
              .eq("id", leaderboardId);
      
            if (updateError) {
              console.error("Error updating totalStake in Supabase:", updateError);
            } else {
              console.log(`✅ Total stake updated successfully: ${totalStakeAmount} ETH`);
            }
          } catch (err) {
            console.error("Unexpected error:", err);
          }
        };
      
        // ✅ First, update total stake before starting quiz
        await fetchAndUpdateTotalStake();
      
    console.log("Current topic:", topic); // ✅ Debugging log

    if (!topic || topic.trim() === "") {
      alert("Topic is missing! Please check the leaderboard.");
      return;
    }

    try {
      console.log("Requesting questions for topic:", topic);
      const response = await axios.post("http://localhost:5000/generate-mcqs", { topic });
      const questions = response.data.questions || [];

      if (questions.length === 0) {
        alert("No questions generated!");
        return;
      }

    navigate("/quiz", { state: { questions,leaderboardId, email } });
    } catch (error) {
      console.error("Error fetching questions:", error);
      alert("Error generating quiz. Try again!");
    }
  };

  const updateStakeInLeaderboard = async () => {
    const { data, error } = await supabase
      .from("leaderboards")
      .select("users")
      .eq("id", leaderboardId)
      .single();

    if (error || !data) return;

    const updatedUsers = data.users.map((user) =>
      email === email ? { ...user, stake: 0 } : user
    );

    await supabase.from("leaderboards").update({ users: updatedUsers }).eq("id", leaderboardId);
  };

  useEffect(() => {
    if (transactionHash) {
      updateStakeInLeaderboard();
    }
  }, [transactionHash]);

  useEffect(() => {
    if (leaderboard && leaderboard.allCompleted) {
      const topUser = leaderboard.users.find((user) => user.position === 1);
      if (topUser) {
        fetchWinnerWallet(topUser.email);
      }
    }
  }, [leaderboard]);

  const fetchWinnerWallet = async (winnerEmail) => {
    try {
      if (!winnerEmail || typeof winnerEmail !== "string") {
        console.error("❌ Invalid winner email:", winnerEmail);
        return;
      }
  
      console.log("🔍 Fetching wallet for:", winnerEmail); // Debugging log
  
      const { data, error } = await supabase
        .from("user_profiles")
        .select("wallet_address")
        .eq("email", winnerEmail.trim()) // Ensure it's a string
        .maybeSingle(); // Avoid multiple row errors
  
      if (error) {
        console.error("❌ Error fetching winner's wallet address:", error);
      } else if (!data) {
        console.warn("⚠️ No wallet address found for:", winnerEmail);
      } else {
        setWinnerWallet(data.wallet_address);
        console.log(`✅ Winner's Wallet Address: ${data.wallet_address}`);
      }
    } catch (err) {
      console.error("❌ Unexpected error fetching wallet:", err);
    }
  };
  const claimReward = async () => {
    if (!winnerWallet) {
      alert("Winner's wallet address not found!");
      return;
    }
  
    setLoading(true);
  
    try {
      // ✅ Ensure totalstake is a valid number
      console.log("Total Stake from Leaderboard:", leaderboard.totalstake);
      const rewardAmount = Number(leaderboard.totalstake) / 2;
  
      if (isNaN(rewardAmount) || rewardAmount <= 0) {
        console.error("❌ Invalid reward amount:", rewardAmount);
        alert("Reward amount is invalid. Please check the leaderboard data.");
        return; // Prevent invalid transaction
      }
  
      console.log(`✅ Sending ${rewardAmount} ETH to ${winnerWallet}`);
  
      if (!window.ethereum) {
        alert("MetaMask is not installed. Please install it to claim your reward.");
        setLoading(false);
        return;
      }
  
      // ✅ Convert to Wei and ensure valid format
      const valueInWei = BigInt(Math.floor(rewardAmount * 1e18)).toString(16);
  
      const transactionParameters = {
        to: winnerWallet, // ✅ Receiver = position 1 user's wallet
        from: "0x2B5c206516c34896D41DB511BAB9E878F8C1C109", // ✅ Sender = default wallet
        value: `0x${valueInWei}`, // ✅ Use `0x` prefix for Ethereum transactions
      };
  
      // ✅ Send Transaction using MetaMask
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      });
  
      console.log(`✅ Transaction successful! Hash: ${txHash}`);
  
      // ✅ Update leaderboard to mark reward as claimed
      const { error } = await supabase
        .from("leaderboards")
        .update({ rewardClaimed: true })
        .eq("id", leaderboardId);
  
      if (error) {
        console.error("Error updating reward status:", error);
      } else {
        console.log("✅ Reward status updated in leaderboard");
      }
      setRewardClaimed(true);
    } catch (err) {
      console.error("❌ Unexpected error during reward transaction:", err);
    }
  
    setLoading(false);
  };
  
 
  if (loading) {
    return <p>Loading leaderboard...</p>;
  }

  if (!leaderboard) {
    return <p>❌ Leaderboard not found.</p>;
  }

  return (
    <div>
      <h1>{leaderboard.name}</h1>
      <h2>Participants:</h2>
      <ul>
        {(leaderboard.users || []).map((user, index) => (
          <li key={index}>
            {user.nickname} ({user.email}) - Position: {user.position}, Steps: {user.steps}
          </li>
        ))}
      </ul>

      <p>Your email: {email}</p>

      {/* Timer */} {leaderboard.allCompleted && leaderboard.users[0]?.email === email && !rewardClaimed && (
        <button onClick={claimReward} disabled={loading}>
        {loading ? "Processing..." : "Claim Reward"}
      </button>
    )}

    {rewardClaimed && <p>✅ Reward successfully claimed!</p>}
  
      {remainingTime && (
        <div>
          <h3>Remaining Time: {remainingTime}</h3>
        </div>
      )}

      <button onClick={startLeaderboard}>Start</button>
      <button onClick={() => setShowInvitePopup(true)}>Invite People</button>

      {!fromResultsPage && leaderboard?.type === "quiz" && (
  <div>
    <h3>Stake ETH to Join</h3>
    <EthereumTransaction
      id={leaderboardId}
      defaultWalletAddress={defaultWalletAddress}
      userEmail={email}
      onSuccess={(txHash) => {
        setTransactionHash(txHash);
        setStakeStatus("Transaction successful! Updating leaderboard...");
      }}
      onFailure={(error) => {
        console.error("Transaction failed:", error);
        setStakeStatus("Failed to stake ETH. Please try again.");
      }}
    />
    {stakeStatus && <p>{stakeStatus}</p>}
  </div>
)}
{leaderboard?.type === "quiz" && !allUsersStaked && (
  <p style={{ color: "red", fontWeight: "bold" }}>
    ⚠️ The quiz cannot start yet! Some participant(s) still need to stake ETH.
  </p>
)}

{leaderboard?.type === "quiz" && allUsersStaked && (
  <>
    <p style={{ color: "green", fontWeight: "bold" }}>
      ✅ All users have staked! You can now start the quiz.
    </p>
    <button onClick={handleStartQuiz}>
      Start Quiz
    </button>
  </>

)}  {fromResultsPage && winnerWallet && (
  <div>
    <p>🏆 Winner's Wallet: <strong>{winnerWallet}</strong></p>
    <button onClick={claimReward}>Claim Reward</button>
  </div>
)}

{usersPaid && quizStartTime && (
        <p>Quiz will be available in {Math.ceil((quizStartTime - Date.now()) / 60000)} minutes.</p>
      )}
      {usersPaid && <button onClick={() => handleQuizCompletion(leaderboardId, email, 100)}>Finish Quiz</button>}
      {usersPaid && leaderboard?.users[0]?.email === email && (
        <button onClick={() => alert("You won the reward token!")}>Claim Reward</button>
      )}

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
