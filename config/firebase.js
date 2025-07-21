// ====================================== //
// 🔥 Firebase Configuration & Initialization //
// ====================================== //

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPfpjx-S8nwKhW-aWyrrpdGEhpTifIAI0",
  authDomain: "zendea-d1eed.firebaseapp.com",
  projectId: "zendea-d1eed",
  storageBucket: "zendea-d1eed.firebasestorage.app",
  messagingSenderId: "127651343782",
  appId: "1:127651343782:web:05e189236881cf3b5fb367"
};

// Initialize Firebase and make services globally available
class FirebaseApp {
  constructor() {
    this.app = null;
    this.db = null;
    this.auth = null;
    this.storage = null;
    this.functions = {};
    this.initialized = false;
  }

  async initialize() {
    try {
      // Wait for Firebase SDK to load
      if (typeof firebase === 'undefined') {
        console.log('⏳ Waiting for Firebase SDK to load...');
        await this.waitForFirebase();
      }

      // Initialize Firebase app
      this.app = firebase.initializeApp(firebaseConfig);
      this.db = firebase.getFirestore(this.app);
      this.auth = firebase.getAuth(this.app);
      this.storage = firebase.getStorage(this.app);

      // Store all Firebase functions for easy access
      this.functions = {
        // Firestore functions
        collection: firebase.collection,
        addDoc: firebase.addDoc,
        getDocs: firebase.getDocs,
        doc: firebase.doc,
        updateDoc: firebase.updateDoc,
        deleteDoc: firebase.deleteDoc,
        query: firebase.query,
        where: firebase.where,
        orderBy: firebase.orderBy,
        limit: firebase.limit,
        serverTimestamp: firebase.serverTimestamp,
        onSnapshot: firebase.onSnapshot,
        
        // Auth functions
        signInWithEmailAndPassword: firebase.signInWithEmailAndPassword,
        createUserWithEmailAndPassword: firebase.createUserWithEmailAndPassword,
        signOut: firebase.signOut,
        onAuthStateChanged: firebase.onAuthStateChanged,
        GoogleAuthProvider: firebase.GoogleAuthProvider,
        signInWithPopup: firebase.signInWithPopup
      };

      this.initialized = true;
      console.log('✅ Firebase initialized successfully');
      
      // Dispatch custom event to notify app
      window.dispatchEvent(new CustomEvent('firebaseReady', { 
        detail: { firebaseApp: this } 
      }));
      
      return this;
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      throw error;
    }
  }

  waitForFirebase() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max
      
      const checkFirebase = () => {
        attempts++;
        
        if (typeof firebase !== 'undefined' && firebase.initializeApp) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Firebase SDK failed to load'));
        } else {
          setTimeout(checkFirebase, 100);
        }
      };
      
      checkFirebase();
    });
  }

  // Getter methods for easy access
  getApp() {
    if (!this.initialized) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.app;
  }

  getDb() {
    if (!this.initialized) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.db;
  }

  getAuth() {
    if (!this.initialized) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.auth;
  }

  getStorage() {
    if (!this.initialized) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.storage;
  }

  // Helper method to get a function
  getFunction(name) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.functions[name];
  }

  // Helper method to check if initialized
  isInitialized() {
    return this.initialized;
  }
}

// Create global Firebase app instance
window.firebaseApp = new FirebaseApp();

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.firebaseApp.initialize().catch(console.error);
  });
} else {
  // DOM already loaded
  window.firebaseApp.initialize().catch(console.error);
}