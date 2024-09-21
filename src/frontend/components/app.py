# # from flask import Flask, request, jsonify
# # import pandas as pd
# # from sklearn.model_selection import train_test_split
# # from sklearn.preprocessing import StandardScaler
# # from sklearn.metrics import mean_squared_error
# # from xgboost import XGBRegressor
# # from math import sqrt

# # app = Flask(__name__)

# # # Load and prepare your data
# # data = pd.read_csv('spotify-2023.csv', encoding='ISO-8859-1')
# # data['streams'] = pd.to_numeric(data['streams'], errors='coerce')
# # popularity_factors = [
# #     'danceability_%', 'valence_%', 'energy_%',
# #     'acousticness_%', 'instrumentalness_%', 'liveness_%', 'speechiness_%'
# # ]
# # data['Popularity'] = data[popularity_factors].mean(axis=1)

# # # Standardize features
# # scaler = StandardScaler()
# # data[['streams', 'Popularity']] = scaler.fit_transform(data[['streams', 'Popularity']])

# # # Split data into training and testing sets
# # features = data[['streams', 'Popularity']]
# # target = data['Initial_royalty_fee']
# # X_train, X_test, y_train, y_test = train_test_split(features, target, test_size=0.2, random_state=42)

# # # Train the model
# # model = XGBRegressor(n_estimators=100, learning_rate=0.05, verbosity=1)
# # model.fit(X_train, y_train)

# # # Function to predict royalty fee for a given artist
# # def predict_royalty_for_artist(artist_name, streams):
# #     artist_data = data[data['artist(s)_name'].str.contains(artist_name, case=False, na=False)]
# #     if artist_data.empty:
# #         return None
# #     artist_popularity = artist_data[popularity_factors].mean(axis=1).mean()
# #     input_features = pd.DataFrame({'streams': [streams], 'Popularity': [artist_popularity]})
# #     scaled_input_features = scaler.transform(input_features)  # Apply scaling
# #     predicted_fee = model.predict(scaled_input_features)[0]
# #     return predicted_fee

# # # Endpoint to predict royalty fee for a given artist
# # @app.route('/predict', methods=['POST', 'GET'])
# # def predict_royalty():
# #     if request.method == 'POST':
# #         # Handle POST request with JSON body
# #         content = request.get_json()
# #         # Your existing POST request handling logic...
# #     elif request.method == 'GET':
# #         # Optionally handle GET request if needed, typically using request.args for query parameters
# #         artist_name = request.args.get('artist_name')
# #         streams = request.args.get('streams', type=int)
# #     content = request.get_json()
# #     artist_name = content.get('artist_name')
# #     streams = content.get('streams')
# #     if not artist_name or not streams:
# #         return jsonify({'error': 'Invalid input data'}), 400
    
# #     try:
# #         streams = int(streams)
# #     except ValueError:
# #         return jsonify({'error': '"streams" must be an integer'}), 400

# #     predicted_fee = predict_royalty_for_artist(artist_name, streams)
# #     if predicted_fee is not None:
# #         return jsonify({
# #             'artist': artist_name,
# #             'streams': streams,
# #             'predicted_royalty_fee': predicted_fee
# #         })
# #     else:
# #         return jsonify({'error': 'Artist not found or insufficient data'}), 404

# # # Root endpoint to display a welcome message
# # @app.route('/')
# # def index():
# #     return "Welcome to the Royalty Prediction API!"

# # if __name__ == '__main__':
# #     app.run(debug=True)from flask import Flask, request, jsonify



# """
# from flask import Flask, request, jsonify
# from flask_ngrok import run_with_ngrok
# import pandas as pd
# from sklearn.model_selection import train_test_split
# from sklearn.ensemble import RandomForestRegressor
# from sklearn.preprocessing import StandardScaler
# from sklearn.metrics import mean_squared_error
# from math import sqrt

# app = Flask(__name__)
# #run_with_ngrok(app)  # Starts ngrok when the app is run

# # Example function to load your data
# def load_data():
#     # Placeholder for your data loading logic
#     data = pd.read_csv('spotify-2023.csv')
#     return data

# # Example function to train your model
# def train_model(data):
#     # Placeholder for your model training logic
#     model = RandomForestRegressor()
#     scaler = StandardScaler()
#     # Assuming 'features' and 'target' are defined and are the columns from your dataset
#     X_train, X_test, y_train, y_test = train_test_split(data['features'], data['target'], test_size=0.2, random_state=42)
#     X_train_scaled = scaler.fit_transform(X_train)
#     model.fit(X_train_scaled, y_train)
#     return model, scaler

# # Example function to make predictions
# def predict_royalty(model, scaler, features):
#     # Placeholder for your prediction logic
#     scaled_features = scaler.transform(features)
#     prediction = model.predict(scaled_features)
#     return prediction

# @app.route('/model', methods=['POST'])
# def model_operations():
#     # Load and prepare the dataset
#     data = load_data()
    
#     # Train the model
#     model, scaler = train_model(data)
    
#     # Get prediction data from the request
#     content = request.json
#     features = content['features']
    
#     # Make prediction
#     prediction = predict_royalty(model, scaler, features)
    
