import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Confirmation from "./pages/ConfirmationPage"; // Make sure the component name is correct

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/confirmation" element={<Confirmation />} /> {/* Ensure this is the correct page */}
    </Routes>
  </Router>
);

export default App;
