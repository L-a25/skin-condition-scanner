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
  let ans = useRef(new String());
  const [predictionOutput, setPredictionOutput] = useState(""); // State for output
  const [recommendation, setRecommendation]=useState("");
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
        let recommendationMap = {};
        let detectedConditions="";

        if(uniqueClasses.current.size !== 0) detectedConditions= Array.from(uniqueClasses.current);

        if (uniqueClasses.current.size !== 0) {
          detectedConditions = Array.from(uniqueClasses.current);
        } else {
          setRecommendation(""); // Ensure recommendation remains empty when no conditions are found
          return; // Exit early
        }
        

        detectedConditions.forEach(condition => {
          if (condition === "Dark-circle"||condition === "Droopy-eyelids") {
            recommendationMap[condition] = {
                "Adequate Sleep": "Ensuring sufficient quality sleep is crucial for minimizing dark circles. Adults should aim for 7 to 9 hours of restful sleep per night. Inadequate sleep can exacerbate the appearance of dark circles, making them more noticeable.",
                "Cold Compresses": "Applying cold compresses can constrict blood vessels around the eyes, reducing puffiness and discoloration. Chilled items such as cucumber slices or a clean cloth soaked in cold water can be effective. Regularly using cold compresses can help mitigate the appearance of dark circles."
            };
        } else if (condition === "Eyebag") {
            recommendationMap[condition] = {
                "Cold Compress": "Using a cold compress is one of the simplest and most effective home remedies for reducing eye bags. You can apply a washcloth soaked in cold water, ice compresses, or specially designed cold compresses directly over your closed eyes for one to two minutes. Cold compresses help to reduce swelling, especially if the eye bags are caused by irritants, lack of sleep, or high stress.",
                "Cucumber Slices": "Cucumber slices are a popular natural remedy due to their high-water content, which hydrates the skin, and their vitamins, particularly vitamin C, which can be absorbed through the skin to reduce puffiness. Additionally, cucumbers contain silica, beneficial for maintaining skin elasticity."
            };
        } else if (condition === "Acne-Rosacea" || condition === "Comedones" ) {
          recommendationMap[condition] = {
                "Tea Tree Oil": "Known for its antibacterial and anti-inflammatory properties, tea tree oil may kill the bacteria that cause acne and reduce inflammation in existing pimples.",
                "Honey": "Honey possesses antimicrobial properties and can help speed up wound healing. It is often used in DIY masks combined with other ingredients like cinnamon or oatmeal. ",
                "Aloe Vera": "Recognized for its soothing properties, aloe vera may help reduce acne by preventing breakouts and calming inflammation.",
                "Green Tea": "Contains antioxidants that can reduce inflammation and may help decrease acne lesions when applied topically or consumed.",
                "Zinc": "Research indicates that zinc supplements can inhibit the growth of acne causing bacteria, making it a viable option for acne treatment."
          };
      } else if (condition === "Skinredness") {
        recommendationMap[condition] = {
            "Aloe Vera": "Aloe vera is renowned for its soothing properties and is effective in reducing inflammation and irritation of the skin. Applying pure aloe vera gel directly to the affected areas can help alleviate redness and provide a cooling effect. It is advisable to use either store-bought aloe vera or extract it directly from the plant.",
            "Chamomile ": "Chamomile is famous for its calming properties and can be used both as a drink and topically on the skin. Creating a chamomile tea compress or using chamomile-infused products can help reduce inflammation and soothe irritated skin. It serves as a gentle treatment for redness and can be particularly effective for sensitive skin types. ",
            "Raw Honey": "Raw honey, especially Manuka honey, is known for its antibacterial and anti-inflammatory properties. It can be applied directly to the red areas of the skin to help reduce irritation and promote healing. For best results, leave the honey on for about 30 minutes before rinsing it off with lukewarm water. ",
            "Oatmeal": "Oatmeal is another effective remedy for alleviating skin redness due to its anti-inflammatory properties. Making a mask by mixing oatmeal with water and applying it to the affected area can soothe irritation and help calm inflamed skin. It also acts as a gentle exfoliant, removing dead skin cells and improving overall skin texture."
        };
    }  else if (condition === "Pore") {
      recommendationMap[condition] = {
          "Clay and Charcoal Masks": "Clay or charcoal masks are known to be effective in drawing out impurities from the skin, reducing the appearance of enlarged pores. These masks absorb excess oil and can be used once or twice a week.",
          "Ice cube treatment": "Using ice cubes on the face can temporarily tighten the skin and help minimize pore appearance. This remedy is simple and effective for a quick fix. ",
          "Essential Oils": "Anti-inflammatory essential oils, such as lavender and rosemary, may help balance skin and reduce the appearance of pores. They can be incorporated into skincare routines for added benefits.",
          "Water-Based Products ": "Utilizing water-based skincare products may also help in reducing the appearance of large pores. These products are lighter and less likely to clog pores compared to oilbased formulations."
      };
  } else if (condition === "Dry-skin") {
    recommendationMap[condition] = {
        "Gentle Cleansing": "Wash face with lukewarm water and a gentle, moisturizing cleanser to avoid stripping natural oils.",
        "Moisturizing": "Apply a thick moisturizer immediately after bathing to lock in moisture. Look for creams that contain ingredients like petrolatum, lanolin, or hyaluronic acid. ",
        "Humidifiers": "Use a humidifier at home to maintain moisture in the air, particularly during winter.",
        "Warm Baths": "Limit bath time to 5-10 minutes with warm, not hot, water to prevent additional moisture loss."
    };
} else if (condition === "Oily-skin") {
  recommendationMap[condition] = {
      "Cleansing": "Wash your face twice daily with a noncomedogenic cleanser to remove excess oil without causing dryness. ",
      "Astringents": "Use alcohol-free astringents, like witch hazel, to help tighten pores and control oil production. ",
      "EExfoliation": "Employ chemical exfoliants containing salicylic acid to clear clogged pores and reduce shine ",
      "Oil-Free Moisturizers": "Choose lightweight, oil-free moisturizers to keep skin hydrated without adding extra oil. "
  };
} else if (condition === "Wrinkles" ) {
  recommendationMap[condition] = {
        "Banana Mask": "Bananas are packed with vitamins and natural oils that can enhance skin health. Application Method: To create a banana face mask, mash a quarter of a ripe banana and apply a smooth paste to the skin, letting it sit for 15 to 20 minutes before rinsing off with warm water. This simple remedy can help moisturize the skin and may reduce signs of aging.",
        "Vitamin C": "Applying a topical gel containing Vitamin C can improve the appearance of wrinkles and other signs of sun damage. Vitamin C is crucial for collagen synthesis and acts as an antioxidant, protecting the skin.  ",
        "Aloe Vera": "Aloe vera is well-known for its healing properties and can act as a moisturizing agent. Applying aloe vera gel directly to the skin may help improve its elasticity and reduce the appearance of wrinkles. It is rich in antioxidants that protect the skin from free radical damage, making it a valuable addition to your skincare routine. ",
        "Essential Oils": "Using essential oils in combination with carrier oils may be effective in reducing wrinkles. Oils such as jojoba, carrot seed, or rose essential oil diluted with a carrier oil can provide hydrating effects and may promote skin rejuvenation. ",
        "Olive Oil": "Incorporating olive oil into your diet and skincare can be beneficial for wrinkle prevention. Research suggests that olive oil may help protect your skin from developing further wrinkles by increasing collagen levels. Applying olive oil directly to the skin can also provide moisture and nourishment.",
        "Encourage Hydration":"Maintaining hydration is vital for skin health. Drinking sufficient water and using moisturizers can help keep the skin plump and reduce the visibility of fine lines and wrinkles."
  };
}
  else if (condition === "Spots" ) {
    recommendationMap[condition] = {
          "Lemon Juice": "Lemon juice is a well-known natural remedy for lightening freckles due to its mild bleaching properties. It can be applied directly to the skin using a cotton ball. After allowing the juice to sit for about 20 minutes, it should be washed off with lukewarm water. This treatment can be repeated daily, but it is essential to apply sunscreen afterward as lemon juice can make skin more sensitive to sunlight.",
          "Honey and Apple Cider Vinegar": "A mixture of honey and apple cider vinegar is another popular remedy. One tablespoon of apple cider vinegar and one teaspoon of honey can be combined and applied directly to freckles. It should be left on the skin for around 30 minutes before rinsing off with water. Both ingredients are thought to help lighten pigmentation over time due to their natural acids and moisturizing properties.",
          "Aloe Vera Gel": "Aloe vera gel is frequently used for its soothing and healing properties. It can be applied directly from the leaf to the skin, where it should be left on for about 30 minutes before rinsing. Aloe contains ingredients that may help reduce pigmentation and promote skin healing.  ",
          "Yogurt": "Yogurt is another helpful remedy due to its lactic acid content. It can be applied directly to the skin and left on for around 20 minutes before rinsing with warm water. Lactic acid is known to exfoliate the skin and may help to lighten freckles gradually.",
          "Papaya": "Fresh papaya can also be used as a remedy for freckles. It can be mashed and applied directly to the skin. The enzymes in papaya are thought to exfoliate and rejuvenate the skin, potentially leading to lighter freckles over time.",
          "Onion":"Onion slices can be rubbed directly onto freckled areas. The natural acids in onions might help lighten pigmentation when used regularly. After application, the area can be rinsed with warm water.",
          "Green Tea Extract":"Green tea has antioxidant properties and may help in reducing pigmentation. A cooled green tea bag can be pressed onto the affected areas for about 20 minutes. The tannins and polyphenols in green tea are thought to help in skin whitening. "
    };
} 
});

        detectedConditions.forEach(condition => {
          if (recommendationMap[condition]) {
              Object.entries(recommendationMap[condition]).forEach(([title, recommendation]) => {
                  console.log(`- ${title}: ${recommendation}`);
                  
              });
          }
      });
      
      ans = Object.entries(recommendationMap)
        .map(([condition, recommendations]) => {
          let recList = Object.entries(recommendations)
              .map(([title, text]) => `- ${title}: ${text}`)
              .join("\n");
          return `${condition}:\n${recList}`;
      })
      .join("\n\n");

            // Set recommendations in state as a formatted string
            setRecommendation(ans);


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
      <div><p>{predictionOutput}</p>
      <div style={{ background: "#2A6478" }}>{recommendation.split("\n").map((line, index) => (
      <p key={index} >{line}</p>
      ))}
    </div>
</div>
      
</div>

</div>
  );
};

export default MainPage;
