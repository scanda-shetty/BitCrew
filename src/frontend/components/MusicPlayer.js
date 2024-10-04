import React, { useState, useEffect, useRef } from 'react';
import './MusicPlayer.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faVolumeUp, faVolumeMute } from '@fortawesome/free-solid-svg-icons';

const MusicPlayer = ({ song, onListen }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef(new Audio(song.audio));
  const cumulativeListenTimeRef = useRef(0); // Track cumulative listen time
  const lastUpdateTimeRef = useRef(0); // Keep track of the last update time
  const hasListenedEnoughRef = useRef(false); // Track if the 50% listen mark has been reached

  useEffect(() => {
    const audio = audioRef.current;
    audio.src = song.audio;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
    };

    return () => {
      audio.pause();
    };
  }, [song]);

  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      if (isPlaying && !hasListenedEnoughRef.current) {
        const elapsedTime = audio.currentTime - lastUpdateTimeRef.current;

        // Only accumulate if user didn't skip
        if (elapsedTime > 0) {
          cumulativeListenTimeRef.current += elapsedTime;
        }

        lastUpdateTimeRef.current = audio.currentTime;

        // Check if cumulative listen time exceeds 50% of the song duration
        if (cumulativeListenTimeRef.current >= duration * 0.5 && !hasListenedEnoughRef.current) {
          onListen(song.id);
          hasListenedEnoughRef.current = true; // Prevent further increments
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [isPlaying, duration, onListen, song.id]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
      lastUpdateTimeRef.current = audio.currentTime; // Set the reference for the time tracking
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    audio.currentTime = e.target.value;

    // Reset the last update time when seeking, so we don't count skipped parts
    lastUpdateTimeRef.current = audio.currentTime;
    setCurrentTime(audio.currentTime);
  };

  const handleVolumeChange = (e) => {
    const audio = audioRef.current;
    audio.volume = e.target.value;
    setVolume(audio.volume);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="music-player">
      <div className="music-player-info">
        <img src={song.thumbnail} alt="Thumbnail" className="music-player-thumbnail" />
        <div>
          <p>{song.songName}</p>
          <p>{song.artistName}</p>
        </div>
      </div>
      <div className="music-player-controls">
        <button onClick={togglePlayPause}>
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
        </button>
        <span>{formatTime(currentTime)}</span>
        <input 
          type="range" 
          value={currentTime} 
          max={duration} 
          onChange={handleSeek} 
        />
        <span>{formatTime(duration)}</span>
        <button onClick={() => setVolume(volume === 0 ? 1 : 0)}>
          <FontAwesomeIcon icon={volume === 0 ? faVolumeMute : faVolumeUp} />
        </button>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={volume} 
          onChange={handleVolumeChange} 
        />
      </div>
    </div>
  );
};

export default MusicPlayer;