import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from './components/Home';
import LoginPage from "./components/LoginPage";
import SignUp from "./components/SignUp";
import Navbar from "./components/Navbar";
import UnansweredQuestionsList from "./components/UnansweredQuestionsList"; // New component
import AnsweredQuestion from "./components/AnsweredQuestion"; // New component

const App = () => {
  const [isSignedIn, setSignedIn] = useState(() => {
    return localStorage.getItem("isSignedIn") === "true";
  });

  useEffect(() => {
    localStorage.setItem("isSignedIn", isSignedIn);
  }, [isSignedIn]);

  return (
    <BrowserRouter>
      {/* Conditionally render Navbar only when signed in */}
      {isSignedIn && <Navbar onLogout={() => setSignedIn(false)} />}
      
      <Routes>
        {!isSignedIn ? (
          <>
            <Route path="/signin" element={<LoginPage setSignIn={setSignedIn} />} />
            <Route path="/signup" element={<SignUp setSignIn={setSignedIn} />} />
            <Route path="*" element={<Navigate to="/signin" />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/unanswered-questions" element={<UnansweredQuestionsList />} /> {/* New route */}
             <Route path="/knowledge-base" element={<AnsweredQuestion />} />
            <Route path="/logout" element={<SignOut setSignIn={setSignedIn} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
};

const SignOut = ({ setSignIn }) => {
  useEffect(() => {
    localStorage.removeItem("isSignedIn");
    setSignIn(false);
  }, [setSignIn]);

  return <Navigate to="/signin" />;
};

// Placeholder for your Upload component
const Upload = () => {
  return <div>Upload Page Content</div>;
};

export default App;