import { Link } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { useState } from "react";
import Langly from "../Assets/langlyai.svg";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  return (
    <nav className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={Langly} alt="Langly AI Logo" className="h-8 w-8" />
          <span className="font-bold text-lg">Langly AI 🇫🇷</span>
        </Link>

        <Link
          to="/dashboard"
          className="hover:text-yellow-300 transition font-medium"
        >
          Home
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <Link
          to="/pricing"
          className="hover:text-yellow-300 transition font-medium"
        >
          Pricing
        </Link>

        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="font-medium transition hover:text-yellow-300"
            >
              {user.name} ▾
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 bg-white text-black rounded-md shadow-lg w-44 overflow-hidden z-50">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 hover:bg-blue-100 text-sm"
                >
                  My Profile
                </Link>

                <Link
                  to="/change-password"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 hover:bg-blue-100 text-sm"
                >
                  Change Password
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 text-sm"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="hover:text-yellow-300 font-medium">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
