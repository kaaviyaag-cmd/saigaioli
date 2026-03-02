import pickle
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from tensorflow.keras.models import load_model

# 1. Load dataset
with open("data_36.pickle", "rb") as f:
    data_dict = pickle.load(f)

X = np.array(data_dict["data"])
y = np.array(data_dict["labels"])

# 2. Load label encoder
with open("label_encoder.pkl", "rb") as f:
    label_encoder = pickle.load(f)

# 3. Encode labels
y_encoded = label_encoder.transform(y)

# 4. Load trained model
model = load_model("isl_model_36_signs.h5")

# 5. Predict
y_pred_probs = model.predict(X)
y_pred = np.argmax(y_pred_probs, axis=1)

# 6. Accuracy
accuracy = accuracy_score(y_encoded, y_pred)
print("\n Overall Accuracy:", accuracy)

# 7. Classification Report
print("\n Classification Report:")
print(classification_report(y_encoded, y_pred, target_names=label_encoder.classes_))

# 8. Confusion Matrix
cm = confusion_matrix(y_encoded, y_pred)
print("\n Confusion Matrix:")
print(cm)