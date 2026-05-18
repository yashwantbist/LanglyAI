import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../API/api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post(
        `/api/auth/reset-password/${token}`,
        { password }
      );

      alert(res.data.message);
      navigate("/login");
    } catch (err) {
      alert("Invalid or expired token");
    }
  };

  return (
    <div className="reset-password">
      <h2>Reset Password</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
}

