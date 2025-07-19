// ===================================
// 🚀 ZENDEA - ADVANCED APPLICATION SCRIPT
// ===================================

// 🔥 Firebase Services & Collections Management
class FirebaseService {
  constructor() {
    this.db = null;
    this.auth = null;
    this.currentUser = null;
    this.init();
  }

  init() {
    // Wait for Firebase to be loaded
    const waitForFirebase = () => {
      if (window.firebase) {
        this.db = window.firebase.db;
        this.auth = window.firebase.auth;
        this.setupAuthListener();
        console.log('✅ Firebase services initialized');
      } else {
        setTimeout(waitForFirebase, 100);
      }
    };
    waitForFirebase();
  }

  setupAuthListener() {
    window.firebase.onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      if (user) {
        this.saveUserInfo(user);
        this.loadUserData();
        this.showAuthenticatedUI();
        console.log('✅ User authenticated:', user.email);
      } else {
        this.showGuestUI();
        console.log('ℹ️ User not authenticated');
      }
    });
  }

  // 👤 Users Collection Management
  async saveUserInfo(user) {
    try {
      const userRef = window.firebase.doc(this.db, 'users', user.uid);
      await window.firebase.updateDoc(userRef, {
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        lastLogin: window.firebase.serverTimestamp(),
        role: 'user' // Default role, can be updated to 'admin' later
      }).catch(async () => {
        // If document doesn't exist, create it
        await window.firebase.addDoc(window.firebase.collection(this.db, 'users'), {
          uid: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          createdAt: window.firebase.serverTimestamp(),
          lastLogin: window.firebase.serverTimestamp(),
          role: 'user'
        });
      });
      
      this.trackAnalytics('user_login', { userId: user.uid });
    } catch (error) {
      console.error('Error saving user info:', error);
    }
  }

  // 📄 Posts Collection Management
  async createPost(postData) {
    if (!this.currentUser) {
      showToast('Please sign in to create posts', 'error');
      return null;
    }

    try {
      const post = {
        title: postData.title,
        description: postData.description,
        type: postData.type,
        location: postData.location,
        price: postData.price || '',
        postedBy: this.currentUser.uid,
        postedByName: this.currentUser.displayName || this.currentUser.email.split('@')[0],
        createdAt: window.firebase.serverTimestamp(),
        status: 'active'
      };

      const docRef = await window.firebase.addDoc(window.firebase.collection(this.db, 'posts'), post);
      
      // Send notification about new post
      await this.createNotification({
        title: 'New Post Created',
        message: `Your ${postData.type} post "${postData.title}" has been published`,
        type: 'post_created',
        userId: this.currentUser.uid
      });

      this.trackAnalytics('post_created', { 
        postId: docRef.id, 
        postType: postData.type,
        userId: this.currentUser.uid 
      });

      showToast('Post created successfully!', 'success');
      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      showToast('Failed to create post', 'error');
      return null;
    }
  }

  async loadPosts() {
    try {
      const q = window.firebase.query(
        window.firebase.collection(this.db, 'posts'),
        window.firebase.where('status', '==', 'active'),
        window.firebase.orderBy('createdAt', 'desc'),
        window.firebase.limit(20)
      );
      
      const querySnapshot = await window.firebase.getDocs(q);
      const posts = [];
      
      querySnapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      
      this.displayPosts(posts);
      return posts;
    } catch (error) {
      console.error('Error loading posts:', error);
      showToast('Failed to load posts', 'error');
      return [];
    }
  }

  async editPost(postId, updateData) {
    if (!this.currentUser) return false;

    try {
      const postRef = window.firebase.doc(this.db, 'posts', postId);
      await window.firebase.updateDoc(postRef, {
        ...updateData,
        updatedAt: window.firebase.serverTimestamp()
      });

      this.trackAnalytics('post_edited', { postId, userId: this.currentUser.uid });
      showToast('Post updated successfully!', 'success');
      return true;
    } catch (error) {
      console.error('Error editing post:', error);
      showToast('Failed to update post', 'error');
      return false;
    }
  }

  async deletePost(postId) {
    if (!this.currentUser) return false;

    try {
      await window.firebase.deleteDoc(window.firebase.doc(this.db, 'posts', postId));
      
      this.trackAnalytics('post_deleted', { postId, userId: this.currentUser.uid });
      showToast('Post deleted successfully!', 'success');
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast('Failed to delete post', 'error');
      return false;
    }
  }

  // 🔔 Notifications Collection Management
  async createNotification(notificationData) {
    try {
      await window.firebase.addDoc(window.firebase.collection(this.db, 'notifications'), {
        ...notificationData,
        createdAt: window.firebase.serverTimestamp(),
        read: false
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  async loadNotifications() {
    if (!this.currentUser) return [];

    try {
      const q = window.firebase.query(
        window.firebase.collection(this.db, 'notifications'),
        window.firebase.where('userId', '==', this.currentUser.uid),
        window.firebase.orderBy('createdAt', 'desc'),
        window.firebase.limit(20)
      );
      
      const querySnapshot = await window.firebase.getDocs(q);
      const notifications = [];
      
      querySnapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() });
      });
      
      this.displayNotifications(notifications);
      return notifications;
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      const notificationRef = window.firebase.doc(this.db, 'notifications', notificationId);
      await window.firebase.updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // 💬 Feedback Collection Management
  async submitFeedback(feedbackData) {
    if (!this.currentUser) {
      showToast('Please sign in to submit feedback', 'error');
      return false;
    }

    try {
      await window.firebase.addDoc(window.firebase.collection(this.db, 'feedback'), {
        ...feedbackData,
        userId: this.currentUser.uid,
        userEmail: this.currentUser.email,
        createdAt: window.firebase.serverTimestamp(),
        status: 'pending'
      });

      this.trackAnalytics('feedback_submitted', { 
        feedbackType: feedbackData.type,
        userId: this.currentUser.uid 
      });

      showToast('Feedback submitted successfully! Thank you!', 'success');
      return true;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showToast('Failed to submit feedback', 'error');
      return false;
    }
  }

  // ❤️ Favorites Collection Management
  async toggleFavorite(postId) {
    if (!this.currentUser) {
      showToast('Please sign in to save favorites', 'error');
      return false;
    }

    try {
      const favoriteId = `${this.currentUser.uid}_${postId}`;
      const favoriteRef = window.firebase.doc(this.db, 'favorites', favoriteId);
      
      // Check if already favorited
      const favoriteDoc = await window.firebase.getDocs(
        window.firebase.query(
          window.firebase.collection(this.db, 'favorites'),
          window.firebase.where('userId', '==', this.currentUser.uid),
          window.firebase.where('postId', '==', postId)
        )
      );

      if (!favoriteDoc.empty) {
        // Remove from favorites
        await window.firebase.deleteDoc(favoriteDoc.docs[0].ref);
        showToast('Removed from favorites', 'info');
        return false;
      } else {
        // Add to favorites
        await window.firebase.addDoc(window.firebase.collection(this.db, 'favorites'), {
          userId: this.currentUser.uid,
          postId: postId,
          createdAt: window.firebase.serverTimestamp()
        });
        showToast('Added to favorites!', 'success');
        return true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('Failed to update favorites', 'error');
      return false;
    }
  }

  async loadFavorites() {
    if (!this.currentUser) return [];

    try {
      const q = window.firebase.query(
        window.firebase.collection(this.db, 'favorites'),
        window.firebase.where('userId', '==', this.currentUser.uid),
        window.firebase.orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await window.firebase.getDocs(q);
      const favoritePostIds = [];
      
      querySnapshot.forEach((doc) => {
        favoritePostIds.push(doc.data().postId);
      });
      
      // Load the actual posts
      if (favoritePostIds.length > 0) {
        const favoritePosts = [];
        for (const postId of favoritePostIds) {
          const postDoc = await window.firebase.getDocs(
            window.firebase.query(
              window.firebase.collection(this.db, 'posts'),
              window.firebase.where('__name__', '==', postId)
            )
          );
          if (!postDoc.empty) {
            favoritePosts.push({ id: postDoc.docs[0].id, ...postDoc.docs[0].data() });
          }
        }
        this.displayFavorites(favoritePosts);
        return favoritePosts;
      }
      
      return [];
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }

  // 📊 Analytics Collection Management
  async trackAnalytics(event, data = {}) {
    if (!ZendeaApp.config.analyticsEnabled) return;

    try {
      await window.firebase.addDoc(window.firebase.collection(this.db, 'analytics'), {
        event,
        data,
        userId: this.currentUser?.uid || 'anonymous',
        timestamp: window.firebase.serverTimestamp(),
        userAgent: navigator.userAgent,
        page: window.location.pathname
      });
    } catch (error) {
      console.error('Error tracking analytics:', error);
    }
  }

  // 💌 Messages Collection Management
  async sendMessage(recipientEmail, subject, message) {
    if (!this.currentUser) {
      showToast('Please sign in to send messages', 'error');
      return false;
    }

    try {
      // Find recipient user
      const recipientQuery = window.firebase.query(
        window.firebase.collection(this.db, 'users'),
        window.firebase.where('email', '==', recipientEmail)
      );
      
      const recipientSnapshot = await window.firebase.getDocs(recipientQuery);
      
      if (recipientSnapshot.empty) {
        showToast('Recipient not found', 'error');
        return false;
      }

      const recipientId = recipientSnapshot.docs[0].data().uid;

      await window.firebase.addDoc(window.firebase.collection(this.db, 'messages'), {
        senderId: this.currentUser.uid,
        senderEmail: this.currentUser.email,
        recipientId: recipientId,
        recipientEmail: recipientEmail,
        subject: subject,
        message: message,
        createdAt: window.firebase.serverTimestamp(),
        read: false
      });

      // Create notification for recipient
      await this.createNotification({
        title: 'New Message',
        message: `You have a new message from ${this.currentUser.email}`,
        type: 'message_received',
        userId: recipientId
      });

      this.trackAnalytics('message_sent', { recipientId });
      showToast('Message sent successfully!', 'success');
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message', 'error');
      return false;
    }
  }

  async loadMessages() {
    if (!this.currentUser) return [];

    try {
      const q = window.firebase.query(
        window.firebase.collection(this.db, 'messages'),
        window.firebase.where('recipientId', '==', this.currentUser.uid),
        window.firebase.orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await window.firebase.getDocs(q);
      const messages = [];
      
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      
      this.displayMessages(messages);
      return messages;
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  }

  // UI Helper Methods
  showAuthenticatedUI() {
    const fab = document.getElementById('fab');
    const userGreeting = document.getElementById('userGreeting');
    const authLink = document.getElementById('authLink');
    
    if (fab) fab.classList.remove('hidden');
    if (userGreeting) {
      userGreeting.classList.remove('hidden');
      const userName = document.getElementById('userName');
      if (userName) {
        userName.textContent = this.currentUser.displayName || this.currentUser.email.split('@')[0];
      }
    }
    if (authLink) {
      authLink.innerHTML = '<i class="fas fa-sign-out-alt"></i><span class="btn-text">Sign Out</span>';
      authLink.onclick = () => this.signOut();
    }
  }

  showGuestUI() {
    const fab = document.getElementById('fab');
    const userGreeting = document.getElementById('userGreeting');
    const authLink = document.getElementById('authLink');
    
    if (fab) fab.classList.add('hidden');
    if (userGreeting) userGreeting.classList.add('hidden');
    if (authLink) {
      authLink.innerHTML = '<i class="fas fa-sign-in-alt"></i><span class="btn-text">Sign In</span>';
      authLink.onclick = () => window.location.href = 'login.html';
    }
  }

  async signOut() {
    try {
      await window.firebase.signOut(this.auth);
      showToast('Signed out successfully', 'success');
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
      showToast('Failed to sign out', 'error');
    }
  }

  displayPosts(posts) {
    const jobsList = document.getElementById('jobs-list');
    const dealsList = document.getElementById('deals-list');
    
    if (jobsList) jobsList.innerHTML = '';
    if (dealsList) dealsList.innerHTML = '';

    posts.forEach(post => {
      const postElement = this.createPostElement(post);
      if (post.type === 'job' && jobsList) {
        jobsList.appendChild(postElement);
      } else if (post.type === 'deal' && dealsList) {
        dealsList.appendChild(postElement);
      }
    });
  }

  createPostElement(post) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header">
        <span class="card-type ${post.type}">${post.type}</span>
        ${this.currentUser && this.currentUser.uid === post.postedBy ? `
          <div class="card-actions">
            <button class="btn-icon edit-btn" onclick="firebaseService.editPost('${post.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon delete-btn" onclick="firebaseService.deletePost('${post.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        ` : ''}
      </div>
      <h3 class="card-title">${post.title}</h3>
      <p class="card-description">${post.description}</p>
      <div class="card-meta">
        <span class="card-meta-item">
          <i class="fas fa-map-marker-alt"></i>
          ${post.location}
        </span>
        <span class="card-meta-item">
          <i class="fas fa-user"></i>
          ${post.postedByName}
        </span>
        ${post.price ? `
          <span class="card-meta-item">
            <i class="fas fa-dollar-sign"></i>
            ${post.price}
          </span>
        ` : ''}
      </div>
      <div class="card-footer">
        <button class="btn btn-outline btn-sm favorite-btn" onclick="firebaseService.toggleFavorite('${post.id}')">
          <i class="fas fa-heart"></i> Save
        </button>
        <button class="btn btn-primary btn-sm">
          <i class="fas fa-eye"></i> View Details
        </button>
      </div>
    `;
    return card;
  }

  displayNotifications(notifications) {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;

    notificationsList.innerHTML = '';

    notifications.forEach(notification => {
      const notificationElement = document.createElement('div');
      notificationElement.className = `notification ${notification.read ? 'read' : 'unread'}`;
      notificationElement.innerHTML = `
        <div class="notification-content">
          <h4>${notification.title}</h4>
          <p>${notification.message}</p>
          <span class="notification-time">${this.formatDate(notification.createdAt)}</span>
        </div>
        ${!notification.read ? `
          <button class="btn btn-sm" onclick="firebaseService.markNotificationAsRead('${notification.id}')">
            Mark as read
          </button>
        ` : ''}
      `;
      notificationsList.appendChild(notificationElement);
    });
  }

  displayFavorites(favorites) {
    const favoritesList = document.getElementById('favorites-list');
    if (!favoritesList) return;

    favoritesList.innerHTML = '';

    if (favorites.length === 0) {
      favoritesList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-heart-broken"></i>
          <h3>No favorites yet</h3>
          <p>Start saving posts you like and they'll appear here!</p>
        </div>
      `;
      return;
    }

    favorites.forEach(post => {
      const postElement = this.createPostElement(post);
      favoritesList.appendChild(postElement);
    });
  }

  displayMessages(messages) {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) return;

    conversationsList.innerHTML = '';

    messages.forEach(message => {
      const messageElement = document.createElement('div');
      messageElement.className = `conversation ${!message.read ? 'unread' : ''}`;
      messageElement.innerHTML = `
        <div class="conversation-avatar">
          <i class="fas fa-user"></i>
        </div>
        <div class="conversation-content">
          <h4>${message.senderEmail}</h4>
          <p>${message.subject}</p>
          <span class="conversation-time">${this.formatDate(message.createdAt)}</span>
        </div>
      `;
      messageElement.onclick = () => this.openMessage(message);
      conversationsList.appendChild(messageElement);
    });
  }

  formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  openMessage(message) {
    const messageThread = document.getElementById('messageThread');
    const messageThreadHeader = document.getElementById('messageThreadHeader');
    const messagesList = document.getElementById('messagesList');
    const messageInputContainer = document.getElementById('messageInputContainer');

    if (messageThreadHeader) {
      messageThreadHeader.innerHTML = `
        <div class="message-header-info">
          <h4>${message.senderEmail}</h4>
          <p>${message.subject}</p>
        </div>
      `;
    }

    if (messagesList) {
      messagesList.innerHTML = `
        <div class="message-bubble">
          <div class="message-sender">${message.senderEmail}</div>
          <div class="message-content">${message.message}</div>
          <div class="message-time">${this.formatDate(message.createdAt)}</div>
        </div>
      `;
    }

    if (messageInputContainer) {
      messageInputContainer.classList.remove('hidden');
    }

    // Mark message as read
    this.markMessageAsRead(message.id);
  }

  async markMessageAsRead(messageId) {
    try {
      const messageRef = window.firebase.doc(this.db, 'messages', messageId);
      await window.firebase.updateDoc(messageRef, { read: true });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Get current user info
  getCurrentUser() {
    return this.currentUser;
  }

  async loadUserData() {
    if (!this.currentUser) return;
    
    await Promise.all([
      this.loadPosts(),
      this.loadNotifications(),
      this.loadFavorites(),
      this.loadMessages()
    ]);
  }

  // Admin-only notification (for future admin features)
  async createAdminNotification(title, message) {
    try {
      // Get all users
      const usersQuery = window.firebase.query(
        window.firebase.collection(this.db, 'users')
      );
      
      const usersSnapshot = await window.firebase.getDocs(usersQuery);
      
      // Send notification to all users
      const promises = [];
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        promises.push(
          window.firebase.addDoc(window.firebase.collection(this.db, 'notifications'), {
            title: title,
            message: message,
            type: 'admin_announcement',
            userId: userData.uid,
            createdAt: window.firebase.serverTimestamp(),
            read: false
          })
        );
      });
      
      await Promise.all(promises);
      console.log('✅ Admin notification sent to all users');
    } catch (error) {
      console.error('Error creating admin notification:', error);
    }
  }
}

// Initialize Firebase Service
const firebaseService = new FirebaseService();

// 🎯 UI Event Handlers for Firebase Features
document.addEventListener('DOMContentLoaded', function() {
  initFirebaseUI();
});

function initFirebaseUI() {
  // Navigation handlers
  const messagesLink = document.getElementById('messagesLink');
  const favoritesLink = document.getElementById('favoritesLink');
  const feedbackLink = document.getElementById('feedbackLink');
  const fab = document.getElementById('fab');
  const notificationBtn = document.getElementById('notificationBtn');

  // Modal handlers
  const createPostModal = document.getElementById('createPostModal');
  const composeMessageModal = document.getElementById('composeMessageModal');
  const closeCreatePostModal = document.getElementById('closeCreatePostModal');
  const closeComposeMessageModal = document.getElementById('closeComposeMessageModal');
  const cancelCreatePost = document.getElementById('cancelCreatePost');
  const cancelComposeMessage = document.getElementById('cancelComposeMessage');

  // Form handlers
  const createPostForm = document.getElementById('createPostForm');
  const feedbackForm = document.getElementById('feedbackForm');
  const composeMessageForm = document.getElementById('composeMessageForm');
  const composeMessageBtn = document.getElementById('composeMessageBtn');

  // Section visibility handlers
  const sections = ['messagesSection', 'favoritesSection', 'feedbackSection'];
  
  if (messagesLink) {
    messagesLink.addEventListener('click', (e) => {
      e.preventDefault();
      showSection('messagesSection');
      updateNavigation('messagesLink');
    });
  }

  if (favoritesLink) {
    favoritesLink.addEventListener('click', (e) => {
      e.preventDefault();
      showSection('favoritesSection');
      updateNavigation('favoritesLink');
      firebaseService.loadFavorites();
    });
  }

  if (feedbackLink) {
    feedbackLink.addEventListener('click', (e) => {
      e.preventDefault();
      showSection('feedbackSection');
      updateNavigation('feedbackLink');
    });
  }

  // FAB click handler
  if (fab) {
    fab.addEventListener('click', () => {
      if (createPostModal) {
        createPostModal.classList.remove('hidden');
      }
    });
  }

  // Notification panel toggle
  if (notificationBtn) {
    notificationBtn.addEventListener('click', () => {
      const notificationsPanel = document.getElementById('notificationsPanel');
      if (notificationsPanel) {
        notificationsPanel.classList.toggle('hidden');
        if (!notificationsPanel.classList.contains('hidden')) {
          firebaseService.loadNotifications();
        }
      }
    });
  }

  // Modal close handlers
  if (closeCreatePostModal || cancelCreatePost) {
    [closeCreatePostModal, cancelCreatePost].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          if (createPostModal) {
            createPostModal.classList.add('hidden');
            document.getElementById('createPostForm')?.reset();
          }
        });
      }
    });
  }

  if (closeComposeMessageModal || cancelComposeMessage) {
    [closeComposeMessageModal, cancelComposeMessage].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          if (composeMessageModal) {
            composeMessageModal.classList.add('hidden');
            document.getElementById('composeMessageForm')?.reset();
          }
        });
      }
    });
  }

  if (composeMessageBtn) {
    composeMessageBtn.addEventListener('click', () => {
      if (composeMessageModal) {
        composeMessageModal.classList.remove('hidden');
      }
    });
  }

  // Form submission handlers
  if (createPostForm) {
    createPostForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(createPostForm);
      const postData = {
        title: document.getElementById('postTitle')?.value,
        description: document.getElementById('postDescription')?.value,
        type: document.getElementById('postType')?.value,
        location: document.getElementById('postLocation')?.value,
        price: document.getElementById('postPrice')?.value
      };

      if (!postData.title || !postData.description || !postData.type || !postData.location) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      const postId = await firebaseService.createPost(postData);
      if (postId) {
        createPostModal.classList.add('hidden');
        createPostForm.reset();
        firebaseService.loadPosts(); // Refresh posts
      }
    });
  }

  if (feedbackForm) {
    feedbackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const feedbackData = {
        type: document.getElementById('feedbackType')?.value,
        title: document.getElementById('feedbackTitle')?.value,
        message: document.getElementById('feedbackMessage')?.value,
        rating: getSelectedRating()
      };

      if (!feedbackData.type || !feedbackData.title || !feedbackData.message) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      const success = await firebaseService.submitFeedback(feedbackData);
      if (success) {
        feedbackForm.reset();
        resetRatingStars();
      }
    });
  }

  if (composeMessageForm) {
    composeMessageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const messageData = {
        recipientEmail: document.getElementById('messageRecipient')?.value,
        subject: document.getElementById('messageSubject')?.value,
        message: document.getElementById('messageBody')?.value
      };

      if (!messageData.recipientEmail || !messageData.subject || !messageData.message) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      const success = await firebaseService.sendMessage(
        messageData.recipientEmail, 
        messageData.subject, 
        messageData.message
      );
      
      if (success) {
        composeMessageModal.classList.add('hidden');
        composeMessageForm.reset();
      }
    });
  }

  // Rating stars functionality
  const ratingStars = document.querySelectorAll('.star');
  let selectedRating = 0;

  ratingStars.forEach((star, index) => {
    star.addEventListener('click', () => {
      selectedRating = index + 1;
      updateRatingStars(selectedRating);
    });

    star.addEventListener('mouseover', () => {
      updateRatingStars(index + 1);
    });
  });

  const ratingContainer = document.getElementById('feedbackRating');
  if (ratingContainer) {
    ratingContainer.addEventListener('mouseleave', () => {
      updateRatingStars(selectedRating);
    });
  }

  function updateRatingStars(rating) {
    ratingStars.forEach((star, index) => {
      if (index < rating) {
        star.style.color = '#ffd700';
        star.textContent = '★';
      } else {
        star.style.color = '#ddd';
        star.textContent = '☆';
      }
    });
  }

  function getSelectedRating() {
    return selectedRating;
  }

  function resetRatingStars() {
    selectedRating = 0;
    updateRatingStars(0);
  }

  // Clear favorites handler
  const clearFavorites = document.getElementById('clearFavorites');
  if (clearFavorites) {
    clearFavorites.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear all favorites?')) {
        // This would need a bulk delete method in Firebase service
        showToast('Feature coming soon!', 'info');
      }
    });
  }

  // Mark all notifications as read
  const markAllRead = document.getElementById('markAllRead');
  if (markAllRead) {
    markAllRead.addEventListener('click', async () => {
      // This would need a bulk update method in Firebase service
      showToast('Feature coming soon!', 'info');
    });
  }

  function showSection(sectionId) {
    // Hide all sections first
    sections.forEach(section => {
      const element = document.getElementById(section);
      if (element) {
        element.classList.add('hidden');
      }
    });

    // Show the main content sections
    const mainSections = document.querySelectorAll('main > section:not(.hidden)');
    mainSections.forEach(section => {
      if (!section.id || !sections.includes(section.id)) {
        section.style.display = 'none';
      }
    });

    // Show the requested section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.remove('hidden');
      targetSection.style.display = 'block';
    }
  }

  function updateNavigation(activeLink) {
    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    // Add active class to clicked item
    const activeNavItem = document.getElementById(activeLink);
    if (activeNavItem) {
      activeNavItem.classList.add('active');
    }
  }

  // Initialize with home view
  const homeLink = document.querySelector('.nav-item[data-page="home"]');
  if (homeLink) {
    homeLink.addEventListener('click', () => {
      // Show main sections again
      const mainSections = document.querySelectorAll('main > section');
      mainSections.forEach(section => {
        if (!sections.includes(section.id)) {
          section.style.display = 'block';
        }
      });

      // Hide custom sections
      sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
          element.classList.add('hidden');
        }
      });

      updateNavigation('');
      homeLink.classList.add('active');
    });
  }
}

