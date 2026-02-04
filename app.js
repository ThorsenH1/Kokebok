// ==========================================
// FAMILIENS KOKEBOK APP v3.2
// Firebase-basert med Google Auth
// Digitaliser gamle kokebøker og oppskrifter
// 100% privat - ingen AI lærer av dine oppskrifter
// ==========================================

const APP_VERSION = '3.2.0';

// ===== Firebase Initialization =====
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== Timer State =====
let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;
let timerLabel = '';

// ===== Language State =====
let currentLanguage = localStorage.getItem('kokebok_language') || 'no';
let searchLanguage = localStorage.getItem('kokebok_search_language') || 'no';

// ===== Translation Cache =====
const translationCache = {};

// ===== Norwegian Translation Dictionary (common cooking terms) =====
const norwegianTranslations = {
    // Measurements
    'cup': 'kopp', 'cups': 'kopper', 'tablespoon': 'ss', 'tablespoons': 'ss',
    'teaspoon': 'ts', 'teaspoons': 'ts', 'tbsp': 'ss', 'tsp': 'ts',
    'pound': 'pund', 'pounds': 'pund', 'ounce': 'unse', 'ounces': 'unser',
    'lb': 'pund', 'oz': 'unse', 'clove': 'fedd', 'cloves': 'fedd',
    'pinch': 'klype', 'handful': 'håndfull', 'slice': 'skive', 'slices': 'skiver',
    
    // Proteins
    'chicken': 'kylling', 'beef': 'biff', 'pork': 'svinekjøtt', 'lamb': 'lam',
    'fish': 'fisk', 'salmon': 'laks', 'cod': 'torsk', 'shrimp': 'reker',
    'bacon': 'bacon', 'sausage': 'pølse', 'mince': 'kjøttdeig', 'ground': 'kjøttdeig',
    'turkey': 'kalkun', 'duck': 'and', 'ham': 'skinke', 'egg': 'egg', 'eggs': 'egg',
    
    // Vegetables
    'onion': 'løk', 'onions': 'løk', 'garlic': 'hvitløk', 'tomato': 'tomat', 'tomatoes': 'tomater',
    'potato': 'potet', 'potatoes': 'poteter', 'carrot': 'gulrot', 'carrots': 'gulrøtter',
    'pepper': 'paprika', 'peppers': 'paprika', 'mushroom': 'sopp', 'mushrooms': 'sopp',
    'celery': 'selleri', 'broccoli': 'brokkoli', 'spinach': 'spinat', 'lettuce': 'salat',
    'cucumber': 'agurk', 'zucchini': 'squash', 'cabbage': 'kål', 'beans': 'bønner',
    'peas': 'erter', 'corn': 'mais', 'leek': 'purre', 'leeks': 'purre',
    
    // Dairy & Basics
    'butter': 'smør', 'milk': 'melk', 'cream': 'fløte', 'cheese': 'ost',
    'flour': 'mel', 'sugar': 'sukker', 'salt': 'salt', 'oil': 'olje',
    'olive oil': 'olivenolje', 'vegetable oil': 'matolje', 'water': 'vann',
    'stock': 'buljong', 'broth': 'kraft', 'wine': 'vin', 'vinegar': 'eddik',
    
    // Herbs & Spices
    'parsley': 'persille', 'basil': 'basilikum', 'oregano': 'oregano',
    'thyme': 'timian', 'rosemary': 'rosmarin', 'cilantro': 'koriander',
    'dill': 'dill', 'mint': 'mynte', 'bay leaf': 'laurbærblad',
    'cinnamon': 'kanel', 'cumin': 'spisskummen', 'paprika': 'paprika',
    'ginger': 'ingefær', 'nutmeg': 'muskatnøtt', 'cayenne': 'kajennepepper',
    
    // Cooking methods
    'bake': 'stek i ovn', 'boil': 'kok', 'fry': 'stek', 'grill': 'grill',
    'roast': 'ovnsstek', 'simmer': 'la småkoke', 'sauté': 'surr', 'stir': 'rør',
    'mix': 'bland', 'chop': 'hakk', 'slice': 'skjær', 'dice': 'terning',
    'mince': 'finhakk', 'peel': 'skrell', 'drain': 'hell av', 'season': 'krydre',
    'preheat': 'forvarm', 'serve': 'server', 'add': 'tilsett', 'remove': 'fjern',
    'cover': 'dekk til', 'heat': 'varm opp', 'cook': 'kok/stek', 'brown': 'bryn',
    
    // Common phrases
    'to taste': 'etter smak', 'as needed': 'etter behov', 'optional': 'valgfritt',
    'freshly ground': 'nymalt', 'finely chopped': 'finhakket', 'minced': 'finhakket',
    'degrees': 'grader', 'minutes': 'minutter', 'hours': 'timer', 'until': 'til',
    
    // Categories
    'Dessert': 'Dessert', 'Seafood': 'Sjømat', 'Chicken': 'Kylling',
    'Beef': 'Biff', 'Pasta': 'Pasta', 'Vegetarian': 'Vegetar',
    'Breakfast': 'Frokost', 'Side': 'Tilbehør', 'Lamb': 'Lam',
    'Pork': 'Svinekjøtt', 'Miscellaneous': 'Diverse', 'Starter': 'Forrett',
    'Vegan': 'Vegansk', 'Goat': 'Geit'
};

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
        fontSize: 'normal',
        searchLanguage: 'no',
        timerNotifications: true,
        mealReminders: false
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
    currentPageIndex: 0,
    // New v3.0 state
    favorites: [],
    mealPlan: {},           // { dateKey: { name, ingredients[], isExternal } }
    shoppingList: [],
    currentWeekOffset: 0,
    // Meal planner picker state
    pickerDate: null,
    pickerTab: 'mine',
    // Saved external recipes (from API)
    savedExternalRecipes: []
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
        await loadExtraSettings();
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
    
    // Search language
    const searchLangSelect = $('searchLanguageSelect');
    if (searchLangSelect) {
        searchLangSelect.value = state.settings.searchLanguage || 'no';
    }
    
    // Timer notifications
    const timerNotifToggle = $('timerNotificationsToggle');
    if (timerNotifToggle) {
        timerNotifToggle.checked = state.settings.timerNotifications !== false;
    }
    
    // Meal reminders
    const mealReminderToggle = $('mealReminderToggle');
    if (mealReminderToggle) {
        mealReminderToggle.checked = state.settings.mealReminders || false;
    }
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
    
    // Quick actions - åpne oppskriftseditor direkte
    on('addRecipeBtn', 'click', () => openRecipeEditor());
    on('addBookBtn', 'click', () => openBookEditor());
    on('navAddBtn', 'click', () => showAddMenu());
    
    // New v3.0 Feature Buttons
    on('searchRecipesBtn', 'click', openRecipeSearch);
    on('mealPlannerBtn', 'click', openMealPlanner);
    on('shoppingListBtn', 'click', openShoppingList);
    on('timerBtn', 'click', openTimer);
    on('floatingTimerBtn', 'click', openTimer);
    
    // Side Menu Feature Items
    on('menuFavorites', 'click', () => { navigateTo('recipeListView'); filterFavorites(); toggleSideMenu(false); });
    on('menuSearch', 'click', () => { openRecipeSearch(); toggleSideMenu(false); });
    on('menuMealPlanner', 'click', () => { openMealPlanner(); toggleSideMenu(false); });
    on('menuShoppingList', 'click', () => { openShoppingList(); toggleSideMenu(false); });
    on('menuTimer', 'click', () => { openTimer(); toggleSideMenu(false); });
    on('menuLanguage', 'click', () => { openLanguageSelector(); toggleSideMenu(false); });
    
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
    
    // Search language setting
    on('searchLanguageSelect', 'change', (e) => {
        state.settings.searchLanguage = e.target.value;
        localStorage.setItem('kokebok_search_language', e.target.value);
        saveSettings();
        showToast(`Søkespråk endret til ${e.target.value === 'no' ? 'Norsk' : e.target.value.toUpperCase()}`, 'success');
    });
    
    // Timer notifications
    on('timerNotificationsToggle', 'change', (e) => {
        state.settings.timerNotifications = e.target.checked;
        saveSettings();
    });
    
    // Meal reminders
    on('mealReminderToggle', 'change', (e) => {
        state.settings.mealReminders = e.target.checked;
        saveSettings();
        if (e.target.checked) {
            requestNotificationPermission();
        }
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

// Request notification permission
async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            showToast('Varsler aktivert!', 'success');
        }
    }
}

// Debounce helper
function debounce(func, wait) {
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
    // Vis modal for å velge oppskrift eller bok
    openRecipeEditor();
}

// ===== V3.0 NEW FEATURES =====

// ===== NORWEGIAN TO ENGLISH TRANSLATION FOR SEARCH =====
const norwegianToEnglish = {
    // Common Norwegian food terms
    'kylling': 'chicken', 'biff': 'beef', 'svinekjøtt': 'pork', 'lam': 'lamb',
    'fisk': 'fish', 'laks': 'salmon', 'torsk': 'cod', 'reker': 'shrimp',
    'pasta': 'pasta', 'ris': 'rice', 'nudler': 'noodles', 'pizza': 'pizza',
    'suppe': 'soup', 'salat': 'salad', 'gryte': 'stew', 'pai': 'pie',
    'kake': 'cake', 'dessert': 'dessert', 'is': 'ice cream', 'pudding': 'pudding',
    'banan': 'banana', 'eple': 'apple', 'appelsin': 'orange', 'sitron': 'lemon',
    'tomat': 'tomato', 'potet': 'potato', 'gulrot': 'carrot', 'løk': 'onion',
    'hvitløk': 'garlic', 'sopp': 'mushroom', 'paprika': 'pepper',
    'ost': 'cheese', 'egg': 'egg', 'smør': 'butter', 'melk': 'milk',
    'brød': 'bread', 'pannekake': 'pancake', 'vaffel': 'waffle',
    'frokost': 'breakfast', 'middag': 'dinner', 'lunsj': 'lunch',
    'vegetar': 'vegetarian', 'vegan': 'vegan', 'sunn': 'healthy',
    'enkel': 'easy', 'rask': 'quick', 'italiensk': 'italian', 'meksikansk': 'mexican',
    'indisk': 'indian', 'thai': 'thai', 'kinesisk': 'chinese', 'japansk': 'japanese',
    'burger': 'burger', 'taco': 'taco', 'wrap': 'wrap', 'sandwich': 'sandwich',
    'lasagne': 'lasagne', 'carbonara': 'carbonara', 'bolognese': 'bolognese',
    'curry': 'curry', 'wok': 'stir fry', 'grillet': 'grilled', 'stekt': 'fried',
    'bakt': 'baked', 'kokt': 'boiled'
};

