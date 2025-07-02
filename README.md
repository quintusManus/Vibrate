# Vibrate

Mood-based playlist generator using OpenAI and Spotify.

## Setup

1. Install dependencies:
   ```bash
   npm install
   (cd app && npm install)
   ```
2. Copy `.env.example` to `.env` and fill in credentials.
3. Run development servers:
   ```bash
   npm run dev
   ```

## Deployment

Deploy to Vercel. The `api` directory contains serverless functions and the `app` directory is a Vite React frontend.
