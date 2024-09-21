# import numpy as np
# import pandas as pd
# from sklearn.preprocessing import MinMaxScaler
# from tensorflow.keras.models import Sequential
# from tensorflow.keras.layers import LSTM, Dense
# from tensorflow.keras.callbacks import EarlyStopping
# import joblib

# # Load the dataset
# data = pd.read_csv('spotify-2023-copy.csv')

# # Prepare the data
# def prepare_data(df):
#     # Extract relevant columns
#     df = df[['16-Aug', '17-Aug', '18-Aug', '19-Aug', '20-Aug', '21-Aug', '22-Aug']]
    
#     # Convert to numpy array
#     values = df.values
    
#     # Split data into features and targets
#     X, y = [], []
#     for i in range(len(values) - 6):
#         X.append(values[i:i+6])
#         y.append(values[i+6, -1])  # Predict the 7th day (22-Aug)
    
#     return np.array(X), np.array(y)

# # Prepare data
# X, y = prepare_data(data)

# # Scale the data
# scaler = MinMaxScaler(feature_range=(0, 1))
# X_reshaped = X.reshape(-1, X.shape[2])
# scaler.fit(X_reshaped)
# X_scaled = scaler.transform(X_reshaped).reshape(X.shape)
# y_scaled = scaler.fit_transform(y.reshape(-1, 1)).reshape(-1)

# # Define the LSTM model
# model = Sequential([
#     LSTM(50, activation='relu', input_shape=(X.shape[1], X.shape[2])),
#     Dense(1)
# ])
# model.compile(optimizer='adam', loss='mean_squared_error')

# # Train the model
# early_stopping = EarlyStopping(monitor='val_loss', patience=5)
# model.fit(X_scaled, y_scaled, epochs=50, batch_size=32, validation_split=0.1, callbacks=[early_stopping])

# # Save the model and scaler
# model.save('lstm_model.h5')
# joblib.dump(scaler, 'scaler.pkl')

# print("Model and scaler saved.")



import numpy as np
from tensorflow.keras.models import load_model
import joblib

# Load the trained model and scaler
model = load_model('lstm_model.h5')
scaler = joblib.load('scaler.pkl')

# Define a function to make predictions
def predict_streaming_numbers(input_array):
    # Ensure the input array has the correct shape
    input_array = np.array(input_array)
    
    if input_array.shape[1] != 6:
        raise ValueError("Input array must have 6 columns representing 6 days of data.")
    
    # Add a placeholder for the 7th day
    extended_input = np.hstack([input_array, np.zeros((input_array.shape[0], 1))])
    
    # Scale the input data
    scaled_input = scaler.transform(extended_input)
    
    # Create sequence for LSTM
    X_input = np.array([scaled_input[-6:]])
    
    # Predict on the input data
    y_pred = model.predict(X_input)
    
    # Rescale predictions back to the original scale
    y_pred_rescaled = scaler.inverse_transform(np.hstack([np.zeros((y_pred.shape[0], 6)), y_pred]))[:, -1]
    
    return y_pred_rescaled

# Example input array (6 days of data)
input_array = [
    [316778540,317260752, 317717148, 318168827, 318605810,319073451]  # Data for the first 6 days
]

# Make predictions
predictions = predict_streaming_numbers(input_array)

# Print predictions
print(f"Predicted streaming numbers for the 7th day:")
print(predictions[0])
