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

// ✅ Enhanced Form Validation
function initFormValidation() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
  
  // Real-time validation with enhanced features
  const inputs = document.querySelectorAll('.form-input');
  inputs.forEach(input => {
    input.addEventListener('blur', validateField);
    input.addEventListener('input', handleRealTimeValidation);
    input.addEventListener('focus', handleInputFocus);
  });

  // Initialize password strength meters
  initPasswordStrengthMeter();
  
  // Initialize email suggestions
  initEmailSuggestions();
  
  // Initialize tooltips
  initTooltips();
}

// 💪 Password Strength Meter
function initPasswordStrengthMeter() {
  const signupPassword = document.getElementById('signupPassword');
  const loginPassword = document.getElementById('loginPassword');
  
  if (signupPassword) {
    signupPassword.addEventListener('input', (e) => updatePasswordStrength(e.target, 'signupPasswordStrength'));
  }
  
  if (loginPassword) {
    loginPassword.addEventListener('input', (e) => updatePasswordStrength(e.target, 'loginPasswordStrength'));
  }
}

function updatePasswordStrength(input, strengthId) {
  const password = input.value;
  const strengthContainer = document.getElementById(strengthId);
  if (!strengthContainer) return;

  const requirements = analyzePassword(password);
  const strength = calculatePasswordStrength(requirements);
  
  const strengthBar = strengthContainer.querySelector('.strength-fill');
  const strengthText = strengthContainer.querySelector('.strength-text');
  
  // Show/hide strength meter based on input
  if (password.length > 0) {
    strengthContainer.classList.add('visible');
  } else {
    strengthContainer.classList.remove('visible');
  }
  
  // Update progress bar
  if (strengthBar) {
    strengthBar.style.width = `${strength.percentage}%`;
    strengthBar.className = `strength-fill ${strength.level}`;
  }
  
  // Update text
  if (strengthText) {
    strengthText.textContent = strength.text;
  }
  
  // Update requirements for signup
  if (strengthId === 'signupPasswordStrength') {
    updatePasswordRequirements(requirements);
  }
}

function analyzePassword(password) {
  return {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    totalLength: password.length
  };
}

function calculatePasswordStrength(requirements) {
  let score = 0;
  let maxScore = 5;
  
  if (requirements.length) score++;
  if (requirements.lowercase) score++;
  if (requirements.uppercase) score++;
  if (requirements.number) score++;
  if (requirements.special) score++;
  
  // Bonus for longer passwords
  if (requirements.totalLength >= 12) score += 0.5;
  if (requirements.totalLength >= 16) score += 0.5;
  
  const percentage = Math.min(100, (score / maxScore) * 100);
  
  let level, text;
  if (percentage < 40) {
    level = 'weak';
    text = 'Weak password';
  } else if (percentage < 70) {
    level = 'medium';
    text = 'Medium strength';
  } else if (percentage < 90) {
    level = 'strong';
    text = 'Strong password';
  } else {
    level = 'very-strong';
    text = 'Very strong password';
  }
  
  return { percentage, level, text };
}

function updatePasswordRequirements(requirements) {
  const requirementsContainer = document.getElementById('passwordRequirements');
  if (!requirementsContainer) return;
  
  // Show/hide requirements based on whether password has content
  const signupPassword = document.getElementById('signupPassword');
  if (signupPassword && signupPassword.value.length > 0) {
    requirementsContainer.classList.add('visible');
  } else {
    requirementsContainer.classList.remove('visible');
  }
  
  const reqElements = {
    length: requirementsContainer.querySelector('[data-requirement="length"]'),
    lowercase: requirementsContainer.querySelector('[data-requirement="lowercase"]'),
    uppercase: requirementsContainer.querySelector('[data-requirement="uppercase"]'),
    number: requirementsContainer.querySelector('[data-requirement="number"]'),
    special: requirementsContainer.querySelector('[data-requirement="special"]')
  };
  
  Object.keys(reqElements).forEach(key => {
    const element = reqElements[key];
    if (element) {
      const icon = element.querySelector('i');
      if (requirements[key]) {
        element.classList.add('met');
        if (icon) icon.className = 'fas fa-check-circle';
      } else {
        element.classList.remove('met');
        if (icon) icon.className = 'fas fa-circle';
      }
    }
  });
}

