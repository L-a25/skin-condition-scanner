from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from model1 import load_model, predict_and_draw
import os
import yaml
import cv2


# Initialize FastAPI app
app = FastAPI()
from fastapi.staticfiles import StaticFiles

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


@app.post("/predict")
async def predict_endpoint(
    front: UploadFile = File(...),
    left: UploadFile = File(...),
    right: UploadFile = File(...),
):
    """
    Endpoint to handle three separate image uploads (front, left, right),
    process them, and return predictions for each.
    """
    try:
        results = {}
        for view, upload_file in {"front": front, "left": left, "right": right}.items():
            # Save the uploaded image
            input_path = os.path.join("static", f"{view}.jpg")
            with open(input_path, "wb") as f:
                f.write(await upload_file.read())

            # Predict and draw bounding boxes
            annotated_image, boxes = predict_and_draw(input_path, class_names, color_map,model)

            # Save the annotated image
            output_path = os.path.join("static", f"{view}_annotated.jpg")
            cv2.imwrite(output_path, cv2.cvtColor(annotated_image, cv2.COLOR_RGB2BGR))

            # Collect results for this view
            results[view] = {
                "annotated_image_url": f"/static/{view}_annotated.jpg",
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
    """
    Root endpoint for testing the API.
    """
    return {"message": "YOLO Skin Condition Scanner is up and running!"}