// Global helper function for toast notifications (if not already defined)
function showToast(message, type = 'info', duration = 3000, action = null) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-message">${message}</span>
      ${action ? `<button class="toast-action" onclick="${action.action}">${action.text}</button>` : ''}
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;

  // Add to document
  document.body.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, duration);
}

// Enhanced trackEvent function for analytics
function trackEvent(eventName, data = {}) {
  if (window.firebaseService) {
    firebaseService.trackAnalytics(eventName, data);
  }
  
  // Also track with Google Analytics if available
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, data);
  }
}

// Initialize app when Firebase is ready
function initializeApp() {
  // Wait for Firebase service to be ready
  const checkFirebaseReady = () => {
    if (window.firebaseService && window.firebaseService.db) {
      // Load initial posts for guest users
      firebaseService.loadPosts();
      
      // Set up real-time listeners for authenticated users
      if (firebaseService.isAuthenticated()) {
        setupRealtimeListeners();
      }
      
      console.log('✅ Zendea app initialized with Firebase');
    } else {
      setTimeout(checkFirebaseReady, 500);
    }
  };
  checkFirebaseReady();
}

// Setup real-time listeners for live updates
function setupRealtimeListeners() {
  if (!window.firebase || !firebaseService.currentUser) return;

  // Listen for new notifications
  const notificationsQuery = window.firebase.query(
    window.firebase.collection(firebaseService.db, 'notifications'),
    window.firebase.where('userId', '==', firebaseService.currentUser.uid),
    window.firebase.where('read', '==', false)
  );
  
  window.firebase.onSnapshot(notificationsQuery, (snapshot) => {
    const unreadCount = snapshot.size;
    updateNotificationBadge(unreadCount);
  });

  // Listen for new messages
  const messagesQuery = window.firebase.query(
    window.firebase.collection(firebaseService.db, 'messages'),
    window.firebase.where('recipientId', '==', firebaseService.currentUser.uid),
    window.firebase.where('read', '==', false)
  );
  
  window.firebase.onSnapshot(messagesQuery, (snapshot) => {
    const unreadCount = snapshot.size;
    updateMessagesBadge(unreadCount);
  });

  console.log('✅ Real-time listeners setup complete');
}