// 📧 Email Suggestions
function initEmailSuggestions() {
  const signupEmail = document.getElementById('signupEmail');
  if (!signupEmail) return;
  
  signupEmail.addEventListener('blur', showEmailSuggestions);
}

function showEmailSuggestions(e) {
  const email = e.target.value.toLowerCase();
  const suggestionsContainer = document.getElementById('emailSuggestions');
  if (!suggestionsContainer || !email.includes('@')) return;
  
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  const currentDomain = email.split('@')[1];
  
  if (!currentDomain) return;
  
  const suggestions = commonDomains
    .filter(domain => domain.startsWith(currentDomain.charAt(0)) && domain !== currentDomain)
    .slice(0, 3);
  
  if (suggestions.length > 0) {
    const emailPrefix = email.split('@')[0];
    suggestionsContainer.innerHTML = suggestions
      .map(domain => `
        <div class="email-suggestion" onclick="applySuggestion('${emailPrefix}@${domain}')">
          Did you mean <strong>${emailPrefix}@${domain}</strong>?
        </div>
      `).join('');
    suggestionsContainer.style.display = 'block';
  } else {
    suggestionsContainer.style.display = 'none';
  }
}

function applySuggestion(email) {
  const signupEmail = document.getElementById('signupEmail');
  const suggestionsContainer = document.getElementById('emailSuggestions');
  
  if (signupEmail) {
    signupEmail.value = email;
    signupEmail.focus();
  }
  
  if (suggestionsContainer) {
    suggestionsContainer.style.display = 'none';
  }
}

// 💬 Tooltips
function initTooltips() {
  const tooltipTriggers = document.querySelectorAll('.tooltip-trigger');
  const tooltip = document.getElementById('tooltip');
  
  tooltipTriggers.forEach(trigger => {
    trigger.addEventListener('mouseenter', (e) => showTooltip(e, tooltip));
    trigger.addEventListener('mouseleave', () => hideTooltip(tooltip));
  });
}

function showTooltip(e, tooltip) {
  const message = e.target.getAttribute('data-tooltip');
  if (!message || !tooltip) return;
  
  tooltip.textContent = message;
  tooltip.style.display = 'block';
  
  const rect = e.target.getBoundingClientRect();
  tooltip.style.left = `${rect.left + (rect.width / 2)}px`;
  tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
}

function hideTooltip(tooltip) {
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}

// 🎯 Enhanced Input Focus Handling
function handleInputFocus(e) {
  const input = e.target;
  const wrapper = input.closest('.input-wrapper, .password-input-group');
  
  if (wrapper) {
    wrapper.classList.add('focused');
  }
  
  // Clear previous errors on focus
  clearFieldError(e);
}

// 🔄 Real-time Validation
function handleRealTimeValidation(e) {
  const input = e.target;
  const wrapper = input.closest('.input-wrapper, .password-input-group');
  
  // Remove focused class when input loses focus
  if (wrapper && !input.matches(':focus')) {
    wrapper.classList.remove('focused');
  }
  
  // Real-time validation for certain fields
  const validateType = input.getAttribute('data-validate');
  if (validateType && input.value.trim()) {
    validateFieldRealTime(input, validateType);
  } else {
    clearFieldValidation(input);
  }
}

function validateFieldRealTime(input, type) {
  const value = input.value.trim();
  let isValid = false;
  
  switch (type) {
    case 'email':
      isValid = isValidEmail(value);
      break;
    case 'password':
      isValid = value.length >= (input.id.includes('signup') ? 8 : 6);
      break;
    case 'confirm-password':
      const mainPassword = document.getElementById('signupPassword');
      isValid = mainPassword && value === mainPassword.value;
      break;
    case 'name':
      isValid = value.length >= 2 && /^[a-zA-Z\s]+$/.test(value);
      break;
  }
  
  updateFieldValidation(input, isValid);
}

