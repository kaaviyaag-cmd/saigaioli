import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
import pickle

# -------------------------------
# Load trained model & labels
# -------------------------------
model = tf.keras.models.load_model("isl_model_36_signs.h5")

with open("label_encoder.pkl", "rb") as f:
    label_encoder = pickle.load(f)

# -------------------------------
# Mediapipe setup
# -------------------------------
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# -------------------------------
# Start webcam
# -------------------------------
cap = cv2.VideoCapture(0)

print("✅ Starting real-time ISL detection... Press 'q' to quit.")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Convert to RGB
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb)

    if results.multi_hand_landmarks:

        data_aux = []

        # -------------------------------
        # Sort hands (left to right)
        # -------------------------------
        hands_list = results.multi_hand_landmarks
        hands_list = sorted(
            hands_list,
            key=lambda hand: min([lm.x for lm in hand.landmark])
        )

        # -------------------------------
        # Extract landmarks for each hand
        # -------------------------------
        for hand_landmarks in hands_list:

            x_ = []
            y_ = []

            for lm in hand_landmarks.landmark:
                x_.append(lm.x)
                y_.append(lm.y)

            for lm in hand_landmarks.landmark:
                data_aux.append(lm.x - min(x_))
                data_aux.append(lm.y - min(y_))

        # -------------------------------
        # If only one hand → pad second hand
        # -------------------------------
        if len(hands_list) == 1:
            data_aux += [0.0] * (21 * 2)

        # Ensure correct length (84 features)
        max_len = 84
        if len(data_aux) < max_len:
            data_aux += [0.0] * (max_len - len(data_aux))
        else:
            data_aux = data_aux[:max_len]

        # -------------------------------
        # Predict
        # -------------------------------
        prediction = model.predict(np.array([data_aux]), verbose=0)
        class_id = np.argmax(prediction)
        confidence = np.max(prediction)

        if confidence > 0.80:
            class_name = label_encoder.inverse_transform([class_id])[0]
            display_text = f"{class_name} ({confidence:.2f})"
        else:
            display_text = "Detecting..."

        # -------------------------------
        # Draw landmarks
        # -------------------------------
        for hand_landmarks in hands_list:
            mp_drawing.draw_landmarks(
                frame,
                hand_landmarks,
                mp_hands.HAND_CONNECTIONS
            )

        # Display prediction
        cv2.putText(frame, display_text, (10, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1, (0, 255, 0), 2)

    cv2.imshow("ISL Real-Time Recognition", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()