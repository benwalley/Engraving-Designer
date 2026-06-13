import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Replace these values with your Firebase project config.
// 1. Go to https://console.firebase.google.com and create a project
// 2. Add a web app to get the config object
// 3. Enable Firestore Database (start in test mode)
const firebaseConfig = {
  apiKey: "AIzaSyBszCKQehX0EvELQHwjD4gimdI4Umu0GWY",
  authDomain: "engraving-designer.firebaseapp.com",
  projectId: "engraving-designer",
  storageBucket: "engraving-designer.firebasestorage.app",
  messagingSenderId: "697355270169",
  appId: "1:697355270169:web:ee6725cfe873004285d288",
  measurementId: "G-DS8Z2B0JHZ"
};

export const db = getFirestore(initializeApp(firebaseConfig));
