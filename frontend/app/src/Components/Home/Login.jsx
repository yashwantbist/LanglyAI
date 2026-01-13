import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [FormData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...FormData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios("http://localhost:5000/api/auth/login", FormData, { withCredentials: true });
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("username", user.name);

      navigate("/home");
    } catch (err) {
      alert("Invalid email or password");
    }
  };

  return (
    <div className="login">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input type="email" name="email" placeholder="Email" value={FormData.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" value={FormData.password} onChange={handleChange} required />
        <button type="submit">Login</button>
      </form>
      <a href="http://localhost:5000/api/auth/google" className="btn-google">
        Continue with Google
      </a>
    </div>
  );
}
