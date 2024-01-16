import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail'
import express from 'express'
import * as dotenv from 'dotenv';
import { resizeRecipeImages } from './resizeRecipeImage';
import { createChats } from './createChats';

dotenv.config()

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string)

const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://health-and-movement.firebaseio.com"
});

export const db = admin.firestore();
const storage = admin.storage();
export const bucket = storage.bucket('gs://health-and-movement.appspot.com');

const deleteBotUsers = async () => {
  const botUsers = await db.collection('users').where('name', '==', 'Nuage Laboratoire').get()
  console.log(botUsers.docs.length)
  botUsers.forEach(doc => {
    if (doc.data().email.includes('@cloudtestlabaccounts.com')) {
      doc.ref.delete()
    }
  })
}

const cleanUpUserChats = async () => {
  const found = []
  const notFound = [];
  const users = await db.collection('users').get();
  for (const user of users.docs) {
    const chats = await db.collection('users').doc(user.data().uid).collection('chats').get();
    if (chats.docs.length) {
      for (const c of chats.docs) {
        const chat = await db.collection('chats').doc(c.id).get();
        if (chat.exists) {
          found.push(c.id)
        } else {
          await db.collection('users').doc(user.id).collection('chats').doc(c.id).delete();
          notFound.push(c.id)
        }
      }
    }
  }

  console.log('found: ' , found.length)
  console.log('not found: ' , notFound.length)
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


const cleanupStorageFiles = async (prefix: string) => {
  const found = [];
  const notFound = [];
  const folders = await  bucket.getFiles({prefix});
  for (const folder of folders) {
    for (const file of folder) {
      const path =  file.name.split('/').slice(0, 2).join('/')
      const doc = await db.doc(path).get();
      if (doc && doc.data()) {
        found.push(doc)
      } else {
        await bucket.deleteFiles({prefix: path})
        notFound.push(path)
      }
    }
  }

  console.log('Found: ', found.length)
  console.log('Not found: ', notFound.length)

}



//cleanupStorageFiles('quickRoutines');
//cleanupStorageFiles('recipes');
//cleanupStorageFiles('tests')
//cleanupStorageFiles('education')
//cleanupStorageFiles('exercises')
//resizeRecipeImages();
//cleanUpUserChats();
//createChats();


const app = express()

app.get('/', function (req, res) {
  res.send('Hello World')
})



app.listen(3000)



