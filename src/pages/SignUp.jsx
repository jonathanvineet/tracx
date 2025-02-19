import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [waiting, setWaiting] = useState(false);
  const navigate = useNavigate();

  // Ensuring fresh state on page load and logging all values.
  useEffect(() => {
    console.log("Checking localStorage on SignUp page...");
    
    // Remove any existing email confirmation flag to avoid auto redirection
    localStorage.removeItem("email_confirmed");
    
    // Check if the user is already confirmed from a previous session
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
    <div>
      <h1>Sign Up</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleSignUp}>Sign Up</button>

      {waiting && <p>Waiting for confirmation...</p>}
    </div>
  );
};

export default SignUp;
