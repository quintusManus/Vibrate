const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');

  const creds = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');

  const redirectUri = process.env.SPOTIFY_REDIRECT_URI ||
    `http://${req.headers.host}/api/callback-spotify`;

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri
  });

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!tokenRes.ok) {
    return res.status(500).json({ error: 'token_exchange_failed' });
  }
  const tokenData = await tokenRes.json();
  // Store tokens in cookies for later use
  res.cookie('spotify_access_token', tokenData.access_token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  res.cookie('spotify_refresh_token', tokenData.refresh_token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  // Optionally redirect to frontend or send a success message
  res.redirect('/'); // Change this to your frontend URL if needed
};
