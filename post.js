// ===================================
// 📝 ZENDEA - POST CREATION SCRIPT
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

// 📝 Character Counting
function initCharacterCounting() {
  const titleInput = document.getElementById('title');
  const descriptionInput = document.getElementById('description');
  const titleCounter = document.getElementById('titleCount');
  const descriptionCounter = document.getElementById('descriptionCount');
  
  if (titleInput && titleCounter) {
    titleInput.addEventListener('input', () => {
      const count = titleInput.value.length;
      const max = titleInput.getAttribute('maxlength') || 100;
      titleCounter.textContent = `${count}/${max}`;
      
      if (count > max * 0.8) {
        titleCounter.style.color = 'var(--color-warning)';
      } else {
        titleCounter.style.color = 'var(--color-text-muted)';
      }
    });
  }
  
  if (descriptionInput && descriptionCounter) {
    descriptionInput.addEventListener('input', () => {
      const count = descriptionInput.value.length;
      const max = descriptionInput.getAttribute('maxlength') || 1000;
      descriptionCounter.textContent = `${count}/${max}`;
      
      if (count > max * 0.8) {
        descriptionCounter.style.color = 'var(--color-warning)';
      } else {
        descriptionCounter.style.color = 'var(--color-text-muted)';
      }
    });
  }
}

// 🎯 Post Type Handling
function initPostTypeHandling() {
  const typeJobRadio = document.getElementById('typeJob');
  const typeDealRadio = document.getElementById('typeDeal');
  const priceLabel = document.getElementById('priceLabel');
  const priceHelper = document.getElementById('priceHelper');
  const priceType = document.getElementById('priceType');
  
  function updatePriceSection() {
    const isJob = typeJobRadio.checked;
    
    if (priceLabel) {
      priceLabel.innerHTML = `<i class="fas fa-dollar-sign"></i> ${isJob ? 'Salary' : 'Price'}`;
    }
    
    if (priceHelper) {
      priceHelper.textContent = isJob 
        ? 'Specify the compensation or salary range'
        : 'Specify the price or discount amount';
    }
    
    if (priceType) {
      // Update price type options based on post type
      priceType.innerHTML = isJob 
        ? `
          <option value="hourly">per hour</option>
          <option value="daily">per day</option>
          <option value="monthly">per month</option>
          <option value="yearly" selected>per year</option>
        `
        : `
          <option value="fixed" selected>one time</option>
          <option value="daily">per day</option>
          <option value="monthly">per month</option>
          <option value="yearly">per year</option>
        `;
    }
    
    // Update preview
    updatePreview();
  }
  
  if (typeJobRadio) {
    typeJobRadio.addEventListener('change', updatePriceSection);
  }
  
  if (typeDealRadio) {
    typeDealRadio.addEventListener('change', updatePriceSection);
  }
  
  // Initialize
  updatePriceSection();
}

// 🖼️ Image Upload Handling
function initImageUpload() {
  const imageUploadArea = document.getElementById('imageUploadArea');
  const imageInput = document.getElementById('image');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const removeImageBtn = document.getElementById('removeImage');
  
  if (!imageUploadArea || !imageInput) return;
  
  // Click to upload
  imageUploadArea.addEventListener('click', () => {
    imageInput.click();
  });
  
  // File input change
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageFile(file);
    }
  });
  
  // Drag and drop
  imageUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageUploadArea.classList.add('dragover');
  });
  
  imageUploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    imageUploadArea.classList.remove('dragover');
  });
  
  imageUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    imageUploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleImageFile(file);
      } else {
        showToast('Please upload an image file', 'error');
      }
    }
  });
  
  // Remove image
  if (removeImageBtn) {
    removeImageBtn.addEventListener('click', () => {
      clearImageUpload();
    });
  }
  
  function handleImageFile(file) {
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showToast('Image must be smaller than 5MB', 'error');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Please upload a valid image file (JPG, PNG, GIF, WebP)', 'error');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (previewImg) {
        previewImg.src = e.target.result;
        previewImg.alt = file.name;
      }
      
      if (imagePreview) {
        imagePreview.classList.remove('hidden');
      }
      
      if (imageUploadArea) {
        imageUploadArea.style.display = 'none';
      }
      
      // Update preview
      updatePreview();
      
      showToast('Image uploaded successfully!', 'success', 2000);
    };
    
    reader.readAsDataURL(file);
  }
  
  function clearImageUpload() {
    if (imageInput) {
      imageInput.value = '';
    }
    
    if (imagePreview) {
      imagePreview.classList.add('hidden');
    }
    
    if (imageUploadArea) {
      imageUploadArea.style.display = 'block';
    }
    
    if (previewImg) {
      previewImg.src = '';
      previewImg.alt = '';
    }
    
    // Update preview
    updatePreview();
    
    showToast('Image removed', 'info', 2000);
  }
}

