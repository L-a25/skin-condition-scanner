import React, { useState,useRef } from "react";
import CameraComponent from "../components/CameraComponent";
import "../styles/MainPage.css";

// Define the fixed color map as a constant
const COLOR_MAP = {
  0: { color: "rgb(255, 0, 0)", label: "Acne-Rosacea" },
  1: { color: "rgb(0, 255, 0)", label: "Comedones" },
  2: { color: "rgb(0, 0, 255)", label: "Dark-circle" },
  3: { color: "rgb(255, 255, 0)", label: "Droopy-eyelid" },
  4: { color: "rgb(255, 0, 255)", label: "Dry-skin" },
  5: { color: "rgb(0, 255, 255)", label: "Eyebag" },
  6: { color: "rgb(128, 0, 0)", label: "Oily-Skin" },
  7: { color: "rgb(0, 128, 0)", label: "Pore" },
  8: { color: "rgb(0, 0, 128)", label: "Skinredness" },
  9: { color: "rgb(128, 128, 0)", label: "Spots" },
  10: { color: "rgb(128, 0, 128)", label: "Wrinkles" },
};

const MainPage = () => {
  const uniqueClasses = useRef(new Set()); 
  const [predictionOutput, setPredictionOutput] = useState(""); // State for output
  const [images, setImages] = useState({
    front: null,
    left: null,
    right: null,
  });
  const [currentInstruction, setCurrentInstruction] = useState("Look straight ahead.");
  const [currentPosition, setCurrentPosition] = useState("front");
  const [annotatedImages, setAnnotatedImages] = useState({
    front: null,
    left: null,
    right: null,
  });

  const handleCapture = (blob) => {
    const url = URL.createObjectURL(blob);
    setImages((prevImages) => ({
      ...prevImages,
      [currentPosition]: url,
    }));

    // Update instruction and position
    if (currentPosition === "front") {
      setCurrentInstruction("Look to your left.");
      setCurrentPosition("left");
    } else if (currentPosition === "left") {
      setCurrentInstruction("Look to your right.");
      setCurrentPosition("right");
    } else {
      setCurrentInstruction("All images captured.");
    }
  };
  
  const handlePredict = async () => {
    if (!images.front || !images.left || !images.right) {
      alert("Please capture all images before predicting.");
      return;
    }
    
    const formData = new FormData();
    const frontBlob = await fetch(images.front).then((res) => res.blob());
    const leftBlob = await fetch(images.left).then((res) => res.blob());
    const rightBlob = await fetch(images.right).then((res) => res.blob());

    formData.append("front", new File([frontBlob], "front.jpg", { type: "image/jpeg" }));
    formData.append("left", new File([leftBlob], "left.jpg", { type: "image/jpeg" }));
    formData.append("right", new File([rightBlob], "right.jpg", { type: "image/jpeg" }));

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Prediction results:", data);
        Array.from(data.front.bboxes).forEach((el) => {
          if (!uniqueClasses.current.has(el.class_name)) {
            uniqueClasses.current.add(el.class_name); 
        }});
        Array.from(data.left.bboxes).forEach((el) => {
          if (!uniqueClasses.current.has(el.class_name)) {
            uniqueClasses.current.add(el.class_name); 
        }});
        Array.from(data.right.bboxes).forEach((el) => {
          if (!uniqueClasses.current.has(el.class_name)) {
            uniqueClasses.current.add(el.class_name); 
        }});
        //if(uniqueClasses.size==0) console.log("You have nice skin. LOL");


        setAnnotatedImages({
          front: `http://127.0.0.1:8000${data.front.annotated_image_url}`,
          left: `http://127.0.0.1:8000${data.left.annotated_image_url}`,
          right: `http://127.0.0.1:8000${data.right.annotated_image_url}`,
        });

        setPredictionOutput(
          uniqueClasses.current.size !== 0
            ? `Detected conditions: ${Array.from(uniqueClasses.current).join(", ")}`
            : "You have nice skin. LOL."
        );

        //alert("Prediction successful. Check the annotated images and legend.");
      } else {
        console.error("Prediction failed:", response.statusText);
        alert("Prediction failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during prediction:", error);
      alert("An error occurred. Please try again.");
    }
  };
  //console.log(uniqueClasses)
  
  const printOutput=()=>{
    if(uniqueClasses.current.size!==0) return "i";
    else return "You have nice skin. LOL.";
  };

  return (
    <div className="main-page">
    {/* Sidebar */}
    <div className="sidebar">
      <button onClick={() => window.location.reload()}>Restart</button>
      <CameraComponent onCapture={handleCapture} />
      <button onClick={handlePredict} disabled={!images.front || !images.left || !images.right}>
        Predict
      </button>
      <div className="legend-container">
        <h3>Legend</h3>
        <ul className="legend-list">
          {Object.entries(COLOR_MAP).map(([key, { color, label }]) => (
            <li key={key} className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: color }}
              ></span>
              <span className="legend-label">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>

    {/* Main Content */}
    <div className="content">
      <h1>Skin Condition Scanner</h1>
      <p>{currentInstruction}</p>
      <div className="image-display">
        {["front", "left", "right"].map((position) => (
          <div key={position} className="image-container">
            <h3>{position.charAt(0).toUpperCase() + position.slice(1)}</h3>
            {images[position] ? (
              <img
                src={annotatedImages[position] || images[position]}
                alt={`${position} view`}
              />
            ) : (
              <p>No {position} image captured</p>
            )}
          </div>
        ))}
      </div>
      <div><p>{predictionOutput}</p></div>
    </div>

  </div>
  //style={{backgroundColor:"red"}} {flag === 1 ? printOutput() : "god"}
  );
};

export default MainPage;
