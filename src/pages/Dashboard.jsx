import { supabase } from "../utils/supabaseClient";

const Dashboard = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/signup";
  };

  return (
    <div>
      <h1>Welcome to the Dashboard!</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;
