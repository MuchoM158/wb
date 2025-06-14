const firebaseConfig = {
  apiKey: "AIzaSyCa5i154cR_Ii88g_1oedV3_njNMDd9umI",
  authDomain: "paginablackjack.firebaseapp.com",
  databaseURL: "https://paginablackjack-default-rtdb.firebaseio.com/",
  projectId: "paginablackjack",
  storageBucket: "paginablackjack.firebasestorage.app",
  messagingSenderId: "992879750702",
  appId: "1:992879750702:web:2c43c25dab4973b167b9bf"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
