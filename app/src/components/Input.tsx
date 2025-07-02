import React from 'react';

interface Props {
  vibe: string;
  setVibe: (v: string) => void;
  onGenerate: () => void;
}

export default function Input({ vibe, setVibe, onGenerate }: Props) {
  return (
    <div className="space-x-2 flex">
      <input
        className="flex-1 p-2 rounded text-black"
        placeholder="Type your vibe"
        value={vibe}
        onChange={e => setVibe(e.target.value)}
      />
      <button className="bg-green-600 px-4 py-2 rounded" onClick={onGenerate}>
        Generate Playlist
      </button>
    </div>
  );
}
