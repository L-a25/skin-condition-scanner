import React from 'react';
import { Routes, Route } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import MainPage from './pages/MainPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/main" element={<MainPage />} />
    </Routes>
  );
}

export default App;

