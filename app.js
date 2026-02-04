// ==========================================
// FAMILIENS KOKEBOK APP v1.0
// Firebase-basert med Google Auth
// Digitaliser gamle kokebøker og oppskrifter
// ==========================================

const APP_VERSION = '1.0.0';

// ===== Firebase Initialization =====
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== Default Categories =====
const DEFAULT_CATEGORIES = [
    { id: 'forrett', name: 'Forretter', icon: '🥗' },
    { id: 'hovedrett', name: 'Hovedretter', icon: '🍽️' },
    { id: 'dessert', name: 'Desserter', icon: '🍰' },
    { id: 'bakst', name: 'Bakst', icon: '🥧' },
    { id: 'supe', name: 'Supper & Gryter', icon: '🍲' },
    { id: 'salat', name: 'Salater', icon: '🥬' },
    { id: 'fisk', name: 'Fisk & Sjømat', icon: '🐟' },
    { id: 'kjott', name: 'Kjøtt', icon: '🥩' },
    { id: 'vegetar', name: 'Vegetar', icon: '🥕' },
    { id: 'drikke', name: 'Drikke', icon: '🍹' },
    { id: 'sylting', name: 'Sylting & Konservering', icon: '🫙' },
    { id: 'jul', name: 'Julemat', icon: '🎄' },
    { id: 'tradisjon', name: 'Tradisjonsmat', icon: '📜' },
    { id: 'annet', name: 'Annet', icon: '📝' }
];

// ===== State =====
const state = {
    user: null,
    categories: [],
    recipes: [],
    books: [],
    settings: {
        darkMode: false,
        fontSize: 'normal'
    },
    currentView: 'dashboardView',
    currentRecipe: null,
    currentBook: null,
    editingRecipe: null,
    editingBook: null,
    tempImages: [],
    tempCoverImage: null,
    searchQuery: '',
    filterCategory: '',
    sortOrder: 'newest',
    // Digital book reader state
    currentBookPages: [],
    currentPageIndex: 0
};

