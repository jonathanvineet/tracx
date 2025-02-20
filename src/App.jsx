import { Routes, Route } from "react-router-dom";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Confirmation from "./pages/ConfirmationPage";
import CreateLeaderboard from "./pages/CreateLeaderBoard";
import ShowLeaderBoard from "./pages/ShowLeaderBoard";
import MyLeaderboards from "./pages/MyLeaderBoards";
import Leaderboards from "./pages/Leaderboards";
import Requests from "./pages/Requests";
import Quiz from "./pages/QuizPage";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/leaderboards" element={<Leaderboards />} />
        <Route path="/my-leaderboards" element={<MyLeaderboards />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/show-leaderboard" element={<ShowLeaderBoard />} />
        <Route path="/create-leaderboard" element={<CreateLeaderboard />} />
        <Route path="/confirmation" element={<Confirmation />} />
    </Routes>
  );
}

export default App;
