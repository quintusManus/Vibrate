module.exports = (req, res) => {
  // Log cookies for debugging
  console.log('Cookies:', req.cookies);
  if (req.cookies && typeof req.cookies.spotify_access_token === 'string' && req.cookies.spotify_access_token.trim() !== '') {
    return res.status(200).json({ authenticated: true });
  }
  res.status(401).json({ authenticated: false });
};
