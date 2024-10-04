import React, { useEffect, useRef } from 'react';

const IpfsSender = ({ marketplace, nft, account }) => {
    const hasSentRequest = useRef(false);  // Create a ref to track if request has been sent

    // Function to send IPFS hash from localStorage to Flask server
    const sendIpfsHashToServer = () => {
        const ipfsHash = localStorage.getItem('songsIpfsHash'); // Get IPFS hash from localStorage

        // Ensure the IPFS hash is available
        if (!ipfsHash) {
            console.error('IPFS hash not found in localStorage');
            return;
        }

        // Send the IPFS hash to the Flask server using a POST request
        fetch('http://localhost:5000/update-ipfs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ipfsHash: ipfsHash, account: account }), // Send the IPFS hash as JSON
        })
        .then(response => response.json())
        .then(data => {
            console.log('IPFS hash sent to server:', data);
            // Now call the /predict endpoint after successfully sending the IPFS hash
            return fetch('http://localhost:5001/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ipfsHash: ipfsHash, account: account }), // Send the IPFS hash again for prediction
            });
        })
        .then(response => response.json())
        .then(predictionData => {
            console.log('Prediction response:', predictionData);
        })
        .catch(error => {
            console.error('Error sending IPFS hash to server:', error);
        });
    };

    // Fetch and send IPFS hash only when the component is mounted (once)
    useEffect(() => {
        if (!hasSentRequest.current) {
            sendIpfsHashToServer();  // Send the IPFS hash once
            hasSentRequest.current = true;  // Mark as sent to avoid running again
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    // Check if necessary props are passed (marketplace, nft, account)
    useEffect(() => {
        if (!marketplace || !nft || !account) {
            console.error('Marketplace, NFT, or account details not provided');
        } else {
            console.log('Marketplace, NFT, and account details:', { marketplace, nft, account });
        }
    }, [marketplace, nft, account]);

    return <div>IPFS Hash Sender</div>;
};

export default IpfsSender;
