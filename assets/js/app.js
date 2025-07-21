// ====================================== //
// 🚀 Zendea Main Application //
// ====================================== //

class ZendeaApp {
  constructor() {
    this.currentSection = 'home';
    this.searchFilters = {};
    this.isLoading = false;
    this.initialized = false;
  }

  async init() {
    try {
      console.log('🚀 Initializing Zendea App...');
      
      // Wait for Firebase Service to be ready
      await this.waitForFirebaseService();
      
      // Initialize UI components
      this.initializeUI();
      this.setupEventListeners();
      this.setupTheme();
      this.setupScrollEffects();
      this.initializeAnimations();
      
      // Load initial data
      await this.loadInitialData();
      
      this.initialized = true;
      console.log('✅ Zendea App initialized successfully');
      
      this.showToast('Welcome to Zendea! 🎉', 'success');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      this.showToast('Failed to initialize app. Please refresh.', 'error');
    }
  }

  async waitForFirebaseService() {
    return new Promise((resolve, reject) => {
      if (window.firebaseService && window.firebaseService.initialized) {
        resolve();
        return;
      }

      const checkService = () => {
        if (window.firebaseService && window.firebaseService.initialized) {
          resolve();
        } else {
          setTimeout(checkService, 100);
        }
      };

      checkService();

      // Timeout after 15 seconds
      setTimeout(() => {
        reject(new Error('Firebase Service initialization timeout'));
      }, 15000);
    });
  }

  // ============================================ //
  // 🎨 UI INITIALIZATION
  // ============================================ //

  initializeUI() {
    // Initialize navigation
    this.initializeNavigation();
    
    // Initialize search
    this.initializeSearch();
    
    // Initialize modals
    this.initializeModals();
    
    // Initialize forms
    this.initializeForms();
    
    // Initialize stats counter animation
    this.initializeStatsCounter();
    
    // Show home section by default
    this.showSection('home');
  }

