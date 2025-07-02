import React from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function UpgradeModal({ open, onClose, onUpgrade }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white text-black p-4 rounded">
        <h2 className="text-xl mb-2">Upgrade</h2>
        <p className="mb-4">Subscribe to keep generating playlists.</p>
        <button className="mr-2 bg-green-600 px-4 py-2 rounded text-white" onClick={onUpgrade}>Upgrade</button>
        <button className="px-4 py-2" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
