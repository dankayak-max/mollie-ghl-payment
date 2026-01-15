require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY;   // <– matches Render
const GHL_CLIENT_ID = process.env.GHL_CLIENT_ID;
const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;

const GHL_API = 'https://services.leadconnectorhq.com';
const MOLLIE_API = 'https://api.mollie.com/v2';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

const tokenStore = {};

// ... auth-callback unchanged ...

app.post('/create-mollie-payment', async (req, res) => {
  try {
    const { amount, currency, orderId, locationId } = req.body;
    const token = tokenStore[locationId];
    if (!token) return res.status(401).json({ error: 'Not auth' });

    const mollieRes = await axios.post(
      `${MOLLIE_API}/payments`,
      {
        amount: {
          currency,
          value: (amount / 100).toFixed(2),
        },
        description: `Order ${orderId}`,
        webhookUrl: `${BACKEND_URL}/mollie-webhook?locationId=${locationId}`,
      },
      {
        headers: {
          Authorization: `Bearer ${MOLLIE_API_KEY}`,   // <– uses env
        },
      }
    );

    res.json({
      success: true,
      checkoutUrl: mollieRes.data.links.checkout.href,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
