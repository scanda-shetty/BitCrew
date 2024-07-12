// MusicPlayerContext.js
import React, { createContext, useState, useContext } from 'react';

const MusicPlayerContext = createContext();

export const useMusicPlayer = () => useContext(MusicPlayerContext);

export const MusicPlayerProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);

  return (
    <MusicPlayerContext.Provider value={{ currentSong, setCurrentSong }}>
      {children}
    </MusicPlayerContext.Provider>
  );
};
