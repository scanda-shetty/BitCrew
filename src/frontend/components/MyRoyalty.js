import { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { Row, Col, Card } from 'react-bootstrap';
import styles from './MyListedItems.module.css'; // Import the CSS module

export default function MyRoyalty({ marketplace, nft, account }) {
  const [loading, setLoading] = useState(true);
  const [royalty, setRoyalty] = useState(null); // State to store royalty data

  useEffect(() => {
    const fetchRoyalty = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/'); // Fetch data from API endpoint
        const data = await response.json(); // Extract JSON data from response
        console.log(response)
        setRoyalty(data.royalty[0].pr); // Update royalty state with fetched data
        setLoading(false); // Set loading to false
        
      } catch (error) {
        console.error("Error fetching royalty data:", error);
        setLoading(false); // Set loading to false in case of error
      }
    };

    fetchRoyalty(); // Call the fetchRoyalty function when the component mounts
  }, []);

  if (loading) return <main style={{ padding: "1rem 0" }}>Loading...</main>;

  return (
    <div className={styles.container}>
      <div className={styles.royaltyContainer}>
        {royalty !== null ? (
          <div>
            <h2 className={styles.title}>Royalty</h2>
            <div className={styles.royalty}>{royalty}</div> {/* Display royalty data */}
          </div>
        ) : (
          <main style={{ padding: "1rem 0" }}>No royalty data available</main>
        )}
      </div>
    </div>
  );
}
