// UserContext.js
import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState('');
  const [preferences, setPreferences] = useState([]);
  const [likedSongs, setLikedSongs] = useState([]);

  return (
    <UserContext.Provider value={{ userId, setUserId, preferences, setPreferences, likedSongs, setLikedSongs }}>
      {children}
    </UserContext.Provider>
  );
};