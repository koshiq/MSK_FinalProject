// API Configuration
const API_URL = 'http://localhost:3001/api';

// State Management
let currentUser = null;
let currentSeries = [];
let featuredSeries = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

async function initializeApp() {
    // Check for stored token
    const token = localStorage.getItem('token');
    if (token) {
        try {
            await loadCurrentUser();
        } catch (error) {
            console.error('Failed to load user:', error);
            localStorage.removeItem('token');
        }
    }

    // Load content
    await loadFeaturedSeries();
    await loadAllSeries();
    await loadSeriesByGenre('Drama', 'dramaCarousel');
    await loadSeriesByGenre('Sci-Fi', 'scifiCarousel');

    if (currentUser) {
        await loadContinueWatching();
    }

    // Update UI based on user role
    updateUIForRole();

    // Add scroll effect to navbar
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

function updateUIForRole() {
    const adminNav = document.getElementById('adminNav');
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee')) {
        if (adminNav) adminNav.style.display = 'inline';
    } else {
        if (adminNav) adminNav.style.display = 'none';
    }
}

function setupEventListeners() {
    // User menu
    const userBtn = document.getElementById('userBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!currentUser) {
            showAuthModal();
        } else {
            dropdownMenu.classList.toggle('show');
        }
    });

    document.addEventListener('click', () => {
        dropdownMenu.classList.remove('show');
    });

    // Auth links
    document.getElementById('logoutLink').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // Search
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Auth modal
    const authModal = document.getElementById('authModal');
    const authModalClose = document.getElementById('authModalClose');

    authModalClose.addEventListener('click', () => {
        authModal.classList.remove('show');
    });

    // Auth tabs
    document.querySelectorAll('.auth-tab, .switch-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = e.target.dataset.tab;
            switchAuthTab(targetTab);
        });
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Register form
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    // Series modal
    const seriesModal = document.getElementById('seriesModal');
    const modalClose = document.getElementById('modalClose');

    modalClose.addEventListener('click', () => {
        seriesModal.classList.remove('show');
    });

    // Video modal
    const videoModal = document.getElementById('videoModal');
    const videoClose = document.getElementById('videoClose');

    videoClose.addEventListener('click', () => {
        videoModal.classList.remove('show');
        const videoPlayer = document.getElementById('videoPlayer');
        videoPlayer.pause();
        videoPlayer.src = '';
    });

    // Add review button
    document.getElementById('addReviewBtn').addEventListener('click', showReviewForm);

    // Hero play button
    document.getElementById('playBtn').addEventListener('click', () => {
        if (featuredSeries) {
            playFirstEpisode(featuredSeries.SERIES_ID);
        }
    });

    // Hero info button
    document.getElementById('infoBtn').addEventListener('click', () => {
        if (featuredSeries) {
            showSeriesDetails(featuredSeries.SERIES_ID);
        }
    });

    // Admin link
    const adminNav = document.getElementById('adminNav');
    if (adminNav) {
        adminNav.addEventListener('click', (e) => {
            e.preventDefault();
            showAdminPanel();
        });
    }

    // Close modals on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.show').forEach(modal => {
                modal.classList.remove('show');
            });
        }
    });

    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
}

// API Functions with XSS protection
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.details?.map(d => d.message).join(', ') || 'Request failed');
        }

        return data;
    } catch (error) {
        if (error.message === 'Please authenticate' || error.message === 'jwt expired') {
            localStorage.removeItem('token');
            currentUser = null;
            document.getElementById('userName').textContent = 'Sign In';
        }
        throw error;
    }
}

// Auth Functions
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        localStorage.setItem('token', data.token);
        currentUser = data.viewer;

        document.getElementById('userName').textContent = currentUser.firstName;
        document.getElementById('authModal').classList.remove('show');

        showToast('Welcome back, ' + escapeHtml(currentUser.firstName) + '!');

        // Reload content
        await loadContinueWatching();
        updateUIForRole();
    } catch (error) {
        showToast('Login failed: ' + error.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const firstName = document.getElementById('registerFirstName').value;
    const lastName = document.getElementById('registerLastName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const seriesId = document.getElementById('registerSeriesId').value;
    const countryId = document.getElementById('registerCountryId').value;

    // Client-side validation
    if (password.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        showToast('Password must contain uppercase, lowercase, and number', 'error');
        return;
    }

    if (!seriesId) {
        showToast('Please select a series', 'error');
        return;
    }

    if (!countryId) {
        showToast('Please select a country', 'error');
        return;
    }

    try {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ 
                firstName, 
                lastName, 
                email, 
                password,
                seriesId: parseInt(seriesId),
                countryId: parseInt(countryId)
            })
        });

        localStorage.setItem('token', data.token);
        currentUser = data.viewer;

        document.getElementById('userName').textContent = currentUser.firstName;
        document.getElementById('authModal').classList.remove('show');

        showToast('Welcome, ' + escapeHtml(currentUser.firstName) + '!');
        updateUIForRole();
    } catch (error) {
        showToast('Registration failed: ' + error.message, 'error');
    }
}

