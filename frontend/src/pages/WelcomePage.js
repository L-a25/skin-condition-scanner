import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/WelcomePage.css';

function WelcomePage() {
  const navigate = useNavigate();
  const [displayText, setDisplayText] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const fullText = 'Welcome to the Skin Condition Scanner!';

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayText((prev) => prev + fullText.charAt(index));
      index++;
      if (index > fullText.length) {
        clearInterval(interval);
        setTimeout(() => setShowInstructions(true), 500);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="welcome-container">
      <h1>{displayText}</h1>
      {showInstructions && (
        <>
          <p className="instruction-title fade-in">Follow these steps to begin your scan:</p>
          <ol className="instruction-list">
            <li className="fade-in" style={{ animationDelay: '0.5s' }}>Stand comfortably in front of the camera.</li>
            <li className="fade-in" style={{ animationDelay: '1s' }}>Ensure your face is well-lit and visible.</li>
            <li className="fade-in" style={{ animationDelay: '1.5s' }}>Stay still and look directly at the camera.</li>
            <li className="fade-in" style={{ animationDelay: '2s' }}>Your scan will be quick and secure.</li>
          </ol>
          <p className="privacy-note fade-in" style={{ animationDelay: '2.5s' }}>
            Your privacy is important. No data will be stored.
          </p>
          <button
            onClick={() => navigate('/main')}
            className="proceed-button fade-in"
            style={{ animationDelay: '3s' }}
          >
            Proceed to Scan
          </button>
        </>
      )}
    </div>
  );
}

export default WelcomePage;
