// Cosine similarity function
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, value, index) => sum + value * vecB[index], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, value) => sum + value * value, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, value) => sum + value * value, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

// Convert a string to a vector based on word occurrence
function textToVector(text, vocab) {
    return vocab.map(word => (text.includes(word) ? 1 : 0));
}

export function trainModel(songs) {
    const vocab = Array.from(new Set(songs.flatMap(song => song.combined_features.split(' '))));

    const songFeaturesMatrix = songs.map(song => textToVector(song.combined_features, vocab));

    return { vocab, songFeaturesMatrix };
}

export function getRecommendationsForUser(user, model, songs) {
    const userProfile = createUserProfileVector(user);

    const userProfileVector = textToVector(userProfile, model.vocab);

    const similarityScores = model.songFeaturesMatrix.map(songVector => cosineSimilarity(userProfileVector, songVector));

    const sortedIndexes = similarityScores
        .map((score, index) => ({ score, index }))
        .sort((a, b) => b.score - a.score)
        .map(item => item.index);

    return sortedIndexes.slice(0, 10).map(index => songs[index]);  // Top 10 recommendations
}

function createUserProfileVector(user) {
    const preferences = user.preferences || {
        favoriteGenres: ['easy listening'],
        languages: ['English'],
        favoriteArtist: 'Unknown'
    };

    return `${preferences.favoriteGenres.join(' ')} ${preferences.languages.join(' ')} ${preferences.favoriteArtist}`;
}