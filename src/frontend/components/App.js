import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import Navigation from './Navbar';
import Home from './Home.js'
import Main from './Music.js'
import Create from './Create.js'
import CreateMusic from './CreateMusic.js'
import MyRoyalty from './MyRoyalty.js'
import MyListedItems from './MyListedItems.js'
import MyPurchases from './MyPurchases.js'
import MarketplaceAbi from '../contractsData/Marketplace.json'
import MarketplaceAddress from '../contractsData/Marketplace-address.json'
import NFTAbi from '../contractsData/NFT.json'
import NFTAddress from '../contractsData/NFT-address.json'
import { useState } from 'react'
import { ethers } from "ethers"
import { Spinner } from 'react-bootstrap'

import './App.css';

function App() {
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState(null)
  const [nft, setNFT] = useState({})
  const [marketplace, setMarketplace] = useState({})
  // MetaMask Login/Connect
    const web3Handler = async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
    
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
          setAccount(accounts[0]);
          await web3Handler();
        });
      } catch (error) {
        console.error(error);
        // Handle errors (e.g., user not connected to Sepolia, Metamask not installed)
      }
    };
    
  const loadContracts = async (signer) => {
    // Get deployed copies of contracts
    const marketplace = new ethers.Contract(MarketplaceAddress.address, MarketplaceAbi.abi, signer)
    setMarketplace(marketplace)
    const nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, signer)
    setNFT(nft)
    setLoading(false)
  }

  return (
    <BrowserRouter>
      <div className="App">
        <>
          <Navigation web3Handler={web3Handler} account={account} />
        </>
        <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
              <Spinner animation="border" style={{ display: 'flex' }} />
              <p className='mx-3 my-0'>Awaiting Metamask Connection...</p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={
                <Home />
              } />
              <Route path="/NFT" element={
                <Main marketplace={marketplace} nft={nft} />
              } />
              <Route path="/create" element={
                <CreateMusic marketplace={marketplace} nft={nft} />
              } />
              <Route path="/createNFT" element={
                <Create marketplace={marketplace} nft={nft} />
              } />
              <Route path="/MyRoyalty" element={
                <MyRoyalty marketplace={marketplace} nft={nft} account={account} />
              } />
              <Route path="/my-listed-items" element={
                <MyListedItems marketplace={marketplace} nft={nft} account={account} />
              } />
              <Route path="/my-purchases" element={
                <MyPurchases marketplace={marketplace} nft={nft} account={account} />
              } />
            </Routes>
          )}
        </div>
      </div>
    </BrowserRouter>

  );
}

export default App;
