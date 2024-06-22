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
export const auth = admin.auth();
const storage = admin.storage();
export const bucket = storage.bucket('gs://health-and-movement.appspot.com');

const deleteBotUsers = async () => {
  const botUsers = await db.collection('users').where('name', '==', 'Nuage Laboratoire').get()
  console.log(botUsers.docs.length)
  botUsers.forEach(doc => {
    if (doc.data().email.includes('@cloudtestlabaccounts.com')) {
      auth.deleteUser(doc.data().uid)
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

const updateUserTargets = async () => {
  const users = await db.collection('users').get()
  const settings = (await db.collection('settings').get()).docs[0]?.data();
  users.docs.forEach(async doc => {
    const { goal, targets } = doc.data();
    if (goal && !targets) {
      const goalTargets = settings.workoutGoals[goal];
      if (goalTargets) {
        await db.collection('users').doc(doc.id).update({targets: goalTargets})
        console.log(`user ${doc.id} updated with new ${goal} targets`)
      }
    }
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

const cleanCollection = async (collection: string) => {

  for (let i = 0; i < 200; i ++) { 
    console.log(`started on batch ${i + 1}`)
    const docs = await db.collection(collection).limit(10).get();

    if (docs.docs.length) {
      console.log('docs fetched')
      const batch = db.batch();
      docs.forEach(doc => {
        batch.delete(doc.ref);
      })
      await batch.commit();
      console.log(`deleted batch ${i + 1}`)
    } else {
      break;
    }
  }

  console.log('no more items found in collection')
}



//cleanupStorageFiles('quickRoutines');
//cleanupStorageFiles('recipes');
//cleanupStorageFiles('tests')
//cleanupStorageFiles('education')
//cleanupStorageFiles('exercises')
//resizeRecipeImages();
//cleanUpUserChats();
//createChats();
//updateUserTargets();


const app = express()

app.get('/', function (req, res) {
  res.send('Hello World')
})



app.listen(3000)



