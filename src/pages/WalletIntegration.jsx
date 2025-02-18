import { useState } from "react";
import { supabase } from "../utils/supabaseClient";

const WalletIntegration = () => {
  const [walletAddress, setWalletAddress] = useState("");

  const handleWalletIntegration = async () => {
    try {
      // Retrieve the user's UID from the session
      const {
        data: { user },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !user) throw new Error("User not authenticated.");

      // Update wallet address in the user_profiles table
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ wallet_address: walletAddress })
        .eq("id", user.id);

      if (updateError) throw new Error(updateError.message);

      alert("Wallet address successfully updated!");
    } catch (error) {
      console.error("Error during wallet integration:", error.message);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h1>Wallet Integration</h1>
      <input
        type="text"
        placeholder="Enter Wallet Address"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
      />
      <button onClick={handleWalletIntegration}>Save Wallet Address</button>
    </div>
  );
};

export default WalletIntegration;
