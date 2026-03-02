import pickle
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.utils import to_categorical

# 1. Load dataset
with open("data_36.pickle", "rb") as f:
    data_dict = pickle.load(f)

X = np.array(data_dict["data"])
y = np.array(data_dict["labels"])

print("Dataset shape:", X.shape, y.shape)

# 2. Encode labels (A–Z, 0–9 -> numbers)
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

# 3. One-hot encode labels
y_categorical = to_categorical(y_encoded)

# 4. Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y_categorical, test_size=0.2, random_state=42, stratify=y_categorical
)

# 5. Build Deep Learning model
num_classes = y_categorical.shape[1]

model = Sequential([
    Dense(256, activation='relu', input_shape=(X.shape[1],)),
    Dropout(0.4),
    Dense(128, activation='relu'),
    Dropout(0.3),
    Dense(num_classes, activation='softmax')   # 36 classes
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# 6. Train model
history = model.fit(
    X_train, y_train,
    validation_data=(X_test, y_test),
    epochs=80,
    batch_size=64,
    verbose=1
)

# 7. Evaluate
loss, acc = model.evaluate(X_test, y_test)
print("✅ Test Accuracy:", acc)

# 8. Save model & label encoder
model.save("isl_model_36_signs.h5")

with open("label_encoder.pkl", "wb") as f:
    pickle.dump(label_encoder, f)

print("🎯 Model and label encoder saved successfully!")
