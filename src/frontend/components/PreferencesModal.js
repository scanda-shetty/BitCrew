import React, { useState } from 'react';
import { Form, Button, ToggleButton, ToggleButtonGroup, Badge } from 'react-bootstrap';

const genreOptions = ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Classical','Country','Folk','Disco','Kpop','Romance','Vocal','Experimental','Easy listening'];
const languageOptions = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Kannada', 'Telugu', 'Hindi','Marathi','Tamil','Malyalam','Bengali','Punjabi'];

const PreferencesModal = ({ onSubmit }) => {
  const [preferencesData, setPreferencesData] = useState({
    favoriteGenres: [],
    favoriteArtist: '',
    languages: [],
  });

  const handleGenreToggle = (genre) => {
    const isSelected = preferencesData.favoriteGenres.includes(genre);
    if (isSelected) {
      const updatedGenres = preferencesData.favoriteGenres.filter((g) => g !== genre);
      setPreferencesData({ ...preferencesData, favoriteGenres: updatedGenres });
    } else {
      const updatedGenres = [...preferencesData.favoriteGenres, genre];
      setPreferencesData({ ...preferencesData, favoriteGenres: updatedGenres });
    }
  };

  const handleLanguageToggle = (language) => {
    const isSelected = preferencesData.languages.includes(language);
    if (isSelected) {
      const updatedLanguages = preferencesData.languages.filter((l) => l !== language);
      setPreferencesData({ ...preferencesData, languages: updatedLanguages });
    } else {
      const updatedLanguages = [...preferencesData.languages, language];
      setPreferencesData({ ...preferencesData, languages: updatedLanguages });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(preferencesData); // Call onSubmit prop with preferencesData
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group controlId="favoriteGenres">
        <Form.Label>Select Favorite Genres</Form.Label>
        <div className="d-flex flex-wrap">
          {genreOptions.map((genre) => (
            <Badge
              key={genre}
              pill
              bg={preferencesData.favoriteGenres.includes(genre) ? 'primary' : 'light'}
              text="dark" // Ensure text color is dark
              className="m-1 clickable genre-badge"
              onClick={() => handleGenreToggle(genre)}
            >
              {genre}
            </Badge>
          ))}
        </div>
      </Form.Group>

      <Form.Group controlId="favoriteArtist">
        <Form.Label>Favorite Artist</Form.Label>
        <Form.Control
          type="text"
          name="favoriteArtist"
          placeholder="Enter your favorite artist"
          value={preferencesData.favoriteArtist}
          onChange={(e) => setPreferencesData({ ...preferencesData, favoriteArtist: e.target.value })}
          required
        />
      </Form.Group>

      <Form.Group controlId="languages">
        <Form.Label>Select Preferred Languages</Form.Label>
        <div className="d-flex flex-wrap">
          {languageOptions.map((language) => (
            <Badge
              key={language}
              pill
              bg={preferencesData.languages.includes(language) ? 'primary' : 'light'}
              text="dark" // Ensure text color is dark
              className="m-1 clickable language-badge"
              onClick={() => handleLanguageToggle(language)}
            >
              {language}
            </Badge>
          ))}
        </div>
      </Form.Group>

      <Button variant="primary" type="submit">
        Save Preferences
      </Button>
    </Form>
  );
};

export default PreferencesModal;