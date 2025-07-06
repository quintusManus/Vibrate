const OpenAI = require('openai');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { vibe } = req.body;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Give OpenAI the valid genres list and clear instructions
  const validGenres = [
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
  const genreList = validGenres.join(', ');

  try {
    const prompt = `Given the user's mood or vibe: "${vibe}", return a JSON object with the following keys:
- seed_artists: an array of up to 2 popular Spotify artist names that fit the vibe (avoid obscure artists)
- seed_genres: an array of up to 2 genres from this list: [${genreList}] that best fit the vibe
- target_valence: a number between 0 and 1 (higher is happier)
- target_energy: a number between 0 and 1 (higher is more energetic)
- target_tempo: a number between 60 and 180 (bpm)
Only use genres from the provided list. Only use globally popular artists. Do not invent genres. Return only valid JSON.`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    });
    const json = JSON.parse(completion.choices[0].message.content);
    res.status(200).json(json);
  } catch (err) {
    console.error('OpenAI error:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'failed', details: err.response?.data || err.message || err });
  }
};