// ===== DOM Helpers =====
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function on(id, event, handler) {
    const el = typeof id === 'string' ? $(id) : id;
    if (el) el.addEventListener(event, handler);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Firestore Helpers =====
function userDoc(collection) {
    if (!state.user) {
        console.warn('userDoc: Ingen bruker pålogget');
        return null;
    }
    return db.collection('users').doc(state.user.uid).collection(collection);
}

async function saveToFirestore(collection, id, data) {
    if (!state.user) {
        console.warn('saveToFirestore: Ingen bruker pålogget');
        return null;
    }
    
    const docData = { ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    
    try {
        const col = userDoc(collection);
        if (!col) return null;
        
        if (id) {
            await col.doc(id).set(docData, { merge: true });
            return id;
        } else {
            docData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            const ref = await col.add(docData);
            return ref.id;
        }
    } catch (e) {
        console.error(`Lagringsfeil (${collection}):`, e.message);
        throw e;
    }
}

async function deleteFromFirestore(collection, id) {
    const col = userDoc(collection);
    if (!col) return false;
    
    try {
        await col.doc(id).delete();
        return true;
    } catch (e) {
        console.error(`Slettefeil (${collection}/${id}):`, e.message);
        return false;
    }
}

async function loadCollection(collection) {
    const col = userDoc(collection);
    if (!col) return [];
    try {
        const snapshot = await col.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.warn(`Kunne ikke laste ${collection}:`, e.message);
        return [];
    }
}

// ===== Auth Functions =====
async function setupAuth() {
    console.log('🔐 Initialiserer autentisering...');
    
    try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    } catch (e) {
        console.warn('Kunne ikke sette persistence:', e);
    }
    
    // Sjekk redirect resultat først (viktig for iOS/Safari)
    try {
        const result = await auth.getRedirectResult();
        if (result && result.user) {
            console.log('✓ Bruker hentet fra redirect');
            state.user = result.user;
        }
    } catch (error) {
        // Ignorer redirect-feil hvis bruker ikke kommer fra redirect
        if (error.code !== 'auth/popup-closed-by-user') {
            console.warn('Redirect resultat:', error.code);
        }
    }
    
    // Login button - bruker redirect for bedre kompatibilitet
    on('googleLoginBtn', 'click', async () => {
        const btn = $('googleLoginBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-small"></span> Logger inn...';
        }
        
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        // Bruk redirect - fungerer bedre på mobil og unngår popup-problemer
        try {
            await auth.signInWithRedirect(provider);
        } catch (error) {
            console.error('Login error:', error);
            showToast('Innlogging feilet. Prøv igjen.', 'error');
            resetLoginButton(btn);
        }
    });

    // Auth state listener
    auth.onAuthStateChanged(async (user) => {
        const loginScreen = $('loginScreen');
        const mainApp = $('mainApp');
        const splashScreen = $('splashScreen');
        
        if (user) {
            console.log('✓ Bruker pålogget:', user.email);
            state.user = user;
            if (loginScreen) loginScreen.classList.add('hidden');
            if (splashScreen) splashScreen.classList.remove('hidden');
            
            // Vent litt før initialisering for å sikre at auth er klar
            setTimeout(async () => {
                await initApp();
            }, 100);
        } else {
            console.log('ℹ Ingen bruker innlogget');
            state.user = null;
            if (loginScreen) loginScreen.classList.remove('hidden');
            if (mainApp) mainApp.classList.add('hidden');
            if (splashScreen) splashScreen.classList.add('hidden');
        }
    });
}

function resetLoginButton(btn) {
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Logg inn med Google`;
    }
}

async function doSignOut() {
    try {
        await auth.signOut();
        state.user = null;
        state.categories = [];
        state.recipes = [];
        state.books = [];
        showToast('Logget ut');
        setTimeout(() => window.location.reload(), 300);
    } catch (error) {
        showToast('Kunne ikke logge ut', 'error');
    }
}

// ===== Image Helpers =====
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function compressImage(file, maxWidth = 1600, maxHeight = 1600, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            
            img.onerror = () => reject(new Error('Kunne ikke laste bildet'));
            img.src = e.target.result;
        };
        
        reader.onerror = () => reject(new Error('Kunne ikke lese filen'));
        reader.readAsDataURL(file);
    });
}

// ===== Initialize App =====
async function initApp() {
    const splash = $('splashScreen');
    console.log('🚀 Initialiserer app...');
    
    try {
        await loadAllData();
        setupEventListeners();
        renderDashboard();
        applySettings();
        updateUserInfo();
        
        setTimeout(() => {
            if (splash) splash.classList.add('hidden');
            const mainApp = $('mainApp');
            if (mainApp) mainApp.classList.remove('hidden');
            console.log('✓ App klar!');
        }, 500);
        
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log('✓ Service Worker registrert'))
                .catch(err => console.warn('SW registrering feilet:', err));
        }
        
    } catch (error) {
        console.error('Initialiseringsfeil:', error);
        if (splash) splash.classList.add('hidden');
        const mainApp = $('mainApp');
        if (mainApp) mainApp.classList.remove('hidden');
        
        // Vis appen selv om det er feil - bruker kan fortsatt bruke den
        renderDashboard();
        showToast('Noen data kunne ikke lastes. Prøv å oppdatere siden.', 'warning');
    }
}

async function loadAllData() {
    console.log('📦 Laster data...');
    
    // Sjekk at bruker er pålogget
    if (!state.user) {
        console.warn('Ingen bruker - kan ikke laste data');
        return;
    }
    
    try {
        // Load categories
        state.categories = await loadCollection('categories');
        console.log(`  ✓ Kategorier: ${state.categories.length}`);
        
        // Add default categories if missing
        const existingCatIds = state.categories.map(c => c.id);
        const missingCategories = DEFAULT_CATEGORIES.filter(c => !existingCatIds.includes(c.id));
        
        if (missingCategories.length > 0) {
            console.log(`  + Legger til ${missingCategories.length} standard-kategorier...`);
            for (const cat of missingCategories) {
                try {
                    await saveToFirestore('categories', cat.id, cat);
                    state.categories.push(cat);
                } catch (e) {
                    console.warn(`  Kunne ikke lagre kategori ${cat.id}:`, e.message);
                }
            }
        }
        
        // Load recipes and books
        state.recipes = await loadCollection('recipes');
        console.log(`  ✓ Oppskrifter: ${state.recipes.length}`);
        
        state.books = await loadCollection('books');
        console.log(`  ✓ Bøker: ${state.books.length}`);
        
        // Load settings
        const settings = await loadCollection('settings');
        if (settings.length > 0) {
            state.settings = { ...state.settings, ...settings[0] };
        }
        
        console.log('📦 Data lastet ferdig!');
    } catch (error) {
        console.error('Feil ved lasting av data:', error);
        // Fortsett med tomme arrays - appen vil fortsatt fungere
        if (state.categories.length === 0) {
            state.categories = [...DEFAULT_CATEGORIES];
        }
    }
}

function applySettings() {
    // Dark mode
    if (state.settings.darkMode) {
        document.body.classList.add('dark-mode');
        const toggle = $('darkModeToggle');
        if (toggle) toggle.checked = true;
    }
    
    // Font size
    document.body.classList.remove('font-small', 'font-large');
    if (state.settings.fontSize === 'small') {
        document.body.classList.add('font-small');
    } else if (state.settings.fontSize === 'large') {
        document.body.classList.add('font-large');
    }
    
    const fontSelect = $('fontSizeSelect');
    if (fontSelect) fontSelect.value = state.settings.fontSize;
}

function updateUserInfo() {
    const avatar = $('userAvatar');
    const name = $('userName');
    const email = $('userEmail');
    
    if (state.user) {
        if (avatar) avatar.src = state.user.photoURL || '';
        if (name) name.textContent = state.user.displayName || 'Bruker';
        if (email) email.textContent = state.user.email || '';
    }
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Navigation
    $$('.nav-btn[data-view]').forEach(btn => {
        on(btn, 'click', () => {
            const view = btn.dataset.view;
            navigateTo(view);
        });
    });
    
    // Back buttons
    $$('.back-btn[data-view]').forEach(btn => {
        on(btn, 'click', () => navigateTo(btn.dataset.view));
    });
    
    // Cancel edit buttons
    $$('.cancel-edit').forEach(btn => {
        on(btn, 'click', () => {
            state.editingRecipe = null;
            state.editingBook = null;
            state.tempImages = [];
            state.tempCoverImage = null;
            navigateTo(state.currentView === 'recipeEditorView' ? 'dashboardView' : 'bookListView');
        });
    });
    
    // Header buttons
    on('homeBtn', 'click', () => navigateTo('dashboardView'));
    on('profileBtn', 'click', () => navigateTo('settingsView'));
    on('menuBtn', 'click', () => toggleSideMenu(true));
    on('closeMenuBtn', 'click', () => toggleSideMenu(false));
    
    // Side menu overlay
    const menuOverlay = document.querySelector('.side-menu-overlay');
    if (menuOverlay) {
        on(menuOverlay, 'click', () => toggleSideMenu(false));
    }
    
    // Side menu items
    $$('.menu-item[data-view]').forEach(item => {
        on(item, 'click', () => {
            navigateTo(item.dataset.view);
            toggleSideMenu(false);
        });
    });
    
    // Quick actions
    on('addRecipeBtn', 'click', () => openRecipeEditor());
    on('addBookBtn', 'click', () => openBookEditor());
    on('scanBtn', 'click', () => openCameraForRecipe());
    on('navAddBtn', 'click', () => showAddMenu());
    
    // Dashboard buttons
    on('manageCategoriesBtn', 'click', () => navigateTo('categoriesView'));
    on('viewAllRecipesBtn', 'click', () => {
        state.filterCategory = '';
        navigateTo('recipeListView');
    });
    on('viewAllBooksBtn', 'click', () => navigateTo('bookListView'));
    
    // Search
    const searchInput = $('searchInput');
    if (searchInput) {
        on(searchInput, 'input', (e) => {
            state.searchQuery = e.target.value;
            const clearBtn = $('clearSearch');
            if (clearBtn) {
                clearBtn.classList.toggle('hidden', !state.searchQuery);
            }
            if (state.currentView === 'recipeListView') {
                renderRecipeList();
            } else if (state.currentView === 'dashboardView') {
                // Could add live search to dashboard
            }
        });
    }
    
    on('clearSearch', 'click', () => {
        const input = $('searchInput');
        if (input) {
            input.value = '';
            state.searchQuery = '';
            $('clearSearch').classList.add('hidden');
            if (state.currentView === 'recipeListView') {
                renderRecipeList();
            }
        }
    });
    
    // Filters
    on('categoryFilter', 'change', (e) => {
        state.filterCategory = e.target.value;
        renderRecipeList();
    });
    
    on('sortFilter', 'change', (e) => {
        state.sortOrder = e.target.value;
        renderRecipeList();
    });
    
    // Recipe editor
    on('saveRecipeBtn', 'click', saveRecipe);
    on('uploadImageBtn', 'click', () => $('imageInput').click());
    on('cameraBtn', 'click', () => $('cameraInput').click());
    on('imageInput', 'change', handleImageUpload);
    on('cameraInput', 'change', handleImageUpload);
    
    // Recipe view actions
    on('editRecipeBtn', 'click', () => {
        if (state.currentRecipe) {
            openRecipeEditor(state.currentRecipe);
        }
    });
    on('shareRecipeBtn', 'click', shareRecipe);
    on('deleteRecipeBtn', 'click', deleteCurrentRecipe);
    
    // Book editor
    on('saveBookBtn', 'click', saveBook);
    on('uploadBookCoverBtn', 'click', () => $('bookCoverInput').click());
    on('cameraBookCoverBtn', 'click', () => $('bookCameraInput').click());
    on('bookCoverInput', 'change', handleBookCoverUpload);
    on('bookCameraInput', 'change', handleBookCoverUpload);
    
    // Book view actions
    on('editBookBtn', 'click', () => {
        if (state.currentBook) {
            openBookEditor(state.currentBook);
        }
    });
    on('exportBookBtn', 'click', exportBook);
    on('deleteBookBtn', 'click', deleteCurrentBook);
    
    // Digital book reader
    on('prevPageBtn', 'click', () => navigateBookPage(-1));
    on('nextPageBtn', 'click', () => navigateBookPage(1));
    
    // Categories
    on('addCategoryBtn', 'click', showAddCategoryModal);
    
    // Settings
    on('darkModeToggle', 'change', (e) => {
        state.settings.darkMode = e.target.checked;
        document.body.classList.toggle('dark-mode', e.target.checked);
        saveSettings();
    });
    
    on('fontSizeSelect', 'change', (e) => {
        state.settings.fontSize = e.target.value;
        applySettings();
        saveSettings();
    });
    
    on('logoutBtn', 'click', () => {
        showConfirmModal('Logg ut', 'Er du sikker på at du vil logge ut?', doSignOut);
    });
    
    on('exportDataBtn', 'click', exportAllData);
    on('importDataBtn', 'click', () => $('importInput').click());
    on('importInput', 'change', importData);
    
    // Image viewer
    setupImageViewer();
    
    // Modal close
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
        on(modalOverlay, 'click', closeModal);
    }
    on(document.querySelector('.modal-close'), 'click', closeModal);
}

// ===== Navigation =====
function navigateTo(viewId) {
    // Hide all views
    $$('.view').forEach(v => v.classList.add('hidden'));
    
    // Show target view
    const targetView = $(viewId);
    if (targetView) {
        targetView.classList.remove('hidden');
        targetView.classList.add('active');
    }
    
    // Update nav buttons
    $$('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewId);
    });
    
    state.currentView = viewId;
    
    // Render view content
    switch (viewId) {
        case 'dashboardView':
            renderDashboard();
            break;
        case 'recipeListView':
            renderRecipeList();
            break;
        case 'recipeView':
            renderRecipeView();
            break;
        case 'bookListView':
            renderBookList();
            break;
        case 'bookView':
            renderBookView();
            break;
        case 'categoriesView':
            renderCategoriesView();
            break;
        case 'digitalBookView':
            renderDigitalBook();
            break;
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function toggleSideMenu(show) {
    const menu = $('sideMenu');
    if (menu) {
        menu.classList.toggle('hidden', !show);
    }
}

// ===== Dashboard =====
function renderDashboard() {
    updateStats();
    renderCategories();
    renderRecentRecipes();
    renderBooksPreview();
    updateWelcomeMessage();
}

function updateStats() {
    const recipeCount = state.recipes.length;
    const bookCount = state.books.length;
    const categoryCount = state.categories.filter(c => 
        state.recipes.some(r => r.category === c.id)
    ).length;
    const imageCount = state.recipes.reduce((sum, r) => 
        sum + (r.images ? r.images.length : 0), 0
    );
    
    const statRecipes = $('statRecipes');
    const statBooks = $('statBooks');
    const statCategories = $('statCategories');
    const statImages = $('statImages');
    
    if (statRecipes) statRecipes.querySelector('.stat-value').textContent = recipeCount;
    if (statBooks) statBooks.querySelector('.stat-value').textContent = bookCount;
    if (statCategories) statCategories.querySelector('.stat-value').textContent = categoryCount;
    if (statImages) statImages.querySelector('.stat-value').textContent = imageCount;
}

function updateWelcomeMessage() {
    const welcomeStats = $('welcomeStats');
    if (welcomeStats) {
        const count = state.recipes.length;
        if (count === 0) {
            welcomeStats.textContent = 'Start med å legge til din første oppskrift';
        } else if (count === 1) {
            welcomeStats.textContent = 'Du har 1 oppskrift i samlingen din';
        } else {
            welcomeStats.textContent = `Du har ${count} oppskrifter i samlingen din`;
        }
    }
}

function renderCategories() {
    const grid = $('categoriesGrid');
    if (!grid) return;
    
    // Get categories with recipe counts
    const categoriesWithCounts = state.categories.map(cat => ({
        ...cat,
        count: state.recipes.filter(r => r.category === cat.id).length
    })).filter(cat => cat.count > 0 || DEFAULT_CATEGORIES.some(dc => dc.id === cat.id));
    
    // Show top 8 categories
    const topCategories = categoriesWithCounts.slice(0, 8);
    
    grid.innerHTML = topCategories.map(cat => `
        <div class="category-card" data-category="${cat.id}">
            <span class="category-icon">${cat.icon}</span>
            <span class="category-name">${escapeHtml(cat.name)}</span>
            <span class="category-count">${cat.count} oppskrifter</span>
        </div>
    `).join('');
    
    // Add click handlers
    grid.querySelectorAll('.category-card').forEach(card => {
        on(card, 'click', () => {
            state.filterCategory = card.dataset.category;
            navigateTo('recipeListView');
        });
    });
}

function renderRecentRecipes() {
    const container = $('recentRecipes');
    if (!container) return;
    
    // Sort by date and get recent 5
    const recent = [...state.recipes]
        .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        })
        .slice(0, 5);
    
    if (recent.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📝</span>
                <p class="empty-title">Ingen oppskrifter ennå</p>
                <p class="empty-text">Legg til din første oppskrift for å komme i gang</p>
                <button class="empty-btn" onclick="openRecipeEditor()">+ Legg til oppskrift</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recent.map(recipe => createRecipeCard(recipe)).join('');
    
    // Add click handlers
    container.querySelectorAll('.recipe-card').forEach(card => {
        on(card, 'click', () => {
            state.currentRecipe = state.recipes.find(r => r.id === card.dataset.id);
            navigateTo('recipeView');
        });
    });
}

function renderBooksPreview() {
    const grid = $('booksGrid');
    if (!grid) return;
    
    if (state.books.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <span class="empty-icon">📚</span>
                <p class="empty-title">Ingen kokebøker ennå</p>
                <p class="empty-text">Opprett en kokebok for å samle relaterte oppskrifter</p>
                <button class="empty-btn" onclick="openBookEditor()">+ Ny kokebok</button>
            </div>
        `;
        return;
    }
    
    // Show up to 4 books
    const booksToShow = state.books.slice(0, 4);
    
    grid.innerHTML = booksToShow.map(book => createBookCard(book)).join('');
    
    // Add click handlers
    grid.querySelectorAll('.book-card').forEach(card => {
        on(card, 'click', () => {
            state.currentBook = state.books.find(b => b.id === card.dataset.id);
            navigateTo('bookView');
        });
    });
}