async function loadCurrentUser() {
    const data = await apiRequest('/auth/me');
    currentUser = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role
    };
    document.getElementById('userName').textContent = currentUser.firstName;
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    document.getElementById('userName').textContent = 'Sign In';
    document.getElementById('continueWatchingSection').style.display = 'none';
    updateUIForRole();
    showToast('Signed out successfully');
}

function showAuthModal() {
    document.getElementById('authModal').classList.add('show');
    document.getElementById('loginEmail').focus();
}

async function loadRegistrationOptions() {
    try {
        // Load series for dropdown
        const seriesSelect = document.getElementById('registerSeriesId');
        if (seriesSelect.options.length <= 1) {
            const series = await apiRequest('/series');
            series.forEach(s => {
                const option = document.createElement('option');
                option.value = s.SERIES_ID;
                option.textContent = s.NAME;
                seriesSelect.appendChild(option);
            });
        }

        // Load countries for dropdown
        const countrySelect = document.getElementById('registerCountryId');
        if (countrySelect.options.length <= 1) {
            const countries = await apiRequest('/series/countries');
            countries.forEach(c => {
                const option = document.createElement('option');
                option.value = c.COUNTRY_ID;
                option.textContent = c.COUNTRY_NAME;
                countrySelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load registration options:', error);
    }
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTabs = document.querySelectorAll('.auth-tab');

    authTabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');

    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        // Load series and countries when showing register form
        loadRegistrationOptions();
    }
}

// Content Loading Functions
async function loadFeaturedSeries() {
    try {
        const series = await apiRequest('/series/featured');
        if (series && series.length > 0) {
            featuredSeries = series[0];
            updateHeroSection(featuredSeries);
        }

        // Load trending carousel
        const trendingCarousel = document.getElementById('trendingCarousel');
        trendingCarousel.innerHTML = '';
        series.forEach(s => {
            trendingCarousel.appendChild(createSeriesCard(s));
        });
    } catch (error) {
        console.error('Failed to load featured series:', error);
    }
}

async function loadAllSeries() {
    try {
        const series = await apiRequest('/series');
        currentSeries = series;

        const carousel = document.getElementById('allSeriesCarousel');
        carousel.innerHTML = '';

        series.forEach(s => {
            carousel.appendChild(createSeriesCard(s));
        });
    } catch (error) {
        console.error('Failed to load series:', error);
    }
}

async function loadSeriesByGenre(genre, carouselId) {
    try {
        const series = await apiRequest(`/series/genre/${encodeURIComponent(genre)}`);
        const carousel = document.getElementById(carouselId);
        carousel.innerHTML = '';

        if (series.length === 0) {
            carousel.innerHTML = '<p style="color: var(--text-secondary);">No series available</p>';
            return;
        }

        series.forEach(s => {
            carousel.appendChild(createSeriesCard(s));
        });
    } catch (error) {
        console.error(`Failed to load ${genre} series:`, error);
    }
}

async function loadContinueWatching() {
    if (!currentUser) return;

    try {
        const history = await apiRequest('/episodes/continue/watching');

        if (history.length > 0) {
            const section = document.getElementById('continueWatchingSection');
            section.style.display = 'block';

            const carousel = document.getElementById('continueWatchingCarousel');
            carousel.innerHTML = '';

            history.forEach(item => {
                carousel.appendChild(createContinueWatchingCard(item));
            });
        }
    } catch (error) {
        console.error('Failed to load continue watching:', error);
    }
}

async function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    try {
        const results = await apiRequest(`/series/search?q=${encodeURIComponent(query)}`);

        // Update all series carousel with search results
        const carousel = document.getElementById('allSeriesCarousel');
        carousel.innerHTML = '';

        if (results.length === 0) {
            carousel.innerHTML = '<p style="color: var(--text-secondary);">No results found</p>';
            return;
        }

        results.forEach(s => {
            carousel.appendChild(createSeriesCard(s));
        });

        // Update title
        document.querySelector('.content-row:nth-child(3) .row-title').textContent = `Search Results for "${escapeHtml(query)}"`;

        // Scroll to results
        document.querySelector('#allSeriesCarousel').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showToast('Search failed: ' + error.message, 'error');
    }
}

// UI Update Functions
function updateHeroSection(series) {
    document.getElementById('heroTitle').textContent = series.NAME;
    document.getElementById('heroDescription').textContent = series.DESCRIPTION || 'Experience amazing storytelling';
    document.getElementById('heroGenre').textContent = series.genres || '';
    document.getElementById('heroYear').textContent = series.RELEASE_DATE ? new Date(series.RELEASE_DATE).getFullYear() : '';

    // Update backdrop if available
    if (series.BANNER_URL) {
        const backdrop = document.getElementById('heroBackdrop');
        backdrop.style.backgroundImage = `linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%), url('${escapeHtml(series.BANNER_URL)}')`;
    }
}

function createSeriesCard(series) {
    const card = document.createElement('div');
    card.className = 'series-card';
    card.onclick = () => showSeriesDetails(series.SERIES_ID);

    const imageDiv = document.createElement('div');
    imageDiv.className = 'series-card-image';
    imageDiv.textContent = series.NAME;

    const info = document.createElement('div');
    info.className = 'series-card-info';

    const title = document.createElement('div');
    title.className = 'series-card-title';
    title.textContent = series.NAME;

    const meta = document.createElement('div');
    meta.className = 'series-card-meta';

    const year = document.createElement('span');
    year.textContent = series.RELEASE_DATE ? new Date(series.RELEASE_DATE).getFullYear() : '';

    const genre = document.createElement('span');
    genre.textContent = series.genres ? series.genres.split(',')[0] : '';

    meta.appendChild(year);
    if (genre.textContent) {
        meta.appendChild(genre);
    }

    info.appendChild(title);
    info.appendChild(meta);

    card.appendChild(imageDiv);
    card.appendChild(info);

    return card;
}

function createContinueWatchingCard(item) {
    const card = document.createElement('div');
    card.className = 'series-card';
    card.onclick = () => playEpisode(item.EPISODE_ID, item.SERIES_ID);

    const imageDiv = document.createElement('div');
    imageDiv.className = 'series-card-image';
    imageDiv.style.height = '157px';
    imageDiv.textContent = item.seriesName;

    // Add progress bar
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: rgba(255, 255, 255, 0.3);
    `;

    const progress = document.createElement('div');
    progress.style.cssText = `
        height: 100%;
        background: var(--accent-color);
        width: ${item.WATCH_PROGRESS}%;
    `;
    progressBar.appendChild(progress);
    imageDiv.appendChild(progressBar);

    const info = document.createElement('div');
    info.className = 'series-card-info';

    const title = document.createElement('div');
    title.className = 'series-card-title';
    title.textContent = item.EPISODE_TITLE;

    const meta = document.createElement('div');
    meta.className = 'series-card-meta';
    meta.textContent = `${item.seriesName} • S1 E${item.EPISODE_NO}`;

    info.appendChild(title);
    info.appendChild(meta);

    card.appendChild(imageDiv);
    card.appendChild(info);

    return card;
}

async function showSeriesDetails(seriesId) {
    try {
        const series = await apiRequest(`/series/${seriesId}`);
        const feedback = await apiRequest(`/feedback/series/${seriesId}`);

        // Store current series ID for review
        document.getElementById('seriesModal').dataset.seriesId = seriesId;

        // Update modal
        document.getElementById('modalTitle').textContent = series.NAME;
        document.getElementById('modalDescription').textContent = series.DESCRIPTION || 'No description available';
        document.getElementById('modalYear').textContent = series.RELEASE_DATE ? new Date(series.RELEASE_DATE).getFullYear() : '';
        document.getElementById('modalGenres').textContent = series.genres || '';
        document.getElementById('modalRating').textContent = `★ ${parseFloat(series.avgRating || 0).toFixed(1)}`;

        // Episodes list
        const episodesList = document.getElementById('episodesList');
        episodesList.innerHTML = '';

        if (series.episodes && series.episodes.length > 0) {
            series.episodes.forEach(ep => {
                episodesList.appendChild(createEpisodeCard(ep));
            });
        } else {
            episodesList.innerHTML = '<p style="color: var(--text-secondary);">No episodes available</p>';
        }

        // Reviews list
        const reviewsList = document.getElementById('reviewsList');
        reviewsList.innerHTML = '';

        if (feedback && feedback.length > 0) {
            feedback.forEach(review => {
                reviewsList.appendChild(createReviewCard(review));
            });
        } else {
            reviewsList.innerHTML = '<p style="color: var(--text-secondary);">No reviews yet. Be the first to review!</p>';
        }

        // Play button
        document.getElementById('modalPlayBtn').onclick = () => {
            playFirstEpisode(seriesId);
        };

        // Admin edit button
        const editSeriesBtn = document.getElementById('editSeriesBtn');
        if (editSeriesBtn) {
            if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee')) {
                editSeriesBtn.style.display = 'inline-flex';
                editSeriesBtn.onclick = () => showEditSeriesForm(series);
            } else {
                editSeriesBtn.style.display = 'none';
            }
        }

        // Show modal
        document.getElementById('seriesModal').classList.add('show');
    } catch (error) {
        showToast('Failed to load series details: ' + error.message, 'error');
    }
}

function createEpisodeCard(episode) {
    const card = document.createElement('div');
    card.className = 'episode-card';
    card.onclick = () => playEpisode(episode.EPISODE_ID, episode.SERIES_ID);

    const thumbnail = document.createElement('div');
    thumbnail.className = 'episode-thumbnail';
    thumbnail.textContent = `E${episode.EPISODE_NO}`;

    const info = document.createElement('div');
    info.className = 'episode-info';

    const number = document.createElement('div');
    number.className = 'episode-number';
    number.textContent = `Episode ${episode.EPISODE_NO}`;

    const title = document.createElement('div');
    title.className = 'episode-title';
    title.textContent = episode.EPISODE_TITLE || `Episode ${episode.EPISODE_NO}`;

    const duration = document.createElement('div');
    duration.className = 'episode-duration';
    duration.textContent = `${episode.DURATION_MIN || 0} min`;

    info.appendChild(number);
    info.appendChild(title);
    info.appendChild(duration);

    card.appendChild(thumbnail);
    card.appendChild(info);

    return card;
}

function createReviewCard(review) {
    const card = document.createElement('div');
    card.className = 'review-card';

    const header = document.createElement('div');
    header.className = 'review-header';

    const author = document.createElement('div');
    author.className = 'review-author';
    author.textContent = `${review.FIRST_NAME} ${review.LAST_NAME || ''}`;

    const rating = document.createElement('div');
    rating.className = 'rating';
    rating.textContent = '★'.repeat(Math.floor(review.RATING || 0));

    header.appendChild(author);
    header.appendChild(rating);

    const text = document.createElement('div');
    text.className = 'review-text';
    text.textContent = review.TEXT || 'No comment';

    const footer = document.createElement('div');
    footer.className = 'review-footer';
    footer.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-top: 10px;';

    const date = document.createElement('div');
    date.className = 'review-date';
    date.textContent = new Date(review.DATE).toLocaleDateString();

    footer.appendChild(date);

    // Add edit/delete buttons for own reviews or admin
    if (currentUser && (currentUser.id === review.VIEWER_ID || currentUser.role === 'admin')) {
        const actions = document.createElement('div');
        actions.className = 'review-actions';
        actions.style.cssText = 'display: flex; gap: 10px;';

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'btn-small';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            showEditReviewForm(review);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'btn-small btn-danger';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteReview(review.FEEDBACK_ID);
        };

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        footer.appendChild(actions);
    }

    card.appendChild(header);
    card.appendChild(text);
    card.appendChild(footer);

    return card;
}

// Review Functions
function showReviewForm() {
    if (!currentUser) {
        showAuthModal();
        showToast('Please sign in to write a review');
        return;
    }

    const seriesId = document.getElementById('seriesModal').dataset.seriesId;
    
    // Create review form modal
    let reviewModal = document.getElementById('reviewModal');
    if (!reviewModal) {
        reviewModal = document.createElement('div');
        reviewModal.id = 'reviewModal';
        reviewModal.className = 'modal';
        reviewModal.innerHTML = `
            <div class="modal-content auth-modal">
                <button class="modal-close" onclick="document.getElementById('reviewModal').classList.remove('show')">&times;</button>
                <h2>Write a Review</h2>
                <form id="reviewForm" class="auth-form" style="display: block;">
                    <div class="form-group">
                        <label>Rating</label>
                        <div class="rating-input" id="ratingInput">
                            <span data-rating="1">★</span>
                            <span data-rating="2">★</span>
                            <span data-rating="3">★</span>
                            <span data-rating="4">★</span>
                            <span data-rating="5">★</span>
                        </div>
                        <input type="hidden" id="reviewRating" value="5">
                    </div>
                    <div class="form-group">
                        <textarea id="reviewText" placeholder="Write your review..." rows="4" style="width: 100%; resize: vertical;"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Submit Review</button>
                </form>
            </div>
        `;
        document.body.appendChild(reviewModal);

        // Rating input handler
        const ratingInput = reviewModal.querySelector('#ratingInput');
        ratingInput.querySelectorAll('span').forEach(star => {
            star.style.cssText = 'cursor: pointer; font-size: 24px; color: #ffd700;';
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                document.getElementById('reviewRating').value = rating;
                ratingInput.querySelectorAll('span').forEach((s, i) => {
                    s.style.opacity = i < rating ? '1' : '0.3';
                });
            });
        });

        // Form submit handler
        reviewModal.querySelector('#reviewForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const rating = parseFloat(document.getElementById('reviewRating').value);
            const text = document.getElementById('reviewText').value;
            const seriesId = document.getElementById('seriesModal').dataset.seriesId;

            try {
                await apiRequest('/feedback', {
                    method: 'POST',
                    body: JSON.stringify({ seriesId: parseInt(seriesId), rating, text })
                });
                showToast('Review submitted successfully!');
                reviewModal.classList.remove('show');
                // Refresh series details
                await showSeriesDetails(seriesId);
            } catch (error) {
                showToast('Failed to submit review: ' + error.message, 'error');
            }
        });
    }

    // Reset form
    document.getElementById('reviewRating').value = 5;
    document.getElementById('reviewText').value = '';
    reviewModal.querySelector('#ratingInput').querySelectorAll('span').forEach(s => s.style.opacity = '1');

    reviewModal.classList.add('show');
}

function showEditReviewForm(review) {
    let editModal = document.getElementById('editReviewModal');
    if (!editModal) {
        editModal = document.createElement('div');
        editModal.id = 'editReviewModal';
        editModal.className = 'modal';
        editModal.innerHTML = `
            <div class="modal-content auth-modal">
                <button class="modal-close" onclick="document.getElementById('editReviewModal').classList.remove('show')">&times;</button>
                <h2>Edit Review</h2>
                <form id="editReviewForm" class="auth-form" style="display: block;">
                    <input type="hidden" id="editReviewId">
                    <div class="form-group">
                        <label>Rating</label>
                        <div class="rating-input" id="editRatingInput">
                            <span data-rating="1">★</span>
                            <span data-rating="2">★</span>
                            <span data-rating="3">★</span>
                            <span data-rating="4">★</span>
                            <span data-rating="5">★</span>
                        </div>
                        <input type="hidden" id="editReviewRating" value="5">
                    </div>
                    <div class="form-group">
                        <textarea id="editReviewText" placeholder="Write your review..." rows="4" style="width: 100%; resize: vertical;"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Update Review</button>
                </form>
            </div>
        `;
        document.body.appendChild(editModal);

        const ratingInput = editModal.querySelector('#editRatingInput');
        ratingInput.querySelectorAll('span').forEach(star => {
            star.style.cssText = 'cursor: pointer; font-size: 24px; color: #ffd700;';
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                document.getElementById('editReviewRating').value = rating;
                ratingInput.querySelectorAll('span').forEach((s, i) => {
                    s.style.opacity = i < rating ? '1' : '0.3';
                });
            });
        });

        editModal.querySelector('#editReviewForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const feedbackId = document.getElementById('editReviewId').value;
            const rating = parseFloat(document.getElementById('editReviewRating').value);
            const text = document.getElementById('editReviewText').value;

            try {
                await apiRequest(`/feedback/${feedbackId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ rating, text })
                });
                showToast('Review updated successfully!');
                editModal.classList.remove('show');
                const seriesId = document.getElementById('seriesModal').dataset.seriesId;
                await showSeriesDetails(seriesId);
            } catch (error) {
                showToast('Failed to update review: ' + error.message, 'error');
            }
        });
    }

    // Populate form
    document.getElementById('editReviewId').value = review.FEEDBACK_ID;
    document.getElementById('editReviewRating').value = review.RATING;
    document.getElementById('editReviewText').value = review.TEXT || '';
    
    const ratingInput = editModal.querySelector('#editRatingInput');
    ratingInput.querySelectorAll('span').forEach((s, i) => {
        s.style.opacity = i < review.RATING ? '1' : '0.3';
    });

    editModal.classList.add('show');
}

