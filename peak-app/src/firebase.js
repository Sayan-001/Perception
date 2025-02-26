import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyD6m8p8evFYxIU60ZQpjjaVOO4rVe8hyVI",
  authDomain: "doubleslash-1.firebaseapp.com",
  projectId: "doubleslash-1",
  storageBucket: "doubleslash-1.firebasestorage.app",
  messagingSenderId: "478224830594",
  appId: "1:478224830594:web:4fda3ea234ed4f08bf249b",
  measurementId: "G-8LFVR9FB7R",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const db = getFirestore(app);
export { auth, db };
