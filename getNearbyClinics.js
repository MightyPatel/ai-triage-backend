
const express = require('express');
const axios = require('axios');
const app = express();
require('dotenv').config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Endpoint to fetch clinics near a given location
app.get('/api/clinics', async (req, res) => {
  const location = req.query.location; // expects postal code or city

  if (!location) {
    return res.status(400).json({ error: 'Location is required' });
  }

  try {
    // First, convert postal code/city to lat/lng using Geocoding API
    const geoRes = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: location,
        key: GOOGLE_API_KEY
      }
    });

    const { lat, lng } = geoRes.data.results[0].geometry.location;

    // Then search for clinics and hospitals nearby
    const placesRes = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
       location: `${lat},${lng}`,
        radius: 5000, // 5km radius
        type: 'hospital',
        keyword: 'clinic',
        key: GOOGLE_API_KEY
      }
    });

    const clinics = placesRes.data.results.map(place => ({
      name: place.name,
      address: place.vicinity,
      location: place.geometry.location,
      place_id: place.place_id
    }));

    res.json({ clinics });
  } catch (error) {
    console.error('Google API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch clinics' });
  }
});

// Export for use in main index.js
module.exports = app;
