import { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useNavigate } from "react-router-dom";

const UserDetails = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [interests, setInterests] = useState("");
  const [nftReference, setNftReference] = useState("");
  const navigate = useNavigate();

  const handleSaveDetails = async () => {
    const user = supabase.auth.user();

    if (!user) {
      alert("No user logged in.");
      return;
    }

    // Insert user details into Supabase
    const { error } = await supabase
      .from("user_details")
      .insert([
        {
          email: user.email,
          wallet_address: walletAddress,
          interests,
          nft_reference: nftReference,
          user_id: user.id,
        },
      ]);

    if (error) {
      alert("Error saving details: " + error.message);
    } else {
      alert("Details saved successfully!");
      navigate("/dashboard");
    }
  };

  return (
    <div>
      <h1>Enter Your Details</h1>
      <input
        type="text"
        placeholder="Wallet Address"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
      />
      <input
        type="text"
        placeholder="Interests"
        value={interests}
        onChange={(e) => setInterests(e.target.value)}
      />
      <input
        type="text"
        placeholder="NFT Reference"
        value={nftReference}
        onChange={(e) => setNftReference(e.target.value)}
      />
      <button onClick={handleSaveDetails}>Save Details</button>
    </div>
  );
};

export default UserDetails;
