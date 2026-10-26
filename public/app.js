// ============================================================
// 📚 রাহুল বুকস্টোর — ফ্রন্টএন্ড ক্লায়েন্ট স্ক্রিপ্ট (app.js)
// সম্পূর্ণ Vanilla JavaScript দিয়ে তৈরি (DOM & Fetch API)
// ============================================================

// ১. স্টেট বা অ্যাপের মেমোরি
const state = {
  page: 1,
  limit: 6,
  search: '',
  minPrice: '',
  maxPrice: '',
  sortBy: 'newest',
  token: localStorage.getItem('rahul_books_token') || null,
  user: JSON.parse(localStorage.getItem('rahul_books_user') || 'null'),
  wishlistIds: new Set(),
  isWishlistView: false
};

let currentBooksList = []; // এডিট করার সুবিধার জন্য বর্তমান বইয়ের তালিকা

// ২. DOM উপাদানগুলো ধরা
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const minPriceInput = document.getElementById('minPrice');
const maxPriceInput = document.getElementById('maxPrice');
const limitSelect = document.getElementById('limitSelect');
const sortSelect = document.getElementById('sortSelect');
const applyFilterBtn = document.getElementById('applyFilterBtn');
const resetFilterBtn = document.getElementById('resetFilterBtn');

const booksGrid = document.getElementById('booksGrid');
const resultInfo = document.getElementById('resultInfo');
const activeFilters = document.getElementById('activeFilters');
const pageIndicator = document.getElementById('pageIndicator');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');

const authStatus = document.getElementById('authStatus');
const authModal = document.getElementById('authModal');
const addBookModal = document.getElementById('addBookModal');
const editBookModal = document.getElementById('editBookModal');

// ৩. পৃষ্ঠা লোড হওয়ার সাথে সাথে চালানো
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderAuthBadge();
  setupEventListeners();
  if (state.token) {
    fetchWishlistIds();
  }
  updateCartBadge();
  loadBooks();
});

// চোখের জন্য আরামদায়ক থিম হ্যান্ডলার (Eye-Comfort Theme)
function initTheme() {
  const savedTheme = localStorage.getItem('rahul_books_theme') || 'dark';
  applyTheme(savedTheme);
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light-theme');
  const newTheme = isLight ? 'dark' : 'light';
  applyTheme(newTheme);
  localStorage.setItem('rahul_books_theme', newTheme);
  showToast(newTheme === 'light' ? 'চোখের জন্য শান্ত লাইট মোড চালু হয়েছে' : 'শান্ত ডার্ক মোড চালু হয়েছে', 'info');
}

function applyTheme(theme) {
  const themeIcon = document.getElementById('themeIcon');
  const themeText = document.getElementById('themeText');
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    if (themeIcon) themeIcon.textContent = '🌙';
    if (themeText) themeText.textContent = 'ডার্ক মোড';
  } else {
    document.body.classList.remove('light-theme');
    if (themeIcon) themeIcon.textContent = '☀️';
    if (themeText) themeText.textContent = 'লাইট মোড';
  }
}

// ৪. ইভেন্ট লিসেনার সেটআপ
function setupEventListeners() {
  // সার্চ ইনপুট (Debounce সহ যাতে টাইপ শেষ হলে সার্চ হয়)
  let searchTimer;
  searchInput.addEventListener('input', (e) => {
    state.search = e.target.value.trim();
    clearSearchBtn.style.display = state.search ? 'block' : 'none';
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.page = 1;
      loadBooks();
    }, 350);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.search = '';
    clearSearchBtn.style.display = 'none';
    state.page = 1;
    loadBooks();
  });

  // ফিল্টার বাটন
  applyFilterBtn.addEventListener('click', () => {
    state.minPrice = minPriceInput.value.trim();
    state.maxPrice = maxPriceInput.value.trim();
    state.page = 1;
    loadBooks();
  });

  // রিসেট বাটন
  resetFilterBtn.addEventListener('click', () => {
    searchInput.value = '';
    minPriceInput.value = '';
    maxPriceInput.value = '';
    if (sortSelect) sortSelect.value = 'newest';
    state.search = '';
    state.minPrice = '';
    state.maxPrice = '';
    state.sortBy = 'newest';
    clearSearchBtn.style.display = 'none';
    state.page = 1;
    loadBooks();
  });

  // পেজ লিমিট সিলেক্টর
  limitSelect.addEventListener('change', (e) => {
    state.limit = parseInt(e.target.value, 10) || 6;
    state.page = 1;
    loadBooks();
  });

  // সর্ট সিলেক্টর (Sort By)
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      state.page = 1;
      loadBooks();
    });
  }

  // পেজিনেশন বাটন
  prevPageBtn.addEventListener('click', () => {
    if (state.page > 1) {
      state.page--;
      loadBooks();
    }
  });

  nextPageBtn.addEventListener('click', () => {
    state.page++;
    loadBooks();
  });
}

