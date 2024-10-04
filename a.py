# import numpy as np
# import pandas as pd
# from sklearn.preprocessing import MinMaxScaler
# from keras.models import Sequential
# from keras.layers import LSTM, Dense, Dropout
# from sklearn.model_selection import train_test_split
# from keras.callbacks import EarlyStopping
# import joblib

# # Load your dataset
# data = pd.read_csv('spotify-2023-copy.csv')

# # Check for missing values
# if data.isnull().sum().any():
#     print("Data contains missing values. Please handle them before proceeding.")

# # Extract features and labels
# X = data[['Day1', 'Day2', 'Day3', 'Day4', 'Day5']].values
# y = data['Day6'].values
# track_names = data['track_name'].values

# # Normalize the data
# scaler_X = MinMaxScaler(feature_range=(0, 1))
# X_scaled = scaler_X.fit_transform(X)

# scaler_y = MinMaxScaler(feature_range=(0, 1))
# y_scaled = scaler_y.fit_transform(y.reshape(-1, 1))

# # Reshape the input to be 3D [samples, time steps, features]
# X_reshaped = X_scaled.reshape((X_scaled.shape[0], X_scaled.shape[1], 1))

# # Split the dataset into training, validation, and testing sets
# X_train, X_temp, y_train, y_temp, track_train, track_temp = train_test_split(
#     X_reshaped, y_scaled, track_names, test_size=0.2, random_state=42
# )

# X_val, X_test, y_val, y_test, track_val, track_test = train_test_split(
#     X_temp, y_temp, track_temp, test_size=0.5, random_state=42
# )

# # Build the LSTM model
# model = Sequential()
# model.add(LSTM(50, return_sequences=True, input_shape=(X_train.shape[1], 1)))
# model.add(Dropout(0.2))
# model.add(LSTM(50, return_sequences=False))
# model.add(Dropout(0.2))
# model.add(Dense(1))

# # Compile the model
# model.compile(optimizer='adam', loss='mean_squared_error')

# # Early stopping callback
# early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)

# # Train the model
# history = model.fit(X_train, y_train, epochs=100, batch_size=32, 
#                     validation_data=(X_val, y_val), callbacks=[early_stopping])

# # Save the model and scalers
# model.save('lstm_model.h5')
# joblib.dump(scaler_X, 'scaler_X.pkl')  # Save scaler for X
# joblib.dump(scaler_y, 'scaler_y.pkl')  # Save scaler for y

# # Make predictions
# y_pred_scaled = model.predict(X_test)

# # Inverse transform the predictions using the scaler for y
# y_pred = scaler_y.inverse_transform(y_pred_scaled)

# # Convert predictions to integer format
# y_pred_int = y_pred.astype(int)

# # Combine predictions with track names
# predictions_df = pd.DataFrame({'track_name': track_test, 'predicted_day6': y_pred_int.flatten()})

# # Print predictions
# print(predictions_df)

# # Optionally visualize training history
# import matplotlib.pyplot as plt

# plt.plot(history.history['loss'], label='train loss')
# plt.plot(history.history['val_loss'], label='validation loss')
# plt.title('Model Loss')
# plt.ylabel('Loss')
# plt.xlabel('Epoch')
# plt.legend()
# plt.show()



#Prediction Script
# import numpy as np
# import pandas as pd
# from sklearn.preprocessing import MinMaxScaler
# from keras.models import load_model
# import joblib  # Use joblib to load the scaler

# # Load the saved model
# model = load_model('lstm_model.h5')

# # Load the scalers
# scaler_X = joblib.load('scaler_X.pkl')  # Load the scaler for X
# scaler_y = joblib.load('scaler_y.pkl')  # Load the scaler for y

# # Load the dataset for predictions
# data = pd.read_csv('spotify-2023-copy.csv')

# # Prepare the data for prediction
# X = data[['Day1', 'Day2', 'Day3', 'Day4', 'Day5']].values
# track_names = data['track_name'].values

# # Normalize the data using the loaded scaler
# X_scaled = scaler_X.transform(X)  # Use transform instead of fit_transform

# # Reshape the input to be 3D [samples, time steps, features]
# X_reshaped = X_scaled.reshape((X_scaled.shape[0], X_scaled.shape[1], 1))

# # Make predictions
# y_pred_scaled = model.predict(X_reshaped)

# # Inverse transform the predictions using the loaded scaler for y
# y_pred = scaler_y.inverse_transform(y_pred_scaled)

# # Convert predictions to integer format
# y_pred_int = y_pred.astype(int)

# # Combine predictions with track names
# predictions_df = pd.DataFrame({'track_name': track_names, 'predicted_day6': y_pred_int.flatten()})

