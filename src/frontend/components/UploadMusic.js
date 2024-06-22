// import axios from 'axios';
// import { useState } from 'react';
// import { Row, Form, Button } from 'react-bootstrap';

// const UploadMusic = () => {
//   const [mp3File, setMp3File] = useState(null);
//   const [thumbnail, setThumbnail] = useState(null);
//   const [title, setTitle] = useState("");
//   const [artist, setArtist] = useState("");
//   const [album, setAlbum] = useState("");

//   const uploadToIPFS = async () => {
//     if (!mp3File || !title || !artist || !album || !thumbnail) return;
//     try {
//       const mp3FormData = new FormData();
//       mp3FormData.append("file", mp3File);

//       const mp3Res = await axios({
//         method: "post",
//         url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
//         data: mp3FormData,
//         headers: {
//           'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY,
//           'pinata_secret_api_key': process.env.REACT_APP_PINATA_SECRET_API_KEY,
//           "Content-Type": "multipart/form-data"
//         },
//       });

//       const thumbnailFormData = new FormData();
//       thumbnailFormData.append("file", thumbnail);

//       const thumbnailRes = await axios({
//         method: "post",
//         url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
//         data: thumbnailFormData,
//         headers: {
//           'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY,
//           'pinata_secret_api_key': process.env.REACT_APP_PINATA_SECRET_API_KEY,
//           "Content-Type": "multipart/form-data"
//         },
//       });

//       const metadata = {
//         title: title,
//         artist: artist,
//         album: album,
//         audio: `https://gateway.pinata.cloud/ipfs/${mp3Res.data.IpfsHash}`,
//         thumbnail: `https://gateway.pinata.cloud/ipfs/${thumbnailRes.data.IpfsHash}`
//       };

//       const resJSON = await axios({
//         method: "post",
//         url: "https://api.pinata.cloud/pinning/pinJsonToIPFS",
//         data: metadata,
//         headers: {
//           'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY,
//           'pinata_secret_api_key': process.env.REACT_APP_PINATA_SECRET_API_KEY,
//         },
//       });

//       const metadataURI = `https://gateway.pinata.cloud/ipfs/${resJSON.data.IpfsHash}`;
//       console.log("Metadata URI:", metadataURI);
//       // Call a function to use the metadata URI, for example, minting an NFT with this metadataURI
//     } catch (error) {
//       console.log("Upload to IPFS error:", error);
//     }
//   }

//   return (
//     <div className="container-fluid mt-5">
//       <div className="row">
//         <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
//           <div className="content mx-auto">
//             <Row className="g-4">
//               <Form.Control onChange={(e) => setMp3File(e.target.files[0])} size="lg" required type="file" accept=".mp3" name="mp3File" placeholder="Song"/>
//               <Form.Control onChange={(e) => setThumbnail(e.target.files[0])} size="lg" required type="file" accept="image/*" name="thumbnail" />
//               <Form.Control onChange={(e) => setTitle(e.target.value)} size="lg" required type="text" placeholder="Title" />
//               <Form.Control onChange={(e) => setArtist(e.target.value)} size="lg" required type="text" placeholder="Artist" />
//               <Form.Control onChange={(e) => setAlbum(e.target.value)} size="lg" required type="text" placeholder="Album" />
//               <div className="d-grid px-0">
//                 <Button onClick={uploadToIPFS} variant="primary" size="lg">
//                   Upload Music Metadata
//                 </Button>
//               </div>
//             </Row>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

// export default UploadMusic;




import axios from 'axios';
import { useState } from 'react';
import { ethers } from "ethers";
import { Row, Form, Button } from 'react-bootstrap';

const UploadMusic = ({ SongMetadata, NFT }) => {
  const [fileAudio, setFileAudio] = useState(null);
  const [fileThumbnail, setFileThumbnail] = useState(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [price, setPrice] = useState("");

  const sendFilesToIPFS = async () => {
    try {
      const formDataAudio = new FormData();
      formDataAudio.append("file", fileAudio);
      const resAudio = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formDataAudio, {
        headers: {
          'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY,
          'pinata_secret_api_key': process.env.REACT_APP_PINATA_SECRET_API_KEY,
          "Content-Type": "multipart/form-data"
        },
      });

      const formDataThumbnail = new FormData();
      formDataThumbnail.append("file", fileThumbnail);
      const resThumbnail = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formDataThumbnail, {
        headers: {
          'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY,
          'pinata_secret_api_key': process.env.REACT_APP_PINATA_SECRET_API_KEY,
          "Content-Type": "multipart/form-data"
        },
      });

      const MusicMetadata = {
        title,
        artist,
        album,
        audio: `https://gateway.pinata.cloud/ipfs/${resAudio.data.IpfsHash}`,
        thumbnail: `https://gateway.pinata.cloud/ipfs/${resThumbnail.data.IpfsHash}`
      };

      const resJSON = await axios.post("https://api.pinata.cloud/pinning/pinJsonToIPFS", MusicMetadata, {
        headers: {
          'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY,
          'pinata_secret_api_key': process.env.REACT_APP_PINATA_SECRET_API_KEY,
        },
      });

      const tokenURI = `https://gateway.pinata.cloud/ipfs/${resJSON.data.IpfsHash}`;
      console.log("Token URI", tokenURI);
      mintNFT(tokenURI);
    } catch (error) {
      console.log("Upload to IPFS error: ", error);
    }
  }

  const mintNFT = async (tokenURI) => {
    try {
      await (await NFT.mint(tokenURI)).wait();
      const id = await NFT.tokenCount();
      await (await NFT.setApprovalForAll(SongMetadata.address, true)).wait();
      const listingPrice = ethers.utils.parseEther(price.toString());
      await (await SongMetadata.uploadMusicMetadata(title, artist, album, tokenURI)).wait();
    } catch (error) {
      console.log("Mint NFT error: ", error);
    }
  }

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control onChange={(e) => setFileAudio(e.target.files[0])} size="lg" required type="file" name="fileAudio" />
              <Form.Control onChange={(e) => setFileThumbnail(e.target.files[0])} size="lg" required type="file" name="fileThumbnail" />
              <Form.Control onChange={(e) => setTitle(e.target.value)} size="lg" required type="text" placeholder="Song Title" />
              <Form.Control onChange={(e) => setArtist(e.target.value)} size="lg" required type="text" placeholder="Artist" />
              <Form.Control onChange={(e) => setAlbum(e.target.value)} size="lg" required type="text" placeholder="Album" />
              <Form.Control onChange={(e) => setPrice(e.target.value)} size="lg" required type="number" placeholder="Price in ETH" />
              <div className="d-grid px-0">
                <Button onClick={sendFilesToIPFS} variant="primary" size="lg">
                  Upload Music & Metadata!
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
}

export default UploadMusic;
