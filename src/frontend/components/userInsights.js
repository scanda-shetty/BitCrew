import React, { useEffect, useState } from 'react';

function UserInsights({ account }) {
  const [userData, setUserData] = useState({ artists: {}, genres: {} });

  useEffect(() => {
    const userListenData = JSON.parse(localStorage.getItem('userListenData')) || {};
    const userId = account;
    if (userListenData[userId]) {
      setUserData(userListenData[userId]);
    }
  }, [account]);

  const getTopItems = (items) => {
    return Object.entries(items).sort(([, a], [, b]) => b - a).slice(0, 5);
  };

  return (
    <div>
      <h2>Your Listening Insights</h2>
      <h3>Top Artists</h3>
      <ul>
        {getTopItems(userData.artists).map(([artist, count], index) => (
          <li key={index}>{artist}: {count} listens</li>
        ))}
      </ul>
      <h3>Top Genres</h3>
      <ul>
        {getTopItems(userData.genres).map(([genre, count], index) => (
          <li key={index}>{genre}: {count} listens</li>
        ))}
      </ul>
    </div>
  );
}

export default UserInsights;