function translateToEnglish(query) {
    let translated = query.toLowerCase();
    
    // Check for direct translation
    if (norwegianToEnglish[translated]) {
        return norwegianToEnglish[translated];
    }
    
    // Check for partial matches
    for (const [no, en] of Object.entries(norwegianToEnglish)) {
        if (translated.includes(no)) {
            translated = translated.replace(no, en);
        }
    }
    
    return translated;
}

function translateToNorwegian(text) {
    if (!text) return text;
    
    let result = text;
    
    // Replace words with Norwegian translations
    for (const [en, no] of Object.entries(norwegianTranslations)) {
        // Case insensitive replace with word boundaries
        const regex = new RegExp(`\\b${en}\\b`, 'gi');
        result = result.replace(regex, no);
    }
    
    return result;
}

// ===== RECIPE SEARCH (TheMealDB API) =====
async function openRecipeSearch() {
    const modal = $('recipeSearchModal');
    if (modal) {
        modal.classList.remove('hidden');
        const searchInput = $('recipeSearchInput');
        if (searchInput) {
            searchInput.focus();
            // Update placeholder based on language setting
            const lang = state.settings.searchLanguage || 'no';
            searchInput.placeholder = lang === 'no' 
                ? 'Søk etter oppskrift (f.eks. "lasagne", "kylling")...'
                : 'Search for recipes (e.g. "lasagna", "chicken")...';
        }
        
        // Setup events
        setupRecipeSearchEvents();
    }
}

function closeRecipeSearch() {
    const modal = $('recipeSearchModal');
    if (modal) modal.classList.add('hidden');
}

function setupRecipeSearchEvents() {
    const closeBtn = $('closeRecipeSearchBtn');
    const overlay = document.querySelector('#recipeSearchModal .feature-modal-overlay');
    const searchBtn = $('doRecipeSearchBtn');
    const searchInput = $('recipeSearchInput');
    const categoryFilter = $('searchCategoryFilter');
    
    if (closeBtn) closeBtn.onclick = closeRecipeSearch;
    if (overlay) overlay.onclick = closeRecipeSearch;
    
    if (searchBtn) searchBtn.onclick = performRecipeSearch;
    if (searchInput) {
        searchInput.onkeypress = (e) => {
            if (e.key === 'Enter') performRecipeSearch();
        };
    }
    if (categoryFilter) categoryFilter.onchange = performCategorySearch;
}

async function performRecipeSearch() {
    const searchInput = $('recipeSearchInput');
    const resultsContainer = $('searchResults');
    let query = searchInput?.value?.trim();
    
    if (!query) {
        showToast('Skriv inn et søkeord', 'warning');
        return;
    }
    
    // Translate Norwegian to English if using Norwegian search
    const lang = state.settings.searchLanguage || 'no';
    let searchQuery = query;
    if (lang === 'no') {
        searchQuery = translateToEnglish(query);
        console.log(`Translated "${query}" to "${searchQuery}"`);
    }
    
    // Show loading
    resultsContainer.innerHTML = `
        <div class="search-loading">
            <div class="spinner"></div>
            <p>Søker etter "${escapeHtml(query)}"...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        
        if (data.meals && data.meals.length > 0) {
            renderSearchResults(data.meals, lang === 'no');
        } else {
            // Try original query if translation didn't work
            if (searchQuery !== query) {
                const response2 = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
                const data2 = await response2.json();
                if (data2.meals && data2.meals.length > 0) {
                    renderSearchResults(data2.meals, lang === 'no');
                    return;
                }
            }
            
            resultsContainer.innerHTML = `
                <div class="search-placeholder">
                    <span>🤷</span>
                    <p>Ingen oppskrifter funnet for "${escapeHtml(query)}"</p>
                    <p class="hint">Tips: Prøv å søke på engelsk (f.eks. "chicken curry", "chocolate cake")</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = `
            <div class="search-placeholder">
                <span>❌</span>
                <p>Kunne ikke søke. Sjekk internettforbindelsen.</p>
            </div>
        `;
    }
}
    
    if (!query) {
        showToast('Skriv inn et søkeord', 'warning');
        return;
    }
    
    // Show loading
    resultsContainer.innerHTML = `
        <div class="search-loading">
            <div class="spinner"></div>
            <p>Søker etter oppskrifter...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.meals && data.meals.length > 0) {
            renderSearchResults(data.meals);
        } else {
            resultsContainer.innerHTML = `
                <div class="search-placeholder">
                    <span>🤷</span>
                    <p>Ingen oppskrifter funnet for "${escapeHtml(query)}"</p>
                    <p>Prøv et annet søkeord på engelsk (f.eks. "chicken", "pasta")</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = `
            <div class="search-placeholder">
                <span>❌</span>
                <p>Kunne ikke søke. Sjekk internettforbindelsen.</p>
            </div>
        `;
    }
}

async function performCategorySearch() {
    const categoryFilter = $('searchCategoryFilter');
    const resultsContainer = $('searchResults');
    const category = categoryFilter?.value;
    const lang = state.settings.searchLanguage || 'no';
    
    if (!category) return;
    
    const categoryName = norwegianTranslations[category] || category;
    
    // Show loading
    resultsContainer.innerHTML = `
        <div class="search-loading">
            <div class="spinner"></div>
            <p>Henter ${categoryName}-oppskrifter...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category)}`);
        const data = await response.json();
        
        if (data.meals && data.meals.length > 0) {
            // Get full details for first 12 meals
            const detailedMeals = [];
            for (const meal of data.meals.slice(0, 12)) {
                const detailRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
                const detailData = await detailRes.json();
                if (detailData.meals) detailedMeals.push(detailData.meals[0]);
            }
            renderSearchResults(detailedMeals, lang === 'no');
        } else {
            resultsContainer.innerHTML = `
                <div class="search-placeholder">
                    <span>🤷</span>
                    <p>Ingen oppskrifter i denne kategorien</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Category search error:', error);
        resultsContainer.innerHTML = `
            <div class="search-placeholder">
                <span>❌</span>
                <p>Kunne ikke hente oppskrifter</p>
            </div>
        `;
    }
}

function renderSearchResults(meals, translateToNo = false) {
    const resultsContainer = $('searchResults');
    
    resultsContainer.innerHTML = meals.map(meal => {
        // Translate category and area if Norwegian mode
        const category = translateToNo 
            ? (norwegianTranslations[meal.strCategory] || meal.strCategory)
            : meal.strCategory;
        const area = translateToNo 
            ? (norwegianTranslations[meal.strArea] || meal.strArea || 'Internasjonal')
            : (meal.strArea || 'International');
        
        return `
            <div class="search-result-card" data-meal-id="${meal.idMeal}">
                <img src="${meal.strMealThumb}/preview" class="search-result-image" alt="${escapeHtml(meal.strMeal)}" loading="lazy">
                <div class="search-result-info">
                    <h4>${escapeHtml(meal.strMeal)}</h4>
                    <p>${area} • ${category || ''}</p>
                    <span class="search-result-tag">🌍 TheMealDB</span>
                </div>
            </div>
        `;
    }).join('');
    
    // Add click handlers
    resultsContainer.querySelectorAll('.search-result-card').forEach(card => {
        card.onclick = () => showQuickRecipe(card.dataset.mealId);
    });
}

async function showQuickRecipe(mealId) {
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
        const data = await response.json();
        const lang = state.settings.searchLanguage || 'no';
        const translateToNo = lang === 'no';
        
        if (data.meals && data.meals[0]) {
            const meal = data.meals[0];
            
            // Extract ingredients
            const ingredients = [];
            for (let i = 1; i <= 20; i++) {
                const ingredient = meal[`strIngredient${i}`];
                const measure = meal[`strMeasure${i}`];
                if (ingredient && ingredient.trim()) {
                    let ingText = `${measure?.trim() || ''} ${ingredient.trim()}`.trim();
                    // Translate ingredient to Norwegian if enabled
                    if (translateToNo) {
                        ingText = translateToNorwegian(ingText);
                    }
                    ingredients.push(ingText);
                }
            }
            
            // Translate instructions if Norwegian
            let instructions = meal.strInstructions;
            if (translateToNo) {
                instructions = translateToNorwegian(instructions);
            }
            
            // Translate category and area
            const category = translateToNo 
                ? (norwegianTranslations[meal.strCategory] || meal.strCategory)
                : meal.strCategory;
            const area = translateToNo 
                ? (norwegianTranslations[meal.strArea] || meal.strArea || 'Internasjonal')
                : (meal.strArea || 'International');
            
            // Show quick recipe modal
            const modal = $('quickRecipeModal');
            const content = $('quickRecipeContent');
            
            if (modal && content) {
                content.innerHTML = `
                    <img src="${meal.strMealThumb}" class="quick-recipe-image" alt="${escapeHtml(meal.strMeal)}">
                    <h3 style="font-size: 1.3rem; margin-bottom: 12px;">${escapeHtml(meal.strMeal)}</h3>
                    <div class="quick-recipe-meta">
                        <span>🌍 ${area}</span>
                        <span>📂 ${category || ''}</span>
                        ${meal.strTags ? `<span>🏷️ ${meal.strTags}</span>` : ''}
                    </div>
                    
                    <div class="quick-recipe-section">
                        <h4>🥄 ${translateToNo ? 'Ingredienser' : 'Ingredients'} (${ingredients.length})</h4>
                        <ul>
                            ${ingredients.map(ing => `<li>${escapeHtml(ing)}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="quick-recipe-section">
                        <h4>👩‍🍳 ${translateToNo ? 'Fremgangsmåte' : 'Instructions'}</h4>
                        <p style="white-space: pre-line; line-height: 1.7;">${escapeHtml(instructions)}</p>
                    </div>
                    
                    ${meal.strYoutube ? `
                        <div class="quick-recipe-section">
                            <h4>📺 Video</h4>
                            <a href="${meal.strYoutube}" target="_blank" class="action-btn secondary" style="margin-top: 8px;">
                                ${translateToNo ? 'Se på YouTube →' : 'Watch on YouTube →'}
                            </a>
                        </div>
                    ` : ''}
                    
                    <div class="quick-recipe-actions">
                        <button class="action-btn primary" onclick="saveExternalRecipe('${mealId}')">
                            💾 ${translateToNo ? 'Lagre i min kokebok' : 'Save to my cookbook'}
                        </button>
                        <button class="action-btn secondary" onclick="addExternalToMealPlan('${mealId}')">
                            📅 ${translateToNo ? 'Legg til i ukemeny' : 'Add to meal plan'}
                        </button>
                    </div>
                `;
                
                // Store for meal plan
                window.currentQuickRecipeData = {
                    mealId,
                    name: meal.strMeal,
                    ingredients: ingredients
                };
                
                modal.classList.remove('hidden');
                
                // Setup close
                const closeBtn = $('closeQuickRecipeBtn');
                const overlay = modal.querySelector('.feature-modal-overlay');
                const closeQuickRecipe = () => modal.classList.add('hidden');
                if (closeBtn) closeBtn.onclick = closeQuickRecipe;
                if (overlay) overlay.onclick = closeQuickRecipe;
            }
        }
    } catch (error) {
        console.error('Error loading recipe:', error);
        showToast('Kunne ikke laste oppskriften', 'error');
    }
}

