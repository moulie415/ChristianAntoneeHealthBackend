import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail'
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

const deleteBotUsers = async () => {
  const botUsers = await db.collection('users').where('name', '==', 'Nuage Laboratoire').get()
  console.log(botUsers.docs.length)
  botUsers.forEach(doc => {
    if (doc.data().email.includes('@cloudtestlabaccounts.com')) {
      doc.ref.delete()
    }
  })
}

//deleteBotUsers();

const reminderTime = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  new Date().getDate() + 1,
  9,
  0,
  0,
).toISOString();

const updateObj = {
  workoutReminders: true,
  workoutReminderTime: reminderTime,
  testReminderTime: reminderTime,
  testReminders: true,
  syncPlanWithCalendar: false,
  autoPlay: true,
  prepTime: 15,
  workoutMusic: true,
  goalReminders: true,
}

const updateUserSettings = async () => {
  const users = await db.collection('users').get()
  users.docs.forEach(doc => {
    db.collection('users').doc(doc.id).update(updateObj)
  })
}

//updateUserSettings()





const app = express()

app.get('/', function (req, res) {
  res.send('Hello World')
})



app.listen(3000)