function updateFieldValidation(input, isValid) {
  const wrapper = input.closest('.input-wrapper, .password-input-group');
  if (!wrapper) return;
  
  const successIcon = wrapper.querySelector('.success-icon');
  const errorIcon = wrapper.querySelector('.error-icon');
  
  if (isValid) {
    wrapper.classList.add('valid');
    wrapper.classList.remove('invalid');
    if (successIcon) successIcon.style.display = 'block';
    if (errorIcon) errorIcon.style.display = 'none';
  } else {
    wrapper.classList.add('invalid');
    wrapper.classList.remove('valid');
    if (successIcon) successIcon.style.display = 'none';
    if (errorIcon) errorIcon.style.display = 'block';
  }
}

function clearFieldValidation(input) {
  const wrapper = input.closest('.input-wrapper, .password-input-group');
  if (!wrapper) return;
  
  wrapper.classList.remove('valid', 'invalid');
  const successIcon = wrapper.querySelector('.success-icon');
  const errorIcon = wrapper.querySelector('.error-icon');
  
  if (successIcon) successIcon.style.display = 'none';
  if (errorIcon) errorIcon.style.display = 'none';
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

// 🔐 Enhanced Login Handler with Security Features
let loginAttempts = 0;
const maxAttempts = 3;

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const rememberMe = document.getElementById('rememberMe').checked;
  const loginBtn = document.getElementById('loginBtn');
  const captchaContainer = document.getElementById('loginCaptcha');
  
  // Validate required fields
  if (!email || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }
  
  if (!isValidEmail(email)) {
    showToast('Please enter a valid email address', 'error');
    return;
  }
  
  // Check CAPTCHA if required
  if (loginAttempts >= maxAttempts && captchaContainer && captchaContainer.style.display !== 'none') {
    const captchaAnswer = document.getElementById('captchaAnswer');
    const correctAnswer = getCaptchaAnswer();
    
    if (!captchaAnswer || !captchaAnswer.value || parseInt(captchaAnswer.value) !== correctAnswer) {
      showToast('Please solve the CAPTCHA correctly', 'error');
      generateNewCaptcha();
      return;
    }
  }
  
  // Show loading state
  loginBtn.classList.add('loading');
  loginBtn.disabled = true;
  
  try {
    // Simulate API call
    await simulateAuth('login', { email, password, rememberMe });
    
    // Reset login attempts on success
    loginAttempts = 0;
    hideCaptcha();
    
    showToast('Welcome back! Redirecting...', 'success');
    
    // Redirect after success
    setTimeout(() => {
      const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || 'index.html';
      window.location.href = returnUrl;
    }, 1500);
    
  } catch (error) {
    loginAttempts++;
    
    // Show CAPTCHA after max attempts
    if (loginAttempts >= maxAttempts) {
      showCaptcha();
    }
    
    // Show attempts warning
    if (loginAttempts >= maxAttempts - 1) {
      showLoginAttemptsWarning();
    }
    
    showToast(error.message || 'Login failed. Please try again.', 'error');
  } finally {
    // Reset button state
    loginBtn.classList.remove('loading');
    loginBtn.disabled = false;
  }
}

// 🤖 CAPTCHA Functions
let currentCaptchaAnswer = 0;

function showCaptcha() {
  const captchaContainer = document.getElementById('loginCaptcha');
  if (captchaContainer) {
    captchaContainer.style.display = 'block';
    generateNewCaptcha();
  }
}

function hideCaptcha() {
  const captchaContainer = document.getElementById('loginCaptcha');
  if (captchaContainer) {
    captchaContainer.style.display = 'none';
  }
}

