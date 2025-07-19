// ===================================
// 🔐 ZENDEA - AUTHENTICATION SCRIPT
// ===================================

// 🎭 Import common functions
// Note: In a real app, you'd import these or have them globally available

// 🌙 Theme toggle functionality (reused from app.js)
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

// 🔄 Tab Switching
function initTabSwitching() {
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  
  if (!loginTab || !signupTab || !loginForm || !signupForm) return;
  
  function switchToLogin() {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    
    // Clear signup form
    signupForm.reset();
  }
  
  function switchToSignup() {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    
    // Clear login form
    loginForm.reset();
  }
  
  loginTab.addEventListener('click', switchToLogin);
  signupTab.addEventListener('click', switchToSignup);
  
  // Handle URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mode') === 'signup') {
    switchToSignup();
  }
}

// 👁️ Password Visibility Toggle
function initPasswordToggle() {
  const toggleButtons = document.querySelectorAll('.password-toggle');
  
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const passwordInput = button.parentElement.querySelector('input[type="password"], input[type="text"]');
      const icon = button.querySelector('i');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.className = 'fas fa-eye-slash';
      } else {
        passwordInput.type = 'password';
        icon.className = 'fas fa-eye';
      }
    });
  });
}

// ✅ Form Validation
function initFormValidation() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
  
  // Real-time validation
  const inputs = document.querySelectorAll('.form-input');
  inputs.forEach(input => {
    input.addEventListener('blur', validateField);
    input.addEventListener('input', clearFieldError);
  });
}

function validateField(e) {
  const field = e.target;
  const value = field.value.trim();
  const fieldName = field.id;
  
  clearFieldError(e);
  
  let errorMessage = '';
  
  switch (fieldName) {
    case 'loginEmail':
    case 'signupEmail':
      if (!value) {
        errorMessage = 'Email is required';
      } else if (!isValidEmail(value)) {
        errorMessage = 'Please enter a valid email address';
      }
      break;
      
    case 'loginPassword':
      if (!value) {
        errorMessage = 'Password is required';
      }
      break;
      
    case 'signupPassword':
      if (!value) {
        errorMessage = 'Password is required';
      } else if (value.length < 6) {
        errorMessage = 'Password must be at least 6 characters long';
      }
      break;
      
    case 'confirmPassword':
      const signupPassword = document.getElementById('signupPassword').value;
      if (!value) {
        errorMessage = 'Please confirm your password';
      } else if (value !== signupPassword) {
        errorMessage = 'Passwords do not match';
      }
      break;
      
    case 'signupName':
      if (!value) {
        errorMessage = 'Name is required';
      } else if (value.length < 2) {
        errorMessage = 'Name must be at least 2 characters long';
      }
      break;
  }
  
  if (errorMessage) {
    showFieldError(field, errorMessage);
  }
}

function clearFieldError(e) {
  const field = e.target;
  const existingError = field.parentElement.querySelector('.form-error');
  if (existingError) {
    existingError.remove();
  }
  field.style.borderColor = '';
}

function showFieldError(field, message) {
  clearFieldError({ target: field });
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'form-error';
  errorDiv.textContent = message;
  
  field.style.borderColor = 'var(--color-error)';
  field.parentElement.appendChild(errorDiv);
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 🔐 Login Handler
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const rememberMe = document.getElementById('rememberMe').checked;
  const loginBtn = document.getElementById('loginBtn');
  
  // Validate required fields
  if (!email || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }
  
  if (!isValidEmail(email)) {
    showToast('Please enter a valid email address', 'error');
    return;
  }
  
  // Show loading state
  loginBtn.classList.add('loading');
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
  
  try {
    // Simulate API call
    await simulateAuth('login', { email, password, rememberMe });
    
    showToast('Welcome back! Redirecting...', 'success');
    
    // Redirect after success
    setTimeout(() => {
      const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || 'index.html';
      window.location.href = returnUrl;
    }, 1500);
    
  } catch (error) {
    showToast(error.message || 'Login failed. Please try again.', 'error');
  } finally {
    // Reset button state
    loginBtn.classList.remove('loading');
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
  }
}

