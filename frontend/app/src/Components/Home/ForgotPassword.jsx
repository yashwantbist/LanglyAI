import { useState } from "react"
import "../../App.css";
import API from "../../API/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/api/auth/forgot-password", {
        email,
      });

      alert(res.data.message);
    } catch (err) {
      alert("Something went wrong");
    }
  };

  return (
    <div className="forgot-password">
      <h2>Forgot Password</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit">Send Reset Link</button>
      </form>
    </div>
  );
}