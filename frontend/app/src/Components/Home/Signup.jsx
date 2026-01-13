import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [FormData, setFormData] = useState({
    name: " ",
    email: " ",
    password: "",
  });
  const navigate = useNavigate();

  //handle change function
  const handleChange = (e) => {
    setFormData({ ...FormData, [e.target.name]: e.target.value });
  };

  //handle signup form
  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/auth/signup", FormData, {
        withCredentials: true,
      });
      alert("Signup Successful.Please login");
      navigate("/Login");
    } catch (err) {
      alert("Error signing up:" + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="signup">
      <h2>SignUp</h2>
      <form onSubmit={handleSignup}>
        <input
          type="text"
          name="name"
          placeholder="name"
          onChange={handleChange}
          value={FormData.name}
          required
        />
        <input
          type="text"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          value={FormData.email}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          value={FormData.password}
          required
        />
        <button type="submit"> Create my account</button>
      </form>
    </div>
  );
}