  initializeNavigation() {
    // Desktop navigation
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        this.showSection(section);
        this.updateActiveNavItem(item);
      });
    });

    // Mobile navigation
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item[data-section]');
    mobileNavItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        this.showSection(section);
        this.updateActiveMobileNavItem(item);
        this.closeMobileNav();
      });
    });

    // Mobile nav toggle
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const mobileNavClose = document.getElementById('mobileNavClose');
    const mobileNav = document.getElementById('mobileNav');

    mobileNavToggle?.addEventListener('click', () => {
      mobileNav.classList.remove('hidden');
      mobileNav.classList.add('show');
    });

    mobileNavClose?.addEventListener('click', () => {
      this.closeMobileNav();
    });

    // Close mobile nav when clicking overlay
    mobileNav?.addEventListener('click', (e) => {
      if (e.target === mobileNav) {
        this.closeMobileNav();
      }
    });
  }

  closeMobileNav() {
    const mobileNav = document.getElementById('mobileNav');
    mobileNav?.classList.remove('show');
    setTimeout(() => {
      mobileNav?.classList.add('hidden');
    }, 300);
  }

  updateActiveNavItem(activeItem) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to clicked item
    activeItem.classList.add('active');
  }

  updateActiveMobileNavItem(activeItem) {
    // Remove active class from all mobile nav items
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to clicked item
    activeItem.classList.add('active');
  }

  showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
      section.classList.add('hidden');
    });

    // Show the requested section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
      targetSection.classList.remove('hidden');
      this.currentSection = sectionName;
      
      // Load section-specific data
      this.loadSectionData(sectionName);
      
      // Update page title
      this.updatePageTitle(sectionName);
      
      // Animate section entrance
      this.animateSectionEntrance(targetSection);
    }
  }

  async loadSectionData(sectionName) {
    if (!window.firebaseService) return;

    try {
      switch (sectionName) {
        case 'jobs':
          await this.loadJobs();
          break;
        case 'deals':
          await this.loadDeals();
          break;
        case 'favorites':
          if (window.firebaseService.isAuthenticated()) {
            await this.loadFavorites();
          }
          break;
        case 'messages':
          if (window.firebaseService.isAuthenticated()) {
            await this.loadMessages();
          }
          break;
        case 'settings':
          await this.loadSettings();
          break;
      }
    } catch (error) {
      console.error(`❌ Error loading ${sectionName} data:`, error);
      this.showToast(`Failed to load ${sectionName}`, 'error');
    }
  }

  updatePageTitle(sectionName) {
    const titles = {
      home: 'Home',
      jobs: 'Jobs',
      deals: 'Deals',
      favorites: 'My Favorites',
      messages: 'Messages',
      feedback: 'Feedback',
      settings: 'Settings'
    };
    
    const title = titles[sectionName] || 'Zendea';
    document.title = `${title} — Zendea`;
  }

  // ============================================ //
  // 🔍 SEARCH FUNCTIONALITY
  // ============================================ //

  initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const categoryFilter = document.getElementById('categoryFilter');
    const locationFilter = document.getElementById('locationFilter');
    const priceFilter = document.getElementById('priceFilter');
    const sortFilter = document.getElementById('sortFilter');

    // Search button click
    searchBtn?.addEventListener('click', () => {
      this.performSearch();
    });

    // Search input enter key
    searchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });

    // Filter changes
    [categoryFilter, locationFilter, priceFilter, sortFilter].forEach(filter => {
      filter?.addEventListener('change', () => {
        this.updateSearchFilters();
        this.performSearch();
      });
    });

    // Real-time search (debounced)
    searchInput?.addEventListener('input', this.debounce(() => {
      this.performSearch();
    }, 500));
  }

  updateSearchFilters() {
    this.searchFilters = {
      query: document.getElementById('searchInput')?.value || '',
      category: document.getElementById('categoryFilter')?.value || '',
      location: document.getElementById('locationFilter')?.value || '',
      price: document.getElementById('priceFilter')?.value || '',
      sort: document.getElementById('sortFilter')?.value || 'newest'
    };
  }

  async performSearch() {
    this.updateSearchFilters();
    
    const { query, category } = this.searchFilters;
    
    if (!query && !category) {
      // Show all posts if no search criteria
      if (this.currentSection === 'jobs') {
        await this.loadJobs();
      } else if (this.currentSection === 'deals') {
        await this.loadDeals();
      }
      return;
    }

    try {
      this.setLoadingState(true);
      
      // For now, we'll filter client-side
      // In a real app, you'd send these filters to the backend
      let posts = [];
      
      if (!category || category === 'job') {
        const jobs = await window.firebaseService.loadPosts();
        posts = posts.concat(jobs.filter(post => post.type === 'job'));
      }
      
      if (!category || category === 'deal') {
        const deals = await window.firebaseService.loadPosts();
        posts = posts.concat(deals.filter(post => post.type === 'deal'));
      }

      // Filter by search query
      if (query) {
        const searchTerm = query.toLowerCase();
        posts = posts.filter(post => 
          post.title.toLowerCase().includes(searchTerm) ||
          post.description.toLowerCase().includes(searchTerm) ||
          (post.location && post.location.toLowerCase().includes(searchTerm))
        );
      }

      // Apply sorting
      posts = this.sortPosts(posts, this.searchFilters.sort);

      // Display results
      this.displaySearchResults(posts, category);
      
    } catch (error) {
      console.error('❌ Search error:', error);
      this.showToast('Search failed. Please try again.', 'error');
    } finally {
      this.setLoadingState(false);
    }
  }

  sortPosts(posts, sortBy) {
    return posts.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        case 'oldest':
          return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        default:
          return 0;
      }
    });
  }

  displaySearchResults(posts, category) {
    if (category === 'job' || (!category && this.currentSection === 'jobs')) {
      const jobPosts = posts.filter(post => post.type === 'job');
      this.displayPosts(jobPosts, 'jobsGrid');
    } else if (category === 'deal' || (!category && this.currentSection === 'deals')) {
      const dealPosts = posts.filter(post => post.type === 'deal');
      this.displayPosts(dealPosts, 'dealsGrid');
    } else {
      // Show both jobs and deals in current section
      this.displayPosts(posts, this.currentSection === 'jobs' ? 'jobsGrid' : 'dealsGrid');
    }
  }

  // ============================================ //
  // 📋 DATA LOADING AND DISPLAY
  // ============================================ //

  async loadJobs() {
    try {
      this.setLoadingState(true);
      const posts = await window.firebaseService.loadPosts();
      const jobs = posts.filter(post => post.type === 'job');
      this.displayPosts(jobs, 'jobsGrid');
    } catch (error) {
      console.error('❌ Error loading jobs:', error);
      this.showToast('Failed to load jobs', 'error');
    } finally {
      this.setLoadingState(false);
    }
  }

  async loadDeals() {
    try {
      this.setLoadingState(true);
      const posts = await window.firebaseService.loadPosts();
      const deals = posts.filter(post => post.type === 'deal');
      this.displayPosts(deals, 'dealsGrid');
    } catch (error) {
      console.error('❌ Error loading deals:', error);
      this.showToast('Failed to load deals', 'error');
    } finally {
      this.setLoadingState(false);
    }
  }

  async loadFavorites() {
    try {
      this.setLoadingState(true);
      const favorites = await window.firebaseService.loadFavorites();
      this.displayPosts(favorites, 'favoritesGrid');
      
      // Show/hide empty state
      const emptyState = document.getElementById('favoritesEmpty');
      if (favorites.length === 0) {
        emptyState?.classList.remove('hidden');
      } else {
        emptyState?.classList.add('hidden');
      }
    } catch (error) {
      console.error('❌ Error loading favorites:', error);
      this.showToast('Failed to load favorites', 'error');
    } finally {
      this.setLoadingState(false);
    }
  }

  async loadMessages() {
    try {
      this.setLoadingState(true);
      const messages = await window.firebaseService.loadMessages();
      this.displayMessages(messages);
      
      // Show/hide empty state
      const emptyState = document.getElementById('messagesEmpty');
      if (messages.length === 0) {
        emptyState?.classList.remove('hidden');
      } else {
        emptyState?.classList.add('hidden');
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      this.showToast('Failed to load messages', 'error');
    } finally {
      this.setLoadingState(false);
    }
  }

  displayPosts(posts, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (posts.length === 0) {
      container.innerHTML = this.getEmptyPostsHTML();
      return;
    }

    container.innerHTML = posts.map(post => this.createPostHTML(post)).join('');
    
    // Add event listeners to post actions
    this.attachPostEventListeners(container);
  }

  createPostHTML(post) {
    const isOwner = window.firebaseService.isAuthenticated() && 
                   window.firebaseService.getCurrentUser()?.uid === post.postedBy;
    
    return `
      <div class="post-card" data-post-id="${post.id}">
        <div class="post-header">
          <div class="post-type ${post.type}">
            <i class="fas fa-${post.type === 'job' ? 'briefcase' : 'tag'}"></i>
            ${post.type.toUpperCase()}
          </div>
          <div class="post-actions">
            ${window.firebaseService.isAuthenticated() ? `
              <button class="post-action favorite-btn" data-post-id="${post.id}" title="Add to favorites">
                <i class="fas fa-heart"></i>
              </button>
            ` : ''}
            ${isOwner ? `
              <button class="post-action edit-btn" data-post-id="${post.id}" title="Edit post">
                <i class="fas fa-edit"></i>
              </button>
              <button class="post-action delete-btn" data-post-id="${post.id}" title="Delete post">
                <i class="fas fa-trash"></i>
              </button>
            ` : ''}
          </div>
        </div>
        
        <div class="post-body">
          <h3 class="post-title">${this.escapeHtml(post.title)}</h3>
          <p class="post-description">${this.escapeHtml(post.description)}</p>
          
          <div class="post-meta">
            ${post.location ? `
              <div class="post-meta-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${this.escapeHtml(post.location)}</span>
              </div>
            ` : ''}
            ${post.price ? `
              <div class="post-meta-item">
                <i class="fas fa-dollar-sign"></i>
                <span>${this.formatPrice(post.price)}</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="post-footer">
          <div class="post-author">
            <div class="author-avatar">
              ${post.postedByName ? post.postedByName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div class="author-info">
              <div class="author-name">${this.escapeHtml(post.postedByName || 'Anonymous')}</div>
              <div class="post-date">${this.formatDate(post.createdAt)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getEmptyPostsHTML() {
    return `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-search"></i>
        </div>
        <h3>No posts found</h3>
        <p>Try adjusting your search criteria or check back later.</p>
      </div>
    `;
  }

  attachPostEventListeners(container) {
    // Favorite buttons
    container.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const postId = btn.dataset.postId;
        await this.toggleFavorite(postId, btn);
      });
    });

    // Edit buttons
    container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const postId = btn.dataset.postId;
        await this.editPost(postId);
      });
    });

    // Delete buttons
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const postId = btn.dataset.postId;
        await this.deletePost(postId);
      });
    });
  }

  async toggleFavorite(postId, btn) {
    try {
      const wasAdded = await window.firebaseService.toggleFavorite(postId);
      
      if (wasAdded) {
        btn.classList.add('favorited');
        btn.title = 'Remove from favorites';
        this.showToast('Added to favorites! ❤️', 'success');
      } else {
        btn.classList.remove('favorited');
        btn.title = 'Add to favorites';
        this.showToast('Removed from favorites', 'info');
      }
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      this.showToast('Failed to update favorite', 'error');
    }
  }

  async editPost(postId) {
    // For now, just show a toast. You can implement a full edit modal later
    this.showToast('Edit functionality coming soon!', 'info');
  }

  async deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await window.firebaseService.deletePost(postId);
      this.showToast('Post deleted successfully', 'success');
      
      // Refresh current section
      await this.loadSectionData(this.currentSection);
    } catch (error) {
      console.error('❌ Error deleting post:', error);
      this.showToast('Failed to delete post', 'error');
    }
  }

  displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;

    if (messages.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-envelope"></i>
          </div>
          <h3>No messages yet</h3>
          <p>Start a conversation with other users!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = messages.map(message => `
      <div class="message-card" data-message-id="${message.id}">
        <div class="message-header">
          <div class="message-sender">
            <div class="sender-avatar">${message.senderEmail.charAt(0).toUpperCase()}</div>
            <div class="sender-info">
              <div class="sender-name">${this.escapeHtml(message.senderEmail)}</div>
              <div class="message-date">${this.formatDate(message.createdAt)}</div>
            </div>
          </div>
          ${!message.read ? '<div class="unread-indicator"></div>' : ''}
        </div>
        <div class="message-body">
          <h4 class="message-subject">${this.escapeHtml(message.subject)}</h4>
          <p class="message-preview">${this.escapeHtml(message.message.substring(0, 100))}${message.message.length > 100 ? '...' : ''}</p>
        </div>
      </div>
    `).join('');

    // Add click listeners to messages
    container.querySelectorAll('.message-card').forEach(card => {
      card.addEventListener('click', () => {
        const messageId = card.dataset.messageId;
        this.openMessage(messageId);
      });
    });
  }

  async openMessage(messageId) {
    try {
      await window.firebaseService.markMessageAsRead(messageId);
      this.showToast('Message opened', 'info');
      // Here you could open a detailed message view modal
    } catch (error) {
      console.error('❌ Error opening message:', error);
    }
  }

  // ============================================ //
  // 📝 FORM HANDLING
  // ============================================ //

  initializeForms() {
    // Create post form
    const createPostForm = document.getElementById('createPostForm');
    createPostForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleCreatePost(new FormData(createPostForm));
    });

    // Feedback form
    const feedbackForm = document.getElementById('feedbackForm');
    feedbackForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleFeedback(new FormData(feedbackForm));
    });

    // Compose message form
    const composeMessageForm = document.getElementById('composeMessageForm');
    composeMessageForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSendMessage(new FormData(composeMessageForm));
    });

    // Rating system for feedback
    this.initializeRatingSystem();
  }

  initializeRatingSystem() {
    const ratingStars = document.querySelectorAll('#ratingStars .star');
    const ratingInput = document.getElementById('rating');
    const ratingText = document.getElementById('ratingText');

    ratingStars.forEach(star => {
      star.addEventListener('click', () => {
        const rating = parseInt(star.dataset.rating);
        ratingInput.value = rating;
        
        // Update visual state
        ratingStars.forEach((s, index) => {
          if (index < rating) {
            s.classList.add('active');
          } else {
            s.classList.remove('active');
          }
        });

        // Update text
        const ratingTexts = {
          1: 'Poor',
          2: 'Fair',
          3: 'Good',
          4: 'Very Good',
          5: 'Excellent'
        };
        ratingText.textContent = ratingTexts[rating] || 'Click to rate';
      });

      star.addEventListener('mouseenter', () => {
        const rating = parseInt(star.dataset.rating);
        ratingStars.forEach((s, index) => {
          if (index < rating) {
            s.style.color = '#fbbf24';
          } else {
            s.style.color = '#d1d5db';
          }
        });
      });
    });

    // Reset on mouse leave
    document.getElementById('ratingStars')?.addEventListener('mouseleave', () => {
      const currentRating = parseInt(ratingInput.value) || 0;
      ratingStars.forEach((s, index) => {
        if (index < currentRating) {
          s.style.color = '#fbbf24';
        } else {
          s.style.color = '#d1d5db';
        }
      });
    });
  }

  async handleCreatePost(formData) {
    if (!window.firebaseService.isAuthenticated()) {
      this.showToast('Please sign in to create posts', 'warning');
      return;
    }

    try {
      this.setLoadingState(true);

      const postData = {
        title: formData.get('title'),
        type: formData.get('type'),
        description: formData.get('description'),
        location: formData.get('location'),
        price: formData.get('price') ? parseFloat(formData.get('price')) : null
      };

      // Validate required fields
      if (!postData.title || !postData.type || !postData.description) {
        this.showToast('Please fill in all required fields', 'warning');
        return;
      }

      await window.firebaseService.createPost(postData);
      
      this.showToast('Post created successfully! 🎉', 'success');
      this.closeModal('createPostModal');
      
      // Reset form
      document.getElementById('createPostForm').reset();
      
      // Refresh current section if it matches the post type
      if (this.currentSection === 'jobs' && postData.type === 'job') {
        await this.loadJobs();
      } else if (this.currentSection === 'deals' && postData.type === 'deal') {
        await this.loadDeals();
      }
      
    } catch (error) {
      console.error('❌ Error creating post:', error);
      this.showToast('Failed to create post. Please try again.', 'error');
    } finally {
      this.setLoadingState(false);
    }
  }

  async handleFeedback(formData) {
    if (!window.firebaseService.isAuthenticated()) {
      this.showToast('Please sign in to submit feedback', 'warning');
      return;
    }

    try {
      this.setLoadingState(true);

      const feedbackData = {
        rating: parseInt(formData.get('rating')),
        type: formData.get('type'),
        message: formData.get('message')
      };

      // Validate required fields
      if (!feedbackData.rating || !feedbackData.type || !feedbackData.message) {
        this.showToast('Please fill in all required fields', 'warning');
        return;
      }

      await window.firebaseService.submitFeedback(feedbackData);
      
      this.showToast('Thank you for your feedback! 🙏', 'success');
      
      // Reset form
      document.getElementById('feedbackForm').reset();
      document.getElementById('rating').value = '';
      document.getElementById('ratingText').textContent = 'Click to rate';
      document.querySelectorAll('#ratingStars .star').forEach(star => {
        star.classList.remove('active');
        star.style.color = '#d1d5db';
      });
      
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      this.showToast('Failed to submit feedback. Please try again.', 'error');
    } finally {
      this.setLoadingState(false);
    }
  }

  async handleSendMessage(formData) {
    if (!window.firebaseService.isAuthenticated()) {
      this.showToast('Please sign in to send messages', 'warning');
      return;
    }

    try {
      this.setLoadingState(true);

      const messageData = {
        recipient: formData.get('recipient'),
        subject: formData.get('subject'),
        message: formData.get('message')
      };

      // Validate required fields
      if (!messageData.recipient || !messageData.subject || !messageData.message) {
        this.showToast('Please fill in all required fields', 'warning');
        return;
      }

      await window.firebaseService.sendMessage(
        messageData.recipient,
        messageData.subject,
        messageData.message
      );
      
      this.showToast('Message sent successfully! 📧', 'success');
      this.closeModal('composeMessageModal');
      
      // Reset form
      document.getElementById('composeMessageForm').reset();
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      const errorMessage = error.message.includes('not found') ? 
        'Recipient not found. Please check the email address.' : 
        'Failed to send message. Please try again.';
      this.showToast(errorMessage, 'error');
    } finally {
      this.setLoadingState(false);
    }
  }

  // ============================================ //
  // 🎭 MODAL MANAGEMENT
  // ============================================ //

  initializeModals() {
    // Create post modal
    this.setupModalEventListeners('createPostModal', 'createPostFab', 'closeCreatePostModal', 'cancelCreatePost');
    
    // Compose message modal
    this.setupModalEventListeners('composeMessageModal', 'composeMessageBtn', 'closeComposeMessageModal', 'cancelMessage');
    this.setupModalEventListeners('composeMessageModal', 'startMessagingBtn');
  }

  setupModalEventListeners(modalId, openBtnId, closeBtnId, cancelBtnId) {
    const modal = document.getElementById(modalId);
    const openBtn = document.getElementById(openBtnId);
    const closeBtn = document.getElementById(closeBtnId);
    const cancelBtn = document.getElementById(cancelBtnId);

    // Open modal
    openBtn?.addEventListener('click', () => {
      this.openModal(modalId);
    });

    // Close modal
    closeBtn?.addEventListener('click', () => {
      this.closeModal(modalId);
    });

    cancelBtn?.addEventListener('click', () => {
      this.closeModal(modalId);
    });

    // Close on overlay click
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modalId);
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal?.classList.contains('hidden')) {
        this.closeModal(modalId);
      }
    });
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      // Focus first input
      const firstInput = modal.querySelector('input, textarea, select');
      firstInput?.focus();
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  // ============================================ //
  // 🎨 THEME AND VISUAL EFFECTS
  // ============================================ //

  setupTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Set initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    this.updateThemeIcon(currentTheme);

    themeToggle?.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      this.updateThemeIcon(newTheme);
      
      this.showToast(`Switched to ${newTheme} mode`, 'info');
    });
  }

  updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle?.querySelector('i');
    if (icon) {
      icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
  }

  setupScrollEffects() {
    // Header scroll effect
    const header = document.getElementById('header');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 50) {
        header?.classList.add('scrolled');
      } else {
        header?.classList.remove('scrolled');
      }

      // Show/hide back to top button
      const backToTop = document.getElementById('backToTop');
      if (currentScrollY > 300) {
        backToTop?.classList.add('show');
      } else {
        backToTop?.classList.remove('show');
      }

      lastScrollY = currentScrollY;
    });

    // Back to top functionality
    document.getElementById('backToTop')?.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  initializeAnimations() {
    // Animate stats counter
    this.animateStatsCounter();
    
    // Animate sections on scroll
    this.setupScrollAnimations();
  }

  animateStatsCounter() {
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    
    const animateCounter = (element, target) => {
      let current = 0;
      const increment = target / 50;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          element.textContent = target.toLocaleString();
          clearInterval(timer);
        } else {
          element.textContent = Math.floor(current).toLocaleString();
        }
      }, 30);
    };

    // Intersection Observer for triggering animation
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.dataset.target);
          animateCounter(entry.target, target);
          observer.unobserve(entry.target);
        }
      });
    });

    statNumbers.forEach(stat => observer.observe(stat));
  }

  setupScrollAnimations() {
    const animatedElements = document.querySelectorAll('.scroll-reveal, .entrance-fade, .entrance-slide-up');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(element => observer.observe(element));
  }

  animateSectionEntrance(section) {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      section.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      section.style.opacity = '1';
      section.style.transform = 'translateY(0)';
    }, 50);
  }

  initializeStatsCounter() {
    // This is called separately for immediate initialization
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    statNumbers.forEach(stat => {
      stat.textContent = '0';
    });
  }

  // ============================================ //
  // 🛠️ UTILITY FUNCTIONS
  // ============================================ //

  setLoadingState(isLoading) {
    this.isLoading = isLoading;
    
    // Update UI to show loading state
    const loadingElements = document.querySelectorAll('.loading-indicator');
    loadingElements.forEach(element => {
      if (isLoading) {
        element.classList.remove('hidden');
      } else {
        element.classList.add('hidden');
      }
    });
  }

  showToast(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-${this.getToastIcon(type)}"></i>
        <span>${message}</span>
      </div>
      <button class="toast-close">
        <i class="fas fa-times"></i>
      </button>
    `;

    const container = document.getElementById('toastContainer') || document.body;
    container.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.remove('hidden'), 100);

    // Close functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn?.addEventListener('click', () => this.removeToast(toast));

    // Auto remove
    setTimeout(() => this.removeToast(toast), duration);
  }

  removeToast(toast) {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }

  getToastIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatPrice(price) {
    if (!price) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatDate(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  async loadInitialData() {
    try {
      // Load default data for home section
      await this.loadJobs();
      await this.loadDeals();
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
    }
  }

  // ============================================ //
  // 🎬 EVENT LISTENERS SETUP
  // ============================================ //

  setupEventListeners() {
    // Get started and explore buttons
    document.getElementById('getStartedBtn')?.addEventListener('click', () => {
      if (window.firebaseService.isAuthenticated()) {
        this.openModal('createPostModal');
      } else {
        window.location.href = 'login.html';
      }
    });

    document.getElementById('exploreBtn')?.addEventListener('click', () => {
      this.showSection('jobs');
    });

    // Load more buttons
    document.getElementById('loadMoreJobs')?.addEventListener('click', () => {
      this.loadJobs();
    });

    document.getElementById('loadMoreDeals')?.addEventListener('click', () => {
      this.loadDeals();
    });

    // Notifications
    document.getElementById('notificationsBtn')?.addEventListener('click', () => {
      this.toggleNotificationsPanel();
    });

    // User dropdown
    document.getElementById('userAvatar')?.addEventListener('click', () => {
      this.toggleUserDropdown();
    });

    // Sign out
    document.getElementById('signOutBtn')?.addEventListener('click', async () => {
      try {
        await window.firebaseService.signOut();
      } catch (error) {
        console.error('❌ Sign out error:', error);
        this.showToast('Failed to sign out', 'error');
      }
    });

    // Listen for auth state changes
    window.addEventListener('authStateChanged', (e) => {
      const { isAuthenticated } = e.detail;
      console.log('🔐 Auth state changed in app:', isAuthenticated);
    });

    // Listen for user data load events
    window.addEventListener('loadUserData', (e) => {
      console.log('📥 Loading user data for:', e.detail.userId);
      // Refresh current section data if needed
      if (this.currentSection === 'favorites' || this.currentSection === 'messages') {
        this.loadSectionData(this.currentSection);
      }
    });
  }

  toggleNotificationsPanel() {
    const panel = document.getElementById('notificationsPanel');
    panel?.classList.toggle('hidden');
  }

  toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown?.classList.toggle('show');
  }

  // ============================================ //
  // ⚙️ SETTINGS FUNCTIONALITY
  // ============================================ //

  async loadSettings() {
    try {
      // Initialize theme grid
      this.initializeThemeGrid();
      
      // Load saved settings
      this.loadSavedSettings();
      
      // Initialize settings event listeners
      this.initializeSettingsEventListeners();
      
      // Update storage info
      this.updateStorageInfo();
      
      console.log('✅ Settings loaded successfully');
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      this.showToast('Failed to load settings', 'error');
    }
  }

  initializeThemeGrid() {
    const themeGrid = document.getElementById('themeGrid');
    if (!themeGrid) return;

    const themes = [
      { id: 'light', name: 'Light', primary: '#6366f1', secondary: '#10b981', background: '#ffffff' },
      { id: 'dark', name: 'Dark', primary: '#6366f1', secondary: '#10b981', background: '#111827' },
      { id: 'ocean-breeze', name: 'Ocean Breeze', primary: '#0EA5E9', secondary: '#06B6D4', background: '#F0F9FF' },
      { id: 'sunset-glow', name: 'Sunset Glow', primary: '#F97316', secondary: '#EF4444', background: '#FFF7ED' },
      { id: 'forest-green', name: 'Forest Green', primary: '#059669', secondary: '#10B981', background: '#F0FDF4' },
      { id: 'royal-purple', name: 'Royal Purple', primary: '#7C3AED', secondary: '#A855F7', background: '#FAF5FF' },
      { id: 'cherry-blossom', name: 'Cherry Blossom', primary: '#EC4899', secondary: '#F472B6', background: '#FDF2F8' },
      { id: 'midnight-blue', name: 'Midnight Blue', primary: '#1E40AF', secondary: '#3B82F6', background: '#F8FAFC' },
      { id: 'golden-hour', name: 'Golden Hour', primary: '#D97706', secondary: '#F59E0B', background: '#FFFBEB' },
      { id: 'lavender-dreams', name: 'Lavender Dreams', primary: '#8B5CF6', secondary: '#A78BFA', background: '#F5F3FF' },
      { id: 'mint-fresh', name: 'Mint Fresh', primary: '#14B8A6', secondary: '#06B6D4', background: '#F0FDFA' },
      { id: 'rose-gold', name: 'Rose Gold', primary: '#BE185D', secondary: '#DC2626', background: '#FFF1F2' },
      { id: 'arctic-ice', name: 'Arctic Ice', primary: '#0F766E', secondary: '#0891B2', background: '#ECFEFF' },
      { id: 'warm-amber', name: 'Warm Amber', primary: '#92400E', secondary: '#B45309', background: '#FFFBEB' },
      { id: 'cosmic-purple', name: 'Cosmic Purple', primary: '#581C87', secondary: '#7C2D12', background: '#1A1A2E' },
      { id: 'emerald-garden', name: 'Emerald Garden', primary: '#047857', secondary: '#059669', background: '#ECFDF5' },
      { id: 'crimson-sunset', name: 'Crimson Sunset', primary: '#B91C1C', secondary: '#DC2626', background: '#FEF2F2' }
    ];

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';

    themeGrid.innerHTML = themes.map(theme => `
      <div class="theme-option ${theme.id === currentTheme ? 'active' : ''}" 
           data-theme="${theme.id}" 
           title="${theme.name}">
        <div class="theme-preview" style="background: ${theme.background};">
          <div class="theme-header" style="background: ${theme.primary};"></div>
          <div class="theme-content">
            <div class="theme-line" style="background: ${theme.primary};"></div>
            <div class="theme-line" style="background: ${theme.secondary};"></div>
            <div class="theme-line" style="background: ${theme.primary};"></div>
          </div>
          <div class="theme-name">${theme.name}</div>
        </div>
      </div>
    `).join('');

    // Add theme selection event listeners
    themeGrid.querySelectorAll('.theme-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const themeId = option.getAttribute('data-theme');
        this.applyTheme(themeId);
        
        // Update active state
        themeGrid.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
      });
    });
  }

  applyTheme(themeId) {
    try {
      // Update HTML data-theme attribute
      document.documentElement.setAttribute('data-theme', themeId);
      
      // Save to localStorage
      localStorage.setItem('zendea-theme', themeId);
      
      // Update theme toggle icon based on theme
      this.updateThemeIcon(themeId);
      
      // Show success toast
      this.showToast(`Applied ${themeId.replace('-', ' ')} theme! 🎨`, 'success');
      
      // Track analytics
      if (window.firebaseService && window.firebaseService.isAuthenticated()) {
        window.firebaseService.trackAnalytics('theme_changed', { 
          theme: themeId,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`✅ Theme applied: ${themeId}`);
    } catch (error) {
      console.error('❌ Error applying theme:', error);
      this.showToast('Failed to apply theme', 'error');
    }
  }

  loadSavedSettings() {
    try {
      // Load theme
      const savedTheme = localStorage.getItem('zendea-theme') || 'light';
      document.documentElement.setAttribute('data-theme', savedTheme);
      
      // Load other preferences
      const settings = {
        darkMode: localStorage.getItem('zendea-dark-mode') === 'true',
        animations: localStorage.getItem('zendea-animations') !== 'false',
        soundEffects: localStorage.getItem('zendea-sound-effects') === 'true',
        emailNotifications: localStorage.getItem('zendea-email-notifications') !== 'false',
        pushNotifications: localStorage.getItem('zendea-push-notifications') !== 'false',
        jobAlerts: localStorage.getItem('zendea-job-alerts') !== 'false',
        dealAlerts: localStorage.getItem('zendea-deal-alerts') !== 'false',
        messageNotifications: localStorage.getItem('zendea-message-notifications') !== 'false',
        profileVisibility: localStorage.getItem('zendea-profile-visibility') !== 'false',
        showOnlineStatus: localStorage.getItem('zendea-show-online-status') !== 'false',
        allowDirectMessages: localStorage.getItem('zendea-allow-direct-messages') !== 'false',
        offlineMode: localStorage.getItem('zendea-offline-mode') === 'true',
        autoSync: localStorage.getItem('zendea-auto-sync') !== 'false',
        reducedMotion: localStorage.getItem('zendea-reduced-motion') === 'true',
        highContrast: localStorage.getItem('zendea-high-contrast') === 'true',
        screenReader: localStorage.getItem('zendea-screen-reader') === 'true',
        language: localStorage.getItem('zendea-language') || 'en',
        country: localStorage.getItem('zendea-country') || 'KE',
        currency: localStorage.getItem('zendea-currency') || 'KES',
        timezone: localStorage.getItem('zendea-timezone') || 'Africa/Nairobi',
        imageQuality: localStorage.getItem('zendea-image-quality') || 'medium',
        fontSize: localStorage.getItem('zendea-font-size') || '16'
      };

      // Apply settings to UI
      Object.keys(settings).forEach(key => {
        const element = document.getElementById(key + (key.includes('Toggle') || key.includes('Input') ? '' : 
                       key === 'fontSize' ? 'Slider' : 'Select'));
        if (element) {
          if (element.type === 'checkbox') {
            element.checked = settings[key];
          } else if (element.type === 'range') {
            element.value = settings[key];
          } else {
            element.value = settings[key];
          }
        }
      });

      // Apply font size
      document.documentElement.style.setProperty('--font-size-base', `${settings.fontSize}px`);

      // Apply accessibility settings
      if (settings.reducedMotion) {
        document.documentElement.style.setProperty('--animation-duration-fast', '0ms');
        document.documentElement.style.setProperty('--animation-duration-base', '0ms');
        document.documentElement.style.setProperty('--animation-duration-slow', '0ms');
      }

      // Apply language
      this.applyLanguage(settings.language);
      
      // Apply other settings
      this.applyCountrySettings(settings.country);
      this.applyCurrencyFormat(settings.currency);
      this.applyTimezone(settings.timezone);
      this.applyImageQuality(settings.imageQuality);
      
      // Apply privacy settings visually
      document.documentElement.classList.toggle('private-profile', !settings.profileVisibility);
      document.documentElement.classList.toggle('hide-online-status', !settings.showOnlineStatus);
      document.documentElement.classList.toggle('no-direct-messages', !settings.allowDirectMessages);
      
      // Apply accessibility classes
      document.documentElement.classList.toggle('high-contrast', settings.highContrast);
      document.documentElement.classList.toggle('screen-reader-mode', settings.screenReader);
      document.documentElement.classList.toggle('reduced-motion', settings.reducedMotion);
      
      // Enable sound effects class
      if (settings.soundEffects) {
        document.body.classList.add('sound-enabled');
      }
      
      // Start auto sync if enabled
      if (settings.autoSync) {
        this.startAutoSync();
      }
      
      // Enable offline mode if set
      if (settings.offlineMode) {
        this.enableOfflineMode();
      }

    } catch (error) {
      console.error('❌ Error loading saved settings:', error);
    }
  }

  initializeSettingsEventListeners() {
    // Theme and appearance toggles
    document.getElementById('darkModeToggle')?.addEventListener('change', (e) => {
      const isDark = e.target.checked;
      this.applyTheme(isDark ? 'dark' : 'light');
      localStorage.setItem('zendea-dark-mode', isDark);
    });

    document.getElementById('animationsToggle')?.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      localStorage.setItem('zendea-animations', enabled);
      if (!enabled) {
        document.documentElement.style.setProperty('--animation-duration-fast', '0ms');
        document.documentElement.style.setProperty('--animation-duration-base', '0ms');
        document.documentElement.style.setProperty('--animation-duration-slow', '0ms');
        document.documentElement.classList.add('no-animations');
      } else {
        document.documentElement.style.removeProperty('--animation-duration-fast');
        document.documentElement.style.removeProperty('--animation-duration-base');
        document.documentElement.style.removeProperty('--animation-duration-slow');
        document.documentElement.classList.remove('no-animations');
      }
      this.showToast(`Animations ${enabled ? 'enabled' : 'disabled'}`, 'info');
    });

    document.getElementById('soundEffectsToggle')?.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      localStorage.setItem('zendea-sound-effects', enabled);
      
      // Test sound effect
      if (enabled) {
        this.playSound('toggle');
        this.showToast('Sound effects enabled! 🔊', 'success');
      } else {
        this.showToast('Sound effects disabled 🔇', 'info');
      }
    });

    // Notification settings (save preferences for future backend integration)
    ['emailNotifications', 'pushNotifications', 'jobAlerts', 'dealAlerts', 'messageNotifications'].forEach(setting => {
      document.getElementById(setting)?.addEventListener('change', (e) => {
        localStorage.setItem(`zendea-${setting.replace(/([A-Z])/g, '-$1').toLowerCase()}`, e.target.checked);
        this.showToast(`${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} preference saved`, 'info');
        if (localStorage.getItem('zendea-sound-effects') === 'true') {
          this.playSound('toggle');
        }
      });
    });

    // Privacy settings (functional for frontend behavior)
    document.getElementById('profileVisibility')?.addEventListener('change', (e) => {
      localStorage.setItem('zendea-profile-visibility', e.target.checked);
      document.documentElement.classList.toggle('private-profile', !e.target.checked);
      this.showToast(`Profile ${e.target.checked ? 'public' : 'private'}`, 'info');
      if (localStorage.getItem('zendea-sound-effects') === 'true') {
        this.playSound('toggle');
      }
    });

    document.getElementById('showOnlineStatus')?.addEventListener('change', (e) => {
      localStorage.setItem('zendea-show-online-status', e.target.checked);
      document.documentElement.classList.toggle('hide-online-status', !e.target.checked);
      this.showToast(`Online status ${e.target.checked ? 'visible' : 'hidden'}`, 'info');
      if (localStorage.getItem('zendea-sound-effects') === 'true') {
        this.playSound('toggle');
      }
    });

    document.getElementById('allowDirectMessages')?.addEventListener('change', (e) => {
      localStorage.setItem('zendea-allow-direct-messages', e.target.checked);
      document.documentElement.classList.toggle('no-direct-messages', !e.target.checked);
      this.showToast(`Direct messages ${e.target.checked ? 'allowed' : 'blocked'}`, 'info');
      if (localStorage.getItem('zendea-sound-effects') === 'true') {
        this.playSound('toggle');
      }
    });

    // Performance settings (actually implement offline mode)
    document.getElementById('offlineMode')?.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      localStorage.setItem('zendea-offline-mode', enabled);
      
      if (enabled) {
        this.enableOfflineMode();
      } else {
        this.disableOfflineMode();
      }
      
      this.showToast(`Offline mode ${enabled ? 'enabled' : 'disabled'}`, 'info');
      if (localStorage.getItem('zendea-sound-effects') === 'true') {
        this.playSound('toggle');
      }
    });

    document.getElementById('autoSync')?.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      localStorage.setItem('zendea-auto-sync', enabled);
      
      if (enabled) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
      
      this.showToast(`Auto sync ${enabled ? 'enabled' : 'disabled'}`, 'info');
      if (localStorage.getItem('zendea-sound-effects') === 'true') {
        this.playSound('toggle');
      }
    });

    // Accessibility settings (fully functional)
    document.getElementById('reducedMotion')?.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      localStorage.setItem('zendea-reduced-motion', enabled);
      
      if (enabled) {
        document.documentElement.style.setProperty('--animation-duration-fast', '0ms');
        document.documentElement.style.setProperty('--animation-duration-base', '0ms');
        document.documentElement.style.setProperty('--animation-duration-slow', '0ms');
        document.documentElement.classList.add('reduced-motion');
      } else {
        document.documentElement.style.removeProperty('--animation-duration-fast');
        document.documentElement.style.removeProperty('--animation-duration-base');
        document.documentElement.style.removeProperty('--animation-duration-slow');
        document.documentElement.classList.remove('reduced-motion');
      }
      
      this.showToast(`Motion ${enabled ? 'reduced' : 'restored'}`, 'info');
    });

    document.getElementById('highContrast')?.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      localStorage.setItem('zendea-high-contrast', enabled);
      document.documentElement.classList.toggle('high-contrast', enabled);
      
      if (enabled) {
        document.documentElement.style.setProperty('--color-contrast-ratio', '7:1');
      } else {
        document.documentElement.style.removeProperty('--color-contrast-ratio');
      }
      
      this.showToast(`High contrast ${enabled ? 'enabled' : 'disabled'}`, 'info');
    });

    document.getElementById('screenReader')?.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      localStorage.setItem('zendea-screen-reader', enabled);
      document.documentElement.classList.toggle('screen-reader-mode', enabled);
      
      // Add ARIA labels and descriptions when enabled
      if (enabled) {
        this.enhanceAccessibility();
      } else {
        this.reduceAccessibility();
      }
      
      this.showToast(`Screen reader support ${enabled ? 'enabled' : 'disabled'}`, 'info');
    });

    // Font size slider (fully functional)
    document.getElementById('fontSizeSlider')?.addEventListener('input', (e) => {
      const fontSize = e.target.value;
      document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`);
      document.documentElement.style.setProperty('--font-size-sm', `${fontSize * 0.875}px`);
      document.documentElement.style.setProperty('--font-size-lg', `${fontSize * 1.125}px`);
      document.documentElement.style.setProperty('--font-size-xl', `${fontSize * 1.25}px`);
      localStorage.setItem('zendea-font-size', fontSize);
      
      // Show current size
      this.showToast(`Font size: ${fontSize}px`, 'info');
    });

    // Language and region selects (implement basic language switching)
    document.getElementById('languageSelect')?.addEventListener('change', (e) => {
      const language = e.target.value;
      localStorage.setItem('zendea-language', language);
      this.applyLanguage(language);
      this.showToast(`Language changed to ${this.getLanguageName(language)}`, 'success');
      if (localStorage.getItem('zendea-sound-effects') === 'true') {
        this.playSound('success');
      }
    });

    document.getElementById('countrySelect')?.addEventListener('change', (e) => {
      const country = e.target.value;
      localStorage.setItem('zendea-country', country);
      this.applyCountrySettings(country);
      this.showToast(`Country updated to ${this.getCountryName(country)}`, 'info');
    });

    document.getElementById('currencySelect')?.addEventListener('change', (e) => {
      const currency = e.target.value;
      localStorage.setItem('zendea-currency', currency);
      this.applyCurrencyFormat(currency);
      this.showToast(`Currency set to ${currency}`, 'info');
    });

    document.getElementById('timezoneSelect')?.addEventListener('change', (e) => {
      const timezone = e.target.value;
      localStorage.setItem('zendea-timezone', timezone);
      this.applyTimezone(timezone);
      this.showToast(`Timezone updated`, 'info');
    });

    document.getElementById('imageQuality')?.addEventListener('change', (e) => {
      const quality = e.target.value;
      localStorage.setItem('zendea-image-quality', quality);
      this.applyImageQuality(quality);
      this.showToast(`Image quality set to ${quality}`, 'info');
    });

    // Account management buttons
    document.getElementById('updateProfileBtn')?.addEventListener('click', () => {
      this.showToast('Profile update feature coming soon!', 'info');
      if (localStorage.getItem('zendea-sound-effects') === 'true') {
        this.playSound('click');
      }
    });

    document.getElementById('exportDataBtn')?.addEventListener('click', () => {
      this.exportUserData();
      if (localStorage.getItem('zendea-sound-effects') === 'true') {
        this.playSound('success');
      }
    });

    document.getElementById('clearCacheBtn')?.addEventListener('click', () => {
      this.clearCache();
      if (localStorage.getItem('zendea-sound-effects') === 'true') {
        this.playSound('success');
      }
    });

    document.getElementById('backupDataBtn')?.addEventListener('click', () => {
      this.backupUserData();
      if (localStorage.getItem('zendea-sound-effects') === 'true') {
        this.playSound('success');
      }
    });

    document.getElementById('deleteAccountBtn')?.addEventListener('click', () => {
      this.confirmDeleteAccount();
    });

    // Password and security buttons
    document.getElementById('changePasswordBtn')?.addEventListener('click', () => {
      this.showToast('Password change feature coming soon!', 'info');
      if (localStorage.getItem('zendea-sound-effects') === 'true') {
        this.playSound('click');
      }
    });

    document.getElementById('twoFactorBtn')?.addEventListener('click', () => {
      this.showToast('Two-factor authentication coming soon!', 'info');
      if (localStorage.getItem('zendea-sound-effects') === 'true') {
        this.playSound('click');
      }
    });

    // Support buttons
    document.getElementById('helpCenterBtn')?.addEventListener('click', () => {
      window.open('https://help.zendea.com', '_blank');
      if (localStorage.getItem('zendea-sound-effects') === 'true') {
        this.playSound('click');
      }
    });

    document.getElementById('contactSupportBtn')?.addEventListener('click', () => {
      window.open('mailto:philipkilonzoke@gmail.com?subject=Zendea Support Request', '_blank');
      if (localStorage.getItem('zendea-sound-effects') === 'true') {
        this.playSound('click');
      }
    });

    document.getElementById('termsOfServiceBtn')?.addEventListener('click', () => {
      window.open('https://zendea.com/terms', '_blank');
      if (localStorage.getItem('zendea-sound-effects') === 'true') {
        this.playSound('click');
      }
    });

    document.getElementById('privacyPolicyBtn')?.addEventListener('click', () => {
      window.open('https://zendea.com/privacy', '_blank');
      if (localStorage.getItem('zendea-sound-effects') === 'true') {
        this.playSound('click');
      }
    });

    // Settings actions
    document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
      this.saveAllSettings();
      if (localStorage.getItem('zendea-sound-effects') === 'true') {
        this.playSound('success');
      }
    });

    document.getElementById('resetSettingsBtn')?.addEventListener('click', () => {
      this.resetAllSettings();
    });
  }

  // ============================================ //
  // 🔊 SOUND EFFECTS SYSTEM
  // ============================================ //

  playSound(type) {
    if (localStorage.getItem('zendea-sound-effects') !== 'true') return;
    
    try {
      // Create audio context for sound generation
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different sounds for different actions
      const sounds = {
        toggle: { frequency: 800, duration: 0.1 },
        click: { frequency: 600, duration: 0.05 },
        success: { frequency: 523, duration: 0.2 }, // C note
        error: { frequency: 300, duration: 0.3 },
        notification: { frequency: 1000, duration: 0.15 }
      };
      
      const sound = sounds[type] || sounds.click;
      
      oscillator.frequency.setValueAtTime(sound.frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + sound.duration);
      
    } catch (error) {
      console.log('Sound not supported in this browser');
    }
  }

  // ============================================ //
  // 🌍 LANGUAGE SYSTEM
  // ============================================ //

  applyLanguage(languageCode) {
    const translations = {
      en: {
        'welcome': 'Welcome to Zendea',
        'jobs': 'Jobs',
        'deals': 'Deals',
        'favorites': 'Favorites',
        'messages': 'Messages',
        'feedback': 'Feedback',
        'settings': 'Settings',
        'home': 'Home'
      },
      sw: {
        'welcome': 'Karibu Zendea',
        'jobs': 'Kazi',
        'deals': 'Punguzo',
        'favorites': 'Pendekezo',
        'messages': 'Ujumbe',
        'feedback': 'Maoni',
        'settings': 'Mipangilio',
        'home': 'Nyumbani'
      },
      fr: {
        'welcome': 'Bienvenue à Zendea',
        'jobs': 'Emplois',
        'deals': 'Offres',
        'favorites': 'Favoris',
        'messages': 'Messages',
        'feedback': 'Commentaires',
        'settings': 'Paramètres',
        'home': 'Accueil'
      },
      es: {
        'welcome': 'Bienvenido a Zendea',
        'jobs': 'Trabajos',
        'deals': 'Ofertas',
        'favorites': 'Favoritos',
        'messages': 'Mensajes',
        'feedback': 'Comentarios',
        'settings': 'Configuración',
        'home': 'Inicio'
      },
      ar: {
        'welcome': 'مرحباً بك في زينديا',
        'jobs': 'وظائف',
        'deals': 'عروض',
        'favorites': 'المفضلة',
        'messages': 'الرسائل',
        'feedback': 'التعليقات',
        'settings': 'الإعدادات',
        'home': 'الرئيسية'
      }
    };

    const translation = translations[languageCode] || translations.en;
    
    // Update navigation items
    document.querySelectorAll('[data-translate]').forEach(element => {
      const key = element.getAttribute('data-translate');
      if (translation[key]) {
        element.textContent = translation[key];
      }
    });

    // Update document language
    document.documentElement.lang = languageCode;
    
    // Apply RTL for Arabic
    if (languageCode === 'ar') {
      document.documentElement.dir = 'rtl';
      document.body.classList.add('rtl');
    } else {
      document.documentElement.dir = 'ltr';
      document.body.classList.remove('rtl');
    }
  }

  getLanguageName(code) {
    const names = {
      en: 'English',
      sw: 'Kiswahili',
      fr: 'Français',
      es: 'Español',
      ar: 'العربية'
    };
    return names[code] || 'Unknown';
  }

  getCountryName(code) {
    const names = {
      KE: 'Kenya',
      TZ: 'Tanzania',
      UG: 'Uganda',
      RW: 'Rwanda',
      ET: 'Ethiopia'
    };
    return names[code] || 'Unknown';
  }

  // ============================================ //
  // 📱 OFFLINE MODE & AUTO SYNC
  // ============================================ //

  enableOfflineMode() {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then(() => {
            console.log('✅ Service Worker registered for offline mode');
            document.body.classList.add('offline-mode');
          })
          .catch(error => {
            console.error('❌ Service Worker registration failed:', error);
          });
      }
    } catch (error) {
      console.error('❌ Error enabling offline mode:', error);
    }
  }

  disableOfflineMode() {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.unregister();
          });
        });
      }
      document.body.classList.remove('offline-mode');
      console.log('✅ Offline mode disabled');
    } catch (error) {
      console.error('❌ Error disabling offline mode:', error);
    }
  }

  startAutoSync() {
    // Simple auto-sync simulation
    this.autoSyncInterval = setInterval(() => {
      if (navigator.onLine && window.firebaseService) {
        console.log('🔄 Auto-syncing data...');
        // In a real app, this would sync local data with Firebase
      }
    }, 30000); // Every 30 seconds
  }

  stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
  }

  // ============================================ //
  // ♿ ACCESSIBILITY ENHANCEMENTS
  // ============================================ //

  enhanceAccessibility() {
    // Add ARIA labels and improve accessibility
    document.querySelectorAll('button').forEach(button => {
      if (!button.getAttribute('aria-label') && button.textContent) {
        button.setAttribute('aria-label', button.textContent.trim());
      }
    });

    // Add focus indicators
    document.body.classList.add('enhanced-focus');
    
    // Add skip links
    this.addSkipLinks();
  }

  reduceAccessibility() {
    document.body.classList.remove('enhanced-focus');
    document.querySelectorAll('.skip-link').forEach(link => link.remove());
  }

  addSkipLinks() {
    if (document.querySelector('.skip-link')) return;
    
    const skipLink = document.createElement('a');
    skipLink.href = '#main';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--color-primary);
      color: white;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 10000;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // ============================================ //
  // 🎨 IMAGE QUALITY & PERFORMANCE
  // ============================================ //

  applyImageQuality(quality) {
    const qualitySettings = {
      high: { compression: 0.9, maxWidth: 1920 },
      medium: { compression: 0.7, maxWidth: 1280 },
      low: { compression: 0.5, maxWidth: 640 }
    };
    
    const setting = qualitySettings[quality];
    document.documentElement.style.setProperty('--image-compression', setting.compression);
    document.documentElement.style.setProperty('--image-max-width', `${setting.maxWidth}px`);
    
    // Apply to existing images
    document.querySelectorAll('img').forEach(img => {
      img.style.maxWidth = `${setting.maxWidth}px`;
      img.style.height = 'auto';
    });
  }

  applyCurrencyFormat(currency) {
    // Store for future price formatting
    window.ZENDEA_CURRENCY = currency;
    
    // Update any existing price displays
    document.querySelectorAll('[data-price]').forEach(element => {
      const price = element.getAttribute('data-price');
      element.textContent = this.formatPrice(price, currency);
    });
  }

  applyCountrySettings(country) {
    // Apply country-specific settings
    document.documentElement.setAttribute('data-country', country);
  }

  applyTimezone(timezone) {
    // Store timezone for date formatting
    window.ZENDEA_TIMEZONE = timezone;
    
    // Update any existing timestamps
    document.querySelectorAll('[data-timestamp]').forEach(element => {
      const timestamp = element.getAttribute('data-timestamp');
      element.textContent = this.formatDate(new Date(timestamp), timezone);
    });
  }

  formatPrice(price, currency = 'KES') {
    const symbols = {
      KES: 'KSh ',
      USD: '$',
      EUR: '€',
      GBP: '£'
    };
    
    return `${symbols[currency] || ''}${parseFloat(price).toLocaleString()}`;
  }

  formatDate(date, timezone = 'Africa/Nairobi') {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return date.toLocaleDateString();
    }
  }

  updateStorageInfo() {
    try {
      // Calculate approximate storage usage
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }

      const cacheSize = Math.round(totalSize * 0.3 / 1024 * 100) / 100; // Approximation
      const localDataSize = Math.round(totalSize / 1024 * 100) / 100;
      const totalStorage = cacheSize + localDataSize;

      document.getElementById('cacheSize').textContent = `${cacheSize} KB`;
      document.getElementById('localDataSize').textContent = `${localDataSize} KB`;
      document.getElementById('totalStorage').textContent = `${totalStorage} KB`;
    } catch (error) {
      console.error('❌ Error updating storage info:', error);
    }
  }

  exportUserData() {
    try {
      const userData = {
        theme: localStorage.getItem('zendea-theme'),
        preferences: {},
        posts: [], // Would be fetched from Firebase
        messages: [], // Would be fetched from Firebase
        favorites: [], // Would be fetched from Firebase
        exportDate: new Date().toISOString()
      };

      // Collect all settings
      for (let key in localStorage) {
        if (key.startsWith('zendea-')) {
          userData.preferences[key] = localStorage.getItem(key);
        }
      }

      const dataBlob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `zendea-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showToast('Data exported successfully! 📥', 'success');
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      this.showToast('Failed to export data', 'error');
    }
  }

  clearCache() {
    try {
      // Clear specific cache items
      const cacheKeys = ['zendea-cache', 'zendea-temp-data'];
      cacheKeys.forEach(key => localStorage.removeItem(key));
      
      // Clear service worker cache if available
      if ('serviceWorker' in navigator && 'caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            if (cacheName.includes('zendea')) {
              caches.delete(cacheName);
            }
          });
        });
      }

      this.updateStorageInfo();
      this.showToast('Cache cleared successfully! 🧹', 'success');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
      this.showToast('Failed to clear cache', 'error');
    }
  }

  backupUserData() {
    try {
      const backupData = {
        settings: {},
        timestamp: new Date().toISOString(),
        version: '2.1.0'
      };

      // Collect all settings
      for (let key in localStorage) {
        if (key.startsWith('zendea-')) {
          backupData.settings[key] = localStorage.getItem(key);
        }
      }

      localStorage.setItem('zendea-backup', JSON.stringify(backupData));
      this.showToast('Settings backed up successfully! ☁️', 'success');
    } catch (error) {
      console.error('❌ Error backing up data:', error);
      this.showToast('Failed to backup data', 'error');
    }
  }

  confirmDeleteAccount() {
    const isConfirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone.\n\n' +
      'All your posts, messages, and data will be permanently deleted.'
    );

    if (isConfirmed) {
      const finalConfirm = prompt(
        'Type "DELETE MY ACCOUNT" to confirm account deletion:'
      );

      if (finalConfirm === 'DELETE MY ACCOUNT') {
        this.deleteAccount();
      } else {
        this.showToast('Account deletion cancelled', 'info');
      }
    }
  }

  async deleteAccount() {
    try {
      if (window.firebaseService && window.firebaseService.isAuthenticated()) {
        // In a real implementation, this would call Firebase Auth deleteUser()
        this.showToast('Account deletion feature will be implemented soon', 'warning');
      } else {
        this.showToast('Please log in to delete your account', 'warning');
      }
    } catch (error) {
      console.error('❌ Error deleting account:', error);
      this.showToast('Failed to delete account', 'error');
    }
  }

  saveAllSettings() {
    try {
      // All settings are already saved as they're changed
      // This button provides user feedback
      this.showToast('All settings saved successfully! 💾', 'success');
      
      // Track analytics
      if (window.firebaseService && window.firebaseService.isAuthenticated()) {
        window.firebaseService.trackAnalytics('settings_saved', {
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      this.showToast('Failed to save settings', 'error');
    }
  }

  resetAllSettings() {
    const isConfirmed = confirm(
      'Are you sure you want to reset all settings to default?\n\n' +
      'This will clear all your preferences and cannot be undone.'
    );

    if (isConfirmed) {
      try {
        // Clear all Zendea settings from localStorage
        const keysToRemove = [];
        for (let key in localStorage) {
          if (key.startsWith('zendea-')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Reset to default theme
        document.documentElement.setAttribute('data-theme', 'light');

        // Reset CSS properties
        document.documentElement.style.removeProperty('--font-size-base');
        document.documentElement.style.removeProperty('--animation-duration-fast');
        document.documentElement.style.removeProperty('--animation-duration-base');
        document.documentElement.style.removeProperty('--animation-duration-slow');
        document.documentElement.classList.remove('high-contrast');

        // Reload settings
        this.loadSavedSettings();
        this.initializeThemeGrid();

        this.showToast('Settings reset to defaults successfully! 🔄', 'success');
        
        // Track analytics
        if (window.firebaseService && window.firebaseService.isAuthenticated()) {
          window.firebaseService.trackAnalytics('settings_reset', {
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('❌ Error resetting settings:', error);
        this.showToast('Failed to reset settings', 'error');
      }
    }
  }
}

// ============================================ //
// 🚀 APP INITIALIZATION
// ============================================ //

// Global app instance
window.zendeaApp = new ZendeaApp();

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.zendeaApp.init().catch(console.error);
  });
} else {
  // DOM already loaded
  window.zendeaApp.init().catch(console.error);
}