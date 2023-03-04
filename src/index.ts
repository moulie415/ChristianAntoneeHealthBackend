import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail'
import moment from 'moment';
import express from 'express'
import * as dotenv from 'dotenv';
dotenv.config()

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string)

const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://health-and-movement.firebaseio.com"
});

const db = admin.firestore();
const storage = admin.storage();

const app = express()

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.listen(3000)



