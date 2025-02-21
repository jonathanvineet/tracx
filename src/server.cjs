require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const PYTHON_SERVER_URL = "http://127.0.0.1:5000/generate-mcqs"; // Python server endpoint

// Helper function to pause for a given time (in milliseconds)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to fetch questions from the Python server
async function fetchQuestionsFromPythonServer(topic) {
  const response = await axios.post(PYTHON_SERVER_URL, { topic });
  return response.data.questions;
}

// Endpoint to fetch and parse questions
app.post("/generate-mcqs", async (req, res) => {
  const { topic } = req.body;
  console.log("Generating Multiple Choice Questions for topic:", topic);

  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  try {
    let validQuestions = [];
    const maxAttempts = 5;
    let attempts = 0;

    while (attempts < maxAttempts) {
      validQuestions = await fetchQuestionsFromPythonServer(topic);
      console.log(`Attempt ${attempts + 1}: Found ${validQuestions.length} questions.`);
      if (validQuestions.length >= 10) break;
      attempts++;
      await delay(3000); // Wait before trying again
    }

    if (validQuestions.length < 10) {
      throw new Error(
        `Insufficient questions generated after ${attempts} attempts (${validQuestions.length} valid questions).`
      );
    }

    const finalQuestions = validQuestions.slice(0, 10);
    console.log("Final Questions:", JSON.stringify(finalQuestions, null, 2));
    res.json({ questions: finalQuestions });
  } catch (error) {
    console.error("Error fetching questions:", error.message);
    res.status(500).json({ error: "Failed to generate questions", details: error.message });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
