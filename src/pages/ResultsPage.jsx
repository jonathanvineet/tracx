import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions, selectedAnswers } = location.state || {};

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
      <button onClick={() => navigate("/")}>Back to Home</button>
    </div>
  );
};

export default ResultsPage;
