const fetch = require('node-fetch');

async function getUserToken(userId) {
  // TODO: retrieve stored OAuth token for user
  return { access_token: process.env.SPOTIFY_ACCESS_TOKEN };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, seeds } = req.body;

  // TODO: check trial/subscription status

  const { access_token } = await getUserToken(userId);

  const params = new URLSearchParams({
    seed_artists: seeds.seed_artists.join(','),
    seed_genres: seeds.seed_genres.join(','),
    target_valence: seeds.target_valence,
    target_energy: seeds.target_energy,
    target_tempo: seeds.target_tempo,
    limit: 20
  });

  const recRes = await fetch(`https://api.spotify.com/v1/recommendations?${params}`, {
    headers: { Authorization: `Bearer ${access_token}` }
  });
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
  const playlist = await playlistRes.json();

  await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ uris })
  });

  res.status(200).json({
    embedUrl: `https://open.spotify.com/embed/playlist/${playlist.id}`,
    playlistId: playlist.id
  });
};
