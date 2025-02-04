from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from model1 import load_model, predict_and_draw
import os
import yaml
import cv2
import numpy as np
from rembg import remove
from PIL import Image

# Initialize FastAPI app
app = FastAPI()

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Enable CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLO model
model = load_model("best.pt")

# Load class names from data.yaml
with open("data.yaml", "r") as file:
    data = yaml.safe_load(file)
class_names = {i: name for i, name in enumerate(data["names"])}

# Fixed color map for 11 classes
fixed_color_map = {
    0: (255, 0, 0),    # Red
    1: (0, 255, 0),    # Green
    2: (0, 0, 255),    # Blue
    3: (255, 255, 0),  # Yellow
    4: (255, 0, 255),  # Magenta
    5: (0, 255, 255),  # Cyan
    6: (128, 0, 0),    # Dark Red
    7: (0, 128, 0),    # Dark Green
    8: (0, 0, 128),    # Dark Blue
    9: (128, 128, 0),  # Olive
    10: (128, 0, 128), # Purple
}

color_map = {i: fixed_color_map.get(i, (128, 128, 128)) for i in class_names}

# Static folder for saving output images
if not os.path.exists("static"):
    os.makedirs("static")

def remove_background_and_predict(input_path, output_path, class_names, color_map, model):
    # Remove background
    with open(input_path, "rb") as input_file:
        input_data = input_file.read()
        output_data = remove(input_data)
    
    # Convert output data to a numpy array and decode
    nparr = np.frombuffer(output_data, np.uint8)
    img_removed_bg = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

    # Check if we have an alpha channel; if not, assume full opacity
    if img_removed_bg.shape[2] == 4:
        alpha = img_removed_bg[:,:,3] / 255.0
        rgb_img = img_removed_bg[:,:,:3]
    else:
        alpha = np.ones(img_removed_bg.shape[:2], dtype=np.float32)
        rgb_img = img_removed_bg

    # Create a white background image
    white_bg = np.ones(rgb_img.shape, dtype=np.uint8) * 255

    # Blend the image with white background using the alpha channel
    img_white_bg = (1 - alpha[:,:,np.newaxis]) * white_bg + alpha[:,:,np.newaxis] * rgb_img
    img_white_bg = img_white_bg.astype(np.uint8)
    
    # Save the image with white background
    cv2.imwrite(output_path, img_white_bg)
    
    # Predict and draw bounding boxes on the white background image
    annotated_image, boxes = predict_and_draw(output_path, class_names, color_map, model)
    
    return annotated_image, boxes


@app.post("/predict")
async def predict_endpoint(
    front: UploadFile = File(...),
    left: UploadFile = File(...),
    right: UploadFile = File(...),
):
    try:
        results = {}
        for view, upload_file in {"front": front, "left": left, "right": right}.items():
            # Save the uploaded image
            input_path = os.path.join("static", f"{view}_input.png")
            with open(input_path, "wb") as f:
                f.write(await upload_file.read())

            # Remove background, predict, and draw bounding boxes
            output_path = os.path.join("static", f"{view}_white_bg.png")
            annotated_image, boxes = remove_background_and_predict(input_path, output_path, class_names, color_map, model)

            # Save the annotated image
            annotated_path = os.path.join("static", f"{view}_annotated.png")
            cv2.imwrite(annotated_path, cv2.cvtColor(annotated_image, cv2.COLOR_RGB2BGR))

            # Collect results for this view
            results[view] = {
                "annotated_image_url": f"/static/{view}_annotated.png",
                "bboxes": [
                    {
                        "x1": int(box[0]),
                        "y1": int(box[1]),
                        "x2": int(box[2]),
                        "y2": int(box[3]),
                        "confidence": float(box[4]),
                        "class_name": class_names[int(box[5])],
                    }
                    for box in boxes
                ],
            }

        return JSONResponse(content=results)

    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def root():
    return {"message": "YOLO Skin Condition Scanner with Background Removal is up and running!"}