// Add external recipe to meal plan with ingredients
function addExternalToMealPlan(mealId) {
    const data = window.currentQuickRecipeData;
    if (data && data.ingredients) {
        addToMealPlanFromSearch(data.name, data.ingredients);
        $('quickRecipeModal')?.classList.add('hidden');
    }
}
window.addExternalToMealPlan = addExternalToMealPlan;

async function saveExternalRecipe(mealId) {
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
        const data = await response.json();
        
        if (data.meals && data.meals[0]) {
            const meal = data.meals[0];
            
            // Extract ingredients
            const ingredients = [];
            for (let i = 1; i <= 20; i++) {
                const ingredient = meal[`strIngredient${i}`];
                const measure = meal[`strMeasure${i}`];
                if (ingredient && ingredient.trim()) {
                    ingredients.push(`${measure?.trim() || ''} ${ingredient.trim()}`.trim());
                }
            }
            
            // Create recipe object
            const recipe = {
                name: meal.strMeal,
                category: 'annet',
                source: 'TheMealDB',
                ingredients: ingredients.join('\n'),
                instructions: meal.strInstructions,
                tags: meal.strTags ? meal.strTags.split(',').map(t => t.trim()) : [],
                images: [meal.strMealThumb]
            };
            
            const id = await saveToFirestore('recipes', null, recipe);
            state.recipes.push({ id, ...recipe, createdAt: { toDate: () => new Date() } });
            
            showToast('Oppskrift lagret i din kokebok! 🎉', 'success');
            triggerConfetti();
            
            // Close modals
            $('quickRecipeModal')?.classList.add('hidden');
            $('recipeSearchModal')?.classList.add('hidden');
        }
    } catch (error) {
        console.error('Save error:', error);
        showToast('Kunne ikke lagre oppskriften', 'error');
    }
}

// ===== MEAL PLANNER =====
function openMealPlanner() {
    const modal = $('mealPlannerModal');
    if (modal) {
        modal.classList.remove('hidden');
        renderMealPlannerWeek();
        setupMealPlannerEvents();
    }
}

function closeMealPlanner() {
    const modal = $('mealPlannerModal');
    if (modal) modal.classList.add('hidden');
}

function setupMealPlannerEvents() {
    const closeBtn = $('closeMealPlannerBtn');
    const overlay = document.querySelector('#mealPlannerModal .feature-modal-overlay');
    const prevWeekBtn = $('prevWeekBtn');
    const nextWeekBtn = $('nextWeekBtn');
    const generateListBtn = $('generateShoppingListBtn');
    const clearPlanBtn = $('clearMealPlanBtn');
    
    if (closeBtn) closeBtn.onclick = closeMealPlanner;
    if (overlay) overlay.onclick = closeMealPlanner;
    if (prevWeekBtn) prevWeekBtn.onclick = () => { state.currentWeekOffset--; renderMealPlannerWeek(); };
    if (nextWeekBtn) nextWeekBtn.onclick = () => { state.currentWeekOffset++; renderMealPlannerWeek(); };
    if (generateListBtn) generateListBtn.onclick = generateShoppingListFromPlan;
    if (clearPlanBtn) clearPlanBtn.onclick = clearCurrentWeekPlan;
}

function renderMealPlannerWeek() {
    const grid = $('mealPlannerGrid');
    const weekLabel = $('currentWeekLabel');
    if (!grid) return;
    
    const days = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
    const daysFull = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (state.currentWeekOffset * 7));
    
    if (weekLabel) {
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        weekLabel.textContent = `${startOfWeek.getDate()}.${startOfWeek.getMonth() + 1} - ${endOfWeek.getDate()}.${endOfWeek.getMonth() + 1}`;
    }
    
    grid.innerHTML = days.map((day, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        const mealData = state.mealPlan[dateKey];
        const mealName = mealData?.name || mealData; // Support old format (string) and new format (object)
        const isToday = date.toDateString() === today.toDateString();
        
        return `
            <div class="meal-day ${isToday ? 'today' : ''}" data-date="${dateKey}">
                <div class="meal-day-header">${day}</div>
                <div class="meal-day-date">${date.getDate()}.${date.getMonth() + 1}</div>
                <div class="meal-slot ${mealName ? 'filled' : ''}" data-date="${dateKey}" data-day="${daysFull[i]}">
                    ${mealName ? `
                        <span class="meal-name">${escapeHtml(typeof mealName === 'string' ? mealName : mealName)}</span>
                        <button class="meal-remove-btn" data-date="${dateKey}" title="Fjern">✕</button>
                    ` : '<span class="meal-add">+ Legg til</span>'}
                </div>
            </div>
        `;
    }).join('');
    
    // Add click handlers for adding meals
    grid.querySelectorAll('.meal-slot').forEach(slot => {
        slot.onclick = (e) => {
            // Don't trigger if clicking remove button
            if (e.target.classList.contains('meal-remove-btn')) return;
            openRecipePicker(slot.dataset.date, slot.dataset.day);
        };
    });
    
    // Add click handlers for removing meals
    grid.querySelectorAll('.meal-remove-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const dateKey = btn.dataset.date;
            delete state.mealPlan[dateKey];
            saveMealPlan();
            renderMealPlannerWeek();
            updatePlannedMealsCount();
            showToast('Måltid fjernet', 'success');
        };
    });
}

// ===== RECIPE PICKER (for Meal Planner) =====
function openRecipePicker(dateKey, dayName) {
    state.pickerDate = dateKey;
    const modal = $('recipePickerModal');
    const dateLabel = $('pickerDateLabel');
    
    if (dateLabel) dateLabel.textContent = `Velg for ${dayName}`;
    
    if (modal) {
        modal.classList.remove('hidden');
        state.pickerTab = 'mine';
        setupRecipePickerEvents();
        renderRecipePicker();
    }
}

function closeRecipePicker() {
    const modal = $('recipePickerModal');
    if (modal) modal.classList.add('hidden');
}

function setupRecipePickerEvents() {
    const closeBtn = $('closeRecipePickerBtn');
    const overlay = document.querySelector('#recipePickerModal .feature-modal-overlay');
    const searchInput = $('pickerSearchInput');
    const categoryFilter = $('pickerCategoryFilter');
    const quickInput = $('quickMealInput');
    const quickConfirmBtn = $('quickMealConfirmBtn');
    
    if (closeBtn) closeBtn.onclick = closeRecipePicker;
    if (overlay) overlay.onclick = closeRecipePicker;
    
    // Tab switching
    document.querySelectorAll('.picker-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.picker-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.pickerTab = tab.dataset.tab;
            renderRecipePicker();
        };
    });
    
    // Search and filter
    if (searchInput) {
        searchInput.oninput = debounce(() => renderRecipePicker(), 200);
    }
    if (categoryFilter) {
        // Populate categories
        categoryFilter.innerHTML = '<option value="">Alle kategorier</option>' +
            state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        categoryFilter.onchange = () => renderRecipePicker();
    }
    
    // Quick input
    if (quickConfirmBtn) {
        quickConfirmBtn.onclick = () => {
            const mealName = quickInput?.value?.trim();
            if (mealName) {
                addMealToPlan(state.pickerDate, mealName, []);
                quickInput.value = '';
            }
        };
    }
    if (quickInput) {
        quickInput.onkeypress = (e) => {
            if (e.key === 'Enter') quickConfirmBtn?.click();
        };
    }
}

