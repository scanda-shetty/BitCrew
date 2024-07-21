import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import DynamicRoyaltiesAbi from '../../backend/artifacts/src/backend/contracts/DynamicRoyalties.sol/DynamicRoyalties.json';
import DynamicRoyaltiesAddress from '../contractsData/DynamicRoyalties-address.json';
import './Create.css';

const pinataApiKey = process.env.REACT_APP_PINATA_API_KEY;
const pinataSecretApiKey = process.env.REACT_APP_PINATA_SECRET_API_KEY;
const flaskApiUrl = 'http://127.0.0.1:5000/predict_streams'; // Flask API URL

const Create = () => {
  const [thumbnail, setThumbnail] = useState(null);
  const [audio, setAudio] = useState(null);
  const [songName, setSongName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [genre, setGenre] = useState('');
  const [songs, setSongs] = useState([]);
  const [pinataLink, setPinataLink] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [uploading, setUploading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [dynamicRoyalties, setDynamicRoyalties] = useState(null);
  const [contractData, setContractData] = useState([]);

  useEffect(() => {
    fetchExistingData();
    getAccount();
    initializeContract();
  }, []);

  const handleFileChange = (e, setFile) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!thumbnail || !audio || !songName || !artistName || !genre) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setUploading(true);

      const thumbnailIpfsHash = await uploadFileToPinata(thumbnail);
      const audioIpfsHash = await uploadFileToPinata(audio);

      const newSong = {
        id: songs.length === 0 ? 1 : songs[songs.length - 1].id + 1,
        thumbnail: `https://gateway.pinata.cloud/ipfs/${thumbnailIpfsHash}`,
        audio: `https://gateway.pinata.cloud/ipfs/${audioIpfsHash}`,
        songName,
        artistName,
        genre,
        artistId: currentAccount,
        listenCount: 0,
      };

      const updatedSongs = [...songs, newSong];
      setSongs(updatedSongs);

      const updatedJsonIpfsHash = await uploadJsonToPinata(updatedSongs);
      setPinataLink(`https://gateway.pinata.cloud/ipfs/${updatedJsonIpfsHash}`);

      localStorage.setItem('songsIpfsHash', updatedJsonIpfsHash);

      if (dynamicRoyalties) {
        try {
          const tx = await dynamicRoyalties.addSong(newSong.id, currentAccount);
          await tx.wait();
          console.log('Transaction successful:', tx);
          alert('Song uploaded successfully!');
          fetchContractData(); // Fetch updated contract data
        } catch (contractError) {
          console.error('Smart contract interaction error:', contractError);
          alert(`Error uploading song to smart contract: ${contractError.message}`);
        }
      } else {
        console.error('Smart contract instance not initialized.');
        alert('Smart contract instance not available.');
      }
    } catch (error) {
      console.error('Error uploading song:', error);
      alert(`Error uploading song: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const uploadFileToPinata = async (file) => {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        folder: 'Swar-songs',
      },
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    try {
      const response = await axios.post(url, formData, {
        maxContentLength: Infinity,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretApiKey,
        },
      });

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading file to Pinata:', error);
      throw error;
    }
  };

  const fetchExistingData = async () => {
    const existingIpfsHash = localStorage.getItem('songsIpfsHash');
    if (!existingIpfsHash) {
      console.log('No existing IPFS hash found in local storage.');
      return;
    }

    console.log('Existing IPFS hash from local storage:', existingIpfsHash);
    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${existingIpfsHash}`);
      if (response.data) {
        setSongs(response.data);
        setPinataLink(`https://gateway.pinata.cloud/ipfs/${existingIpfsHash}`);
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  const uploadJsonToPinata = async (jsonData) => {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

    const response = await axios.post(url, jsonData, {
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    });

    return response.data.IpfsHash;
  };

  const getAccount = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error('Error fetching MetaMask account:', error);
    }
  };

  const initializeContract = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(DynamicRoyaltiesAddress.address, DynamicRoyaltiesAbi.abi, signer);
    setDynamicRoyalties(contract);
  };

  const fetchContractData = async () => {
    try {
      const songsData = [];

      for (let i = 1; i <= 1; i++) {
        const song = await dynamicRoyalties.songs(i);
        songsData.push({
          id: i,
          listenCount: song.listenCount.toString(),
          totalRoyalties: ethers.utils.formatEther(song.totalRoyalties),
          artist: song.artist,
        });
      }

      setContractData(songsData);
    } catch (error) {
      console.error('Error fetching data from smart contract:', error);
    }
  };

  const handlePredict = async () => {
    if (!artistName || !genre) {
      alert('Please provide artist name and genre for prediction.');
      return;
    }

    try {
      const response = await axios.post(flaskApiUrl, {
        artist_names: artistName,
        genre: genre
      });

      setPrediction(response.data.predicted_streams);
    } catch (error) {
      console.error('Error fetching prediction:', error);
      alert('Error fetching prediction');
    }
  };

  const handleRefresh = () => {
    // Clear songs state and local storage
    setSongs([]);
    localStorage.removeItem('songsIpfsHash');
    setPinataLink('');
  };

  return (
    <div className="create-container">
      <h1>Upload Song</h1>
      <div className="form-container">
        <div className="file-upload-wrapper">
          <input type="file" id="thumbnail" onChange={(e) => handleFileChange(e, setThumbnail)} />
          <label htmlFor="thumbnail" className="file-upload-button">
            Choose Thumbnail
          </label>
          {thumbnail && <div className="file-upload-name">{thumbnail.name}</div>}
        </div>
        <div className="file-upload-wrapper">
          <input type="file" id="audio" onChange={(e) => handleFileChange(e, setAudio)} />
          <label htmlFor="audio" className="file-upload-button">
            Choose Song
          </label>
          {audio && <div className="file-upload-name">{audio.name}</div>}
        </div>
        <div className='container-name'>
          <label>Song Name:</label>
          <input type="text" value={songName} onChange={(e) => setSongName(e.target.value)} />
        </div>
        <div className='container-name'>
          <label>Artist Name:</label>
          <input type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)} />
        </div>
        <div className='container-name'>
          <label>Genre:</label>
          <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} />
        </div>
        <button className='submit-button' type="submit" onClick={handleSubmit} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Song'}
        </button>
      </div>
      {pinataLink && (
        <div className="pinata-link">
          <p>Song metadata IPFS link:</p>
          <a href={pinataLink} target="_blank" rel="noopener noreferrer">{pinataLink}</a>
        </div>
      )}
      <button className='refresh-button' onClick={handleRefresh}>Refresh Songs</button>
      <div className="predict-container">
        <h2>Predict Song Streams</h2>
        <div className='container-name'>
          <label>Artist Name:</label>
          <input type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)} />
        </div>
        <div className='container-name'>
          <label>Genre:</label>
          <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} />
        </div>
        <button className='predict-button' onClick={handlePredict}>
          Predict Streams
        </button>
        {prediction && (
          <div className="prediction-result">
            <p>Predicted Streams: {prediction}</p>
          </div>
        )}
      </div>
      <div className="contract-data-container">
        <h2>Contract Data</h2>
        {contractData.length > 0 ? (
          <ul>
            {contractData.map((song, index) => (
              <li key={index}>
                <p>Song ID: {song.id}</p>
                <p>Listen Count: {song.listenCount}</p>
                <p>Total Royalties: {song.totalRoyalties} ETH</p>
                <p>Artist Address: {song.artist}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No contract data available</p>
        )}
      </div>
    </div>
  );
};

export default Create;
