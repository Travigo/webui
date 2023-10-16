//firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyAKk3Q9o38bKB5pQUGt0r8OL0KoXMpCre4",
  authDomain: "travigo-cdd36.firebaseapp.com",
  projectId: "travigo-cdd36",
  storageBucket: "travigo-cdd36.appspot.com",
  messagingSenderId: "190413192330",
  appId: "1:190413192330:web:15315e66725a50ed834173",
  measurementId: "G-3L94RGJK7N"
});

const messaging = firebase.messaging();
