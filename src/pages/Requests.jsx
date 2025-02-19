import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { useLocation } from "react-router-dom";

const Requests = () => {
  const location = useLocation();
  const email = location.state?.email;
  const [requests, setRequests] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("receiver_email", email);

      if (error) {
        console.error("Error fetching requests:", error);
        return;
      }

      setRequests(data);
    };

    fetchRequests();
  }, [email]);

  const handleRequest = async (request, accept) => {
    if (accept) {
      try {
        // Fetch the leaderboard
        const { data: leaderboard, error: fetchError } = await supabase
          .from("leaderboards")
          .select("users")
          .eq("id", request.leaderboard_id)
          .single();
  
        if (fetchError) {
          console.error("Error fetching leaderboard:", fetchError);
          setStatusMessage("Failed to process the request.");
          return;
        }
  
        // Fetch the user's current steps and leaderboards from user_profiles
        const { data: userProfile, error: profileFetchError } = await supabase
          .from("user_profiles")
          .select("steps, leaderboards")
          .eq("email", email)
          .single();
  
        if (profileFetchError) {
          console.error("Error fetching user profile:", profileFetchError);
          setStatusMessage("Failed to fetch user profile.");
          return;
        }
  
        const userSteps = userProfile?.steps || 0;
  
        // Ensure leaderboards is an array
        const existingLeaderboards = Array.isArray(userProfile?.leaderboards)
          ? userProfile.leaderboards
          : [];
  
        // Add the user to the leaderboard's users array with their current steps
        const updatedUsers = [
          ...leaderboard.users,
          { email, position: leaderboard.users.length + 1, steps: userSteps },
        ];
  
        const { error: updateError } = await supabase
          .from("leaderboards")
          .update({ users: updatedUsers })
          .eq("id", request.leaderboard_id);
  
        if (updateError) {
          console.error("Error updating leaderboard:", updateError);
          setStatusMessage("Failed to process the request.");
          return;
        }
  
        // Append the new leaderboard ID to the user's leaderboards
        const updatedLeaderboards = [...existingLeaderboards, request.leaderboard_id];
  
        const { error: profileUpdateError } = await supabase
          .from("user_profiles")
          .update({ leaderboards: updatedLeaderboards })
          .eq("email", email);
  
        if (profileUpdateError) {
          console.error("Error updating user profile leaderboards:", profileUpdateError);
          setStatusMessage("Failed to update user profile.");
          return;
        }
  
        // Remove the request
        const { error: deleteError } = await supabase
          .from("requests")
          .delete()
          .eq("id", request.id);
  
        if (deleteError) {
          console.error("Error removing request:", deleteError);
          setStatusMessage("Failed to remove the request.");
          return;
        }
  
        setStatusMessage(`Successfully joined ${request.leaderboard_name}!`);
      } catch (error) {
        console.error("Error handling request:", error);
        setStatusMessage("Failed to process the request.");
      }
    } else {
      // Decline the request (delete it from the table)
      const { error: deleteError } = await supabase
        .from("requests")
        .delete()
        .eq("id", request.id);
  
      if (deleteError) {
        console.error("Error declining request:", deleteError);
        setStatusMessage("Failed to decline the request.");
        return;
      }
  
      setStatusMessage("Request declined.");
    }
  
    // Refresh the requests list
    setRequests((prev) => prev.filter((r) => r.id !== request.id));
  };
  
  
  if (!requests.length) {
    return <p>No pending requests.</p>;
  }

  return (
    <div>
      <h1>Requests</h1>
      {statusMessage && <p>{statusMessage}</p>}
      <ul>
        {requests.map((request) => (
          <li key={request.id}>
            {request.sender_email} has invited you to join{" "}
            {request.leaderboard_name}.
            <button onClick={() => handleRequest(request, true)}>Yes</button>
            <button onClick={() => handleRequest(request, false)}>No</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Requests;