async function deleteReview(feedbackId) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
        await apiRequest(`/feedback/${feedbackId}`, { method: 'DELETE' });
        showToast('Review deleted successfully!');
        const seriesId = document.getElementById('seriesModal').dataset.seriesId;
        await showSeriesDetails(seriesId);
    } catch (error) {
        showToast('Failed to delete review: ' + error.message, 'error');
    }
}

// Admin Functions
function showAdminPanel() {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'employee')) {
        showToast('Access denied', 'error');
        return;
    }

    let adminModal = document.getElementById('adminModal');
    if (!adminModal) {
        adminModal = document.createElement('div');
        adminModal.id = 'adminModal';
        adminModal.className = 'modal';
        adminModal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <button class="modal-close" onclick="document.getElementById('adminModal').classList.remove('show')">&times;</button>
                <div class="modal-header">
                    <h2>Admin Panel</h2>
                </div>
                <div class="modal-body">
                    <div class="admin-tabs">
                        <button class="admin-tab active" data-tab="series">Series</button>
                        <button class="admin-tab" data-tab="episodes">Episodes</button>
                    </div>
                    <div id="adminContent"></div>
                </div>
            </div>
        `;
        document.body.appendChild(adminModal);

        // Tab switching
        adminModal.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                adminModal.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                loadAdminTab(tab.dataset.tab);
            });
        });
    }

    adminModal.classList.add('show');
    loadAdminTab('series');
}

async function loadAdminTab(tab) {
    const content = document.getElementById('adminContent');
    
    if (tab === 'series') {
        try {
            const series = await apiRequest('/series');
            content.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <button class="btn btn-primary" onclick="showCreateSeriesForm()">+ Add New Series</button>
                </div>
                <div class="admin-list">
                    ${series.map(s => `
                        <div class="admin-item">
                            <div class="admin-item-info">
                                <strong>${escapeHtml(s.NAME)}</strong>
                                <span>${s.NUMBER_OF_EPISODES || 0} episodes • ${s.genres || 'No genre'}</span>
                            </div>
                            <div class="admin-item-actions">
                                <button class="btn-small" onclick="showEditSeriesForm(${JSON.stringify(s).replace(/"/g, '&quot;')})">Edit</button>
                                <button class="btn-small btn-danger" onclick="deleteSeries(${s.SERIES_ID})">Delete</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            content.innerHTML = `<p style="color: red;">Failed to load series: ${error.message}</p>`;
        }
    } else if (tab === 'episodes') {
        try {
            const series = await apiRequest('/series');
            content.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <select id="adminSeriesSelect" style="padding: 10px; border-radius: 8px; background: var(--secondary-color); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.2);">
                        <option value="">Select a series...</option>
                        ${series.map(s => `<option value="${s.SERIES_ID}">${escapeHtml(s.NAME)}</option>`).join('')}
                    </select>
                    <button class="btn btn-primary" onclick="showCreateEpisodeForm()" style="margin-left: 10px;">+ Add Episode</button>
                </div>
                <div id="episodesAdminList"></div>
            `;

            document.getElementById('adminSeriesSelect').addEventListener('change', async (e) => {
                if (!e.target.value) {
                    document.getElementById('episodesAdminList').innerHTML = '';
                    return;
                }
                await loadAdminEpisodes(e.target.value);
            });
        } catch (error) {
            content.innerHTML = `<p style="color: red;">Failed to load: ${error.message}</p>`;
        }
    }
}

async function loadAdminEpisodes(seriesId) {
    try {
        const episodes = await apiRequest(`/episodes/series/${seriesId}`);
        const list = document.getElementById('episodesAdminList');
        list.innerHTML = episodes.length ? episodes.map(ep => `
            <div class="admin-item">
                <div class="admin-item-info">
                    <strong>E${ep.EPISODE_NO}: ${escapeHtml(ep.EPISODE_TITLE || 'Untitled')}</strong>
                    <span>${ep.DURATION_MIN || 0} min • ${ep.VIEWERS || 0} views</span>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-small" onclick="showEditEpisodeForm(${JSON.stringify(ep).replace(/"/g, '&quot;')})">Edit</button>
                    <button class="btn-small btn-danger" onclick="deleteEpisode(${ep.EPISODE_ID})">Delete</button>
                </div>
            </div>
        `).join('') : '<p style="color: var(--text-secondary);">No episodes found</p>';
    } catch (error) {
        document.getElementById('episodesAdminList').innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
}

// Series CRUD
window.showCreateSeriesForm = function() {
    showSeriesForm(null);
};

window.showEditSeriesForm = function(series) {
    showSeriesForm(series);
};

function showSeriesForm(series) {
    let formModal = document.getElementById('seriesFormModal');
    if (!formModal) {
        formModal = document.createElement('div');
        formModal.id = 'seriesFormModal';
        formModal.className = 'modal';
        formModal.innerHTML = `
            <div class="modal-content auth-modal" style="max-width: 500px;">
                <button class="modal-close" onclick="document.getElementById('seriesFormModal').classList.remove('show')">&times;</button>
                <h2 id="seriesFormTitle">Add Series</h2>
                <form id="seriesForm" class="auth-form" style="display: block;">
                    <input type="hidden" id="seriesFormId">
                    <div class="form-group">
                        <input type="text" id="seriesName" placeholder="Series Name" required>
                    </div>
                    <div class="form-group">
                        <input type="text" id="seriesCountry" placeholder="Country" required>
                    </div>
                    <div class="form-group">
                        <input type="date" id="seriesReleaseDate" placeholder="Release Date">
                    </div>
                    <div class="form-group">
                        <input type="text" id="seriesGenres" placeholder="Genres (comma-separated)">
                    </div>
                    <div class="form-group">
                        <textarea id="seriesDescription" placeholder="Description" rows="3" style="width: 100%;"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Save Series</button>
                </form>
            </div>
        `;
        document.body.appendChild(formModal);

        document.getElementById('seriesForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('seriesFormId').value;
            const data = {
                name: document.getElementById('seriesName').value,
                countryOfRelease: document.getElementById('seriesCountry').value,
                releaseDate: document.getElementById('seriesReleaseDate').value || null,
                genres: document.getElementById('seriesGenres').value.split(',').map(g => g.trim()).filter(g => g),
                description: document.getElementById('seriesDescription').value
            };

            try {
                if (id) {
                    await apiRequest(`/series/${id}`, { method: 'PUT', body: JSON.stringify(data) });
                    showToast('Series updated!');
                } else {
                    await apiRequest('/series', { method: 'POST', body: JSON.stringify(data) });
                    showToast('Series created!');
                }
                formModal.classList.remove('show');
                loadAdminTab('series');
                loadAllSeries();
            } catch (error) {
                showToast('Error: ' + error.message, 'error');
            }
        });
    }

    document.getElementById('seriesFormTitle').textContent = series ? 'Edit Series' : 'Add Series';
    document.getElementById('seriesFormId').value = series?.SERIES_ID || '';
    document.getElementById('seriesName').value = series?.NAME || '';
    document.getElementById('seriesCountry').value = series?.COUNTRY_OF_RELEASE || '';
    document.getElementById('seriesReleaseDate').value = series?.RELEASE_DATE ? new Date(series.RELEASE_DATE).toISOString().split('T')[0] : '';
    document.getElementById('seriesGenres').value = series?.genres || '';
    document.getElementById('seriesDescription').value = series?.DESCRIPTION || '';

    formModal.classList.add('show');
}

window.deleteSeries = async function(id) {
    if (!confirm('Are you sure? This will delete all episodes and reviews.')) return;
    try {
        await apiRequest(`/series/${id}`, { method: 'DELETE' });
        showToast('Series deleted!');
        loadAdminTab('series');
        loadAllSeries();
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
};

// Episode CRUD
window.showCreateEpisodeForm = function() {
    const seriesId = document.getElementById('adminSeriesSelect')?.value;
    if (!seriesId) {
        showToast('Please select a series first', 'error');
        return;
    }
    showEpisodeForm(null, seriesId);
};

window.showEditEpisodeForm = function(episode) {
    showEpisodeForm(episode, episode.SERIES_ID);
};

function showEpisodeForm(episode, seriesId) {
    let formModal = document.getElementById('episodeFormModal');
    if (!formModal) {
        formModal = document.createElement('div');
        formModal.id = 'episodeFormModal';
        formModal.className = 'modal';
        formModal.innerHTML = `
            <div class="modal-content auth-modal" style="max-width: 500px;">
                <button class="modal-close" onclick="document.getElementById('episodeFormModal').classList.remove('show')">&times;</button>
                <h2 id="episodeFormTitle">Add Episode</h2>
                <form id="episodeForm" class="auth-form" style="display: block;">
                    <input type="hidden" id="episodeFormId">
                    <input type="hidden" id="episodeSeriesId">
                    <div class="form-group">
                        <input type="number" id="episodeNo" placeholder="Episode Number" required min="1">
                    </div>
                    <div class="form-group">
                        <input type="text" id="episodeTitle" placeholder="Episode Title">
                    </div>
                    <div class="form-group">
                        <input type="number" id="episodeDuration" placeholder="Duration (minutes)" min="1">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Save Episode</button>
                </form>
            </div>
        `;
        document.body.appendChild(formModal);

        document.getElementById('episodeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('episodeFormId').value;
            const data = {
                seriesId: parseInt(document.getElementById('episodeSeriesId').value),
                episodeNo: parseInt(document.getElementById('episodeNo').value),
                episodeTitle: document.getElementById('episodeTitle').value || null,
                durationMin: parseInt(document.getElementById('episodeDuration').value) || null
            };

            try {
                if (id) {
                    await apiRequest(`/episodes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
                    showToast('Episode updated!');
                } else {
                    await apiRequest('/episodes', { method: 'POST', body: JSON.stringify(data) });
                    showToast('Episode created!');
                }
                formModal.classList.remove('show');
                loadAdminEpisodes(data.seriesId);
            } catch (error) {
                showToast('Error: ' + error.message, 'error');
            }
        });
    }

    document.getElementById('episodeFormTitle').textContent = episode ? 'Edit Episode' : 'Add Episode';
    document.getElementById('episodeFormId').value = episode?.EPISODE_ID || '';
    document.getElementById('episodeSeriesId').value = seriesId;
    document.getElementById('episodeNo').value = episode?.EPISODE_NO || '';
    document.getElementById('episodeTitle').value = episode?.EPISODE_TITLE || '';
    document.getElementById('episodeDuration').value = episode?.DURATION_MIN || '';

    formModal.classList.add('show');
}