function updateNotificationBadge(count) {
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    if (count > 0) {
      badge.classList.remove('hidden');
      badge.textContent = count > 9 ? '9+' : count;
    } else {
      badge.classList.add('hidden');
    }
  }
}

function updateMessagesBadge(count) {
  const badge = document.getElementById('messagesBadge');
  if (badge) {
    if (count > 0) {
      badge.classList.remove('hidden');
      badge.textContent = count > 9 ? '9+' : count;
    } else {
      badge.classList.add('hidden');
    }
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', initializeApp);

// 📱 PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration.scope);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('🔄 New version available! Refresh to update.', 'info', {
              text: 'Refresh',
              action: () => window.location.reload()
            });
          }
        });
      });
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });
}

// 📱 PWA Install Prompt
let deferredPrompt;
const installButton = document.createElement('button');
installButton.className = 'btn btn-primary btn-sm pwa-install-btn hidden';
installButton.innerHTML = '<i class="fas fa-download"></i> Install App';
installButton.style.cssText = `
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
`;
document.body.appendChild(installButton);

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installButton.classList.remove('hidden');
});

installButton.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install ${outcome}`);
    deferredPrompt = null;
    installButton.classList.add('hidden');
  }
});

window.addEventListener('appinstalled', () => {
  console.log('PWA installed successfully');
  showToast('🎉 App installed successfully!', 'success');
  installButton.classList.add('hidden');
});

// 🌐 Global State Management
const ZendeaApp = {
  state: {
    user: null,
    posts: [],
    filteredPosts: [],
    filters: {
      type: 'all',
      location: '',
      salaryMin: 0,
      salaryMax: 200000,
      timePosted: 'all',
      remoteOnly: false
    },
    currentView: 'grid',
    map: null,
    notifications: [],
    isVoiceSearchActive: false,
    chatMessages: [],
    recommendations: []
  },
  
  config: {
    aiRecommendationsEnabled: true,
    geolocationEnabled: true,
    realTimeUpdates: true,
    voiceSearchEnabled: true,
    chatEnabled: true,
    analyticsEnabled: true
  }
};

// 🎬 Enhanced Splash Screen with Progress
function initSplashScreen() {
  const splashScreen = document.getElementById('splashScreen');
  const progressBar = document.getElementById('progressBar');
  
  if (splashScreen && progressBar) {
    // Simulate loading progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setTimeout(() => {
          splashScreen.style.opacity = '0';
          setTimeout(() => {
            splashScreen.style.display = 'none';
            initWelcomeScreen();
          }, 300);
        }, 500);
      }
      progressBar.style.width = `${progress}%`;
    }, 200);
  }
}

// 🌙 Enhanced Theme Management
function initThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  
  const savedTheme = localStorage.getItem('zendea-theme') || 'light';
  setTheme(savedTheme);
  
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      
      // Analytics tracking
      trackEvent('theme_changed', { new_theme: newTheme });
    });
  }
  
  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('zendea-theme', theme);
    
    if (themeToggle) {
      const icon = themeToggle.querySelector('i');
      if (icon) {
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
      }
    }
  }
}

// 🎪 Enhanced Welcome Screen
function initWelcomeScreen() {
  const welcomeOverlay = document.getElementById('welcomeOverlay');
  const continueAsGuestBtn = document.getElementById('continueAsGuest');
  
  if (!welcomeOverlay) return;
  
  const hasSeenWelcome = localStorage.getItem('zendea-welcome-seen');
  const isLoggedIn = checkAuthStatus();
  
  if (!hasSeenWelcome && !isLoggedIn) {
    setTimeout(() => {
      welcomeOverlay.classList.remove('hidden');
      trackEvent('welcome_screen_shown');
    }, 500);
  }
  
  if (continueAsGuestBtn) {
    continueAsGuestBtn.addEventListener('click', () => {
      welcomeOverlay.classList.add('hidden');
      localStorage.setItem('zendea-welcome-seen', 'true');
      trackEvent('continue_as_guest');
      showToast('Welcome! You can browse all content as a guest. 👋', 'info', 4000);
    });
  }
}

// 🔔 Advanced Toast System
function showToast(message, type = 'info', duration = 5000, actions = null) {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const iconMap = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };
  
  let actionsHTML = '';
  if (actions) {
    actionsHTML = actions.map(action => 
      `<button class="toast-action" onclick="${action.onClick}">${action.text}</button>`
    ).join('');
  }
  
  toast.innerHTML = `
    <i class="toast-icon ${iconMap[type]}"></i>
    <div class="toast-content">
      <div class="toast-message">${message}</div>
      ${actionsHTML}
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  toastContainer.appendChild(toast);
  
  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }
  
  // Track toast events
  trackEvent('toast_shown', { type, message: message.substring(0, 50) });
}

