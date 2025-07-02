const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'invoice.payment_succeeded':
      // TODO: mark user as paid
      break;
    case 'customer.subscription.deleted':
      // TODO: mark user as canceled
      break;
  }

  res.json({ received: true });
};
