// scripts/firebase.js

// Your Firebase configuration (do not change structure)
const firebaseConfig = {
    apiKey: "AIzaSyAleMfich680x6xilWHXOKshwy6x265H5Y",
    authDomain: "auroratime-24dbe.firebaseapp.com",
    databaseURL: "https://auroratime-24dbe-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "auroratime-24dbe",
    storageBucket: "auroratime-24dbe.firebasestorage.app",
    messagingSenderId: "879827095512",
    appId: "1:879827095512:web:772f6472c0a4a67232ecad"
};

// Initialize Firebase (compat version)
firebase.initializeApp(firebaseConfig);

// Now we can use these anywhere
const auth = firebase.auth();      // For login/logout
const db = firebase.firestore();   // For database (Firestore)