// ===== Recipe List =====
function renderRecipeList() {
    const container = $('allRecipesList');
    const title = $('recipeListTitle');
    const categoryFilter = $('categoryFilter');
    
    if (!container) return;
    
    // Update title
    if (title) {
        if (state.filterCategory) {
            const cat = state.categories.find(c => c.id === state.filterCategory);
            title.textContent = cat ? `${cat.icon} ${cat.name}` : 'Oppskrifter';
        } else {
            title.textContent = 'Alle Oppskrifter';
        }
    }
    
    // Populate category filter
    if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="">Alle kategorier</option>' +
            state.categories.map(c => 
                `<option value="${c.id}" ${c.id === state.filterCategory ? 'selected' : ''}>${c.icon} ${c.name}</option>`
            ).join('');
    }
    
    // Filter and sort recipes
    let filtered = [...state.recipes];
    
    // Filter by category
    if (state.filterCategory) {
        filtered = filtered.filter(r => r.category === state.filterCategory);
    }
    
    // Filter by search
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(r => 
            r.name?.toLowerCase().includes(query) ||
            r.source?.toLowerCase().includes(query) ||
            r.ingredients?.toLowerCase().includes(query) ||
            r.tags?.some(t => t.toLowerCase().includes(query))
        );
    }
    
    // Sort
    filtered.sort((a, b) => {
        switch (state.sortOrder) {
            case 'oldest':
                const dateA1 = a.createdAt?.toDate?.() || new Date(0);
                const dateB1 = b.createdAt?.toDate?.() || new Date(0);
                return dateA1 - dateB1;
            case 'name':
                return (a.name || '').localeCompare(b.name || '');
            case 'newest':
            default:
                const dateA2 = a.createdAt?.toDate?.() || new Date(0);
                const dateB2 = b.createdAt?.toDate?.() || new Date(0);
                return dateB2 - dateA2;
        }
    });
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🔍</span>
                <p class="empty-title">Ingen oppskrifter funnet</p>
                <p class="empty-text">${state.searchQuery ? 'Prøv et annet søkeord' : 'Legg til din første oppskrift'}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(recipe => createRecipeCard(recipe)).join('');
    
    // Add click handlers
    container.querySelectorAll('.recipe-card').forEach(card => {
        on(card, 'click', () => {
            state.currentRecipe = state.recipes.find(r => r.id === card.dataset.id);
            navigateTo('recipeView');
        });
    });
}

