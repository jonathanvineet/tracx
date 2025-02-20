import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(bodyParser.json());
app.use(cors());

const PORT = 5000;

// Replace these with your credentials from Google Cloud Console
const CLIENT_ID = "227507150384-r6vup7ubgktulvdmekffgmn81u1fbevo.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "http://localhost:5173/conformation"; // Your frontend redirect URI

// Route to exchange authorization code for access and refresh tokens
app.post("/", async (req, res) => {
  const { authorization_code } = req.body;

  if (!authorization_code) {
    return res.status(400).json({ error: "Authorization code is required." });
  }

  try {
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      code: authorization_code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const { access_token, refresh_token, expires_in } = response.data;

    // Respond with tokens
    res.json({
      access_token,
      refresh_token,
      expires_in,
    });
  } catch (error) {
    console.error("Error exchanging token:", error.response.data);
    res.status(500).json({ error: "Failed to exchange token." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
