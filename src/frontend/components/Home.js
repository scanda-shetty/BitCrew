import React, { useState, useEffect } from "react";
import axios from 'axios';
import MusicPlayer from './MusicPlayer';
import { useMusicPlayer } from './MusicPlayerContext';
import './Home.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


const pinataApiKey = process.env.REACT_APP_PINATA_API_KEY;
const pinataSecretApiKey = process.env.REACT_APP_PINATA_SECRET_API_KEY;





function Home() {
  const [songs, setSongs] = useState([]);
  const [likedSongsByAccount, setLikedSongsByAccount] = useState({});
  const { currentSong, setCurrentSong } = useMusicPlayer();
  const [currentAccount, setCurrentAccount] = useState('');
  const [streamedSongsByAccount, setStreamedSongsByAccount] = useState({});
  const [groupedByLanguage, setGroupedByLanguage] = useState({});
  const [groupedByGenre, setGroupedByGenre] = useState({});
  const [groupedByArtist, setGroupedByArtist] = useState({});
  const [trendingSongs, setTrendingSongs] = useState([]);
  const ITEMS_PER_PAGE = 7; // Number of songs to show per page
// // Load liked songs and streamed songs from localStorage

const [currentPages, setCurrentPages] = useState({
  trending: 0,
  language: {},
  genre: {},
  artist: {},
});


useEffect(() => {
  const getLikedSongs = () => {
    const storedLikedSongs = localStorage.getItem('likedSongs');
    return storedLikedSongs ? JSON.parse(storedLikedSongs) : {};
  };

  const getStreamedSongs = () => {
    const storedStreamedSongs = localStorage.getItem('streamedSongs');
    return storedStreamedSongs ? JSON.parse(storedStreamedSongs) : {};
  };

  setLikedSongsByAccount(getLikedSongs());
  setStreamedSongsByAccount(getStreamedSongs());


}, []);

  useEffect(() => {
    async function fetchAccount() {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setCurrentAccount(accounts[0]);
        } catch (error) {
          console.error("Error fetching MetaMask account:", error);
        }
      }
    }

    fetchAccount();
  

    // Listen for account changes
    window.ethereum.on('accountsChanged', (accounts) => {
      setCurrentAccount(accounts[0]);
    });
  }, []);

  useEffect(() => {
    if (currentAccount) {
      fetchSongsFromPinata();
      initializeLikedSongs();
      
    }
  }, [currentAccount]);

  const fetchSongsFromPinata = async () => {
    const songsIpfsHash = localStorage.getItem('songsIpfsHash');
    if (!songsIpfsHash) {
      console.error("No IPFS hash found in local storage.");
      return;
    }

    console.log('Fetching songs using IPFS hash:', songsIpfsHash);

    try {
      const metadataResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${songsIpfsHash}`);
      let metadata = metadataResponse.data;

      // Initialize userLiked state based on stored liked songs by the current MetaMask account
      metadata = metadata.map(song => ({
        ...song,
        likesCount: song.likesCount || 0,
        userLiked: likedSongsByAccount[currentAccount] ? likedSongsByAccount[currentAccount].some(s => s.id === song.id) : false
      }));

      console.log('Fetched songs metadata:', metadata);

      setSongs(metadata);
      groupSongs(metadata);
      setTrendingSongs(getTopTrendingSongs(metadata));
      await updateLikesOnIPFS(metadata);
    } catch (error) {
      console.error("Error fetching songs from Pinata:", error);
    }
  };

  const updateLikesOnIPFS = async (updatedSongs) => {
    try {
      const updatedMetadataResponse = await axios.post(`https://api.pinata.cloud/pinning/pinJSONToIPFS`, updatedSongs, {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretApiKey,
        },
      });
      console.log("Updated metadata on IPFS:", updatedMetadataResponse.data);

      localStorage.setItem('songsIpfsHash', updatedMetadataResponse.data.IpfsHash);
    } catch (error) {
      console.error("Error updating likes count on IPFS:", error);
    }
  };

  const playSong = async (song) => {
    setCurrentSong(song);
  };
  const updateStreamedSongs = async (song) => {
    const existingStreamedSongs = JSON.parse(localStorage.getItem('streamedSongs')) || {};
    const updatedStreamedSongs = { ...existingStreamedSongs };
  
    if (!updatedStreamedSongs[currentAccount]) {
      updatedStreamedSongs[currentAccount] = [];
    }
  
    // Add the streamed song if not already present
    if (!updatedStreamedSongs[currentAccount].find(s => s.id === song.id)) {
      updatedStreamedSongs[currentAccount].push(song);
    }
  
    setStreamedSongsByAccount(updatedStreamedSongs);
    localStorage.setItem('streamedSongs', JSON.stringify(updatedStreamedSongs));
  
    // Update user data on IPFS with the new streamed songs
    const userData = {
      userId: currentAccount,
      preferences: getStoredPreferences(), // Include other preferences if needed
      songsLiked: likedSongsByAccount[currentAccount] || [],
      songsStreamed: updatedStreamedSongs[currentAccount] || []
    };
  
    // Update user data on IPFS
    await updateUserDataOnIPFS(userData);
  };
  
  const updateListenCountOnIPFS = async (songId, listenCount) => {
    try {
      const songsIpfsHash = localStorage.getItem('songsIpfsHash');
      const metadataResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${songsIpfsHash}`);
      let metadata = metadataResponse.data;

      metadata = metadata.map(song => {
        if (song.id === songId) {
          return { ...song, listenCount };
        }
        return song;
      });

      console.log('Updated metadata:', metadata);

      const updatedMetadataResponse = await axios.post(`https://api.pinata.cloud/pinning/pinJSONToIPFS`, metadata, {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretApiKey,
        },
      });
      console.log("Updated metadata on IPFS:", updatedMetadataResponse.data);

      localStorage.setItem('songsIpfsHash', updatedMetadataResponse.data.IpfsHash);
      setSongs(metadata);
    } catch (error) {
      console.error("Error updating listen count on IPFS:", error);
    }
  };

  const getListenCountFromStorage = (songId) => {
    const listenCountStr = localStorage.getItem(`listenCount_${songId}`);
    return listenCountStr ? parseInt(listenCountStr) : 0;
  };

  const updateListenCountInStorage = (songId, listenCount) => {
    localStorage.setItem(`listenCount_${songId}`, listenCount.toString());
  };

  const initializeLikedSongs = () => {
    // Initialize likedSongsByAccount from localStorage if available
    const storedLikedSongs = localStorage.getItem('likedSongs');
    if (storedLikedSongs) {
      setLikedSongsByAccount(JSON.parse(storedLikedSongs));
      updateSongsWithLikes();
    }
  };

  const updateSongsWithLikes = () => {
    setSongs(prevSongs =>
      prevSongs.map(song => ({
        ...song,
        userLiked: likedSongsByAccount[currentAccount] ? likedSongsByAccount[currentAccount].some(s => s.id === song.id) : false
      }))
    );
  };

  const updateLikedSongs = async (song, userLiked) => {
    const updatedLikedSongs = { ...likedSongsByAccount };

    if (!updatedLikedSongs[currentAccount]) {
      updatedLikedSongs[currentAccount] = [];
    }

    if (userLiked && !updatedLikedSongs[currentAccount].find(s => s.id === song.id)) {
      updatedLikedSongs[currentAccount].push(song);
    } else if (!userLiked) {
      updatedLikedSongs[currentAccount] = updatedLikedSongs[currentAccount].filter(s => s.id !== song.id);
    }

    setLikedSongsByAccount(updatedLikedSongs);
    localStorage.setItem('likedSongs', JSON.stringify(updatedLikedSongs));
    updateSongsWithLikes(); // Update the songs with the new liked status

    // Update user data on IPFS with the new liked songs
    const userData = {
      userId: currentAccount,
      preferences: getStoredPreferences(), // Include other preferences if needed
      songsLiked: updatedLikedSongs[currentAccount] || [],
      songsStreamed: streamedSongsByAccount[currentAccount] || []
      
    };

    // Update user data on IPFS
    await updateUserDataOnIPFS(userData);
  };

  const getStoredPreferences = () => {
    const storedPreferences = localStorage.getItem(`${currentAccount}_preferencesData`);
    return storedPreferences ? JSON.parse(storedPreferences) : {};
  };

  const likeSong = async (songId) => {
    try {
      const songToLike = songs.find(song => song.id === songId);
      if (!songToLike) {
        console.error(`Song with ID ${songId} not found.`);
        return;
      }

      const userLiked = !likedSongsByAccount[currentAccount] || !likedSongsByAccount[currentAccount].find(s => s.id === songId);

      const updatedSongs = songs.map(song => {
        if (song.id === songId) {
          return {
            ...song,
            likesCount: userLiked ? song.likesCount + 1 : song.likesCount - 1,
            userLiked: userLiked
          };
        }
        return song;
      });

      setSongs(updatedSongs);
      updateLikedSongs(songToLike, userLiked);
      await updateLikesOnIPFS(updatedSongs);
    } catch (error) {
      console.error("Error updating like count:", error);
    }
  };

  const resetLikes = async () => {
    try {
      // Step 1: Reset likedSongsByAccount state and localStorage
      setLikedSongsByAccount({});
      localStorage.removeItem('likedSongs');

      // Step 2: Update songs metadata on IPFS with reset likes count
      const resetSongs = songs.map(song => ({
        ...song,
        likesCount: 0,
        listenCount:0
      }));
      console.log("resetSongs",resetSongs);
      setSongs(resetSongs);
      await updateLikesOnIPFS(resetSongs);
    } catch (error) {
      console.error("Error resetting likes:", error);
    }
  };

  const handleListen = async (songId) => {
    const song = songs.find(s => s.id === songId);

    if (song) {
      const newListenCount = (song.listenCount || 0) + 1;
      await updateListenCountOnIPFS(songId, newListenCount);
      await updateStreamedSongs(song);
    }
  };

 // Example of how to manage user data with multiple users in a structured way

