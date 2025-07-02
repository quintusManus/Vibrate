const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, paymentMethodId } = req.body;

  try {
    const customer = await stripe.customers.create({
      email,
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId }
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: 'price_123' }],
      trial_period_days: 7
    });

    await sgMail.send({
      to: email,
      from: 'noreply@vibrate.app',
      subject: 'Welcome to Vibrate',
      text: 'Enjoy your playlists!'
    });

    res.status(200).json({ customerId: customer.id, subscriptionId: subscription.id });
  } catch (err) {
    res.status(500).json({ error: 'signup failed' });
  }
};
