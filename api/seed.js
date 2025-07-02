const { Configuration, OpenAIApi } = require('openai');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { vibe } = req.body;
  const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
  const openai = new OpenAIApi(configuration);

  try {
    const prompt = `Return Spotify seed_artists, seed_genres, target_valence, target_energy, target_tempo as JSON for the vibe: ${vibe}`;
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    });
    const json = JSON.parse(completion.data.choices[0].message.content);
    res.status(200).json(json);
  } catch (err) {
    res.status(500).json({ error: 'failed' });
  }
};
