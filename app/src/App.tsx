import React, { useState, useEffect } from 'react';
import Input from './components/Input';
import Playlist from './components/Playlist';
import TrialBanner from './components/TrialBanner';
import UpgradeModal from './components/UpgradeModal';
import Setup from './components/Setup';

interface SeedResponse {
  seed_artists: string[];
  seed_genres: string[];
  target_valence: number;
  target_energy: number;
  target_tempo: number;
}

export default function App() {
  console.log("App rendered");
  const [vibe, setVibe] = useState('');
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [trialDay, setTrialDay] = useState(1);
  const [subscribed, setSubscribed] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Running auth check");
    fetch('/api/check-auth', { credentials: 'include' })
      .then(res => {
        console.log("Auth check status:", res.status);
        setIsAuthenticated(res.status === 200);
      });
  }, []);

  console.log("isAuthenticated:", isAuthenticated);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }
  if (!isAuthenticated) {
    return <Setup />;
  }

  const generate = async () => {
    setError(null);
    setEmbedUrl(null);
    setPlaylistUrl(null);
    const seedRes = await fetch('/api/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vibe }),
      credentials: 'include'
    });
    const seeds: SeedResponse = await seedRes.json();
    const genRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'me', seeds }),
      credentials: 'include'
    });
    if (genRes.status === 401) {
      window.location.href = '/api/login-spotify';
      return;
    }
    if (genRes.status === 402) {
      setShowUpgrade(true);
      return;
    }
    if (!genRes.ok) {
      const err = await genRes.json();
      setError(
        err && err.error === 'spotify_recommendations_failed'
          ? 'Sorry, we could not generate a playlist for that vibe. Try a different mood, artist, or genre!'
          : 'An error occurred. Please try again.'
      );
      return;
    }
    const data = await genRes.json();
    setEmbedUrl(data.embedUrl);
    setPlaylistUrl(data.playlistId ? `https://open.spotify.com/playlist/${data.playlistId}` : null);
  };

  return (
    <div className="p-4 space-y-4">
      <TrialBanner day={trialDay} subscribed={subscribed} />
      <Input vibe={vibe} setVibe={setVibe} onGenerate={generate} />
      {error && (
        <div className="text-red-400 font-semibold mb-2">{error}</div>
      )}
      {playlistUrl && (
        <div className="mb-2">
          <a href={playlistUrl} target="_blank" rel="noopener noreferrer" className="underline text-green-400 hover:text-green-200">
            View on Spotify
          </a>
        </div>
      )}
      <Playlist embedUrl={embedUrl} />
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={() => {
          setSubscribed(true);
          setShowUpgrade(false);
        }}
      />
    </div>
  );
}