// 🔍 Advanced Search System
function initAdvancedSearch() {
  const searchInput = document.getElementById('search');
  const searchBtn = document.getElementById('searchBtn');
  const voiceSearchBtn = document.getElementById('voiceSearchBtn');
  const toggleFiltersBtn = document.getElementById('toggleFilters');
  const searchFilters = document.getElementById('searchFilters');
  const saveSearchBtn = document.getElementById('saveSearchBtn');
  
  let searchTimeout;
  
  // Text search
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      
      searchTimeout = setTimeout(() => {
        if (query.length >= 2) {
          performSearch(query);
          trackEvent('search_performed', { query: query.substring(0, 20) });
        } else if (query.length === 0) {
          loadAllPosts();
        }
      }, 300);
    });
    
    // Search suggestions
    searchInput.addEventListener('focus', showSearchSuggestions);
  }
  
  // Voice search
  if (voiceSearchBtn && ZendeaApp.config.voiceSearchEnabled) {
    voiceSearchBtn.addEventListener('click', toggleVoiceSearch);
  }
  
  // Manual search button
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const query = searchInput.value.trim();
      if (query) {
        performSearch(query);
        trackEvent('manual_search_performed', { query: query.substring(0, 20) });
      }
    });
  }
  
  // Toggle filters
  if (toggleFiltersBtn) {
    toggleFiltersBtn.addEventListener('click', () => {
      searchFilters.classList.toggle('expanded');
      const isExpanded = searchFilters.classList.contains('expanded');
      toggleFiltersBtn.innerHTML = `
        <i class="fas fa-filter"></i> 
        ${isExpanded ? 'Hide' : 'Advanced'} Filters
      `;
      trackEvent('filters_toggled', { expanded: isExpanded });
    });
  }
  
  // Save search alert
  if (saveSearchBtn) {
    saveSearchBtn.addEventListener('click', createJobAlert);
  }
  
  // Initialize filters
  initSearchFilters();
}

// 🎛️ Search Filters
function initSearchFilters() {
  const filterInputs = [
    'filterType', 'filterLocation', 'filterTime', 'remoteOnly',
    'salaryMin', 'salaryMax'
  ];
  
  filterInputs.forEach(filterId => {
    const element = document.getElementById(filterId);
    if (element) {
      element.addEventListener('change', updateFilters);
      element.addEventListener('input', updateFilters);
    }
  });
  
  // Salary range sliders
  initSalarySliders();
  
  // Current location
  const useCurrentLocationBtn = document.getElementById('useCurrentLocation');
  if (useCurrentLocationBtn) {
    useCurrentLocationBtn.addEventListener('click', useCurrentLocation);
  }
}

function initSalarySliders() {
  const salaryMin = document.getElementById('salaryMin');
  const salaryMax = document.getElementById('salaryMax');
  const salaryMinValue = document.getElementById('salaryMinValue');
  const salaryMaxValue = document.getElementById('salaryMaxValue');
  
  function updateSalaryValues() {
    const min = parseInt(salaryMin.value);
    const max = parseInt(salaryMax.value);
    
    // Ensure min doesn't exceed max
    if (min > max) {
      salaryMin.value = max;
    }
    
    salaryMinValue.textContent = formatSalary(salaryMin.value);
    salaryMaxValue.textContent = formatSalary(salaryMax.value);
    
    ZendeaApp.state.filters.salaryMin = parseInt(salaryMin.value);
    ZendeaApp.state.filters.salaryMax = parseInt(salaryMax.value);
  }
  
  if (salaryMin && salaryMax) {
    salaryMin.addEventListener('input', updateSalaryValues);
    salaryMax.addEventListener('input', updateSalaryValues);
    updateSalaryValues(); // Initialize
  }
}

function formatSalary(value) {
  const num = parseInt(value);
  if (num >= 200000) return '$200k+';
  if (num >= 1000) return `$${Math.round(num / 1000)}k`;
  return `$${num}`;
}

// 🎤 Voice Search
function toggleVoiceSearch() {
  const voiceBtn = document.getElementById('voiceSearchBtn');
  const searchInput = document.getElementById('search');
  
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showToast('Voice search is not supported in your browser', 'error');
    return;
  }
  
  if (ZendeaApp.state.isVoiceSearchActive) {
    stopVoiceSearch();
    return;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  recognition.onstart = () => {
    ZendeaApp.state.isVoiceSearchActive = true;
    voiceBtn.classList.add('listening');
    voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
    showToast('Listening... Speak now!', 'info', 3000);
  };
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    searchInput.value = transcript;
    performSearch(transcript);
    trackEvent('voice_search_performed', { query: transcript.substring(0, 20) });
    showToast(`Searching for: "${transcript}"`, 'success', 2000);
  };
  
  recognition.onerror = (event) => {
    showToast('Voice search error. Please try again.', 'error');
    stopVoiceSearch();
  };
  
  recognition.onend = () => {
    stopVoiceSearch();
  };
  
  recognition.start();
  
  function stopVoiceSearch() {
    ZendeaApp.state.isVoiceSearchActive = false;
    voiceBtn.classList.remove('listening');
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
  }
}

// 📍 Geolocation
function useCurrentLocation() {
  const locationInput = document.getElementById('filterLocation');
  const button = document.getElementById('useCurrentLocation');
  
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser', 'error');
    return;
  }
  
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  button.disabled = true;
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      
      try {
        // Reverse geocoding (using a free service)
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        const data = await response.json();
        
        const location = `${data.city}, ${data.principalSubdivision}`;
        locationInput.value = location;
        
        showToast(`Location set to: ${location}`, 'success');
        trackEvent('location_detected', { location });
        
        // Update filters
        updateFilters();
        
      } catch (error) {
        showToast('Could not determine your location', 'error');
      } finally {
        button.innerHTML = '<i class="fas fa-crosshairs"></i>';
        button.disabled = false;
      }
    },
    (error) => {
      showToast('Location access denied', 'error');
      button.innerHTML = '<i class="fas fa-crosshairs"></i>';
      button.disabled = false;
    }
  );
}

// 🗺️ Map Integration
function initMapView() {
  const mapViewBtn = document.getElementById('mapViewBtn');
  const mapContainer = document.getElementById('mapContainer');
  
  if (mapViewBtn) {
    mapViewBtn.addEventListener('click', toggleMapView);
  }
}

function toggleMapView() {
  const mapContainer = document.getElementById('mapContainer');
  const mapViewBtn = document.getElementById('mapViewBtn');
  
  if (mapContainer.classList.contains('hidden')) {
    showMapView();
    mapViewBtn.innerHTML = '<i class="fas fa-list"></i> List View';
  } else {
    hideMapView();
    mapViewBtn.innerHTML = '<i class="fas fa-map"></i> Map View';
  }
}

function showMapView() {
  const mapContainer = document.getElementById('mapContainer');
  mapContainer.classList.remove('hidden');
  
  if (!ZendeaApp.state.map) {
    // Initialize Leaflet map
    ZendeaApp.state.map = L.map('map').setView([37.7749, -122.4194], 10); // San Francisco
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(ZendeaApp.state.map);
    
    // Add sample markers
    addSampleMapMarkers();
  }
  
  // Refresh map size
  setTimeout(() => {
    ZendeaApp.state.map.invalidateSize();
  }, 100);
  
  trackEvent('map_view_opened');
}

function hideMapView() {
  const mapContainer = document.getElementById('mapContainer');
  mapContainer.classList.add('hidden');
  trackEvent('map_view_closed');
}

function addSampleMapMarkers() {
  const sampleLocations = [
    { lat: 37.7849, lng: -122.4094, title: 'Senior Developer Position', type: 'job' },
    { lat: 37.7649, lng: -122.4294, title: 'UX Designer Role', type: 'job' },
    { lat: 37.7549, lng: -122.4494, title: 'Tech Gadget Sale', type: 'deal' }
  ];
  
  sampleLocations.forEach(location => {
    const icon = location.type === 'job' ? '💼' : '🏷️';
    const marker = L.marker([location.lat, location.lng]).addTo(ZendeaApp.state.map);
    marker.bindPopup(`${icon} ${location.title}`);
  });
}

// 🤖 AI Recommendations
function initAIRecommendations() {
  if (!ZendeaApp.config.aiRecommendationsEnabled) return;
  
  const aiSection = document.getElementById('aiRecommendations');
  const refreshBtn = document.getElementById('refreshRecommendations');
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadAIRecommendations);
  }
  
  // Load recommendations for logged-in users
  if (checkAuthStatus()) {
    aiSection.classList.remove('hidden');
    loadAIRecommendations();
  }
}

async function loadAIRecommendations() {
  const track = document.getElementById('recommendationsTrack');
  const refreshBtn = document.getElementById('refreshRecommendations');
  
  if (!track) return;
  
  // Show loading state
  refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  refreshBtn.disabled = true;
  
  try {
    // Simulate AI recommendation API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const recommendations = generateAIRecommendations();
    displayRecommendations(recommendations);
    
    showToast('AI recommendations updated! 🤖', 'success', 2000);
    trackEvent('ai_recommendations_loaded', { count: recommendations.length });
    
  } catch (error) {
    showToast('Failed to load recommendations', 'error');
  } finally {
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    refreshBtn.disabled = false;
  }
}

