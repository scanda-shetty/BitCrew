import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner'; // Import the spinner component
import './ForYou.css';

const Recommendation = () => {
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  const [userId, setUserId] = useState('');
  const [songsData, setSongsData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state

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

          console.log('Songs Data:', songsResponse.data);
          console.log('User Data:', userResponse.data);

          setSongsData(songsResponse.data);
          setUserData(userResponse.data);  // Ensure userData is an array
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
          console.log(response.data);
          setRecommendedSongs(response.data.recommendedSongs);
        } catch (error) {
          console.error('Error fetching recommendations:', error);
        } finally {
          setLoading(false); // End loading
        }
      }
    };  

    fetchRecommendations(); 
  }, [userId, songsData, userData]); // Fetch recommendations when userId, songsData, or userData changes

  return ( 
    <div className="foryou-container">  
      <h2>Recommended Songs For You</h2>
      {loading ? ( // Show spinner if loading
        <LoadingSpinner />
      ) : (
        <ul className="songs-list">
          {recommendedSongs.map(song => (
            <li className="song-card" key={song.id}>
              <img src={song.thumbnail} alt={song.songName} className="song-thumbnail" />
              <p className="song-title">{song.songName} by {song.artistName}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
  
export default Recommendation;