function generateNewCaptcha() {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  currentCaptchaAnswer = num1 + num2;
  
  const captchaQuestion = document.getElementById('captchaQuestion');
  const captchaAnswer = document.getElementById('captchaAnswer');
  
  if (captchaQuestion) {
    captchaQuestion.textContent = `${num1} + ${num2} = ?`;
  }
  
  if (captchaAnswer) {
    captchaAnswer.value = '';
  }
}

function getCaptchaAnswer() {
  return currentCaptchaAnswer;
}

function showLoginAttemptsWarning() {
  const attemptsContainer = document.getElementById('loginAttempts');
  if (attemptsContainer) {
    attemptsContainer.style.display = 'block';
    startCooldownTimer();
  }
}

function startCooldownTimer() {
  const timerElement = document.getElementById('cooldownTimer');
  if (!timerElement) return;
  
  let timeLeft = 300; // 5 minutes
  
  const timer = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 0) {
      clearInterval(timer);
      loginAttempts = 0;
      hideCaptcha();
      document.getElementById('loginAttempts').style.display = 'none';
    }
    
    timeLeft--;
  }, 1000);
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

// 🌐 Enhanced Social Login Handlers
function initSocialLogin() {
  const googleBtn = document.getElementById('googleLogin');
  const githubBtn = document.getElementById('githubLogin');
  const linkedinBtn = document.getElementById('linkedinLogin');
  
  if (googleBtn) {
    googleBtn.addEventListener('click', handleGoogleLogin);
  }
  
  if (githubBtn) {
    githubBtn.addEventListener('click', handleGithubLogin);
  }
  
  if (linkedinBtn) {
    linkedinBtn.addEventListener('click', handleLinkedInLogin);
  }
}

async function handleGoogleLogin() {
  const btn = document.getElementById('googleLogin');
  setButtonLoading(btn, 'Connecting to Google...');
  
  try {
    // Simulate Google OAuth flow
    await simulateOAuthLogin('google');
    showToast('Google login successful! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  } catch (error) {
    showToast('Google login failed. Please try again.', 'error');
  } finally {
    resetButtonLoading(btn, '<div class="social-icon"><svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.53H1.83v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.5 10.49a4.8 4.8 0 0 1 0-3.07V5.35H1.83a8 8 0 0 0 0 7.28l2.67-2.14z"/><path fill="#EA4335" d="M8.98 4.72c1.16 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.35L4.5 7.42a4.77 4.77 0 0 1 4.48-2.7z"/></svg></div><span>Google</span>');
  }
}

async function handleGithubLogin() {
  const btn = document.getElementById('githubLogin');
  setButtonLoading(btn, 'Connecting to GitHub...');
  
  try {
    await simulateOAuthLogin('github');
    showToast('GitHub login successful! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  } catch (error) {
    showToast('GitHub login failed. Please try again.', 'error');
  } finally {
    resetButtonLoading(btn, '<div class="social-icon"><i class="fab fa-github"></i></div><span>GitHub</span>');
  }
}

async function handleLinkedInLogin() {
  const btn = document.getElementById('linkedinLogin');
  setButtonLoading(btn, 'Connecting to LinkedIn...');
  
  try {
    await simulateOAuthLogin('linkedin');
    showToast('LinkedIn login successful! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  } catch (error) {
    showToast('LinkedIn login failed. Please try again.', 'error');
  } finally {
    resetButtonLoading(btn, '<div class="social-icon"><i class="fab fa-linkedin"></i></div><span>LinkedIn</span>');
  }
}

function setButtonLoading(btn, text) {
  btn.disabled = true;
  btn.classList.add('loading');
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
}

function resetButtonLoading(btn, originalContent) {
  btn.disabled = false;
  btn.classList.remove('loading');
  btn.innerHTML = originalContent;
}

async function simulateOAuthLogin(provider) {
  // Simulate OAuth flow delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate 85% success rate
  if (Math.random() < 0.85) {
    const user = {
      id: `${provider}-user-${Date.now()}`,
      name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
      email: `user@${provider}.example`,
      provider: provider,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('zendea-user', JSON.stringify(user));
    return user;
  } else {
    throw new Error(`${provider} authentication failed`);
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