// 👁️ Preview Functionality
function initPreview() {
  const previewBtn = document.getElementById('previewBtn');
  const postPreview = document.getElementById('postPreview');
  
  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      const isVisible = !postPreview.classList.contains('hidden');
      
      if (isVisible) {
        postPreview.classList.add('hidden');
        previewBtn.innerHTML = '<i class="fas fa-eye"></i> Preview';
      } else {
        updatePreview();
        postPreview.classList.remove('hidden');
        previewBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Preview';
        
        // Scroll to preview
        postPreview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }
  
  // Auto-update preview when form fields change
  const formInputs = document.querySelectorAll('#postForm input, #postForm textarea, #postForm select');
  formInputs.forEach(input => {
    input.addEventListener('input', () => {
      if (!postPreview.classList.contains('hidden')) {
        updatePreview();
      }
    });
  });
}

function updatePreview() {
  const previewType = document.getElementById('previewType');
  const previewTitle = document.getElementById('previewTitle');
  const previewDescription = document.getElementById('previewDescription');
  const previewLocation = document.getElementById('previewLocation');
  const previewPrice = document.getElementById('previewPrice');
  const previewImage = document.getElementById('previewImage');
  
  // Get form values
  const isJob = document.getElementById('typeJob').checked;
  const title = document.getElementById('title').value || 'Title will appear here';
  const description = document.getElementById('description').value || 'Description will appear here';
  const location = document.getElementById('location').value || 'Location';
  const price = document.getElementById('price').value;
  const priceType = document.getElementById('priceType').value;
  const previewImg = document.getElementById('previewImg');
  
  // Update preview content
  if (previewType) {
    previewType.textContent = isJob ? 'Job' : 'Deal';
    previewType.className = `card-type ${isJob ? 'job' : 'deal'}`;
  }
  
  if (previewTitle) {
    previewTitle.textContent = title;
  }
  
  if (previewDescription) {
    previewDescription.textContent = description;
  }
  
  if (previewLocation) {
    previewLocation.textContent = location;
  }
  
  if (previewPrice) {
    if (price) {
      const formattedPrice = formatPrice(price, priceType);
      previewPrice.textContent = formattedPrice;
    } else {
      previewPrice.textContent = '$0';
    }
  }
  
  if (previewImage && previewImg) {
    if (previewImg.src && previewImg.src !== window.location.href) {
      previewImage.src = previewImg.src;
      previewImage.classList.remove('hidden');
    } else {
      previewImage.classList.add('hidden');
    }
  }
}

function formatPrice(price, type) {
  if (!price) return '$0';
  
  // Remove non-numeric characters except decimal point
  const numericPrice = price.replace(/[^0-9.]/g, '');
  const num = parseFloat(numericPrice);
  
  if (isNaN(num)) return '$0';
  
  // Format with commas
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
  
  // Add type suffix
  const typeLabels = {
    hourly: 'per hour',
    daily: 'per day',
    monthly: 'per month',
    yearly: 'per year',
    fixed: ''
  };
  
  const suffix = typeLabels[type] || '';
  return suffix ? `${formatted} ${suffix}` : formatted;
}

// ✅ Form Validation
function initFormValidation() {
  const postForm = document.getElementById('postForm');
  
  if (postForm) {
    postForm.addEventListener('submit', handleSubmit);
  }
  
  // Real-time validation
  const requiredFields = ['title', 'description', 'location'];
  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => clearFieldError(field));
    }
  });
}

function validateField(field) {
  const value = field.value.trim();
  const fieldName = field.id;
  
  clearFieldError(field);
  
  let errorMessage = '';
  
  switch (fieldName) {
    case 'title':
      if (!value) {
        errorMessage = 'Title is required';
      } else if (value.length < 5) {
        errorMessage = 'Title must be at least 5 characters long';
      }
      break;
      
    case 'description':
      if (!value) {
        errorMessage = 'Description is required';
      } else if (value.length < 20) {
        errorMessage = 'Description must be at least 20 characters long';
      }
      break;
      
    case 'location':
      if (!value) {
        errorMessage = 'Location is required';
      }
      break;
  }
  
  if (errorMessage) {
    showFieldError(field, errorMessage);
    return false;
  }
  
  return true;
}

function clearFieldError(field) {
  const existingError = field.parentElement.querySelector('.form-error');
  if (existingError) {
    existingError.remove();
  }
  field.style.borderColor = '';
}

function showFieldError(field, message) {
  clearFieldError(field);
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'form-error';
  errorDiv.textContent = message;
  
  field.style.borderColor = 'var(--color-error)';
  field.parentElement.appendChild(errorDiv);
}

