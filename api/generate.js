const fetch = require('node-fetch');

// Helper to normalize strings for comparison
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[-_ ]+/g, '')
    .trim();
}

// Helper to get access token from cookies
function getAccessToken(req) {
  // Prefer cookie-parser if available
  if (req.cookies && req.cookies.spotify_access_token) {
    return req.cookies.spotify_access_token;
  }
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/spotify_access_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function getUserToken(userId, req) {
  // Use access token from cookie if available
  const access_token = getAccessToken(req);
  if (access_token) return { access_token };
  // fallback (should not be needed anymore)
  return { access_token: process.env.SPOTIFY_ACCESS_TOKEN };
}

// Hardcoded list of valid Spotify seed genres from Spotify docs (July 2025)
const SPOTIFY_VALID_GENRES = [
  'acoustic', 'afrobeat', 'alt-rock', 'alternative', 'ambient', 'anime', 'black-metal', 'bluegrass', 'blues',
  'bossanova', 'brazil', 'breakbeat', 'british', 'cantopop', 'chicago-house', 'children', 'chill', 'classical',
  'club', 'comedy', 'country', 'dance', 'dancehall', 'death-metal', 'deep-house', 'detroit-techno', 'disco',
  'disney', 'drum-and-bass', 'dub', 'dubstep', 'edm', 'electro', 'electronic', 'emo', 'folk', 'forro', 'french',
  'funk', 'garage', 'german', 'gospel', 'goth', 'grindcore', 'groove', 'grunge', 'guitar', 'happy', 'hard-rock',
  'hardcore', 'hardstyle', 'heavy-metal', 'hip-hop', 'holidays', 'honky-tonk', 'house', 'idm', 'indian', 'indie',
  'indie-pop', 'industrial', 'iranian', 'j-dance', 'j-idol', 'j-pop', 'j-rock', 'jazz', 'k-pop', 'kids', 'latin',
  'latino', 'malay', 'mandopop', 'metal', 'metal-misc', 'metalcore', 'minimal-techno', 'movies', 'mpb', 'new-age',
  'new-release', 'opera', 'pagode', 'party', 'philippines-opm', 'piano', 'pop', 'pop-film', 'post-dubstep',
  'power-pop', 'progressive-house', 'psych-rock', 'punk', 'punk-rock', 'r-n-b', 'rainy-day', 'reggae', 'reggaeton',
  'road-trip', 'rock', 'rock-n-roll', 'rockabilly', 'romance', 'sad', 'salsa', 'samba', 'sertanejo', 'show-tunes',
  'singer-songwriter', 'ska', 'sleep', 'songwriter', 'soul', 'soundtracks', 'spanish', 'study', 'summer', 'swedish',
  'synth-pop', 'tango', 'techno', 'trance', 'trip-hop', 'turkish', 'work-out', 'world-music'
];

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, seeds } = req.body;

  // TODO: check trial/subscription status

  const { access_token } = await getUserToken(userId, req);
  if (!access_token) {
    return res.status(401).json({ error: 'missing_spotify_access_token' });
  }

  // Use only valid genres from the hardcoded list
  let filteredGenres = (seeds.seed_genres || []).map(g => g.toLowerCase().replace(/ /g, '-'))
    .filter(g => SPOTIFY_VALID_GENRES.includes(g));

  // Only use valid artist IDs (skip if not found)
  let artistIds = [];
  if (seeds.seed_artists && seeds.seed_artists.length > 0) {
    for (const name of seeds.seed_artists) {
      try {
        const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=3`, {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const found = searchData.artists && searchData.artists.items &&
            searchData.artists.items.find(a => normalize(a.name) === normalize(name));
          if (found) artistIds.push(found.id);
          else console.warn(`No robust match for artist: ${name}`);
        } else {
          console.error(`Failed to search for artist: ${name}`);
        }
      } catch (e) {
        console.error(`Error searching for artist: ${name}`, e);
      }
    }
  }

  // Limit to 2 artist IDs and 2 genres for recommendations
  if (artistIds.length > 2) artistIds = artistIds.slice(0, 2);
  if (filteredGenres.length > 2) filteredGenres = filteredGenres.slice(0, 2);

  // Only include non-empty seeds in params
  const paramsObj = {
    target_valence: seeds.target_valence,
    target_energy: seeds.target_energy,
    target_tempo: seeds.target_tempo,
    limit: 20
  };
  if (artistIds.length > 0) {
    paramsObj.seed_artists = artistIds.join(',');
  }
  if (filteredGenres.length > 0) {
    paramsObj.seed_genres = filteredGenres.join(',');
  }
  if (!paramsObj.seed_artists && !paramsObj.seed_genres) {
    console.error('No valid seed_artists or seed_genres provided');
    return res.status(400).json({ error: 'no_valid_seeds', message: 'No valid artists or genres for recommendations.' });
  }
  const params = new URLSearchParams(paramsObj);

  console.log('Generating playlist with seeds:', seeds);
  console.log('Artist IDs:', artistIds);
  console.log('Filtered genres:', filteredGenres);
  console.log('Recommendations URL:', `https://api.spotify.com/v1/recommendations?${params}`);
  // Build params with and without targets
  const baseParamsObj = {};
  if (artistIds.length > 0) baseParamsObj.seed_artists = artistIds.join(',');
  if (filteredGenres.length > 0) baseParamsObj.seed_genres = filteredGenres.join(',');
  baseParamsObj.limit = 20;

  const withTargets = {
    ...baseParamsObj,
    target_valence: seeds.target_valence,
    target_energy: seeds.target_energy,
    target_tempo: seeds.target_tempo 
  };

  // Try recommendations with all seeds, then only artists, then only genres, then just seeds (no targets)
  let recRes;
  let tried = [];
  let rec;
  // 1. Try with both artists and genres (with targets)
  if (artistIds.length > 0 && filteredGenres.length > 0) {
    const bothParams = { seed_artists: artistIds.join(','), seed_genres: filteredGenres.join(','), limit: 20, target_valence: seeds.target_valence, target_energy: seeds.target_energy, target_tempo: seeds.target_tempo };
    recRes = await fetch(
      `https://api.spotify.com/v1/recommendations?${new URLSearchParams(bothParams)}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    tried.push('artists+genres+targets');
    if (recRes.ok) {
      rec = await recRes.json();
    }
  }
  // 2. Only artists (with targets)
  if ((!rec || !rec.tracks || rec.tracks.length === 0) && artistIds.length > 0) {
    const artistParams = { seed_artists: artistIds.join(','), limit: 20, target_valence: seeds.target_valence, target_energy: seeds.target_energy, target_tempo: seeds.target_tempo };
    recRes = await fetch(
      `https://api.spotify.com/v1/recommendations?${new URLSearchParams(artistParams)}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    tried.push('artists+targets');
    if (recRes.ok) {
      rec = await recRes.json();
    }
  }
  // 3. Only genres (with targets)
  if ((!rec || !rec.tracks || rec.tracks.length === 0) && filteredGenres.length > 0) {
    const genreParams = { seed_genres: filteredGenres.join(','), limit: 20, target_valence: seeds.target_valence, target_energy: seeds.target_energy, target_tempo: seeds.target_tempo };
    recRes = await fetch(
      `https://api.spotify.com/v1/recommendations?${new URLSearchParams(genreParams)}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    tried.push('genres+targets');
    if (recRes.ok) {
      rec = await recRes.json();
    }
  }
  // 4. Both artists and genres (no targets)
  if ((!rec || !rec.tracks || rec.tracks.length === 0) && artistIds.length > 0 && filteredGenres.length > 0) {
    const bothParams = { seed_artists: artistIds.join(','), seed_genres: filteredGenres.join(','), limit: 20 };
    recRes = await fetch(
      `https://api.spotify.com/v1/recommendations?${new URLSearchParams(bothParams)}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    tried.push('artists+genres');
    if (recRes.ok) {
      rec = await recRes.json();
    }
  }
  // 5. Only artists (no targets)
  if ((!rec || !rec.tracks || rec.tracks.length === 0) && artistIds.length > 0) {
    const artistParams = { seed_artists: artistIds.join(','), limit: 20 };
    recRes = await fetch(
      `https://api.spotify.com/v1/recommendations?${new URLSearchParams(artistParams)}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    tried.push('artists');
    if (recRes.ok) {
      rec = await recRes.json();
    }
  }
  // 6. Only genres (no targets)
  if ((!rec || !rec.tracks || rec.tracks.length === 0) && filteredGenres.length > 0) {
    const genreParams = { seed_genres: filteredGenres.join(','), limit: 20 };
    recRes = await fetch(
      `https://api.spotify.com/v1/recommendations?${new URLSearchParams(genreParams)}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    tried.push('genres');
    if (recRes.ok) {
      rec = await recRes.json();
    }
  }
  // If all fail, try again with same seeds but NO target parameters (final fallback)
  if (!rec || !rec.tracks || rec.tracks.length === 0) {
    let fallbackRecRes = null;
    let fallbackRec = null;
    // Try both artists+genres without targets
    if (artistIds.length > 0 && filteredGenres.length > 0) {
      const bothParams = { seed_artists: artistIds.join(','), seed_genres: filteredGenres.join(','), limit: 20 };
      fallbackRecRes = await fetch(
        `https://api.spotify.com/v1/recommendations?${new URLSearchParams(bothParams)}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      tried.push('artists+genres (no targets)');
      if (fallbackRecRes.ok) {
        fallbackRec = await fallbackRecRes.json();
      }
    }
    // Try only artists without targets
    if ((!fallbackRec || !fallbackRec.tracks || fallbackRec.tracks.length === 0) && artistIds.length > 0) {
      const artistParams = { seed_artists: artistIds.join(','), limit: 20 };
      fallbackRecRes = await fetch(
        `https://api.spotify.com/v1/recommendations?${new URLSearchParams(artistParams)}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      tried.push('artists (no targets)');
      if (fallbackRecRes.ok) {
        fallbackRec = await fallbackRecRes.json();
      }
    }
    // Try only genres without targets
    if ((!fallbackRec || !fallbackRec.tracks || fallbackRec.tracks.length === 0) && filteredGenres.length > 0) {
      const genreParams = { seed_genres: filteredGenres.join(','), limit: 20 };
      fallbackRecRes = await fetch(
        `https://api.spotify.com/v1/recommendations?${new URLSearchParams(genreParams)}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      tried.push('genres (no targets)');
      if (fallbackRecRes.ok) {
        fallbackRec = await fallbackRecRes.json();
      }
    }
    // If still nothing, return error
    if (!fallbackRec || !fallbackRec.tracks || fallbackRec.tracks.length === 0) {
      const errText = fallbackRecRes ? await fallbackRecRes.text() : 'No recommendations found';
      console.error('Spotify recommendations error (final fallback):', fallbackRecRes ? fallbackRecRes.status : 'no response', errText, 'Tried:', tried);
      return res.status(500).json({ error: 'spotify_recommendations_failed', details: errText, tried });
    }
    rec = fallbackRec;
  }
  const uris = rec.tracks.map(t => t.uri);

  const playlistRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'Vibrate Playlist', public: false })
  });
  if (!playlistRes.ok) {
    const errText = await playlistRes.text();
    console.error('Spotify playlist create error:', playlistRes.status, errText);
    return res.status(500).json({ error: 'playlist_create_failed', details: errText });
  }
  const playlist = await playlistRes.json();

  const addRes = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ uris })
  });
  if (!addRes.ok) {
    const errText = await addRes.text();
    console.error('Spotify add tracks error:', addRes.status, errText);
    return res.status(500).json({ error: 'add_tracks_failed', details: errText });
  }

  res.status(200).json({
    embedUrl: `https://open.spotify.com/embed/playlist/${playlist.id}`,
    playlistId: playlist.id
  });
};
