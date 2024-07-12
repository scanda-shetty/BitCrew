import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Create.css';

const pinataApiKey = process.env.REACT_APP_PINATA_API_KEY;
const pinataSecretApiKey = process.env.REACT_APP_PINATA_SECRET_API_KEY;

const Create = () => {
  const [thumbnail, setThumbnail] = useState(null);
  const [audio, setAudio] = useState(null);
  const [songName, setSongName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [genre, setGenre] = useState(''); // New state for genre
  const [songs, setSongs] = useState([]);
  const [pinataLink, setPinataLink] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [uploading, setUploading] = useState(false); // State to track uploading state

  useEffect(() => {
    fetchExistingData();
    getAccount(); // Fetch current MetaMask account when component mounts
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
      // Set uploading state to true
      setUploading(true);

      // Upload thumbnail and audio files separately
      const thumbnailIpfsHash = await uploadFileToPinata(thumbnail);
      const audioIpfsHash = await uploadFileToPinata(audio);

      // Create new song object
      const newSong = {
        id: songs.length === 0 ? 1 : songs[songs.length - 1].id + 1,
        thumbnail: `https://gateway.pinata.cloud/ipfs/${thumbnailIpfsHash}`,
        audio: `https://gateway.pinata.cloud/ipfs/${audioIpfsHash}`,
        songName,
        artistName,
        genre, // Include genre
        artistId: currentAccount, // Dynamically assign current account as artistId
        listenCount: 0, // Initialize listen count
      };

      // Update songs state with new song
      const updatedSongs = [...songs, newSong];
      setSongs(updatedSongs);

      // Upload updated JSON to Pinata
      const updatedJsonIpfsHash = await uploadJsonToPinata(updatedSongs);
      setPinataLink(`https://gateway.pinata.cloud/ipfs/${updatedJsonIpfsHash}`);

      // Store the new IPFS hash locally
      localStorage.setItem('songsIpfsHash', updatedJsonIpfsHash);

      alert('Song uploaded successfully!');
    } catch (error) {
      console.error('Error uploading song:', error);
      alert('Error uploading song');
    } finally {
      // Set uploading state back to false after upload completes (whether successful or not)
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
      throw error; // Re-throw the error to propagate it upwards
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
    // Example function to retrieve current MetaMask account
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error('Error fetching MetaMask account:', error);
    }
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
          <label>Genre:</label> {/* New input field for genre */}
          <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} />
        </div>
        {/* Display "Uploading..." when uploading */}
        <button className='submit-button' type="submit" onClick={handleSubmit} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      {pinataLink && (
        <div>
          <h2>Pinata Link:</h2>
          <a href={pinataLink} target="_blank" rel="noopener noreferrer">
            {pinataLink}
          </a>
        </div>
      )}
    </div>
  );
};

export default Create;
