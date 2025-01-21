import React, { useState } from 'react';

const CameraComponent = ({ onCapture }) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const captureImage = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 600;
      const context = canvas.getContext('2d');

      setTimeout(() => {
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          onCapture(blob);
          stream.getTracks().forEach((track) => track.stop());
          setIsCapturing(false);
        }, 'image/jpeg');
      }, 2000);
    } catch (err) {
      console.error('Error capturing image:', err);
      setIsCapturing(false);
    }
  };

  return (
      <button
        onClick={captureImage}
        className="capture-button"
        disabled={isCapturing}
      >
        {isCapturing ? 'Capturing...' : 'Capture Image'}
      </button>
  );
};

export default CameraComponent;
