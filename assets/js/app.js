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
      feedback: 'Feedback'
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