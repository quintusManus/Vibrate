const querystring = require('querystring');

module.exports = (req, res) => {
  const params = querystring.stringify({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: 'playlist-modify-private playlist-modify-public',
    state: Math.random().toString(36).substring(2, 15)
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
};
