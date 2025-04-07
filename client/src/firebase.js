// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "REDACTED",
  authDomain: "studybuddy-9a621.firebaseapp.com",
  projectId: "studybuddy-9a621",
  storageBucket: "studybuddy-9a621.firebasestorage.app",
  messagingSenderId: "818150475059",
  appId: "1:818150475059:web:62b4f91129fd4aabb4aa46"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
