from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize
import cohere
import numpy as np
from sklearn.metrics import precision_score, recall_score

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

# Function to get ground truth from user's liked and streamed songs
def get_user_liked_and_streamed_songs(user_data):
    liked_songs_ids = {song['id'] for song in user_data.get("songsLiked", [])}
    streamed_songs_ids = {song['id'] for song in user_data.get("songsStreamed", [])}
    
    # Combine liked and streamed songs to form the ground truth
    ground_truth_ids = liked_songs_ids.union(streamed_songs_ids)
    return ground_truth_ids

# Function to get recommended song IDs
def get_recommended_song_ids(recommended_songs):
    return {song['id'] for song in recommended_songs}

# Function to calculate precision, recall, and F1-score
def calculate_accuracy(user_data, recommended_songs):
    ground_truth_ids = get_user_liked_and_streamed_songs(user_data)
    recommended_song_ids = get_recommended_song_ids(recommended_songs)

    if not ground_truth_ids:
        return {"precision": None, "recall": None, "f1": None, "message": "No ground truth available for this user."}
    
    # Convert to binary form: 1 if song was liked/streamed, 0 if not
    y_true = [1 if song_id in ground_truth_ids else 0 for song_id in recommended_song_ids]
    y_pred = [1] * len(recommended_song_ids)  # All recommended songs are treated as 1

    # Calculate precision and recall
    precision = precision_score(y_true, y_pred)
    recall = recall_score(y_true, y_pred)
    f1 = 2 * (precision * recall) / (precision + recall) if precision + recall > 0 else 0
    correct_predictions = sum([1 for true, pred in zip(y_true, y_pred) if true == pred])
    accuracy = correct_predictions / len(y_true)

    return {
        "precision": precision,
        "recall": recall,
        "f1": f1,
        'accuracy': accuracy
    }


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
    recommended_indices = combined_similarities.argsort()[-10:][::-1]  # Top 5 recommended songs
    print("\nRecommended indices:")
    print(recommended_indices)
    
    recommended_songs = [songs_data[i] for i in recommended_indices]
    print("\nRecommended songs:")
    print(recommended_songs)
    
     # Calculate accuracy metrics (precision, recall, F1-score)
    accuracy_metrics = calculate_accuracy(current_user_data, recommended_songs)
    print("\nAccuracy metrics:")
    print(accuracy_metrics)

    return jsonify({"recommendedSongs": recommended_songs,"accuracyMetrics": accuracy_metrics})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