function generateAIRecommendations() {
  // Simulate personalized recommendations based on user behavior
  return [
    {
      id: 'ai-rec-1',
      type: 'job',
      title: 'Senior React Developer (Recommended for you)',
      description: 'Based on your search history and skills, this role matches your profile perfectly.',
      location: 'San Francisco, CA',
      salary: '$140,000',
      confidence: 95,
      reasons: ['Matches your React skills', 'Salary in your range', 'Location preference']
    },
    {
      id: 'ai-rec-2',
      type: 'deal',
      title: 'MacBook Pro M3 - Limited Time Offer',
      description: 'You searched for tech deals recently. This MacBook deal expires in 2 days!',
      location: 'Online',
      price: '$1,899',
      confidence: 88,
      reasons: ['Searched for tech deals', 'Price alert match', 'High demand item']
    },
    {
      id: 'ai-rec-3',
      type: 'job',
      title: 'Full Stack Engineer - Remote',
      description: 'Perfect match for your full-stack skills and remote work preference.',
      location: 'Remote',
      salary: '$120,000',
      confidence: 92,
      reasons: ['Remote work preference', 'Full-stack experience', 'Tech stack match']
    }
  ];
}

function displayRecommendations(recommendations) {
  const track = document.getElementById('recommendationsTrack');
  track.innerHTML = '';
  
  recommendations.forEach(rec => {
    const card = createRecommendationCard(rec);
    track.appendChild(card);
  });
  
  // Initialize carousel
  initRecommendationsCarousel();
}

function createRecommendationCard(rec) {
  const card = document.createElement('div');
  card.className = 'recommendation-card';
  
  const typeIcon = rec.type === 'job' ? 'fas fa-briefcase' : 'fas fa-tags';
  const typeColor = rec.type === 'job' ? 'var(--color-primary)' : 'var(--color-secondary)';
  
  card.innerHTML = `
    <div class="rec-header">
      <div class="rec-type" style="color: ${typeColor}">
        <i class="${typeIcon}"></i>
        <span>${rec.type.toUpperCase()}</span>
      </div>
      <div class="rec-confidence">
        <span class="confidence-score">${rec.confidence}% match</span>
        <div class="confidence-bar">
          <div class="confidence-fill" style="width: ${rec.confidence}%"></div>
        </div>
      </div>
    </div>
    <h3 class="rec-title">${rec.title}</h3>
    <p class="rec-description">${rec.description}</p>
    <div class="rec-meta">
      <span><i class="fas fa-map-marker-alt"></i> ${rec.location}</span>
      <span class="rec-price">${rec.salary || rec.price}</span>
    </div>
    <div class="rec-reasons">
      <h4>Why this matches you:</h4>
      <ul>
        ${rec.reasons.map(reason => `<li>${reason}</li>`).join('')}
      </ul>
    </div>
    <div class="rec-actions">
      <button class="btn btn-outline btn-sm" onclick="savePost('${rec.id}')">
        <i class="fas fa-bookmark"></i> Save
      </button>
      <button class="btn btn-primary btn-sm" onclick="viewPost('${rec.id}')">
        <i class="fas fa-eye"></i> View Details
      </button>
    </div>
  `;
  
  return card;
}

// 🎠 Recommendations Carousel
function initRecommendationsCarousel() {
  const track = document.getElementById('recommendationsTrack');
  const prevBtn = document.getElementById('recPrevBtn');
  const nextBtn = document.getElementById('recNextBtn');
  
  let currentPosition = 0;
  const cardWidth = 320; // Approximate card width + gap
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentPosition = Math.max(0, currentPosition - cardWidth);
      track.style.transform = `translateX(-${currentPosition}px)`;
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const maxPosition = track.scrollWidth - track.parentElement.clientWidth;
      currentPosition = Math.min(maxPosition, currentPosition + cardWidth);
      track.style.transform = `translateX(-${currentPosition}px)`;
    });
  }
}

// 🏷️ Trending Tags
function initTrendingTags() {
  const tagButtons = document.querySelectorAll('.tag-btn');
  
  tagButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tag = button.getAttribute('data-tag');
      const searchInput = document.getElementById('search');
      
      if (searchInput) {
        searchInput.value = tag.replace('-', ' ');
        performSearch(tag.replace('-', ' '));
        trackEvent('trending_tag_clicked', { tag });
        showToast(`Searching for: ${tag.replace('-', ' ')}`, 'info', 2000);
      }
    });
  });
}

// 🔔 Notifications System
function initNotificationSystem() {
  const notificationBtn = document.getElementById('notificationBtn');
  const notificationsPanel = document.getElementById('notificationsPanel');
  const markAllReadBtn = document.getElementById('markAllRead');
  
  if (notificationBtn) {
    notificationBtn.addEventListener('click', toggleNotificationsPanel);
  }
  
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllNotificationsRead);
  }
  
  // Load initial notifications
  loadNotifications();
  
  // Simulate real-time notifications
  if (ZendeaApp.config.realTimeUpdates) {
    setInterval(checkForNewNotifications, 30000); // Check every 30 seconds
  }
}

function toggleNotificationsPanel() {
  const panel = document.getElementById('notificationsPanel');
  const btn = document.getElementById('notificationBtn');
  
  panel.classList.toggle('hidden');
  btn.classList.toggle('active');
  
  if (!panel.classList.contains('hidden')) {
    loadNotifications();
    trackEvent('notifications_panel_opened');
  }
}