# # Print predictions
# print(predictions_df)









# import requests
# import numpy as np
# import pandas as pd
# from sklearn.preprocessing import MinMaxScaler
# from keras.models import load_model
# import joblib
# import time
# import json
# import schedule

# # Initialize global variables
# rolling_inputs = [0, 0, 0, 0, 0]  # Placeholder for rolling input values

# # Load the model and scalers
# model = load_model('lstm_model.h5')
# scaler_X = joblib.load('scaler_X.pkl')
# scaler_y = joblib.load('scaler_y.pkl')

# # Function to fetch the IPFS hash from the Flask server
# def get_ipfs_hash():
#     try:
#         response = requests.get('http://localhost:5000/update-ipfs')
#         if response.status_code == 200:
#             data = response.json()
#             return data['ipfsHash']
#         else:
#             print(f"Error fetching IPFS hash: {response.status_code}")
#             return None
#     except Exception as e:
#         print(f"Error fetching IPFS hash: {e}")
#         return None

# # Function to fetch the latest listen count from Pinata
# def get_latest_listen_count(song_id):
#     try:
#         # Fetch the IPFS hash from the Flask server
#         ipfs_hash = get_ipfs_hash()
#         if not ipfs_hash:
#             raise ValueError('IPFS hash not found')

#         # Fetch metadata from Pinata
#         pinata_url = f'https://gateway.pinata.cloud/ipfs/{ipfs_hash}'
#         response = requests.get(pinata_url)
#         metadata = response.json()

#         # Find the song with the given song_id
#         song = next((item for item in metadata if item['id'] == song_id), None)
#         if not song:
#             print(f"Song with ID {song_id} not found.")
#             return None

#         return song['listenCount']
#     except Exception as e:
#         print(f"Error fetching listen count from Pinata: {e}")
#         return None

# # Update rolling inputs and shift the data
# def update_rolling_inputs(new_input):
#     global rolling_inputs
#     rolling_inputs = rolling_inputs[1:] + [new_input]  # Shift and append the latest value
#     print(f"Updated rolling inputs: {rolling_inputs}")

# # Make predictions using the LSTM model
# def make_prediction():
#     try:
#         global rolling_inputs

#         # Convert rolling inputs to numpy array
#         X = np.array(rolling_inputs).reshape(1, -1)  # Reshape to (1, 5)

#         # Scale the inputs
#         X_scaled = scaler_X.transform(X)
#         X_reshaped = X_scaled.reshape((X_scaled.shape[0], X_scaled.shape[1], 1))

#         # Make the prediction
#         y_pred_scaled = model.predict(X_reshaped)
#         y_pred = scaler_y.inverse_transform(y_pred_scaled)

#         # Convert prediction to integer
#         predicted_day6 = int(y_pred[0][0])
#         print(f"Predicted Day 6 listen count: {predicted_day6}")
#         return predicted_day6
#     except Exception as e:
#         print(f"Error during prediction: {e}")
#         return None

# # Task to fetch listen count, update inputs, and make predictions
# def update_and_predict(song_id):
#     latest_listen_count = get_latest_listen_count(song_id)
#     if latest_listen_count is not None:
#         update_rolling_inputs(latest_listen_count)
#         make_prediction()

# # Schedule the task every 5 minutes
# def start_scheduler(song_id):
#     schedule.every(5).minutes.do(update_and_predict, song_id=song_id)
#     while True:
#         schedule.run_pending()
#         time.sleep(1)

# if __name__ == '__main__':
#     song_id = 1  # Example song ID
#     start_scheduler(song_id)



from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import numpy as np
import joblib
from keras.models import load_model
from web3 import Web3
import json

app = Flask(__name__)
CORS(app)

model = load_model('lstm_model.h5')
scaler_X = joblib.load('scaler_X.pkl')
scaler_y = joblib.load('scaler_y.pkl')

w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545')) 
# contract_address = '0xC469e7aE4aD962c30c7111dc580B4adbc7E914DD' 
contract_address = '0xE9061F92bA9A3D9ef3f4eb8456ac9E552B3Ff5C8' 
if w3.is_connected():
    print("Connected to Ethereum network")
else:
    print("Failed to connect to Ethereum network")
abi_file_path = 'src/frontend/contractsData/DynamicRoyalties.json'
with open(abi_file_path, 'r') as abi_file:
    contract_data = json.load(abi_file)
    contract_abi = contract_data['abi']  
contract = w3.eth.contract(address=contract_address, abi=contract_abi)
from_account = w3.eth.accounts[0]  # Select the first account or whichever is correct
w3.eth.default_account = from_account

