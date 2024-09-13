from flask import Flask, request, jsonify
import joblib
import pandas as pd
import numpy as np

app = Flask(__name__)

# Load the model and data
cosine_sim = joblib.load('cosine_similarity_matrix.pkl')
df_songs = joblib.load('songs_data.pkl')
vectorizer = joblib.load('tfidf_vectorizer.pkl')

@app.route('/recommendations', methods=['POST'])
def recommend():
    user_preferences = request.json
    # Extract user preferences
    favorite_genres = user_preferences.get('favoriteGenres', [])
    favorite_artists = user_preferences.get('favoriteArtist', '').split(',')
    favorite_languages = user_preferences.get('languages', [])

    # Create a query string for the user's preferences
    user_profile = ' '.join(favorite_genres + favorite_artists + favorite_languages)
    user_profile_vector = vectorizer.transform([user_profile])

    # Compute similarity with the songs
    sim_scores = cosine_similarity(user_profile_vector, vectorizer.transform(df_songs['genre'] + ' ' + df_songs['artistName'] + ' ' + df_songs['language']))
    sim_scores = sim_scores.flatten()

    # Get the indices of the most similar songs
    indices = np.argsort(sim_scores)[::-1]

    # Return the top N recommendations
    top_indices = indices[:10]
    recommended_songs = df_songs.iloc[top_indices].to_dict(orient='records')

    return jsonify(recommended_songs)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
