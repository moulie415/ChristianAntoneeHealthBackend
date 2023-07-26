import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail'
import moment from 'moment';
import express from 'express'
import * as dotenv from 'dotenv';
import axios from 'axios'
import oauth  from 'oauth-1.0a';
import qs from 'qs'
import * as crypto from 'crypto'

dotenv.config()

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string)

const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://health-and-movement.firebaseio.com"
});

const db = admin.firestore();
const storage = admin.storage();

const garminCredentials = {
  key: process.env.GARMIN_CONSUMER_KEY as string,
  secret: process.env.GARMIN_CONSUMER_SECRET as string,
};

// Create an OAuth instance
const oauthInstance = new oauth({
  consumer: garminCredentials,
  signature_method: 'HMAC-SHA1',
  hash_function(baseString: string, key: string) {
    return crypto.createHmac('sha1', key).update(baseString).digest('base64');
  },
});

const app = express()

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.get('/auth/garmin', (req, res) => {
  const requestData = {
    url: 'https://connectapi.garmin.com/oauth-service/oauth/request_token',
    method: 'POST',
  };

  const authHeader = oauthInstance.toHeader(oauthInstance.authorize(requestData));
  axios.post(requestData.url, null, { headers: { Authorization: authHeader['Authorization'] } })
    .then((response) => {
      const { oauth_token, oauth_token_secret } = qs.parse(response.data);
      // Save oauth_token and oauth_token_secret for later use (e.g., in a database)
      // Redirect the user to the Garmin Connect authorization URL
      const authorizationUrl = `https://connect.garmin.com/oauthConfirm?oauth_token=${oauth_token}`;
      res.redirect(authorizationUrl);
    })
    .catch((error) => {
      res.status(error.response.status || 500).json({ error: 'Failed to initiate OAuth process' });
    });
});

// Endpoint to handle the callback from Garmin Connect after user authorization
// app.get('/auth/garmin/callback', (req, res) => {
//   const { oauth_token, oauth_verifier } = req.query;
//   // Retrieve oauth_token and oauth_token_secret from your database
//   // corresponding to the oauth_token provided in the query params

//   const requestData = {
//     url: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
//     method: 'POST',
//     data: { oauth_verifier },
//   };

//   const token = { key: oauth_token, secret: oauth_token_secret };
//   const authHeader = oauthInstance.toHeader(oauthInstance.authorize(requestData, token));
//   axios.post(requestData.url, null, { headers: { Authorization: authHeader['Authorization'] } })
//     .then((response) => {
//       const { oauth_token, oauth_token_secret } = qs.parse(response.data);
//       // Save oauth_token and oauth_token_secret for the user (e.g., associate with the user in the database)
//       res.json({ oauth_token, oauth_token_secret });
//     })
//     .catch((error) => {
//       res.status(error.response.status || 500).json({ error: 'Failed to complete OAuth process' });
//     });
// });

app.listen(3000)