function loadNotifications() {
  const notificationsList = document.getElementById('notificationsList');
  const badge = document.getElementById('notificationBadge');
  
  // Sample notifications
  const notifications = [
    {
      id: 1,
      type: 'job_match',
      title: 'New Job Match!',
      message: 'A Senior React Developer position in San Francisco matches your profile.',
      time: '2 minutes ago',
      unread: true,
      icon: 'fas fa-briefcase'
    },
    {
      id: 2,
      type: 'deal_expiring',
      title: 'Deal Expiring Soon',
      message: 'The MacBook Pro deal you saved expires in 2 hours.',
      time: '1 hour ago',
      unread: true,
      icon: 'fas fa-clock'
    },
    {
      id: 3,
      type: 'price_drop',
      title: 'Price Drop Alert',
      message: 'The iPhone 15 deal you\'re watching dropped by $50.',
      time: '3 hours ago',
      unread: false,
      icon: 'fas fa-arrow-down'
    }
  ];
  
  notificationsList.innerHTML = notifications.map(notification => 
    createNotificationHTML(notification)
  ).join('');
  
  // Update badge
  const unreadCount = notifications.filter(n => n.unread).length;
  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function createNotificationHTML(notification) {
  return `
    <div class="notification-item ${notification.unread ? 'unread' : ''}" data-id="${notification.id}">
      <div class="notification-icon">
        <i class="${notification.icon}"></i>
      </div>
      <div class="notification-content">
        <h4 class="notification-title">${notification.title}</h4>
        <p class="notification-message">${notification.message}</p>
        <span class="notification-time">${notification.time}</span>
      </div>
      <button class="notification-close" onclick="dismissNotification(${notification.id})">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
}

function checkForNewNotifications() {
  // Simulate new notifications occasionally
  if (Math.random() < 0.3) { // 30% chance
    const newNotification = {
      id: Date.now(),
      type: 'new_post',
      title: 'New Opportunity!',
      message: 'A new job posting matches your saved search criteria.',
      time: 'Just now',
      unread: true,
      icon: 'fas fa-bell'
    };
    
    ZendeaApp.state.notifications.unshift(newNotification);
    
    // Update badge
    const badge = document.getElementById('notificationBadge');
    const currentCount = parseInt(badge.textContent) || 0;
    badge.textContent = currentCount + 1;
    badge.classList.remove('hidden');
    
    // Show toast
    showToast('New notification received! 🔔', 'info', 3000);
    
    trackEvent('new_notification_received', { type: newNotification.type });
  }
}

// 💬 Chat System
function initChatSystem() {
  if (!ZendeaApp.config.chatEnabled) return;
  
  const messagesLink = document.getElementById('messagesLink');
  const chatWidget = document.getElementById('chatWidget');
  const closeChatBtn = document.getElementById('closeChatBtn');
  const chatInput = document.getElementById('chatInput');
  const sendMessageBtn = document.getElementById('sendMessageBtn');
  
  if (messagesLink) {
    messagesLink.addEventListener('click', (e) => {
      e.preventDefault();
      toggleChatWidget();
    });
  }
  
  if (closeChatBtn) {
    closeChatBtn.addEventListener('click', () => {
      chatWidget.classList.add('hidden');
      trackEvent('chat_closed');
    });
  }
  
  if (sendMessageBtn) {
    sendMessageBtn.addEventListener('click', sendChatMessage);
  }
  
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendChatMessage();
      }
    });
  }
  
  // Load initial messages
  loadChatMessages();
}

function toggleChatWidget() {
  const chatWidget = document.getElementById('chatWidget');
  chatWidget.classList.toggle('hidden');
  
  if (!chatWidget.classList.contains('hidden')) {
    trackEvent('chat_opened');
    
    // Focus input
    setTimeout(() => {
      document.getElementById('chatInput').focus();
    }, 100);
  }
}

function loadChatMessages() {
  const chatMessages = document.getElementById('chatMessages');
  
  const messages = [
    {
      id: 1,
      sender: 'support',
      message: 'Hi! How can I help you today?',
      time: new Date(Date.now() - 10000)
    },
    {
      id: 2,
      sender: 'user',
      message: 'I have a question about posting jobs.',
      time: new Date(Date.now() - 5000)
    },
    {
      id: 3,
      sender: 'support',
      message: 'I\'d be happy to help! What would you like to know about job posting?',
      time: new Date(Date.now() - 2000)
    }
  ];
  
  chatMessages.innerHTML = messages.map(createChatMessageHTML).join('');
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function createChatMessageHTML(message) {
  const isUser = message.sender === 'user';
  const timeString = message.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return `
    <div class="chat-message ${isUser ? 'user-message' : 'support-message'}">
      <div class="message-content">${message.message}</div>
      <div class="message-time">${timeString}</div>
    </div>
  `;
}

function sendChatMessage() {
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  
  const message = chatInput.value.trim();
  if (!message) return;
  
  // Add user message
  const userMessage = {
    id: Date.now(),
    sender: 'user',
    message: message,
    time: new Date()
  };
  
  const messageHTML = createChatMessageHTML(userMessage);
  chatMessages.insertAdjacentHTML('beforeend', messageHTML);
  
  // Clear input
  chatInput.value = '';
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Simulate response
  setTimeout(() => {
    const responses = [
      "Thanks for your message! I'm looking into that for you.",
      "That's a great question! Let me get you the information you need.",
      "I understand your concern. Here's what I can help you with...",
      "Perfect! I can definitely help you with that."
    ];
    
    const supportMessage = {
      id: Date.now() + 1,
      sender: 'support',
      message: responses[Math.floor(Math.random() * responses.length)],
      time: new Date()
    };
    
    const responseHTML = createChatMessageHTML(supportMessage);
    chatMessages.insertAdjacentHTML('beforeend', responseHTML);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 1000);
  
  trackEvent('chat_message_sent', { message_length: message.length });
}

// 📊 Advanced Analytics Dashboard
let analyticsCharts = {};

function initAnalytics() {
  const showAnalyticsBtn = document.getElementById('showAnalyticsBtn');
  const analyticsModal = document.getElementById('analyticsModal');
  const closeAnalyticsModal = document.getElementById('closeAnalyticsModal');
  const exportAnalytics = document.getElementById('exportAnalytics');
  const analyticsTimeframe = document.getElementById('analyticsTimeframe');
  const toggleChartType = document.getElementById('toggleChartType');
  const refreshMetrics = document.getElementById('refreshMetrics');
  const regionSelector = document.getElementById('regionSelector');
  
  if (showAnalyticsBtn) {
    showAnalyticsBtn.addEventListener('click', openAnalyticsModal);
  }
  
  if (closeAnalyticsModal) {
    closeAnalyticsModal.addEventListener('click', () => {
      analyticsModal.classList.add('hidden');
    });
  }
  
  if (exportAnalytics) {
    exportAnalytics.addEventListener('click', exportAnalyticsData);
  }
  
  if (analyticsTimeframe) {
    analyticsTimeframe.addEventListener('change', (e) => {
      updateAnalyticsTimeframe(e.target.value);
    });
  }
  
  if (toggleChartType) {
    toggleChartType.addEventListener('click', toggleCategoryChart);
  }
  
  if (refreshMetrics) {
    refreshMetrics.addEventListener('click', refreshPerformanceMetrics);
  }
  
  if (regionSelector) {
    regionSelector.addEventListener('change', (e) => {
      updateGeographicData(e.target.value);
    });
  }
}

function openAnalyticsModal() {
  const analyticsModal = document.getElementById('analyticsModal');
  analyticsModal.classList.remove('hidden');
  
  loadAdvancedAnalytics();
  trackEvent('analytics_modal_opened');
}

function loadAdvancedAnalytics() {
  updateKeyMetrics();
  loadTrafficChart();
  loadCategoryChart();
  loadActivityHeatmap();
  updateGeographicData('world');
  updateAIInsights();
  updatePerformanceMetrics();
}

function loadPopularSearches() {
  const container = document.getElementById('popularSearches');
  const searches = [
    { term: 'React Developer', count: 1234 },
    { term: 'Remote Work', count: 987 },
    { term: 'Data Scientist', count: 756 },
    { term: 'UI/UX Designer', count: 654 },
    { term: 'Product Manager', count: 543 }
  ];
  
  container.innerHTML = searches.map((search, index) => `
    <div class="analytics-item">
      <span class="item-rank">${index + 1}</span>
      <span class="item-label">${search.term}</span>
      <span class="item-value">${search.count.toLocaleString()}</span>
    </div>
  `).join('');
}

function loadTrendingLocations() {
  const container = document.getElementById('trendingLocations');
  const locations = [
    { city: 'San Francisco, CA', growth: '+12%' },
    { city: 'Austin, TX', growth: '+8%' },
    { city: 'Remote', growth: '+25%' },
    { city: 'New York, NY', growth: '+5%' },
    { city: 'Seattle, WA', growth: '+7%' }
  ];
  
  container.innerHTML = locations.map((location, index) => `
    <div class="analytics-item">
      <span class="item-rank">${index + 1}</span>
      <span class="item-label">${location.city}</span>
      <span class="item-value growth">${location.growth}</span>
    </div>
  `).join('');
}

function loadSalaryChart() {
  const ctx = document.getElementById('salaryChart');
  if (!ctx || typeof Chart === 'undefined') return;
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Average Salary (k)',
        data: [85, 87, 90, 92, 95, 98],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function loadCategoryChart() {
  const ctx = document.getElementById('categoryChart');
  if (!ctx || typeof Chart === 'undefined') return;
  
  // Destroy existing chart if it exists
  if (analyticsCharts.categoryChart) {
    analyticsCharts.categoryChart.destroy();
  }
  
  analyticsCharts.categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Engineering', 'Design', 'Marketing', 'Sales', 'Other'],
      datasets: [{
        data: [35, 20, 15, 15, 15],
        backgroundColor: [
          '#6366f1',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// 📊 Advanced Analytics Functions
function updateKeyMetrics() {
  // Simulate dynamic data updates
  const metrics = {
    totalUsers: Math.floor(2800 + Math.random() * 100),
    totalJobs: Math.floor(1200 + Math.random() * 100),
    totalDeals: Math.floor(550 + Math.random() * 50),
    engagementRate: (88 + Math.random() * 4).toFixed(1)
  };
  
  const totalUsersEl = document.getElementById('totalUsers');
  const totalJobsEl = document.getElementById('totalJobs');
  const totalDealsEl = document.getElementById('totalDeals');
  const engagementRateEl = document.getElementById('engagementRate');
  
  if (totalUsersEl) totalUsersEl.textContent = metrics.totalUsers.toLocaleString();
  if (totalJobsEl) totalJobsEl.textContent = metrics.totalJobs.toLocaleString();
  if (totalDealsEl) totalDealsEl.textContent = metrics.totalDeals.toLocaleString();
  if (engagementRateEl) engagementRateEl.textContent = metrics.engagementRate + '%';
}

function loadTrafficChart() {
  const ctx = document.getElementById('trafficChart');
  if (!ctx || typeof Chart === 'undefined') return;
  
  if (analyticsCharts.trafficChart) {
    analyticsCharts.trafficChart.destroy();
  }
  
  const labels = [];
  const pageViews = [];
  const uniqueVisitors = [];
  
  // Generate data for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    pageViews.push(Math.floor(1000 + Math.random() * 500));
    uniqueVisitors.push(Math.floor(600 + Math.random() * 300));
  }
  
  analyticsCharts.trafficChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Page Views',
          data: pageViews,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Unique Visitors',
          data: uniqueVisitors,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function loadActivityHeatmap() {
  const ctx = document.getElementById('heatmapChart');
  if (!ctx || typeof Chart === 'undefined') return;
  
  if (analyticsCharts.heatmapChart) {
    analyticsCharts.heatmapChart.destroy();
  }
  
  // Generate simple bar chart for activity simulation
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = labels.map(() => Math.floor(50 + Math.random() * 50));
  
  analyticsCharts.heatmapChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Activity Level',
        data: data,
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: '#6366f1',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}

function updateGeographicData(region) {
  const geoContainer = document.querySelector('.geo-stats');
  if (!geoContainer) return;
  
  let geoData = [];
  
  switch (region) {
    case 'us':
      geoData = [
        { flag: '🏛️', name: 'California', percentage: '28.5%' },
        { flag: '🤠', name: 'Texas', percentage: '18.2%' },
        { flag: '🗽', name: 'New York', percentage: '15.7%' },
        { flag: '🌴', name: 'Florida', percentage: '12.3%' },
        { flag: '☕', name: 'Washington', percentage: '8.9%' }
      ];
      break;
    case 'eu':
      geoData = [
        { flag: '🇬🇧', name: 'United Kingdom', percentage: '32.1%' },
        { flag: '🇩🇪', name: 'Germany', percentage: '24.8%' },
        { flag: '🇫🇷', name: 'France', percentage: '18.6%' },
        { flag: '🇳🇱', name: 'Netherlands', percentage: '12.4%' },
        { flag: '🇪🇸', name: 'Spain', percentage: '9.2%' }
      ];
      break;
    case 'asia':
      geoData = [
        { flag: '🇮🇳', name: 'India', percentage: '35.7%' },
        { flag: '🇯🇵', name: 'Japan', percentage: '22.1%' },
        { flag: '🇸🇬', name: 'Singapore', percentage: '15.3%' },
        { flag: '🇰🇷', name: 'South Korea', percentage: '13.8%' },
        { flag: '🇹🇭', name: 'Thailand', percentage: '8.9%' }
      ];
      break;
    default: // world
      geoData = [
        { flag: '🇺🇸', name: 'United States', percentage: '34.2%' },
        { flag: '🇬🇧', name: 'United Kingdom', percentage: '18.7%' },
        { flag: '🇨🇦', name: 'Canada', percentage: '12.3%' },
        { flag: '🇩🇪', name: 'Germany', percentage: '9.8%' },
        { flag: '🇦🇺', name: 'Australia', percentage: '7.1%' }
      ];
  }
  
  geoContainer.innerHTML = geoData.map(item => `
    <div class="geo-item">
      <span class="country-flag">${item.flag}</span>
      <span class="country-name">${item.name}</span>
      <span class="country-percentage">${item.percentage}</span>
    </div>
  `).join('');
}

function updateAIInsights() {
  const insights = [
    {
      icon: 'fa-trending-up',
      type: 'positive',
      title: 'Growing Trend',
      description: 'Remote work opportunities increased 23% this week'
    },
    {
      icon: 'fa-clock',
      type: 'warning',
      title: 'Peak Time',
      description: 'Highest user activity at 10:30 AM EST'
    },
    {
      icon: 'fa-star',
      type: 'info',
      title: 'Popular Category',
      description: 'Tech deals are 40% more engaging than average'
    }
  ];
  
  const insightsContainer = document.querySelector('.insights-list');
  if (!insightsContainer) return;
  
  insightsContainer.innerHTML = insights.map(insight => `
    <div class="insight-item">
      <i class="fas ${insight.icon} insight-icon ${insight.type}"></i>
      <div class="insight-content">
        <span class="insight-title">${insight.title}</span>
        <span class="insight-description">${insight.description}</span>
      </div>
    </div>
  `).join('');
}

function updatePerformanceMetrics() {
  const metrics = [
    { label: 'Page Load Time', value: '1.2s', percentage: 85 },
    { label: 'API Response', value: '0.3s', percentage: 92 },
    { label: 'Search Accuracy', value: '96%', percentage: 96 },
    { label: 'User Satisfaction', value: '4.5/5', percentage: 89 }
  ];
  
  const container = document.querySelector('.performance-metrics');
  if (!container) return;
  
  container.innerHTML = metrics.map(metric => `
    <div class="performance-item">
      <span class="performance-label">${metric.label}</span>
      <div class="performance-bar">
        <div class="bar-fill" style="width: ${metric.percentage}%; background: #10b981;"></div>
      </div>
      <span class="performance-value">${metric.value}</span>
    </div>
  `).join('');
}

function exportAnalyticsData() {
  const totalUsersEl = document.getElementById('totalUsers');
  const totalJobsEl = document.getElementById('totalJobs');
  const totalDealsEl = document.getElementById('totalDeals');
  const engagementRateEl = document.getElementById('engagementRate');
  const timeframeEl = document.getElementById('analyticsTimeframe');
  
  const data = {
    timestamp: new Date().toISOString(),
    metrics: {
      totalUsers: totalUsersEl ? totalUsersEl.textContent : 'N/A',
      totalJobs: totalJobsEl ? totalJobsEl.textContent : 'N/A',
      totalDeals: totalDealsEl ? totalDealsEl.textContent : 'N/A',
      engagementRate: engagementRateEl ? engagementRateEl.textContent : 'N/A'
    },
    timeframe: timeframeEl ? timeframeEl.value : '30d'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zendea-analytics-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast('📊 Analytics data exported successfully!', 'success');
  trackEvent('analytics_exported', { timeframe: data.timeframe });
}

function updateAnalyticsTimeframe(timeframe) {
  showToast(`📅 Updating analytics for ${timeframe}...`, 'info');
  
  setTimeout(() => {
    updateKeyMetrics();
    loadTrafficChart();
    showToast('✅ Analytics updated!', 'success');
  }, 1000);
  
  trackEvent('analytics_timeframe_changed', { timeframe });
}

function toggleCategoryChart() {
  const chart = analyticsCharts.categoryChart;
  if (!chart) return;
  
  const newType = chart.config.type === 'doughnut' ? 'bar' : 'doughnut';
  chart.config.type = newType;
  chart.update();
  
  showToast(`📊 Chart view changed to ${newType}`, 'info');
  trackEvent('chart_type_toggled', { new_type: newType });
}

function refreshPerformanceMetrics() {
  const refreshBtn = document.getElementById('refreshMetrics');
  if (!refreshBtn) return;
  
  const icon = refreshBtn.querySelector('i');
  if (icon) icon.classList.add('fa-spin');
  
  setTimeout(() => {
    updatePerformanceMetrics();
    if (icon) icon.classList.remove('fa-spin');
    showToast('🔄 Performance metrics refreshed!', 'success');
  }, 1500);
  
  trackEvent('performance_metrics_refreshed');
}

// 📱 View Toggles
function initViewToggles() {
  const viewToggles = document.querySelectorAll('.view-toggle');
  
  viewToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const view = toggle.getAttribute('data-view');
      
      // Update active state
      viewToggles.forEach(t => t.classList.remove('active'));
      toggle.classList.add('active');
      
      // Update view
      updateView(view);
      trackEvent('view_changed', { view });
    });
  });
}

function updateView(view) {
  const cardContainer = document.getElementById('jobs-list');
  
  switch (view) {
    case 'grid':
      cardContainer.className = 'card-container';
      break;
    case 'list':
      cardContainer.className = 'card-container list-view';
      break;
    case 'map':
      showMapView();
      break;
  }
  
  ZendeaApp.state.currentView = view;
}

// 🔖 Bookmarks System
function initBookmarksSystem() {
  const bookmarksLink = document.getElementById('bookmarksLink');
  
  if (bookmarksLink) {
    bookmarksLink.addEventListener('click', (e) => {
      e.preventDefault();
      showBookmarks();
    });
  }
}

function savePost(postId) {
  let savedPosts = JSON.parse(localStorage.getItem('zendea-saved-posts') || '[]');
  
  if (!savedPosts.includes(postId)) {
    savedPosts.push(postId);
    localStorage.setItem('zendea-saved-posts', JSON.stringify(savedPosts));
    showToast('Post saved to your bookmarks! 📖', 'success');
    trackEvent('post_saved', { post_id: postId });
  } else {
    showToast('Post is already saved', 'info');
  }
}

function showBookmarks() {
  const savedPosts = JSON.parse(localStorage.getItem('zendea-saved-posts') || '[]');
  
  if (savedPosts.length === 0) {
    showToast('You haven\'t saved any posts yet', 'info');
    return;
  }
  
  showToast(`You have ${savedPosts.length} saved posts`, 'info');
  trackEvent('bookmarks_viewed', { count: savedPosts.length });
}

// 📈 Analytics Tracking
function trackEvent(eventName, properties = {}) {
  if (!ZendeaApp.config.analyticsEnabled) return;
  
  const event = {
    name: eventName,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      page_url: window.location.href
    }
  };
  
  // In a real app, this would send to analytics service
  console.log('📊 Analytics Event:', event);
  
  // Store locally for demo purposes
  let events = JSON.parse(localStorage.getItem('zendea-analytics') || '[]');
  events.push(event);
  
  // Keep only last 100 events
  if (events.length > 100) {
    events = events.slice(-100);
  }
  
  localStorage.setItem('zendea-analytics', JSON.stringify(events));
}

// ⚡ Performance Monitoring
function initPerformanceMonitoring() {
  // Monitor page load time
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    trackEvent('page_loaded', { load_time_ms: Math.round(loadTime) });
    
    if (loadTime > 3000) {
      console.warn('🐌 Slow page load detected:', loadTime + 'ms');
    }
  });
  
  // Monitor errors
  window.addEventListener('error', (e) => {
    trackEvent('javascript_error', {
      message: e.message,
      filename: e.filename,
      line: e.lineno,
      column: e.colno
    });
  });
}

// 🔄 Auto-refresh Content
function initAutoRefresh() {
  if (!ZendeaApp.config.realTimeUpdates) return;
  
  // Refresh content every 5 minutes
  setInterval(() => {
    const lastRefresh = localStorage.getItem('zendea-last-refresh');
    const now = Date.now();
    
    if (!lastRefresh || now - parseInt(lastRefresh) > 300000) { // 5 minutes
      refreshContent();
      localStorage.setItem('zendea-last-refresh', now.toString());
    }
  }, 60000); // Check every minute
}

function refreshContent() {
  trackEvent('content_auto_refreshed');
  
  // Refresh posts in background
  loadAllPosts();
  
  // Show subtle notification
  showToast('Content updated with latest posts 🔄', 'info', 2000);
}

// 🚀 Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌟 Zendea Advanced is starting up...');
  
  // Initialize core features
  initSplashScreen();
  initThemeToggle();
  initAdvancedSearch();
  initMapView();
  initTrendingTags();
  initViewToggles();
  
  // Initialize advanced features
  initAIRecommendations();
  initNotificationSystem();
  initChatSystem();
  initAnalytics();
  initBookmarksSystem();
  
  // Initialize monitoring
  initPerformanceMonitoring();
  initAutoRefresh();
  
  // Initialize navigation and basic features
  initFAB();
  initNavigation();
  initLoadMore();
  initScrollAnimations();
  initContactToggle();
  
  // Load initial content
  setTimeout(() => {
    loadAllPosts();
  }, 1000);
  
  console.log('✨ Zendea Advanced is ready!');
  
  // Show welcome message
  setTimeout(() => {
    if (checkAuthStatus()) {
      showToast('Welcome back! Your personalized experience is ready. 🎯', 'success', 4000);
    } else {
      showToast('Welcome to Zendea! Discover amazing opportunities. 🌟', 'success', 4000);
    }
  }, 2000);
  
  trackEvent('app_initialized');
});

// Continue with existing functions...
// (Keep all the original functions like performSearch, loadAllPosts, createSampleJobCard, etc.)

// 🔥 Mock Search Function (enhanced)
function performSearch(query) {
  console.log(`🔍 Searching for: ${query}`);
  showToast(`Searching for "${query}"... Found 127 results!`, 'info', 3000);
  
  // Simulate loading enhanced results
  setTimeout(() => {
    loadAllPosts();
    trackEvent('search_results_loaded', { query, results_count: 127 });
  }, 500);
}

// 📝 Enhanced Load Posts Function
function loadAllPosts() {
  const jobsList = document.getElementById('jobs-list');
  const dealsList = document.getElementById('deals-list');
  
  if (jobsList) {
    jobsList.innerHTML = '';
    for (let i = 1; i <= 6; i++) {
      jobsList.appendChild(createEnhancedJobCard(i));
    }
  }
  
  if (dealsList) {
    dealsList.innerHTML = '';
    for (let i = 1; i <= 6; i++) {
      dealsList.appendChild(createEnhancedDealCard(i));
    }
  }
  
  // Update stats
  document.getElementById('totalJobs').textContent = '1,247';
  document.getElementById('totalDeals').textContent = '856';
  
  trackEvent('posts_loaded', { jobs: 6, deals: 6 });
}

// 🃏 Enhanced Card Creation
function createEnhancedJobCard(index) {
  const card = document.createElement('div');
  card.className = 'card fade-in-up enhanced-card';
  card.setAttribute('data-post-id', `job-${index}`);
  
  const salaries = ['$90k', '$120k', '$150k', '$95k', '$110k', '$135k'];
  const companies = ['TechCorp', 'InnovateLabs', 'StartupX', 'MegaTech', 'DevStudio', 'CloudCo'];
  const locations = ['San Francisco, CA', 'Austin, TX', 'Remote', 'New York, NY', 'Seattle, WA', 'Denver, CO'];
  const skills = [
    ['React', 'TypeScript', 'Node.js'],
    ['Python', 'Django', 'PostgreSQL'],
    ['Vue.js', 'GraphQL', 'AWS'],
    ['Angular', 'Java', 'Spring'],
    ['React Native', 'Firebase', 'iOS'],
    ['DevOps', 'Kubernetes', 'Docker']
  ];
  
  const isUrgent = index <= 2;
  const isRemote = index % 3 === 0;
  const postedTime = ['2 hours ago', '1 day ago', '3 days ago', '5 days ago', '1 week ago', '2 weeks ago'];
  
  card.innerHTML = `
    <div class="card-header">
      <div class="card-badges">
        <span class="card-type job">Job</span>
        ${isUrgent ? '<span class="urgent-badge">🔥 Urgent</span>' : ''}
        ${isRemote ? '<span class="remote-badge">🏠 Remote</span>' : ''}
      </div>
      <div class="card-actions">
        <button class="card-action-btn" onclick="savePost('job-${index}')" title="Save">
          <i class="fas fa-bookmark"></i>
        </button>
        <button class="card-action-btn" onclick="sharePost('job-${index}')" title="Share">
          <i class="fas fa-share"></i>
        </button>
      </div>
    </div>
    
    <div class="card-company">
      <div class="company-logo">
        <i class="fas fa-building"></i>
      </div>
      <div class="company-info">
        <span class="company-name">${companies[index - 1]}</span>
        <span class="company-rating">
          <i class="fas fa-star"></i> 4.${5 + index}
        </span>
      </div>
    </div>
    
    <h3 class="card-title">Senior ${index === 1 ? 'React' : index === 2 ? 'Python' : 'Full Stack'} Developer</h3>
    <p class="card-description">Join our innovative team and build cutting-edge applications that impact millions of users. We offer excellent benefits, flexible work arrangements, and opportunities for growth.</p>
    
    <div class="card-skills">
      ${skills[index - 1].map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
    </div>
    
    <div class="card-meta">
      <span class="card-meta-item">
        <i class="fas fa-map-marker-alt"></i>
        ${locations[index - 1]}
      </span>
      <span class="card-meta-item">
        <i class="fas fa-clock"></i>
        ${postedTime[index - 1]}
      </span>
      <span class="card-meta-item">
        <i class="fas fa-eye"></i>
        ${50 + index * 23} views
      </span>
    </div>
    
    <div class="card-footer">
      <div class="card-price">${salaries[index - 1]} - ${salaries[index - 1].replace(/\d+/, (match) => parseInt(match) + 20)}k</div>
      <div class="card-cta">
        <button class="btn btn-outline btn-sm" onclick="quickApply('job-${index}')">
          <i class="fas fa-paper-plane"></i>
          Quick Apply
        </button>
        <button class="btn btn-primary btn-sm" onclick="viewJobDetails('job-${index}')">
          <i class="fas fa-external-link-alt"></i>
          View Details
        </button>
      </div>
    </div>
  `;
  
  return card;
}

function createEnhancedDealCard(index) {
  const card = document.createElement('div');
  card.className = 'card fade-in-up enhanced-card';
  card.setAttribute('data-post-id', `deal-${index}`);
  
  const prices = ['$199', '$89', '$299', '$149', '$399', '$249'];
  const originalPrices = ['$299', '$129', '$399', '$199', '$499', '$349'];
  const brands = ['Apple', 'Samsung', 'Sony', 'Dell', 'Nike', 'Adidas'];
  const timeLeft = ['2 days', '5 hours', '1 day', '3 days', '6 hours', '4 days'];
  const discounts = ['33%', '31%', '25%', '25%', '20%', '29%'];
  
  const isExpiringSoon = index <= 2;
  const isPopular = index % 2 === 0;
  
  card.innerHTML = `
    <div class="card-header">
      <div class="card-badges">
        <span class="card-type deal">Deal</span>
        ${isExpiringSoon ? '<span class="expiring-badge">⏰ Ending Soon</span>' : ''}
        ${isPopular ? '<span class="popular-badge">🔥 Popular</span>' : ''}
      </div>
      <div class="card-actions">
        <button class="card-action-btn" onclick="savePost('deal-${index}')" title="Save">
          <i class="fas fa-bookmark"></i>
        </button>
        <button class="card-action-btn" onclick="sharePost('deal-${index}')" title="Share">
          <i class="fas fa-share"></i>
        </button>
      </div>
    </div>
    
    <div class="deal-image">
      <div class="product-placeholder">
        <i class="fas fa-${index <= 2 ? 'laptop' : index <= 4 ? 'headphones' : 'mobile-alt'}"></i>
      </div>
      <div class="discount-badge">${discounts[index - 1]} OFF</div>
    </div>
    
    <h3 class="card-title">${brands[index - 1]} ${index <= 2 ? 'MacBook Pro M3' : index <= 4 ? 'Wireless Headphones' : 'Smartphone'}</h3>
    <p class="card-description">Premium quality product with amazing features. Limited time offer with exclusive pricing for our community members. Don't miss out on this incredible deal!</p>
    
    <div class="deal-details">
      <div class="price-section">
        <span class="current-price">${prices[index - 1]}</span>
        <span class="original-price">${originalPrices[index - 1]}</span>
        <span class="savings">Save $${parseInt(originalPrices[index - 1].replace('$', '')) - parseInt(prices[index - 1].replace('$', ''))}</span>
      </div>
      <div class="time-left">
        <i class="fas fa-clock"></i>
        ${timeLeft[index - 1]} left
      </div>
    </div>
    
    <div class="card-meta">
      <span class="card-meta-item">
        <i class="fas fa-truck"></i>
        Free shipping
      </span>
      <span class="card-meta-item">
        <i class="fas fa-undo"></i>
        30-day returns
      </span>
      <span class="card-meta-item">
        <i class="fas fa-users"></i>
        ${100 + index * 15} bought
      </span>
    </div>
    
    <div class="card-footer">
      <div class="vendor-info">
        <span class="vendor-name">${brands[index - 1]} Store</span>
        <span class="vendor-rating">
          <i class="fas fa-star"></i> 4.${7 + index}
        </span>
      </div>
      <div class="card-cta">
        <button class="btn btn-outline btn-sm" onclick="addToWishlist('deal-${index}')">
          <i class="fas fa-heart"></i>
          Wishlist
        </button>
        <button class="btn btn-secondary btn-sm" onclick="claimDeal('deal-${index}')">
          <i class="fas fa-shopping-cart"></i>
          Claim Deal
        </button>
      </div>
    </div>
  `;
  
  return card;
}

// 🎯 Enhanced Action Functions
function quickApply(jobId) {
  showToast('Quick apply feature coming soon! 🚀', 'info');
  trackEvent('quick_apply_clicked', { job_id: jobId });
}

function viewJobDetails(jobId) {
  showToast(`Opening job details for ${jobId}...`, 'info');
  trackEvent('job_details_viewed', { job_id: jobId });
}

function claimDeal(dealId) {
  showToast('Redirecting to deal page... 🛒', 'success');
  trackEvent('deal_claimed', { deal_id: dealId });
}

function sharePost(postId) {
  if (navigator.share) {
    navigator.share({
      title: 'Check out this opportunity on Zendea',
      text: 'Found an amazing opportunity you might be interested in!',
      url: window.location.href + '#' + postId
    });
  } else {
    navigator.clipboard.writeText(window.location.href + '#' + postId);
    showToast('Link copied to clipboard! 📋', 'success');
  }
  trackEvent('post_shared', { post_id: postId });
}

// Keep all other existing functions...
function initFAB() {
  const fab = document.getElementById('fab');
  if (!fab) return;
  
  let lastScrollY = window.scrollY;
  
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > 200) {
      fab.classList.remove('hidden');
    } else {
      fab.classList.add('hidden');
    }
    
    lastScrollY = currentScrollY;
  });
}

function initNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

function checkAuthStatus() {
  return localStorage.getItem('zendea-user') !== null;
}

function initLoadMore() {
  const loadMoreBtn = document.getElementById('load-more');
  if (!loadMoreBtn) return;
  
  loadMoreBtn.addEventListener('click', () => {
    loadMoreBtn.classList.add('loading');
    loadMoreBtn.disabled = true;
    
    setTimeout(() => {
      const jobsList = document.getElementById('jobs-list');
      const dealsList = document.getElementById('deals-list');
      
      if (jobsList) {
        jobsList.appendChild(createEnhancedJobCard(7));
      }
      
      if (dealsList) {
        dealsList.appendChild(createEnhancedDealCard(7));
      }
      
      loadMoreBtn.classList.remove('loading');
      loadMoreBtn.disabled = false;
      
      showToast('More posts loaded! 📚', 'success', 2000);
      trackEvent('load_more_clicked');
    }, 1500);
  });
}

function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-up');
      }
    });
  }, observerOptions);
  
  const cards = document.querySelectorAll('.card:not(.fade-in-up)');
  cards.forEach(card => observer.observe(card));
}

// Global error handler
window.addEventListener('error', (e) => {
  console.error('Error:', e.error);
  showToast('Something went wrong. Please try again.', 'error');
  trackEvent('error_occurred', { message: e.message });
});

// Handle back button for panels
window.addEventListener('popstate', () => {
  const openPanels = document.querySelectorAll('.notifications-panel:not(.hidden), .chat-widget:not(.hidden)');
  openPanels.forEach(panel => panel.classList.add('hidden'));
});

// 📞 Contact Toggle Functionality
function initContactToggle() {
  const contactToggleBtn = document.getElementById('contactToggleBtn');
  const contactDetails = document.getElementById('contactDetails');
  
  if (contactToggleBtn && contactDetails) {
    contactToggleBtn.addEventListener('click', () => {
      const isHidden = contactDetails.classList.contains('hidden');
      
      if (isHidden) {
        contactDetails.classList.remove('hidden');
        contactDetails.classList.add('show');
        contactToggleBtn.classList.add('active');
        
        // Add cool animation
        setTimeout(() => {
          contactDetails.style.transform = 'scale(1.02)';
          setTimeout(() => {
            contactDetails.style.transform = 'scale(1)';
          }, 150);
        }, 100);
        
        // Track analytics
        if (typeof trackEvent === 'function') {
          trackEvent('Contact', 'toggle_open', 'footer');
        }
      } else {
        contactDetails.classList.remove('show');
        contactDetails.classList.add('hidden');
        contactToggleBtn.classList.remove('active');
        
        // Track analytics
        if (typeof trackEvent === 'function') {
          trackEvent('Contact', 'toggle_close', 'footer');
        }
      }
    });
    
    // Add hover effects
    contactToggleBtn.addEventListener('mouseenter', () => {
      contactToggleBtn.style.transform = 'scale(1.05)';
    });
    
    contactToggleBtn.addEventListener('mouseleave', () => {
      contactToggleBtn.style.transform = 'scale(1)';
    });
    
    // Add click ripple effect
    contactToggleBtn.addEventListener('click', (e) => {
      const ripple = document.createElement('span');
      const rect = contactToggleBtn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      `;
      
      contactToggleBtn.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }
}
