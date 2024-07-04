
import React, { useState, useEffect } from "react";
import './Home.css';
import axios from 'axios';
import MusicPlayer from './MusicPlayer';  // Import the MusicPlayer component

function Home() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);

  useEffect(() => {
    fetchSongsFromPinata();
  }, []);

  const fetchSongsFromPinata = async () => {
    try {
      // Fetch metadata from the URI
      const metadataResponse = await axios.get('https://gateway.pinata.cloud/ipfs/QmX9VFuzStNSt4hYJa8obb1PPg29qYzq8N6UwPAxLzdRV9');
      const metadata = metadataResponse.data;
      // Check if metadata is an object
      if (typeof metadata !== 'object' || metadata === null) {
        console.error("Metadata is not in the expected format.");
        return;
      }
  
      // Convert object values to an array
      const songsArray = Object.values(metadata);
      // Update state with fetched songs
      setSongs(songsArray);
    } catch (error) {
      console.error("Error fetching songs from Pinata:", error);
    }
  };

  const playSong = (song) => {
    console.log("Playing song:", song.audio);
    setCurrentSong(song);
  };

  return (
    <div className="App">
      <h1>Welcome to Spotify</h1>
      <h2>Trending now,</h2>
      <div className="song-list">
        {songs.map((song, index) => (
          <div className="song-card" key={index}>
            <img src={song.thumbnail} alt="Thumbnail" className="song-thumbnail" />
            <div className="song-info">
              <p className="song-title">{song.songName}</p>
              <p className="song-artist">{song.artistName}</p>
            </div>
            <button onClick={() => playSong(song)}>Play</button>
          </div>
        ))}
      </div>
      <h2>Recommended for today,</h2>
      <div className="song-list">
        {/* Render recommended songs */}
      </div>
      <h2>Uniquely yours,</h2>
      {currentSong && <MusicPlayer song={currentSong} />}
    </div>
  );
}

export default Home;
