import axios from 'axios';
import { useState } from 'react';
import { ethers } from "ethers";
import { Form, Button, Alert } from 'react-bootstrap';
import './Create.css';  // Ensure to create this CSS file in your project
import { useParams } from 'react-router';

const Create = ({ marketplace, nft, account, songs }) => {
  const { songId } = useParams(); // Fetching songId from URL params
  const [fileImg, setFileImg] = useState(null);
  const [name, setName] = useState("");
  const [artist, setArtist] = useState("");
  const [desc, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  // Function to calculate maximum allowable price based on song's metrics
  const calculateMaxPrice = (song) => {
    // Example formula: Maximum price can be 1 ETH per 1000 listens
    const maxPricePerListen = 0.001; // 0.001 ETH per listen
    const maxPrice = song.listenCount * maxPricePerListen;
    return maxPrice;
  };

  const sendFilesToIPFS = async (e) => {
    e.preventDefault();
    if (!fileImg || !name || !artist || !desc || !price) {
      setAlertMessage("Please fill all fields!");
      return;
    }

    // Ensure songs array is initialized and not empty
    if (!Array.isArray(songs) || songs.length === 0) {
      setAlertMessage("No songs found. Please upload some songs first.");
      return;
    }

    // Fetch selected song from songs array
    const selectedSong = songs.find(song => song.id === parseInt(name));
    if (!selectedSong) {
      setAlertMessage("Selected song not found in your uploaded songs.");
      return;
    }

    // Validate artist name
    if (artist !== selectedSong.artistName) {
      setAlertMessage("Artist name does not match !");
      return;
    }

    // Validate song name
    if (selectedSong.songName.toLowerCase() !== desc.toLowerCase()) {
      setAlertMessage("Song name does not match!");
      return;
    }

    // Validate song ID from URL matches entered song ID
    if (parseInt(songId) !== selectedSong.id) {
      setAlertMessage("The selected song does not match the chosen song.");
      return;
    }

    // Calculate maximum allowable price based on the song's metrics
    const maxPrice = calculateMaxPrice(selectedSong);
    const formattedMaxPrice = maxPrice.toFixed(3); // Adjust as needed for display
    if (parseFloat(price) > maxPrice) {
      setAlertMessage(`Price exceeds the maximum allowed (${formattedMaxPrice} ETH). Please set a lower price.`);
      return;
    }

    setLoading(true);
    try {
      const formDataImg = new FormData();
      formDataImg.append("file", fileImg);
      const resFileImg = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formDataImg, {
        headers: {
          'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY,
          'pinata_secret_api_key': process.env.REACT_APP_PINATA_SECRET_API_KEY,
          "Content-Type": "multipart/form-data"
        },
      });

      const imgHash = `https://gateway.pinata.cloud/ipfs/${resFileImg.data.IpfsHash}`;

      await sendJSONtoIPFS(imgHash, selectedSong);
    } catch (error) {
      console.error("Files to IPFS: ", error);
    } finally {
      setLoading(false);
    }
  };


  const sendJSONtoIPFS = async (imgHash, selectedSong) => {
    try {
      const resJSON = await axios.post("https://api.pinata.cloud/pinning/pinJsonToIPFS", {
        name: selectedSong.songName, description: selectedSong.artistName, image: imgHash,audio:selectedSong.audio
      }, {
        headers: {
          'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY,
          'pinata_secret_api_key': process.env.REACT_APP_PINATA_SECRET_API_KEY,
        },
      });

      console.log("Metadata pinned to IPFS:", resJSON.data); // Log metadata here

      const tokenURI = `https://gateway.pinata.cloud/ipfs/${resJSON.data.IpfsHash}`;
      await mintThenList(tokenURI, selectedSong);
    } catch (error) {
      console.error("JSON to IPFS: ", error);
    }
  };

  const mintThenList = async (uri, selectedSong) => {
    try {
      // Validate ownership of the selected song
      if (account !== selectedSong.artistId) {
        setAlertMessage("You can only create NFTs for your own songs.");
        return;
      }

      if (parseInt(songId) !== selectedSong.id) {
        setAlertMessage("The song ID in the URL does not match the selected song ID.");
        return;
      }

      await (await nft.mint(uri)).wait();
      const id = await nft.tokenCount();
      await (await nft.setApprovalForAll(marketplace.address, true)).wait();
      const listingPrice = ethers.utils.parseEther(price.toString());
      await (await marketplace.makeItem(nft.address, id, listingPrice)).wait();
    } catch (error) {
      console.error("Mint then List: ", error);
    }
  };

  return (
    <div className="create-container">
      <div className="form-container">
        <div className="file-upload-wrapper">
          <input type="file" className="form-control" id="fileImg" onChange={(e) => setFileImg(e.target.files[0])} />
          <label htmlFor="fileImg" className="file-upload-button">Choose Image</label>
          {fileImg && <div className="file-upload-name">{fileImg.name}</div>}
        </div>
        <Form.Control onChange={(e) => setName(e.target.value)} type="text" placeholder="Song ID" />
        <Form.Control onChange={(e) => setArtist(e.target.value)} type="text" placeholder="Artist Name" />
        <Form.Control onChange={(e) => setDescription(e.target.value)} type="text" placeholder="Song Name" />
        <Form.Control onChange={(e) => setPrice(e.target.value)} type="number" placeholder="Price in ETH" />
        {alertMessage && <Alert variant="danger" onClose={() => setAlertMessage(null)} dismissible>{alertMessage}</Alert>}
        <Button onClick={sendFilesToIPFS} variant="primary" disabled={loading}>
          {loading ? 'Processing...' : 'Create & List NFT!'}
        </Button>
      </div>
    </div>
  );
};

export default Create;
