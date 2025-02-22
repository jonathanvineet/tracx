import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient"; // Ensure this path is correct
import "../styles/SignUp.css"; // ✅ Importing the CSS file

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [float, setFloat] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Checking localStorage on SignUp page...");
    localStorage.removeItem("email_confirmed");
    const emailConfirmed = localStorage.getItem("email_confirmed");
    console.log("Email confirmed status:", emailConfirmed);

    if (emailConfirmed === "true") {
      console.log("Email confirmed, redirecting to dashboard...");
      navigate("/dashboard");
    }
  }, [navigate]);



  const handleSignUp = async () => {
    console.log("Attempting to sign up with email:", email);
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.log("Sign-up error:", error.message);
      alert(error.message);
      return;
    }

    console.log("Sign-up successful! Waiting for confirmation...");
    setWaiting(true);
    alert("Sign-up successful! Please check your email for confirmation.");
  };

  return (
    <div className="container">
      {/* Floating Lion Background */}
      <img
        src="src/pages/logo1.png" // Update this path with your actual lion image
        alt="Lion"
        className="lion"
        style={{ transform: `translateY(${float}px)` }}
      />

      {/* Floating Signup Form */}
      <div className="signup-box" style={{ transform: `translateY(${float}px)` }}>
        <h2>CREATE ACCOUNT</h2>
        <p>BEGIN YOUR EPIC JOURNEY</p>

  
        <input
          type="email"
          placeholder="Enter Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="signup-input"
        />
        <input
          type="password"
          placeholder="Create Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="signup-input"
        />
        
        <button onClick={handleSignUp} className="signup-button">
          {waiting ? "Processing..." : "SIGN UP"}
        </button>

        {waiting && <p className="signup-waiting">Waiting for confirmation...</p>}

        <p className="return-link" onClick={() => navigate("/")}>Return to Portal</p>
      </div>
    </div>
  );
};

export default SignUp;
