import React from 'react';

export default function SpotifyLogin() {
  const handleLogin = () => {
    window.location.href = '/api/login-spotify';
  };
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <button
        className="bg-green-600 px-6 py-3 rounded text-white text-xl shadow-lg hover:bg-green-700"
        onClick={handleLogin}
      >
        Login with Spotify
      </button>
    </div>
  );
}
