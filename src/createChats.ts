import { db } from ".";
import moment from 'moment';
import {v4 as uuidv4} from 'uuid';

const user1 = 'mxUzqRP9zaZ85axC2GB8cAntQRj2'
const user2 = 'lZsSvcGZlHQ6NOSnObJ2EHfnljW2'

export const createChats = async () => {
  await db.collection('users').doc(user2).collection('connections').doc(user1).set({uid: user1, createdate: new Date()});
  await db.collection('users').doc(user1).collection('connections').doc(user2).set({uid: user2, createdate: new Date()});
  const ref = await db.collection('chats').add({users: [user1, user2], createdate: new Date()});
  const chatDate = moment().valueOf();
  await db.collection('users').doc(user2).collection('chats').doc(ref.id).set({id: ref.id, createdate: chatDate});
  await db.collection('users').doc(user1).collection('chats').doc(ref.id).set({id: ref.id, createdate: chatDate});
  await db.collection('chats')
    .doc(ref.id)
    .collection('messages')
    .add({_id: uuidv4(), createdAt: chatDate, system: true, text: 'Beginning of chat'});
  console.log('chat creation finished')
}