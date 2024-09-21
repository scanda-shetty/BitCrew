import React, { useState, useEffect } from "react";
import './Home.css';
import axios from 'axios';
import { useMusicPlayer } from './MusicPlayerContext';
import MusicPlayer from './MusicPlayer';
import UserInsights from './userInsights';
import DynamicRoyaltiesAbi from '../../backend/artifacts/src/backend/contracts/DynamicRoyalties.sol/DynamicRoyalties.json';
import DynamicRoyaltiesAddress from '../contractsData/DynamicRoyalties-address.json';
import { ethers } from 'ethers';

const pinataApiKey = process.env.REACT_APP_PINATA_API_KEY;
const pinataSecretApiKey = process.env.REACT_APP_PINATA_SECRET_API_KEY;

function Home({ account }) {
  const [songs, setSongs] = useState([]);
  const { currentSong, setCurrentSong } = useMusicPlayer();

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
      const metadataResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${songsIpfsHash}`);
      const metadata = metadataResponse.data;

      if (!Array.isArray(metadata)) {
        console.error("Metadata is not in the expected format.");
        return;
      }

      console.log('Fetched songs metadata:', metadata);

      const songsWithListenCount = metadata.map(song => ({
        ...song,
        listenCount: getListenCountFromStorage(song.id)
      }));

      setSongs(songsWithListenCount);
    } catch (error) {
      console.error("Error fetching songs from Pinata:", error);
    }
  };

  const playSong = async (song) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(DynamicRoyaltiesAddress.address, DynamicRoyaltiesAbi.abi, signer);

      const tx = await contract.listen(song.id);
      await tx.wait(); // Wait for the transaction to be mined

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
    } catch (error) {
      console.error("Error updating listen count:", error);
    }
    setCurrentSong(song);
    updateUserListenData(song); // New function to update user listen data
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

  const updateUserListenData = (song) => {
    const userListenData = JSON.parse(localStorage.getItem('userListenData')) || {};
    const userId = account;
    if (!userListenData[userId]) {
      userListenData[userId] = { artists: {}, genres: {} };
    }

    const userData = userListenData[userId];

    if (userData.artists[song.artistName]) {
      userData.artists[song.artistName] += 1;
    } else {
      userData.artists[song.artistName] = 1;
    }

    if (userData.genres[song.genre]) {
      userData.genres[song.genre] += 1;
    } else {
      userData.genres[song.genre] = 1;
    }

    localStorage.setItem('userListenData', JSON.stringify(userListenData));
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
            </div>
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
      <UserInsights account={account} />
    </div>
  );
}

export default Home;
