import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import Marketplace from './contracts/Marketplace.json';

const RoleSelection = () => {
  const [currentAccount, setCurrentAccount] = useState('');
  const [role, setRole] = useState('');
  const [marketplace, setMarketplace] = useState(null);

  useEffect(() => {
    getAccount();
    loadContract();
  }, []);

  const getAccount = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(accounts[0]);
    } else {
      alert('Please install MetaMask');
    }
  };

  const loadContract = async () => {
    const web3 = new Web3(window.ethereum);
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = Marketplace.networks[networkId];
    const instance = new web3.eth.Contract(Marketplace.abi, deployedNetwork && deployedNetwork.address);
    setMarketplace(instance);
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
  };

  const submitRole = async () => {
    if (!role) {
      alert('Please select a role');
      return;
    }

    try {
      if (role === 'artist') {
        await marketplace.methods.grantArtistRole(currentAccount).send({ from: currentAccount });
        alert('Artist role granted');
      } else if (role === 'listener') {
        await marketplace.methods.grantListenerRole(currentAccount).send({ from: currentAccount });
        alert('Listener role granted');
      }
    } catch (error) {
      console.error('Error granting role:', error);
      alert('Error granting role');
    }
  };

  return (
    <div>
      <h2>Select your role</h2>
      <select value={role} onChange={handleRoleChange}>
        <option value="">Select Role</option>
        <option value="artist">Artist</option>
        <option value="listener">Listener</option>
      </select>
      <button onClick={submitRole}>Submit Role</button>
    </div>
  );
};

export default RoleSelection;
