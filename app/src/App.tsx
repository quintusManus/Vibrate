import React, { useState } from 'react';
import Input from './components/Input';
import Playlist from './components/Playlist';
import TrialBanner from './components/TrialBanner';
import UpgradeModal from './components/UpgradeModal';

interface SeedResponse {
  seed_artists: string[];
  seed_genres: string[];
  target_valence: number;
  target_energy: number;
  target_tempo: number;
}

export default function App() {
  const [vibe, setVibe] = useState('');
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [trialDay, setTrialDay] = useState(1);
  const [subscribed, setSubscribed] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const generate = async () => {
    const seedRes = await fetch('/api/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vibe })
    });
    const seeds: SeedResponse = await seedRes.json();
    const genRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'me', seeds })
    });
    if (genRes.status === 402) {
      setShowUpgrade(true);
      return;
    }
    const data = await genRes.json();
    setEmbedUrl(data.embedUrl);
  };

  return (
    <div className="p-4 space-y-4">
      <TrialBanner day={trialDay} subscribed={subscribed} />
      <Input vibe={vibe} setVibe={setVibe} onGenerate={generate} />
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
