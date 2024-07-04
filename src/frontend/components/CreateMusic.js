// import React, { useState } from 'react';
// import axios from 'axios';
// import { Form, Button } from 'react-bootstrap';
// import './Create.css'; // Ensure to create this CSS file in your project

// const Create = ({ onAddSong, existingMetadataUrl }) => {
//   const [fileImg, setFileImg] = useState(null);
//   const [fileAudio, setFileAudio] = useState(null);
//   const [name, setName] = useState('');
//   const [artist, setArtist] = useState('');
//   const [loading, setLoading] = useState(false);

//   const sendFilesToIPFS = async (e) => {
//     e.preventDefault();
//     if (!fileImg || !fileAudio || !name || !artist) {
//       alert('Please fill all fields and upload both files!');
//       return;
//     }

//     setLoading(true);
//     try {
//       const formDataImg = new FormData();
//       formDataImg.append('file', fileImg);
//       const resFileImg = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formDataImg, {
//         headers: {
//           pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
//           pinata_secret_api_key: process.env.REACT_APP_PINATA_SECRET_API_KEY,
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       const imgHash = `https://gateway.pinata.cloud/ipfs/${resFileImg.data.IpfsHash}`;

//       const formDataAudio = new FormData();
//       formDataAudio.append('file', fileAudio);
//       const resFileAudio = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formDataAudio, {
//         headers: {
//           pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
//           pinata_secret_api_key: process.env.REACT_APP_PINATA_SECRET_API_KEY,
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       const audioHash = `https://gateway.pinata.cloud/ipfs/${resFileAudio.data.IpfsHash}`;

//       await updateMetadataWithNewSong(imgHash, audioHash);
//     } catch (error) {
//       console.error('Files to IPFS: ', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateMetadataWithNewSong = async (imgHash, audioHash) => {
//     try {
//       // Fetch existing metadata
//       const existingMetadataResponse = await axios.get('https://gateway.pinata.cloud/ipfs/QmasBFQScn86vq83Vh8VpnBwQDtbmRuaCgGvg9iPSDvD2X');
//       const existingMetadata = existingMetadataResponse.data;

//       // Ensure the existing metadata is an array
//       let updatedMetadata = [];
//       if (Array.isArray(existingMetadata)) {
//         updatedMetadata = existingMetadata;
//       } else {
//         console.error('Existing metadata is not an array.');
//         return;
//       }

//       // Add new song to existing metadata
//       const newSong = {
//         title: name,
//         artist: artist,
//         album: '',
//         audio: audioHash,
//         thumbnail: imgHash,
//       };
//       updatedMetadata.push(newSong);

//       // Upload updated metadata to IPFS
//       const resJSON = await axios.post(
//         'https://api.pinata.cloud/pinning/pinJsonToIPFS',
//         updatedMetadata,
//         {
//           headers: {
//             pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
//             pinata_secret_api_key: process.env.REACT_APP_PINATA_SECRET_API_KEY,
//           },
//         }
//       );

//       console.log(`Updated Metadata URL: https://gateway.pinata.cloud/ipfs/${resJSON.data.IpfsHash}`);

//       // Callback to add the newly created song to the main list
//       onAddSong(newSong);

//       // Reset form fields after successful submission
//       setFileImg(null);
//       setFileAudio(null);
//       setName('');
//       setArtist('');
//     } catch (error) {
//       console.error('JSON to IPFS: ', error);
//     }
//   };

//   return (
//     <div className="create-container">
//       <div className="form-container">
//         <div className="file-upload-wrapper">
//           <input type="file" className="form-control" id="fileImg" onChange={(e) => setFileImg(e.target.files[0])} />
//           <label htmlFor="fileImg" className="file-upload-button">
//             Choose Image
//           </label>
//           {fileImg && <div className="file-upload-name">{fileImg.name}</div>}
//         </div>
//         <div className="file-upload-wrapper">
//           <input type="file" className="form-control" id="fileAudio" onChange={(e) => setFileAudio(e.target.files[0])} />
//           <label htmlFor="fileAudio" className="file-upload-button">
//             Choose Audio
//           </label>
//           {fileAudio && <div className="file-upload-name">{fileAudio.name}</div>}
//         </div>
//         <Form.Control onChange={(e) => setName(e.target.value)} type="text" placeholder="Song Name" />
//         <Form.Control onChange={(e) => setArtist(e.target.value)} type="text" placeholder="Artist Name" />
//         <Button onClick={sendFilesToIPFS} variant="primary" disabled={loading}>
//           {loading ? 'Processing...' : 'Save Song Data'}
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default Create;


import React, { useState, useEffect } from 'react';
import axios from 'axios';

const pinataApiKey = process.env.REACT_APP_PINATA_API_KEY;
const pinataSecretApiKey = process.env.REACT_APP_PINATA_SECRET_API_KEY;
let existingIpfsHash = 'QmX9VFuzStNSt4hYJa8obb1PPg29qYzq8N6UwPAxLzdRV9'; // Replace with your existing IPFS hash

const Create = () => {
  const [thumbnail, setThumbnail] = useState(null);
  const [audio, setAudio] = useState(null);
  const [songName, setSongName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [songs, setSongs] = useState([]);
  const [pinataLink, setPinataLink] = useState('');

  useEffect(() => {
    fetchExistingData();
  }, []);

  const handleFileChange = (e, setFile) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!thumbnail || !audio || !songName || !artistName) {
      alert('Please fill in all fields');
      return;
    }

    try {
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
      };

      // Update songs state with new song
      const updatedSongs = [...songs, newSong];
      setSongs(updatedSongs);

      // Upload updated JSON to Pinata
      const updatedJsonIpfsHash = await uploadJsonToPinata(updatedSongs);
      setPinataLink(`https://gateway.pinata.cloud/ipfs/${updatedJsonIpfsHash}`);

      // Update existingIpfsHash to the latest
      existingIpfsHash = updatedJsonIpfsHash;

      alert('Song uploaded successfully!');
    } catch (error) {
      console.error('Error uploading song:', error);
      alert('Error uploading song');
    }
  };

  const uploadFileToPinata = async (file) => {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    const response = await axios.post(url, formData, {
      maxContentLength: Infinity,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    });

    return response.data.IpfsHash;
  };

  const fetchExistingData = async () => {
    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${existingIpfsHash}`);
      if (response.data) {
        setSongs(response.data);
        // Set pinata link if songs exist
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

  return (
    <div>
      <h1>Upload Song</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Song Thumbnail:</label>
          <input type="file" onChange={(e) => handleFileChange(e, setThumbnail)} />
        </div>
        <div>
          <label>Song Audio:</label>
          <input type="file" onChange={(e) => handleFileChange(e, setAudio)} />
        </div>
        <div>
          <label>Song Name:</label>
          <input type="text" value={songName} onChange={(e) => setSongName(e.target.value)} />
        </div>
        <div>
          <label>Artist Name:</label>
          <input type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)} />
        </div>
        <button type="submit">Upload</button>
      </form>
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