const updateUserDataOnIPFS = async (updatedUserData) => {
  try {
      let usersData = []; // Initialize with an empty array to hold users

      // Fetch existing users data from localStorage or IPFS
      const usersIpfsHash = localStorage.getItem('usersIpfsHash');
      if (usersIpfsHash) {
          const existingUsersResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${usersIpfsHash}`);
          usersData = existingUsersResponse.data.users || []; // Ensure to get the users array
      }

      // Find index of existing user data, if it exists
      const existingUserIndex = usersData.findIndex(user => user.userId === updatedUserData.userId);

      // Prepare simplified song data for storage (only include necessary details)
      const simplifiedSongsLiked = updatedUserData.songsLiked.map(song => ({
          id: song.id,
          songName: song.songName,
          artistName: song.artistName,
          thumbnail: song.thumbnail,
          audio :song.audio,
          genre: song.genre || "easy listening",
          language: song.language || "English"
      }));

      const simplifiedSongsStreamed = updatedUserData.songsStreamed.map(song => ({
        id: song.id,
        songName: song.songName,
        artistName: song.artistName,
        thumbnail: song.thumbnail,
        audio: song.audio,
        genre: song.genre || "easy listening",
        language: song.language || "English"
      }));

      // Update user data for IPFS
      const userDataForIPFS = {
          userId: updatedUserData.userId,
          preferences: updatedUserData.preferences,
          songsLiked: simplifiedSongsLiked,
          songsStreamed: simplifiedSongsStreamed
      };

      if (existingUserIndex !== -1) {
          // Update existing user data
          usersData[existingUserIndex] = userDataForIPFS;
      } else {
          // Add new user data if user does not exist (this should typically not happen unless managing new users)
          usersData.push(userDataForIPFS);
      }

      // Prepare data object to be saved on IPFS
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


const getTopTrendingSongs = (songs) => {
  return songs
    .sort((a, b) => (b.likesCount + b.listenCount) - (a.likesCount + a.listenCount))
    .slice(0, 10);
};

const groupSongs = (songs) => {
  const languageGroups = {};
  const genreGroups = {};
  const artistGroups = {};

  songs.forEach(song => {
    if (!languageGroups[song.songLanguage]) {
      languageGroups[song.songLanguage] = [];
    }
    languageGroups[song.songLanguage].push(song);

    if (!genreGroups[song.genre]) {
      genreGroups[song.genre] = [];
    }
    genreGroups[song.genre].push(song);

    if (!artistGroups[song.artistName]) {
      artistGroups[song.artistName] = [];
    }
    artistGroups[song.artistName].push(song);
  });

  setGroupedByLanguage(languageGroups);
  setGroupedByGenre(genreGroups);
  setGroupedByArtist(artistGroups);
};

useEffect(() => {
  // Recompute derived data whenever songs change
  setTrendingSongs(getTopTrendingSongs(songs));
  groupSongs(songs)
  
}, [songs]);

const handlePageChange = (section, direction) => {
  setCurrentPages(prev => {
    const newPages = { ...prev };
    const totalSongs = section === 'trending' ? trendingSongs.length : 
                       groupedByLanguage[section]?.length || 
                       groupedByGenre[section]?.length || 
                       groupedByArtist[section]?.length || 0;
    const currentPage = newPages[section] || 0;

    if (direction === 'next') {
      const nextPage = currentPage + 1;
      if (nextPage * ITEMS_PER_PAGE < totalSongs || 
          (nextPage * ITEMS_PER_PAGE >= totalSongs && totalSongs > ITEMS_PER_PAGE)) {
        newPages[section] = nextPage;
      }
    } else {
      newPages[section] = currentPage > 0 ? currentPage - 1 : 0;
    }

    return newPages;
  });
};




// Function to get a random title format
const getRandomTitle = (type, name) => {

  const titleFormats = {
    artist: [
      'Top Picks by {name}',
      'Highlights of {name}',
      'Best of {name}',
      'Featured Tracks by {name}',
      'Spotlight on {name}',
    ],
    language: [
      'Top Songs in {name}',
      'Best Tracks in {name}',
      'Highlights of {name}',
      'Popular Songs in {name}',
      'Featured Picks in {name}',
    ],
    collaboration: [
      `Collaborative Hits`,
      `Featuring ${name}`,
      `Best Collaborations`,
      `Top Duets with ${name}`,
    ],
  };

  const formats = titleFormats[type] || [];
  if (formats.length === 0) {
    // Return a default title if no formats are available
    return ` ${name}`;
  }
  const randomFormat = formats[Math.floor(Math.random() * formats.length)];
  return randomFormat.replace('{name}', name);
};

// Helper function to get unique songs
const getUniqueSongs = (songs) => {
  const seen = new Set();
  return songs.filter(song => {
    const isDuplicate = seen.has(song.id);
    seen.add(song.id);
    return !isDuplicate;
  });
};



const renderSection = (type, name, songs, sectionKey) => {
  const title = getRandomTitle(type, name);
  const currentPage = currentPages[sectionKey] || 0;
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const uniqueSongs = getUniqueSongs(songs);
  // Calculate the items to display
  const paginatedSongs = uniqueSongs.slice(startIndex, endIndex);
  if (paginatedSongs.length ==0) return null;
  // If there are fewer items left, include them with previous page items
  if (paginatedSongs.length < ITEMS_PER_PAGE && startIndex > 0) {
    const previousPageStart = Math.max(startIndex - ITEMS_PER_PAGE, 0);
    const previousPageItems = songs.slice(previousPageStart, startIndex);
    paginatedSongs.unshift(...previousPageItems.slice(0, ITEMS_PER_PAGE - paginatedSongs.length));
  }

  return (
    <div className={`section ${sectionKey}`}>
      <h2 className="headtitle">{title}</h2>
      <div className="pagination-header">
        <i
          className={`icon fas fa-chevron-left ${currentPage === 0 ? 'disabled' : ''}`}
          onClick={() => handlePageChange(sectionKey, 'prev')}
        ></i>
        <div className="playlist">
          {paginatedSongs.map((song) => (
            <div className="playlist-item" key={song.id}>
              <img src={song.thumbnail} alt="Thumbnail" className="song-thumbnail" />
              <div className="song-info">
                <p className="song-title">{song.songName}</p>
                <p className="song-artist">{song.artistName}</p>
                <p className="song-listen-count">Listens: {song.listenCount}</p>
                <p className="song-likes-count">Likes: {song.likesCount}</p>
              </div>
              <div className="button-group">
                <button className="like-button" onClick={() => likeSong(song.id)}>
                  <i className={likedSongsByAccount[currentAccount] && likedSongsByAccount[currentAccount].find(s => s.id === song.id) ? 'fas fa-heart' : 'far fa-heart'}></i>
                </button>
                <button className="play-button" onClick={() => { playSong(song); }}>
                  <i className="fas fa-play"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
        <i
          className={`icon fas fa-chevron-right ${((currentPage + 1) * ITEMS_PER_PAGE >= songs.length) ? 'disabled' : ''}`}
          onClick={() => handlePageChange(sectionKey, 'next')}
        ></i>
      </div>
    </div>
  );
};



// Helper function to check if a song is collaborative
const isCollaborative = (song) => song.artistName.includes(',');

// Filter and deduplicate collaborative songs
const getCollaborativeSongs = (songs) => {
  const seen = new Set();
  return songs.filter(song => {
    const isDuplicate = seen.has(song.id);
    seen.add(song.id);
    return isCollaborative(song) && !isDuplicate;
  });
};

// Get non-collaborative songs
const getNonCollaborativeSongs = (songs) => {
  const seen = new Set();
  return songs.filter(song => {
    const isDuplicate = seen.has(song.id);
    seen.add(song.id);
    return !isCollaborative(song) && !isDuplicate;
  });
};

// Prepare non-collaborative and collaborative songs
const nonCollaborativeTrendingSongs = getNonCollaborativeSongs(trendingSongs);
const nonCollaborativeByLanguage = Object.fromEntries(
  Object.entries(groupedByLanguage).map(([lang, songs]) => [lang, getNonCollaborativeSongs(songs)])
);
const nonCollaborativeByArtist = Object.fromEntries(
  Object.entries(groupedByArtist).map(([artist, songs]) => [artist, getNonCollaborativeSongs(songs)])
);
const collaborativeSongs = [
  ...getCollaborativeSongs(trendingSongs),
  ...Object.values(groupedByLanguage).flatMap(getCollaborativeSongs),
  ...Object.values(groupedByArtist).flatMap(getCollaborativeSongs),
];

return (
  <div className="App">
    <h1>Welcome to Swar</h1>
    <div className="home-container">
      {renderSection('trending', 'Trending', trendingSongs, 'trending')}
      {Object.keys(groupedByLanguage).map((language) =>
        <div key={language}>{renderSection('language', language, groupedByLanguage[language], `language-${language.toLowerCase()}`)}</div>
      )}
    
    {Object.keys(nonCollaborativeByArtist).map((artist) =>
        <div key={artist}>{renderSection('artist', artist, nonCollaborativeByArtist[artist], `Best Of ${artist}`)}</div>
      )}
      {collaborativeSongs.length > 0 && renderSection('collaboration', 'collaboration', collaborativeSongs, 'Collaborations')}

    </div>
    <br />
    <br />
    <div className="now-playing">
      <h2>Now Playing..</h2>
      {currentSong && <MusicPlayer song={currentSong}  onListen={handleListen} />}
    </div>
  </div>
);
}

export default Home;