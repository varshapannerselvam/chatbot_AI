import React from 'react';
import { Link } from 'react-router-dom';
// import './Navbar.css'; // Create this CSS file for styling

const Navbar = ({ onLogout }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">AI Generative Conversational Model</div>
      <div className="navbar-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/unanswered-questions" className='nav-link'>Unanswered Questions</Link> {/* New link */}
        <Link to="/knowledge-base" className='nav-link'>AnsweredQuestion</Link> {/* New link */}
        {/* <Link to="/upload" className="nav-link">Upload</Link> */}
            <button
        onClick={() => {
          localStorage.removeItem("isSignedIn");
          window.location.href = "/signin";
        }}
        style={{
          float: 'right',
          backgroundColor: '#ff4d4f',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
      </div>
    </nav>
  );
};

export default Navbar;