// 📝 Signup Handler
async function handleSignup(e) {
  e.preventDefault();
  
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const agreeTerms = document.getElementById('agreeTerms').checked;
  const signupBtn = document.getElementById('signupBtn');
  
  // Validate required fields
  if (!name || !email || !password || !confirmPassword) {
    showToast('Please fill in all fields', 'error');
    return;
  }
  
  if (!isValidEmail(email)) {
    showToast('Please enter a valid email address', 'error');
    return;
  }
  
  if (password.length < 6) {
    showToast('Password must be at least 6 characters long', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }
  
  if (!agreeTerms) {
    showToast('Please agree to the Terms of Service and Privacy Policy', 'error');
    return;
  }
  
  // Show loading state
  signupBtn.classList.add('loading');
  signupBtn.disabled = true;
  signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
  
  try {
    // Simulate API call
    await simulateAuth('signup', { name, email, password });
    
    showToast('Account created successfully! Redirecting...', 'success');
    
    // Redirect after success
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
    
  } catch (error) {
    showToast(error.message || 'Signup failed. Please try again.', 'error');
  } finally {
    // Reset button state
    signupBtn.classList.remove('loading');
    signupBtn.disabled = false;
    signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
  }
}

// 🌐 Social Login Handlers
function initSocialLogin() {
  const googleBtn = document.getElementById('googleLogin');
  const githubBtn = document.getElementById('githubLogin');
  
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      showToast('Google login coming soon!', 'info');
    });
  }
  
  if (githubBtn) {
    githubBtn.addEventListener('click', () => {
      showToast('GitHub login coming soon!', 'info');
    });
  }
}

// 🎭 Simulate Authentication (replace with real Firebase)
async function simulateAuth(type, data) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate random success/failure for demo
  if (Math.random() < 0.8) { // 80% success rate for demo
    // Simulate successful auth
    const user = {
      id: 'demo-user-' + Date.now(),
      name: data.name || 'Demo User',
      email: data.email,
      createdAt: new Date().toISOString()
    };
    
    // Store user data (in real app, this would be handled by Firebase)
    localStorage.setItem('zendea-user', JSON.stringify(user));
    
    return user;
  } else {
    // Simulate error
    const errorMessages = [
      'Invalid email or password',
      'Email already exists',
      'Network error. Please try again.',
      'Account temporarily locked'
    ];
    throw new Error(errorMessages[Math.floor(Math.random() * errorMessages.length)]);
  }
}

// 📱 Responsive Form Adjustments
function initResponsiveFeatures() {
  // Auto-focus first input on larger screens
  if (window.innerWidth > 768) {
    const firstInput = document.querySelector('.form-input');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 500);
    }
  }
  
  // Handle mobile keyboard
  if (/Mobi|Android/i.test(navigator.userAgent)) {
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        setTimeout(() => {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      });
    });
  }
}

// 🔗 Navigation
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

// 🚀 Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔐 Auth page loading...');
  
  // Initialize all features
  initThemeToggle();
  initTabSwitching();
  initPasswordToggle();
  initFormValidation();
  initSocialLogin();
  initResponsiveFeatures();
  initNavigation();
  
  // Show welcome message
  setTimeout(() => {
    showToast('Welcome to Zendea! Please sign in or create an account.', 'info', 4000);
  }, 1000);
  
  console.log('✨ Auth page ready!');
});

// 🌐 Global error handler
window.addEventListener('error', (e) => {
  console.error('Auth Error:', e.error);
  showToast('Something went wrong. Please refresh and try again.', 'error');
});

// 📱 Handle browser back button
window.addEventListener('beforeunload', () => {
  // Clear any sensitive data if needed
  const sensitiveInputs = document.querySelectorAll('input[type="password"]');
  sensitiveInputs.forEach(input => input.value = '');
});