function createRecipeCard(recipe) {
    const category = state.categories.find(c => c.id === recipe.category);
    const thumbnail = recipe.images && recipe.images.length > 0 
        ? `<img src="${recipe.images[0]}" class="recipe-thumbnail" alt="${escapeHtml(recipe.name)}">`
        : `<div class="recipe-thumbnail placeholder">${category?.icon || '📝'}</div>`;
    
    const tags = recipe.tags && recipe.tags.length > 0
        ? `<div class="recipe-tags">${recipe.tags.slice(0, 3).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`
        : '';
    
    return `
        <div class="recipe-card" data-id="${recipe.id}">
            ${thumbnail}
            <div class="recipe-info">
                <div class="recipe-title">${escapeHtml(recipe.name)}</div>
                <div class="recipe-meta">${category ? category.icon + ' ' + category.name : ''} ${recipe.source ? '• ' + escapeHtml(recipe.source) : ''}</div>
                ${tags}
            </div>
        </div>
    `;
}

// ===== Recipe View =====
function renderRecipeView() {
    const container = $('recipeContent');
    if (!container || !state.currentRecipe) return;
    
    const recipe = state.currentRecipe;
    const category = state.categories.find(c => c.id === recipe.category);
    const book = recipe.bookId ? state.books.find(b => b.id === recipe.bookId) : null;
    
    // Images gallery
    let imagesHtml = '';
    if (recipe.images && recipe.images.length > 0) {
        imagesHtml = `
            <div class="recipe-images-gallery">
                ${recipe.images.map((img, i) => 
                    `<img src="${img}" class="gallery-image" data-index="${i}" alt="Oppskriftsbilde ${i + 1}">`
                ).join('')}
            </div>
        `;
    }
    
    // Details
    const details = [];
    if (recipe.servings) details.push(`<div class="detail-item">👥 ${escapeHtml(recipe.servings)}</div>`);
    if (recipe.prepTime) details.push(`<div class="detail-item">⏱️ ${escapeHtml(recipe.prepTime)}</div>`);
    if (category) details.push(`<div class="detail-item">${category.icon} ${category.name}</div>`);
    if (book) details.push(`<div class="detail-item">📚 ${escapeHtml(book.name)}</div>`);
    
    container.innerHTML = `
        <div class="recipe-header">
            <h1>${escapeHtml(recipe.name)}</h1>
            ${recipe.source ? `<p class="recipe-source">Fra: ${escapeHtml(recipe.source)}</p>` : ''}
        </div>
        
        ${imagesHtml}
        
        ${details.length > 0 ? `<div class="recipe-details">${details.join('')}</div>` : ''}
        
        ${recipe.ingredients ? `
            <div class="recipe-section">
                <h3>🥄 Ingredienser</h3>
                <pre>${escapeHtml(recipe.ingredients)}</pre>
            </div>
        ` : ''}
        
        ${recipe.instructions ? `
            <div class="recipe-section">
                <h3>👩‍🍳 Fremgangsmåte</h3>
                <pre>${escapeHtml(recipe.instructions)}</pre>
            </div>
        ` : ''}
        
        ${recipe.notes ? `
            <div class="recipe-section">
                <h3>📝 Notater</h3>
                <p>${escapeHtml(recipe.notes)}</p>
            </div>
        ` : ''}
        
        ${recipe.tags && recipe.tags.length > 0 ? `
            <div class="recipe-tags" style="margin-top: 16px;">
                ${recipe.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
            </div>
        ` : ''}
    `;
    
    // Add image click handlers for viewer
    container.querySelectorAll('.gallery-image').forEach(img => {
        on(img, 'click', () => {
            openImageViewer(recipe.images, parseInt(img.dataset.index));
        });
    });
}

// ===== Recipe Editor =====
function openRecipeEditor(recipe = null) {
    state.editingRecipe = recipe;
    state.tempImages = recipe?.images ? [...recipe.images] : [];
    
    // Update title
    const title = $('editorTitle');
    if (title) {
        title.textContent = recipe ? 'Rediger Oppskrift' : 'Ny Oppskrift';
    }
    
    // Populate form
    $('recipeName').value = recipe?.name || '';
    $('recipeSource').value = recipe?.source || '';
    $('recipeIngredients').value = recipe?.ingredients || '';
    $('recipeInstructions').value = recipe?.instructions || '';
    $('recipeServings').value = recipe?.servings || '';
    $('recipePrepTime').value = recipe?.prepTime || '';
    $('recipeNotes').value = recipe?.notes || '';
    $('recipeTags').value = recipe?.tags ? recipe.tags.join(', ') : '';
    
    // Populate category select
    const categorySelect = $('recipeCategory');
    categorySelect.innerHTML = '<option value="">Velg kategori...</option>' +
        state.categories.map(c => 
            `<option value="${c.id}" ${c.id === recipe?.category ? 'selected' : ''}>${c.icon} ${c.name}</option>`
        ).join('');
    
    // Populate book select
    const bookSelect = $('recipeBook');
    bookSelect.innerHTML = '<option value="">Ingen bok valgt</option>' +
        state.books.map(b => 
            `<option value="${b.id}" ${b.id === recipe?.bookId ? 'selected' : ''}>📚 ${escapeHtml(b.name)}</option>`
        ).join('');
    
    // Render existing images
    renderTempImages();
    
    navigateTo('recipeEditorView');
}

function renderTempImages() {
    const container = $('originalImagesContainer');
    if (!container) return;
    
    if (state.tempImages.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = state.tempImages.map((img, i) => `
        <div class="image-preview">
            <img src="${img}" alt="Bilde ${i + 1}">
            <button type="button" class="remove-image" data-index="${i}">✕</button>
        </div>
    `).join('');
    
    // Add remove handlers
    container.querySelectorAll('.remove-image').forEach(btn => {
        on(btn, 'click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            state.tempImages.splice(index, 1);
            renderTempImages();
        });
    });
    
    // Add click to view
    container.querySelectorAll('.image-preview img').forEach((img, i) => {
        on(img, 'click', () => openImageViewer(state.tempImages, i));
    });
}

async function handleImageUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    showToast('Behandler bilder...');
    
    for (const file of files) {
        try {
            const compressed = await compressImage(file);
            state.tempImages.push(compressed);
        } catch (err) {
            console.error('Image compression error:', err);
            showToast('Kunne ikke behandle bilde', 'error');
        }
    }
    
    renderTempImages();
    e.target.value = '';
    showToast('Bilder lagt til', 'success');
}

