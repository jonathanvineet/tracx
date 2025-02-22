import google.generativeai as genai
import json
import re
from flask import Flask, request, jsonify

# Configure Google Generative AI API key
genai.configure(api_key="AIzaSyD9GOVMDWmYo71aB7fHm9ANmU5aVmhefBs")

# Initialize Flask app
app = Flask(__name__)

# Function to generate MCQs
def generate_mcqs(topic):
    prompt = f"""
    Generate 20 unique multiple-choice questions on the given topic.
    Topic: {topic}
    Each question must:
    1. Have a unique question statement.
    2. Include exactly 4 unique options (A, B, C, D).
    3. Specify the correct answer in the format: "Answer: X" where X is A, B, C, or D.
    Ensure there is no ambiguity, and all questions are properly formatted.
    Provide the output strictly in JSON format with this structure:
    [
      {{
        "question": "string",
        "options": {{
          "A": "string",
          "B": "string",
          "C": "string",
          "D": "string"
        }},
        "answer": "string"
      }}
    ]
    """
    
    # Call Generative AI to generate content
    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content(prompt)

    # Extract JSON content from response using regex
    match = re.search(r"```json(.*?)```", response.text, re.DOTALL)
    if match:
        json_output = match.group(1).strip()
    else:
        json_output = response.text

    # Parse JSON output
    try:
        mcqs = json.loads(json_output)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON: {str(e)}")

    return mcqs

# Route to generate MCQs
@app.route('/generate-mcqs', methods=['POST'])
def generate_mcqs_endpoint():
    data = request.json
    topic = data.get('topic')
    
    if not topic:
        return jsonify({"error": "Topic is required"}), 400

    try:
        mcqs = generate_mcqs(topic)
        return jsonify({"questions": mcqs})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run the server
if __name__ == '__main__':
    app.run(port=5000, debug=True)
