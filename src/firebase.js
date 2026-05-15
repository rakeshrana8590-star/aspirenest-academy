import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyCmNoqrNkHnVn-WlJYvL6HXJvFtMQ6UNRA",
  authDomain: "aspirenest-platform.firebaseapp.com",
  projectId: "aspirenest-platform",
  storageBucket: "aspirenest-platform.firebasestorage.app",
  messagingSenderId: "101391171622",
  appId: "1:101391171622:web:ee1a6458e605c00d47a6e7",
  measurementId: "G-YZ8K9YSP4S"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export default app;
