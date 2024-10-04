import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MusicPlayer from './MusicPlayer';
import LoadingSpinner from './LoadingSpinner'; // Import the spinner component
import './ForYou.css';
import { useMusicPlayer } from './MusicPlayerContext';

const pinataApiKey = process.env.REACT_APP_PINATA_API_KEY;
const pinataSecretApiKey = process.env.REACT_APP_PINATA_SECRET_API_KEY;

const Recommendation = () => {
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  const [userId, setUserId] = useState('');
  const [songsData, setSongsData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [likedSongs, setLikedSongs] = useState({});
  const [streamedSongsByAccount, setStreamedSongsByAccount] = useState({});
  const [loading, setLoading] = useState(true); // Add loading state
  const { currentSong, setCurrentSong } = useMusicPlayer();

  // // Load liked songs and streamed songs from localStorage
  useEffect(() => {
    const getLikedSongs = () => {
      const storedLikedSongs = localStorage.getItem('likedSongs');
      return storedLikedSongs ? JSON.parse(storedLikedSongs) : {};
    };

    const getStreamedSongs = () => {
      const storedStreamedSongs = localStorage.getItem('streamedSongs');
      return storedStreamedSongs ? JSON.parse(storedStreamedSongs) : {};
    };

    setLikedSongs(getLikedSongs());
    setStreamedSongsByAccount(getStreamedSongs());
  }, []);
  useEffect(() => {
    const fetchUserAccount = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const currentUserAccount = accounts[0];  // Get the current account
          setUserId(currentUserAccount);
        } catch (error) {
          console.error('Error fetching user account:', error);
        }
      } else {
        console.error('MetaMask is not installed');
      }
    };

    fetchUserAccount();

    // Event listener for account changes
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setUserId(accounts[0]);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Start loading
      const songsIpfsHash = localStorage.getItem('songsIpfsHash');
      const userIpfsHash = localStorage.getItem('usersIpfsHash');

      if (songsIpfsHash && userIpfsHash) {
        try {
          const [songsResponse, userResponse] = await Promise.all([
            axios.get(`https://gateway.pinata.cloud/ipfs/${songsIpfsHash}`),
            axios.get(`https://gateway.pinata.cloud/ipfs/${userIpfsHash}`)
          ]);

          setSongsData(songsResponse.data);
          setUserData(userResponse.data);
        } catch (error) {
          console.error('Error fetching data from IPFS:', error);
        } finally {
          setLoading(false); // End loading
        }
      }
    };

    fetchData();
  }, [userId]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (userId) {  // Fetch recommendations only if userId is available
        try {
          setLoading(true); // Start loading
          const response = await axios.post('http://127.0.0.1:5000/api/recommend', {
            userId: userId,  
            songsData: songsData,
            userData: userData
          });
          setRecommendedSongs(response.data.recommendedSongs);
        } catch (error) {
          console.error('Error fetching recommendations:', error);
        } finally {
          setLoading(false); // End loading
        }
      }
    };

    fetchRecommendations();
  }, [userId, songsData, userData]);

  // Toggle like/unlike song
  const toggleLikeSong = async (songId) => {
    try {
      const songToLike = songsData.find(song => song.id === songId);
      if (!songToLike) {
        console.error(`Song with ID ${songId} not found.`);
        return;
      }

      const userLiked = !likedSongs[userId] || !likedSongs[userId].find(s => s.id === songId);

      // Log data to see if it's valid before updating state
      console.log("Updating like state for song:", songToLike);

      const updatedSongs = songsData.map(song => {
        if (song.id === songId) {
          return {
            ...song,
            likesCount: userLiked ? song.likesCount + 1 : song.likesCount - 1,
            userLiked: userLiked
          };
        }
        return song;
      });

      // Log updated data to check for validity
      console.log("Updated songs data:", updatedSongs);

      setSongsData(updatedSongs);  // Update the songs data state
      updateLikedSongs(songToLike, userLiked);  // Trigger the IPFS update
      await updateLikesOnIPFS(updatedSongs);  // Update the likes count on IPFS
    } catch (error) {
      console.error("Error updating like count:", error);
    }
  };

  const playSong = async (song) => {
    try {
      // Increment the listen count
      const updatedSongs = songsData.map(s => {
        if (s.id === song.id) {
          const newListenCount = s.listenCount + 1;
          updateListenCountInStorage(song.id, newListenCount);
          return { ...s, listenCount: newListenCount };  // Update the listen count in state
        }
        return s;  // Ensure other songs remain unchanged
      });
  
      // Update the songs data state with only the modified song
      setSongsData(updatedSongs);
  
      // Now update the listen count on IPFS
      await updateListenCountOnIPFS(song.id,song.listenCount+1);
  
      // Update streamed songs for the user
      updateStreamedSongs(song);
  
      // Set the current song in the music player
      setCurrentSong(song);
  
    } catch (error) {
      console.error("Error updating listen count:", error);
    }
  };
  
  

  const updateLikedSongs = async (song, userLiked) => {
    const updatedLikedSongs = { ...likedSongs };

    if (!updatedLikedSongs[userId]) {
      updatedLikedSongs[userId] = [];
    }

    if (userLiked && !updatedLikedSongs[userId].find(s => s.id === song.id)) {
      updatedLikedSongs[userId].push(song);
    } else if (!userLiked) {
      updatedLikedSongs[userId] = updatedLikedSongs[userId].filter(s => s.id !== song.id);
    }

    setLikedSongs(updatedLikedSongs);
    localStorage.setItem('likedSongs', JSON.stringify(updatedLikedSongs));
    updateSongsWithLikes(); // Update the songs with the new liked status

    // Update user data on IPFS with the new liked songs
    const userData = {
      userId: userId,
      preferences: getStoredPreferences(), // Include other preferences if needed
      songsLiked: updatedLikedSongs[userId] || [],
      songsStreamed: streamedSongsByAccount[userId] || []
    };

    // Update user data on IPFS
    await updateUserDataOnIPFS(userData);
  };

  const getStoredPreferences = () => {
    const storedPreferences = localStorage.getItem(`${userId}_preferencesData`);
    return storedPreferences ? JSON.parse(storedPreferences) : {};
  };

  const updateSongsWithLikes = () => {
    setSongsData(prevSongs =>
      prevSongs.map(song => ({
        ...song,
        userLiked: likedSongs[userId] ? likedSongs[userId].some(s => s.id === song.id) : false
      }))
    );
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

  const updateStreamedSongs = async (song) => {
    const existingStreamedSongs = JSON.parse(localStorage.getItem('streamedSongs')) || {};
   const updatedStreamedSongs = { ...existingStreamedSongs };

    if (!updatedStreamedSongs[userId]) {
      updatedStreamedSongs[userId] = [];
    }

    // Add the streamed song if not already present
    if (!updatedStreamedSongs[userId].find(s => s.id === song.id)) {
      updatedStreamedSongs[userId].push(song);
    }

    setStreamedSongsByAccount(updatedStreamedSongs);
    localStorage.setItem('streamedSongs', JSON.stringify(updatedStreamedSongs));

    // Update user data on IPFS with the new streamed songs
    const userData = {
      userId: userId,
      preferences: getStoredPreferences(), // Include other preferences if needed
      songsLiked: likedSongs[userId] || [],
      songsStreamed: updatedStreamedSongs[userId] || []
    };

    // Update user data on IPFS
    await updateUserDataOnIPFS(userData);
  };

  const updateListenCountInStorage = (songId, listenCount) => {
    localStorage.setItem(`listenCount_${songId}`, listenCount.toString());
  };

  const updateListenCountOnIPFS = async (songId,listenCount) => {
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
      setSongsData(metadata);
    } catch (error) {
      console.error("Error updating listen count on IPFS:", error);
    }
  };
  

  const updateUserDataOnIPFS = async (userData) => {
    try {
      const response = await axios.post(`https://api.pinata.cloud/pinning/pinJSONToIPFS`, userData, {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretApiKey,
        },
      });
      console.log("Updated user data on IPFS:", response.data);
    } catch (error) {
      console.error("Error updating user data on IPFS:", error);
    }
  };

  return (
    <div className="recommendation-container">
      <h2>Recommended Songs For You</h2>
      {loading ? (
        <LoadingSpinner />  // Display loading spinner while fetching data
      ) : (
        <ul className="songs-list">
  {recommendedSongs
    .filter((song, index, self) => self.findIndex(s => s.id === song.id) === index) // Ensures unique song ids
    .map(song => (
      <li className="song-card" key={song.id}>
        <img src={song.thumbnail} alt={song.songName} className="song-thumbnail" />
        <div className="song-info">
          <p className="song-title">{song.songName}</p>
          <p className="song-artist">{song.artistName}</p>
          <p className="song-listen-count">Listens: {song.listenCount}</p>
          <p className="song-likes-count">Likes: {song.likesCount}</p>
        </div>
        <button onClick={() => toggleLikeSong(song.id)} className="like-button">
          {likedSongs[userId]?.some(s => s.id === song.id) ? 'Unlike' : 'Like'}
        </button>
        <button onClick={() => playSong(song)}>Play</button>
      </li>
    ))
  }
</ul>

      )}

<div>
        <h2>Now Playing..</h2>
        {currentSong && <MusicPlayer song={currentSong} />}
      </div>

    </div>
  );
};

export default Recommendation;