// ============================================================
// ৫. এপিআই থেকে বইয়ের তথ্য আনা (API Fetch)
// ============================================================
async function loadBooks() {
  const pagination = document.querySelector('.pagination');
  if (pagination) pagination.style.display = 'flex';

  booksGrid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⏳</div>
      <h3>বই লোড হচ্ছে...</h3>
      <p>ডাটাবেজ থেকে তথ্য আনা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন।</p>
    </div>
  `;

  // URL Query Parameters তৈরি করা
  const params = new URLSearchParams();
  params.append('page', state.page);
  params.append('limit', state.limit);

  if (state.search) params.append('search', state.search);
  if (state.minPrice) params.append('minPrice', state.minPrice);
  if (state.maxPrice) params.append('maxPrice', state.maxPrice);
  if (state.sortBy) params.append('sortBy', state.sortBy);

  try {
    const res = await fetch(`/api/books?${params.toString()}`);
    if (!res.ok) throw new Error('সার্ভার থেকে বইয়ের তালিকা পাওয়া যায়নি!');

    const data = await res.json();
    renderBooks(data);
    renderPagination(data);
    renderActiveFilterBadges();
  } catch (err) {
    booksGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <h3>সমস্যা হয়েছে!</h3>
        <p>${err.message}</p>
        <button class="btn btn-primary" onclick="loadBooks()" style="margin-top: 14px;">আবার চেষ্টা করুন</button>
      </div>
    `;
    resultInfo.textContent = 'ডাটা লোড ব্যর্থ';
  }
}

