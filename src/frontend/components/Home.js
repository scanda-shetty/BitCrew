import { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { Row, Col, Card, Button } from 'react-bootstrap';
import './Home.css';  

const Home = ({ marketplace, nft }) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const loadMarketplaceItems = async () => {
    const itemCount = await marketplace.itemCount();
    let items = [];
    for (let i = 1; i <= itemCount; i++) {
      const item = await marketplace.items(i);
      if (!item.sold) {
        const uri = await nft.tokenURI(item.tokenId);
        const response = await fetch(uri);
        const metadata = await response.json();
        const totalPrice = await marketplace.getTotalPrice(item.itemId);
        items.push({
          totalPrice,
          itemId: item.itemId,
          seller: item.seller,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          audio: metadata.audio
        });
      }
    }
    setLoading(false);
    setItems(items);
  };

  const buyMarketItem = async (item) => {
    await (await marketplace.purchaseItem(item.itemId, { value: item.totalPrice })).wait();
    loadMarketplaceItems();
  };

  useEffect(() => {
    loadMarketplaceItems();
  }, []);

  if (loading) return <div className="loading-container">Loading...</div>;

  return (
    <div className="marketplace-container">
      {items.length > 0 ? (
        <Row xs={1} md={2} lg={3} className="g-4">
          {items.map((item, idx) => (
            <Col key={idx}>
            <Card className="nft-card">
  <Card.Img variant="top" src={item.image} className="nft-image" />
  <Card.Body style={{backgroundColor:"black"}}>
    <Card.Title>{item.name}</Card.Title>
    <div className="audio-container">
      <audio controls className="audio-player">
        <source src={item.audio} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
    <Card.Text>{item.description}</Card.Text>
    <Button variant="custom" style={{backgroundColor:"green"}} onClick={() => buyMarketItem(item)}>
      Buy for {ethers.utils.formatEther(item.totalPrice)} ETH
    </Button>
  </Card.Body>
</Card>


            </Col>
          ))}
        </Row>
      ) : (
        <div className="no-assets"></div>
      )}
    </div>
  );
};

export default Home;