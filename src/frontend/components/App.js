// App.js

import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom';
import Navigation from './Navbar';
import Home from './Home.js';
import Main from './Music.js';
import Create from './Create.js';
import CreateMusic from './CreateMusic.js';
import MyRoyalty from './MyRoyalty.js';
import MyListedItems from './MyListedItems.js';
import MyPurchases from './MyPurchases.js';
import PreferencesModal from './PreferencesModal.js'; // Adjusted import path for PreferencesModal
import MarketplaceAbi from '../contractsData/Marketplace.json';
import MarketplaceAddress from '../contractsData/Marketplace-address.json';
import NFTAbi from '../contractsData/NFT.json';
import NFTAddress from '../contractsData/NFT-address.json';
import { Spinner, Modal, Button } from 'react-bootstrap';
import { ethers } from 'ethers';
import { MusicPlayerProvider } from './MusicPlayerContext';
import './App.css';
import axios from 'axios';

function App() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [nft, setNFT] = useState({});
  const [marketplace, setMarketplace] = useState({});
  const [songs, setSongs] = useState([]);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [preferencesSet, setPreferencesSet] = useState(false);
  const [usersData, setUsersData] = useState({ users: [] }); // State to hold users' data
  
  const pinataApiKey = process.env.REACT_APP_PINATA_API_KEY;
  const pinataSecretApiKey = process.env.REACT_APP_PINATA_SECRET_API_KEY;
  // MetaMask Login/Connect
  const web3Handler = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const currentAccount = accounts[0];
      setAccount(currentAccount);

      // Check if preferences are already set for the current account
      const preferencesAlreadySet = localStorage.getItem(`${currentAccount}_preferencesSet`);
      if (!preferencesAlreadySet) {
        // Show preferences modal if preferences are not set for this account
        setShowPreferencesModal(true);
      } else {
        // Preferences already set, update state
        setPreferencesSet(true);
      }

      // Define Sepolia network parameters
      const sepoliaChainId = '0xaa36a7'; // Hexadecimal for 11155111

      // Get current network
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const { chainId } = await provider.getNetwork();

      // Check if the current network is Sepolia
      if (chainId !== 11155111) {
        try {
          // Request to switch to Sepolia network
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: sepoliaChainId }],
          });
          // Reload the page to ensure network switch
          window.location.reload();
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: sepoliaChainId,
                    chainName: 'Sepolia Test Network',
                    rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/2-I7Mtl9ILKCburtDvBjD1lhuGKf3XxK'], // Replace with your RPC URL
                    nativeCurrency: {
                      name: 'Sepolia Ether',
                      symbol: 'SEP',
                      decimals: 18,
                    },
                    blockExplorerUrls: ['https://sepolia.etherscan.io'],
                  },
                ],
              });
              // Reload the page to ensure network switch
              window.location.reload();
            } catch (addError) {
              console.error(addError);
              // Handle the error of not being able to add the network
            }
          } else {
            console.error(switchError);
            // Handle other errors (e.g., user rejected the request)
          }
        }
      } else {
        // Set signer if already on Sepolia
        const signer = provider.getSigner();
        loadContracts(signer);
      }

      window.ethereum.on('chainChanged', (chainId) => {
        window.location.reload();
      });

      window.ethereum.on('accountsChanged', async function (accounts) {
        const newAccount = accounts[0];
        setAccount(newAccount);
        // Reset preferencesSet state and check again for new account
        setPreferencesSet(false);

        // Check if preferences are already set for the new account
        const preferencesAlreadySet = localStorage.getItem(`${newAccount}_preferencesSet`);
        if (!preferencesAlreadySet) {
          // Show preferences modal if preferences are not set for this account
          setShowPreferencesModal(true);
        } else {
          // Preferences already set, update state
          setPreferencesSet(true);
        }

        await web3Handler();
      });
    } catch (error) {
      console.error(error);
      // Handle errors (e.g., user not connected to Sepolia, Metamask not installed)
    }
  };

  const loadContracts = async (signer) => {
    // Get deployed copies of contracts
    const marketplace = new ethers.Contract(MarketplaceAddress.address, MarketplaceAbi.abi, signer);
    setMarketplace(marketplace);
    const nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, signer);
    setNFT(nft);
    setLoading(false);
  };

  useEffect(() => {
    web3Handler();
  }, []);

  useEffect(() => {
    fetchExistingData();
  }, []);

  const fetchExistingData = async () => {
    const existingIpfsHash = localStorage.getItem('songsIpfsHash');
    if (!existingIpfsHash) {
      console.log('No existing IPFS hash found in local storage.');
      return;
    }

    console.log('Existing IPFS hash from local storage:', existingIpfsHash);
    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${existingIpfsHash}`);
      if (response.data) {
        setSongs(response.data);
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  const handlePreferencesSubmit = async (preferencesData) => {
    try {
      // Store preferences (can be stored locally or in backend)
      localStorage.setItem(`${account}_preferencesSet`, true);
      setPreferencesSet(true);
    // Store preferencesData in localStorage
     localStorage.setItem(`${account}_preferencesData`, JSON.stringify(preferencesData));
      console.log('Stored preferences:', preferencesData);

      // Store user details (account address for example)
      localStorage.setItem('userAccount', account);
  
      // Prepare user data for IPFS storage
      const userData = {
        userId: account,
        preferences: preferencesData,
        songsLiked: getStoredLikedSongs() || []  // Initialize with an empty array or fetch existing liked songs
      };
  
      // Update user data on IPFS
      await updateUserDataOnIPFS(userData);
  
      // Close modal
      setShowPreferencesModal(false);
    } catch (error) {
      console.error('Failed to store preferences:', error);
      // Handle error
    }
  };

  const getStoredLikedSongs = () => {
    const storedLikedSongs = localStorage.getItem('likedSongs');
    return storedLikedSongs ? JSON.parse(storedLikedSongs) : [];
  };

 
    

  const updateUserDataOnIPFS = async (updatedUserData) => {
    try {
      let usersData = []; // Initialize with an empty array to hold users

      // Fetch existing users data from localStorage or IPFS
      const usersIpfsHash = localStorage.getItem('usersIpfsHash');
      if (usersIpfsHash) {
          const existingUsersResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${usersIpfsHash}`);
          usersData = existingUsersResponse.data.users || []; // Ensure to get the users array
      }
      const existingUserIndex = usersData.findIndex(user => user.userId === updatedUserData.userId);
  
      if (existingUserIndex !== -1) {
        // Update existing user data
        usersData[existingUserIndex] = updatedUserData;
      } else {
        // Add new user data if user does not exist
        usersData.push(updatedUserData);
      }
  
      const dataToSave = { users: usersData };

      // Post updated data to IPFS
      const updatedUsersResponse = await axios.post(`https://api.pinata.cloud/pinning/pinJSONToIPFS`, dataToSave, {
          headers: {
              'Content-Type': 'application/json',
              'pinata_api_key': pinataApiKey,
              'pinata_secret_api_key': pinataSecretApiKey,
          },
      });

      // Update localStorage with new IPFS hash
      localStorage.setItem('usersIpfsHash', updatedUsersResponse.data.IpfsHash);

      console.log("Updated user data on IPFS:", updatedUsersResponse.data);
  } catch (error) {
      console.error("Error updating user data on IPFS:", error);
  }
};

  const resetPreferences = () => {
    try {
      // Check if preferences are already cleared for the current account
      const preferencesAlreadyCleared = localStorage.getItem(`${account}_preferencesCleared`);
      if (!preferencesAlreadyCleared) {
        localStorage.removeItem(`${account}_preferencesSet`);
        localStorage.removeItem(`${account}_preferencesData`);
        localStorage.setItem(`${account}_preferencesCleared`, true); // Mark preferences as cleared
        setPreferencesSet(false);
        console.log('Preferences cleared.');
      } else {
        console.log('Preferences already cleared for this account.');
      }
    } catch (error) {
      console.error('Failed to clear preferences:', error);
    }
  };

  return (
    <BrowserRouter>
      <MusicPlayerProvider>
        <div className="App">
          <Navigation web3Handler={web3Handler} account={account} />
          <div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <Spinner animation="border" style={{ display: 'flex' }} />
                <p className="mx-3 my-0">Awaiting Metamask Connection...</p>
              </div>
            ) : (
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/NFT" element={<Main marketplace={marketplace} nft={nft} />} />
                <Route path="/create" element={<CreateMusic marketplace={marketplace} nft={nft} />} />
                <Route path="/create-nft/:songId" element={<Create marketplace={marketplace} nft={nft} account={account} songs={songs} />} />
                <Route path="/my-listed-items" element={<MyListedItems marketplace={marketplace} nft={nft} account={account} />} />
                <Route path="/my-purchases" element={<MyPurchases marketplace={marketplace} nft={nft} account={account} />} />
              </Routes>
            )}
          </div>
        </div>
      </MusicPlayerProvider>

      {/* Preferences Modal */}
      <Modal show={showPreferencesModal} onHide={() => setShowPreferencesModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Set Your Preferences</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PreferencesModal onSubmit={handlePreferencesSubmit} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreferencesModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Button variant="danger" onClick={resetPreferences}>
            Reset Preferences
          </Button>
    </BrowserRouter>
  );
}

export default App;

