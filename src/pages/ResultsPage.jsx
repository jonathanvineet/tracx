import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions, selectedAnswers, email, leaderboardId } = location.state || {};

  if (!questions || !selectedAnswers) {
    return <div>No results to display.</div>;
  }

  const calculateScore = () => {
    let score = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.answer) {
        score++;
      }
    });
    return score;
  };

  const score = calculateScore();

  const updateScore = async () => {
    if (!leaderboardId || !email) {
      console.error("Leaderboard ID or email is undefined.");
      return;
    }

    try {
      // Fetch the leaderboard's users array
      const { data: leaderboard, error: fetchError } = await supabase
        .from("leaderboards")
        .select("users")
        .eq("id", leaderboardId)
        .single();

      if (fetchError || !leaderboard) {
        console.error("Error fetching leaderboard:", fetchError);
        return;
      }

      const updatedUsers = leaderboard.users.map((user) => {
        if (user.email === email) {
          return {
            ...user,
            score, // Update the user's score
          };
        }
        return user;
      });

      // Update the leaderboard with the modified users array
      const { error: updateError } = await supabase
        .from("leaderboards")
        .update({ users: updatedUsers })
        .eq("id", leaderboardId);

      if (updateError) {
        console.error("Error updating leaderboard:", updateError);
        return;
      }

      console.log("Score updated successfully for user:", email);
    } catch (error) {
      console.error("Unexpected error updating score:", error);
    }
  };

  useEffect(() => {
    updateScore(); // Update the score when the results page loads
  }, []);

  return (
    <div className="results-container">
      <h1>Your Results</h1>
      <p>
        You scored {score} out of {questions.length}.
      </p>
      <ul>
        {questions.map((question, index) => (
          <li key={index}>
            <p>
              <strong>Question {index + 1}:</strong> {question.question}
            </p>
            <p>
              <strong>Your Answer:</strong> {question.options[selectedAnswers[index]] || "Not answered"}
            </p>
            <p>
              <strong>Correct Answer:</strong> {question.options[question.answer]}
            </p>
          </li>
        ))}
      </ul>
     
      <button onClick={() => navigate("/show-leaderboard",{ state: { leaderboardId,email,fromResultsPage: true } })}>Back to Page</button>
    </div>
  );
};

export default ResultsPage;
