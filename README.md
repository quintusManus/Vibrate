# Vibrate

Mood-based playlist generator using OpenAI and Spotify.

## Setup

1. Install dependencies:
   ```bash
   npm install
   (cd app && npm install)
   ```
2. Copy `.env.example` to `.env` and fill in credentials.
   Required variables:
   - `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_ACCESS_TOKEN`, `SPOTIFY_REDIRECT_URI`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`
   - `SENDGRID_API_KEY`
   - `OPENAI_API_KEY`
   
   `SPOTIFY_REDIRECT_URI` should match a redirect URL registered in your
   Spotify application settings. When developing locally you can use
   `http://localhost:3000/api/callback-spotify`, but for deployment set this
   to your hosted domain such as `https://your-app.vercel.app/api/callback-spotify`.
3. Run development servers:
   ```bash
   npm run dev
   ```

## Deployment

Deploy to Vercel. The `api` directory contains serverless functions and the `app` directory is a Vite React frontend.

For a production build run:
```bash
npm run build
```
Deploy the generated `app/dist` folder along with the functions.
