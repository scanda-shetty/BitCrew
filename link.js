// Function to send IPFS hash from localStorage to Flask server
function sendIpfsHashToServer() {
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
        body: JSON.stringify({ ipfsHash: ipfsHash }), // Send the IPFS hash as JSON
    })
    .then(response => response.json())
    .then(data => {
        console.log('IPFS hash sent to server:', data);
    })
    .catch(error => {
        console.error('Error sending IPFS hash to server:', error);
    });
}

// Call the function to send the IPFS hash
sendIpfsHashToServer();