function renderRecipePicker() {
    const container = $('pickerRecipesList');
    const quickInputContainer = $('pickerQuickInput');
    const searchInput = $('pickerSearchInput');
    const categoryFilter = $('pickerCategoryFilter');
    
    if (!container) return;
    
    const query = searchInput?.value?.toLowerCase() || '';
    const category = categoryFilter?.value || '';
    
    // Show/hide quick input based on tab
    if (quickInputContainer) {
        quickInputContainer.classList.toggle('hidden', state.pickerTab !== 'quick');
    }
    
    if (state.pickerTab === 'quick') {
        container.innerHTML = `
            <div class="picker-placeholder">
                <span>✏️</span>
                <p>Skriv inn et måltid manuelt</p>
                <p class="hint">F.eks. "Pizza", "Restemat", "Bestemors lapskaus"</p>
            </div>
        `;
        return;
    }
    
    // Get recipes to display
    let recipes = [];
    
    if (state.pickerTab === 'mine') {
        recipes = state.recipes.filter(r => {
            const matchesQuery = !query || r.name.toLowerCase().includes(query);
            const matchesCategory = !category || r.category === category;
            return matchesQuery && matchesCategory;
        });
    } else if (state.pickerTab === 'saved') {
        recipes = state.savedExternalRecipes.filter(r => {
            return !query || r.name.toLowerCase().includes(query);
        });
    }
    
    if (recipes.length === 0) {
        container.innerHTML = `
            <div class="picker-placeholder">
                <span>${state.pickerTab === 'mine' ? '📝' : '💾'}</span>
                <p>${state.pickerTab === 'mine' ? 'Ingen oppskrifter funnet' : 'Ingen lagrede oppskrifter fra søk'}</p>
                ${state.pickerTab === 'mine' ? '<p class="hint">Legg til oppskrifter først, eller bruk "Skriv inn"</p>' : ''}
            </div>
        `;
        return;
    }
    
    container.innerHTML = recipes.map(recipe => `
        <div class="picker-recipe-card" data-recipe-id="${recipe.id || ''}">
            <div class="picker-recipe-thumb">
                ${recipe.images?.[0] ? `<img src="${recipe.images[0]}" alt="">` : '<span>🍽️</span>'}
            </div>
            <div class="picker-recipe-info">
                <h4>${escapeHtml(recipe.name)}</h4>
                <p>${recipe.category ? getCategoryName(recipe.category) : 'Ingen kategori'}</p>
            </div>
            <button class="picker-select-btn">Velg</button>
        </div>
    `).join('');
    
    // Add click handlers
    container.querySelectorAll('.picker-recipe-card').forEach(card => {
        const selectBtn = card.querySelector('.picker-select-btn');
        if (selectBtn) {
            selectBtn.onclick = () => {
                const recipeId = card.dataset.recipeId;
                const recipe = state.pickerTab === 'mine' 
                    ? state.recipes.find(r => r.id === recipeId)
                    : state.savedExternalRecipes.find(r => r.id === recipeId);
                
                if (recipe) {
                    const ingredients = recipe.ingredients ? recipe.ingredients.split('\n').filter(i => i.trim()) : [];
                    addMealToPlan(state.pickerDate, recipe.name, ingredients);
                }
            };
        }
    });
}

function addMealToPlan(dateKey, mealName, ingredients = []) {
    // Store meal with ingredients for shopping list
    state.mealPlan[dateKey] = {
        name: mealName,
        ingredients: ingredients
    };
    
    saveMealPlan();
    closeRecipePicker();
    renderMealPlannerWeek();
    updatePlannedMealsCount();
    showToast(`${mealName} lagt til!`, 'success');
    checkAchievements();
}

function addToMealPlanFromSearch(recipeName, ingredients = []) {
    const today = new Date();
    const dateKey = today.toISOString().split('T')[0];
    state.mealPlan[dateKey] = {
        name: recipeName,
        ingredients: ingredients
    };
    saveMealPlan();
    updatePlannedMealsCount();
    showToast(`${recipeName} lagt til i dagens meny!`, 'success');
}

async function saveMealPlan() {
    try {
        await saveToFirestore('settings', 'mealPlan', { data: state.mealPlan });
    } catch (e) {
        console.warn('Could not save meal plan:', e);
    }
}

function clearCurrentWeekPlan() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (state.currentWeekOffset * 7));
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        delete state.mealPlan[dateKey];
    }
    
    saveMealPlan();
    renderMealPlannerWeek();
    updatePlannedMealsCount();
    showToast('Ukemeny tømt', 'success');
}

function generateShoppingListFromPlan() {
    const ingredients = new Set();
    
    // Get dates for current week
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (state.currentWeekOffset * 7));
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        const mealData = state.mealPlan[dateKey];
        
        if (!mealData) continue;
        
        // Handle both old format (string) and new format (object with ingredients)
        if (typeof mealData === 'object' && mealData.ingredients) {
            // New format: ingredients are stored with meal
            mealData.ingredients.forEach(ing => {
                if (ing && ing.trim()) ingredients.add(ing.trim());
            });
        } else {
            // Old format or manual entry: look up recipe by name
            const mealName = typeof mealData === 'string' ? mealData : mealData.name;
            const recipe = state.recipes.find(r => r.name === mealName);
            if (recipe && recipe.ingredients) {
                recipe.ingredients.split('\n').forEach(ing => {
                    if (ing.trim()) ingredients.add(ing.trim());
                });
            }
        }
    }
    
    if (ingredients.size === 0) {
        showToast('Ingen ingredienser funnet. Legg til oppskrifter med ingredienser i ukemenyen.', 'warning');
        return;
    }
    
    // Add new ingredients to existing list (don't replace)
    const existingTexts = state.shoppingList.map(item => item.text.toLowerCase());
    const newItems = [...ingredients]
        .filter(ing => !existingTexts.includes(ing.toLowerCase()))
        .map(ing => ({ text: ing, checked: false, category: categorizeIngredient(ing) }));
    
    state.shoppingList = [...state.shoppingList, ...newItems];
    saveShoppingList();
    closeMealPlanner();
    openShoppingList();
    showToast(`${newItems.length} nye ingredienser lagt til! (${state.shoppingList.length} totalt)`, 'success');
}

// Kategorisere ingredienser for bedre sortering
function categorizeIngredient(ingredient) {
    const ing = ingredient.toLowerCase();
    
    if (/melk|ost|rømme|yoghurt|fløte|smør|egg/i.test(ing)) return 'meieri';
    if (/brød|mel|pasta|ris|nudler|havre/i.test(ing)) return 'bakevarer';
    if (/kylling|kjøtt|fisk|laks|torsk|bacon|pølse|skinke/i.test(ing)) return 'kjøtt';
    if (/løk|hvitløk|tomat|gulrot|potet|brokkoli|salat|agurk|paprika|sopp/i.test(ing)) return 'grønnsaker';
    if (/eple|banan|appelsin|sitron|bær/i.test(ing)) return 'frukt';
    if (/salt|pepper|krydder|kanel|oregano|basilikum/i.test(ing)) return 'krydder';
    if (/sukker|honning|sjokolade|kakao/i.test(ing)) return 'søtt';
    if (/olje|eddik|saus|ketsjup|sennep/i.test(ing)) return 'sauser';
    
    return 'annet';
}

// ===== SHOPPING LIST =====
function openShoppingList() {
    const modal = $('shoppingListModal');
    if (modal) {
        modal.classList.remove('hidden');
        renderShoppingList();
        setupShoppingListEvents();
    }
}

function closeShoppingList() {
    const modal = $('shoppingListModal');
    if (modal) modal.classList.add('hidden');
}

function setupShoppingListEvents() {
    const closeBtn = $('closeShoppingListBtn');
    const overlay = document.querySelector('#shoppingListModal .feature-modal-overlay');
    const addItemBtn = $('addShoppingItemBtn');
    const clearCheckedBtn = $('clearCheckedBtn');
    const shareListBtn = $('shareShoppingListBtn');
    
    if (closeBtn) closeBtn.onclick = closeShoppingList;
    if (overlay) overlay.onclick = closeShoppingList;
    if (addItemBtn) addItemBtn.onclick = addShoppingItem;
    if (clearCheckedBtn) clearCheckedBtn.onclick = clearCheckedItems;
    if (shareListBtn) shareListBtn.onclick = shareShoppingList;
    
    // Sort buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            sortShoppingList(btn.dataset.sort);
        };
    });
}

function sortShoppingList(sortType) {
    switch (sortType) {
        case 'alpha':
            state.shoppingList.sort((a, b) => a.text.localeCompare(b.text, 'no'));
            break;
        case 'category':
            state.shoppingList.sort((a, b) => (a.category || 'annet').localeCompare(b.category || 'annet', 'no'));
            break;
        case 'added':
        default:
            // Keep original order
            break;
    }
    renderShoppingList();
    saveShoppingList();
}

