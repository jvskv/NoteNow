import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCvJyNLO1TJ5afg4OPliX8qRWWplv6Y7MI",
  authDomain: "notenow-cdf41.firebaseapp.com",
  projectId: "notenow-cdf41",
  storageBucket: "notenow-cdf41.appspot.com",
  messagingSenderId: "702862755070",
  appId: "1:702862755070:web:da90e0b522fce7e81111af",
  measurementId: "G-8Y8VXP3E34",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const firestore = firebase.firestore();
const storage = firebase.storage();

export { firebase, firestore, storage };
