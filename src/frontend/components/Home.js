import React, { useState, useEffect } from "react";
import './Home.css';
import axios from 'axios';
import MusicPlayer from './MusicPlayer';

function Home() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);

  useEffect(() => {
    fetchSongsFromPinata();
  }, []);

  const fetchSongsFromPinata = async () => {
    const songsIpfsHash = localStorage.getItem('songsIpfsHash');
    if (!songsIpfsHash) {
      console.error("No IPFS hash found in local storage.");
      return;
    }

    console.log('Fetching songs using IPFS hash:', songsIpfsHash);

    try {
      // Fetch metadata from the URI
      const metadataResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${songsIpfsHash}`);
      const metadata = metadataResponse.data;
      
      // Check if metadata is an array
      if (!Array.isArray(metadata)) {
        console.error("Metadata is not in the expected format.");
        return;
      }

      console.log('Fetched songs metadata:', metadata);

      // Initialize listenCount for each song from localStorage
      const songsWithListenCount = metadata.map(song => ({
        ...song,
        listenCount: getListenCountFromStorage(song.id) // Get listenCount from local storage or initialize
      }));

      // Update state with fetched songs including listenCount
      setSongs(songsWithListenCount);
    } catch (error) {
      console.error("Error fetching songs from Pinata:", error);
    }
  };

  const playSong = async (song) => {
    try {
      // Update listenCount locally and in UI
      const updatedSongs = songs.map(s => {
        if (s.id === song.id) {
          const newListenCount = s.listenCount + 1;
          updateListenCountInStorage(song.id, newListenCount); // Update listenCount in local storage
          return {
            ...s,
            listenCount: newListenCount
          };
        }
        return s;
      });
      setSongs(updatedSongs);

      // Update listenCount on IPFS
      await updateListenCountOnIPFS(song.id, song.listenCount + 1);
    } catch (error) {
      console.error("Error updating listen count:", error);
    }

    setCurrentSong(song);
  };

  const getListenCountFromStorage = (songId) => {
    const listenCountStr = localStorage.getItem(`listenCount_${songId}`);
    return listenCountStr ? parseInt(listenCountStr) : 0;
  };

  const updateListenCountInStorage = (songId, listenCount) => {
    localStorage.setItem(`listenCount_${songId}`, listenCount.toString());
  };

  const updateListenCountOnIPFS = async (songId, listenCount) => {
    try {
      // Fetch current metadata from IPFS
      const songsIpfsHash = localStorage.getItem('songsIpfsHash');
      const metadataResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${songsIpfsHash}`);
      let metadata = metadataResponse.data;

      // Update listenCount for the song in metadata
      metadata = metadata.map(song => {
        if (song.id === songId) {
          return {
            ...song,
            listenCount: listenCount
          };
        }
        return song;
      });

      // Update metadata on IPFS
      const updatedMetadataResponse = await axios.put(`https://gateway.pinata.cloud/ipfs/${songsIpfsHash}`, metadata);
      console.log("Updated metadata on IPFS:", updatedMetadataResponse.data);

      // Optional: Update local state with updated metadata
      setSongs(metadata);
    } catch (error) {
      console.error("Error updating listen count on IPFS:", error);
    }
  };

  return (
    <div className="App">
      <h1>Welcome to Swar</h1>
      <h2>Trending now,</h2>
      <div className="song-list">
        {songs.map((song, index) => (
          <div className="song-card" key={index}>
            <img src={song.thumbnail} alt="Thumbnail" className="song-thumbnail" />
            <div className="song-info">
              <p className="song-title">{song.songName}</p>
              <p className="song-artist">{song.artistName}</p>
              <p className="song-listen-count">Listens: {song.listenCount}</p> {/* Display listener count */}
            </div>
            <button onClick={() => playSong(song)}>Play</button>
          </div>
        ))}
      </div>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <div>
        <h2>Now Playing..</h2>
        {currentSong && <MusicPlayer song={currentSong} />}
      </div>
    </div>
  );
}

export default Home;