function renderShoppingList() {
    const container = $('shoppingListItems');
    const statsEl = $('shoppingListStats');
    if (!container) return;
    
    // Update stats
    const total = state.shoppingList.length;
    const checked = state.shoppingList.filter(i => i.checked).length;
    if (statsEl) statsEl.textContent = `${total} varer • ${checked} kjøpt`;
    
    if (state.shoppingList.length === 0) {
        container.innerHTML = `
            <div class="shopping-list-empty">
                <span>🛒</span>
                <p>Handlelisten er tom</p>
                <p>Generer fra ukemeny eller legg til manuelt</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.shoppingList.map((item, i) => `
        <div class="shopping-item ${item.checked ? 'checked' : ''}">
            <input type="checkbox" ${item.checked ? 'checked' : ''} data-index="${i}">
            <span class="shopping-item-text">${escapeHtml(item.text)}</span>
            <button class="shopping-item-delete" data-index="${i}">🗑️</button>
        </div>
    `).join('');
    
    // Add event handlers
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.onchange = () => {
            const index = parseInt(cb.dataset.index);
            state.shoppingList[index].checked = cb.checked;
            saveShoppingList();
            renderShoppingList();
        };
    });
    
    container.querySelectorAll('.shopping-item-delete').forEach(btn => {
        btn.onclick = () => {
            const index = parseInt(btn.dataset.index);
            state.shoppingList.splice(index, 1);
            saveShoppingList();
            renderShoppingList();
        };
    });
}

function addShoppingItem() {
    const item = prompt('Legg til vare:');
    if (item && item.trim()) {
        state.shoppingList.push({ text: item.trim(), checked: false });
        saveShoppingList();
        renderShoppingList();
    }
}

function clearCheckedItems() {
    state.shoppingList = state.shoppingList.filter(item => !item.checked);
    saveShoppingList();
    renderShoppingList();
    showToast('Avkryssede varer fjernet', 'success');
}

async function shareShoppingList() {
    const items = state.shoppingList.map(item => `${item.checked ? '✓' : '☐'} ${item.text}`).join('\n');
    const text = `🛒 Handleliste:\n\n${items}`;
    
    if (navigator.share) {
        try {
            await navigator.share({ title: 'Handleliste', text });
        } catch (e) {
            copyToClipboard(text);
        }
    } else {
        copyToClipboard(text);
    }
}

async function saveShoppingList() {
    try {
        await saveToFirestore('settings', 'shoppingList', { data: state.shoppingList });
    } catch (e) {
        console.warn('Could not save shopping list:', e);
    }
}

// ===== COOKING TIMER =====
function openTimer() {
    const modal = $('timerModal');
    if (modal) {
        modal.classList.remove('hidden');
        renderTimerDisplay();
        setupTimerEvents();
    }
}

function closeTimer() {
    const modal = $('timerModal');
    if (modal) modal.classList.add('hidden');
}

function setupTimerEvents() {
    const closeBtn = $('closeTimerBtn');
    const overlay = document.querySelector('#timerModal .feature-modal-overlay');
    const startBtn = $('timerStartBtn');
    const pauseBtn = $('timerPauseBtn');
    const resetBtn = $('timerResetBtn');
    
    if (closeBtn) closeBtn.onclick = closeTimer;
    if (overlay) overlay.onclick = closeTimer;
    if (startBtn) startBtn.onclick = startTimer;
    if (pauseBtn) pauseBtn.onclick = pauseTimer;
    if (resetBtn) resetBtn.onclick = resetTimer;
    
    // Presets
    $$('.timer-preset').forEach(preset => {
        preset.onclick = () => {
            const minutes = parseInt(preset.dataset.minutes);
            timerSeconds = minutes * 60;
            timerLabel = preset.textContent;
            $$('.timer-preset').forEach(p => p.classList.remove('active'));
            preset.classList.add('active');
            renderTimerDisplay();
        };
    });
    
    // Custom input
    const customMinutes = $('customMinutes');
    if (customMinutes) {
        customMinutes.onchange = () => {
            const minutes = parseInt(customMinutes.value) || 0;
            timerSeconds = minutes * 60;
            timerLabel = `${minutes} min`;
            $$('.timer-preset').forEach(p => p.classList.remove('active'));
            renderTimerDisplay();
        };
    }
}

function renderTimerDisplay() {
    const display = $('timerDisplay');
    const floatingDisplay = $('floatingTimerDisplay');
    
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    if (display) {
        display.textContent = timeStr;
        display.classList.toggle('running', timerRunning);
        display.classList.toggle('finished', timerSeconds === 0 && !timerRunning && timerLabel);
    }
    
    if (floatingDisplay) {
        floatingDisplay.textContent = timeStr;
        floatingDisplay.classList.toggle('running', timerRunning);
        floatingDisplay.classList.toggle('finished', timerSeconds === 0 && !timerRunning && timerLabel);
    }
    
    // Show/hide floating timer
    const floatingTimer = $('floatingTimer');
    if (floatingTimer) {
        floatingTimer.classList.toggle('hidden', !timerRunning && timerSeconds === 0);
    }
}

function startTimer() {
    if (timerSeconds <= 0) {
        showToast('Velg en tid først', 'warning');
        return;
    }
    
    timerRunning = true;
    
    timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
            timerSeconds--;
            renderTimerDisplay();
        } else {
            // Timer finished!
            clearInterval(timerInterval);
            timerRunning = false;
            renderTimerDisplay();
            timerFinished();
        }
    }, 1000);
    
    renderTimerDisplay();
    showToast('Timer startet! ⏱️', 'success');
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    renderTimerDisplay();
}

function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSeconds = 0;
    timerLabel = '';
    $$('.timer-preset').forEach(p => p.classList.remove('active'));
    renderTimerDisplay();
}

function timerFinished() {
    // Sound notification (if possible)
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR4Idce/bABKXbz/AAAA');
        audio.play().catch(() => {});
    } catch (e) {}
    
    // Visual notification
    showToast(`⏰ ${timerLabel || 'Timer'} er ferdig!`, 'success');
    triggerConfetti();
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏰ Timer ferdig!', { body: timerLabel || 'Tiden er ute!' });
    }
}

// ===== LANGUAGE SELECTOR =====
function openLanguageSelector() {
    const modal = $('languageModal');
    if (modal) {
        modal.classList.remove('hidden');
        setupLanguageEvents();
        updateLanguageButtons();
    }
}

function closeLanguageSelector() {
    const modal = $('languageModal');
    if (modal) modal.classList.add('hidden');
}

function setupLanguageEvents() {
    const closeBtn = $('closeLanguageBtn');
    const overlay = document.querySelector('#languageModal .feature-modal-overlay');
    
    if (closeBtn) closeBtn.onclick = closeLanguageSelector;
    if (overlay) overlay.onclick = closeLanguageSelector;
    
    $$('.language-btn').forEach(btn => {
        btn.onclick = () => {
            const lang = btn.dataset.lang;
            setLanguage(lang);
            closeLanguageSelector();
        };
    });
}

function updateLanguageButtons() {
    $$('.language-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLanguage);
    });
}

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('kokebok_language', lang);
    showToast(`Språk endret til ${getLanguageName(lang)}`, 'success');
    // In a full implementation, this would update all UI text
}

function getLanguageName(code) {
    const names = { no: 'Norsk', en: 'English', sv: 'Svenska', da: 'Dansk', de: 'Deutsch' };
    return names[code] || code;
}

// ===== PORTION CALCULATOR =====
function openPortionCalculator() {
    const modal = $('portionCalculatorModal');
    if (modal) {
        modal.classList.remove('hidden');
        setupPortionCalculatorEvents();
    }
}

function closePortionCalculator() {
    const modal = $('portionCalculatorModal');
    if (modal) modal.classList.add('hidden');
}

function setupPortionCalculatorEvents() {
    const closeBtn = $('closePortionCalculatorBtn');
    const overlay = document.querySelector('#portionCalculatorModal .feature-modal-overlay');
    const minusBtn = $('portionMinusBtn');
    const plusBtn = $('portionPlusBtn');
    
    if (closeBtn) closeBtn.onclick = closePortionCalculator;
    if (overlay) overlay.onclick = closePortionCalculator;
    if (minusBtn) minusBtn.onclick = () => adjustPortions(-1);
    if (plusBtn) plusBtn.onclick = () => adjustPortions(1);
}

function adjustPortions(delta) {
    const originalInput = $('originalPortions');
    const newInput = $('newPortions');
    
    if (!newInput) return;
    
    let newValue = (parseInt(newInput.value) || 4) + delta;
    if (newValue < 1) newValue = 1;
    if (newValue > 50) newValue = 50;
    
    newInput.value = newValue;
    calculateAdjustedIngredients();
}

function calculateAdjustedIngredients() {
    const originalInput = $('originalPortions');
    const newInput = $('newPortions');
    const container = $('adjustedIngredients');
    
    if (!container || !state.currentRecipe) return;
    
    const originalPortions = parseInt(originalInput?.value) || 4;
    const newPortions = parseInt(newInput?.value) || 4;
    const multiplier = newPortions / originalPortions;
    
    const ingredients = state.currentRecipe.ingredients?.split('\n') || [];
    
    container.innerHTML = ingredients.map(ing => {
        // Try to parse numbers
        const adjusted = ing.replace(/(\d+(?:[.,]\d+)?)/g, (match) => {
            const num = parseFloat(match.replace(',', '.'));
            const result = (num * multiplier).toFixed(1).replace('.0', '');
            return result;
        });
        
        return `
            <div class="adjusted-ingredient">
                <span>${escapeHtml(adjusted)}</span>
                ${adjusted !== ing ? `<span class="adjusted-amount">×${multiplier.toFixed(1)}</span>` : ''}
            </div>
        `;
    }).join('');
}

// ===== FAVORITES =====
function filterFavorites() {
    state.filterCategory = '';
    // In a real implementation, this would filter by favorite flag
    showToast('Viser favoritter', 'info');
}

function toggleFavorite(recipeId) {
    const index = state.favorites.indexOf(recipeId);
    if (index === -1) {
        state.favorites.push(recipeId);
        showToast('Lagt til i favoritter ⭐', 'success');
    } else {
        state.favorites.splice(index, 1);
        showToast('Fjernet fra favoritter', 'info');
    }
    saveFavorites();
    updateFavoritesCount();
}

async function saveFavorites() {
    try {
        await saveToFirestore('settings', 'favorites', { data: state.favorites });
    } catch (e) {
        console.warn('Could not save favorites:', e);
    }
}

function updateFavoritesCount() {
    const el = $('statFavorites');
    if (el) {
        const count = state.favorites.length;
        el.querySelector('.stat-value').textContent = count;
    }
}

function updatePlannedMealsCount() {
    const el = $('statPlanned');
    if (el) {
        const count = Object.keys(state.mealPlan).length;
        el.querySelector('.stat-value').textContent = count;
    }
}

// ===== CONFETTI EFFECT =====
function triggerConfetti() {
    const canvas = $('confettiCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3'];
    
    // Create particles
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20 - 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 10 + 5,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10
        });
    }
    
    let frame = 0;
    const maxFrames = 120;
    
    function animate() {
        if (frame >= maxFrames) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.5; // Gravity
            p.rotation += p.rotationSpeed;
            p.vx *= 0.99; // Air resistance
            
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 1 - (frame / maxFrames);
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            ctx.restore();
        });
        
        frame++;
        requestAnimationFrame(animate);
    }
    
    animate();
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
    
    // Success celebration
    if (type === 'success') {
        toast.classList.add('success-pulse');
    }
    
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    setupAuth();
    requestNotificationPermission();
});

// Request notification permission for timer
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Load extra settings after user login
async function loadExtraSettings() {
    try {
        // Load favorites
        const favSettings = await loadCollection('settings');
        const favDoc = favSettings.find(s => s.id === 'favorites');
        if (favDoc?.data) state.favorites = favDoc.data;
        
        // Load meal plan
        const mealPlanDoc = favSettings.find(s => s.id === 'mealPlan');
        if (mealPlanDoc?.data) state.mealPlan = mealPlanDoc.data;
        
        // Load shopping list
        const shoppingDoc = favSettings.find(s => s.id === 'shoppingList');
        if (shoppingDoc?.data) state.shoppingList = shoppingDoc.data;
        
        updateFavoritesCount();
        updatePlannedMealsCount();
    } catch (e) {
        console.warn('Could not load extra settings:', e);
    }
}

// Make functions available globally for onclick handlers
window.openRecipeEditor = openRecipeEditor;
window.openBookEditor = openBookEditor;
window.closeModal = closeModal;
window.saveExternalRecipe = saveExternalRecipe;
window.addToMealPlanFromSearch = addToMealPlanFromSearch;
window.openRecipeSearch = openRecipeSearch;
window.openMealPlanner = openMealPlanner;
window.openShoppingList = openShoppingList;
window.openTimer = openTimer;
window.openLanguageSelector = openLanguageSelector;
window.openPortionCalculator = openPortionCalculator;
window.toggleFavorite = toggleFavorite;

// ===== V3.1 PREMIUM FEATURES =====

// ===== RANDOM RECIPE ("Hva skal vi ha i dag?") =====
function getRandomRecipe() {
    if (state.recipes.length === 0) {
        showToast('Du har ingen oppskrifter ennå! Legg til noen først 😊', 'warning');
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * state.recipes.length);
    const recipe = state.recipes[randomIndex];
    
    // Show celebration
    triggerConfetti();
    
    state.currentRecipe = recipe;
    navigateTo('recipeView');
    
    showToast(`🎲 Forslag: ${recipe.name}!`, 'success');
}

// ===== RECIPE RATING SYSTEM =====
async function rateRecipe(recipeId, rating) {
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    recipe.rating = rating;
    await saveToFirestore('recipes', recipeId, { rating });
    
    showToast(`⭐ ${rating}/5 stjerner!`, 'success');
    
    if (state.currentView === 'recipeView') {
        renderRecipeView();
    }
}

// ===== COOKING MODE (Fullscreen step-by-step) =====
function startCookingMode() {
    if (!state.currentRecipe) return;
    
    const recipe = state.currentRecipe;
    const steps = recipe.instructions?.split('\n').filter(s => s.trim()) || [];
    
    if (steps.length === 0) {
        showToast('Ingen fremgangsmåte å vise', 'warning');
        return;
    }
    
    // Create cooking mode overlay
    const overlay = document.createElement('div');
    overlay.id = 'cookingModeOverlay';
    overlay.className = 'cooking-mode-overlay';
    
    let currentStep = 0;
    
    const renderStep = () => {
        overlay.innerHTML = `
            <div class="cooking-mode-content">
                <div class="cooking-mode-header">
                    <h2>👨‍🍳 ${escapeHtml(recipe.name)}</h2>
                    <button class="cooking-mode-close" onclick="exitCookingMode()">✕</button>
                </div>
                <div class="cooking-mode-step-indicator">
                    Steg ${currentStep + 1} av ${steps.length}
                </div>
                <div class="cooking-mode-progress">
                    <div class="cooking-mode-progress-fill" style="width: ${((currentStep + 1) / steps.length) * 100}%"></div>
                </div>
                <div class="cooking-mode-instruction">
                    ${escapeHtml(steps[currentStep])}
                </div>
                <div class="cooking-mode-nav">
                    <button class="cooking-mode-btn" ${currentStep === 0 ? 'disabled' : ''} onclick="cookingModePrev()">
                        ◀ Forrige
                    </button>
                    <button class="cooking-mode-timer-btn" onclick="openTimer()">
                        ⏱️ Timer
                    </button>
                    ${currentStep === steps.length - 1 
                        ? `<button class="cooking-mode-btn done" onclick="exitCookingMode(); triggerConfetti(); showToast('🎉 Gratulerer! Måltidet er ferdig!', 'success');">
                            ✓ Ferdig!
                        </button>`
                        : `<button class="cooking-mode-btn" onclick="cookingModeNext()">
                            Neste ▶
                        </button>`
                    }
                </div>
            </div>
        `;
    };
    
    window.cookingModePrev = () => {
        if (currentStep > 0) {
            currentStep--;
            renderStep();
        }
    };
    
    window.cookingModeNext = () => {
        if (currentStep < steps.length - 1) {
            currentStep++;
            renderStep();
        }
    };
    
    window.exitCookingMode = () => {
        overlay.remove();
        // Wake lock release
        if (window.wakeLock) {
            window.wakeLock.release();
        }
    };
    
    renderStep();
    document.body.appendChild(overlay);
    
    // Keep screen on during cooking
    if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').then(lock => {
            window.wakeLock = lock;
        }).catch(() => {});
    }
    
    showToast('👨‍🍳 Kokmodus aktivert!', 'success');
}

// ===== NUTRITION ESTIMATOR =====
function openNutritionEstimator() {
    const modal = $('nutritionModal');
    if (modal) {
        modal.classList.remove('hidden');
        if (state.currentRecipe) {
            estimateNutrition(state.currentRecipe);
        }
    }
}

function closeNutritionEstimator() {
    const modal = $('nutritionModal');
    if (modal) modal.classList.add('hidden');
}

function estimateNutrition(recipe) {
    const container = $('nutritionContent');
    if (!container) return;
    
    // Simple estimation based on common ingredients
    const ingredients = (recipe.ingredients || '').toLowerCase();
    let calories = 300;
    let protein = 15;
    let carbs = 30;
    let fat = 10;
    
    // Rough estimates
    if (ingredients.includes('kjøtt') || ingredients.includes('biff') || ingredients.includes('kylling')) {
        protein += 25;
        calories += 200;
    }
    if (ingredients.includes('pasta') || ingredients.includes('ris') || ingredients.includes('poteter')) {
        carbs += 40;
        calories += 150;
    }
    if (ingredients.includes('ost') || ingredients.includes('fløte') || ingredients.includes('smør')) {
        fat += 20;
        calories += 200;
    }
    if (ingredients.includes('grønnsaker') || ingredients.includes('salat')) {
        calories -= 50;
    }
    if (ingredients.includes('sukker') || ingredients.includes('sjokolade')) {
        carbs += 30;
        calories += 150;
    }
    
    container.innerHTML = `
        <div class="nutrition-header">
            <h4>📊 Estimert for "${escapeHtml(recipe.name)}"</h4>
            <p class="nutrition-disclaimer">* Grove estimater basert på ingredienser</p>
        </div>
        <div class="nutrition-grid">
            <div class="nutrition-item calories">
                <span class="nutrition-value">${calories}</span>
                <span class="nutrition-label">Kalorier</span>
            </div>
            <div class="nutrition-item protein">
                <span class="nutrition-value">${protein}g</span>
                <span class="nutrition-label">Protein</span>
            </div>
            <div class="nutrition-item carbs">
                <span class="nutrition-value">${carbs}g</span>
                <span class="nutrition-label">Karbohydrater</span>
            </div>
            <div class="nutrition-item fat">
                <span class="nutrition-value">${fat}g</span>
                <span class="nutrition-label">Fett</span>
            </div>
        </div>
        <div class="nutrition-chart">
            <div class="nutrition-bar protein-bar" style="width: ${(protein / 50) * 100}%"></div>
            <div class="nutrition-bar carbs-bar" style="width: ${(carbs / 100) * 100}%"></div>
            <div class="nutrition-bar fat-bar" style="width: ${(fat / 50) * 100}%"></div>
        </div>
    `;
}

// ===== RECIPE NOTES / TIPS =====
async function addCookingTip() {
    if (!state.currentRecipe) return;
    
    const tip = prompt('Legg til et koketips eller notat:');
    if (!tip || !tip.trim()) return;
    
    const recipe = state.currentRecipe;
    recipe.tips = recipe.tips || [];
    recipe.tips.push({
        text: tip.trim(),
        date: new Date().toISOString()
    });
    
    await saveToFirestore('recipes', recipe.id, { tips: recipe.tips });
    renderRecipeView();
    showToast('💡 Tips lagt til!', 'success');
}

// ===== PRINT RECIPE =====
function printRecipe() {
    if (!state.currentRecipe) return;
    
    const recipe = state.currentRecipe;
    const category = state.categories.find(c => c.id === recipe.category);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${escapeHtml(recipe.name)} - Familiens Kokebok</title>
            <style>
                body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; }
                h1 { color: #8B4513; border-bottom: 2px solid #D2691E; padding-bottom: 10px; }
                .meta { color: #666; font-style: italic; margin-bottom: 20px; }
                h2 { color: #A0522D; margin-top: 30px; }
                .ingredients { background: #FFF8DC; padding: 15px; border-radius: 8px; }
                .ingredients pre { margin: 0; white-space: pre-wrap; font-family: inherit; }
                .instructions { line-height: 1.8; }
                .instructions pre { white-space: pre-wrap; font-family: inherit; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #888; font-size: 12px; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <h1>${escapeHtml(recipe.name)}</h1>
            <div class="meta">
                ${category ? category.icon + ' ' + category.name : ''} 
                ${recipe.servings ? ' • 👥 ' + escapeHtml(recipe.servings) : ''}
                ${recipe.prepTime ? ' • ⏱️ ' + escapeHtml(recipe.prepTime) : ''}
            </div>
            
            ${recipe.ingredients ? `
                <h2>🥄 Ingredienser</h2>
                <div class="ingredients"><pre>${escapeHtml(recipe.ingredients)}</pre></div>
            ` : ''}
            
            ${recipe.instructions ? `
                <h2>👩‍🍳 Fremgangsmåte</h2>
                <div class="instructions"><pre>${escapeHtml(recipe.instructions)}</pre></div>
            ` : ''}
            
            ${recipe.notes ? `
                <h2>📝 Notater</h2>
                <p>${escapeHtml(recipe.notes)}</p>
            ` : ''}
            
            <div class="footer">Skrevet ut fra Familiens Kokebok • ${new Date().toLocaleDateString('nb-NO')}</div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ===== DUPLICATE RECIPE =====
async function duplicateRecipe() {
    if (!state.currentRecipe) return;
    
    const recipe = state.currentRecipe;
    const newRecipe = {
        ...recipe,
        name: recipe.name + ' (kopi)',
        id: undefined,
        createdAt: undefined
    };
    delete newRecipe.id;
    
    const id = await saveToFirestore('recipes', null, newRecipe);
    state.recipes.push({ id, ...newRecipe, createdAt: { toDate: () => new Date() } });
    
    showToast('📋 Oppskrift duplisert!', 'success');
    renderDashboard();
}

// ===== SEASONAL SUGGESTIONS =====
function getSeasonalSuggestion() {
    const month = new Date().getMonth();
    let seasonal = [];
    
    // Norwegian seasonal foods
    if (month >= 11 || month <= 1) { // Winter
        seasonal = ['julekaker', 'ribbe', 'pinnekjøtt', 'lutefisk', 'gløgg'];
    } else if (month >= 2 && month <= 4) { // Spring
        seasonal = ['lam', 'asparges', 'ramsløk', 'påskeegg', 'mazarinkake'];
    } else if (month >= 5 && month <= 7) { // Summer
        seasonal = ['jordbær', 'grillmat', 'salater', 'is', 'rabarbra'];
    } else { // Autumn
        seasonal = ['sopp', 'vilt', 'epler', 'plommer', 'pærer'];
    }
    
    return seasonal;
}

function showSeasonalTips() {
    const seasonal = getSeasonalSuggestion();
    const seasonName = ['vinter', 'vinter', 'vår', 'vår', 'vår', 'sommer', 'sommer', 'sommer', 'høst', 'høst', 'høst', 'vinter'][new Date().getMonth()];
    
    showToast(`🍂 ${seasonName.charAt(0).toUpperCase() + seasonName.slice(1)}tips: Prøv ${seasonal[Math.floor(Math.random() * seasonal.length)]}!`, 'info');
}

// ===== QUICK STATS ANIMATION =====
function animateStats() {
    const stats = $$('.stat-value');
    stats.forEach(stat => {
        const target = parseInt(stat.textContent) || 0;
        let current = 0;
        const increment = Math.ceil(target / 20);
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            stat.textContent = current;
        }, 50);
    });
}

// ===== RECIPE EXPORT TO JSON =====
function exportRecipeAsJson() {
    if (!state.currentRecipe) return;
    
    const recipe = state.currentRecipe;
    const json = JSON.stringify(recipe, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipe.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('📄 Oppskrift eksportert!', 'success');
}

// ===== VOICE CONTROL (Beta) =====
function setupVoiceControl() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'nb-NO';
    recognition.continuous = false;
    
    recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        
        if (command.includes('neste')) {
            if (window.cookingModeNext) window.cookingModeNext();
        } else if (command.includes('forrige')) {
            if (window.cookingModePrev) window.cookingModePrev();
        } else if (command.includes('timer') || command.includes('klokke')) {
            openTimer();
        } else if (command.includes('stopp') || command.includes('avslutt')) {
            if (window.exitCookingMode) window.exitCookingMode();
        }
        
        showToast(`🎤 "${command}"`, 'info');
    };
    
    window.startVoiceControl = () => {
        recognition.start();
        showToast('🎤 Lytter...', 'info');
    };
}

// ===== RECIPE COST ESTIMATOR =====
function estimateCost() {
    if (!state.currentRecipe) return;
    
    const ingredients = (state.currentRecipe.ingredients || '').toLowerCase();
    let cost = 50; // Base cost
    
    // Norwegian price estimates
    if (ingredients.includes('biff') || ingredients.includes('laks') || ingredients.includes('reker')) cost += 100;
    if (ingredients.includes('kylling')) cost += 50;
    if (ingredients.includes('kjøttdeig')) cost += 40;
    if (ingredients.includes('ost')) cost += 30;
    if (ingredients.includes('fløte') || ingredients.includes('smør')) cost += 25;
    if (ingredients.includes('grønnsaker') || ingredients.includes('salat')) cost += 20;
    
    const servings = parseInt(state.currentRecipe.servings) || 4;
    const perPerson = Math.round(cost / servings);
    
    showToast(`💰 Estimert kostnad: ~${cost} kr (${perPerson} kr/pers)`, 'info');
}

// ===== SHARE TO SOCIAL MEDIA =====
async function shareToSocial(platform) {
    if (!state.currentRecipe) return;
    
    const recipe = state.currentRecipe;
    const text = `🍳 ${recipe.name} - Prøv denne oppskriften fra Familiens Kokebok!`;
    const url = window.location.href;
    
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
        pinterest: `https://pinterest.com/pin/create/button/?description=${encodeURIComponent(text)}`,
        email: `mailto:?subject=${encodeURIComponent(recipe.name)}&body=${encodeURIComponent(text + '\n\nIngredienser:\n' + recipe.ingredients)}`
    };
    
    if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
}

