import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {

  apiKey: "AIzaSyB40qXynzNFW-gYW1omUMHz7NoNfTHO4l4",

  authDomain: "info-c1283.firebaseapp.com",

  projectId: "info-c1283",

  storageBucket: "info-c1283.firebasestorage.app",

  messagingSenderId: "955510447110",

  appId: "1:955510447110:web:dd50ec20ed4f658e90f787"

};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };  