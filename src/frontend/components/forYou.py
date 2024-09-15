from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize
import cohere
import numpy as np

app = Flask(__name__)
CORS(app)

# Initialize Cohere API
co = cohere.Client('gG9qYCZdnaVj8TVOocTgPKTisD6tO5QxWoPmh3rR')  # Replace with your Cohere API key

# Function to generate embeddings via Cohere API
def get_cohere_embeddings(texts):
    response = co.embed(texts=texts, model="large")
    return response.embeddings

# Get combined user profile based on preferences, liked songs, and streamed songs
def get_combined_user_profile(user_data):
    # Debug print to check structure of user_data
    print("\nUser data received:")
    print(user_data)
    
    try:
        preferences_vector = ' '.join(
            user_data.get("preferences", {}).get("favoriteGenres", []) +
            user_data.get("preferences", {}).get("languages", []) +
            user_data.get("preferences", {}).get("favoriteArtist", "").split(',')
        )
    except KeyError as e:
        print(f"\nKeyError: {e}")
        preferences_vector = ''
    
    liked_songs_vector = ' '.join([
        f"{song.get('genre', 'Unknown genre')} {song['artistName']} {song.get('language', 'Unknown language')}"
        for song in user_data.get("songsLiked", [])
    ])
    
    streamed_songs_vector = ' '.join([
        f"{song.get('genre', 'Unknown genre')} {song['artistName']} {song.get('language', 'Unknown language')}"
        for song in user_data.get("songsStreamed", [])
    ])

    combined_profile = preferences_vector + " " + liked_songs_vector + " " + streamed_songs_vector
    print("\nCombined user profile:")
    print(combined_profile)
    return combined_profile

@app.route('/api/recommend', methods=['POST'])
def recommend_songs():
    # Get the incoming data from the request
    data = request.get_json()
    print("\nIncoming request data:")
    print(data)
    
    # Extract the userId and the userData, which contains the users array
    user_id = data.get('userId')
    user_data = data.get('userData', {})
    users = user_data.get('users', [])
    songs_data = data.get('songsData', [])
    
    # Check if users is a list and user_id exists
    if not users or not user_id:
        return jsonify({"error": "Invalid data"}), 400
    
    # Find the current user's data in the users array
    current_user_data = next((user for user in users if user["userId"] == user_id), None)
    print("\nCurrent user data:")
    print(current_user_data)
    
    if not current_user_data:
        return jsonify({"error": "User not found"}), 404
    
    # User's combined profile
    user_profile = get_combined_user_profile(current_user_data)
    
    # Generate embeddings for user profile and songs using Cohere API
    song_data = [f"{song.get('genre', 'Unknown genre')} {song['artistName']} {song.get('language', 'Unknown language')}" for song in songs_data]
    song_data.append(user_profile)  # Add user profile as the last element
    
    print("\nSong data for embedding:")
    print(song_data)
    
    cohere_embeddings = get_cohere_embeddings(song_data)
    print("\nCohere embeddings:")
    print(cohere_embeddings)
    
    # Separate song embeddings and user profile embedding
    song_vectors = np.array(cohere_embeddings[:-1])
    user_profile_vector = np.array(cohere_embeddings[-1]).reshape(1, -1)
    
    # Normalize vectors
    song_vectors = normalize(song_vectors)
    user_profile_vector = normalize(user_profile_vector)
    
    # Calculate cosine similarity between user profile and songs
    cohere_similarities = cosine_similarity(user_profile_vector, song_vectors).flatten()
    print("\nCohere similarities:")
    print(cohere_similarities)
    
    # Now using TF-IDF as an additional feature extraction method
    tfidf_vectorizer = TfidfVectorizer()
    tfidf_matrix = tfidf_vectorizer.fit_transform(song_data)
    
    print("\nTF-IDF matrix:")
    print(tfidf_matrix.toarray())
    
    # Separate TF-IDF vectors for songs and user profile
    user_vector_tfidf = tfidf_matrix[-1]
    song_vectors_tfidf = tfidf_matrix[:-1]
    
    # Calculate cosine similarity for TF-IDF
    cosine_similarities_tfidf = cosine_similarity(user_vector_tfidf, song_vectors_tfidf).flatten()
    print("\nTF-IDF similarities:")
    print(cosine_similarities_tfidf)
    
    # Combine both Cohere and TF-IDF similarity scores
    combined_similarities = (cohere_similarities + cosine_similarities_tfidf) / 2
    print("\nCombined similarities:")
    print(combined_similarities)
    
    # Get all recommended songs based on combined similarity score
    recommended_indices = combined_similarities.argsort()[-5:][::-1]  # Top 5 recommended songs
    print("\nRecommended indices:")
    print(recommended_indices)
    
    recommended_songs = [songs_data[i] for i in recommended_indices]
    print("\nRecommended songs:")
    print(recommended_songs)

    return jsonify({"recommendedSongs": recommended_songs})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