// 📤 Form Submission
async function handleSubmit(e) {
  e.preventDefault();
  
  // Validate all required fields
  const requiredFields = ['title', 'description', 'location'];
  let isValid = true;
  
  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field && !validateField(field)) {
      isValid = false;
    }
  });
  
  if (!isValid) {
    showToast('Please fix the errors above', 'error');
    return;
  }
  
  // Get form data
  const formData = {
    type: document.getElementById('typeJob').checked ? 'job' : 'deal',
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    location: document.getElementById('location').value.trim(),
    price: document.getElementById('price').value.trim(),
    priceType: document.getElementById('priceType').value,
    image: document.getElementById('image').files[0] || null,
    options: {
      isUrgent: document.getElementById('isUrgent').checked,
      allowContact: document.getElementById('allowContact').checked,
      isRemote: document.getElementById('isRemote').checked,
      emailNotifications: document.getElementById('emailNotifications').checked
    }
  };
  
  const postBtn = document.getElementById('postBtn');
  
  // Show loading state
  postBtn.classList.add('loading');
  postBtn.disabled = true;
  postBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
  
  try {
    // Simulate API call
    await simulatePostSubmission(formData);
    
    showToast('Post published successfully! 🎉', 'success');
    
    // Redirect to homepage or profile
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    
  } catch (error) {
    showToast(error.message || 'Failed to publish post. Please try again.', 'error');
  } finally {
    // Reset button state
    postBtn.classList.remove('loading');
    postBtn.disabled = false;
    postBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Post';
  }
}

// 💾 Save Draft Functionality
function initSaveDraft() {
  const saveDraftBtn = document.getElementById('saveDraftBtn');
  
  if (saveDraftBtn) {
    saveDraftBtn.addEventListener('click', async () => {
      const formData = {
        type: document.getElementById('typeJob').checked ? 'job' : 'deal',
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        location: document.getElementById('location').value.trim(),
        price: document.getElementById('price').value.trim(),
        priceType: document.getElementById('priceType').value
      };
      
      // Save to localStorage
      localStorage.setItem('zendea-draft', JSON.stringify(formData));
      
      showToast('Draft saved successfully! 💾', 'success', 2000);
    });
  }
  
  // Load draft on page load
  loadDraft();
}

function loadDraft() {
  const draft = localStorage.getItem('zendea-draft');
  if (!draft) return;
  
  try {
    const formData = JSON.parse(draft);
    
    // Ask user if they want to load the draft
    if (confirm('You have a saved draft. Would you like to load it?')) {
      // Fill form with draft data
      if (formData.type === 'job') {
        document.getElementById('typeJob').checked = true;
      } else {
        document.getElementById('typeDeal').checked = true;
      }
      
      document.getElementById('title').value = formData.title || '';
      document.getElementById('description').value = formData.description || '';
      document.getElementById('location').value = formData.location || '';
      document.getElementById('price').value = formData.price || '';
      document.getElementById('priceType').value = formData.priceType || 'yearly';
      
      // Trigger change events to update UI
      document.getElementById('typeJob').dispatchEvent(new Event('change'));
      document.getElementById('title').dispatchEvent(new Event('input'));
      document.getElementById('description').dispatchEvent(new Event('input'));
      
      showToast('Draft loaded successfully!', 'success');
    }
  } catch (error) {
    console.error('Error loading draft:', error);
    localStorage.removeItem('zendea-draft');
  }
}

// 🎭 Simulate Post Submission
async function simulatePostSubmission(formData) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate random success/failure for demo
  if (Math.random() < 0.9) { // 90% success rate
    // Clear draft on successful submission
    localStorage.removeItem('zendea-draft');
    return { success: true, id: 'post-' + Date.now() };
  } else {
    throw new Error('Network error. Please try again.');
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

// 📱 Handle URL Parameters
function handleURLParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type');
  
  if (type === 'job') {
    document.getElementById('typeJob').checked = true;
  } else if (type === 'deal') {
    document.getElementById('typeDeal').checked = true;
  }
  
  // Trigger change event to update UI
  const typeJobRadio = document.getElementById('typeJob');
  if (typeJobRadio) {
    typeJobRadio.dispatchEvent(new Event('change'));
  }
}

// 🚀 Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
  console.log('📝 Post creation page loading...');
  
  // Initialize all features
  initThemeToggle();
  initCharacterCounting();
  initPostTypeHandling();
  initImageUpload();
  initPreview();
  initFormValidation();
  initSaveDraft();
  initNavigation();
  handleURLParameters();
  
  // Auto-focus title field
  setTimeout(() => {
    const titleInput = document.getElementById('title');
    if (titleInput && window.innerWidth > 768) {
      titleInput.focus();
    }
  }, 500);
  
  console.log('✨ Post creation page ready!');
  
  // Show helpful message
  setTimeout(() => {
    showToast('Create amazing posts to share with the community! 🚀', 'info', 3000);
  }, 1000);
});

// 🌐 Global error handler
window.addEventListener('error', (e) => {
  console.error('Post Error:', e.error);
  showToast('Something went wrong. Please try again.', 'error');
});

// 📱 Handle page unload (save draft)
window.addEventListener('beforeunload', (e) => {
  const hasChanges = document.getElementById('title').value.trim() || 
                    document.getElementById('description').value.trim() ||
                    document.getElementById('location').value.trim();
                    
  if (hasChanges) {
    // Auto-save draft
    const formData = {
      type: document.getElementById('typeJob').checked ? 'job' : 'deal',
      title: document.getElementById('title').value.trim(),
      description: document.getElementById('description').value.trim(),
      location: document.getElementById('location').value.trim(),
      price: document.getElementById('price').value.trim(),
      priceType: document.getElementById('priceType').value
    };
    
    localStorage.setItem('zendea-draft', JSON.stringify(formData));
  }
});
