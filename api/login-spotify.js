const querystring = require('querystring');

module.exports = (req, res) => {
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI ||
    `http://${req.headers.host}/api/callback-spotify`;

  const params = querystring.stringify({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'playlist-modify-private playlist-modify-public',
    state: Math.random().toString(36).substring(2, 15)
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
};