window.deleteEpisode = async function(id) {
    if (!confirm('Are you sure you want to delete this episode?')) return;
    const seriesId = document.getElementById('adminSeriesSelect').value;
    try {
        await apiRequest(`/episodes/${id}`, { method: 'DELETE' });
        showToast('Episode deleted!');
        loadAdminEpisodes(seriesId);
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
};

async function playFirstEpisode(seriesId) {
    try {
        const episodes = await apiRequest(`/episodes/series/${seriesId}`);
        if (episodes && episodes.length > 0) {
            playEpisode(episodes[0].EPISODE_ID, seriesId);
        } else {
            showToast('No episodes available');
        }
    } catch (error) {
        showToast('Failed to load episode: ' + error.message, 'error');
    }
}

async function playEpisode(episodeId, seriesId) {
    if (!currentUser) {
        showAuthModal();
        showToast('Please sign in to watch');
        return;
    }

    try {
        const episode = await apiRequest(`/episodes/${episodeId}`);

        document.getElementById('videoTitle').textContent = episode.EPISODE_TITLE || `Episode ${episode.EPISODE_NO}`;
        document.getElementById('videoDescription').textContent = `${episode.seriesName} - Episode ${episode.EPISODE_NO}`;

        document.getElementById('videoModal').classList.add('show');

        // Update watch progress
        setTimeout(() => {
            updateWatchProgress(episodeId, seriesId, 10);
        }, 1000);

        showToast('Video player - In production, this would play the actual episode');
    } catch (error) {
        showToast('Failed to load episode: ' + error.message, 'error');
    }
}

async function updateWatchProgress(episodeId, seriesId, progress) {
    try {
        await apiRequest(`/episodes/${episodeId}/${seriesId}/progress`, {
            method: 'POST',
            body: JSON.stringify({ progress })
        });
    } catch (error) {
        console.error('Failed to update watch progress:', error);
    }
}

// Utility Functions
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show';
    if (type === 'error') {
        toast.style.background = '#dc3545';
    } else {
        toast.style.background = 'var(--secondary-color)';
    }

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
