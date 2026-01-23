import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function OAuthSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = new URLSearchParams(location.search).get("token");
    if (token) {
      localStorage.setItem("token", token);
      navigate("/pricing");
    } else {
      navigate("/login");
    }
  }, [location, navigate]);

  return <div>Signing you in…</div>;
}
