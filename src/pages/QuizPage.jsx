import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const QuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions } = location.state || {};
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // Track user answers
  const [selectedOption, setSelectedOption] = useState("");

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

    // Save the user's selected answer
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: selectedOption,
    });

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(""); // Reset selected option
    } else {
      // Navigate to the results page when quiz is finished
      navigate("/results", {
        state: {
          questions,
          selectedAnswers: {
            ...selectedAnswers,
            [currentQuestionIndex]: selectedOption, // Include the last answer
          },
        },
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedOption(selectedAnswers[currentQuestionIndex - 1] || ""); // Restore previous selection
    }
  };

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
    </div>
  );
};

export default QuizPage;
