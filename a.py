import os
import requests
import pandas as pd
from urllib.parse import urlencode, urlparse, parse_qs
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler

# Spotify API credentials
CLIENT_ID = '2040077f83334d4bbb3336027695e473'
CLIENT_SECRET = 'a0e51c0474984778a7978c4e548e0d69'
REDIRECT_URI = 'http://localhost:8888/callback'
AUTH_URL = 'https://accounts.spotify.com/api/token'
AUTHORIZATION_URL = 'https://accounts.spotify.com/authorize'
FOLLOWING_URL = 'https://api.spotify.com/v1/me/following?type=artist'

#
# Function to fetch access token using client credentials flow
def get_access_token():
    response = requests.post(
        AUTH_URL,
        data={
            'grant_type': 'client_credentials',
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
        },
    )
    response_data = response.json()
    return response_data['access_token']

# Function to fetch follower count for a specific artist name
def get_artist_follower_count(artist_name, token):
    search_url = 'https://api.spotify.com/v1/search'
    params = {
        'q': artist_name,
        'type': 'artist',
        'limit': 1
    }
    headers = {
        'Authorization': f'Bearer {token}',
    }
    response = requests.get(search_url, params=params, headers=headers)
    if response.status_code != 200:
        return 0
    data = response.json()
    if data['artists']['items']:
        artist_id = data['artists']['items'][0]['id']
        return get_follower_count(token, artist_id)
    else:
        return 0  # Artist not found on Spotify

# Function to fetch follower count for a specific artist ID
def get_follower_count(token, artist_id):
    artist_url = f'https://api.spotify.com/v1/artists/{artist_id}'
    headers = {
        'Authorization': f'Bearer {token}',
    }
    response = requests.get(artist_url, headers=headers)
    if response.status_code != 200:
        return 0
    return response.json()['followers']['total']

# Function to update CSV with follower counts
def update_csv_with_followers():
    # Load CSV file
    current_directory = os.path.dirname(__file__)  # Replace with your script's directory if needed
    file_path = os.path.join(current_directory, 'artist_collaborations.csv')
    data = pd.read_csv(file_path, encoding='latin1')
    
    # Get access token
    token = get_access_token()
    
    # Fetch follower counts for each artist
    data['followers'] = data['artist'].apply(lambda x: get_artist_follower_count(x, token))
    
    # Save updated CSV
    output_file = 'artist_collaborations_with_followers.csv'
    output_file_path = os.path.join(current_directory, output_file)
    data.to_csv(output_file_path, index=False)
    
    print(f'Updated CSV with follower counts saved to {output_file_path}')

update_csv_with_followers()