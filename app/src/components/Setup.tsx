import React, { useEffect } from 'react';

export default function Setup() {
  useEffect(() => {
    fetch('/api/check-auth', { credentials: 'include' })
      .then(res => {
        if (res.status === 200) {
          window.location.href = '/';
        }
      });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl mb-4">Connect your Spotify account to continue</h1>
      <a
        className="bg-green-600 px-6 py-3 rounded text-white text-xl shadow-lg hover:bg-green-700"
        href="/api/login-spotify"
      >
        Login with Spotify
      </a>
    </div>
  );
}