// ===== ACHIEVEMENTS SYSTEM =====
const achievements = {
    firstRecipe: { name: 'Første oppskrift', icon: '🎉', desc: 'La til din første oppskrift' },
    fiveRecipes: { name: 'Matentusiast', icon: '👨‍🍳', desc: '5 oppskrifter i samlingen' },
    tenRecipes: { name: 'Kokebok-mester', icon: '📚', desc: '10 oppskrifter i samlingen' },
    firstBook: { name: 'Bokskaper', icon: '📖', desc: 'Opprettet din første kokebok' },
    mealPlanner: { name: 'Planlegger', icon: '📅', desc: 'Planla en hel uke' },
    shoppingPro: { name: 'Handleproff', icon: '🛒', desc: 'Brukte handlelisten' }
};

function checkAchievements() {
    const earned = JSON.parse(localStorage.getItem('kokebok_achievements') || '[]');
    
    if (state.recipes.length >= 1 && !earned.includes('firstRecipe')) {
        unlockAchievement('firstRecipe');
    }
    if (state.recipes.length >= 5 && !earned.includes('fiveRecipes')) {
        unlockAchievement('fiveRecipes');
    }
    if (state.recipes.length >= 10 && !earned.includes('tenRecipes')) {
        unlockAchievement('tenRecipes');
    }
    if (state.books.length >= 1 && !earned.includes('firstBook')) {
        unlockAchievement('firstBook');
    }
}

