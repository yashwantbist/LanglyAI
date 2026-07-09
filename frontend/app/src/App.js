import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import { AuthProvider, useAuth } from "./Context/AuthContext";
import Dashboard from "./Pages/Dashboard";
import Pricing from "./Pages/Pricing";
import LoginPage from "./Pages/LoginPage";
import LessonPage from "./Pages/Lesson";
import LessonCard from "./Components/LessonCard";
import OAuthSuccess from "./Pages/OAuthSuccess";
import ForgotPassword from "./Components/Home/ForgotPassword";
import ChangePassword from "./Components/Home/ResetPassword";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ChangePassword />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/lessons/:level"
            element={
              <ProtectedRoute>
                <LessonPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/lessons/:level/:dayNumber"
            element={
              <ProtectedRoute>
                <LessonCard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pricing"
            element={
              <ProtectedRoute>
                <Pricing />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
