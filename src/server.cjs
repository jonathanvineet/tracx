require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const HF_API_URL = "https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct";
const HF_API_KEY = process.env.HF_API_KEY;

// Helper function to pause for a given time (in milliseconds)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to generate and parse questions
async function generateQuestions(topic) {
  // Explicitly request 20 questions in a specific format.
  const prompt = `Generate 20 unique multiple-choice questions on the topic "${topic}". 
  Each question must:
  1. Have a unique question statement.
  2. Include exactly 4 unique options (A, B, C, D), each on a new line.
  3. Specify the correct answer at the end in the format: "Answer: X", where X is the correct option.
  Ensure there is no ambiguity, and all questions are properly formatted.`;
  const response = await axios.post(
    HF_API_URL,
    { inputs: prompt },
    { headers: { Authorization: `Bearer ${HF_API_KEY}` }, timeout: 60000}
  );

  console.log("Raw API Response:", JSON.stringify(response.data, null, 2));

  if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
    throw new Error("Invalid API response: Empty or incorrect format");
  }

  const textResponse = response.data[0]?.generated_text;
  if (!textResponse) {
    throw new Error("No generated text found in API response");
  }

  // Split the generated text into lines and clean them up.
  let lines = textResponse.split("\n").map(line => line.trim()).filter(line => line);

  // Remove any initial instruction line if present.
  if (lines[0] && lines[0].toLowerCase().startsWith("generate")) {
    lines.shift();
  }

  // If the last line is the answers line, extract it.
  let answersLine = null;
  if (lines.length > 0 && lines[lines.length - 1].toLowerCase().startsWith("answers:")) {
    answersLine = lines.pop();
  }

  // Join the remaining lines and split into question blocks.
  // The regex handles numbering formats like "1." or "1)".
  const questionBlocks = lines.join("\n").split(/\d+[\.\)]\s*/).filter(q => q.trim().length > 0);

  const questionsArray = [];
  for (const block of questionBlocks) {
    const blockLines = block.split("\n").map(line => line.trim()).filter(line => line);
    // Each question block must have at least 5 lines: one for the question and four for the options.
    if (blockLines.length < 5) continue;
    const questionText = blockLines[0];
    // Extract the next 4 lines as options, removing any leading labels (like "A)" or "a)")
    const options = blockLines.slice(1, 5).map(opt => opt.replace(/^[A-Da-d][\.\)]\s*/, "").trim());
    questionsArray.push({
      question: questionText,
      options: options,
    });
  }

  // Parse the answers line if available.
  let correctAnswers = [];
  if (answersLine) {
    // Expected format: "Answers: 1)X, 2)Y, 3)Z, ..." for all 20 questions.
    const answerPart = answersLine.replace(/answers:\s*/i, "");
    const answerItems = answerPart.split(",");
    for (const item of answerItems) {
      const match = item.trim().match(/^\d+\)\s*(.+)$/);
      if (match) {
        correctAnswers.push(match[1].trim());
      }
    }
  }

  // If not enough correct answers were parsed, default each question's correct answer to its first option.
  if (correctAnswers.length < questionsArray.length) {
    correctAnswers = questionsArray.map(q => q.options[0]);
  }

  // Combine each question with its corresponding correct answer.
  const formattedQuestions = questionsArray.map((q, idx) => ({
    question: q.question,
    options: q.options,
    correct_answer: correctAnswers[idx] || q.options[0]
  }));

  // Filter valid questions: each must have exactly 4 options and a non-empty correct answer.
  const validQuestions = formattedQuestions.filter(q => q.options.length === 4 && q.correct_answer);
  return validQuestions;
}

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

    // Keep trying until we have at least 10 valid questions or we reach maxAttempts.
    while (attempts < maxAttempts) {
      validQuestions = await generateQuestions(topic);
      console.log(`Attempt ${attempts + 1}: Found ${validQuestions.length} valid questions.`);
      if (validQuestions.length >= 10) break;
      attempts++;
      // Wait 3 seconds before trying again.
      await delay(3000);
    }

    if (validQuestions.length < 10) {
      throw new Error(`Insufficient valid questions generated after ${attempts} attempts (${validQuestions.length} valid questions).`);
    }

    // Select 10 valid questions.
    const finalQuestions = validQuestions.slice(0, 10);
    console.log("Final Questions:", JSON.stringify(finalQuestions, null, 2));
    res.json({ questions: finalQuestions });
  } catch (error) {
    console.error("Error fetching questions:", error.message);
    res.status(500).json({ error: "Failed to generate questions", details: error.message });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
