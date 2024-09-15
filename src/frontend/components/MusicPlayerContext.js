import React, { createContext, useState, useContext } from 'react';

const MusicPlayerContext = createContext();

export const useMusicPlayer = () => useContext(MusicPlayerContext);

export const MusicPlayerProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [likedSongsByAccount, setLikedSongsByAccount] = useState({});

  return (
    <MusicPlayerContext.Provider value={{ currentSong, setCurrentSong, likedSongsByAccount, setLikedSongsByAccount }}>
      {children}
    </MusicPlayerContext.Provider>
  );
};
