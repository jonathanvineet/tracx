import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

const QuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const { questions } = location.state || {};
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState("");
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [windowSwitchCount, setWindowSwitchCount] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false); // Track disqualification

  const startQuiz = async () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      await element.requestFullscreen().catch((err) => {
        console.error("Failed to enter fullscreen:", err);
      });
    }
    setQuizStarted(true);
  };

  const handleDisqualification = async () => {
    if (isDisqualified) return; // Prevent multiple executions
    setIsDisqualified(true);
  
    const leaderboardId = location.state?.leaderboardId;
  
    if (!leaderboardId) {
      console.error("Leaderboard ID is undefined. Cannot process disqualification.");
      alert("Error: Unable to process disqualification due to missing leaderboard information.");
      navigate("/dashboard", { replace: true, state: { email } });
      return;
    }
  
    try {
      const { data: userProfile, error: userProfileError } = await supabase
        .from("user_profiles")
        .select("leaderboards")
        .eq("email", email)
        .single();
  
      if (userProfileError || !userProfile) {
        console.error("Error fetching user profile:", userProfileError);
        alert("Error processing disqualification.");
        return;
      }
  
      // Remove the leaderboard ID from the user's leaderboards
      const updatedLeaderboards = userProfile.leaderboards.filter(
        (id) => id !== leaderboardId
      );
  
      const { error: updateProfileError } = await supabase
        .from("user_profiles")
        .update({ leaderboards: updatedLeaderboards })
        .eq("email", email);
  
      if (updateProfileError) {
        console.error("Error updating user profile:", updateProfileError);
        alert("Error processing disqualification.");
        return;
      }
  
      // Remove the user from the leaderboard's users array
      const { data: leaderboard, error: leaderboardError } = await supabase
        .from("leaderboards")
        .select("users")
        .eq("id", leaderboardId)
        .single();
  
      if (leaderboardError || !leaderboard) {
        console.error("Error fetching leaderboard:", leaderboardError);
        alert("Error processing disqualification.");
        return;
      }
  
      const updatedUsers = leaderboard.users.filter(
        (user) => user.email !== email
      );
  
      const { error: updateLeaderboardError } = await supabase
        .from("leaderboards")
        .update({ users: updatedUsers })
        .eq("id", leaderboardId);
  
      if (updateLeaderboardError) {
        console.error("Error updating leaderboard:", updateLeaderboardError);
        alert("Error processing disqualification.");
        return;
      }
  
      alert("You have been disqualified and removed from the leaderboard.");
      navigate("/dashboard", { replace: true, state: { email } });
    } catch (error) {
      console.error("Error during disqualification:", error);
      alert("An unexpected error occurred.");
    }
  };
  

  useEffect(() => {
    // Detect tab switching and window switching
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setTabSwitchCount((prevCount) => prevCount + 1);
      }
    };

    const handleWindowBlur = () => {
      setWindowSwitchCount((prevCount) => prevCount + 1);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);

      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch((err) =>
          console.error("Failed to exit fullscreen:", err)
        );
      }
    };
  }, []);

  useEffect(() => {
    // Force exit the quiz if tab switches or window switches exceed limits
    if ((tabSwitchCount > 2 || windowSwitchCount > 2) && !isDisqualified) {
      alert("You have switched tabs or windows too many times. The quiz will now end.");
      handleDisqualification();
    }
  }, [tabSwitchCount, windowSwitchCount]);

  if (!questions || questions.length === 0) {
    return <div>No questions available.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const optionsArray = Object.entries(currentQuestion.options || {});

  const handleNext = () => {
    if (!selectedOption) {
      alert("Please select an answer before proceeding.");
      return;
    }

    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: selectedOption,
    });

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption("");
    } else {
      navigate("/results", {
        state: {
          email,
          questions,
          selectedAnswers: { ...selectedAnswers, [currentQuestionIndex]: selectedOption },
        },
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedOption(selectedAnswers[currentQuestionIndex - 1] || "");
    }
  };

  if (!quizStarted) {
    return (
      <div className="quiz-container">
        <button onClick={startQuiz} className="start-quiz-btn">
          Start Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="question-page">
        <h2>Question {currentQuestionIndex + 1}</h2>
        <p>{currentQuestion.question}</p>
        <ul className="options-list">
          {optionsArray.map(([key, value]) => (
            <li key={key}>
              <label className="radio-label">
                <input
                  type="radio"
                  name="option"
                  value={key}
                  checked={selectedOption === key}
                  onChange={() => setSelectedOption(key)}
                />
                {value}
              </label>
            </li>
          ))}
        </ul>
        <div className="nav-buttons">
          <button onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
            Previous
          </button>
          <button onClick={handleNext}>
            {currentQuestionIndex === questions.length - 1 ? "Submit" : "Next"}
          </button>
        </div>
      </div>
      <div className="switch-counts">
        <p>Tab switches: {tabSwitchCount}</p>
        <p>Window switches: {windowSwitchCount}</p>
      </div>
    </div>
  );
};

export default QuizPage;
