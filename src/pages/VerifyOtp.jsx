import { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useNavigate } from "react-router-dom";

const VerifyOtp = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const handleVerifyOtp = async () => {
    const { data, error } = await supabase
      .from("otps")
      .select("*")
      .eq("email", email)
      .eq("otp", otp)
      .single();

    if (error || new Date(data.expires_at) < new Date()) {
      return alert("Invalid or expired OTP.");
    }

    // Add user to `user_profiles` table
    await supabase.from("user_profiles").insert({ id: supabase.auth.user().id, email });

    alert("OTP verified successfully!");
    navigate("/dashboard");
  };

  return (
    <div>
      <h1>Verify OTP</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="text"
        placeholder="OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />
      <button onClick={handleVerifyOtp}>Verify OTP</button>
    </div>
  );
};

export default VerifyOtp;
