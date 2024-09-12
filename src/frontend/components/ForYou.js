import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MusicPlayer from './MusicPlayer';
import './ForYou.css'; // Optional CSS styling for the ForYou page
import { useMusicPlayer } from './MusicPlayerContext';

const ForYou = () => {
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  const {currentSong, setCurrentSong} = useMusicPlayer(); // Context function to handle song playback
  const [currentAccount, setCurrentAccount] = useState('');
  const [likedSongs, setLikedSongs] = useState([]);

  useEffect(() => {
    fetchRecommendedSongs();
    fetchLikedSongs();
    getAccount(); // Fetch current MetaMask account
  }, []);

  const fetchRecommendedSongs = async () => {
    const existingIpfsHash = localStorage.getItem('songsIpfsHash');
    if (!existingIpfsHash) {
      console.log('No existing IPFS hash found in local storage.');
      return;
    }

    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${existingIpfsHash}`);
      if (response.data) {
        console.log('Fetched Songs:', response.data);
        setRecommendedSongs(response.data);
      }
    } catch (error) {
      console.error('Error fetching recommended songs:', error);
    }
  };

  const fetchLikedSongs = () => {
    const storedLikedSongs = localStorage.getItem('likedSongs');
    setLikedSongs(storedLikedSongs ? JSON.parse(storedLikedSongs) : []);
  };

  const getAccount = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error('Error fetching MetaMask account:', error);
    }
  };

  const handlePlaySong = async (song) => {
    setCurrentSong(song); // This function should handle the actual song playback
  
    // Fetch and parse streamedSongs from localStorage
    let storedStreamedSongs = JSON.parse(localStorage.getItem('streamedSongs')) || [];
  
    // Check if storedStreamedSongs is an object, and convert to an array if necessary
    if (typeof storedStreamedSongs === 'object' && !Array.isArray(storedStreamedSongs)) {
      // Convert object keys to an array
      storedStreamedSongs = Object.keys(storedStreamedSongs);
    }
  
    if (!Array.isArray(storedStreamedSongs)) {
      console.error('Stored streamed songs are not an array:', storedStreamedSongs);
      return;
    }
  
    // Update streamedSongs
    if (!storedStreamedSongs.includes(song.id)) {
      const updatedStreamedSongs = [...storedStreamedSongs, song.id];
      localStorage.setItem('streamedSongs', JSON.stringify(updatedStreamedSongs));
      await updateUserDataOnIPFS('streamedSongs', updatedStreamedSongs);
    }
  };
  

  const handleLikeSong = async (song) => {
    let updatedLikedSongs = Array.isArray(likedSongs) ? [...likedSongs] : [];

    if (updatedLikedSongs.includes(song.id)) {
      updatedLikedSongs = updatedLikedSongs.filter((likedSongId) => likedSongId !== song.id);
    } else {
      updatedLikedSongs.push(song.id);
    }

    setLikedSongs(updatedLikedSongs);
    localStorage.setItem('likedSongs', JSON.stringify(updatedLikedSongs));
    await updateUserDataOnIPFS('likedSongs', updatedLikedSongs);
  };

  const updateUserDataOnIPFS = async (key, updatedData) => {
    try {
      let usersData = [];
      const usersIpfsHash = localStorage.getItem('usersIpfsHash');
      if (usersIpfsHash) {
        const existingUsersResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${usersIpfsHash}`);
        usersData = existingUsersResponse.data.users || [];
      }

      const userIndex = usersData.findIndex(user => user.userId === currentAccount);
      if (userIndex !== -1) {
        usersData[userIndex][key] = updatedData;
      } else {
        const newUser = { userId: currentAccount, [key]: updatedData };
        usersData.push(newUser);
      }

      const response = await axios.post(`https://api.pinata.cloud/pinning/pinJSONToIPFS`, { users: usersData }, {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY,
          'pinata_secret_api_key': process.env.REACT_APP_PINATA_SECRET_API_KEY,
        },
      });

      localStorage.setItem('usersIpfsHash', response.data.IpfsHash);
    } catch (error) {
      console.error('Error updating user data on IPFS:', error);
    }
  };

  return (
    <div className="foryou-container">
      <h1>Recommended For You</h1>
      {recommendedSongs.length === 0 ? (
        <p>No songs found based on your preferences.</p>
      ) : (
        <div className="songs-list">
          {recommendedSongs.map((song) => (
            <div key={song.id} className="song-card">
              <img src={song.thumbnail} alt={song.songName} />
              <h3>{song.songName}</h3>
              <p>{song.artistName}</p>
              <button onClick={() => handlePlaySong(song)}>Play</button>
              <button onClick={() => handleLikeSong(song)}>
                {Array.isArray(likedSongs) && likedSongs.includes(song.id) ? 'Unlike' : 'Like'}
              </button>
            </div>
          ))}
        </div>
      )}

        <div>
        <h2>Now Playing..</h2>
        {currentSong && <MusicPlayer song={currentSong} />}
      </div>
    </div>
  );
};

export default ForYou;
