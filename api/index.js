const express = require('express');
const bodyParser = require('body-parser');
const seed = require('./seed');
const generate = require('./generate');
const signup = require('./signup');
const stripeWebhook = require('./webhooks/stripe');

const app = express();
app.use(bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

app.post('/api/seed', seed);
app.post('/api/generate', generate);
app.post('/api/signup', signup);
app.post('/api/webhooks/stripe', stripeWebhook);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on ${port}`));