function unlockAchievement(id) {
    const achievement = achievements[id];
    if (!achievement) return;
    
    const earned = JSON.parse(localStorage.getItem('kokebok_achievements') || '[]');
    earned.push(id);
    localStorage.setItem('kokebok_achievements', JSON.stringify(earned));
    
    // Show achievement popup
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-text">
            <strong>🏆 Prestasjon låst opp!</strong>
            <span>${achievement.name}</span>
        </div>
    `;
    document.body.appendChild(popup);
    
    triggerConfetti();
    
    setTimeout(() => popup.remove(), 4000);
}

function showAchievements() {
    const earned = JSON.parse(localStorage.getItem('kokebok_achievements') || '[]');
    
    let html = '<div class="achievements-grid">';
    for (const [id, ach] of Object.entries(achievements)) {
        const unlocked = earned.includes(id);
        html += `
            <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
                <span class="achievement-icon">${unlocked ? ach.icon : '🔒'}</span>
                <span class="achievement-name">${ach.name}</span>
                <span class="achievement-desc">${ach.desc}</span>
            </div>
        `;
    }
    html += '</div>';
    
    showModal('🏆 Prestasjoner', html, []);
}

// ===== RECIPE OF THE DAY =====
function getRecipeOfTheDay() {
    if (state.recipes.length === 0) return null;
    
    // Use date as seed for consistent daily recipe
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = seed % state.recipes.length;
    
    return state.recipes[index];
}

// ===== DARK MODE SCHEDULE =====
function setupAutoDarkMode() {
    const hour = new Date().getHours();
    const shouldBeDark = hour >= 20 || hour < 7;
    
    if (state.settings.autoDarkMode && shouldBeDark !== state.settings.darkMode) {
        state.settings.darkMode = shouldBeDark;
        document.body.classList.toggle('dark-mode', shouldBeDark);
    }
}

// ===== KEYBOARD SHORTCUTS =====
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'n':
                    e.preventDefault();
                    openRecipeEditor();
                    break;
                case 'f':
                    e.preventDefault();
                    $('searchInput')?.focus();
                    break;
                case 'p':
                    e.preventDefault();
                    if (state.currentRecipe) printRecipe();
                    break;
            }
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            closeRecipeSearch();
            closeMealPlanner();
            closeShoppingList();
            closeTimer();
            closeRecipePicker();
            closeNutritionEstimator();
            if (window.exitCookingMode) window.exitCookingMode();
        }
    });
}

// ===== COOKBOOK STATISTICS =====
function getCookbookStats() {
    const stats = {
        totalRecipes: state.recipes.length,
        totalBooks: state.books.length,
        categories: {},
        favoriteCount: state.favorites.length,
        mealsPlanned: Object.keys(state.mealPlan).length,
        shoppingItems: state.shoppingList.length,
        achievementsUnlocked: JSON.parse(localStorage.getItem('kokebok_achievements') || '[]').length,
        totalAchievements: Object.keys(achievements).length
    };
    
    // Count recipes per category
    state.recipes.forEach(recipe => {
        const cat = recipe.category || 'annet';
        stats.categories[cat] = (stats.categories[cat] || 0) + 1;
    });
    
    return stats;
}

function showCookbookStats() {
    const stats = getCookbookStats();
    const categoryList = Object.entries(stats.categories)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, count]) => `<li>${getCategoryName(cat)}: ${count} oppskrifter</li>`)
        .join('');
    
    const html = `
        <div class="stats-grid">
            <div class="stat-card">
                <span class="stat-icon">📝</span>
                <span class="stat-value">${stats.totalRecipes}</span>
                <span class="stat-label">Oppskrifter</span>
            </div>
            <div class="stat-card">
                <span class="stat-icon">📚</span>
                <span class="stat-value">${stats.totalBooks}</span>
                <span class="stat-label">Kokebøker</span>
            </div>
            <div class="stat-card">
                <span class="stat-icon">⭐</span>
                <span class="stat-value">${stats.favoriteCount}</span>
                <span class="stat-label">Favoritter</span>
            </div>
            <div class="stat-card">
                <span class="stat-icon">🏆</span>
                <span class="stat-value">${stats.achievementsUnlocked}/${stats.totalAchievements}</span>
                <span class="stat-label">Prestasjoner</span>
            </div>
        </div>
        ${categoryList ? `
            <h4 style="margin: 20px 0 12px;">Oppskrifter per kategori</h4>
            <ul class="stats-category-list">${categoryList}</ul>
        ` : ''}
    `;
    
    showModal('📊 Din kokebok i tall', html, []);
}
window.showCookbookStats = showCookbookStats;

// ===== ALLERGY FILTER =====
const commonAllergens = {
    gluten: ['mel', 'hvete', 'bygg', 'rug', 'havre', 'pasta', 'brød', 'wheat', 'flour', 'bread'],
    dairy: ['melk', 'fløte', 'ost', 'smør', 'rømme', 'yoghurt', 'milk', 'cream', 'cheese', 'butter'],
    eggs: ['egg', 'eggehvite', 'eggeplomme', 'eggs'],
    nuts: ['mandel', 'hasselnøtt', 'valnøtt', 'cashew', 'pistasjnøtt', 'peanøtt', 'almond', 'walnut', 'peanut', 'nuts'],
    shellfish: ['reker', 'hummer', 'krabbe', 'skjell', 'blåskjell', 'shrimp', 'lobster', 'crab'],
    fish: ['fisk', 'laks', 'torsk', 'sei', 'makrell', 'fish', 'salmon', 'cod'],
    soy: ['soya', 'tofu', 'soy', 'soybean']
};

function filterRecipesByAllergens(allergens) {
    return state.recipes.filter(recipe => {
        const ingredients = (recipe.ingredients || '').toLowerCase();
        
        for (const allergen of allergens) {
            const keywords = commonAllergens[allergen] || [];
            for (const keyword of keywords) {
                if (ingredients.includes(keyword)) {
                    return false;
                }
            }
        }
        
        return true;
    });
}

function showAllergyFilter() {
    const html = `
        <p>Velg allergener å filtrere bort:</p>
        <div class="allergen-checkboxes">
            ${Object.keys(commonAllergens).map(allergen => `
                <label class="allergen-label">
                    <input type="checkbox" value="${allergen}" class="allergen-checkbox">
                    <span>${getAllergenName(allergen)}</span>
                </label>
            `).join('')}
        </div>
        <button id="applyAllergyFilter" class="action-btn primary" style="margin-top: 16px; width: 100%;">
            🔍 Filtrer oppskrifter
        </button>
    `;
    
    showModal('🚫 Allergi-filter', html, []);
    
    setTimeout(() => {
        const btn = $('applyAllergyFilter');
        if (btn) {
            btn.onclick = () => {
                const checked = Array.from(document.querySelectorAll('.allergen-checkbox:checked'))
                    .map(cb => cb.value);
                
                if (checked.length === 0) {
                    showToast('Velg minst én allergen', 'warning');
                    return;
                }
                
                const safeRecipes = filterRecipesByAllergens(checked);
                closeModal();
                showFilteredRecipes(safeRecipes, `Oppskrifter uten ${checked.map(getAllergenName).join(', ')}`);
            };
        }
    }, 100);
}

function getAllergenName(allergen) {
    const names = {
        gluten: '🌾 Gluten',
        dairy: '🥛 Meieri',
        eggs: '🥚 Egg',
        nuts: '🥜 Nøtter',
        shellfish: '🦐 Skalldyr',
        fish: '🐟 Fisk',
        soy: '🫘 Soya'
    };
    return names[allergen] || allergen;
}

function showFilteredRecipes(recipes, title) {
    if (recipes.length === 0) {
        showToast('Ingen oppskrifter matcher filteret', 'warning');
        return;
    }
    
    state.filteredRecipes = recipes;
    
    const html = `
        <p>${recipes.length} oppskrifter funnet</p>
        <div class="filtered-recipes-list">
            ${recipes.map(r => `
                <div class="filtered-recipe-item" data-id="${r.id}">
                    <span class="filtered-recipe-icon">${r.images?.[0] ? '🍽️' : '📝'}</span>
                    <span class="filtered-recipe-name">${escapeHtml(r.name)}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    showModal(title, html, []);
    
    setTimeout(() => {
        document.querySelectorAll('.filtered-recipe-item').forEach(item => {
            item.onclick = () => {
                const recipe = state.recipes.find(r => r.id === item.dataset.id);
                if (recipe) {
                    closeModal();
                    viewRecipe(recipe);
                }
            };
        });
    }, 100);
}
window.showAllergyFilter = showAllergyFilter;

// ===== WEEKLY MEAL SUGGESTIONS =====
function getWeeklySuggestions() {
    if (state.recipes.length < 7) {
        showToast('Du trenger minst 7 oppskrifter for ukeforslag', 'warning');
        return;
    }
    
    // Shuffle recipes and pick 7
    const shuffled = [...state.recipes].sort(() => Math.random() - 0.5);
    const suggestions = shuffled.slice(0, 7);
    
    const days = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
    
    const html = `
        <p>Her er forslag til ukens måltider basert på dine oppskrifter:</p>
        <div class="weekly-suggestions">
            ${suggestions.map((recipe, i) => `
                <div class="suggestion-day">
                    <span class="suggestion-day-name">${days[i]}</span>
                    <span class="suggestion-recipe">${escapeHtml(recipe.name)}</span>
                </div>
            `).join('')}
        </div>
        <button id="applySuggestionsBtn" class="action-btn primary" style="margin-top: 16px; width: 100%;">
            ✅ Bruk disse forslagene
        </button>
        <button id="refreshSuggestionsBtn" class="action-btn secondary" style="margin-top: 8px; width: 100%;">
            🔄 Nye forslag
        </button>
    `;
    
    showModal('💡 Ukens måltidsforslag', html, []);
    
    setTimeout(() => {
        const applyBtn = $('applySuggestionsBtn');
        const refreshBtn = $('refreshSuggestionsBtn');
        
        if (applyBtn) {
            applyBtn.onclick = () => {
                const today = new Date();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay() + 1);
                
                suggestions.forEach((recipe, i) => {
                    const date = new Date(startOfWeek);
                    date.setDate(startOfWeek.getDate() + i);
                    const dateKey = date.toISOString().split('T')[0];
                    
                    const ingredients = recipe.ingredients ? recipe.ingredients.split('\n').filter(ing => ing.trim()) : [];
                    state.mealPlan[dateKey] = {
                        name: recipe.name,
                        ingredients: ingredients
                    };
                });
                
                saveMealPlan();
                updatePlannedMealsCount();
                closeModal();
                showToast('Ukemeny fylt ut med forslag!', 'success');
            };
        }
        
        if (refreshBtn) {
            refreshBtn.onclick = () => {
                closeModal();
                getWeeklySuggestions();
            };
        }
    }, 100);
}
window.getWeeklySuggestions = getWeeklySuggestions;

// ===== RECIPE COLLECTIONS =====
function createCollection() {
    const name = prompt('Navn på samling (f.eks. "Søndagsmiddager", "Kjappe retter"):');
    if (!name) return;
    
    const collections = JSON.parse(localStorage.getItem('kokebok_collections') || '{}');
    collections[name] = [];
    localStorage.setItem('kokebok_collections', JSON.stringify(collections));
    
    showToast(`Samling "${name}" opprettet!`, 'success');
}

function addToCollection(recipeId) {
    const collections = JSON.parse(localStorage.getItem('kokebok_collections') || '{}');
    const collectionNames = Object.keys(collections);
    
    if (collectionNames.length === 0) {
        showToast('Du har ingen samlinger. Opprett en først!', 'warning');
        createCollection();
        return;
    }
    
    const html = `
        <p>Velg samling:</p>
        <div class="collections-list">
            ${collectionNames.map(name => `
                <button class="collection-btn" data-collection="${escapeHtml(name)}">
                    📁 ${escapeHtml(name)} (${collections[name].length})
                </button>
            `).join('')}
        </div>
    `;
    
    showModal('📁 Legg til i samling', html, []);
    
    setTimeout(() => {
        document.querySelectorAll('.collection-btn').forEach(btn => {
            btn.onclick = () => {
                const collName = btn.dataset.collection;
                if (!collections[collName].includes(recipeId)) {
                    collections[collName].push(recipeId);
                    localStorage.setItem('kokebok_collections', JSON.stringify(collections));
                    showToast(`Lagt til i "${collName}"!`, 'success');
                } else {
                    showToast('Oppskriften er allerede i samlingen', 'info');
                }
                closeModal();
            };
        });
    }, 100);
}
window.createCollection = createCollection;
window.addToCollection = addToCollection;

// ===== COOKING HISTORY =====
function logCookingSession(recipeId) {
    const history = JSON.parse(localStorage.getItem('kokebok_cooking_history') || '[]');
    history.unshift({
        recipeId,
        date: new Date().toISOString()
    });
    // Keep last 50 entries
    localStorage.setItem('kokebok_cooking_history', JSON.stringify(history.slice(0, 50)));
}

function showCookingHistory() {
    const history = JSON.parse(localStorage.getItem('kokebok_cooking_history') || '[]');
    
    if (history.length === 0) {
        showModal('📖 Kokehistorikk', '<p>Du har ikke laget noe ennå! Start kokemodus for å registrere.</p>', []);
        return;
    }
    
    const html = `
        <div class="cooking-history-list">
            ${history.slice(0, 20).map(entry => {
                const recipe = state.recipes.find(r => r.id === entry.recipeId);
                if (!recipe) return '';
                const date = new Date(entry.date);
                return `
                    <div class="history-item">
                        <span class="history-date">${date.toLocaleDateString('no-NO')}</span>
                        <span class="history-recipe">${escapeHtml(recipe.name)}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    showModal('📖 Kokehistorikk', html, []);
}
window.showCookingHistory = showCookingHistory;

// Initialize new features
setupKeyboardShortcuts();
setupVoiceControl();

// Add to window for onclick handlers
window.getRandomRecipe = getRandomRecipe;
window.rateRecipe = rateRecipe;
window.startCookingMode = startCookingMode;
window.openNutritionEstimator = openNutritionEstimator;
window.closeNutritionEstimator = closeNutritionEstimator;
window.addCookingTip = addCookingTip;
window.printRecipe = printRecipe;
window.duplicateRecipe = duplicateRecipe;
window.showSeasonalTips = showSeasonalTips;
window.exportRecipeAsJson = exportRecipeAsJson;
window.estimateCost = estimateCost;
window.shareToSocial = shareToSocial;
window.showAchievements = showAchievements;
window.checkAchievements = checkAchievements;
window.closeRecipePicker = closeRecipePicker;
