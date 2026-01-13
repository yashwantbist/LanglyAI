import { useState } from "react";
import Login from "../Components/Home/Login";
import Signup from "../Components/Home/Signup";
import Langly from "../Assets/langlyai.svg";

export default function LoginPage() {
  const [showLogin, setShowLogin] = useState(true);
  return (
    <div className="LoginPage">
      <img src={Langly} alt="Langly AI Logo" className="logo" />
      <p>Langly AI — Learn French, the Smart Way.</p>
      <div>
        {showLogin ? (
          <>
            <Login />
            <p>
              Don't have an account?{" "}
              <button onClick={() => setShowLogin(false)}>Sign Up</button>
            </p>
          </>
        ) : (
          <>
            <Signup />
            <p>
              Already have an account?{" "}
              <button onClick={() => setShowLogin(true)}>Log In</button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
