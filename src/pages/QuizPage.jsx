import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const QuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions } = location.state || {};
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState("");
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [windowSwitchCount, setWindowSwitchCount] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false); // Track if quiz has started

  const startQuiz = async () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      await element.requestFullscreen().catch((err) => {
        console.error("Failed to enter fullscreen:", err);
      });
    }
    setQuizStarted(true);
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
    if (tabSwitchCount > 2 || windowSwitchCount > 2) {
      alert("You have switched tabs or windows too many times. The quiz will now end.");
      navigate("/dashboard", { replace: true, state: {email} });
    }
  }, [tabSwitchCount, windowSwitchCount, navigate]);

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
        state: { questions, selectedAnswers: { ...selectedAnswers, [currentQuestionIndex]: selectedOption } },
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
