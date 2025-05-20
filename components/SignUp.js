import React, { useState } from "react";

const SignUp = () => {
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.email) newErrors.email = "Email is required!";
    if (!formData.password) newErrors.password = "Password is required!";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords must match!";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      let users = JSON.parse(localStorage.getItem("users")) || [];
      users.push({ email: formData.email, password: formData.password });
      localStorage.setItem("users", JSON.stringify(users));  // Save the new user
      alert("Registration Successful! You can now log in.");
    }
  };

  return (
    <div className="authh-container" style={{fontFamily:"Poppins"}}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <h5>Email:</h5>
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
        {errors.email && <p className="error">{errors.email}</p>}

        <h5>Password:</h5>
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} />
        {errors.password && <p className="error">{errors.password}</p>}

        <h5>Confirm Password:</h5>
        <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} />
        {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}

        <button type="submit">Sign Up</button>
        <p className="switch-auth" style={{cursor:"pointer",margin:0}} onClick={() => window.location.href="/signin"}>
          Don't have an account? Login
          </p>
      </form>
    </div>
  );
};

export default SignUp;
