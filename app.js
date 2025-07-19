// ===================================
// 🚀 ZENDEA - MAIN APPLICATION SCRIPT
// ===================================

// 🎬 Splash Screen Management
function initSplashScreen() {
  const splashScreen = document.getElementById('splashScreen');
  if (splashScreen) {
    // Auto-hide splash screen after 2 seconds
    setTimeout(() => {
      splashScreen.style.opacity = '0';
      setTimeout(() => {
        splashScreen.style.display = 'none';
      }, 300);
    }, 2000);
  }
}

// 🌙 Theme Management
function initThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  
  // Get saved theme or default to light
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
    
    // Update toggle icon
    if (themeToggle) {
      const icon = themeToggle.querySelector('i');
      if (icon) {
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
      }
    }
  }
}

// 🎪 Welcome Screen Management
function initWelcomeScreen() {
  const welcomeOverlay = document.getElementById('welcomeOverlay');
  const continueAsGuestBtn = document.getElementById('continueAsGuest');
  
  if (!welcomeOverlay) return;
  
  // Check if user is logged in or has dismissed welcome
  const hasSeenWelcome = localStorage.getItem('zendea-welcome-seen');
  const isLoggedIn = checkAuthStatus(); // You would implement this based on your auth system
  
  if (!hasSeenWelcome && !isLoggedIn) {
    // Show welcome screen after splash
    setTimeout(() => {
      welcomeOverlay.classList.remove('hidden');
    }, 2500);
  }
  
  if (continueAsGuestBtn) {
    continueAsGuestBtn.addEventListener('click', () => {
      welcomeOverlay.classList.add('hidden');
      localStorage.setItem('zendea-welcome-seen', 'true');
    });
  }
}

