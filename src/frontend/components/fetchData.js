import { create } from 'ipfs-http-client';

const ipfsClient = create('https://ipfs.infura.io:5001/api/v0');

const fetchSongsData = async (ipfsHash) => {
    try {
        const res = await ipfsClient.cat(ipfsHash);
        const data = Buffer.from(res).toString();
        return JSON.parse(data);
    } catch (error) {
        console.error("Error fetching songs data from IPFS:", error);
        return [];
    }
};

const fetchUserData = async (ipfsHash) => {
    try {
        const res = await ipfsClient.cat(ipfsHash);
        const data = Buffer.from(res).toString();
        return JSON.parse(data);
    } catch (error) {
        console.error("Error fetching user data from IPFS:", error);
        return { users: [] };
    }
};