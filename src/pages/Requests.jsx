import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { useLocation } from "react-router-dom";
import "./request.css";

const Requests = () => {
  const location = useLocation();
  const email = location.state?.email;
  const [requests, setRequests] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const fetchRequests = async () => {
      const { data: requestData, error: requestError } = await supabase
        .from("requests")
        .select("*")
        .eq("receiver_email", email);

      if (requestError) {
        console.error("Error fetching requests:", requestError);
        return;
      }

      if (!requestData.length) {
        setRequests([]);
        return;
      }

      // Fetch corresponding leaderboards for each request
      const enrichedRequests = await Promise.all(
        requestData.map(async (request) => {
          const { data: leaderboard, error: leaderboardError } = await supabase
            .from("leaderboards")
            .select("type, topic")
            .eq("id", request.leaderboard_id)
            .single();

          if (leaderboardError) {
            console.error(`Error fetching leaderboard for ID ${request.leaderboard_id}:`, leaderboardError);
            return { ...request }; // Return the request without type and topic
          }

          // Enrich request with leaderboard type and topic
          return {
            ...request,
            type: leaderboard.type,
            topic: leaderboard.topic,
          };
        })
      );

      setRequests(enrichedRequests);
    };

    fetchRequests();
  }, [email]);

  const handleRequest = async (request, accept) => {
    if (accept) {
      try {
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

        const { data: userProfile, error: profileFetchError } = await supabase
          .from("user_profiles")
          .select("steps, nickname, leaderboards")
          .eq("email", email)
          .single();

        if (profileFetchError) {
          console.error("Error fetching user profile:", profileFetchError);
          setStatusMessage("Failed to fetch user profile.");
          return;
        }

        const userSteps = userProfile?.steps || 0;
        const userNickname = userProfile?.nickname || "Unknown";
        const existingLeaderboards = Array.isArray(userProfile?.leaderboards)
          ? userProfile.leaderboards
          : [];

        const updatedUsers = [
          ...leaderboard.users,
          {
            email,
            position: leaderboard.users.length + 1,
            nickname: userNickname,
            steps: request.type === "quiz" ? null : userSteps,
            stake: 0,
            score: 0,
            quiz_status: 0,
            time: 0,
          },
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

    setRequests((prev) => prev.filter((r) => r.id !== request.id));
  };

  return (
    <div className="request-container">
      <h1>Requests</h1>
      {statusMessage && <p>{statusMessage}</p>}

      {requests.length === 0 ? (
        <p className="no-requests">No Pending Requests</p> // Centered message
      ) : (
        <ul className="request-list">
          {requests.map((request) => (
            <li key={request.id}>
              <p>
                {request.sender_email} has invited you to join <strong>{request.leaderboard_name}</strong>.
              </p>

              {request.type === "quiz" && request.topic && (
                <p><strong>Topic:</strong> {request.topic}</p>
              )}

              <div className="button-container">
                <button className="yes-btn" onClick={() => handleRequest(request, true)}>Yes</button>
                <button className="no-btn" onClick={() => handleRequest(request, false)}>No</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


export default Requests;