// ============================================================
// ৬. বইয়ের কার্ডগুলো পর্দায় আঁকা (Render Book Cards)
// ============================================================
function renderBooks(response) {
  const books = response.data || [];
  currentBooksList = books; // এডিটের জন্য বর্তমান তালিকা সংরক্ষণ
  const meta = response.meta || {};
  const total = meta.totalBooks !== undefined ? meta.totalBooks : (response.totalBooks || 0);

  resultInfo.innerHTML = `মোট <strong>${total}টি</strong> বইয়ের মধ্যে (${books.length}টি দেখাচ্ছে)`;

  if (books.length === 0) {
    booksGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>কোনো বই পাওয়া যায়নি!</h3>
        <p>আপনার ফিল্টার বা সার্চ শব্দের সাথে মিল রেখে কোনো বই ডাটাবেজে নেই।</p>
      </div>
    `;
    return;
  }

  booksGrid.innerHTML = books.map(book => {
    const isOwner = state.user && book.user_id && Number(state.user.id) === Number(book.user_id);
    const isAdmin = state.user && state.user.role === 'admin';
    const canDelete = isAdmin || isOwner;
    const isWishlisted = state.wishlistIds && state.wishlistIds.has(Number(book.Id));

    // ছবির ইউআরএল তৈরি
    const coverHtml = book.CoverImage 
      ? `<img src="/uploads/${book.CoverImage}" alt="${escapeHtml(book.BookTitle)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'book-placeholder\\'><span class=\\'icon\\'>📖</span><span class=\\'title-preview\\'>${escapeHtml(book.BookTitle)}</span></div>'">`
      : `<div class="book-placeholder"><span class="icon">📖</span><span class="title-preview">${escapeHtml(book.BookTitle)}</span></div>`;

    const ratingHtml = book.avgRating
      ? `<span class="rating-badge" title="গড় রেটিং ${book.avgRating} (${book.totalReviews}টি রিভিউ)">⭐ ${book.avgRating} <small>(${book.totalReviews})</small></span>`
      : `<span class="rating-badge rating-none">নতুন বই</span>`;

    return `
      <article class="book-card glass-card" id="book-${book.Id}">
        <div class="book-cover">
          ${coverHtml}
          <button 
            type="button"
            class="wishlist-heart-btn ${isWishlisted ? 'active' : ''}" 
            onclick="handleToggleWishlist(${book.Id}, event)" 
            title="${isWishlisted ? 'পছন্দের তালিকা থেকে সরান' : 'পছন্দের তালিকায় রাখুন'}"
            aria-label="Wishlist"
          >
            ${isWishlisted ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="book-details">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
              <h2 class="book-title">${escapeHtml(book.BookTitle)}</h2>
              ${ratingHtml}
            </div>
            <p class="book-author">লেখক: <strong>${escapeHtml(book.Author)}</strong></p>
          </div>
          <div>
            <div class="book-meta">
              <span class="book-price">৳ ${Number(book.Price).toLocaleString('bn-BD')}</span>
              <span class="book-added-by">আপলোড: ${book.AddedBy ? escapeHtml(book.AddedBy) : 'সিস্টেম'}</span>
            </div>
            <div class="book-card-actions">
              <button class="btn btn-outline" style="padding: 6px 10px; font-size: 0.8rem;" onclick="openReviewsModal(${book.Id})">
                💬 রিভিউ (${book.totalReviews || 0})
              </button>
              <button class="btn btn-primary" style="padding: 6px 10px; font-size: 0.8rem;" onclick="addToCart(${book.Id})">
                🛒 কার্ট
              </button>
              ${canDelete ? `
                <button class="btn btn-secondary-outline" onclick="openEditBookModal(${book.Id})" title="বই এডিট করুন">
                  ✏️ এডিট
                </button>
                <button class="btn btn-danger-outline" onclick="deleteBook(${book.Id}, '${escapeHtml(book.BookTitle)}')" title="বই মুছে ফেলুন">
                  🗑️ ডিলিট
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// ৭. পেজিনেশন বাটন আপডেট
function renderPagination(response) {
  const meta = response.meta || {};
  const current = meta.currentPage || response.currentPage || 1;
  const total = meta.totalPages || response.totalPages || 1;

  pageIndicator.textContent = `পেজ ${current} / ${total}`;
  prevPageBtn.disabled = current <= 1;
  nextPageBtn.disabled = current >= total;
}

// ৮. অ্যাক্টিভ ফিল্টার ব্যাজ দেখানো
function renderActiveFilterBadges() {
  const badges = [];
  if (state.search) {
    badges.push(`<span class="filter-tag">সার্চ: "${escapeHtml(state.search)}" <button onclick="clearFilter('search')">×</button></span>`);
  }
  if (state.minPrice) {
    badges.push(`<span class="filter-tag">সর্বনিম্ন: ৳${state.minPrice} <button onclick="clearFilter('minPrice')">×</button></span>`);
  }
  if (state.maxPrice) {
    badges.push(`<span class="filter-tag">সর্বোচ্চ: ৳${state.maxPrice} <button onclick="clearFilter('maxPrice')">×</button></span>`);
  }
  activeFilters.innerHTML = badges.join('');
}

function clearFilter(type) {
  if (type === 'search') {
    state.search = '';
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
  } else if (type === 'minPrice') {
    state.minPrice = '';
    minPriceInput.value = '';
  } else if (type === 'maxPrice') {
    state.maxPrice = '';
    maxPriceInput.value = '';
  }
  state.page = 1;
  loadBooks();
}

// ============================================================
// ৯. বই মুছে ফেলা (DELETE /api/books/:id - JWT সহ)
// ============================================================
async function deleteBook(id, title) {
  if (!state.token) {
    showToast('বই মুছতে হলে আগে লগইন করতে হবে!', 'error');
    openAuthModal();
    return;
  }

  const confirmDelete = confirm(`আপনি কি নিশ্চিত যে "${title}" বইটি এবং এর ছবি চিরতরে ডিলিট করতে চান?`);
  if (!confirmDelete) return;

  try {
    const res = await fetch(`/api/books/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'বই ডিলিট করতে ব্যর্থ হয়েছে!');

    showToast(data.message || 'বইটি সফলভাবে মুছে ফেলা হয়েছে! 🗑️', 'success');
    loadBooks(); // তালিকা রিফ্রেশ
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// ১০. নতুন বই যোগ করা (POST /api/books - FormData ও JWT সহ)
// ============================================================
async function handleAddBook(e) {
  e.preventDefault();

  if (!state.token) {
    showToast('বই যোগ করতে হলে আগে লগইন করতে হবে!', 'error');
    closeAddBookModal();
    openAuthModal();
    return;
  }

  const title = document.getElementById('newBookTitle').value.trim();
  const author = document.getElementById('newBookAuthor').value.trim();
  const price = document.getElementById('newBookPrice').value.trim();
  const coverFile = document.getElementById('newBookCover').files[0];

  const formData = new FormData();
  formData.append('BookTitle', title);
  formData.append('Author', author);
  formData.append('Price', price);
  if (coverFile) {
    formData.append('CoverImage', coverFile);
  }

  const submitBtn = document.getElementById('submitBookBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'সংরক্ষণ করা হচ্ছে...';

  try {
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.token}`
      },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      if (data.errors) {
        const firstErr = Object.values(data.errors)[0];
        throw new Error(firstErr || data.message || 'বই যোগ করতে ব্যর্থ হয়েছে!');
      }
      throw new Error(data.message || data.error || 'বই যোগ করতে ব্যর্থ হয়েছে!');
    }

    showToast(data.message || 'অভিনন্দন! নতুন বই সফলভাবে যোগ হয়েছে! 🎉', 'success');
    document.getElementById('addBookForm').reset();
    document.getElementById('imagePreviewContainer').style.display = 'none';
    closeAddBookModal();
    state.page = 1;
    loadBooks();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'বই সেভ করুন 💾';
  }
}

function previewCoverImage(e) {
  const file = e.target.files[0];
  const container = document.getElementById('imagePreviewContainer');
  const img = document.getElementById('imagePreview');
  if (file) {
    img.src = URL.createObjectURL(file);
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}

// ============================================================
// ১০.১ বই এডিট করার হ্যান্ডলার (Edit Book Handlers)
// ============================================================
function openEditBookModal(bookId) {
  if (!state.token) {
    showToast('বই এডিট করতে হলে আগে লগইন করতে হবে!', 'error');
    openAuthModal();
    return;
  }

  const book = currentBooksList.find(b => Number(b.Id) === Number(bookId));
  if (!book) {
    showToast('বইটি খুঁজে পাওয়া যায়নি!', 'error');
    return;
  }

  document.getElementById('editBookId').value = book.Id;
  document.getElementById('editBookTitle').value = book.BookTitle;
  document.getElementById('editBookAuthor').value = book.Author;
  document.getElementById('editBookPrice').value = Math.round(Number(book.Price));

  const previewContainer = document.getElementById('editImagePreviewContainer');
  const previewImg = document.getElementById('editImagePreview');
  document.getElementById('editBookCover').value = '';

  if (book.CoverImage) {
    previewImg.src = `/uploads/${book.CoverImage}`;
    previewContainer.style.display = 'block';
  } else {
    previewContainer.style.display = 'none';
  }

  editBookModal.style.display = 'flex';
}

function closeEditBookModal() {
  editBookModal.style.display = 'none';
  document.getElementById('editBookForm').reset();
  document.getElementById('editImagePreviewContainer').style.display = 'none';
}

function previewEditCoverImage(e) {
  const file = e.target.files[0];
  const container = document.getElementById('editImagePreviewContainer');
  const img = document.getElementById('editImagePreview');
  if (file) {
    img.src = URL.createObjectURL(file);
    container.style.display = 'block';
  }
}

async function handleEditBook(e) {
  e.preventDefault();

  if (!state.token) {
    showToast('বই এডিট করতে হলে আগে লগইন করতে হবে!', 'error');
    closeEditBookModal();
    openAuthModal();
    return;
  }

  const id = document.getElementById('editBookId').value;
  const title = document.getElementById('editBookTitle').value.trim();
  const author = document.getElementById('editBookAuthor').value.trim();
  const price = document.getElementById('editBookPrice').value.trim();
  const coverFile = document.getElementById('editBookCover').files[0];

  const formData = new FormData();
  formData.append('BookTitle', title);
  formData.append('Author', author);
  formData.append('Price', price);
  if (coverFile) {
    formData.append('CoverImage', coverFile);
  }

  const submitBtn = document.getElementById('submitEditBookBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'আপডেট করা হচ্ছে...';

  try {
    const res = await fetch(`/api/books/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${state.token}`
      },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      if (data.errors) {
        const firstErr = Object.values(data.errors)[0];
        throw new Error(firstErr || data.message || 'বই আপডেট করতে ব্যর্থ হয়েছে!');
      }
      throw new Error(data.message || data.error || 'বই আপডেট করতে ব্যর্থ হয়েছে!');
    }

    showToast(data.message || 'বইটির তথ্য সফলভাবে আপডেট হয়েছে! ✏️', 'success');
    closeEditBookModal();
    loadBooks();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'পরিবর্তন সংরক্ষণ করুন 💾';
  }
}

// ============================================================
// ১১. ইউজার অথেনটিকেশন (Login & Register)
// ============================================================
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      if (data.errors) {
        const firstErr = Object.values(data.errors)[0];
        throw new Error(firstErr || data.message || 'লগইন ব্যর্থ হয়েছে!');
      }
      throw new Error(data.message || data.error || 'লগইন ব্যর্থ হয়েছে!');
    }

    const token = (data.data && data.data.token) || data.token;
    const user = (data.data && data.data.user) || data.user;

    state.token = token;
    state.user = user;
    localStorage.setItem('rahul_books_token', token);
    localStorage.setItem('rahul_books_user', JSON.stringify(user));

    showToast(data.message || `স্বাগতম ${user.username}! লগইন সফল হয়েছে! 🔑`, 'success');
    renderAuthBadge();
    closeAuthModal();
    fetchWishlistIds();
    loadBooks(); // পারমিশন বাটন আপডেটের জন্য রি-রেন্ডার
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      if (data.errors) {
        const firstErr = Object.values(data.errors)[0];
        throw new Error(firstErr || data.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে!');
      }
      throw new Error(data.message || data.error || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে!');
    }

    showToast(data.message || 'অ্যাকাউন্ট তৈরি হয়েছে! এবার লগইন করুন।', 'success');
    switchAuthTab('login');
    document.getElementById('loginUsername').value = username;
    document.getElementById('loginPassword').value = '';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function handleLogout() {
  state.token = null;
  state.user = null;
  state.wishlistIds.clear();
  updateWishlistBadge();
  if (state.isWishlistView) {
    toggleWishlistView();
  }
  localStorage.removeItem('rahul_books_token');
  localStorage.removeItem('rahul_books_user');
  showToast('লগআউট সম্পন্ন হয়েছে।', 'success');
  renderAuthBadge();
  loadBooks();
}

function renderAuthBadge() {
  if (state.user) {
    const isAdmin = state.user.role === 'admin';
    authStatus.innerHTML = `
      <div class="user-badge">
        <span onclick="openProfileModal()" style="cursor: pointer;" title="প্রোফাইল ও ড্যাশবোর্ড দেখুন">👤 <strong>${escapeHtml(state.user.username)}</strong></span>
        <span class="role-tag ${isAdmin ? 'role-admin' : 'role-user'}">${escapeHtml(state.user.role || 'user')}</span>
        <button class="btn btn-outline" onclick="openProfileModal()" style="padding: 4px 8px; font-size: 0.78rem;" title="প্রোফাইল ও পাসওয়ার্ড পরিবর্তন">
          ⚙️ প্রোফাইল
        </button>
        <button class="btn btn-outline" onclick="openOrdersModal()" style="padding: 4px 8px; font-size: 0.78rem;" title="আমার অর্ডারসমূহ">
          📦 অর্ডার
        </button>
        <button class="btn btn-outline" onclick="handleLogout()" style="padding: 4px 10px; font-size: 0.78rem;">
          লগআউট
        </button>
      </div>
    `;
  } else {
    authStatus.innerHTML = `
      <button class="btn btn-outline" onclick="openAuthModal()">
        🔐 লগইন / সাইনআপ
      </button>
    `;
  }
}

// মডাল ও ট্যাব কন্ট্রোল
function openAuthModal() {
  authModal.style.display = 'flex';
}

function closeAuthModal() {
  authModal.style.display = 'none';
}

function openAddBookModal() {
  if (!state.token) {
    showToast('নতুন বই যোগ করতে আগে লগইন করুন!', 'error');
    openAuthModal();
    return;
  }
  addBookModal.style.display = 'flex';
}

function closeAddBookModal() {
  addBookModal.style.display = 'none';
}

function switchAuthTab(tab) {
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (tab === 'login') {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  } else {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
  }
}

// ============================================================
// ১২. রিভিউ ও রেটিং মডাল হ্যান্ডলার (Reviews Modal)
// ============================================================
let currentReviewBookId = null;

async function openReviewsModal(bookId, bookTitle) {
  currentReviewBookId = bookId;
  const reviewsModal = document.getElementById('reviewsModal');
  const modalTitle = document.getElementById('reviewModalBookTitle');
  const reviewsList = document.getElementById('reviewsList');
  const reviewFormSection = document.getElementById('reviewFormSection');

  const currentBook = currentBooksList.find(b => Number(b.Id) === Number(bookId));
  const title = bookTitle || (currentBook ? currentBook.BookTitle : 'বইয়ের রিভিউ');

  modalTitle.textContent = `"${title}" — রিভিউ ও রেটিং 💬`;
  reviewsList.innerHTML = `<div class="empty-state" style="padding: 24px;"><div class="empty-icon">⏳</div><p>রিভিউ লোড হচ্ছে...</p></div>`;
  reviewsModal.style.display = 'flex';

  // রিভিউ তালিকা ফেচ করা
  try {
    const res = await fetch(`/api/books/${bookId}/reviews`);
    const data = await res.json();
    const reviews = data.data || [];

    if (reviews.length === 0) {
      reviewsList.innerHTML = `
        <div class="empty-state" style="padding: 24px;">
          <div class="empty-icon">⭐</div>
          <h4>এখনও কোনো রিভিউ দেওয়া হয়নি!</h4>
          <p>আপনি প্রথম ব্যক্তি হিসেবে এই বইটির রিভিউ দিন।</p>
        </div>
      `;
    } else {
      reviewsList.innerHTML = reviews.map(r => `
        <div class="review-item">
          <div class="review-header">
            <span class="reviewer-name">👤 <strong>${escapeHtml(r.ReviewerName)}</strong></span>
            <span class="review-stars">${'⭐'.repeat(r.rating)} <small>(${r.rating}/5)</small></span>
          </div>
          <p class="review-comment">${escapeHtml(r.comment)}</p>
          <span class="review-date">${new Date(r.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
      `).join('');
    }
  } catch (err) {
    reviewsList.innerHTML = `<p style="color: var(--danger); padding: 14px;">রিভিউ লোড করতে ব্যর্থ: ${err.message}</p>`;
  }

  // রিভিউ ফর্ম দেখানো (লগইন স্ট্যাটাস অনুযায়ী)
  if (state.token) {
    reviewFormSection.innerHTML = `
      <form id="addReviewForm" onsubmit="handleAddReview(event)" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
        <h4 style="margin-bottom: 12px; font-size: 1rem;">আপনার রিভিউ ও রেটিং দিন ⭐</h4>
        <div class="form-group">
          <label for="reviewRating">রেটিং নির্বাচন করুন:</label>
          <select id="reviewRating" required style="width: 100%; padding: 8px 12px; background: var(--bg-input); color: var(--text-main); border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-family: inherit;">
            <option value="5" selected>⭐⭐⭐⭐⭐ (৫ স্টার - অসাধারণ)</option>
            <option value="4">⭐⭐⭐⭐ (৪ স্টার - খুব ভালো)</option>
            <option value="3">⭐⭐⭐ (৩ স্টার - ভালো)</option>
            <option value="2">⭐⭐ (২ স্টার - মোটামুটি)</option>
            <option value="1">⭐ (১ স্টার - পছন্দ হয়নি)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="reviewComment">আপনার মতামত লিখুন:</label>
          <textarea id="reviewComment" rows="3" required placeholder="বইটি কেমন লাগল? সংক্ষেপে মতামত লিখুন..." style="width: 100%; padding: 10px; background: var(--bg-input); color: var(--text-main); border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-family: inherit; resize: vertical;"></textarea>
        </div>
        <button type="submit" id="submitReviewBtn" class="btn btn-primary btn-block">
          রিভিউ সাবমিট করুন ✨
        </button>
      </form>
    `;
  } else {
    reviewFormSection.innerHTML = `
      <div style="text-align: center; padding: 16px; background: var(--bg-input); border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-top: 16px;">
        <p style="margin-bottom: 10px; color: var(--text-muted); font-size: 0.9rem;">রিভিউ ও রেটিং দিতে হলে অনুগ্রহ করে লগইন করুন।</p>
        <button class="btn btn-primary" onclick="closeReviewsModal(); openAuthModal();">
          🔐 লগইন করুন
        </button>
      </div>
    `;
  }
}

function closeReviewsModal() {
  const reviewsModal = document.getElementById('reviewsModal');
  if (reviewsModal) reviewsModal.style.display = 'none';
  currentReviewBookId = null;
}

async function handleAddReview(e) {
  e.preventDefault();
  if (!state.token || !currentReviewBookId) {
    showToast('রিভিউ দিতে হলে আগে লগইন করতে হবে!', 'error');
    return;
  }

  const rating = document.getElementById('reviewRating').value;
  const comment = document.getElementById('reviewComment').value.trim();
  const submitBtn = document.getElementById('submitReviewBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'সংরক্ষণ হচ্ছে...';

  try {
    const res = await fetch(`/api/books/${currentReviewBookId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ rating, comment })
    });

    const data = await res.json();
    if (!res.ok) {
      if (data.errors) {
        const firstErr = Object.values(data.errors)[0];
        throw new Error(firstErr || data.message || 'রিভিউ যোগ করতে ব্যর্থ হয়েছে!');
      }
      throw new Error(data.message || data.error || 'রিভিউ যোগ করতে ব্যর্থ হয়েছে!');
    }

    showToast(data.message || 'আপনার রিভিউ যুক্ত হয়েছে! ⭐', 'success');
    const currentBook = currentBooksList.find(b => Number(b.Id) === Number(currentReviewBookId));
    const title = currentBook ? currentBook.BookTitle : 'বইয়ের রিভিউ';
    openReviewsModal(currentReviewBookId, title);
    loadBooks(); // গড় রেটিং ব্যাজ রিফ্রেশ করা
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'রিভিউ সাবমিট করুন ✨';
  }
}

// ============================================================
// ১৩. উইশলিস্ট ও ফেভারিট বুকস হ্যান্ডলার (Wishlist Handlers)
// ============================================================

async function fetchWishlistIds() {
  if (!state.token) {
    state.wishlistIds.clear();
    updateWishlistBadge();
    return;
  }
  try {
    const res = await fetch('/api/wishlist/ids', {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.data)) {
      state.wishlistIds = new Set(data.data.map(Number));
      updateWishlistBadge();
    }
  } catch (err) {
    console.error('Wishlist IDs error:', err);
  }
}

function updateWishlistBadge() {
  const badge = document.getElementById('wishlistBadge');
  if (!badge) return;
  const count = state.wishlistIds ? state.wishlistIds.size : 0;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'inline-block' : 'none';
}

async function handleToggleWishlist(bookId, event) {
  if (event) event.stopPropagation();
  if (!state.token) {
    showToast('পছন্দের তালিকায় যুক্ত করতে আগে লগইন করুন!', 'error');
    openAuthModal();
    return;
  }

  const btn = event ? event.currentTarget : null;
  if (btn) btn.disabled = true;

  try {
    const res = await fetch(`/api/wishlist/${bookId}/toggle`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'উইশলিস্ট আপডেট করতে ব্যর্থ হয়েছে!');

    const isWishlisted = data.data && data.data.isWishlisted;
    if (isWishlisted) {
      state.wishlistIds.add(Number(bookId));
    } else {
      state.wishlistIds.delete(Number(bookId));
    }

    showToast(data.message, isWishlisted ? 'success' : 'info');
    updateWishlistBadge();

    if (state.isWishlistView) {
      loadWishlistBooks();
    } else if (btn) {
      btn.classList.toggle('active', isWishlisted);
      btn.innerHTML = isWishlisted ? '❤️' : '🤍';
      btn.title = isWishlisted ? 'পছন্দের তালিকা থেকে সরান' : 'পছন্দের তালিকায় রাখুন';
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function toggleWishlistView() {
  if (!state.token) {
    showToast('আপনার পছন্দের তালিকা দেখতে আগে লগইন করুন!', 'error');
    openAuthModal();
    return;
  }

  state.isWishlistView = !state.isWishlistView;
  const navBtn = document.getElementById('wishlistNavBtn');

  if (state.isWishlistView) {
    if (navBtn) {
      navBtn.classList.add('btn-primary');
      navBtn.classList.remove('btn-outline');
      navBtn.innerHTML = '<span>📚</span> সব বই দেখুন';
    }
    loadWishlistBooks();
  } else {
    if (navBtn) {
      navBtn.classList.remove('btn-primary');
      navBtn.classList.add('btn-outline');
      navBtn.innerHTML = `<span>❤️</span> উইশলিস্ট <span id="wishlistBadge" class="wishlist-badge">${state.wishlistIds.size}</span>`;
      updateWishlistBadge();
    }
    loadBooks();
  }
}

async function loadWishlistBooks() {
  booksGrid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⏳</div>
      <h3>পছন্দের বইগুলো লোড হচ্ছে...</h3>
    </div>
  `;
  resultInfo.innerHTML = `আপনার <strong>পছন্দের বইয়ের তালিকা</strong> লোড হচ্ছে...`;

  try {
    const res = await fetch('/api/wishlist', {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'উইশলিস্ট লোড করতে সমস্যা হয়েছে!');

    const books = data.data || [];
    resultInfo.innerHTML = `আপনার পছন্দের তালিকায় মোট <strong>${books.length}টি</strong> বই রয়েছে ❤️`;

    // পেজিনেশন লুকানো (উইশলিস্টে সব বই একবারে আসে)
    const pagination = document.querySelector('.pagination');
    if (pagination) pagination.style.display = 'none';

    renderBooks({ data: books, totalBooks: books.length });
  } catch (err) {
    booksGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>উইশলিস্ট লোড ব্যর্থ!</h3>
        <p>${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

// ============================================================
// ১৪. ইউজার প্রোফাইল ও পাসওয়ার্ড পরিবর্তন (Profile Handlers)
// ============================================================
async function openProfileModal() {
  if (!state.token) {
    showToast('প্রোফাইল দেখতে আগে লগইন করুন!', 'error');
    openAuthModal();
    return;
  }

  const modal = document.getElementById('profileModal');
  modal.style.display = 'flex';

  try {
    const res = await fetch('/api/profile', {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'প্রোফাইল লোড ব্যর্থ');

    const user = data.data.user;
    const stats = data.data.stats;

    document.getElementById('profileUsername').textContent = user.username;
    const roleBadge = document.getElementById('profileRoleBadge');
    roleBadge.textContent = user.role || 'user';
    roleBadge.className = `role-tag ${user.role === 'admin' ? 'role-admin' : 'role-user'}`;
    document.getElementById('profileJoinedDate').textContent = `যোগদানের তারিখ: ${new Date(user.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}`;

    document.getElementById('statUploaded').textContent = Number(stats.uploadedBooks || 0).toLocaleString('bn-BD');
    document.getElementById('statReviews').textContent = Number(stats.totalReviews || 0).toLocaleString('bn-BD');
    document.getElementById('statWishlist').textContent = Number(stats.totalWishlist || 0).toLocaleString('bn-BD');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.style.display = 'none';
  const form = document.getElementById('changePasswordForm');
  if (form) form.reset();
}

async function handleChangePassword(e) {
  e.preventDefault();
  if (!state.token) return;

  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;

  if (newPassword !== confirmNewPassword) {
    showToast('নতুন দুটি পাসওয়ার্ড মিলছে না! পুনরায় চেক করুন।', 'error');
    return;
  }

  const submitBtn = document.getElementById('submitPasswordBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'পরিবর্তন হচ্ছে...';

  try {
    const res = await fetch('/api/profile/change-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await res.json();
    if (!res.ok) {
      if (data.errors) {
        const firstErr = Object.values(data.errors)[0];
        throw new Error(firstErr || data.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ!');
      }
      throw new Error(data.message || data.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ!');
    }

    showToast(data.message || 'পাসওয়ার্ড পরিবর্তন সফল হয়েছে! 🔑', 'success');
    closeProfileModal();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'পাসওয়ার্ড আপডেট করুন 🔒';
  }
}

// ============================================================
// ১৫. শপিং কার্ট ও চেকআউট হ্যান্ডলার (Shopping Cart & Checkout)
// ============================================================
function getCart() {
  try {
    return JSON.parse(localStorage.getItem('rahul_books_cart') || '[]');
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('rahul_books_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const cart = getCart();
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.textContent = totalCount;
  badge.style.display = totalCount > 0 ? 'inline-block' : 'none';
}

function addToCart(bookId) {
  const book = currentBooksList.find(b => Number(b.Id) === Number(bookId));
  if (!book) {
    showToast('বইয়ের তথ্য পাওয়া যায়নি!', 'error');
    return;
  }

  const cart = getCart();
  const existingIndex = cart.findIndex(item => Number(item.bookId) === Number(bookId));

  if (existingIndex > -1) {
    cart[existingIndex].quantity += 1;
  } else {
    cart.push({
      bookId: Number(book.Id),
      title: book.BookTitle,
      author: book.Author,
      price: parseFloat(book.Price) || 0,
      coverImage: book.CoverImage || '',
      quantity: 1
    });
  }

  saveCart(cart);
  showToast(`"${book.BookTitle}" কার্টে যোগ করা হয়েছে! 🛒`, 'success');
}

function openCartModal() {
  const modal = document.getElementById('cartModal');
  renderCartItems();
  modal.style.display = 'flex';
}

function closeCartModal() {
  const modal = document.getElementById('cartModal');
  if (modal) modal.style.display = 'none';
}

function renderCartItems() {
  const cart = getCart();
  const listContainer = document.getElementById('cartItemsList');
  const totalItemsEl = document.getElementById('cartTotalItems');
  const totalAmountEl = document.getElementById('cartTotalAmount');
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (cart.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state" style="padding: 24px;">
        <div class="empty-icon">🛒</div>
        <h4>আপনার কার্ট বর্তমানে খালি!</h4>
        <p>বুকস্টোর থেকে যেকোনো বইয়ের নিচে "🛒 কার্ট" বাটনে ক্লিক করে যোগ করুন।</p>
      </div>
    `;
    totalItemsEl.textContent = '০টি';
    totalAmountEl.textContent = '৳ ০';
    checkoutBtn.disabled = true;
    return;
  }

  checkoutBtn.disabled = false;
  let totalItems = 0;
  let totalAmount = 0;

  listContainer.innerHTML = cart.map(item => {
    const subtotal = item.price * item.quantity;
    totalItems += item.quantity;
    totalAmount += subtotal;

    return `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; background: var(--bg-input); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <div style="flex: 1; min-width: 0;">
          <h4 style="font-size: 0.95rem; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(item.title)}</h4>
          <span style="font-size: 0.8rem; color: var(--text-dim);">একক মূল্য: ৳ ${Number(item.price).toLocaleString('bn-BD')}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button class="btn btn-outline" style="padding: 2px 8px; font-size: 0.85rem;" onclick="changeCartQty(${item.bookId}, -1)">−</button>
          <span style="min-width: 22px; text-align: center; font-weight: 700; font-size: 0.9rem;">${item.quantity}</span>
          <button class="btn btn-outline" style="padding: 2px 8px; font-size: 0.85rem;" onclick="changeCartQty(${item.bookId}, 1)">+</button>
        </div>
        <div style="text-align: right; min-width: 70px;">
          <div style="font-weight: 700; color: var(--primary); font-size: 0.95rem;">৳ ${subtotal.toLocaleString('bn-BD')}</div>
        </div>
        <button onclick="removeFromCart(${item.bookId})" title="মুছে ফেলুন" style="background: none; border: none; color: var(--danger); cursor: pointer; font-size: 1.1rem; padding: 4px;">
          🗑️
        </button>
      </div>
    `;
  }).join('');

  totalItemsEl.textContent = `${totalItems.toLocaleString('bn-BD')}টি`;
  totalAmountEl.textContent = `৳ ${totalAmount.toLocaleString('bn-BD')}`;
}

function changeCartQty(bookId, delta) {
  const cart = getCart();
  const item = cart.find(i => Number(i.bookId) === Number(bookId));
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(bookId);
    return;
  }

  saveCart(cart);
  renderCartItems();
}

function removeFromCart(bookId) {
  let cart = getCart();
  cart = cart.filter(i => Number(i.bookId) !== Number(bookId));
  saveCart(cart);
  renderCartItems();
  showToast('বইটি কার্ট থেকে সরানো হয়েছে।', 'info');
}

function clearCart() {
  localStorage.removeItem('rahul_books_cart');
  updateCartBadge();
  renderCartItems();
  showToast('কার্ট সম্পূর্ণ খালি করা হয়েছে।', 'info');
}

async function handleCheckout() {
  if (!state.token) {
    showToast('অর্ডার সম্পন্ন করতে আগে অনুগ্রহ করে লগইন করুন!', 'error');
    closeCartModal();
    openAuthModal();
    return;
  }

  const cart = getCart();
  if (cart.length === 0) {
    showToast('আপনার কার্ট খালি!', 'error');
    return;
  }

  const checkoutBtn = document.getElementById('checkoutBtn');
  checkoutBtn.disabled = true;
  checkoutBtn.textContent = 'অর্ডার প্রসেস হচ্ছে...';

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({
        items: cart.map(item => ({ bookId: item.bookId, quantity: item.quantity }))
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'অর্ডার সম্পন্ন করতে ব্যর্থ হয়েছে!');

    showToast(data.message || 'আপনার অর্ডারটি সফল হয়েছে! 🛍️', 'success');
    clearCart();
    closeCartModal();
    openOrdersModal();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = '🛍️ অর্ডার সম্পন্ন করুন (ক্যাশ অন ডেলিভারি)';
  }
}

// ============================================================
// ১৬. পূর্ববর্তী অর্ডার ইতিহাস হ্যান্ডলার (Orders History)
// ============================================================
async function openOrdersModal() {
  if (!state.token) {
    showToast('অর্ডারের ইতিহাস দেখতে আগে লগইন করুন!', 'error');
    openAuthModal();
    return;
  }

  const modal = document.getElementById('ordersModal');
  const list = document.getElementById('ordersList');
  list.innerHTML = `<div class="empty-state" style="padding: 24px;"><div class="spinner"></div><p>অর্ডার লোড হচ্ছে...</p></div>`;
  modal.style.display = 'flex';

  try {
    const res = await fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'অর্ডার তালিকা আনতে সমস্যা হয়েছে!');

    const orders = data.data || [];
    if (orders.length === 0) {
      list.innerHTML = `
        <div class="empty-state" style="padding: 24px;">
          <div class="empty-icon">📦</div>
          <h4>এখনও কোনো অর্ডার করেননি!</h4>
          <p>বুকস্টোর থেকে পছন্দের বইগুলো কার্টে নিয়ে অর্ডার করুন।</p>
        </div>
      `;
      return;
    }

    list.innerHTML = orders.map(order => `
      <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 10px;">
          <div>
            <strong>অর্ডার #${order.id}</strong>
            <span style="font-size: 0.78rem; color: var(--text-dim); margin-left: 8px;">${new Date(order.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <span class="role-tag role-admin" style="font-size: 0.76rem; background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981;">
            ✅ ${order.status === 'completed' ? 'সম্পন্ন' : order.status}
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px;">
          ${order.items.map(i => `
            <div style="display: flex; justify-content: space-between; font-size: 0.88rem;">
              <span>📖 ${escapeHtml(i.BookTitle)} × <strong>${i.quantity}</strong></span>
              <span style="color: var(--text-muted);">৳ ${Number(i.subtotal).toLocaleString('bn-BD')}</span>
            </div>
          `).join('')}
        </div>

        <div style="border-top: 1px dashed var(--border-color); padding-top: 8px; display: flex; justify-content: space-between; font-weight: 700; font-size: 0.95rem; color: var(--primary);">
          <span>মোট (${Number(order.total_items).toLocaleString('bn-BD')}টি বই):</span>
          <span>৳ ${Number(order.total_amount).toLocaleString('bn-BD')}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = `<p style="color: var(--danger); padding: 14px;">অর্ডার লোড ব্যর্থ: ${err.message}</p>`;
  }
}

function closeOrdersModal() {
  const modal = document.getElementById('ordersModal');
  if (modal) modal.style.display = 'none';
}

// বাইরে ক্লিক করলে মডাল বন্ধ হওয়া
window.addEventListener('click', (e) => {
  const reviewsModal = document.getElementById('reviewsModal');
  const profileModal = document.getElementById('profileModal');
  const cartModal = document.getElementById('cartModal');
  const ordersModal = document.getElementById('ordersModal');
  if (e.target === authModal) closeAuthModal();
  if (e.target === addBookModal) closeAddBookModal();
  if (e.target === editBookModal) closeEditBookModal();
  if (e.target === reviewsModal) closeReviewsModal();
  if (e.target === profileModal) closeProfileModal();
  if (e.target === cartModal) closeCartModal();
  if (e.target === ordersModal) closeOrdersModal();
});

// টোস্ট নোটিফিকেশন হেল্পার
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : '⚠️'}</span>
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// XSS প্রিভেনশন হেল্পার
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
