const fetch = require('node-fetch');

// Helper to get access token from cookies
function getAccessToken(req) {
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

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, seeds } = req.body;

  // TODO: check trial/subscription status

  const { access_token } = await getUserToken(userId, req);
  if (!access_token) {
    return res.status(401).json({ error: 'missing_spotify_access_token' });
  }

  const params = new URLSearchParams({
    seed_artists: seeds.seed_artists.join(','),
    seed_genres: seeds.seed_genres.join(','),
    target_valence: seeds.target_valence,
    target_energy: seeds.target_energy,
    target_tempo: seeds.target_tempo,
    limit: 20
  });

  const recRes = await fetch(
    `https://api.spotify.com/v1/recommendations?${params}`,
    {
      headers: { Authorization: `Bearer ${access_token}` }
    }
  );
  if (!recRes.ok) {
    return res.status(500).json({ error: 'spotify_recommendations_failed' });
  }
  const rec = await recRes.json();
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
    return res.status(500).json({ error: 'playlist_create_failed' });
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
    return res.status(500).json({ error: 'add_tracks_failed' });
  }

  res.status(200).json({
    embedUrl: `https://open.spotify.com/embed/playlist/${playlist.id}`,
    playlistId: playlist.id
  });
};
