import cv2
import numpy as np
from ultralytics import YOLO
import logging
from utils import merge_overlapping_boxes


def load_model(model_path):
    """
    Load the YOLO model.
    """
    try:
        model = YOLO(model_path)
        logging.info("[INFO] Model loaded successfully.")
        return model
    except Exception as e:
        logging.error(f"[ERROR] Failed to load model: {e}")
        raise e


def predict_and_draw(image_path, class_names ,color_map, model, conf=0.25, iou=0.3):
    """
    Predict bounding boxes and draw them on the image using OpenCV.
    """
    # Perform predictions
    results = model.predict(source=image_path, conf=conf, save=False, verbose=False, iou=iou)

    # Extract bounding boxes
    boxes = results[0].boxes.data.cpu().numpy()  # Format: [x1, y1, x2, y2, conf, class]

    # Merge overlapping boxes
    merged_boxes = merge_overlapping_boxes(boxes, iou_threshold=0.1)

    # Load the original image
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)  # Convert to RGB for visualization

    # Overlay bounding boxes
    for box in merged_boxes:
        x1, y1, x2, y2, conf, cls = box
        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
        color = color_map.get(int(cls), (255, 255, 255))  # Default to white

        # Draw bounding box
        cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)

    return image, merged_boxes
