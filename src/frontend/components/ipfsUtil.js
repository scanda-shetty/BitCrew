export async function fetchDataFromIPFS(hash) {
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${hash}`);
    return await response.json();
}

export async function getAllData() {
    const userHash = localStorage.getItem('userDataHash');
    const songsHash = localStorage.getItem('songsDataHash');

    const [userData, songData] = await Promise.all([
        fetchDataFromIPFS(userHash),
        fetchDataFromIPFS(songsHash)
    ]);

    return {
        users: userData.users,
        songs: preprocessSongs(songData)
    };
}

function preprocessSongs(songs) {
    return songs.map(song => ({
        ...song,
        genre: song.genre || 'easy listening',
        language: song.language || 'English',
        combined_features: `${song.genre} ${song.language} ${song.artistName}`
    }));
}