rolling_inputs_dict = {}  # To store rolling_inputs for each song id
prevPredicted_dict = {}  # To store prevPredicted for each song id
i = 0

def update_rolling_inputs(song_id, new_input):
    # Initialize if not present
    if song_id not in rolling_inputs_dict:
        rolling_inputs_dict[song_id] = [0, 0, 0, 0, 0]  # Initialize rolling inputs
        prevPredicted_dict[song_id] = 100  # Initialize prevPredicted
    
    rolling_inputs_dict[song_id] = rolling_inputs_dict[song_id][1:] + [new_input]
    print(f"Updated rolling inputs for song {song_id}: {rolling_inputs_dict[song_id]}")

def make_prediction(song_id):
    try:
        rolling_inputs = rolling_inputs_dict[song_id]
        prevPredicted = prevPredicted_dict[song_id]
        
        X = np.array(rolling_inputs).reshape(1, -1)
        print(f"Rolling inputs before scaling for song {song_id}: {X}")
        X_scaled = scaler_X.transform(X)
        X_reshaped = X_scaled.reshape((X_scaled.shape[0], X_scaled.shape[1], 1))

        y_pred_scaled = model.predict(X_reshaped)
        y_pred = scaler_y.inverse_transform(y_pred_scaled)

        predicted_day6 = int(y_pred[0][0])
        
        prevPredicted_dict[song_id] = predicted_day6  # Update prevPredicted for this song
        
        # Calculate the royalty factor based on the comparison
        if rolling_inputs[-1] > prevPredicted:
            royalty_factor = prevPredicted / rolling_inputs[-1]
        else:
            royalty_factor = rolling_inputs[-1] / prevPredicted
        
        print(f"Predicted Day 6 listen count for song {song_id}: {predicted_day6}, Royalty factor: {royalty_factor}, Amount: {royalty_factor*(rolling_inputs[-1]-rolling_inputs[-2])}")
        return royalty_factor*(rolling_inputs[-1]-rolling_inputs[-2])
    except Exception as e:
        print(f"Error during prediction for song {song_id}: {e}")
        return None

def send_prediction_to_contract(artist_address, total_royalty_amount):
    try:
        from_account = w3.eth.accounts[4]  # Use the correct account
        total_royalty_in_wei = Web3.to_wei(total_royalty_amount, 'ether')
        # Send total royalty amount to the artist's address
        tx_hash = contract.functions.distributeRoyalties(artist_address, total_royalty_in_wei).transact({'from': from_account})
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"Royalty sent to artist {artist_address} successfully, transaction hash: {tx_hash.hex()}")

    except Exception as e:
        print(f"Error sending royalty to smart contract: {e}")

@app.route('/predict', methods=['POST'])
def predict():
    global i
    if i%2 == 0:
        i += 1
        try:
            data = request.json
            ipfs_hash = data.get('ipfsHash')
            artist_address = data.get('account')
            if ipfs_hash:
                pinata_url = f'https://gateway.pinata.cloud/ipfs/{ipfs_hash}'
                print(f"Pinata URL: {pinata_url} and artist address: {artist_address}")
                
                response = requests.get(pinata_url)
                if response.status_code == 200:
                    metadata = response.json()                    
                    total_royalty = 0  # Initialize total royalty
                
                    for song in metadata:
                        song_id = song['id']
                        song_artist_address = song['artistId']
                        listen_count = song['listenCount']
                        
                        if song_artist_address == artist_address.lower():  # Only consider songs for the specified artist
                            update_rolling_inputs(song_id, listen_count)
                            predicted_value = make_prediction(song_id)

                            if predicted_value is not None:
                                total_royalty += predicted_value

                    if total_royalty > 0:  # Send to contract if there's a total royalty to distribute
                        send_prediction_to_contract(artist_address, total_royalty)
                    return jsonify({"status": "success", "message": "Royalties sent to contract.", "artistAddress": artist_address, "totalRoyalty": total_royalty}), 200
                else:
                    print(f"Failed to fetch data from Pinata. Status code: {response.status_code}")
                    return jsonify({"status": "error", "message": "Failed to fetch IPFS data."}), 400
            else:
                print("IPFS hash not provided")
                return jsonify({"status": "error", "message": "IPFS hash not provided."}), 400
        except Exception as e:
            print(f"Error during prediction process: {e}")
            return jsonify({"status": "error", "message": "Error during prediction process."}), 500
    else:
        i += 1  # Increment i even when skipping to ensure it's updated correctly
        print("Successful execution")
        print(i)
        return jsonify({"status": "skipped", "message": "Skipped execution on odd iteration."}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5001)

