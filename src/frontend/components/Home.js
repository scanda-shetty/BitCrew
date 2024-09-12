import React, { useState, useEffect } from "react";
import axios from 'axios';
import MusicPlayer from './MusicPlayer';
import { useMusicPlayer } from './MusicPlayerContext';
import './Home.css';

const pinataApiKey = process.env.REACT_APP_PINATA_API_KEY;
const pinataSecretApiKey = process.env.REACT_APP_PINATA_SECRET_API_KEY;

function Home() {
  const [songs, setSongs] = useState([]);
  const [likedSongsByAccount, setLikedSongsByAccount] = useState({});
  const { currentSong, setCurrentSong } = useMusicPlayer();
  const [currentAccount, setCurrentAccount] = useState('');
  const [streamedSongsByAccount, setStreamedSongsByAccount] = useState({});


  useEffect(() => {
    async function fetchAccount() {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setCurrentAccount(accounts[0]);
        } catch (error) {
          console.error("Error fetching MetaMask account:", error);
        }
      }
    }

    fetchAccount();

    // Listen for account changes
    window.ethereum.on('accountsChanged', (accounts) => {
      setCurrentAccount(accounts[0]);
    });
  }, []);

  useEffect(() => {
    if (currentAccount) {
      fetchSongsFromPinata();
      initializeLikedSongs();
      
    }
  }, [currentAccount]);

  const fetchSongsFromPinata = async () => {
    const songsIpfsHash = localStorage.getItem('songsIpfsHash');
    if (!songsIpfsHash) {
      console.error("No IPFS hash found in local storage.");
      return;
    }

    console.log('Fetching songs using IPFS hash:', songsIpfsHash);

    try {
      const metadataResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${songsIpfsHash}`);
      let metadata = metadataResponse.data;

      // Initialize userLiked state based on stored liked songs by the current MetaMask account
      metadata = metadata.map(song => ({
        ...song,
        likesCount: song.likesCount || 0,
        userLiked: likedSongsByAccount[currentAccount] ? likedSongsByAccount[currentAccount].some(s => s.id === song.id) : false
      }));

      console.log('Fetched songs metadata:', metadata);

      setSongs(metadata);
      await updateLikesOnIPFS(metadata);
    } catch (error) {
      console.error("Error fetching songs from Pinata:", error);
    }
  };

  const updateLikesOnIPFS = async (updatedSongs) => {
    try {
      const updatedMetadataResponse = await axios.post(`https://api.pinata.cloud/pinning/pinJSONToIPFS`, updatedSongs, {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretApiKey,
        },
      });
      console.log("Updated metadata on IPFS:", updatedMetadataResponse.data);

      localStorage.setItem('songsIpfsHash', updatedMetadataResponse.data.IpfsHash);
    } catch (error) {
      console.error("Error updating likes count on IPFS:", error);
    }
  };

  const playSong = async (song) => {
    try {
      const updatedSongs = songs.map(s => {
        if (s.id === song.id) {
          const newListenCount = s.listenCount + 1;
          updateListenCountInStorage(song.id, newListenCount);
          return { ...s, listenCount: newListenCount };
        }
        return s;
      });
      setSongs(updatedSongs);
      await updateListenCountOnIPFS(song.id, song.listenCount + 1);

      updateStreamedSongs(song);
    } catch (error) {
      console.error("Error updating listen count:", error);
    }
    setCurrentSong(song);
  };
  const updateStreamedSongs = async (song) => {
    const updatedStreamedSongs = { ...streamedSongsByAccount };
  
    if (!updatedStreamedSongs[currentAccount]) {
      updatedStreamedSongs[currentAccount] = [];
    }
  
    // Add the streamed song if not already present
    if (!updatedStreamedSongs[currentAccount].find(s => s.id === song.id)) {
      updatedStreamedSongs[currentAccount].push(song);
    }
  
    setStreamedSongsByAccount(updatedStreamedSongs);
    localStorage.setItem('streamedSongs', JSON.stringify(updatedStreamedSongs));
  
    // Update user data on IPFS with the new streamed songs
    const userData = {
      userId: currentAccount,
      preferences: getStoredPreferences(), // Include other preferences if needed
      songsLiked: likedSongsByAccount[currentAccount] || [],
      songsStreamed: updatedStreamedSongs[currentAccount] || []
    };
  
    // Update user data on IPFS
    await updateUserDataOnIPFS(userData);
  };
  
  const updateListenCountOnIPFS = async (songId, listenCount) => {
    try {
      const songsIpfsHash = localStorage.getItem('songsIpfsHash');
      const metadataResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${songsIpfsHash}`);
      let metadata = metadataResponse.data;

      metadata = metadata.map(song => {
        if (song.id === songId) {
          return { ...song, listenCount };
        }
        return song;
      });

      console.log('Updated metadata:', metadata);

      const updatedMetadataResponse = await axios.post(`https://api.pinata.cloud/pinning/pinJSONToIPFS`, metadata, {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretApiKey,
        },
      });
      console.log("Updated metadata on IPFS:", updatedMetadataResponse.data);

      localStorage.setItem('songsIpfsHash', updatedMetadataResponse.data.IpfsHash);
      setSongs(metadata);
    } catch (error) {
      console.error("Error updating listen count on IPFS:", error);
    }
  };

  const getListenCountFromStorage = (songId) => {
    const listenCountStr = localStorage.getItem(`listenCount_${songId}`);
    return listenCountStr ? parseInt(listenCountStr) : 0;
  };

  const updateListenCountInStorage = (songId, listenCount) => {
    localStorage.setItem(`listenCount_${songId}`, listenCount.toString());
  };

  const initializeLikedSongs = () => {
    // Initialize likedSongsByAccount from localStorage if available
    const storedLikedSongs = localStorage.getItem('likedSongs');
    if (storedLikedSongs) {
      setLikedSongsByAccount(JSON.parse(storedLikedSongs));
      updateSongsWithLikes();
    }
  };

  const updateSongsWithLikes = () => {
    setSongs(prevSongs =>
      prevSongs.map(song => ({
        ...song,
        userLiked: likedSongsByAccount[currentAccount] ? likedSongsByAccount[currentAccount].some(s => s.id === song.id) : false
      }))
    );
  };

  const updateLikedSongs = async (song, userLiked) => {
    const updatedLikedSongs = { ...likedSongsByAccount };

    if (!updatedLikedSongs[currentAccount]) {
      updatedLikedSongs[currentAccount] = [];
    }

    if (userLiked && !updatedLikedSongs[currentAccount].find(s => s.id === song.id)) {
      updatedLikedSongs[currentAccount].push(song);
    } else if (!userLiked) {
      updatedLikedSongs[currentAccount] = updatedLikedSongs[currentAccount].filter(s => s.id !== song.id);
    }

    setLikedSongsByAccount(updatedLikedSongs);
    localStorage.setItem('likedSongs', JSON.stringify(updatedLikedSongs));
    updateSongsWithLikes(); // Update the songs with the new liked status

    // Update user data on IPFS with the new liked songs
    const userData = {
      userId: currentAccount,
      preferences: getStoredPreferences(), // Include other preferences if needed
      songsLiked: updatedLikedSongs[currentAccount] || [],
     
    };

    // Update user data on IPFS
    await updateUserDataOnIPFS(userData);
  };

  const getStoredPreferences = () => {
    const storedPreferences = localStorage.getItem(`${currentAccount}_preferencesData`);
    return storedPreferences ? JSON.parse(storedPreferences) : {};
  };

  const likeSong = async (songId) => {
    try {
      const songToLike = songs.find(song => song.id === songId);
      if (!songToLike) {
        console.error(`Song with ID ${songId} not found.`);
        return;
      }

      const userLiked = !likedSongsByAccount[currentAccount] || !likedSongsByAccount[currentAccount].find(s => s.id === songId);

      const updatedSongs = songs.map(song => {
        if (song.id === songId) {
          return {
            ...song,
            likesCount: userLiked ? song.likesCount + 1 : song.likesCount - 1,
            userLiked: userLiked
          };
        }
        return song;
      });

      setSongs(updatedSongs);
      updateLikedSongs(songToLike, userLiked);
      await updateLikesOnIPFS(updatedSongs);
    } catch (error) {
      console.error("Error updating like count:", error);
    }
  };

  const resetLikes = async () => {
    try {
      // Step 1: Reset likedSongsByAccount state and localStorage
      setLikedSongsByAccount({});
      localStorage.removeItem('likedSongs');

      // Step 2: Update songs metadata on IPFS with reset likes count
      const resetSongs = songs.map(song => ({
        ...song,
        likesCount: 0,
      }));

      setSongs(resetSongs);
      await updateLikesOnIPFS(resetSongs);
    } catch (error) {
      console.error("Error resetting likes:", error);
    }
  };

 // Example of how to manage user data with multiple users in a structured way

