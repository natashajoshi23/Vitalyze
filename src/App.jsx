import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './global.css';
import { ThemeProvider } from './ThemeContext';
import Navbar from './Navbar';
import Home from './Home';
import InputData from './InputData';
import Results from './Results';
import Trends from './Trends';
import Profile from './Profile';
import CreateProfile from './CreateProfile';
import Onboarding from './Onboarding';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"              element={<Home />} />
          <Route path="/InputData"     element={<InputData />} />
          <Route path="/Results"       element={<Results />} />
          <Route path="/Trends"        element={<Trends />} />
          <Route path="/Profile"       element={<Profile />} />
          <Route path="/CreateProfile" element={<CreateProfile />} />
          <Route path="/Onboarding"    element={<Onboarding />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}