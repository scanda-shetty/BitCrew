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
import MarketplaceAbi from '../contractsData/Marketplace.json';
import MarketplaceAddress from '../contractsData/Marketplace-address.json';
import NFTAbi from '../contractsData/NFT.json';
import NFTAddress from '../contractsData/NFT-address.json';
import { Spinner } from 'react-bootstrap';
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

  // MetaMask Login/Connect
  const web3Handler = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(accounts[0])
    // Get provider from Metamask
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    // Set signer
    const signer = provider.getSigner()

    window.ethereum.on('chainChanged', (chainId) => {
      window.location.reload();
    })

    window.ethereum.on('accountsChanged', async function (accounts) {
      setAccount(accounts[0])
      await web3Handler()
    })
    loadContracts(signer)
  }
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

  return (
    <BrowserRouter>
      <MusicPlayerProvider> {/* Wrap your entire app with MusicPlayerProvider */}
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
    </BrowserRouter>
  );
}

export default App;