const updateUserDataOnIPFS = async (updatedUserData) => {
  try {
      let usersData = []; // Initialize with an empty array to hold users

      // Fetch existing users data from localStorage or IPFS
      const usersIpfsHash = localStorage.getItem('usersIpfsHash');
      if (usersIpfsHash) {
          const existingUsersResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${usersIpfsHash}`);
          usersData = existingUsersResponse.data.users || []; // Ensure to get the users array
      }

      // Find index of existing user data, if it exists
      const existingUserIndex = usersData.findIndex(user => user.userId === updatedUserData.userId);

      // Prepare simplified song data for storage (only include necessary details)
      const simplifiedSongsLiked = updatedUserData.songsLiked.map(song => ({
          id: song.id,
          songName: song.songName,
          artistName: song.artistName,
          thumbnail: song.thumbnail,
          audio :song.audio,
          genre: song.genre || "easy listening",
          language: song.language || "English"
      }));

      const simplifiedSongsStreamed = updatedUserData.songsStreamed.map(song => ({
        id: song.id,
        songName: song.songName,
        artistName: song.artistName,
        thumbnail: song.thumbnail,
        audio: song.audio,
        genre: song.genre || "easy listening",
        language: song.language || "English"
      }));

      // Update user data for IPFS
      const userDataForIPFS = {
          userId: updatedUserData.userId,
          preferences: updatedUserData.preferences,
          songsLiked: simplifiedSongsLiked,
          songsStreamed: simplifiedSongsStreamed
      };

      if (existingUserIndex !== -1) {
          // Update existing user data
          usersData[existingUserIndex] = userDataForIPFS;
      } else {
          // Add new user data if user does not exist (this should typically not happen unless managing new users)
          usersData.push(userDataForIPFS);
      }

      // Prepare data object to be saved on IPFS
      const dataToSave = { users: usersData };

      // Post updated data to IPFS
      const updatedUsersResponse = await axios.post(`https://api.pinata.cloud/pinning/pinJSONToIPFS`, dataToSave, {
          headers: {
              'Content-Type': 'application/json',
              'pinata_api_key': pinataApiKey,
              'pinata_secret_api_key': pinataSecretApiKey,
          },
      });

      // Update localStorage with new IPFS hash
      localStorage.setItem('usersIpfsHash', updatedUsersResponse.data.IpfsHash);

      console.log("Updated user data on IPFS:", updatedUsersResponse.data);
  } catch (error) {
      console.error("Error updating user data on IPFS:", error);
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
              <p className="song-listen-count">Listens: {song.listenCount}</p>
              <p className="song-likes-count">Likes: {song.likesCount}</p>
            </div>
            <button onClick={() => likeSong(song.id)}>
              {likedSongsByAccount[currentAccount] && likedSongsByAccount[currentAccount].find(s => s.id === song.id) ? 'Unlike' : 'Like'}
            </button>
            <button onClick={() => playSong(song)}>Play</button>
          </div>
        ))}
      </div>
      <br />
      <br />
      <br />
      <br />
      <div>
        <h2>Now Playing..</h2>
        {currentSong && <MusicPlayer song={currentSong} />}
      </div>
    </div>
  );
}

export default Home;
