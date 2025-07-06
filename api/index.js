require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const seed = require('./seed');
const generate = require('./generate');
const signup = require('./signup');
const stripeWebhook = require('./webhooks/stripe');
const loginSpotify = require('./login-spotify');
const callbackSpotify = require('./callback-spotify');

const app = express();
app.use(bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(cookieParser());

// API routes
app.post('/api/seed', seed);
app.post('/api/generate', generate);
app.post('/api/signup', signup);
app.post('/api/webhooks/stripe', stripeWebhook);
app.get('/api/login-spotify', loginSpotify);
app.get('/api/callback-spotify', callbackSpotify);
app.get('/api/check-auth', require('./check-auth'));

// Serve service-worker.js as a static file
app.use('/service-worker.js', express.static(path.join(__dirname, '../app/service-worker.js')));
// Serve React static files
const clientBuildPath = path.resolve(__dirname, '../app/dist');
app.use(express.static(clientBuildPath));
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on ${port}`));
