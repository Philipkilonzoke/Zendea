// ===================================
// 👤 ZENDEA - PROFILE MANAGEMENT SCRIPT
// ===================================

// 🌙 Theme toggle functionality (reused)
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

// 🔔 Toast notification function
function showToast(message, type = 'info', duration = 5000) {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    console.log(`Toast: ${type} - ${message}`);
    return;
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const iconMap = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };
  
  toast.innerHTML = `
    <i class="toast-icon ${iconMap[type]}"></i>
    <div class="toast-message">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

// 👤 User Profile Management
function initUserProfile() {
  loadUserProfile();
  initEditProfile();
  initLogout();
}

function loadUserProfile() {
  // In a real app, this would load from Firebase Auth
  const user = JSON.parse(localStorage.getItem('zendea-user') || '{}');
  
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const userName = document.getElementById('userName');
  
  if (profileName) {
    profileName.textContent = user.name || 'Demo User';
  }
  
  if (profileEmail) {
    profileEmail.textContent = user.email || 'demo@zendea.com';
  }
  
  if (userName) {
    userName.textContent = user.name || 'Demo User';
  }
}

function initEditProfile() {
  const editProfileBtn = document.getElementById('editProfileBtn');
  const editProfileModal = document.getElementById('editProfileModal');
  const closeEditModal = document.getElementById('closeEditModal');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const editProfileForm = document.getElementById('editProfileForm');
  
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      openEditProfileModal();
    });
  }
  
  if (closeEditModal) {
    closeEditModal.addEventListener('click', () => {
      closeModal(editProfileModal);
    });
  }
  
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      closeModal(editProfileModal);
    });
  }
  
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', handleProfileUpdate);
  }
  
  // Close modal on backdrop click
  if (editProfileModal) {
    editProfileModal.addEventListener('click', (e) => {
      if (e.target === editProfileModal) {
        closeModal(editProfileModal);
      }
    });
  }
}

function openEditProfileModal() {
  const editProfileModal = document.getElementById('editProfileModal');
  const user = JSON.parse(localStorage.getItem('zendea-user') || '{}');
  
  // Pre-fill form with current user data
  document.getElementById('editName').value = user.name || '';
  document.getElementById('editBio').value = user.bio || '';
  document.getElementById('editLocation').value = user.location || '';
  document.getElementById('editWebsite').value = user.website || '';
  
  editProfileModal.classList.remove('hidden');
  
  // Focus first input
  setTimeout(() => {
    document.getElementById('editName').focus();
  }, 100);
}

function closeModal(modal) {
  if (modal) {
    modal.classList.add('hidden');
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('editName').value.trim(),
    bio: document.getElementById('editBio').value.trim(),
    location: document.getElementById('editLocation').value.trim(),
    website: document.getElementById('editWebsite').value.trim()
  };
  
  if (!formData.name) {
    showToast('Name is required', 'error');
    return;
  }
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  // Show loading state
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  submitBtn.disabled = true;
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update user data in localStorage
    const user = JSON.parse(localStorage.getItem('zendea-user') || '{}');
    Object.assign(user, formData);
    localStorage.setItem('zendea-user', JSON.stringify(user));
    
    // Update UI
    loadUserProfile();
    
    showToast('Profile updated successfully!', 'success');
    closeModal(document.getElementById('editProfileModal'));
    
  } catch (error) {
    showToast('Failed to update profile. Please try again.', 'error');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

function initLogout() {
  const logoutLink = document.getElementById('logoutLink');
  
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (confirm('Are you sure you want to logout?')) {
        // Clear user data
        localStorage.removeItem('zendea-user');
        
        showToast('Logged out successfully', 'success');
        
        // Redirect to homepage
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      }
    });
  }
}

// 📝 Posts Management
function initPostsManagement() {
  loadUserPosts();
  initPostSearch();
  initPostFilters();
  initQuickActions();
}

function loadUserPosts() {
  const postsGrid = document.getElementById('my-posts');
  const emptyState = document.getElementById('emptyState');
  
  if (!postsGrid) return;
  
  // Simulate loading user posts
  setTimeout(() => {
    // Clear loading state
    postsGrid.innerHTML = '';
    
    // Generate sample posts
    const samplePosts = generateSampleUserPosts();
    
    if (samplePosts.length === 0) {
      // Show empty state
      if (emptyState) {
        emptyState.classList.remove('hidden');
      }
    } else {
      // Hide empty state
      if (emptyState) {
        emptyState.classList.add('hidden');
      }
      
      // Render posts
      samplePosts.forEach(post => {
        const postCard = createPostCard(post);
        postsGrid.appendChild(postCard);
      });
      
      // Update stats
      updateProfileStats(samplePosts);
    }
  }, 1000);
}

function generateSampleUserPosts() {
  return [
    {
      id: 'post-1',
      type: 'job',
      title: 'Senior React Developer',
      description: 'Looking for an experienced React developer to join our growing team...',
      location: 'San Francisco, CA',
      price: '$120,000',
      priceType: 'yearly',
      createdAt: '2024-01-15',
      views: 156,
      status: 'active'
    },
    {
      id: 'post-2',
      type: 'deal',
      title: 'MacBook Pro M3 - 20% Off',
      description: 'Get amazing discount on the latest MacBook Pro with M3 chip...',
      location: 'Online',
      price: '$1,999',
      priceType: 'fixed',
      createdAt: '2024-01-12',
      views: 89,
      status: 'active'
    },
    {
      id: 'post-3',
      type: 'job',
      title: 'UX Designer - Remote',
      description: 'We are seeking a talented UX designer to create amazing user experiences...',
      location: 'Remote',
      price: '$85,000',
      priceType: 'yearly',
      createdAt: '2024-01-10',
      views: 203,
      status: 'active'
    }
  ];
}

function createPostCard(post) {
  const card = document.createElement('div');
  card.className = 'post-card';
  card.setAttribute('data-post-id', post.id);
  card.setAttribute('data-post-type', post.type);
  card.setAttribute('data-post-status', post.status);
  
  const createdDate = new Date(post.createdAt).toLocaleDateString();
  
  card.innerHTML = `
    <div class="post-card-header">
      <span class="post-type ${post.type}">${post.type}</span>
      <div class="post-actions">
        <button class="btn-icon" onclick="viewPost('${post.id}')" title="View">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn-icon" onclick="editPost('${post.id}')" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-icon" onclick="deletePost('${post.id}')" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
    <h3 class="post-title">${post.title}</h3>
    <p class="post-description">${post.description}</p>
    <div class="post-meta">
      <span class="meta-item">
        <i class="fas fa-calendar"></i>
        ${createdDate}
      </span>
      <span class="meta-item">
        <i class="fas fa-eye"></i>
        ${post.views} views
      </span>
      <span class="meta-item">
        <i class="fas fa-map-marker-alt"></i>
        ${post.location}
      </span>
    </div>
    <div class="post-price">${post.price}</div>
  `;
  
  return card;
}

function updateProfileStats(posts) {
  const totalPosts = document.getElementById('totalPosts');
  const activePosts = document.getElementById('activePosts');
  const totalViews = document.getElementById('totalViews');
  
  const activeCount = posts.filter(p => p.status === 'active').length;
  const viewsCount = posts.reduce((sum, p) => sum + p.views, 0);
  
  if (totalPosts) {
    totalPosts.textContent = posts.length;
  }
  
  if (activePosts) {
    activePosts.textContent = activeCount;
  }
  
  if (totalViews) {
    totalViews.textContent = viewsCount;
  }
}

function initPostSearch() {
  const postSearch = document.getElementById('postSearch');
  
  if (postSearch) {
    let searchTimeout;
    
    postSearch.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim().toLowerCase();
      
      searchTimeout = setTimeout(() => {
        filterPosts();
      }, 300);
    });
  }
}

function initPostFilters() {
  const postFilter = document.getElementById('postFilter');
  const postSort = document.getElementById('postSort');
  
  if (postFilter) {
    postFilter.addEventListener('change', filterPosts);
  }
  
  if (postSort) {
    postSort.addEventListener('change', filterPosts);
  }
}

function filterPosts() {
  const searchQuery = document.getElementById('postSearch').value.trim().toLowerCase();
  const filterType = document.getElementById('postFilter').value;
  const sortType = document.getElementById('postSort').value;
  
  const postCards = document.querySelectorAll('.post-card');
  const visibleCards = [];
  
  postCards.forEach(card => {
    const title = card.querySelector('.post-title').textContent.toLowerCase();
    const description = card.querySelector('.post-description').textContent.toLowerCase();
    const postType = card.getAttribute('data-post-type');
    const postStatus = card.getAttribute('data-post-status');
    
    // Search filter
    const matchesSearch = !searchQuery || 
      title.includes(searchQuery) || 
      description.includes(searchQuery);
    
    // Type filter
    let matchesFilter = true;
    if (filterType !== 'all') {
      if (filterType === 'job' || filterType === 'deal') {
        matchesFilter = postType === filterType;
      } else if (filterType === 'active' || filterType === 'inactive') {
        matchesFilter = postStatus === filterType;
      }
    }
    
    if (matchesSearch && matchesFilter) {
      card.style.display = 'block';
      visibleCards.push(card);
    } else {
      card.style.display = 'none';
    }
  });
  
  // Sort visible cards
  sortPosts(visibleCards, sortType);
  
  // Show/hide empty state
  const emptyState = document.getElementById('emptyState');
  if (visibleCards.length === 0 && postCards.length > 0) {
    if (emptyState) {
      emptyState.innerHTML = `
        <div class="empty-icon">
          <i class="fas fa-search"></i>
        </div>
        <h3>No posts found</h3>
        <p>Try adjusting your search or filter criteria.</p>
      `;
      emptyState.classList.remove('hidden');
    }
  } else {
    if (emptyState) {
      emptyState.classList.add('hidden');
    }
  }
}

function sortPosts(cards, sortType) {
  const postsGrid = document.getElementById('my-posts');
  
  cards.sort((a, b) => {
    const aTitle = a.querySelector('.post-title').textContent;
    const bTitle = b.querySelector('.post-title').textContent;
    const aViews = parseInt(a.querySelector('.meta-item:nth-child(2)').textContent);
    const bViews = parseInt(b.querySelector('.meta-item:nth-child(2)').textContent);
    
    switch (sortType) {
      case 'title':
        return aTitle.localeCompare(bTitle);
      case 'views':
        return bViews - aViews;
      case 'oldest':
        return a.getAttribute('data-post-id').localeCompare(b.getAttribute('data-post-id'));
      case 'newest':
      default:
        return b.getAttribute('data-post-id').localeCompare(a.getAttribute('data-post-id'));
    }
  });
  
  // Re-append cards in sorted order
  cards.forEach(card => {
    postsGrid.appendChild(card);
  });
}

function initQuickActions() {
  const importPostBtn = document.getElementById('importPostBtn');
  const analyticsBtn = document.getElementById('analyticsBtn');
  
  if (importPostBtn) {
    importPostBtn.addEventListener('click', () => {
      showToast('Import feature coming soon!', 'info');
    });
  }
  
  if (analyticsBtn) {
    analyticsBtn.addEventListener('click', () => {
      showToast('Analytics feature coming soon!', 'info');
    });
  }
}

// 🎬 Post Actions
function viewPost(postId) {
  showToast(`Viewing post ${postId}`, 'info');
  // In a real app, this would navigate to the post detail page
}

function editPost(postId) {
  showToast(`Editing post ${postId}`, 'info');
  // In a real app, this would navigate to the edit form
  // window.location.href = `post.html?edit=${postId}`;
}

function deletePost(postId) {
  if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
    const postCard = document.querySelector(`[data-post-id="${postId}"]`);
    
    if (postCard) {
      // Animate out
      postCard.style.opacity = '0';
      postCard.style.transform = 'translateX(100%)';
      
      setTimeout(() => {
        postCard.remove();
        
        // Check if no posts left
        const remainingPosts = document.querySelectorAll('.post-card');
        if (remainingPosts.length === 0) {
          const emptyState = document.getElementById('emptyState');
          if (emptyState) {
            emptyState.innerHTML = `
              <div class="empty-icon">
                <i class="fas fa-inbox"></i>
              </div>
              <h3>No Posts Yet</h3>
              <p>Start by creating your first post to share opportunities with the community.</p>
              <a href="post.html" class="btn btn-primary">
                <i class="fas fa-plus"></i>
                Create Your First Post
              </a>
            `;
            emptyState.classList.remove('hidden');
          }
        }
        
        showToast('Post deleted successfully', 'success');
      }, 300);
    }
  }
}

// 🔗 Navigation
function initNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (href === 'profile.html' && currentPage === 'profile.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// 🚀 Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
  console.log('👤 Profile page loading...');
  
  // Check if user is logged in
  const user = localStorage.getItem('zendea-user');
  if (!user) {
    // Redirect to login if not authenticated
    window.location.href = 'login.html?returnUrl=' + encodeURIComponent(window.location.href);
    return;
  }
  
  // Initialize all features
  initThemeToggle();
  initUserProfile();
  initPostsManagement();
  initNavigation();
  
  console.log('✨ Profile page ready!');
  
  // Show welcome message
  setTimeout(() => {
    const userData = JSON.parse(user);
    showToast(`Welcome back, ${userData.name || 'User'}! 👋`, 'success', 3000);
  }, 1000);
});

// 🌐 Global error handler
window.addEventListener('error', (e) => {
  console.error('Profile Error:', e.error);
  showToast('Something went wrong. Please refresh the page.', 'error');
});

// 📱 Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Escape key to close modals
  if (e.key === 'Escape') {
    const openModal = document.querySelector('.modal-overlay:not(.hidden)');
    if (openModal) {
      closeModal(openModal);
    }
  }
  
  // Ctrl/Cmd + N to create new post
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    window.location.href = 'post.html';
  }
});

// Make functions globally available for onclick handlers
window.viewPost = viewPost;
window.editPost = editPost;
window.deletePost = deletePost;
