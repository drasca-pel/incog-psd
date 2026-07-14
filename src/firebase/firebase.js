import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDNkTL_yehAvn0IdBfO_1iQ086h-sx-0i8",
  authDomain: "incog-psd.firebaseapp.com",
  projectId: "incog-psd",
  storageBucket: "incog-psd.firebasestorage.app",
  messagingSenderId: "526734799470",
  appId: "1:526734799470:web:ea433afb5a89dff1436c7f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;