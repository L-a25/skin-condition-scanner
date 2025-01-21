import numpy as np


def merge_overlapping_boxes(boxes, iou_threshold=0.3):
    """
    Merge overlapping boxes of the same class based on IoU.
    """
    boxes = boxes.tolist()  # Convert NumPy array to list for processing
    merged_boxes = []

    # Sort boxes by confidence score, descending
    boxes = sorted(boxes, key=lambda x: -x[4])

    while boxes:
        base_box = boxes.pop(0)  # Get the highest confidence box
        x1, y1, x2, y2, conf, cls = base_box

        to_merge = []
        for other_box in boxes:
            x1_o, y1_o, x2_o, y2_o, conf_o, cls_o = other_box

            if cls == cls_o:  # Only consider boxes of the same class
                # Calculate IoU
                xi1, yi1 = max(x1, x1_o), max(y1, y1_o)
                xi2, yi2 = min(x2, x2_o), min(y2, y2_o)
                inter_area = max(0, xi2 - xi1) * max(0, yi2 - yi1)
                box1_area = (x2 - x1) * (y2 - y1)
                box2_area = (x2_o - x1_o) * (y2_o - y1_o)
                union_area = box1_area + box2_area - inter_area

                iou = inter_area / union_area if union_area > 0 else 0

                if iou > iou_threshold:  # Merge if IoU exceeds threshold
                    to_merge.append(other_box)

        # Merge the boxes
        for box in to_merge:
            boxes.remove(box)
            x1_o, y1_o, x2_o, y2_o, conf_o, cls_o = box
            x1, y1, x2, y2 = min(x1, x1_o), min(y1, y1_o), max(x2, x2_o), max(y2, y2_o)

        merged_boxes.append([x1, y1, x2, y2, conf, cls])

    return np.array(merged_boxes)
