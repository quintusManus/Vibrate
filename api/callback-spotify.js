const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');

  const creds = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI
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
  // TODO: Store tokenData.access_token and tokenData.refresh_token for the user
  // For now, just return them
  res.status(200).json(tokenData);
};
