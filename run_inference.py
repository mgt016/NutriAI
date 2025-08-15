import os
import cv2
import torch
import matplotlib.pyplot as plt
from ultralytics import YOLO

TRAINED_MODEL_PATH = "runs/detect/train/weights/best.pt"
TEST_IMAGE = "C:/Users/josep/Downloads/images.jpeg"


def run_inference():
    device = "cuda" if torch.cuda.is_available() else "cpu"

    if not os.path.exists(TRAINED_MODEL_PATH):
        raise FileNotFoundError(f"Trained model not found: {TRAINED_MODEL_PATH}")

    if not os.path.exists(TEST_IMAGE):
        raise FileNotFoundError(f"Test image not found: {TEST_IMAGE}")

    print(f"Using device: {device}")

    model = YOLO(TRAINED_MODEL_PATH).to(device)

    results = model(TEST_IMAGE, conf=0.4, iou=0.5)

    # Draw bounding boxes
    for result in results:
        img = result.plot()

        # Convert BGR to RGB (Matplotlib uses RGB)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Display using Matplotlib
        plt.imshow(img_rgb)
        plt.axis("off")
        plt.show()

if __name__ == "__main__":
    run_inference()
