import { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { Row, Col, Card } from 'react-bootstrap';
import styles from './MyListedItems.module.css'; // Import the CSS module

export default function MyListedItems({ marketplace, nft, account }) {
  const [loading, setLoading] = useState(true);
  const [listedItems, setListedItems] = useState([]);
  const [soldItems, setSoldItems] = useState([]);

  const loadListedItems = async () => {
    setLoading(true);
    try {
      const itemCount = await marketplace.itemCount();
      let _listedItems = [];
      let _soldItems = [];

      for (let indx = 1; indx <= itemCount; indx++) {
        const i = await marketplace.items(indx);
        if (i.seller.toLowerCase() === account.toLowerCase()) {
          // get uri url from nft contract
          const uri = await nft.tokenURI(i.tokenId);
          // use uri to fetch the nft metadata stored on ipfs 
          const response = await fetch(uri);
          const metadata = await response.json();
          console.log(metadata)
          // get total price of item (item price + fee)
          const totalPrice = await marketplace.getTotalPrice(i.itemId);
          // Get listenCount for the item
          const listenCount = await marketplace.listenCount(i.itemId);

          // define listed item object
          let item = {
            totalPrice,
            price: i.price,
            itemId: i.itemId,
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
            listenCount: listenCount.toNumber() // Convert BigNumber to number
          };
          _listedItems.push(item);

          // Add listed item to sold items array if sold
          if (i.sold) _soldItems.push(item);
        }
      }
      setListedItems(_listedItems);
      setSoldItems(_soldItems);
    } catch (error) {
      console.error("Error loading listed items:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadListedItems();
  }, []);

  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>Loading...</h2>
    </main>
  );

  return (
    <div className={styles.container}>
      {listedItems.length > 0 ?
        <div>
          <h2 className={styles.title}>Listed</h2>
          <Row xs={1} md={2} lg={4} className="g-4 py-3">
            {listedItems.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card className={styles.card}>
                  <Card.Img variant="top" src={item.image} />
                  <Card.Footer className={styles.footer}>
                    <div>{ethers.utils.formatEther(item.totalPrice)} ETH</div>
                    <div>Listen Count: {item.listenCount}</div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
          {soldItems.length > 0 &&
            <>
              <h2 className={styles.title}>Sold</h2>
              {soldItems.map((item, idx) => (
                <Card key={idx} className={styles.card}>
                  {/* Render sold items */}
                </Card>
              ))}
            </>
          }
        </div>
        :
        <main style={{ padding: "1rem 0" }}>
          <h2>No listed assets</h2>
        </main>
      }
    </div>
  );
}


// import { useState, useEffect } from 'react';
// import { ethers } from "ethers";
// import { Row, Col, Card } from 'react-bootstrap';
// import styles from './MyListedItems.module.css'; // Import the CSS module

// export default function MyListedItems({ marketplace, nft, account }) {
//   const [loading, setLoading] = useState(true);
//   const [listedItems, setListedItems] = useState([]);
//   const [soldItems, setSoldItems] = useState([]);
//   const [royaltyData, setRoyaltyData] = useState(null);

//   const loadListedItems = async () => {
//     setLoading(true);
//     try {
//       const itemCount = await marketplace.itemCount();
//       let _listedItems = [];
//       let _soldItems = [];

//       for (let indx = 1; indx <= itemCount; indx++) {
//         const i = await marketplace.items(indx);
//         if (i.seller.toLowerCase() === account.toLowerCase()) {
//           // get uri url from nft contract
//           const uri = await nft.tokenURI(i.tokenId);
//           // use uri to fetch the nft metadata stored on ipfs 
//           const response = await fetch(uri);
//           const metadata = await response.json();
//           console.log(metadata)
//           // get total price of item (item price + fee)
//           const totalPrice = await marketplace.getTotalPrice(i.itemId);
//           // Get listenCount for the item
//           const listenCount = await marketplace.listenCount(i.itemId);

//           // Define listed item object
//           let item = {
//             totalPrice,
//             price: i.price,
//             itemId: i.itemId,
//             name: metadata.name,
//             description: metadata.description,
//             image: metadata.image,
//             listenCount: listenCount.toNumber() // Convert BigNumber to number
//           };
//           _listedItems.push(item);

//           // Add listed item to sold items array if sold
//           if (i.sold) _soldItems.push(item);
//         }
//       }
//       setListedItems(_listedItems);
//       setSoldItems(_soldItems);
//     } catch (error) {
//       console.error("Error loading listed items:", error);
//     }
//     setLoading(false);
//   };

//   const fetchRoyaltyData = async (artistName, streams) => {
//     try {
//       const response = await fetch(`http://localhost:5000/?artist_name=${encodeURIComponent(artistName)}&streams=${streams}`);
//       const data = await response.json();
//       console.log(data);
//       setRoyaltyData(data);
//     } catch (error) {
//       console.error("Error fetching royalty data:", error);
//     }
//   };

//   useEffect(() => {
//     loadListedItems();
//   }, []);

//   useEffect(() => {
//     if (listedItems.length > 0) {
//       // Assuming the first listed item's name corresponds to the artist name
//       const artistName = listedItems[0].name;
//       const streams = listedItems[0].listenCount; // Assuming listenCount represents the number of streams
//       console.log(artistName,streams)
//       fetchRoyaltyData(artistName, streams);
//     }
//   }, [listedItems]);

//   if (loading) return (
//     <main style={{ padding: "1rem 0" }}>
//       <h2>Loading...</h2>
//     </main>
//   );

//   return (
//     <div className={styles.container}>
//       {listedItems.length > 0 ?
//         <div>
//           <h2 className={styles.title}>Listed</h2>
//           <Row xs={1} md={2} lg={4} className="g-4 py-3">
//             {listedItems.map((item, idx) => (
//               <Col key={idx} className="overflow-hidden">
//                 <Card className={styles.card}>
//                   <Card.Img variant="top" src={item.image} />
//                   <Card.Footer className={styles.footer}>
//                     <div>{ethers.utils.formatEther(item.totalPrice)} ETH</div>
//                     <div>Listen Count: {item.listenCount}</div>
//                   </Card.Footer>
//                 </Card>
//               </Col>
//             ))}
//           </Row>
//           {royaltyData &&
//             <div>
//               <h2 className={styles.title}>Royalty</h2>
//               <div>Royalty Fee: {royaltyData.royalty[0].pr}</div>
//             </div>
//           }
//           {soldItems.length > 0 &&
//             <>
//               <h2 className={styles.title}>Sold</h2>
//               {soldItems.map((item, idx) => (
//                 <Card key={idx} className={styles.card}>
//                   {/* Render sold items */}
//                 </Card>
//               ))}
//             </>
//           }
//         </div>
//         :
//         <main style={{ padding: "1rem 0" }}>
//           <h2>No listed assets</h2>
//         </main>
//       }
//     </div>
//   );
// }
