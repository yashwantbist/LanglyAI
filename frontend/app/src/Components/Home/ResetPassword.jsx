import { useState } from "react";
import API from "../../API/api";

export default function ChangePassword() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      return alert("Passwords do not match");
    }

    try {
      const res = await API.post("/change-password", form);
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          placeholder="Current Password"
          onChange={(e) =>
            setForm({ ...form, currentPassword: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="New Password"
          onChange={(e) =>
            setForm({ ...form, newPassword: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Confirm Password"
          onChange={(e) =>
            setForm({ ...form, confirmPassword: e.target.value })
          }
        />

        <button type="submit">Update Password</button>
      </form>
    </div>
  );
}