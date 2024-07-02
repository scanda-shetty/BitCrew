import axios from 'axios';
import { useState } from 'react';
import { ethers } from "ethers";
import { Row, Form, Button } from 'react-bootstrap';
import './Create.css';  // Ensure to create this CSS file in your project

const Create = ({ marketplace, nft }) => {
  const [fileImg, setFileImg] = useState(null);
  const [fileAudio, setFileAudio] = useState(null);
  const [name, setName] = useState("");
  const [desc, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const sendFilesToIPFS = async (e) => {
    e.preventDefault();
    if (!fileImg || !fileAudio || !name || !desc || !price) {
      alert("Please fill all fields and upload both files!");
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

      const formDataAudio = new FormData();
      formDataAudio.append("file", fileAudio);
      const resFileAudio = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formDataAudio, {
        headers: {
          'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY,
          'pinata_secret_api_key': process.env.REACT_APP_PINATA_SECRET_API_KEY,
          "Content-Type": "multipart/form-data"
        },
      });

      const audioHash = `https://gateway.pinata.cloud/ipfs/${resFileAudio.data.IpfsHash}`;

      await sendJSONtoIPFS(imgHash, audioHash);
    } catch (error) {
      console.error("Files to IPFS: ", error);
    } finally {
      setLoading(false);
    }
  };

  const sendJSONtoIPFS = async (imgHash, audioHash) => {
    try {
      const resJSON = await axios.post("https://api.pinata.cloud/pinning/pinJsonToIPFS", {
        name, description: desc, image: imgHash, audio: audioHash
      }, {
        headers: {
          'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY,
          'pinata_secret_api_key': process.env.REACT_APP_PINATA_SECRET_API_KEY,
        },
      });

      const tokenURI = `https://gateway.pinata.cloud/ipfs/${resJSON.data.IpfsHash}`;
      await mintThenList(tokenURI);
    } catch (error) {
      console.error("JSON to IPFS: ", error);
    }
  };

  const mintThenList = async (uri) => {
    try {
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
        <div className="file-upload-wrapper">
          <input type="file" className="form-control" id="fileAudio" onChange={(e) => setFileAudio(e.target.files[0])} />
          <label htmlFor="fileAudio" className="file-upload-button">Choose Audio</label>
          {fileAudio && <div className="file-upload-name">{fileAudio.name}</div>}
        </div>
        <Form.Control onChange={(e) => setName(e.target.value)} type="text" placeholder="Name" />
        <Form.Control onChange={(e) => setDescription(e.target.value)} as="textarea" placeholder="Artist" />
        <Form.Control onChange={(e) => setPrice(e.target.value)} type="number" placeholder="Price in ETH" />
        <Button onClick={sendFilesToIPFS} variant="primary" disabled={loading}>
          {loading ? 'Processing...' : 'Create & List NFT!'}
        </Button>
      </div>
    </div>
  );
};

export default Create;
 