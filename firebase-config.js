// Firebase Configuration for Familiens Kokebok
// NOTE: Firebase API keys for web apps are meant to be public.
// Security is enforced through:
// 1. API Key restrictions (domain whitelisting in Google Cloud Console)
// 2. Firebase Security Rules (protect Firestore data)
// 3. Firebase Authentication (user verification)

// You need to create a Firebase project at https://console.firebase.google.com
// and replace these values with your own configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMK0Jx68u5aVoxkXsPK-pRKyPyJE45FrU",
  authDomain: "kokebok-c5c07.firebaseapp.com",
  projectId: "kokebok-c5c07",
  storageBucket: "kokebok-c5c07.firebasestorage.app",
  messagingSenderId: "915848411687",
  appId: "1:915848411687:web:3c06c872db49c677b56c02"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Instructions for setting up Firebase:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (or use existing)
// 3. Enable Google Authentication:
//    - Go to Authentication > Sign-in method
//    - Enable Google provider
// 4. Create Firestore Database:
//    - Go to Firestore Database
//    - Create database in production mode
// 5. Set up Security Rules (see firestore.rules file)
// 6. Copy your web app config here
// 7. Add your domain to authorized domains in Authentication settings
