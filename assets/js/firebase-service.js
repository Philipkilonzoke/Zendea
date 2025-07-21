// ====================================== //
// 🔥 Firebase Service - Database Operations //
// ====================================== //

class FirebaseService {
  constructor() {
    this.db = null;
    this.auth = null;
    this.currentUser = null;
    this.unsubscribers = [];
    this.initialized = false;
  }

  async initialize() {
    try {
      // Wait for Firebase to be ready
      await this.waitForFirebase();
      
      this.db = window.firebaseApp.getDb();
      this.auth = window.firebaseApp.getAuth();
      
      // Setup auth state listener
      this.setupAuthListener();
      
      this.initialized = true;
      console.log('✅ Firebase Service initialized');
      
      return this;
    } catch (error) {
      console.error('❌ Firebase Service initialization failed:', error);
      throw error;
    }
  }

  waitForFirebase() {
    return new Promise((resolve, reject) => {
      if (window.firebaseApp && window.firebaseApp.isInitialized()) {
        resolve();
        return;
      }

      const handleFirebaseReady = () => {
        window.removeEventListener('firebaseReady', handleFirebaseReady);
        resolve();
      };

      window.addEventListener('firebaseReady', handleFirebaseReady);

      // Timeout after 10 seconds
      setTimeout(() => {
        window.removeEventListener('firebaseReady', handleFirebaseReady);
        reject(new Error('Firebase initialization timeout'));
      }, 10000);
    });
  }

