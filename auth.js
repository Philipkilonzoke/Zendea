
// Import Firebase libraries from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPfpjx-S8nwKhW-aWyrrpdGEhpTifIAI0",
  authDomain: "zendea-d1eed.firebaseapp.com",
  projectId: "zendea-d1eed",
  storageBucket: "zendea-d1eed.appspot.com",
  messagingSenderId: "127651343782",
  appId: "1:127651343782:web:05e189236881cf3b5fb367"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const message = document.getElementById("message");

loginBtn.addEventListener("click", () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      message.textContent = "✅ Logged in! Redirecting…";
      setTimeout(() => { window.location.href = "index.html"; }, 1500);
    })
    .catch(err => { message.textContent = "❌ " + err.message; });
});

signupBtn.addEventListener("click", () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      message.textContent = "✅ Account created! Redirecting…";
      setTimeout(() => { window.location.href = "index.html"; }, 1500);
    })
    .catch(err => { message.textContent = "❌ " + err.message; });
});
