import pandas as pd
import os

# Get the current directory of the script
current_directory = os.path.dirname(__file__)

# Concatenate the directory path and the file name
file_path = os.path.join(current_directory, 'spotify-2023.csv')

# Load the dataset from the CSV file
data = pd.read_csv(file_path, encoding='latin1')

# Initialize a dictionary to store the collaborators for each artist
artist_collaborations = {}

# Iterate over each row in the data
for index, row in data.iterrows():
    # Split the artist names by comma and strip any whitespace
    artists = [artist.strip() for artist in row['artist(s)_name'].split(',')]
    
    # Create pairs of collaborators and update the dictionary
    for i in range(len(artists)):
        if artists[i] not in artist_collaborations:
            artist_collaborations[artists[i]] = set()
        for j in range(len(artists)):
            if i != j:
                artist_collaborations[artists[i]].add(artists[j])

# Convert the dictionary to a DataFrame
collaborations_list = []
for artist, collaborators in artist_collaborations.items():
    collaborations_list.append({
        'artist': artist,
        'collaborators': ', '.join(collaborators) if collaborators else ''
    })

collaborations_df = pd.DataFrame(collaborations_list)

# Save the DataFrame to a CSV file
output_file = 'artist_collaborations.csv'
output_directory = os.path.dirname(file_path)

# Construct the output file path
output_file_path = os.path.join(output_directory, output_file)
collaborations_df.to_csv(output_file_path, index=False)

print(f'Collaborations saved to {output_file_path}')
