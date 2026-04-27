import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ToolPage from './pages/ToolPage';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:slug" element={<ToolPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