  setupAuthListener() {
    const onAuthStateChanged = window.firebaseApp.getFunction('onAuthStateChanged');
    
    const unsubscribe = onAuthStateChanged(this.auth, async (user) => {
      console.log('🔐 Auth state changed:', user ? 'Logged in' : 'Logged out');
      
      this.currentUser = user;
      
      if (user) {
        // User signed in
        await this.saveUserInfo(user);
        await this.loadUserData();
        this.showAuthenticatedUI();
      } else {
        // User signed out
        this.showGuestUI();
        this.clearUserData();
      }

      // Notify other components about auth state change
      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { user, isAuthenticated: !!user }
      }));
    });

    this.unsubscribers.push(unsubscribe);
  }

  // ============================================ //
  // 👤 USER MANAGEMENT
  // ============================================ //

  async saveUserInfo(user) {
    try {
      const usersCollection = window.firebaseApp.getFunction('collection')(this.db, 'users');
      const userDoc = window.firebaseApp.getFunction('doc')(this.db, 'users', user.uid);
      const updateDoc = window.firebaseApp.getFunction('updateDoc');
      const setDoc = window.firebaseApp.getFunction('setDoc') || updateDoc; // Fallback
      const serverTimestamp = window.firebaseApp.getFunction('serverTimestamp');

      const userData = {
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        lastLogin: serverTimestamp(),
        role: 'user' // Default role
      };

      // Try to update, if document doesn't exist, create it
      try {
        await updateDoc(userDoc, userData);
      } catch (error) {
        if (error.code === 'not-found') {
          await setDoc(userDoc, userData);
        } else {
          throw error;
        }
      }

      console.log('✅ User info saved');
    } catch (error) {
      console.error('❌ Error saving user info:', error);
    }
  }

  // ============================================ //
  // 📝 POSTS MANAGEMENT
  // ============================================ //

  async createPost(postData) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User must be authenticated to create posts');
      }

      const postsCollection = window.firebaseApp.getFunction('collection')(this.db, 'posts');
      const addDoc = window.firebaseApp.getFunction('addDoc');
      const serverTimestamp = window.firebaseApp.getFunction('serverTimestamp');

      const post = {
        ...postData,
        postedBy: this.currentUser.uid,
        postedByName: this.currentUser.displayName || this.currentUser.email.split('@')[0],
        createdAt: serverTimestamp(),
        status: 'active'
      };

      const docRef = await addDoc(postsCollection, post);
      
      // Create notification for new post
      await this.createNotification({
        type: 'new_post',
        title: 'New Post Created',
        message: `New ${postData.type} posted: ${postData.title}`,
        userId: 'all', // Notification for all users
        createdAt: serverTimestamp()
      });

      // Track analytics
      await this.trackAnalytics('post_created', {
        postId: docRef.id,
        type: postData.type,
        userId: this.currentUser.uid
      });

      console.log('✅ Post created successfully');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating post:', error);
      throw error;
    }
  }

  async loadPosts(limit = 20) {
    try {
      const postsCollection = window.firebaseApp.getFunction('collection')(this.db, 'posts');
      const query = window.firebaseApp.getFunction('query');
      const where = window.firebaseApp.getFunction('where');
      const orderBy = window.firebaseApp.getFunction('orderBy');
      const limitFunc = window.firebaseApp.getFunction('limit');
      const getDocs = window.firebaseApp.getFunction('getDocs');

      const q = query(
        postsCollection,
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limitFunc(limit)
      );

      const querySnapshot = await getDocs(q);
      const posts = [];

      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`✅ Loaded ${posts.length} posts`);
      return posts;
    } catch (error) {
      console.error('❌ Error loading posts:', error);
      return [];
    }
  }

  async editPost(postId, updateData) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User must be authenticated to edit posts');
      }

      const postDoc = window.firebaseApp.getFunction('doc')(this.db, 'posts', postId);
      const updateDoc = window.firebaseApp.getFunction('updateDoc');
      const serverTimestamp = window.firebaseApp.getFunction('serverTimestamp');

      await updateDoc(postDoc, {
        ...updateData,
        updatedAt: serverTimestamp()
      });

      // Track analytics
      await this.trackAnalytics('post_updated', {
        postId,
        userId: this.currentUser.uid
      });

      console.log('✅ Post updated successfully');
    } catch (error) {
      console.error('❌ Error updating post:', error);
      throw error;
    }
  }

  async deletePost(postId) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User must be authenticated to delete posts');
      }

      const postDoc = window.firebaseApp.getFunction('doc')(this.db, 'posts', postId);
      const deleteDoc = window.firebaseApp.getFunction('deleteDoc');

      await deleteDoc(postDoc);

      // Track analytics
      await this.trackAnalytics('post_deleted', {
        postId,
        userId: this.currentUser.uid
      });

      console.log('✅ Post deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting post:', error);
      throw error;
    }
  }

  // ============================================ //
  // 🔔 NOTIFICATIONS MANAGEMENT
  // ============================================ //

  async createNotification(notificationData) {
    try {
      const notificationsCollection = window.firebaseApp.getFunction('collection')(this.db, 'notifications');
      const addDoc = window.firebaseApp.getFunction('addDoc');
      const serverTimestamp = window.firebaseApp.getFunction('serverTimestamp');

      const notification = {
        ...notificationData,
        read: false,
        createdAt: serverTimestamp()
      };

      await addDoc(notificationsCollection, notification);
      console.log('✅ Notification created');
    } catch (error) {
      console.error('❌ Error creating notification:', error);
    }
  }

  async loadNotifications() {
    try {
      if (!this.isAuthenticated()) return [];

      const notificationsCollection = window.firebaseApp.getFunction('collection')(this.db, 'notifications');
      const query = window.firebaseApp.getFunction('query');
      const where = window.firebaseApp.getFunction('where');
      const orderBy = window.firebaseApp.getFunction('orderBy');
      const getDocs = window.firebaseApp.getFunction('getDocs');

      const q = query(
        notificationsCollection,
        where('userId', 'in', [this.currentUser.uid, 'all']),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const notifications = [];

      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`✅ Loaded ${notifications.length} notifications`);
      return notifications;
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      const notificationDoc = window.firebaseApp.getFunction('doc')(this.db, 'notifications', notificationId);
      const updateDoc = window.firebaseApp.getFunction('updateDoc');

      await updateDoc(notificationDoc, { read: true });
      console.log('✅ Notification marked as read');
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }

  // ============================================ //
  // 💬 FEEDBACK MANAGEMENT
  // ============================================ //

  async submitFeedback(feedbackData) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User must be authenticated to submit feedback');
      }

      const feedbackCollection = window.firebaseApp.getFunction('collection')(this.db, 'feedback');
      const addDoc = window.firebaseApp.getFunction('addDoc');
      const serverTimestamp = window.firebaseApp.getFunction('serverTimestamp');

      const feedback = {
        ...feedbackData,
        userId: this.currentUser.uid,
        userEmail: this.currentUser.email,
        createdAt: serverTimestamp(),
        status: 'pending'
      };

      await addDoc(feedbackCollection, feedback);

      // Track analytics
      await this.trackAnalytics('feedback_submitted', {
        userId: this.currentUser.uid,
        rating: feedbackData.rating
      });

      console.log('✅ Feedback submitted successfully');
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      throw error;
    }
  }

  // ============================================ //
  // ⭐ FAVORITES MANAGEMENT
  // ============================================ //

  async toggleFavorite(postId) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User must be authenticated to manage favorites');
      }

      const favoritesCollection = window.firebaseApp.getFunction('collection')(this.db, 'favorites');
      const query = window.firebaseApp.getFunction('query');
      const where = window.firebaseApp.getFunction('where');
      const getDocs = window.firebaseApp.getFunction('getDocs');
      const addDoc = window.firebaseApp.getFunction('addDoc');
      const deleteDoc = window.firebaseApp.getFunction('deleteDoc');
      const serverTimestamp = window.firebaseApp.getFunction('serverTimestamp');

      // Check if already favorited
      const q = query(
        favoritesCollection,
        where('userId', '==', this.currentUser.uid),
        where('postId', '==', postId)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Add to favorites
        await addDoc(favoritesCollection, {
          userId: this.currentUser.uid,
          postId,
          createdAt: serverTimestamp()
        });
        console.log('✅ Added to favorites');
        return true; // Added
      } else {
        // Remove from favorites
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
        console.log('✅ Removed from favorites');
        return false; // Removed
      }
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      throw error;
    }
  }

  async loadFavorites() {
    try {
      if (!this.isAuthenticated()) return [];

      const favoritesCollection = window.firebaseApp.getFunction('collection')(this.db, 'favorites');
      const query = window.firebaseApp.getFunction('query');
      const where = window.firebaseApp.getFunction('where');
      const getDocs = window.firebaseApp.getFunction('getDocs');

      const q = query(
        favoritesCollection,
        where('userId', '==', this.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const favoritePostIds = [];

      querySnapshot.forEach((doc) => {
        favoritePostIds.push(doc.data().postId);
      });

      // Load the actual posts
      if (favoritePostIds.length === 0) return [];

      const postsCollection = window.firebaseApp.getFunction('collection')(this.db, 'posts');
      const postsQuery = query(
        postsCollection,
        where('__name__', 'in', favoritePostIds)
      );

      const postsSnapshot = await getDocs(postsQuery);
      const favoritePosts = [];

      postsSnapshot.forEach((doc) => {
        favoritePosts.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`✅ Loaded ${favoritePosts.length} favorite posts`);
      return favoritePosts;
    } catch (error) {
      console.error('❌ Error loading favorites:', error);
      return [];
    }
  }

  // ============================================ //
  // 📊 ANALYTICS MANAGEMENT
  // ============================================ //

  async trackAnalytics(event, data = {}) {
    try {
      const analyticsCollection = window.firebaseApp.getFunction('collection')(this.db, 'analytics');
      const addDoc = window.firebaseApp.getFunction('addDoc');
      const serverTimestamp = window.firebaseApp.getFunction('serverTimestamp');

      const analyticsData = {
        event,
        data,
        userId: this.currentUser?.uid || 'anonymous',
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      await addDoc(analyticsCollection, analyticsData);
      console.log(`📊 Analytics tracked: ${event}`);
    } catch (error) {
      console.error('❌ Error tracking analytics:', error);
    }
  }

  // ============================================ //
  // 💬 MESSAGES MANAGEMENT
  // ============================================ //

  async sendMessage(recipientEmail, subject, message) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User must be authenticated to send messages');
      }

      // Find recipient user
      const usersCollection = window.firebaseApp.getFunction('collection')(this.db, 'users');
      const query = window.firebaseApp.getFunction('query');
      const where = window.firebaseApp.getFunction('where');
      const getDocs = window.firebaseApp.getFunction('getDocs');

      const q = query(usersCollection, where('email', '==', recipientEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Recipient not found');
      }

      let recipientId = null;
      querySnapshot.forEach((doc) => {
        recipientId = doc.id;
      });

      // Send message
      const messagesCollection = window.firebaseApp.getFunction('collection')(this.db, 'messages');
      const addDoc = window.firebaseApp.getFunction('addDoc');
      const serverTimestamp = window.firebaseApp.getFunction('serverTimestamp');

      await addDoc(messagesCollection, {
        senderId: this.currentUser.uid,
        senderEmail: this.currentUser.email,
        recipientId,
        recipientEmail,
        subject,
        message,
        read: false,
        createdAt: serverTimestamp()
      });

      // Create notification for recipient
      await this.createNotification({
        type: 'new_message',
        title: 'New Message',
        message: `You have a new message from ${this.currentUser.email}`,
        userId: recipientId,
        createdAt: serverTimestamp()
      });

      // Track analytics
      await this.trackAnalytics('message_sent', {
        recipientId,
        userId: this.currentUser.uid
      });

      console.log('✅ Message sent successfully');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  async loadMessages() {
    try {
      if (!this.isAuthenticated()) return [];

      const messagesCollection = window.firebaseApp.getFunction('collection')(this.db, 'messages');
      const query = window.firebaseApp.getFunction('query');
      const where = window.firebaseApp.getFunction('where');
      const orderBy = window.firebaseApp.getFunction('orderBy');
      const getDocs = window.firebaseApp.getFunction('getDocs');

      const q = query(
        messagesCollection,
        where('recipientId', '==', this.currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const messages = [];

      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`✅ Loaded ${messages.length} messages`);
      return messages;
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      return [];
    }
  }

  async markMessageAsRead(messageId) {
    try {
      const messageDoc = window.firebaseApp.getFunction('doc')(this.db, 'messages', messageId);
      const updateDoc = window.firebaseApp.getFunction('updateDoc');

      await updateDoc(messageDoc, { read: true });
      console.log('✅ Message marked as read');
    } catch (error) {
      console.error('❌ Error marking message as read:', error);
    }
  }

  // ============================================ //
  // 🎛️ UI MANAGEMENT
  // ============================================ //

  showAuthenticatedUI() {
    // Show authenticated elements
    document.querySelectorAll('.auth-only').forEach(el => {
      el.classList.remove('hidden');
    });

    // Hide guest elements
    document.querySelectorAll('.guest-only').forEach(el => {
      el.classList.add('hidden');
    });

    // Update user greeting
    const userGreeting = document.getElementById('userGreeting');
    if (userGreeting && this.currentUser) {
      const name = this.currentUser.displayName || this.currentUser.email.split('@')[0];
      userGreeting.textContent = `Hello, ${name}!`;
      userGreeting.classList.remove('hidden');
    }
  }

  showGuestUI() {
    // Hide authenticated elements
    document.querySelectorAll('.auth-only').forEach(el => {
      el.classList.add('hidden');
    });

    // Show guest elements
    document.querySelectorAll('.guest-only').forEach(el => {
      el.classList.remove('hidden');
    });

    // Hide user greeting
    const userGreeting = document.getElementById('userGreeting');
    if (userGreeting) {
      userGreeting.classList.add('hidden');
    }
  }

  clearUserData() {
    // Clear any cached user data
    console.log('🧹 Clearing user data');
  }

  async loadUserData() {
    if (!this.isAuthenticated()) return;

    try {
      // Load user's posts, notifications, favorites, etc.
      console.log('📥 Loading user data...');
      
      // Dispatch event for other components to load their data
      window.dispatchEvent(new CustomEvent('loadUserData', {
        detail: { userId: this.currentUser.uid }
      }));
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    }
  }

  // ============================================ //
  // 🔐 AUTHENTICATION HELPERS
  // ============================================ //

  isAuthenticated() {
    return !!this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async signOut() {
    try {
      const signOut = window.firebaseApp.getFunction('signOut');
      await signOut(this.auth);
      console.log('✅ User signed out');
      
      // Clear unsubscribers
      this.unsubscribers.forEach(unsubscribe => unsubscribe());
      this.unsubscribers = [];
      
      // Reload page to reset state
      window.location.reload();
    } catch (error) {
      console.error('❌ Error signing out:', error);
      throw error;
    }
  }

  // ============================================ //
  // 🗑️ CLEANUP
  // ============================================ //

  destroy() {
    // Clean up all listeners
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
    console.log('🗑️ Firebase Service destroyed');
  }
}

// Create global instance
window.firebaseService = new FirebaseService();

// Initialize when Firebase is ready
window.addEventListener('firebaseReady', () => {
  window.firebaseService.initialize().catch(console.error);
});