async function saveRecipe() {
    const name = $('recipeName').value.trim();
    if (!name) {
        showToast('Oppskriften må ha et navn', 'error');
        return;
    }
    
    const recipe = {
        name,
        category: $('recipeCategory').value,
        bookId: $('recipeBook').value || null,
        source: $('recipeSource').value.trim(),
        ingredients: $('recipeIngredients').value.trim(),
        instructions: $('recipeInstructions').value.trim(),
        servings: $('recipeServings').value.trim(),
        prepTime: $('recipePrepTime').value.trim(),
        notes: $('recipeNotes').value.trim(),
        tags: $('recipeTags').value.split(',').map(t => t.trim()).filter(t => t),
        images: state.tempImages
    };
    
    try {
        const id = await saveToFirestore('recipes', state.editingRecipe?.id, recipe);
        
        // Update local state
        if (state.editingRecipe) {
            const index = state.recipes.findIndex(r => r.id === state.editingRecipe.id);
            if (index !== -1) {
                state.recipes[index] = { ...state.recipes[index], ...recipe };
            }
        } else {
            state.recipes.push({ id, ...recipe, createdAt: { toDate: () => new Date() } });
        }
        
        state.editingRecipe = null;
        state.tempImages = [];
        
        showToast('Oppskrift lagret!', 'success');
        navigateTo('dashboardView');
        
    } catch (err) {
        console.error('Save error:', err);
        showToast('Kunne ikke lagre oppskriften', 'error');
    }
}

function openCameraForRecipe() {
    openRecipeEditor();
    setTimeout(() => {
        $('cameraInput').click();
    }, 300);
}

async function shareRecipe() {
    if (!state.currentRecipe) return;
    
    const recipe = state.currentRecipe;
    const text = `${recipe.name}\n\nIngredienser:\n${recipe.ingredients || 'Ikke angitt'}\n\nFremgangsmåte:\n${recipe.instructions || 'Ikke angitt'}`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: recipe.name,
                text: text
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                copyToClipboard(text);
            }
        }
    } else {
        copyToClipboard(text);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Kopiert til utklippstavlen', 'success');
    }).catch(() => {
        showToast('Kunne ikke kopiere', 'error');
    });
}

function deleteCurrentRecipe() {
    if (!state.currentRecipe) return;
    
    showConfirmModal(
        'Slett oppskrift',
        `Er du sikker på at du vil slette "${state.currentRecipe.name}"?`,
        async () => {
            try {
                await deleteFromFirestore('recipes', state.currentRecipe.id);
                state.recipes = state.recipes.filter(r => r.id !== state.currentRecipe.id);
                state.currentRecipe = null;
                showToast('Oppskrift slettet', 'success');
                navigateTo('recipeListView');
            } catch (err) {
                showToast('Kunne ikke slette oppskriften', 'error');
            }
        }
    );
}

