import { Component } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './global.css';
import { ThemeProvider } from './ThemeContext';
import Navbar from './Navbar';
import Footer from './Footer';
import Home from './Home';
import InputData from './InputData';
import Results from './Results';
import Trends from './Trends';
import Profile from './Profile';
import CreateProfile from './CreateProfile';
import Onboarding from './Onboarding';

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ fontFamily:"'DM Sans',sans-serif", padding:'60px 32px', textAlign:'center', background:'#f2f8f9', minHeight:'100vh' }}>
          <div style={{ maxWidth:480, margin:'0 auto', background:'white', borderRadius:20, padding:40, border:'1px solid rgba(10,74,92,0.1)', boxShadow:'0 4px 24px rgba(10,74,92,0.08)' }}>
            <div style={{ fontSize:32, marginBottom:16 }}>⚠️</div>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontWeight:300, fontSize:'1.4rem', color:'#0c1f26', marginBottom:12 }}>Something went wrong</h2>
            <p style={{ fontSize:13, color:'#6a9aaa', lineHeight:1.7, marginBottom:8 }}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button onClick={() => window.location.reload()}
              style={{ marginTop:20, padding:'10px 24px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#0a4a5c,#0d6b80)', color:'white', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/"              element={<ErrorBoundary><Home /></ErrorBoundary>} />
            <Route path="/InputData"     element={<ErrorBoundary><InputData /></ErrorBoundary>} />
            <Route path="/Results"       element={<ErrorBoundary><Results /></ErrorBoundary>} />
            <Route path="/Trends"        element={<ErrorBoundary><Trends /></ErrorBoundary>} />
            <Route path="/Profile"       element={<ErrorBoundary><Profile /></ErrorBoundary>} />
            <Route path="/CreateProfile" element={<ErrorBoundary><CreateProfile /></ErrorBoundary>} />
            <Route path="/Onboarding"    element={<ErrorBoundary><Onboarding /></ErrorBoundary>} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}