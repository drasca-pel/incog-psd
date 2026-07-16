import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDNkTL_yehAvn0IdBfO_1iQ086h-sx-0i8",
  authDomain: "incog-psd.firebaseapp.com",
  projectId: "incog-psd",
  storageBucket: "incog-psd.firebasestorage.app",
  messagingSenderId: "526734799470",
  appId: "1:526734799470:web:ed45d4b58c23aee4436c7f",
  measurementId: "G-K2NFDFZVBJ"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export {
  app,
  auth,
  db,
  storage,
  analytics
};