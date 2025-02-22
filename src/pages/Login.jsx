import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient"; // ✅ Correct Supabase import
import "../styles/Login.css"; // ✅ Import styles

// Import Pages

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Login error: " + error.message);
    } else if (data?.user?.email_confirmed_at) {
      alert("Login successful!");
      navigate("/dashboard", { state: { email } });
    } else {
      alert("Please confirm your email before proceeding.");
    }
  };

  return (
    <div className="container">
      {/* Floating Lion */}
      <img src="src/pages/logo1.png" alt="Lion" className="lion" />

      {/* Login Form */}
      <div className="login-box">
        <h2>Login</h2>
        <p>Enter your credentials to access your account</p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
        />
        <button onClick={handleLogin} className="login-button">
          Login
        </button>
        <p className="login-waiting">Logging in, please wait...</p>
        <a href="/signup" className="return-link">Don't have an account? Sign up</a>
      </div>
    </div>
  );
};

export default Login;
