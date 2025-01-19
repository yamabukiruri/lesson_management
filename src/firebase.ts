import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC_kwZ-91sXGtvUXDV_dSAHjxSwnaG2nkQ",
  authDomain: "lesson-management-693fc.firebaseapp.com",
  projectId: "lesson-management-693fc",
  storageBucket: "lesson-management-693fc.firebasestorage.app",
  messagingSenderId: "309492107782",
  appId: "1:309492107782:web:0a63846926d7b22d189187"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;