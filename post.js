import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPfpjx-S8nwKhW-aWyrrpdGEhpTifIAI0",
  authDomain: "zendea-d1eed.firebaseapp.com",
  projectId: "zendea-d1eed",
  storageBucket: "zendea-d1eed.appspot.com",
  messagingSenderId: "127651343782",
  appId: "1:127651343782:web:05e189236881cf3b5fb367"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth, user => {
  if (!user) {
    alert("You must be logged in to post.");
    window.location.href = "login.html";
  }
});

const postBtn = document.getElementById("post-btn");
const type = document.getElementById("type");
const title = document.getElementById("title");
const desc = document.getElementById("description");
const loc = document.getElementById("location");
const price = document.getElementById("price");
const message = document.getElementById("message");

postBtn.addEventListener("click", async () => {
  const data = {
    title: title.value,
    description: desc.value,
    location: loc.value,
    postedAt: serverTimestamp()
  };
  if (type.value === "job") {
    data.salary = price.value;
    await addDoc(collection(db, "jobs"), data);
  } else {
    data.price = price.value;
    await addDoc(collection(db, "deals"), data);
  }
  message.textContent = "✅ Posted successfully!";
  title.value = desc.value = loc.value = price.value = "";
});