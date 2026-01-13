import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';

import LoginPage from './Pages/LoginPage';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