// ===== Book List =====
function renderBookList() {
    const container = $('allBooksList');
    if (!container) return;
    
    if (state.books.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📚</span>
                <p class="empty-title">Ingen kokebøker ennå</p>
                <p class="empty-text">Opprett en kokebok for å samle relaterte oppskrifter</p>
                <button class="empty-btn" onclick="openBookEditor()">+ Ny kokebok</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="books-grid">
            ${state.books.map(book => createBookCard(book)).join('')}
        </div>
    `;
    
    // Add click handlers
    container.querySelectorAll('.book-card').forEach(card => {
        on(card, 'click', () => {
            state.currentBook = state.books.find(b => b.id === card.dataset.id);
            navigateTo('bookView');
        });
    });
}

function createBookCard(book) {
    const recipeCount = state.recipes.filter(r => r.bookId === book.id).length;
    const cover = book.coverImage 
        ? `<img src="${book.coverImage}" class="book-cover" alt="${escapeHtml(book.name)}">`
        : `<div class="book-cover placeholder">📚</div>`;
    
    return `
        <div class="book-card" data-id="${book.id}">
            ${cover}
            <div class="book-info">
                <div class="book-title">${escapeHtml(book.name)}</div>
                <div class="book-meta">${recipeCount} oppskrifter</div>
            </div>
        </div>
    `;
}

// ===== Book View =====
function renderBookView() {
    const container = $('bookContent');
    if (!container || !state.currentBook) return;
    
    const book = state.currentBook;
    const bookRecipes = state.recipes.filter(r => r.bookId === book.id);
    
    const cover = book.coverImage
        ? `<img src="${book.coverImage}" class="book-cover-large" alt="${escapeHtml(book.name)}">`
        : '';
    
    container.innerHTML = `
        <div class="book-header">
            ${cover}
            <h1>${escapeHtml(book.name)}</h1>
            ${book.owner ? `<p class="book-owner">${escapeHtml(book.owner)}</p>` : ''}
            ${book.year ? `<p class="book-meta">📅 ${escapeHtml(book.year)}</p>` : ''}
            ${book.description ? `<p class="book-description">${escapeHtml(book.description)}</p>` : ''}
        </div>
        
        <div class="book-actions">
            <button class="book-action-btn" id="openDigitalBookBtn">
                <span>📖</span> Les som digital bok
            </button>
            <button class="book-action-btn" id="addRecipeToBookBtn">
                <span>➕</span> Legg til oppskrift
            </button>
        </div>
        
        <div class="book-recipes-section">
            <h3>📝 Oppskrifter i denne boken (${bookRecipes.length})</h3>
            ${bookRecipes.length > 0 
                ? `<div class="recipes-list">${bookRecipes.map(r => createRecipeCard(r)).join('')}</div>`
                : '<p class="empty-text" style="text-align: center; padding: 24px;">Ingen oppskrifter i denne boken ennå</p>'
            }
        </div>
    `;
    
    // Digital book button
    on($('openDigitalBookBtn'), 'click', () => {
        if (bookRecipes.length === 0) {
            showToast('Boken har ingen oppskrifter ennå', 'warning');
            return;
        }
        prepareDigitalBook(book, bookRecipes);
        navigateTo('digitalBookView');
    });
    
    // Add recipe button
    on($('addRecipeToBookBtn'), 'click', () => {
        openRecipeEditor();
        setTimeout(() => {
            $('recipeBook').value = book.id;
        }, 100);
    });
    
    // Recipe click handlers
    container.querySelectorAll('.recipe-card').forEach(card => {
        on(card, 'click', () => {
            state.currentRecipe = state.recipes.find(r => r.id === card.dataset.id);
            navigateTo('recipeView');
        });
    });
}

// ===== Book Editor =====
function openBookEditor(book = null) {
    state.editingBook = book;
    state.tempCoverImage = book?.coverImage || null;
    
    // Update title
    const title = $('bookEditorTitle');
    if (title) {
        title.textContent = book ? 'Rediger Kokebok' : 'Ny Kokebok';
    }
    
    // Populate form
    $('bookName').value = book?.name || '';
    $('bookDescription').value = book?.description || '';
    $('bookOwner').value = book?.owner || '';
    $('bookYear').value = book?.year || '';
    
    // Render cover
    renderBookCover();
    
    navigateTo('bookEditorView');
}

function renderBookCover() {
    const container = $('bookCoverContainer');
    if (!container) return;
    
    if (state.tempCoverImage) {
        container.innerHTML = `<img src="${state.tempCoverImage}" alt="Omslagsbilde">`;
    } else {
        container.innerHTML = `<span class="cover-placeholder">📚</span>`;
    }
}

async function handleBookCoverUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
        state.tempCoverImage = await compressImage(file, 800, 1067, 0.85);
        renderBookCover();
        showToast('Omslagsbilde lagt til', 'success');
    } catch (err) {
        showToast('Kunne ikke behandle bildet', 'error');
    }
    
    e.target.value = '';
}

async function saveBook() {
    const name = $('bookName').value.trim();
    if (!name) {
        showToast('Kokeboken må ha et navn', 'error');
        return;
    }
    
    const book = {
        name,
        description: $('bookDescription').value.trim(),
        owner: $('bookOwner').value.trim(),
        year: $('bookYear').value.trim(),
        coverImage: state.tempCoverImage
    };
    
    try {
        const id = await saveToFirestore('books', state.editingBook?.id, book);
        
        if (state.editingBook) {
            const index = state.books.findIndex(b => b.id === state.editingBook.id);
            if (index !== -1) {
                state.books[index] = { ...state.books[index], ...book };
            }
        } else {
            state.books.push({ id, ...book, createdAt: { toDate: () => new Date() } });
        }
        
        state.editingBook = null;
        state.tempCoverImage = null;
        
        showToast('Kokebok lagret!', 'success');
        navigateTo('bookListView');
        
    } catch (err) {
        console.error('Save error:', err);
        showToast('Kunne ikke lagre kokeboken', 'error');
    }
}

function deleteCurrentBook() {
    if (!state.currentBook) return;
    
    const recipeCount = state.recipes.filter(r => r.bookId === state.currentBook.id).length;
    const warning = recipeCount > 0 
        ? `\n\nOppskriftene (${recipeCount} stk) vil ikke slettes, men vil ikke lenger være tilknyttet en bok.`
        : '';
    
    showConfirmModal(
        'Slett kokebok',
        `Er du sikker på at du vil slette "${state.currentBook.name}"?${warning}`,
        async () => {
            try {
                await deleteFromFirestore('books', state.currentBook.id);
                state.books = state.books.filter(b => b.id !== state.currentBook.id);
                
                // Update recipes to remove book reference
                for (const recipe of state.recipes) {
                    if (recipe.bookId === state.currentBook.id) {
                        recipe.bookId = null;
                        await saveToFirestore('recipes', recipe.id, { bookId: null });
                    }
                }
                
                state.currentBook = null;
                showToast('Kokebok slettet', 'success');
                navigateTo('bookListView');
            } catch (err) {
                showToast('Kunne ikke slette kokeboken', 'error');
            }
        }
    );
}

// ===== Digital Book Reader =====
function prepareDigitalBook(book, recipes) {
    state.currentBookPages = [];
    state.currentPageIndex = 0;
    
    // Cover page
    state.currentBookPages.push({
        type: 'cover',
        content: {
            title: book.name,
            owner: book.owner,
            year: book.year,
            coverImage: book.coverImage
        }
    });
    
    // Table of contents
    state.currentBookPages.push({
        type: 'toc',
        content: {
            title: 'Innhold',
            items: recipes.map((r, i) => ({
                name: r.name,
                page: i + 3 // Offset for cover and TOC
            }))
        }
    });
    
    // Recipe pages
    recipes.forEach(recipe => {
        state.currentBookPages.push({
            type: 'recipe',
            content: recipe
        });
    });
    
    $('digitalBookTitle').textContent = book.name;
}

function renderDigitalBook() {
    const container = $('digitalBookContent');
    if (!container || state.currentBookPages.length === 0) return;
    
    const page = state.currentBookPages[state.currentPageIndex];
    updatePageIndicator();
    
    let html = '';
    
    switch (page.type) {
        case 'cover':
            html = `
                <div class="book-page book-page-cover">
                    ${page.content.coverImage ? `<img src="${page.content.coverImage}" style="max-width: 200px; border-radius: 8px; margin-bottom: 24px;">` : '<div style="font-size: 5rem; margin-bottom: 24px;">📚</div>'}
                    <h1>${escapeHtml(page.content.title)}</h1>
                    ${page.content.owner ? `<p>${escapeHtml(page.content.owner)}</p>` : ''}
                    ${page.content.year ? `<p style="margin-top: 16px; opacity: 0.7;">${escapeHtml(page.content.year)}</p>` : ''}
                </div>
            `;
            break;
            
        case 'toc':
            html = `
                <div class="book-page book-page-toc">
                    <h2>📋 ${page.content.title}</h2>
                    <ul class="toc-list">
                        ${page.content.items.map(item => 
                            `<li data-page="${item.page}">${escapeHtml(item.name)}</li>`
                        ).join('')}
                    </ul>
                </div>
            `;
            break;
            
        case 'recipe':
            const recipe = page.content;
            html = `
                <div class="book-page book-page-recipe">
                    <h2>${escapeHtml(recipe.name)}</h2>
                    ${recipe.source ? `<p style="text-align: center; color: var(--text-muted); font-style: italic; margin-bottom: 16px;">Fra: ${escapeHtml(recipe.source)}</p>` : ''}
                    
                    ${recipe.images && recipe.images.length > 0 ? `
                        <div style="text-align: center; margin-bottom: 16px;">
                            <img src="${recipe.images[0]}" style="max-width: 100%; max-height: 200px; border-radius: 8px; cursor: pointer;" class="recipe-page-image">
                        </div>
                    ` : ''}
                    
                    ${recipe.ingredients ? `
                        <div style="margin-bottom: 16px;">
                            <h3 style="font-size: 1rem; color: var(--primary); margin-bottom: 8px;">🥄 Ingredienser</h3>
                            <pre style="white-space: pre-wrap; font-family: inherit; line-height: 1.6;">${escapeHtml(recipe.ingredients)}</pre>
                        </div>
                    ` : ''}
                    
                    ${recipe.instructions ? `
                        <div>
                            <h3 style="font-size: 1rem; color: var(--primary); margin-bottom: 8px;">👩‍🍳 Fremgangsmåte</h3>
                            <pre style="white-space: pre-wrap; font-family: inherit; line-height: 1.6;">${escapeHtml(recipe.instructions)}</pre>
                        </div>
                    ` : ''}
                </div>
            `;
            break;
    }
    
    container.innerHTML = html;
    
    // TOC click handlers
    container.querySelectorAll('.toc-list li').forEach(li => {
        on(li, 'click', () => {
            const pageNum = parseInt(li.dataset.page) - 1;
            if (pageNum >= 0 && pageNum < state.currentBookPages.length) {
                state.currentPageIndex = pageNum;
                renderDigitalBook();
            }
        });
    });
    
    // Recipe image click
    const recipeImg = container.querySelector('.recipe-page-image');
    if (recipeImg && page.type === 'recipe' && page.content.images) {
        on(recipeImg, 'click', () => {
            openImageViewer(page.content.images, 0);
        });
    }
}

function navigateBookPage(direction) {
    const newIndex = state.currentPageIndex + direction;
    if (newIndex >= 0 && newIndex < state.currentBookPages.length) {
        state.currentPageIndex = newIndex;
        renderDigitalBook();
    }
}

function updatePageIndicator() {
    const indicator = $('pageIndicator');
    const prevBtn = $('prevPageBtn');
    const nextBtn = $('nextPageBtn');
    
    if (indicator) {
        indicator.textContent = `${state.currentPageIndex + 1} / ${state.currentBookPages.length}`;
    }
    
    if (prevBtn) prevBtn.disabled = state.currentPageIndex === 0;
    if (nextBtn) nextBtn.disabled = state.currentPageIndex >= state.currentBookPages.length - 1;
}

function exportBook() {
    if (!state.currentBook) return;
    
    const book = state.currentBook;
    const recipes = state.recipes.filter(r => r.bookId === book.id);
    
    // Create printable HTML
    let html = `
<!DOCTYPE html>
<html lang="no">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(book.name)}</title>
    <style>
        body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px; }
        h1 { text-align: center; border-bottom: 2px solid #8B4513; padding-bottom: 20px; }
        h2 { color: #8B4513; margin-top: 40px; }
        .recipe { page-break-inside: avoid; margin-bottom: 40px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .recipe h3 { color: #8B4513; margin-bottom: 10px; }
        .source { font-style: italic; color: #666; margin-bottom: 16px; }
        pre { white-space: pre-wrap; font-family: inherit; line-height: 1.8; }
        img { max-width: 100%; height: auto; margin: 16px 0; border-radius: 8px; }
        @media print { .recipe { border: none; } }
    </style>
</head>
<body>
    <h1>📚 ${escapeHtml(book.name)}</h1>
    ${book.owner ? `<p style="text-align: center;">${escapeHtml(book.owner)}</p>` : ''}
    ${book.description ? `<p style="text-align: center; color: #666;">${escapeHtml(book.description)}</p>` : ''}
    
    <h2>Innhold</h2>
    <ul>
        ${recipes.map(r => `<li>${escapeHtml(r.name)}</li>`).join('')}
    </ul>
    
    ${recipes.map(r => `
        <div class="recipe">
            <h3>${escapeHtml(r.name)}</h3>
            ${r.source ? `<p class="source">Fra: ${escapeHtml(r.source)}</p>` : ''}
            ${r.images && r.images[0] ? `<img src="${r.images[0]}" alt="${escapeHtml(r.name)}">` : ''}
            ${r.ingredients ? `<h4>Ingredienser</h4><pre>${escapeHtml(r.ingredients)}</pre>` : ''}
            ${r.instructions ? `<h4>Fremgangsmåte</h4><pre>${escapeHtml(r.instructions)}</pre>` : ''}
            ${r.notes ? `<h4>Notater</h4><p>${escapeHtml(r.notes)}</p>` : ''}
        </div>
    `).join('')}
</body>
</html>`;
    
    // Download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.name.replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Kokebok eksportert som HTML', 'success');
}

// ===== Categories View =====
function renderCategoriesView() {
    const container = $('categoriesList');
    if (!container) return;
    
    container.innerHTML = state.categories.map(cat => {
        const count = state.recipes.filter(r => r.category === cat.id).length;
        const isDefault = DEFAULT_CATEGORIES.some(dc => dc.id === cat.id);
        
        return `
            <div class="category-list-item" data-id="${cat.id}">
                <span class="category-list-icon">${cat.icon}</span>
                <div class="category-list-info">
                    <div class="category-list-name">${escapeHtml(cat.name)}</div>
                    <div class="category-list-count">${count} oppskrifter</div>
                </div>
                <div class="category-list-actions">
                    <button class="icon-btn edit-category" title="Rediger">✏️</button>
                    ${!isDefault ? `<button class="icon-btn danger delete-category" title="Slett">🗑️</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Add handlers
    container.querySelectorAll('.edit-category').forEach(btn => {
        on(btn, 'click', (e) => {
            e.stopPropagation();
            const item = btn.closest('.category-list-item');
            const cat = state.categories.find(c => c.id === item.dataset.id);
            if (cat) showEditCategoryModal(cat);
        });
    });
    
    container.querySelectorAll('.delete-category').forEach(btn => {
        on(btn, 'click', (e) => {
            e.stopPropagation();
            const item = btn.closest('.category-list-item');
            const cat = state.categories.find(c => c.id === item.dataset.id);
            if (cat) deleteCategory(cat);
        });
    });
}

function showAddCategoryModal() {
    showCategoryModal(null);
}

function showEditCategoryModal(category) {
    showCategoryModal(category);
}

function showCategoryModal(category) {
    const modalTitle = $('modalTitle');
    const modalBody = $('modalBody');
    const modalFooter = $('modalFooter');
    
    modalTitle.textContent = category ? 'Rediger kategori' : 'Ny kategori';
    
    const emojis = ['🍽️','🥗','🍲','🥧','🎂','🍰','🥩','🐟','🥕','🍝','🍜','🍛','🥘','🫕','🥪','🌮','🍕','🍔','🍟','🍿','🧁','🍩','🍪','🍫','🍬','🍭','🍮','🎄','📜','🫙','☕','🍹','🥤','🍵','🫖','🍺','🍷','🥛','📝'];
    
    modalBody.innerHTML = `
        <div class="form-group">
            <label>Navn</label>
            <input type="text" id="modalCategoryName" value="${category ? escapeHtml(category.name) : ''}" placeholder="Kategorinavn">
        </div>
        <div class="form-group">
            <label>Ikon</label>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                ${emojis.map(e => `
                    <button type="button" class="emoji-btn ${category?.icon === e ? 'selected' : ''}" data-emoji="${e}" 
                        style="width: 40px; height: 40px; border: 2px solid ${category?.icon === e ? 'var(--primary)' : 'var(--border)'}; 
                        border-radius: 8px; background: var(--bg-card); font-size: 1.25rem; cursor: pointer;">
                        ${e}
                    </button>
                `).join('')}
            </div>
            <input type="hidden" id="modalCategoryIcon" value="${category?.icon || '📝'}">
        </div>
    `;
    
    // Emoji selection
    modalBody.querySelectorAll('.emoji-btn').forEach(btn => {
        on(btn, 'click', () => {
            modalBody.querySelectorAll('.emoji-btn').forEach(b => b.style.borderColor = 'var(--border)');
            btn.style.borderColor = 'var(--primary)';
            $('modalCategoryIcon').value = btn.dataset.emoji;
        });
    });
    
    modalFooter.innerHTML = `
        <button class="modal-btn secondary" onclick="closeModal()">Avbryt</button>
        <button class="modal-btn primary" id="saveCategoryBtn">Lagre</button>
    `;
    
    on('saveCategoryBtn', 'click', async () => {
        const name = $('modalCategoryName').value.trim();
        const icon = $('modalCategoryIcon').value;
        
        if (!name) {
            showToast('Kategorien må ha et navn', 'error');
            return;
        }
        
        const catData = { name, icon };
        
        try {
            if (category) {
                await saveToFirestore('categories', category.id, catData);
                const index = state.categories.findIndex(c => c.id === category.id);
                if (index !== -1) state.categories[index] = { ...state.categories[index], ...catData };
            } else {
                const id = name.toLowerCase().replace(/[^a-z0-9æøå]/g, '-');
                await saveToFirestore('categories', id, catData);
                state.categories.push({ id, ...catData });
            }
            
            closeModal();
            renderCategoriesView();
            showToast('Kategori lagret', 'success');
        } catch (err) {
            showToast('Kunne ikke lagre kategorien', 'error');
        }
    });
    
    $('modalContainer').classList.remove('hidden');
    $('modalCategoryName').focus();
}

function deleteCategory(category) {
    const count = state.recipes.filter(r => r.category === category.id).length;
    const warning = count > 0 ? `\n\n${count} oppskrifter vil miste denne kategorien.` : '';
    
    showConfirmModal(
        'Slett kategori',
        `Er du sikker på at du vil slette "${category.name}"?${warning}`,
        async () => {
            try {
                await deleteFromFirestore('categories', category.id);
                state.categories = state.categories.filter(c => c.id !== category.id);
                
                // Remove category from recipes
                for (const recipe of state.recipes) {
                    if (recipe.category === category.id) {
                        recipe.category = '';
                        await saveToFirestore('recipes', recipe.id, { category: '' });
                    }
                }
                
                renderCategoriesView();
                showToast('Kategori slettet', 'success');
            } catch (err) {
                showToast('Kunne ikke slette kategorien', 'error');
            }
        }
    );
}

// ===== Settings =====
async function saveSettings() {
    try {
        await saveToFirestore('settings', 'user-settings', state.settings);
    } catch (err) {
        console.error('Could not save settings:', err);
    }
}

async function exportAllData() {
    const data = {
        version: APP_VERSION,
        exportDate: new Date().toISOString(),
        categories: state.categories,
        recipes: state.recipes,
        books: state.books,
        settings: state.settings
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kokebok-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Data eksportert', 'success');
}

async function importData(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (!data.recipes || !data.categories) {
            throw new Error('Invalid format');
        }
        
        showConfirmModal(
            'Importer data',
            `Dette vil overskrive eksisterende data.\n\nFunnet: ${data.recipes?.length || 0} oppskrifter, ${data.books?.length || 0} kokebøker.\n\nFortsette?`,
            async () => {
                // Import categories
                for (const cat of data.categories) {
                    await saveToFirestore('categories', cat.id, cat);
                }
                state.categories = data.categories;
                
                // Import recipes
                for (const recipe of data.recipes) {
                    const { id, ...recipeData } = recipe;
                    await saveToFirestore('recipes', id, recipeData);
                }
                state.recipes = data.recipes;
                
                // Import books
                if (data.books) {
                    for (const book of data.books) {
                        const { id, ...bookData } = book;
                        await saveToFirestore('books', id, bookData);
                    }
                    state.books = data.books;
                }
                
                showToast('Data importert!', 'success');
                renderDashboard();
            }
        );
        
    } catch (err) {
        console.error('Import error:', err);
        showToast('Kunne ikke importere filen', 'error');
    }
    
    e.target.value = '';
}

// ===== Image Viewer =====
function setupImageViewer() {
    const viewer = $('imageViewer');
    if (!viewer) return;
    
    on(viewer.querySelector('.image-viewer-overlay'), 'click', closeImageViewer);
    on(viewer.querySelector('.image-viewer-close'), 'click', closeImageViewer);
    on(viewer.querySelector('.image-viewer-prev'), 'click', () => navigateImage(-1));
    on(viewer.querySelector('.image-viewer-next'), 'click', () => navigateImage(1));
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!viewer.classList.contains('hidden')) {
            if (e.key === 'Escape') closeImageViewer();
            if (e.key === 'ArrowLeft') navigateImage(-1);
            if (e.key === 'ArrowRight') navigateImage(1);
        }
    });
}

let viewerImages = [];
let viewerIndex = 0;

function openImageViewer(images, startIndex = 0) {
    viewerImages = images;
    viewerIndex = startIndex;
    
    const viewer = $('imageViewer');
    viewer.classList.remove('hidden');
    updateViewerImage();
}

function closeImageViewer() {
    $('imageViewer').classList.add('hidden');
}

function navigateImage(direction) {
    viewerIndex += direction;
    if (viewerIndex < 0) viewerIndex = viewerImages.length - 1;
    if (viewerIndex >= viewerImages.length) viewerIndex = 0;
    updateViewerImage();
}

function updateViewerImage() {
    $('viewerImage').src = viewerImages[viewerIndex];
    $('viewerCaption').textContent = `${viewerIndex + 1} / ${viewerImages.length}`;
}

// ===== Modal =====
function showConfirmModal(title, message, onConfirm) {
    const modalTitle = $('modalTitle');
    const modalBody = $('modalBody');
    const modalFooter = $('modalFooter');
    
    modalTitle.textContent = title;
    modalBody.innerHTML = `<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`;
    modalFooter.innerHTML = `
        <button class="modal-btn secondary" onclick="closeModal()">Avbryt</button>
        <button class="modal-btn danger" id="confirmBtn">Bekreft</button>
    `;
    
    on('confirmBtn', 'click', () => {
        closeModal();
        onConfirm();
    });
    
    $('modalContainer').classList.remove('hidden');
}

function closeModal() {
    $('modalContainer').classList.add('hidden');
}

function showAddMenu() {
    const modalTitle = $('modalTitle');
    const modalBody = $('modalBody');
    const modalFooter = $('modalFooter');
    
    modalTitle.textContent = 'Legg til';
    modalBody.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <button class="settings-btn" id="addMenuRecipe">
                <span>📝</span> Ny oppskrift
            </button>
            <button class="settings-btn" id="addMenuBook">
                <span>📚</span> Ny kokebok
            </button>
            <button class="settings-btn" id="addMenuCamera">
                <span>📷</span> Ta bilde av oppskrift
            </button>
        </div>
    `;
    modalFooter.innerHTML = '';
    
    on('addMenuRecipe', 'click', () => { closeModal(); openRecipeEditor(); });
    on('addMenuBook', 'click', () => { closeModal(); openBookEditor(); });
    on('addMenuCamera', 'click', () => { closeModal(); openCameraForRecipe(); });
    
    $('modalContainer').classList.remove('hidden');
}

// ===== Toast =====
function showToast(message, type = 'info') {
    const container = $('toastContainer');
    if (!container) return;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    setupAuth();
});

// Make functions available globally for onclick handlers
window.openRecipeEditor = openRecipeEditor;
window.openBookEditor = openBookEditor;
window.closeModal = closeModal;
