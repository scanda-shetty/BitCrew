// LikedSongs.js
import React from 'react';
import { useUser } from './userContext';

const LikedSongs = () => {
  const { likedSongs } = useUser();

  return (
    <div>
      <h2>Your Liked Songs</h2>
      <ul>
        {likedSongs.map((songId) => (
          <li key={songId}>{songId}</li>
        ))}
      </ul>
    </div>
  );
};

export default LikedSongs;