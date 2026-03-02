import os
import pickle
import mediapipe as mp
import cv2

# MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=2,               # detect both hands
    min_detection_confidence=0.3
)

# Change this path to your dataset folder containing 36 subfolders
DATA_DIR = r"C:/Users/hp/Music/finalyear_isl/isl_images"

data = []
labels = []

# Loop through all 36 classes (folders)
for dir_ in os.listdir(DATA_DIR):
    class_path = os.path.join(DATA_DIR, dir_)

    if not os.path.isdir(class_path):
        continue  # skip files

    print(f"Processing class: {dir_}")

    # Loop through images in each class
    for img_file in os.listdir(class_path):
        img_path = os.path.join(class_path, img_file)

        img = cv2.imread(img_path)
        if img is None:
            print("Skipped (not image):", img_path)
            continue

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = hands.process(img_rgb)

        if results.multi_hand_landmarks:
            data_aux = []

            # process each detected hand
            for hand_landmarks in results.multi_hand_landmarks:
                x_, y_ = [], []
                for lm in hand_landmarks.landmark:
                    x_.append(lm.x)
                    y_.append(lm.y)

                for lm in hand_landmarks.landmark:
                    data_aux.append(lm.x - min(x_))
                    data_aux.append(lm.y - min(y_))

            # pad if only 1 hand detected → 42 zeros
            if len(results.multi_hand_landmarks) == 1:
                data_aux.extend([0.0] * (21 * 2))

            # store result
            data.append(data_aux)
            labels.append(dir_)

# Save dataset
with open("data_36.pickle", "wb") as f:
    pickle.dump({"data": data, "labels": labels}, f)

print("✅ Landmarks for 36 classes extracted and saved to data_36.pickle")