#     # Return the prediction as a JSON response
#     return jsonify({'prediction': prediction.tolist()})

# if __name__ == '__main__':
#     app.run()

# """
# from flask import Flask, jsonify, request
# from flask_cors import CORS
# import pandas as pd
# import numpy as np
# from sklearn.preprocessing import MinMaxScaler
# from sklearn.metrics import mean_squared_error
# import warnings
# from sklearn.model_selection import train_test_split
# from sklearn.preprocessing import StandardScaler
# from sklearn.metrics import mean_squared_error
# from xgboost import XGBRegressor
# from math import sqrt


# app = Flask(__name__)
# CORS(app)

# def predict_royalty_for_artist(artist_name, streams):
#     warnings.filterwarnings("ignore")
#     data = pd.read_csv('spotify-2023.csv', encoding='ISO-8859-1')
#     popularity_factors = [
#         'danceability_%', 'valence_%', 'energy_%',
#         'acousticness_%', 'instrumentalness_%', 'liveness_%', 'speechiness_%'
#     ]
#     data['streams'] = pd.to_numeric(data['streams'], errors='coerce')
#     data['Popularity'] = data[popularity_factors].mean(axis=1)
#     scaler = StandardScaler()
#     data[['streams', 'Popularity']] = scaler.fit_transform(data[['streams', 'Popularity']])

#     # Split data into training and testing sets
#     features = data[['streams', 'Popularity']]
#     target = data['Initial_royalty_fee']
#     X_train, X_test, y_train, y_test = train_test_split(features, target, test_size=0.2, random_state=42)

#     # Train the model
#     model = XGBRegressor(n_estimators=100, learning_rate=0.05, verbosity=1)
#     model.fit(X_train, y_train)
    
#     artist_data = data[data['artist(s)_name'].str.contains(artist_name, case=False, na=False)]

#     if artist_data.empty:
#         return None
#     artist_popularity = artist_data[popularity_factors].mean(axis=1).mean()
#     input_features = pd.DataFrame({'streams': [streams], 'Popularity': [artist_popularity]})
#     scaled_input_features = scaler.transform(input_features)  # Apply scaling
#     predicted_fee = model.predict(scaled_input_features)[0]

#     return predicted_fee


# @app.route('/', methods=['GET'])
# def predict():
#     answer = predict_royalty_for_artist('Arijit Singh',10000)
#     response = {
#         "royalty" : [
#             {"pr":str(answer)}
#         ]

#     }
#     return jsonify(response)
    


# # @app.route('/', methods=['GET'])
# # def predict():
# #     artist_name = request.args.get('artist_name')
# #     streams = request.args.get('streams', type=int)
    
# #     if not artist_name or not streams:
# #         return jsonify({'error': 'Invalid input data'}), 400
    
# #     try:
# #         streams = int(streams)
# #     except ValueError:
# #         return jsonify({'error': '"streams" must be an integer'}), 400
    
# #     answer = predict_royalty_for_artist(artist_name, streams)
# #     if answer is not None:
# #         response = {
# #             "royalty": [
# #                 {"pr": str(answer)}
# #             ]
# #         }
# #         return jsonify(response)
# #     else:
# #         return jsonify({'error': 'Artist not found or insufficient data'}), 404


# if __name__ == '__main__':
#     app.run(debug=True)



from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

app = Flask(__name__)
CORS(app)  # This will allow CORS for all origins by default

# Load dataset
data = pd.read_csv('spotify-2023-updated2.csv')

# Split artist names into separate columns (one-hot encoding handles this properly)
data['artist(s)_name'] = data['artist(s)_name'].str.split(',')

# Create a new column with the number of artists
data['artist_count'] = data['artist(s)_name'].apply(len)

# Explode the artist(s)_name column to have one row per artist per song
data = data.explode('artist(s)_name')

# One-hot encode categorical features
categorical_features = ['artist(s)_name', 'Genre']
categorical_transformer = OneHotEncoder(handle_unknown='ignore')

# Numerical features
numerical_features = ['artist_count']

# Preprocessor
preprocessor = ColumnTransformer(
    transformers=[
        ('cat', categorical_transformer, categorical_features),
        ('num', 'passthrough', numerical_features)
    ])

# Model pipeline
model = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
])

# Define feature columns and target
X = data[['artist(s)_name', 'Genre', 'artist_count']]
y = data['streams']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train the model
model.fit(X_train, y_train)

# Predict and evaluate
y_pred = model.predict(X_test)
print('Mean Absolute Error:', mean_absolute_error(y_test, y_pred))

@app.route('/predict_streams', methods=['POST'])
def predict_streams():
    content = request.json
    artist_names = content['artist_names']
    genre = content['genre']

    # Prepare the input data
    input_data = pd.DataFrame({
        'artist(s)_name': [artist_names.split(',')],
        'Genre': [genre],
        'artist_count': [len(artist_names.split(','))]
    }).explode('artist(s)_name')

    # Predict the streams
    input_data['artist_count'] = input_data['artist_count'] * 2
    predicted_streams = model.predict(input_data)
    
    # Sum predictions for multiple artists
    total_prediction = predicted_streams.sum()

    return jsonify(predicted_streams=total_prediction)

if __name__ == '__main__':
    app.run(debug=True)
