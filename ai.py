import os
import cv2
import torch
import multiprocessing
from ultralytics import YOLO

# Define paths
DATA_YAML = "yolo.yaml"
MODEL_WEIGHTS = "yolov8m.pt"
TRAINED_MODEL_PATH = "runs/detect/train/weights/best.pt"
LAST_CHECKPOINT = "runs/detect/train/weights/last.pt"
TEST_IMAGE = "images/valid/Chapati_Roti_16.jpg"
LOG_FILE = "training_log.txt"

EPOCHS = 100

def train_model():
    """Train YOLOv8 on the new dataset with validation, logging stats after each epoch."""
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    # Load YOLOv8 model (Resume only if checkpoint exists)
    if os.path.exists(LAST_CHECKPOINT):
        print(f"Resuming training from {LAST_CHECKPOINT}")
        model = YOLO(LAST_CHECKPOINT).to(device)
    else:
        print("Starting fresh training...")
        model = YOLO(MODEL_WEIGHTS).to(device)

    # Train with validation
    results = model.train(
        data=DATA_YAML,
        epochs=EPOCHS,
        batch=16,
        imgsz=640,
        device=device,
        workers=4,
        optimizer="AdamW",
        lr0=0.001,
        patience=10,
        cache=True,
        amp=True,
        augment=True,
        save_period=10,
        verbose=True,
        dropout=0.1,
        val=True,
        resume=os.path.exists(LAST_CHECKPOINT)  # Fixed resume issue
    )

    # Save logs
    with open(LOG_FILE, "a") as log_file:
        log_file.write("Training Results:\n")
        log_file.write(f"mAP@50: {results.metrics.mAP50}\n")
        log_file.write(f"Precision: {results.metrics.precision}\n")
        log_file.write(f"Recall: {results.metrics.recall}\n")
        log_file.write(f"Loss: {results.loss}\n\n")

    print(f"Training completed. Logs saved to {LOG_FILE}")

def validate_model():
    """Validate the trained YOLO model on the validation dataset."""
    device = "cuda" if torch.cuda.is_available() else "cpu"

    # Handle missing trained model
    if not os.path.exists(TRAINED_MODEL_PATH):
        print(f"Warning: {TRAINED_MODEL_PATH} not found. Checking last.pt instead.")
        TRAINED_MODEL_PATH = LAST_CHECKPOINT

    if not os.path.exists(TRAINED_MODEL_PATH):
        raise FileNotFoundError("No trained model found to run validation.")

    model = YOLO(TRAINED_MODEL_PATH).to(device)

    # Run validation
    results = model.val(
        data=DATA_YAML,
        batch=16,
        imgsz=640,
        conf=0.7,
        iou=0.5,
        save_json=True,
        plots=True
    )

    # Log validation results
    with open(LOG_FILE, "a") as log_file:
        log_file.write("Validation Results:\n")
        log_file.write(f"mAP@50: {results.metrics.mAP50}\n")
        log_file.write(f"Precision: {results.metrics.precision}\n")
        log_file.write(f"Recall: {results.metrics.recall}\n\n")

    print("Validation complete. Stats saved to log file.")

def run_inference():
    """Perform inference on a validation image."""
    device = "cuda" if torch.cuda.is_available() else "cpu"

    # Handle missing trained model
    if not os.path.exists(TRAINED_MODEL_PATH):
        raise FileNotFoundError(f"Trained model not found: {TRAINED_MODEL_PATH}")

    model = YOLO(TRAINED_MODEL_PATH).to(device)

    if not os.path.exists(TEST_IMAGE):
        raise FileNotFoundError(f"Test image not found: {TEST_IMAGE}")

    # Run inference
    results = model.predict(
        TEST_IMAGE,
        device=device,
        save=True,
        show=True,
        conf=0.7,
        iou=0.5,
        half=True
    )

    # Display results
    for result in results:
        img = result.plot()
        cv2.imshow("Validation Inference", img)
        cv2.waitKey(1)  # Prevent freezing
        cv2.destroyAllWindows()



if __name__ == '__main__':
    multiprocessing.freeze_support()

    train_process = multiprocessing.Process(target=train_model)
    validate_process = multiprocessing.Process(target=validate_model)
    inference_process = multiprocessing.Process(target=run_inference)

    # Train first
    train_process.start()
    train_process.join()

    # Validate after training
    validate_process.start()
    validate_process.join()

    # Perform inference
    inference_process.start()
    inference_process.join()
