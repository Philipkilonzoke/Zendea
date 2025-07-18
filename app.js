
// Import Firebase libraries from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

// Fetch Jobs
async function loadJobs() {
  const jobsCol = collection(db, "jobs");
  const jobsSnap = await getDocs(jobsCol);
  const jobsList = document.getElementById("jobs-list");
  jobsList.innerHTML = "";
  jobsSnap.forEach(doc => {
    const data = doc.data();
    const div = document.createElement("div");
    div.innerHTML = `<h3>${data.title}</h3><p>${data.description}</p><p><strong>Location:</strong> ${data.location} | <strong>Salary:</strong> ${data.salary}</p><hr>`;
    jobsList.appendChild(div);
  });
}

// Fetch Deals
async function loadDeals() {
  const dealsCol = collection(db, "deals");
  const dealsSnap = await getDocs(dealsCol);
  const dealsList = document.getElementById("deals-list");
  dealsList.innerHTML = "";
  dealsSnap.forEach(doc => {
    const data = doc.data();
    const div = document.createElement("div");
    div.innerHTML = `<h3>${data.title}</h3><p>${data.description}</p><p><strong>Price:</strong> ${data.price} | <strong>Location:</strong> ${data.location}</p><hr>`;
    dealsList.appendChild(div);
  });
}

// Show login/logout
onAuthStateChanged(auth, user => {
  const authLinks = document.getElementById("auth-links");
  if (user) {
    authLinks.innerHTML = `<button id="logout-btn">Logout</button>`;
    document.getElementById("logout-btn").addEventListener("click", () => {
      signOut(auth);
    });
  } else {
    authLinks.innerHTML = `<a href="login.html">Login / Signup</a>`;
  }
});

loadJobs();
loadDeals();
