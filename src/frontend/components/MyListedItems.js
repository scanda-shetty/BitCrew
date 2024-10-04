import { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { Row, Col, Card, Button } from 'react-bootstrap';
import styles from './MyListedItems.module.css';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function MyListedItems({ marketplace, nft, account }) {
  const [loading, setLoading] = useState(true);
  const [listedItems, setListedItems] = useState([]);
  const [songs, setSongs] = useState([]);
  const [soldNFTs, setSoldNFTs] = useState([]);

  const loadListedItems = async () => {
    setLoading(true);
    try {
      const itemCount = await marketplace.itemCount();
      let _listedItems = [];

      for (let indx = 1; indx <= itemCount; indx++) {
        const i = await marketplace.items(indx);
        if (i.seller.toLowerCase() === account.toLowerCase()) {
          const uri = await nft.tokenURI(i.tokenId);
          const response = await fetch(uri);
          const metadata = await response.json();
          const totalPrice = await marketplace.getTotalPrice(i.itemId);

          let item = {
            totalPrice,
            price: i.price,
            itemId: i.itemId,
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
            artist: metadata.artistName
          };

          _listedItems.push(item);
        }
      }
      setListedItems(_listedItems);
    } catch (error) {
      console.error("Error loading listed items:", error);
    }
    setLoading(false);
  };

  const fetchSongs = async () => {
    const existingIpfsHash = localStorage.getItem('songsIpfsHash');
    if (!existingIpfsHash || !account) {
      console.log('No existing IPFS hash found or no account connected.');
      return;
    }
  
    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${existingIpfsHash}`);
      if (response.data) {
        // Filter songs based on artistId matching the current MetaMask account
        const userSongs = response.data.filter(song => {
          if (song.artistId) {
            return song.artistId.toLowerCase() === account.toLowerCase();
          }
          return false;
        });
        setSongs(userSongs);
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
    }
  };

  const loadSoldNFTs = async () => {
    setLoading(true);
    try {
      const itemCount = await marketplace.itemCount();
      let _soldNFTs = [];
  
      for (let indx = 1; indx <= itemCount; indx++) {
        const i = await marketplace.items(indx);
        console.log("Item:", i);
        if (i.buyer && account && i.buyer.toLowerCase() === account.toLowerCase()) {
          const uri = await nft.tokenURI(i.tokenId);
          const response = await fetch(uri);
          const metadata = await response.json();
          const totalPrice = await marketplace.getTotalPrice(i.itemId);
  
          let nftItem = {
            totalPrice,
            price: i.price,
            itemId: i.itemId,
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
            artist: metadata.artistName
          };
  
          _soldNFTs.push(nftItem);
        }
      }
      setSoldNFTs(_soldNFTs);
    } catch (error) {
      console.error("Error loading sold NFTs:", error);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    loadListedItems();
    fetchSongs();
    loadSoldNFTs();
  }, [account]);

  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>Loading...</h2>
    </main>
  );

  return (
    <div className={styles.container}>
      {listedItems.length > 0 ?
        <div>
          <h2 className={styles.title}>Listed NFTs</h2>
          <Row xs={1} md={2} lg={4} className="g-4 py-3">
            {listedItems.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card className={styles.card}>
                  <Card.Img variant="top" src={item.image} />
                  <Card.Footer className={styles.footer}>
                    <div>{ethers.utils.formatEther(item.totalPrice)} ETH</div>
                    <div>{item.name}</div>
                    <div>{item.artist}</div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
        :
        <main style={{ padding: "1rem 0" }}>
          <h2>No listed NFTs</h2>
        </main>
      }
      {songs.length > 0 ?
        <div>
          <hr />
          <h2 className={styles.title}>Uploaded Songs</h2>
          <Row xs={1} md={2} lg={4} className="g-4 py-3">
            {songs.map((song, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card className={styles.card}>
                  <Card.Img variant="top" src={song.thumbnail} />
                  <Card.Body>
                    <Card.Title>Song ID: {song.id}</Card.Title>
                    <Card.Text>Song Name: {song.songName}</Card.Text>
                    <Card.Text>Artist: {song.artistName}</Card.Text>
                    <Card.Text>Listen Count: {song.listenCount}</Card.Text>
                    <Link
                      to={`/create-nft/${song.id}`}
                    >
                      <Button variant="primary">Create NFT</Button>
                    </Link>
                  </Card.Body>
                  <Card.Footer>
                    <audio controls src={song.audio} />
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
        :
        <main style={{ padding: "1rem 0" }}>
          <h2>No uploaded songs</h2>
        </main>
      }
      {soldNFTs.length > 0 ?
        <div>
          <hr />
          <h2 className={styles.title}>Sold NFTs</h2>
          <Row xs={1} md={2} lg={4} className="g-4 py-3">
            {soldNFTs.map((nftItem, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card className={styles.card}>
                  <Card.Img variant="top" src={nftItem.image} />
                  <Card.Footer className={styles.footer}>
                    <div>{ethers.utils.formatEther(nftItem.totalPrice)} ETH</div>
                    <div>{nftItem.name}</div>
                    <div>{nftItem.description}</div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
        :
        <main style={{ padding: "1rem 0" }}>
          <h2>No sold NFTs</h2>
        </main>
      }
    </div>
  );
}