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

function setupEventListeners() {
    // User menu
    const userBtn = document.getElementById('userBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
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
    document.getElementById('addReviewBtn').addEventListener('click', () => {
        if (!currentUser) {
            showAuthModal();
            showToast('Please sign in to write a review');
            return;
        }
        // Show review form (implement as needed)
        showToast('Review feature coming soon!');
    });

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

    // Check if user needs to login on protected actions
    if (!currentUser) {
        document.getElementById('userName').textContent = 'Sign In';
        userBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showAuthModal();
        });
    }
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
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

        showToast('Welcome back, ' + currentUser.firstName + '!');

        // Reload content
        await loadContinueWatching();
        location.reload();
    } catch (error) {
        showToast('Login failed: ' + error.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const firstName = document.getElementById('registerFirstName').value;
    const lastName = document.getElementById('registerLastName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ firstName, lastName, email, password })
        });

        localStorage.setItem('token', data.token);
        currentUser = data.viewer;

        document.getElementById('userName').textContent = currentUser.firstName;
        document.getElementById('authModal').classList.remove('show');

        showToast('Welcome, ' + currentUser.firstName + '!');
        location.reload();
    } catch (error) {
        showToast('Registration failed: ' + error.message);
    }
}

async function loadCurrentUser() {
    const data = await apiRequest('/auth/me');
    currentUser = data;
    document.getElementById('userName').textContent = currentUser.FIRST_NAME;
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    document.getElementById('userName').textContent = 'Sign In';
    showToast('Signed out successfully');
    location.reload();
}

function showAuthModal() {
    document.getElementById('authModal').classList.add('show');
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
        const series = await apiRequest(`/series/genre/${genre}`);
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

        // Scroll to results
        document.querySelector('#allSeriesCarousel').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showToast('Search failed: ' + error.message);
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
        backdrop.style.backgroundImage = `linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%), url('${series.BANNER_URL}')`;
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
            reviewsList.innerHTML = '<p style="color: var(--text-secondary);">No reviews yet</p>';
        }

        // Play button
        document.getElementById('modalPlayBtn').onclick = () => {
            playFirstEpisode(seriesId);
        };

        // Show modal
        document.getElementById('seriesModal').classList.add('show');
    } catch (error) {
        showToast('Failed to load series details: ' + error.message);
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

    const date = document.createElement('div');
    date.className = 'review-date';
    date.textContent = new Date(review.DATE).toLocaleDateString();

    card.appendChild(header);
    card.appendChild(text);
    card.appendChild(date);

    return card;
}

async function playFirstEpisode(seriesId) {
    try {
        const episodes = await apiRequest(`/episodes/series/${seriesId}`);
        if (episodes && episodes.length > 0) {
            playEpisode(episodes[0].EPISODE_ID, seriesId);
        } else {
            showToast('No episodes available');
        }
    } catch (error) {
        showToast('Failed to load episode: ' + error.message);
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

        // In a real app, you would set the video source here
        // document.getElementById('videoPlayer').src = episode.VIDEO_URL;

        document.getElementById('videoModal').classList.add('show');

        // Update watch progress (simulate)
        setTimeout(() => {
            updateWatchProgress(episodeId, seriesId, 0);
        }, 1000);

        showToast('Video player feature - In production, this would play the actual episode');
    } catch (error) {
        showToast('Failed to load episode: ' + error.message);
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
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
