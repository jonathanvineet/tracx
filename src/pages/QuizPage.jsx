import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./QuizPage.css";

const QuizPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const [questions, setQuestions] = useState([]);
    const [correctAnswers, setCorrectAnswers] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        console.log("Location state:", location.state);
    
        if (location.state?.questions && location.state.questions.length >= 5) { 
            setQuestions(location.state.questions);
            setCorrectAnswers(location.state.questions.map(q => q.correct_answer || "No Answer"));
        } else {
            console.error("Invalid or incomplete question set received!", location.state);
            alert("Failed to generate enough valid questions. Please try again.");
            navigate("/");
        }
    }, [location, navigate]);
    
    useEffect(() => {
        console.log("Received Questions:", questions);
        console.log("Correct Answers:", correctAnswers);
    }, [questions, correctAnswers]);
    
    // Log the correct answers when the quiz is completed
    useEffect(() => {
        if (quizCompleted) {
            console.log("Quiz Completed. Correct Answers:", correctAnswers);
        }
    }, [quizCompleted, correctAnswers]);
    
    const handleAnswerSelect = (option) => {
        setSelectedAnswers({ ...selectedAnswers, [currentQuestionIndex]: option });
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            calculateScore();
            setQuizCompleted(true);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const calculateScore = () => {
        let correct = 0;
        questions.forEach((q, index) => {
            if (selectedAnswers[index] === correctAnswers[index]) {
                correct++;
            }
        });
        setScore(correct);
    };

    return (
        <div className="quiz-container">
            <h2>Quiz</h2>

            {quizCompleted ? (
                <div className="result">
                    <h3>Quiz Completed!</h3>
                    <p>Your Score: {score} / {questions.length}</p>
                    <h4>Review Your Answers:</h4>
                    <ul>
                        {questions.map((q, index) => (
                            <li key={index}>
                                <p><strong>Q{index + 1}:</strong> {q.question}</p>
                                <p><strong>Your Answer:</strong> {selectedAnswers[index] || "Not Answered"}</p>
                                <p><strong>Correct Answer:</strong> {correctAnswers[index]}</p>
                            </li>
                        ))}
                    </ul>
                    <button onClick={() => navigate("/")}>Back to Home</button>
                </div>
            ) : questions.length > 0 ? (
                <div className="question-page">
                    <h3>Question {currentQuestionIndex + 1} of {questions.length}</h3>
                    <p>{questions[currentQuestionIndex].question}</p>
                    <ul className="options-list">
                        {questions[currentQuestionIndex].options.map((option, i) => (
                            <li key={i}>
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name={`question-${currentQuestionIndex}`}
                                        value={option}
                                        checked={selectedAnswers[currentQuestionIndex] === option}
                                        onChange={() => handleAnswerSelect(option)}
                                    />
                                    {option}
                                </label>
                            </li>
                        ))}
                    </ul>
                    <div className="nav-buttons">
                        <button onClick={handlePrevious} disabled={currentQuestionIndex === 0}>Previous</button>
                        <button onClick={handleNext}>
                            {currentQuestionIndex === questions.length - 1 ? "Finish Quiz" : "Next"}
                        </button>
                    </div>
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default QuizPage;