// 🔔 Toast Notifications
function showToast(message, type = 'info', duration = 5000) {
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
  
  toast.innerHTML = `
    <i class="toast-icon ${iconMap[type]}"></i>
    <div class="toast-message">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  toastContainer.appendChild(toast);
  
  // Auto-remove after duration
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

// 🔍 Search Functionality
function initSearch() {
  const searchInput = document.getElementById('search');
  if (!searchInput) return;
  
  let searchTimeout;
  
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    searchTimeout = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query);
      } else {
        // Reset to show all items
        loadAllPosts();
      }
    }, 300);
  });
}

// 🔥 Mock Search Function (replace with real Firebase search)
function performSearch(query) {
  console.log(`Searching for: ${query}`);
  // This would integrate with your Firebase search
  showToast(`Searching for "${query}"...`, 'info', 2000);
}

// 📝 Load Posts Function (mock implementation)
function loadAllPosts() {
  const jobsList = document.getElementById('jobs-list');
  const dealsList = document.getElementById('deals-list');
  
  if (jobsList) {
    // Remove loading state
    jobsList.innerHTML = '';
    
    // Add sample job cards
    for (let i = 1; i <= 3; i++) {
      jobsList.appendChild(createSampleJobCard(i));
    }
  }
  
  if (dealsList) {
    // Remove loading state
    dealsList.innerHTML = '';
    
    // Add sample deal cards
    for (let i = 1; i <= 3; i++) {
      dealsList.appendChild(createSampleDealCard(i));
    }
  }
  
  // Update counts
  const jobsCount = document.getElementById('jobsCount');
  const dealsCount = document.getElementById('dealsCount');
  if (jobsCount) jobsCount.textContent = '3 jobs available';
  if (dealsCount) dealsCount.textContent = '3 deals available';
}

// 🃏 Create Sample Cards
function createSampleJobCard(index) {
  const card = document.createElement('div');
  card.className = 'card fade-in-up';
  card.innerHTML = `
    <div class="card-header">
      <span class="card-type job">Job</span>
    </div>
    <h3 class="card-title">Software Developer ${index}</h3>
    <p class="card-description">Join our amazing team and build the future of technology. We're looking for passionate developers who love to create innovative solutions.</p>
    <div class="card-meta">
      <span class="card-meta-item">
        <i class="fas fa-map-marker-alt"></i>
        San Francisco, CA
      </span>
      <span class="card-meta-item">
        <i class="fas fa-clock"></i>
        Full-time
      </span>
    </div>
    <div class="card-price">$${80 + index * 10}k - $${100 + index * 10}k</div>
    <div class="card-actions">
      <button class="btn btn-outline btn-sm">
        <i class="fas fa-heart"></i>
        Save
      </button>
      <button class="btn btn-primary btn-sm">
        <i class="fas fa-external-link-alt"></i>
        Apply
      </button>
    </div>
  `;
  
  // Add click handler for applying
  const applyBtn = card.querySelector('.btn-primary');
  applyBtn.addEventListener('click', () => {
    showToast('Application feature coming soon!', 'info');
  });
  
  return card;
}

function createSampleDealCard(index) {
  const card = document.createElement('div');
  card.className = 'card fade-in-up';
  card.innerHTML = `
    <div class="card-header">
      <span class="card-type deal">Deal</span>
    </div>
    <h3 class="card-title">Amazing Tech Deal ${index}</h3>
    <p class="card-description">Get incredible discounts on the latest technology products. Limited time offer with exclusive pricing for our community members.</p>
    <div class="card-meta">
      <span class="card-meta-item">
        <i class="fas fa-map-marker-alt"></i>
        Online
      </span>
      <span class="card-meta-item">
        <i class="fas fa-clock"></i>
        ${2 + index} days left
      </span>
    </div>
    <div class="card-price">$${99 - index * 10} <small style="text-decoration: line-through; color: var(--color-text-muted);">$${149 - index * 10}</small></div>
    <div class="card-actions">
      <button class="btn btn-outline btn-sm">
        <i class="fas fa-share"></i>
        Share
      </button>
      <button class="btn btn-secondary btn-sm">
        <i class="fas fa-shopping-cart"></i>
        Get Deal
      </button>
    </div>
  `;
  
  // Add click handler for getting deal
  const getDealBtn = card.querySelector('.btn-secondary');
  getDealBtn.addEventListener('click', () => {
    showToast('Redirecting to deal...', 'success');
  });
  
  return card;
}

// 📱 Floating Action Button
function initFAB() {
  const fab = document.getElementById('fab');
  if (!fab) return;
  
  // Show FAB when user scrolls down
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

// 🔗 Navigation Highlighting
function initNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// 🔐 Auth Status Check (mock implementation)
function checkAuthStatus() {
  // This would integrate with your Firebase Auth
  // For now, return false (not logged in)
  return false;
}

// 📊 Load More Functionality
function initLoadMore() {
  const loadMoreBtn = document.getElementById('load-more');
  if (!loadMoreBtn) return;
  
  loadMoreBtn.addEventListener('click', () => {
    loadMoreBtn.classList.add('loading');
    loadMoreBtn.disabled = true;
    
    // Simulate loading delay
    setTimeout(() => {
      // Add more cards
      const jobsList = document.getElementById('jobs-list');
      const dealsList = document.getElementById('deals-list');
      
      if (jobsList) {
        jobsList.appendChild(createSampleJobCard(4));
      }
      
      if (dealsList) {
        dealsList.appendChild(createSampleDealCard(4));
      }
      
      loadMoreBtn.classList.remove('loading');
      loadMoreBtn.disabled = false;
      
      showToast('More posts loaded!', 'success', 2000);
    }, 1500);
  });
}

// 🎯 Animation on Scroll
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
  
  // Observe all cards
  const cards = document.querySelectorAll('.card:not(.fade-in-up)');
  cards.forEach(card => observer.observe(card));
}

// 🚀 Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌟 Zendea is starting up...');
  
  // Initialize all features
  initSplashScreen();
  initThemeToggle();
  initWelcomeScreen();
  initSearch();
  initFAB();
  initNavigation();
  initLoadMore();
  initScrollAnimations();
  
  // Load initial content
  setTimeout(() => {
    loadAllPosts();
  }, 1000);
  
  console.log('✨ Zendea is ready!');
  
  // Show welcome message
  setTimeout(() => {
    showToast('Welcome to Zendea! 🌟', 'success', 3000);
  }, 3000);
});

// 🌐 Global error handler
window.addEventListener('error', (e) => {
  console.error('Error:', e.error);
  showToast('Something went wrong. Please try again.', 'error');
});

// 📱 Handle back button for welcome screen
window.addEventListener('popstate', () => {
  const welcomeOverlay = document.getElementById('welcomeOverlay');
  if (welcomeOverlay && !welcomeOverlay.classList.contains('hidden')) {
    welcomeOverlay.classList.add('hidden');
  }
});
