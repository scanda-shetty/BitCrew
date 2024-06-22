import React, { useState, useEffect } from "react";
import './Music.css';
import axios from 'axios';

function Main() {
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    fetchSongsFromPinata();
  }, []);

  const fetchSongsFromPinata = async () => {
    try {
      // Fetch metadata from the URI
      const metadataResponse = await axios.get('https://gateway.pinata.cloud/ipfs/QmPoQf2PgZVEYJXUM1ZLKQKZG8eXnPM1hkCZPJhysD2w5M');
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
  
  console.log(songs)
  const playSong = (songUrl) => {
    // Implement logic to play the song
    console.log("Playing song:", songUrl);
  };

  return (
    <div className="App">
      <>
        <h1>Welcome to Spotify</h1>
        <h2>Trending now,</h2>
        <div className="">
  <section id="">
    {songs.map((song, index) => (
      <div className="" key={index}>
        <img src={song.thumbnailUrl} height="192px" width="341px" alt="Thumbnail" />
        <p>{song.title}</p>
        <p>{song.artist}</p>
        <p>{song.album}</p>
        <button onClick={() => playSong(song.url)}>Play</button>
      </div>
    ))}
  </section>
</div>

        <h2>Recommended for today,</h2>
        <div className="">
          {/* Render recommended songs */}
        </div>
        <h2>Uniquely yours,</h2>
      </>
    </div>
  );
}

export default Main;
