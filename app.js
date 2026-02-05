// ==========================================
// FAMILIENS KOKEBOK APP v3.6.1
// Firebase-basert med Google Auth
// Digitaliser gamle kokebøker og oppskrifter
// 100% privat - ingen AI lærer av dine oppskrifter
// ==========================================

const APP_VERSION = '3.6.1';

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
    savedExternalRecipes: [],
    // Portion scaling state
    portionScale: 1
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

// Get category name from ID
function getCategoryName(categoryId) {
    if (!categoryId) return 'Ukategorisert';
    const category = state.categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
}

// Get category icon from ID
function getCategoryIcon(categoryId) {
    if (!categoryId) return '📝';
    const category = state.categories.find(c => c.id === categoryId);
    return category?.icon || '📝';
}

// Helper to get ingredients as string (handles both array and string format)
function getIngredientsAsString(ingredients) {
    if (!ingredients) return '';
    if (Array.isArray(ingredients)) {
        return ingredients.join('\n');
    }
    if (typeof ingredients === 'object') {
        return Object.values(ingredients).join('\n');
    }
    return String(ingredients);
}

// Helper to get shopping item name as string
function getItemName(item) {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item.name) return String(item.name);
    return String(item);
}

// View a recipe by ID - used by modals and quick actions
function viewRecipe(recipeId) {
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) {
        showToast('Oppskrift ikke funnet', 'error');
        return;
    }
    state.currentRecipe = recipe;
    state.portionScale = 1; // Reset portion scale when viewing new recipe
    closeGenericModal();
    navigateTo('recipeView');
}
window.viewRecipe = viewRecipe;

// Close any open modal
function closeGenericModal() {
    const modal = $('modalContainer');
    if (modal) {
        modal.classList.add('hidden');
    }
}
window.closeGenericModal = closeGenericModal;

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
    
    // Sjekk om vi er i en iframe eller har restriksjoner (iOS Safari)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    try {
        // For iOS Safari, bruk SESSION for bedre kompatibilitet
        if (isIOS || isSafari) {
            await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
            console.log('📱 iOS/Safari modus - bruker SESSION persistence');
        } else {
            await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        }
    } catch (e) {
        console.warn('Kunne ikke sette persistence:', e);
    }
    
    // Sjekk redirect resultat først (viktig for iOS/Safari)
    try {
        const result = await auth.getRedirectResult();
        if (result && result.user) {
            console.log('✓ Bruker hentet fra redirect');
            state.user = result.user;
            // Lagre at vi nettopp logget inn
            sessionStorage.setItem('kokebok_just_logged_in', 'true');
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
        
        // For iOS - prøv popup først, fall tilbake til redirect
        if (isIOS || isSafari) {
            try {
                // Prøv popup først på iOS
                const result = await auth.signInWithPopup(provider);
                if (result.user) {
                    console.log('✓ Popup login vellykket');
                    sessionStorage.setItem('kokebok_just_logged_in', 'true');
                }
            } catch (popupError) {
                console.log('Popup feilet, prøver redirect...', popupError.code);
                // Fall tilbake til redirect
                try {
                    await auth.signInWithRedirect(provider);
                } catch (redirectError) {
                    console.error('Redirect login feilet:', redirectError);
                    showToast('Innlogging feilet. Prøv igjen.', 'error');
                    resetLoginButton(btn);
                }
            }
        } else {
            // Standard redirect for andre enheter
            try {
                await auth.signInWithRedirect(provider);
            } catch (error) {
                console.error('Login error:', error);
                showToast('Innlogging feilet. Prøv igjen.', 'error');
                resetLoginButton(btn);
            }
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
        restoreMenuSectionStates();
        
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

// Toggle collapsible menu sections
function toggleMenuSection(sectionId) {
    const section = document.querySelector(`.menu-section[data-section="${sectionId}"]`);
    if (section) {
        section.classList.toggle('collapsed');
        // Save state to localStorage
        const collapsedSections = JSON.parse(localStorage.getItem('kokebok_collapsed_sections') || '[]');
        if (section.classList.contains('collapsed')) {
            if (!collapsedSections.includes(sectionId)) {
                collapsedSections.push(sectionId);
            }
        } else {
            const idx = collapsedSections.indexOf(sectionId);
            if (idx > -1) collapsedSections.splice(idx, 1);
        }
        localStorage.setItem('kokebok_collapsed_sections', JSON.stringify(collapsedSections));
    }
}
window.toggleMenuSection = toggleMenuSection;

// Restore collapsed menu sections state
function restoreMenuSectionStates() {
    const collapsedSections = JSON.parse(localStorage.getItem('kokebok_collapsed_sections') || '[]');
    collapsedSections.forEach(sectionId => {
        const section = document.querySelector(`.menu-section[data-section="${sectionId}"]`);
        if (section) section.classList.add('collapsed');
    });
}

// ===== Dashboard =====
function renderDashboard() {
    updateStats();
    renderCategories();
    renderRecentRecipes();
    renderBooksPreview();
    updateWelcomeMessage();
    renderRecipeOfTheDay();
    renderDailyChallenge();
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
    
    // Parse original servings for scaling
    const originalServings = parseServings(recipe.servings);
    const currentScale = state.portionScale || 1;
    
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
    if (recipe.servings) {
        const scaledServings = originalServings ? Math.round(originalServings * currentScale) : recipe.servings;
        details.push(`<div class="detail-item">👥 ${typeof scaledServings === 'number' ? scaledServings + ' porsjoner' : escapeHtml(recipe.servings)}</div>`);
    }
    if (recipe.prepTime) details.push(`<div class="detail-item">⏱️ ${escapeHtml(recipe.prepTime)}</div>`);
    if (category) details.push(`<div class="detail-item">${category.icon} ${category.name}</div>`);
    if (book) details.push(`<div class="detail-item">📚 ${escapeHtml(book.name)}</div>`);
    
    // Scale ingredients
    const scaledIngredients = scaleIngredients(recipe.ingredients, currentScale);
    
    container.innerHTML = `
        <div class="recipe-header">
            <h1>${escapeHtml(recipe.name)}</h1>
            ${recipe.source ? `<p class="recipe-source">Fra: ${escapeHtml(recipe.source)}</p>` : ''}
        </div>
        
        ${imagesHtml}
        
        ${details.length > 0 ? `<div class="recipe-details">${details.join('')}</div>` : ''}
        
        ${recipe.ingredients ? `
            <div class="recipe-section">
                <div class="section-header-with-controls">
                    <h3>🥄 Ingredienser</h3>
                    <div class="portion-scaler">
                        <button class="scale-btn" onclick="adjustPortions(-0.5)" ${currentScale <= 0.5 ? 'disabled' : ''}>−</button>
                        <span class="scale-display">
                            <span class="scale-value">${currentScale === 1 ? 'Original' : (currentScale * 100) + '%'}</span>
                            ${originalServings ? `<span class="scale-portions">(${Math.round(originalServings * currentScale)} pers)</span>` : ''}
                        </span>
                        <button class="scale-btn" onclick="adjustPortions(0.5)">+</button>
                    </div>
                </div>
                <div class="quick-scale-buttons">
                    <button class="quick-scale ${currentScale === 0.5 ? 'active' : ''}" onclick="setPortionScale(0.5)">½×</button>
                    <button class="quick-scale ${currentScale === 1 ? 'active' : ''}" onclick="setPortionScale(1)">1×</button>
                    <button class="quick-scale ${currentScale === 1.5 ? 'active' : ''}" onclick="setPortionScale(1.5)">1½×</button>
                    <button class="quick-scale ${currentScale === 2 ? 'active' : ''}" onclick="setPortionScale(2)">2×</button>
                    <button class="quick-scale ${currentScale === 3 ? 'active' : ''}" onclick="setPortionScale(3)">3×</button>
                </div>
                <pre class="scaled-ingredients">${escapeHtml(scaledIngredients)}</pre>
                <button class="btn btn-secondary btn-small" onclick="addScaledToShoppingList()">
                    🛒 Legg til i handleliste
                </button>
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

// ===== PORTION SCALING FUNCTIONS =====
function parseServings(servingsStr) {
    if (!servingsStr) return null;
    const match = String(servingsStr).match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
}

function scaleIngredients(ingredients, scale) {
    if (!ingredients || scale === 1) return ingredients;
    
    const ingredientStr = getIngredientsAsString(ingredients);
    const lines = ingredientStr.split('\n');
    
    return lines.map(line => {
        // Match numbers (including decimals and fractions) at the start of lines or after spaces
        return line.replace(/(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)\s*(dl|l|ml|g|kg|ss|ts|stk|kopp|gram|kilo|liter|desiliter|spiseskje|teskje)?/gi, 
            (match, num, unit) => {
                let value = parseNumber(num);
                if (isNaN(value)) return match;
                
                let scaled = value * scale;
                
                // Format nicely
                if (scaled === Math.floor(scaled)) {
                    scaled = scaled.toString();
                } else if (scaled * 2 === Math.floor(scaled * 2)) {
                    // Check for common fractions
                    const whole = Math.floor(scaled);
                    const frac = scaled - whole;
                    if (frac === 0.5) scaled = whole > 0 ? `${whole}½` : '½';
                    else scaled = scaled.toFixed(1).replace('.', ',');
                } else {
                    scaled = scaled.toFixed(1).replace('.', ',');
                }
                
                return unit ? `${scaled} ${unit}` : scaled;
            }
        );
    }).join('\n');
}

function parseNumber(str) {
    if (!str) return NaN;
    str = String(str).trim();
    
    // Handle fractions like "1/2" or "1 / 2"
    if (str.includes('/')) {
        const parts = str.split('/').map(p => parseFloat(p.trim().replace(',', '.')));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return parts[0] / parts[1];
        }
    }
    
    // Handle decimal with comma
    return parseFloat(str.replace(',', '.'));
}

function adjustPortions(delta) {
    state.portionScale = Math.max(0.5, (state.portionScale || 1) + delta);
    renderRecipeView();
    
    // Track achievement
    const earned = JSON.parse(localStorage.getItem('kokebok_achievements') || '[]');
    if (!earned.includes('portionScaler')) {
        unlockAchievement('portionScaler');
    }
}
window.adjustPortions = adjustPortions;

function setPortionScale(scale) {
    state.portionScale = scale;
    renderRecipeView();
    
    // Track achievement
    const earned = JSON.parse(localStorage.getItem('kokebok_achievements') || '[]');
    if (!earned.includes('portionScaler')) {
        unlockAchievement('portionScaler');
    }
}
window.setPortionScale = setPortionScale;

function addScaledToShoppingList() {
    if (!state.currentRecipe || !state.currentRecipe.ingredients) return;
    
    const scale = state.portionScale || 1;
    const scaledIngredients = scaleIngredients(state.currentRecipe.ingredients, scale);
    const lines = scaledIngredients.split('\n').filter(l => l.trim());
    
    let added = 0;
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !state.shoppingList.some(item => getItemName(item).toLowerCase() === trimmed.toLowerCase())) {
            state.shoppingList.push({ name: trimmed, checked: false, addedAt: new Date() });
            added++;
        }
    }
    
    if (added > 0) {
        saveShoppingList();
        showToast(`${added} ingrediens${added > 1 ? 'er' : ''} lagt til i handlelisten!`, 'success');
    } else {
        showToast('Alle ingredienser er allerede i listen', 'info');
    }
}
window.addScaledToShoppingList = addScaledToShoppingList;

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
            <button class="book-action-btn" id="addExistingRecipeBtn">
                <span>📝</span> Legg til eksisterende
            </button>
            <button class="book-action-btn" id="addRecipeToBookBtn">
                <span>➕</span> Ny oppskrift
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
    
    // Add existing recipe button
    on($('addExistingRecipeBtn'), 'click', () => {
        openAddRecipesToBook(book.id);
    });
    
    // Add new recipe button
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

// ===== GENERIC MODAL FUNCTION =====
function showModal(title, content, buttons = []) {
    // Remove existing modal
    const existing = document.querySelector('.generic-modal-overlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'generic-modal-overlay';
    
    let buttonsHtml = '';
    if (buttons.length > 0) {
        buttonsHtml = `<div class="modal-buttons">
            ${buttons.map(btn => `<button class="btn ${btn.class || 'btn-primary'}" onclick="${btn.onclick}">${btn.text}</button>`).join('')}
        </div>`;
    } else {
        buttonsHtml = `<div class="modal-buttons">
            <button class="btn btn-primary" onclick="closeGenericModal()">Lukk</button>
        </div>`;
    }
    
    overlay.innerHTML = `
        <div class="generic-modal">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="close-btn" onclick="closeGenericModal()">×</button>
            </div>
            <div class="modal-content">
                ${content}
            </div>
            ${buttonsHtml}
        </div>
    `;
    
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeGenericModal();
    });
    
    // Animate in
    requestAnimationFrame(() => overlay.classList.add('active'));
}

function closeGenericModal() {
    const overlay = document.querySelector('.generic-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
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
    const ingredients = getIngredientsAsString(recipe.ingredients).toLowerCase();
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
    
    const ingredients = getIngredientsAsString(state.currentRecipe.ingredients).toLowerCase();
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

// ===== ACHIEVEMENTS SYSTEM - EXPANDED =====
const achievements = {
    // Oppskrift-milestones
    firstRecipe: { name: 'Første oppskrift', icon: '🎉', desc: 'La til din første oppskrift', xp: 10 },
    fiveRecipes: { name: 'Matentusiast', icon: '👨‍🍳', desc: '5 oppskrifter i samlingen', xp: 25 },
    tenRecipes: { name: 'Kokebok-mester', icon: '📚', desc: '10 oppskrifter i samlingen', xp: 50 },
    twentyFiveRecipes: { name: 'Oppskrift-samler', icon: '📖', desc: '25 oppskrifter i samlingen', xp: 100 },
    fiftyRecipes: { name: 'Kokebokforfatter', icon: '✍️', desc: '50 oppskrifter - imponerende!', xp: 200 },
    hundredRecipes: { name: 'Mesterkok', icon: '👑', desc: '100 oppskrifter - du er legendarisk!', xp: 500 },
    
    // Kategorier
    firstBook: { name: 'Bokskaper', icon: '📕', desc: 'Opprettet din første kokebok', xp: 15 },
    fiveBooks: { name: 'Biblioteksjef', icon: '📚', desc: '5 kokebøker - godt organisert!', xp: 40 },
    allCategories: { name: 'Allsidig kokk', icon: '🌈', desc: 'Oppskrifter i alle kategorier', xp: 75 },
    
    // Planlegging & handleliste
    mealPlanner: { name: 'Planlegger', icon: '📅', desc: 'Planla en hel uke', xp: 30 },
    shoppingPro: { name: 'Handleproff', icon: '🛒', desc: 'Brukte handlelisten', xp: 10 },
    smartShopper: { name: 'Smart handler', icon: '🧠', desc: 'Brukte smart handleliste', xp: 20 },
    bulkShopper: { name: 'Storhandler', icon: '🛍️', desc: '20+ varer på handlelisten', xp: 25 },
    
    // Matlaging & koking
    firstCook: { name: 'Første rett', icon: '🍳', desc: 'Lagde første oppskrift', xp: 15 },
    tenCooks: { name: 'Kjøkkensjef', icon: '👩‍🍳', desc: 'Lagde 10 oppskrifter', xp: 50 },
    fiftyCooks: { name: 'Profesjonell kokk', icon: '🏆', desc: 'Lagde 50 oppskrifter', xp: 150 },
    
    // Spesielle kategorier
    dessertMaster: { name: 'Dessertkonge', icon: '🍰', desc: '10 desserter i samlingen', xp: 40 },
    breakfastHero: { name: 'Frokost-helt', icon: '🥐', desc: '10 frokost-oppskrifter', xp: 40 },
    dinnerChamp: { name: 'Middagsmester', icon: '🍖', desc: '15 middags-oppskrifter', xp: 50 },
    vegetarianPro: { name: 'Grønn gourmet', icon: '🥗', desc: '10 vegetariske oppskrifter', xp: 45 },
    
    // Sosiale & deling
    firstShare: { name: 'Deleglede', icon: '📤', desc: 'Delte første oppskrift', xp: 15 },
    firstImport: { name: 'Importør', icon: '📥', desc: 'Importerte en oppskrift', xp: 10 },
    urlImporter: { name: 'Nettfinner', icon: '🌐', desc: 'Importerte fra URL', xp: 20 },
    
    // Daglig bruk
    dailyUser: { name: 'Daglig bruker', icon: '📆', desc: 'Brukte appen 7 dager på rad', xp: 35 },
    weeklyStreak: { name: 'Ukes-streak', icon: '🔥', desc: '2 uker daglig bruk', xp: 75 },
    monthlyStreak: { name: 'Måneds-streak', icon: '⚡', desc: '30 dager daglig bruk', xp: 200 },
    
    // Premium-funksjoner
    nutritionTracker: { name: 'Næringsfokusert', icon: '🥬', desc: 'Brukte næringsberegner', xp: 15 },
    costCalculator: { name: 'Budsjettmester', icon: '💰', desc: 'Brukte kostnadsberegner', xp: 15 },
    mealPrepPro: { name: 'Meal prep-proff', icon: '📦', desc: 'Laget en meal prep-plan', xp: 25 },
    portionScaler: { name: 'Porsjonsmester', icon: '⚖️', desc: 'Skalerte en oppskrift', xp: 15 },
    
    // Søk & oppdagelse
    explorerBronze: { name: 'Utforsker', icon: '🔍', desc: 'Søkte 10 ganger', xp: 15 },
    explorerSilver: { name: 'Oppdager', icon: '🗺️', desc: 'Søkte 50 ganger', xp: 40 },
    explorerGold: { name: 'Kartlegger', icon: '🧭', desc: 'Søkte 100 ganger', xp: 100 },
    
    // Spesielle prestasjoner
    nightOwl: { name: 'Nattugle', icon: '🦉', desc: 'Brukte appen etter midnatt', xp: 10 },
    earlyBird: { name: 'Morgenfugl', icon: '🐦', desc: 'Brukte appen før kl. 06', xp: 10 },
    weekendChef: { name: 'Helgekokk', icon: '🎊', desc: 'Lagde mat i helgen', xp: 15 },
    
    // Level-baserte
    levelFive: { name: 'Nivå 5', icon: '⭐', desc: 'Nådde nivå 5', xp: 0 },
    levelTen: { name: 'Nivå 10', icon: '🌟', desc: 'Nådde nivå 10 - erfaren!', xp: 0 },
    levelTwentyFive: { name: 'Nivå 25', icon: '💫', desc: 'Nådde nivå 25 - ekspert!', xp: 0 },
    levelFifty: { name: 'Nivå 50', icon: '👑', desc: 'Nådde nivå 50 - legende!', xp: 0 }
};

// XP og level-system
function getPlayerLevel() {
    const xp = parseInt(localStorage.getItem('kokebok_xp') || '0');
    // Level formula: level = floor(sqrt(xp / 10))
    const level = Math.floor(Math.sqrt(xp / 10));
    const currentLevelXP = level * level * 10;
    const nextLevelXP = (level + 1) * (level + 1) * 10;
    const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    
    return { level, xp, currentLevelXP, nextLevelXP, progress };
}

function addXP(amount, reason = '') {
    const currentXP = parseInt(localStorage.getItem('kokebok_xp') || '0');
    const oldLevel = getPlayerLevel().level;
    
    const newXP = currentXP + amount;
    localStorage.setItem('kokebok_xp', newXP.toString());
    
    const newLevel = getPlayerLevel().level;
    
    // Show XP gain notification
    if (amount > 0) {
        showXPGain(amount, reason);
    }
    
    // Check for level up
    if (newLevel > oldLevel) {
        showLevelUp(newLevel);
        checkLevelAchievements(newLevel);
    }
}

function showXPGain(amount, reason) {
    const popup = document.createElement('div');
    popup.className = 'xp-popup';
    popup.innerHTML = `+${amount} XP ${reason ? `(${reason})` : ''}`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 2000);
}

function showLevelUp(level) {
    const popup = document.createElement('div');
    popup.className = 'level-up-popup';
    popup.innerHTML = `
        <div class="level-up-icon">🎉</div>
        <div class="level-up-text">
            <strong>NIVÅ OPP!</strong>
            <span>Du er nå nivå ${level}</span>
        </div>
    `;
    document.body.appendChild(popup);
    triggerConfetti();
    setTimeout(() => popup.remove(), 4000);
}

function checkLevelAchievements(level) {
    const earned = JSON.parse(localStorage.getItem('kokebok_achievements') || '[]');
    if (level >= 5 && !earned.includes('levelFive')) unlockAchievement('levelFive');
    if (level >= 10 && !earned.includes('levelTen')) unlockAchievement('levelTen');
    if (level >= 25 && !earned.includes('levelTwentyFive')) unlockAchievement('levelTwentyFive');
    if (level >= 50 && !earned.includes('levelFifty')) unlockAchievement('levelFifty');
}

function updateDailyStreak() {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('kokebok_last_visit');
    const streak = parseInt(localStorage.getItem('kokebok_streak') || '0');
    
    if (lastVisit !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastVisit === yesterday.toDateString()) {
            // Fortsetter streak
            const newStreak = streak + 1;
            localStorage.setItem('kokebok_streak', newStreak.toString());
            
            // Sjekk streak-achievements
            const earned = JSON.parse(localStorage.getItem('kokebok_achievements') || '[]');
            if (newStreak >= 7 && !earned.includes('dailyUser')) unlockAchievement('dailyUser');
            if (newStreak >= 14 && !earned.includes('weeklyStreak')) unlockAchievement('weeklyStreak');
            if (newStreak >= 30 && !earned.includes('monthlyStreak')) unlockAchievement('monthlyStreak');
            
            // Gi bonus XP for streak
            if (newStreak > 1) {
                addXP(Math.min(newStreak, 10), `${newStreak}-dagers streak`);
            }
        } else if (lastVisit) {
            // Streak brutt
            localStorage.setItem('kokebok_streak', '1');
        } else {
            // Første besøk
            localStorage.setItem('kokebok_streak', '1');
        }
        
        localStorage.setItem('kokebok_last_visit', today);
    }
    
    // Sjekk time-baserte achievements
    const hour = new Date().getHours();
    const earned = JSON.parse(localStorage.getItem('kokebok_achievements') || '[]');
    if (hour >= 0 && hour < 5 && !earned.includes('nightOwl')) unlockAchievement('nightOwl');
    if (hour >= 5 && hour < 7 && !earned.includes('earlyBird')) unlockAchievement('earlyBird');
    
    const day = new Date().getDay();
    if ((day === 0 || day === 6) && !earned.includes('weekendChef')) {
        // Vil sjekkes når de lager mat i helgen
    }
}

function checkAchievements() {
    const earned = JSON.parse(localStorage.getItem('kokebok_achievements') || '[]');
    
    // Oppskrift-milestones
    if (state.recipes.length >= 1 && !earned.includes('firstRecipe')) unlockAchievement('firstRecipe');
    if (state.recipes.length >= 5 && !earned.includes('fiveRecipes')) unlockAchievement('fiveRecipes');
    if (state.recipes.length >= 10 && !earned.includes('tenRecipes')) unlockAchievement('tenRecipes');
    if (state.recipes.length >= 25 && !earned.includes('twentyFiveRecipes')) unlockAchievement('twentyFiveRecipes');
    if (state.recipes.length >= 50 && !earned.includes('fiftyRecipes')) unlockAchievement('fiftyRecipes');
    if (state.recipes.length >= 100 && !earned.includes('hundredRecipes')) unlockAchievement('hundredRecipes');
    
    // Bok-achievements
    if (state.books.length >= 1 && !earned.includes('firstBook')) unlockAchievement('firstBook');
    if (state.books.length >= 5 && !earned.includes('fiveBooks')) unlockAchievement('fiveBooks');
    
    // Kategori-sjekk
    const usedCategories = new Set(state.recipes.map(r => r.category).filter(c => c));
    if (usedCategories.size >= state.categories.length && !earned.includes('allCategories')) {
        unlockAchievement('allCategories');
    }
    
    // Handleliste
    if (state.shoppingList.length >= 20 && !earned.includes('bulkShopper')) {
        unlockAchievement('bulkShopper');
    }
    
    // Kategori-spesifikke (sjekk tags eller kategorinavn)
    const desserts = state.recipes.filter(r => 
        r.category === 'dessert' || 
        (r.tags && r.tags.some(t => /dessert|kake|is|søtt/i.test(t)))
    );
    if (desserts.length >= 10 && !earned.includes('dessertMaster')) unlockAchievement('dessertMaster');
    
    const breakfasts = state.recipes.filter(r => 
        r.category === 'frokost' || 
        (r.tags && r.tags.some(t => /frokost|morgen/i.test(t)))
    );
    if (breakfasts.length >= 10 && !earned.includes('breakfastHero')) unlockAchievement('breakfastHero');
    
    const dinners = state.recipes.filter(r => 
        r.category === 'middag' || 
        (r.tags && r.tags.some(t => /middag|hovedrett/i.test(t)))
    );
    if (dinners.length >= 15 && !earned.includes('dinnerChamp')) unlockAchievement('dinnerChamp');
    
    const vegetarian = state.recipes.filter(r => 
        r.tags && r.tags.some(t => /vegetar|vegan|grønn/i.test(t))
    );
    if (vegetarian.length >= 10 && !earned.includes('vegetarianPro')) unlockAchievement('vegetarianPro');
    
    // Oppdater daily streak
    updateDailyStreak();
}

function unlockAchievement(id) {
    const achievement = achievements[id];
    if (!achievement) return;
    
    const earned = JSON.parse(localStorage.getItem('kokebok_achievements') || '[]');
    if (earned.includes(id)) return; // Already earned
    
    earned.push(id);
    localStorage.setItem('kokebok_achievements', JSON.stringify(earned));
    
    // Add XP for achievement
    if (achievement.xp > 0) {
        addXP(achievement.xp, achievement.name);
    }
    
    // Show achievement popup
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-text">
            <strong>🏆 Prestasjon låst opp!</strong>
            <span>${achievement.name}</span>
            ${achievement.xp > 0 ? `<span class="achievement-xp">+${achievement.xp} XP</span>` : ''}
        </div>
    `;
    document.body.appendChild(popup);
    
    triggerConfetti();
    
    setTimeout(() => popup.remove(), 4000);
}

function showAchievements() {
    const earned = JSON.parse(localStorage.getItem('kokebok_achievements') || '[]');
    const playerInfo = getPlayerLevel();
    
    // Kategoriser achievements
    const categories = {
        'Oppskrifter': ['firstRecipe', 'fiveRecipes', 'tenRecipes', 'twentyFiveRecipes', 'fiftyRecipes', 'hundredRecipes'],
        'Kategorier': ['firstBook', 'fiveBooks', 'allCategories'],
        'Matlaging': ['firstCook', 'tenCooks', 'fiftyCooks', 'dessertMaster', 'breakfastHero', 'dinnerChamp', 'vegetarianPro'],
        'Planlegging': ['mealPlanner', 'shoppingPro', 'smartShopper', 'bulkShopper'],
        'Funksjoner': ['nutritionTracker', 'costCalculator', 'mealPrepPro', 'portionScaler', 'firstShare', 'firstImport', 'urlImporter'],
        'Utforsking': ['explorerBronze', 'explorerSilver', 'explorerGold'],
        'Streaks': ['dailyUser', 'weeklyStreak', 'monthlyStreak', 'nightOwl', 'earlyBird', 'weekendChef'],
        'Nivåer': ['levelFive', 'levelTen', 'levelTwentyFive', 'levelFifty']
    };
    
    const streak = parseInt(localStorage.getItem('kokebok_streak') || '0');
    const totalXP = Object.entries(achievements)
        .filter(([id]) => earned.includes(id))
        .reduce((sum, [_, ach]) => sum + (ach.xp || 0), 0);
    
    let html = `
        <div class="achievements-header">
            <div class="player-level-card">
                <div class="level-badge">
                    <span class="level-number">${playerInfo.level}</span>
                    <span class="level-label">NIVÅ</span>
                </div>
                <div class="level-details">
                    <div class="xp-bar">
                        <div class="xp-fill" style="width: ${playerInfo.progress}%"></div>
                    </div>
                    <span class="xp-text">${playerInfo.xp} / ${playerInfo.nextLevelXP} XP</span>
                </div>
            </div>
            <div class="achievement-stats-row">
                <div class="ach-stat">
                    <span class="ach-stat-value">${earned.length}</span>
                    <span class="ach-stat-label">Opplåst</span>
                </div>
                <div class="ach-stat">
                    <span class="ach-stat-value">${Object.keys(achievements).length}</span>
                    <span class="ach-stat-label">Totalt</span>
                </div>
                <div class="ach-stat">
                    <span class="ach-stat-value">🔥 ${streak}</span>
                    <span class="ach-stat-label">Streak</span>
                </div>
            </div>
        </div>
    `;
    
    for (const [catName, achIds] of Object.entries(categories)) {
        const catAchievements = achIds.map(id => ({ id, ...achievements[id] })).filter(a => a.name);
        const unlockedInCat = catAchievements.filter(a => earned.includes(a.id)).length;
        
        html += `
            <div class="achievement-category">
                <h4 class="ach-cat-header">
                    ${catName}
                    <span class="ach-cat-progress">${unlockedInCat}/${catAchievements.length}</span>
                </h4>
                <div class="achievements-grid">
                    ${catAchievements.map(ach => {
                        const unlocked = earned.includes(ach.id);
                        return `
                            <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
                                <span class="achievement-icon">${unlocked ? ach.icon : '🔒'}</span>
                                <span class="achievement-name">${ach.name}</span>
                                <span class="achievement-desc">${ach.desc}</span>
                                ${ach.xp > 0 ? `<span class="achievement-xp-badge">${ach.xp} XP</span>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    showModal('🏆 Prestasjoner & Nivå', html, []);
}

// ===== RECIPE OF THE DAY - ENHANCED =====
function getRecipeOfTheDay() {
    if (state.recipes.length === 0) return null;
    
    // Use date as seed for consistent daily recipe
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = seed % state.recipes.length;
    
    return state.recipes[index];
}

function renderRecipeOfTheDay() {
    const container = $('recipeOfTheDay');
    const recipe = getRecipeOfTheDay();
    
    if (!container || !recipe) {
        if (container) container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    // Update name
    const nameEl = $('rotdName');
    if (nameEl) nameEl.textContent = recipe.name;
    
    // Update category
    const catEl = $('rotdCategory');
    if (catEl) {
        const category = state.categories.find(c => c.id === recipe.category);
        catEl.textContent = category ? `${category.icon} ${category.name}` : '';
    }
    
    // Update image
    const imgEl = $('rotdImage');
    if (imgEl) {
        if (recipe.images && recipe.images.length > 0) {
            imgEl.innerHTML = `<img src="${recipe.images[0]}" alt="${recipe.name}">`;
        } else {
            const category = state.categories.find(c => c.id === recipe.category);
            imgEl.innerHTML = category?.icon || '🍽️';
        }
    }
    
    // Update cooking streak
    const streakEl = $('rotdStreakBadge');
    if (streakEl) {
        const cookingStreak = parseInt(localStorage.getItem('kokebok_cooking_streak') || '0');
        streakEl.textContent = `🔥 ${cookingStreak}`;
        streakEl.title = `${cookingStreak} dagers cooking streak!`;
    }
    
    // View button
    const viewBtn = $('viewRotdBtn');
    if (viewBtn) {
        viewBtn.onclick = () => viewRecipe(recipe.id);
    }
}

function markAsMadeToday() {
    const recipe = getRecipeOfTheDay();
    if (!recipe) return;
    
    const today = new Date().toDateString();
    const lastCook = localStorage.getItem('kokebok_last_cook_date');
    
    // Update cooking streak
    if (lastCook !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        let streak = parseInt(localStorage.getItem('kokebok_cooking_streak') || '0');
        
        if (lastCook === yesterday.toDateString()) {
            streak++;
        } else if (lastCook !== today) {
            streak = 1;
        }
        
        localStorage.setItem('kokebok_cooking_streak', streak.toString());
        localStorage.setItem('kokebok_last_cook_date', today);
        
        // Track cooked recipes count
        const cookedCount = parseInt(localStorage.getItem('kokebok_total_cooked') || '0') + 1;
        localStorage.setItem('kokebok_total_cooked', cookedCount.toString());
        
        // Award XP
        addXP(15, 'Laget dagens oppskrift');
        
        // Check cooking achievements
        const earned = JSON.parse(localStorage.getItem('kokebok_achievements') || '[]');
        if (cookedCount >= 1 && !earned.includes('firstCook')) unlockAchievement('firstCook');
        if (cookedCount >= 10 && !earned.includes('tenCooks')) unlockAchievement('tenCooks');
        if (cookedCount >= 50 && !earned.includes('fiftyCooks')) unlockAchievement('fiftyCooks');
        
        // Weekend chef
        const day = new Date().getDay();
        if ((day === 0 || day === 6) && !earned.includes('weekendChef')) {
            unlockAchievement('weekendChef');
        }
        
        showToast(`🎉 Laget "${recipe.name}"! ${streak > 1 ? `${streak} dagers streak!` : ''}`, 'success');
        triggerConfetti();
        
        // Update UI
        renderRecipeOfTheDay();
    } else {
        showToast('Du har allerede markert dagens oppskrift som laget!', 'info');
    }
}
window.markAsMadeToday = markAsMadeToday;

// ===== DAILY CHALLENGES =====
const dailyChallenges = [
    { id: 'search', text: 'Søk etter 3 nye oppskrifter', xp: 25, check: () => parseInt(sessionStorage.getItem('searches_today') || '0') >= 3 },
    { id: 'plan', text: 'Planlegg minst 2 måltider denne uken', xp: 30, check: () => Object.keys(state.mealPlan).length >= 2 },
    { id: 'shop', text: 'Legg til 5 ingredienser i handlelisten', xp: 20, check: () => state.shoppingList.length >= 5 },
    { id: 'add', text: 'Legg til en ny oppskrift', xp: 35, check: () => {
        const addedToday = localStorage.getItem('kokebok_added_recipe_today');
        return addedToday === new Date().toDateString();
    }},
    { id: 'favorite', text: 'Marker en oppskrift som favoritt', xp: 15, check: () => state.favorites.length > 0 },
    { id: 'random', text: 'Prøv en tilfeldig oppskrift', xp: 20, check: () => sessionStorage.getItem('tried_random') === 'true' },
    { id: 'measure', text: 'Bruk mål- og vektkalkulatoren', xp: 15, check: () => sessionStorage.getItem('used_calculator') === 'true' },
    { id: 'cook', text: 'Marker dagens oppskrift som laget', xp: 25, check: () => localStorage.getItem('kokebok_last_cook_date') === new Date().toDateString() }
];

function getDailyChallenge() {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = seed % dailyChallenges.length;
    return dailyChallenges[index];
}

function renderDailyChallenge() {
    const container = $('dailyChallengeCard');
    if (!container) return;
    
    const challenge = getDailyChallenge();
    const completedToday = localStorage.getItem('kokebok_challenge_completed') === new Date().toDateString();
    
    container.style.display = 'block';
    
    const textEl = $('challengeText');
    if (textEl) textEl.textContent = challenge.text;
    
    const btn = $('completeChallengeBtn');
    if (btn) {
        if (completedToday) {
            btn.textContent = '✅ Fullført!';
            btn.disabled = true;
            btn.classList.add('completed');
        } else {
            btn.textContent = 'Fullfør utfordring';
            btn.disabled = false;
            btn.classList.remove('completed');
        }
    }
    
    // Update reward display
    const rewardEl = container.querySelector('.reward-xp');
    if (rewardEl) rewardEl.textContent = `+${challenge.xp} XP`;
}

function completeChallenge() {
    const challenge = getDailyChallenge();
    const today = new Date().toDateString();
    
    if (localStorage.getItem('kokebok_challenge_completed') === today) {
        showToast('Du har allerede fullført dagens utfordring!', 'info');
        return;
    }
    
    if (challenge.check()) {
        localStorage.setItem('kokebok_challenge_completed', today);
        addXP(challenge.xp, 'Daglig utfordring');
        showToast(`🎯 Utfordring fullført! +${challenge.xp} XP`, 'success');
        triggerConfetti();
        renderDailyChallenge();
    } else {
        showToast('Du har ikke fullført utfordringen ennå!', 'warning');
    }
}
window.completeChallenge = completeChallenge;

// ===== MOTIVATIONAL QUOTES =====
const motivationalQuotes = [
    { text: "God mat bringer folk sammen.", author: "Ukjent" },
    { text: "Matlaging er kjærlighet gjort synlig.", author: "Ukjent" },
    { text: "Hemmeligheten til god mat er kjærlighet og tid.", author: "Bestemor" },
    { text: "Ingenting sier 'jeg elsker deg' som hjemmelaget mat.", author: "Ukjent" },
    { text: "Familieoppskrifter er kjærlighet videreført.", author: "Ukjent" },
    { text: "Det beste krydderet er hunger.", author: "Cervantes" },
    { text: "Livet er for kort til dårlig mat.", author: "Ukjent" },
    { text: "Ett måltid om gangen - det er slik familier bygges.", author: "Ukjent" },
    { text: "Minner lages rundt matbordet.", author: "Ukjent" },
    { text: "Velkommen til kjøkkenet - her skapes magi!", author: "Ukjent" }
];

function getMotivationalQuote() {
    const today = new Date();
    const index = (today.getFullYear() + today.getMonth() + today.getDate()) % motivationalQuotes.length;
    return motivationalQuotes[index];
}

// ===== COOKING TIPS OF THE DAY =====
const dailyCookingTips = [
    "🧂 Salt pastavannet godt - det skal smake som havet!",
    "🧈 La smøret bli romtemperert før baking for bedre resultat.",
    "🧅 Gråt du av løk? Legg den i fryseren 15 min før kutting.",
    "🍝 Spar litt pastavann - det gjør sausen silkemyk!",
    "🥩 La kjøttet hvile etter steking - det blir mer saftig.",
    "🧄 Knus hvitløken med knivbladet for enklere skreling.",
    "🥚 Ferske egg synker i vann - gamle flyter.",
    "🍋 Rul sitronen før pressing for mer juice.",
    "🥕 Frys urter i olivenolje i isbrettformen.",
    "🧀 Riv ost kaldt - den klumper seg mindre.",
    "🍲 Tilsett alltid smak mot slutten av kokingen.",
    "🌿 Ferske urter tilsettes til slutt, tørkede i starten.",
    "🍳 Varm pannen godt før du tilsetter olje.",
    "🥗 Tørk salaten godt - dressing fester bedre på tørre blader."
];

function getDailyCookingTip() {
    const today = new Date();
    const index = (today.getDate() + today.getMonth()) % dailyCookingTips.length;
    return dailyCookingTips[index];
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

// ===== ULTRA-PROCESSED FOOD DETECTOR =====
const ultraProcessedIndicators = {
    ingredients: [
        'maltodextrin', 'dekstrose', 'glukosesirup', 'fruktosesirup', 'aspartam', 'acesulfam',
        'sukralose', 'syklamat', 'sacharin', 'e621', 'msg', 'natriumglutamat', 'emulgator',
        'stabilisator', 'fortykningsmiddel', 'antiklumpemiddel', 'konserveringsmiddel',
        'smaksforsterker', 'farge', 'aroma', 'kunstig', 'modifisert stivelse', 'hydrogenert',
        'transfett', 'palmeolje', 'invertert sukker', 'karamellfarging', 'high fructose',
        'corn syrup', 'dextrose', 'maltodextrin', 'modified starch', 'hydrogenated',
        'emulsifier', 'stabilizer', 'preservative', 'artificial', 'flavoring'
    ],
    categories: {
        'minimally-processed': { name: 'Minimalt prosessert', icon: '🥬', color: '#4CAF50', score: 1 },
        'processed-culinary': { name: 'Bearbeidet matlagingsingrediens', icon: '🧈', color: '#8BC34A', score: 2 },
        'processed': { name: 'Prosessert mat', icon: '🥫', color: '#FFC107', score: 3 },
        'ultra-processed': { name: 'Ultraprosessert', icon: '⚠️', color: '#FF5722', score: 4 }
    }
};

function analyzeProcessingLevel(ingredients) {
    if (!ingredients || ingredients.length === 0) {
        return { level: 'unknown', score: 0, warnings: [] };
    }
    
    const warnings = [];
    let maxScore = 1;
    
    const ingredientText = ingredients.map(i => (i.name || i).toLowerCase()).join(' ');
    
    // Check for ultra-processed indicators
    const foundIndicators = ultraProcessedIndicators.ingredients.filter(indicator => 
        ingredientText.includes(indicator.toLowerCase())
    );
    
    if (foundIndicators.length >= 3) {
        maxScore = 4;
        warnings.push(`Inneholder ${foundIndicators.length} ultra-prosesserte ingredienser`);
    } else if (foundIndicators.length >= 1) {
        maxScore = Math.max(maxScore, 3);
        warnings.push(`Inneholder prosesserte ingredienser: ${foundIndicators.slice(0, 3).join(', ')}`);
    }
    
    // Check ingredient count (many ingredients often means processed)
    if (ingredients.length > 15) {
        maxScore = Math.max(maxScore, 3);
        warnings.push('Mange ingredienser kan indikere prosessert mat');
    }
    
    let level = 'minimally-processed';
    if (maxScore === 2) level = 'processed-culinary';
    if (maxScore === 3) level = 'processed';
    if (maxScore === 4) level = 'ultra-processed';
    
    return { level, score: maxScore, warnings, foundIndicators };
}

function getProcessingBadge(recipe) {
    const analysis = analyzeProcessingLevel(recipe.ingredients);
    const category = ultraProcessedIndicators.categories[analysis.level];
    
    if (!category) return '';
    
    return `<span class="processing-badge" style="background: ${category.color}20; color: ${category.color}; border: 1px solid ${category.color}" title="${analysis.warnings.join('\n') || category.name}">
        ${category.icon} ${category.name}
    </span>`;
}

function showProcessingAnalysis(recipe) {
    const analysis = analyzeProcessingLevel(recipe.ingredients);
    const category = ultraProcessedIndicators.categories[analysis.level] || 
        { name: 'Ukjent', icon: '❓', color: '#9E9E9E' };
    
    const html = `
        <div class="processing-analysis">
            <div class="processing-result" style="background: ${category.color}20; border-color: ${category.color}">
                <span class="processing-icon">${category.icon}</span>
                <span class="processing-level">${category.name}</span>
            </div>
            
            <div class="processing-info">
                <h4>NOVA-klassifisering</h4>
                <p>Basert på NOVA systemet som klassifiserer mat etter grad av prosessering.</p>
                
                <div class="nova-scale">
                    ${Object.entries(ultraProcessedIndicators.categories).map(([key, cat]) => `
                        <div class="nova-item ${analysis.level === key ? 'active' : ''}" style="${analysis.level === key ? `background: ${cat.color}20; border-color: ${cat.color}` : ''}">
                            <span>${cat.icon}</span>
                            <span>${cat.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${analysis.warnings.length > 0 ? `
                <div class="processing-warnings">
                    <h4>⚠️ Merknader</h4>
                    <ul>
                        ${analysis.warnings.map(w => `<li>${w}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${analysis.foundIndicators && analysis.foundIndicators.length > 0 ? `
                <div class="found-indicators">
                    <h4>🔍 Funnet prosesserte ingredienser</h4>
                    <div class="indicator-tags">
                        ${analysis.foundIndicators.map(i => `<span class="indicator-tag">${i}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="processing-tips">
                <h4>💡 Tips for sunnere valg</h4>
                <ul>
                    <li>Velg mat med korte ingredienslister</li>
                    <li>Unngå mat med ingredienser du ikke kjenner igjen</li>
                    <li>Lag mat fra bunnen av når mulig</li>
                    <li>Kjøp ferske, hele råvarer</li>
                </ul>
            </div>
        </div>
    `;
    
    showModal('🔬 Prosesseringsanalyse', html, []);
}
window.showProcessingAnalysis = showProcessingAnalysis;

// ===== NORWEGIAN GROCERY PRICE COMPARISON =====
// Using Kassalapp API (public Norwegian grocery price API) and fallback estimates
const groceryPriceData = {
    apiEnabled: true,
    stores: {
        'rema1000': { name: 'Rema 1000', logo: '🟡', discount: 0.95 },
        'kiwi': { name: 'Kiwi', logo: '🟢', discount: 0.97 },
        'coop-extra': { name: 'Coop Extra', logo: '🔵', discount: 0.98 },
        'coop-mega': { name: 'Coop Mega', logo: '🔵', discount: 1.02 },
        'meny': { name: 'Meny', logo: '🟤', discount: 1.08 },
        'spar': { name: 'SPAR', logo: '🔴', discount: 1.0 },
        'joker': { name: 'Joker', logo: '🟠', discount: 1.05 },
        'bunnpris': { name: 'Bunnpris', logo: '🟡', discount: 1.0 }
    },
    // Average Norwegian prices (NOK) per common unit - updated 2024
    basePrices: {
        // Meieriprodukter
        'melk': { price: 22, unit: 'liter' },
        'smør': { price: 45, unit: '250g' },
        'ost': { price: 89, unit: 'kg' },
        'rømme': { price: 32, unit: '300g' },
        'fløte': { price: 28, unit: '3dl' },
        'egg': { price: 49, unit: '12-pk' },
        'yoghurt': { price: 25, unit: '500g' },
        'kremost': { price: 35, unit: '125g' },
        
        // Kjøtt
        'kylling': { price: 119, unit: 'kg' },
        'kyllingfilet': { price: 169, unit: 'kg' },
        'svinekjøtt': { price: 139, unit: 'kg' },
        'storfekjøtt': { price: 199, unit: 'kg' },
        'kjøttdeig': { price: 89, unit: '400g' },
        'bacon': { price: 49, unit: '140g' },
        'pølser': { price: 45, unit: '400g' },
        'lam': { price: 249, unit: 'kg' },
        
        // Fisk
        'laks': { price: 189, unit: 'kg' },
        'torsk': { price: 169, unit: 'kg' },
        'reker': { price: 199, unit: '500g' },
        'tunfisk': { price: 29, unit: 'boks' },
        'makrell': { price: 89, unit: 'kg' },
        
        // Grønnsaker
        'poteter': { price: 29, unit: 'kg' },
        'gulrot': { price: 19, unit: 'kg' },
        'løk': { price: 25, unit: 'kg' },
        'hvitløk': { price: 15, unit: 'stk' },
        'tomat': { price: 39, unit: 'kg' },
        'agurk': { price: 25, unit: 'stk' },
        'paprika': { price: 15, unit: 'stk' },
        'brokkoli': { price: 35, unit: 'stk' },
        'blomkål': { price: 39, unit: 'stk' },
        'spinat': { price: 29, unit: '250g' },
        'salat': { price: 25, unit: 'stk' },
        'champignon': { price: 35, unit: '250g' },
        'squash': { price: 25, unit: 'stk' },
        'aubergine': { price: 30, unit: 'stk' },
        
        // Frukt
        'eple': { price: 39, unit: 'kg' },
        'banan': { price: 25, unit: 'kg' },
        'appelsin': { price: 35, unit: 'kg' },
        'sitron': { price: 8, unit: 'stk' },
        'bær': { price: 45, unit: '250g' },
        'jordbær': { price: 55, unit: '400g' },
        'blåbær': { price: 49, unit: '250g' },
        'avokado': { price: 20, unit: 'stk' },
        
        // Tørrvarer
        'mel': { price: 19, unit: 'kg' },
        'sukker': { price: 25, unit: 'kg' },
        'salt': { price: 12, unit: '500g' },
        'pepper': { price: 35, unit: '50g' },
        'ris': { price: 29, unit: 'kg' },
        'pasta': { price: 22, unit: '500g' },
        'havregryn': { price: 25, unit: 'kg' },
        'brød': { price: 35, unit: 'stk' },
        'knekkebrød': { price: 32, unit: 'pk' },
        'müsli': { price: 45, unit: '750g' },
        
        // Hermetikk
        'tomater-hermetikk': { price: 15, unit: '400g' },
        'bønner': { price: 18, unit: '400g' },
        'mais': { price: 16, unit: '340g' },
        'kokosmElk': { price: 25, unit: '400ml' },
        
        // Oljer og sauer
        'olivenolje': { price: 79, unit: '500ml' },
        'rapsolje': { price: 45, unit: 'liter' },
        'soyasaus': { price: 35, unit: '250ml' },
        'ketsjup': { price: 32, unit: '500g' },
        'majones': { price: 35, unit: '400g' },
        'sennep': { price: 29, unit: '200g' },
        
        // Krydder
        'basilikum': { price: 25, unit: 'bunt' },
        'persille': { price: 22, unit: 'bunt' },
        'timian': { price: 25, unit: 'stk' },
        'oregano': { price: 29, unit: '10g' },
        'paprikapulver': { price: 32, unit: '50g' },
        'kanel': { price: 35, unit: '40g' },
        'ingefær': { price: 15, unit: 'stk' }
    }
};

async function fetchGroceryPrices(searchTerm) {
    // Try Kassalapp API first (Norwegian grocery price API)
    try {
        const response = await fetch(`https://kassal.app/api/v1/products?search=${encodeURIComponent(searchTerm)}&size=5`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.data || [];
        }
    } catch (e) {
        console.log('Kassalapp API not available, using local estimates');
    }
    
    return null; // Fall back to local estimates
}

function estimateIngredientPrice(ingredientName) {
    const name = ingredientName.toLowerCase();
    
    // Find matching base price
    for (const [key, data] of Object.entries(groceryPriceData.basePrices)) {
        if (name.includes(key) || key.includes(name.split(' ')[0])) {
            return { ...data, match: key };
        }
    }
    
    // Default estimate based on ingredient type
    if (name.includes('krydder') || name.includes('urte')) {
        return { price: 30, unit: 'stk', match: 'krydder' };
    }
    if (name.includes('kjøtt') || name.includes('filet')) {
        return { price: 150, unit: 'kg', match: 'kjøtt' };
    }
    if (name.includes('fisk')) {
        return { price: 170, unit: 'kg', match: 'fisk' };
    }
    
    return { price: 25, unit: 'stk', match: 'estimat' };
}

async function showPriceComparison(recipe) {
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
        showToast('Ingen ingredienser å sammenligne', 'warning');
        return;
    }
    
    // Calculate total estimated cost
    let totalEstimate = 0;
    const priceDetails = [];
    
    for (const ing of recipe.ingredients) {
        const name = ing.name || ing;
        const estimate = estimateIngredientPrice(name);
        const itemPrice = estimate.price * 0.3; // Assume using ~30% of package
        totalEstimate += itemPrice;
        priceDetails.push({
            name,
            basePrice: estimate.price,
            unit: estimate.unit,
            estimatedCost: Math.round(itemPrice)
        });
    }
    
    // Generate store comparisons
    const storeComparisons = Object.entries(groceryPriceData.stores).map(([id, store]) => ({
        ...store,
        id,
        total: Math.round(totalEstimate * store.discount)
    })).sort((a, b) => a.total - b.total);
    
    const cheapest = storeComparisons[0];
    const mostExpensive = storeComparisons[storeComparisons.length - 1];
    const savings = mostExpensive.total - cheapest.total;
    
    const html = `
        <div class="price-comparison">
            <div class="price-summary">
                <div class="estimated-total">
                    <span class="label">Estimert totalpris</span>
                    <span class="amount">ca. ${Math.round(totalEstimate)} kr</span>
                    <span class="serving-note">for ${recipe.servings || 4} porsjoner</span>
                </div>
                <div class="per-serving">
                    <span class="label">Per porsjon</span>
                    <span class="amount">ca. ${Math.round(totalEstimate / (recipe.servings || 4))} kr</span>
                </div>
            </div>
            
            <div class="savings-banner">
                <span class="savings-icon">💰</span>
                <span class="savings-text">Spar opptil <strong>${savings} kr</strong> ved å handle hos ${cheapest.name}!</span>
            </div>
            
            <h4>🏪 Butikksammenligning</h4>
            <div class="store-comparison">
                ${storeComparisons.map((store, i) => `
                    <div class="store-row ${i === 0 ? 'cheapest' : ''}">
                        <span class="store-logo">${store.logo}</span>
                        <span class="store-name">${store.name}</span>
                        <span class="store-price">${store.total} kr</span>
                        ${i === 0 ? '<span class="cheapest-badge">Billigst!</span>' : ''}
                    </div>
                `).join('')}
            </div>
            
            <h4>📝 Ingrediensestimater</h4>
            <div class="ingredient-prices">
                ${priceDetails.map(p => `
                    <div class="ingredient-price-row">
                        <span class="ing-name">${escapeHtml(p.name)}</span>
                        <span class="ing-price">${p.basePrice} kr/${p.unit}</span>
                        <span class="ing-cost">~${p.estimatedCost} kr</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="price-disclaimer">
                <p>⚠️ <strong>Merk:</strong> Prisene er estimater basert på gjennomsnittlige norske dagligvarepriser. 
                Faktiske priser kan variere basert på tilbud, butikk og sesong.</p>
                <p>💡 <strong>Tips:</strong> Sjekk ukens tilbud i <a href="https://www.kassalapp.no" target="_blank">Kassalapp</a> 
                eller butikkenes egne apper for eksakte priser!</p>
            </div>
            
            <div class="budget-tips">
                <h4>💡 Sparetips for denne oppskriften</h4>
                <ul>
                    <li>Kjøp kjøtt/fisk på tilbud og frys ned</li>
                    <li>Bruk sesongens grønnsaker - de er ofte billigere</li>
                    <li>Sammenlign kilopris, ikke stykk-pris</li>
                    <li>Planlegg ukens middager basert på tilbud</li>
                    <li>Erstatt dyre ingredienser med rimeligere alternativer</li>
                </ul>
            </div>
        </div>
    `;
    
    showModal('💰 Prissammenligning', html, []);
}
window.showPriceComparison = showPriceComparison;

// ===== SMART WEEKLY BUDGET PLANNER =====
function openBudgetPlanner() {
    const html = `
        <div class="budget-planner">
            <div class="budget-input-section">
                <label>Ukesbudsjett for mat:</label>
                <div class="budget-input-row">
                    <input type="number" id="weeklyBudget" placeholder="2000" value="${state.settings.weeklyBudget || 2000}">
                    <span>kr</span>
                </div>
                
                <label>Antall personer i husstanden:</label>
                <input type="number" id="householdSize" min="1" max="20" value="${state.settings.householdSize || 2}">
                
                <label>Matpreferanser:</label>
                <div class="preference-checkboxes">
                    <label><input type="checkbox" id="budgetVegetarian"> Mest vegetar</label>
                    <label><input type="checkbox" id="budgetFish"> Mye fisk</label>
                    <label><input type="checkbox" id="budgetBudgetMeals"> Budsjettmiddager</label>
                    <label><input type="checkbox" id="budgetQuickMeals"> Raske retter (&lt;30 min)</label>
                </div>
            </div>
            
            <button class="btn btn-primary" onclick="generateBudgetMealPlan()">
                ✨ Generer ukesmeny
            </button>
            
            <div id="budgetPlanResult"></div>
        </div>
    `;
    
    showModal('💵 Ukesbudsjettering', html, []);
}
window.openBudgetPlanner = openBudgetPlanner;

function generateBudgetMealPlan() {
    const budget = parseFloat($('weeklyBudget')?.value) || 2000;
    const householdSize = parseInt($('householdSize')?.value) || 2;
    const perPersonBudget = budget / householdSize / 7;
    
    // Save settings
    state.settings.weeklyBudget = budget;
    state.settings.householdSize = householdSize;
    
    // Get recipes sorted by estimated cost
    const recipesWithCost = state.recipes.map(r => ({
        ...r,
        estimatedCost: estimateRecipeCost(r),
        costPerPerson: estimateRecipeCost(r) / (r.servings || 4)
    })).filter(r => r.costPerPerson <= perPersonBudget * 1.2);
    
    // Sort by value (rating vs cost)
    recipesWithCost.sort((a, b) => {
        const aValue = (a.rating || 3) / a.costPerPerson;
        const bValue = (b.rating || 3) / b.costPerPerson;
        return bValue - aValue;
    });
    
    // Pick 7 recipes for the week
    const weekPlan = [];
    const days = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
    let totalCost = 0;
    
    for (let i = 0; i < 7; i++) {
        const recipe = recipesWithCost[i % recipesWithCost.length] || { name: 'Egendefinert måltid', estimatedCost: perPersonBudget * householdSize };
        const adjustedCost = Math.round(recipe.estimatedCost * (householdSize / (recipe.servings || 4)));
        weekPlan.push({
            day: days[i],
            recipe: recipe.name,
            cost: adjustedCost
        });
        totalCost += adjustedCost;
    }
    
    const withinBudget = totalCost <= budget;
    
    const resultHtml = `
        <div class="budget-result ${withinBudget ? 'within-budget' : 'over-budget'}">
            <div class="budget-summary">
                <div class="budget-status">
                    ${withinBudget ? '✅ Innenfor budsjett!' : '⚠️ Over budsjett'}
                </div>
                <div class="budget-numbers">
                    <span>Estimert: <strong>${totalCost} kr</strong></span>
                    <span>Budsjett: <strong>${budget} kr</strong></span>
                    <span>${withinBudget ? 'Til overs' : 'Over'}: <strong>${Math.abs(budget - totalCost)} kr</strong></span>
                </div>
            </div>
            
            <div class="budget-week-plan">
                ${weekPlan.map(day => `
                    <div class="budget-day">
                        <span class="day-name">${day.day}</span>
                        <span class="day-meal">${escapeHtml(day.recipe)}</span>
                        <span class="day-cost">${day.cost} kr</span>
                    </div>
                `).join('')}
            </div>
            
            <button class="btn btn-secondary" onclick="applyBudgetPlanToWeek()">
                📅 Legg til i ukesplanen
            </button>
        </div>
    `;
    
    const container = $('budgetPlanResult');
    if (container) container.innerHTML = resultHtml;
}
window.generateBudgetMealPlan = generateBudgetMealPlan;

function estimateRecipeCost(recipe) {
    if (!recipe.ingredients) return 50;
    
    let total = 0;
    for (const ing of recipe.ingredients) {
        const name = ing.name || ing;
        const estimate = estimateIngredientPrice(name);
        total += estimate.price * 0.3;
    }
    return Math.round(total);
}

// ===== MEAL PREP ASSISTANT =====
function openMealPrepAssistant() {
    const html = `
        <div class="meal-prep-assistant">
            <div class="meal-prep-intro">
                <h3>🥡 Smart Meal Prep</h3>
                <p>Spar tid ved å forberede måltider på forhånd!</p>
            </div>
            
            <div class="prep-options">
                <label>Hvor mange dager vil du prepe for?</label>
                <select id="prepDays">
                    <option value="3">3 dager</option>
                    <option value="5" selected>5 dager (arbeidsuke)</option>
                    <option value="7">7 dager (hel uke)</option>
                </select>
                
                <label>Hvilke måltider?</label>
                <div class="meal-type-checkboxes">
                    <label><input type="checkbox" id="prepLunch" checked> Lunsj</label>
                    <label><input type="checkbox" id="prepDinner" checked> Middag</label>
                    <label><input type="checkbox" id="prepSnacks"> Mellommåltider</label>
                </div>
                
                <label>Tilgjengelig preptid:</label>
                <select id="prepTime">
                    <option value="60">1 time</option>
                    <option value="120" selected>2 timer</option>
                    <option value="180">3 timer</option>
                    <option value="240">4+ timer</option>
                </select>
            </div>
            
            <button class="btn btn-primary" onclick="generateMealPrepPlan()">
                ✨ Lag meal prep-plan
            </button>
            
            <div id="mealPrepResult"></div>
        </div>
    `;
    
    showModal('🥡 Meal Prep Assistent', html, []);
}
window.openMealPrepAssistant = openMealPrepAssistant;

function generateMealPrepPlan() {
    const days = parseInt($('prepDays')?.value) || 5;
    const prepTime = parseInt($('prepTime')?.value) || 120;
    
    // Find recipes suitable for meal prep (good for reheating, batch cooking)
    const mealPrepSuitable = state.recipes.filter(r => {
        const name = r.name.toLowerCase();
        const desc = (r.description || '').toLowerCase();
        // Keywords that indicate good meal prep
        const goodForPrep = ['gryte', 'suppe', 'stuing', 'curry', 'chili', 'bolognese', 
            'lasagne', 'salat', 'bowl', 'wrap', 'burrito', 'stew', 'soup', 'casserole'];
        return goodForPrep.some(kw => name.includes(kw) || desc.includes(kw)) || r.servings >= 4;
    });
    
    // Fallback to all recipes if no suitable ones found
    const recipesToUse = mealPrepSuitable.length >= 2 ? mealPrepSuitable : state.recipes;
    
    // Generate plan
    const plan = {
        recipes: recipesToUse.slice(0, Math.ceil(days / 2)),
        schedule: [],
        shoppingList: []
    };
    
    // Create prep schedule
    const prepSteps = [
        { time: '0:00', task: 'Vask og klargjør alle grønnsaker' },
        { time: '0:15', task: 'Sett på vann til koking (ris, pasta, poteter)' },
        { time: '0:20', task: 'Start med hovedretten som tar lengst tid' },
        { time: '0:45', task: 'Forbered proteinkilder (kjøtt/fisk/bønner)' },
        { time: '1:00', task: 'Lag sauser og dressinger' },
        { time: '1:15', task: 'Sjekk og snu/rør i det som stekes' },
        { time: '1:30', task: 'Begynn å pakke ferdig mat i beholdere' },
        { time: '1:45', task: 'Merking og organisering' },
        { time: '2:00', task: 'Rydd og rengjør' }
    ].filter(step => parseInt(step.time.split(':')[0]) * 60 + parseInt(step.time.split(':')[1]) <= prepTime);
    
    const resultHtml = `
        <div class="meal-prep-result">
            <div class="prep-overview">
                <h4>📋 Din Meal Prep-plan</h4>
                <p><strong>${days} dager</strong> med mat på <strong>${Math.floor(prepTime/60)} timer</strong></p>
            </div>
            
            <div class="prep-recipes">
                <h4>🍽️ Oppskrifter å forberede</h4>
                ${plan.recipes.map(r => `
                    <div class="prep-recipe-item">
                        <span class="recipe-name">${escapeHtml(r.name)}</span>
                        <span class="recipe-portions">${r.servings || 4} porsjoner</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="prep-schedule">
                <h4>⏰ Tidsplan for prep-dagen</h4>
                ${prepSteps.map(step => `
                    <div class="prep-step">
                        <span class="step-time">${step.time}</span>
                        <span class="step-task">${step.task}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="prep-tips">
                <h4>💡 Meal Prep-tips</h4>
                <ul>
                    <li>Invester i gode oppbevaringsbokser (glass holder lengst)</li>
                    <li>Merk alt med dato</li>
                    <li>Oppbevar sauser separat for å unngå bløt mat</li>
                    <li>Frys ned porsjoner du ikke spiser innen 3-4 dager</li>
                    <li>Varier med ferske toppinger for å unngå mat-trøtthet</li>
                </ul>
            </div>
            
            <div class="storage-guide">
                <h4>🧊 Holdbarhet i kjøleskap</h4>
                <div class="storage-items">
                    <span class="storage-item"><strong>Kokt ris/pasta:</strong> 4-6 dager</span>
                    <span class="storage-item"><strong>Kokt kjøtt:</strong> 3-4 dager</span>
                    <span class="storage-item"><strong>Gryter/supper:</strong> 4-5 dager</span>
                    <span class="storage-item"><strong>Salater (uten dressing):</strong> 3-5 dager</span>
                </div>
            </div>
        </div>
    `;
    
    const container = $('mealPrepResult');
    if (container) container.innerHTML = resultHtml;
}
window.generateMealPrepPlan = generateMealPrepPlan;

// ===== SMART GROCERY LIST OPTIMIZER =====
function optimizeGroceryList() {
    if (state.shoppingList.length === 0) {
        showToast('Handlelisten er tom', 'warning');
        return;
    }
    
    // Sort by store department
    const departments = {
        'Frukt & Grønt': [],
        'Meieri': [],
        'Kjøtt & Fisk': [],
        'Brød & Bakevarer': [],
        'Tørrvarer': [],
        'Frysevarer': [],
        'Hermetikk': [],
        'Krydder': [],
        'Drikke': [],
        'Annet': []
    };
    
    for (const item of state.shoppingList) {
        const name = getItemName(item).toLowerCase();
        let dept = 'Annet';
        
        if (/eple|banan|tomat|gulrot|løk|salat|agurk|paprika|frukt|grønn|potet|brokkoli/.test(name)) {
            dept = 'Frukt & Grønt';
        } else if (/melk|ost|smør|yoghurt|fløte|rømme|egg/.test(name)) {
            dept = 'Meieri';
        } else if (/kjøtt|kylling|svin|storfe|laks|fisk|bacon|pølse/.test(name)) {
            dept = 'Kjøtt & Fisk';
        } else if (/brød|rundstykke|bolle|kake|croissant/.test(name)) {
            dept = 'Brød & Bakevarer';
        } else if (/mel|sukker|ris|pasta|havre|müsli|nudler/.test(name)) {
            dept = 'Tørrvarer';
        } else if (/frossen|is|fryse|pizza/.test(name)) {
            dept = 'Frysevarer';
        } else if (/boks|hermetikk|tomat.*boks|bønner|mais/.test(name)) {
            dept = 'Hermetikk';
        } else if (/salt|pepper|krydder|basilikum|oregano|timian/.test(name)) {
            dept = 'Krydder';
        } else if (/vann|juice|brus|kaffe|te|øl|vin/.test(name)) {
            dept = 'Drikke';
        }
        
        departments[dept].push(item);
    }
    
    // Remove empty departments
    const activeDepts = Object.entries(departments).filter(([_, items]) => items.length > 0);
    
    const html = `
        <div class="optimized-list">
            <div class="list-header">
                <h3>🛒 Optimalisert Handleliste</h3>
                <p>Sortert etter butikkavdeling for effektiv handling!</p>
            </div>
            
            ${activeDepts.map(([dept, items]) => `
                <div class="department-section">
                    <h4 class="dept-header">${getDepartmentIcon(dept)} ${dept}</h4>
                    <ul class="dept-items">
                        ${items.map(item => `
                            <li class="dept-item ${item.checked ? 'checked' : ''}">
                                <span class="item-name">${escapeHtml(item.name || item)}</span>
                                ${item.amount ? `<span class="item-amount">${escapeHtml(item.amount)}</span>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `).join('')}
            
            <div class="list-footer">
                <p><strong>Totalt:</strong> ${state.shoppingList.length} varer</p>
                <button class="btn btn-secondary" onclick="printOptimizedList()">🖨️ Skriv ut liste</button>
                <button class="btn btn-secondary" onclick="shareShoppingList()">📤 Del liste</button>
            </div>
        </div>
    `;
    
    showModal('🛒 Smart Handleliste', html, []);
}
window.optimizeGroceryList = optimizeGroceryList;

function getDepartmentIcon(dept) {
    const icons = {
        'Frukt & Grønt': '🥬',
        'Meieri': '🥛',
        'Kjøtt & Fisk': '🥩',
        'Brød & Bakevarer': '🍞',
        'Tørrvarer': '🌾',
        'Frysevarer': '🧊',
        'Hermetikk': '🥫',
        'Krydder': '🌿',
        'Drikke': '🥤',
        'Annet': '📦'
    };
    return icons[dept] || '📦';
}

function shareShoppingList() {
    const text = state.shoppingList.map(item => {
        const name = item.name || item;
        return item.amount ? `${name} (${item.amount})` : name;
    }).join('\n');
    
    if (navigator.share) {
        navigator.share({
            title: 'Handleliste fra Kokebok',
            text: `Min handleliste:\n\n${text}`
        });
    } else {
        navigator.clipboard.writeText(text);
        showToast('Handleliste kopiert!', 'success');
    }
}
window.shareShoppingList = shareShoppingList;

function printOptimizedList() {
    window.print();
}
window.printOptimizedList = printOptimizedList;

// ===== SMART RECIPE SUGGESTIONS BASED ON WHAT YOU HAVE =====
function openWhatCanIMake() {
    const html = `
        <div class="what-can-i-make">
            <h3>🧊 Hva har du i kjøleskapet?</h3>
            <p>Skriv inn ingrediensene du har, så finner vi oppskrifter!</p>
            
            <div class="ingredient-input">
                <textarea id="myIngredients" placeholder="F.eks:&#10;kylling&#10;paprika&#10;ris&#10;løk&#10;hvitløk"></textarea>
            </div>
            
            <div class="common-ingredients">
                <p>Eller velg vanlige ingredienser:</p>
                <div class="ingredient-chips">
                    <span class="ing-chip" onclick="addIngredientChip('kylling')">🐔 Kylling</span>
                    <span class="ing-chip" onclick="addIngredientChip('kjøttdeig')">🥩 Kjøttdeig</span>
                    <span class="ing-chip" onclick="addIngredientChip('laks')">🐟 Laks</span>
                    <span class="ing-chip" onclick="addIngredientChip('egg')">🥚 Egg</span>
                    <span class="ing-chip" onclick="addIngredientChip('pasta')">🍝 Pasta</span>
                    <span class="ing-chip" onclick="addIngredientChip('ris')">🍚 Ris</span>
                    <span class="ing-chip" onclick="addIngredientChip('poteter')">🥔 Poteter</span>
                    <span class="ing-chip" onclick="addIngredientChip('tomat')">🍅 Tomat</span>
                    <span class="ing-chip" onclick="addIngredientChip('løk')">🧅 Løk</span>
                    <span class="ing-chip" onclick="addIngredientChip('ost')">🧀 Ost</span>
                </div>
            </div>
            
            <button class="btn btn-primary" onclick="findRecipesWithIngredients()">
                🔍 Finn oppskrifter
            </button>
            
            <div id="whatCanIMakeResults"></div>
        </div>
    `;
    
    showModal('🍳 Hva kan jeg lage?', html, []);
}
window.openWhatCanIMake = openWhatCanIMake;

function addIngredientChip(ingredient) {
    const textarea = $('myIngredients');
    if (textarea) {
        const current = textarea.value.trim();
        if (current && !current.includes(ingredient)) {
            textarea.value = current + '\n' + ingredient;
        } else if (!current) {
            textarea.value = ingredient;
        }
    }
}
window.addIngredientChip = addIngredientChip;

function findRecipesWithIngredients() {
    const input = $('myIngredients')?.value || '';
    const myIngredients = input.split('\n')
        .map(i => i.trim().toLowerCase())
        .filter(i => i.length > 0);
    
    if (myIngredients.length === 0) {
        showToast('Skriv inn minst én ingrediens', 'warning');
        return;
    }
    
    // Find matching recipes
    const matches = state.recipes.map(recipe => {
        // Handle both array and string ingredients
        let ingredientsArray = recipe.ingredients || [];
        if (typeof ingredientsArray === 'string') {
            ingredientsArray = ingredientsArray.split('\n').filter(i => i.trim());
        }
        
        const recipeIngredients = ingredientsArray.map(i => 
            (typeof i === 'object' ? i.name : i || '').toLowerCase()
        );
        
        let matchCount = 0;
        let matchedIngs = [];
        
        for (const myIng of myIngredients) {
            if (recipeIngredients.some(ri => ri.includes(myIng) || myIng.includes(ri))) {
                matchCount++;
                matchedIngs.push(myIng);
            }
        }
        
        const missingIngs = recipeIngredients.filter(ri => 
            !myIngredients.some(mi => ri.includes(mi) || mi.includes(ri))
        );
        
        return {
            recipe,
            matchCount,
            matchedIngs,
            missingIngs,
            matchPercent: Math.round((matchCount / recipeIngredients.length) * 100) || 0
        };
    }).filter(m => m.matchCount > 0).sort((a, b) => b.matchPercent - a.matchPercent);
    
    const resultHtml = matches.length > 0 ? `
        <div class="match-results">
            <h4>🎉 Fant ${matches.length} oppskrifter!</h4>
            ${matches.slice(0, 10).map(m => `
                <div class="match-item" onclick="viewRecipe('${m.recipe.id}'); closeGenericModal();">
                    <div class="match-header">
                        <span class="match-name">${escapeHtml(m.recipe.name)}</span>
                        <span class="match-percent">${m.matchPercent}% match</span>
                    </div>
                    <div class="match-details">
                        <span class="matched-ings">✅ Har: ${m.matchedIngs.join(', ')}</span>
                        ${m.missingIngs.length > 0 ? `
                            <span class="missing-ings">🛒 Mangler: ${m.missingIngs.slice(0, 5).join(', ')}${m.missingIngs.length > 5 ? '...' : ''}</span>
                        ` : '<span class="complete">🌟 Du har alt!</span>'}
                    </div>
                </div>
            `).join('')}
        </div>
    ` : `
        <div class="no-matches">
            <span>😕</span>
            <p>Ingen oppskrifter matcher ingrediensene dine.</p>
            <p>Prøv å legge til flere ingredienser eller søk etter nye oppskrifter!</p>
        </div>
    `;
    
    const container = $('whatCanIMakeResults');
    if (container) container.innerHTML = resultHtml;
}
window.findRecipesWithIngredients = findRecipesWithIngredients;

// ===== HOUSEHOLD PROFILES =====
const householdProfiles = {
    student: { 
        name: 'Student', 
        icon: '📚', 
        budget: 500, 
        features: ['Raske retter', 'Budsjettmat', 'Meal prep']
    },
    single: { 
        name: 'Singel', 
        icon: '👤', 
        budget: 800, 
        features: ['Små porsjoner', 'Enkel matlaging', 'Lite svinn']
    },
    couple: { 
        name: 'Par', 
        icon: '👫', 
        budget: 1200, 
        features: ['Date night-oppskrifter', 'To porsjoner', 'Romantiske middager']
    },
    family: { 
        name: 'Familie', 
        icon: '👨‍👩‍👧‍👦', 
        budget: 2500, 
        features: ['Barnevennlig', 'Batch cooking', 'Sunn mat']
    },
    senior: { 
        name: 'Senior', 
        icon: '👴👵', 
        budget: 1000, 
        features: ['Tradisjonell mat', 'Enkel tilberedning', 'Næringsrik']
    }
};

function showHouseholdSelector() {
    const html = `
        <div class="household-selector">
            <h3>Hvem lager du mat til?</h3>
            <p>Velg din husholdningstype for tilpassede oppskrifter og tips!</p>
            
            <div class="household-grid">
                ${Object.entries(householdProfiles).map(([key, profile]) => `
                    <div class="household-card ${state.settings.householdType === key ? 'selected' : ''}" 
                         onclick="selectHousehold('${key}')">
                        <span class="household-icon">${profile.icon}</span>
                        <span class="household-name">${profile.name}</span>
                        <span class="household-budget">~${profile.budget} kr/uke</span>
                        <div class="household-features">
                            ${profile.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    showModal('🏠 Velg husstand', html, []);
}
window.showHouseholdSelector = showHouseholdSelector;

function selectHousehold(type) {
    state.settings.householdType = type;
    state.settings.weeklyBudget = householdProfiles[type].budget;
    showToast(`${householdProfiles[type].icon} ${householdProfiles[type].name}-profil aktivert!`, 'success');
    closeGenericModal();
}
window.selectHousehold = selectHousehold;

// ===== RECIPE RATING SYSTEM ENHANCED =====
function showTopRatedRecipes() {
    const rated = state.recipes
        .filter(r => r.rating && r.rating >= 4)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    
    const html = `
        <div class="top-rated">
            <h3>⭐ Dine toppratede oppskrifter</h3>
            ${rated.length > 0 ? `
                <div class="rated-list">
                    ${rated.slice(0, 10).map(r => `
                        <div class="rated-item" onclick="viewRecipe('${r.id}'); closeGenericModal();">
                            <span class="rated-stars">${'⭐'.repeat(r.rating)}</span>
                            <span class="rated-name">${escapeHtml(r.name)}</span>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <p>Du har ikke vurdert noen oppskrifter ennå!</p>
                <p>Gi oppskriftene stjerner for å finne dine favoritter.</p>
            `}
        </div>
    `;
    
    showModal('⭐ Toppratede', html, []);
}
window.showTopRatedRecipes = showTopRatedRecipes;

// ===== QUICK ADD RECIPES FROM TEXT =====
function openQuickRecipeFromText() {
    const html = `
        <div class="quick-recipe-input">
            <h3>📝 Lim inn oppskrift</h3>
            <p>Lim inn en oppskrift fra nettet eller et dokument, så prøver vi å tolke den automatisk!</p>
            
            <textarea id="pastedRecipeText" placeholder="Lim inn oppskriften her...&#10;&#10;Eksempel:&#10;Pasta Carbonara&#10;&#10;Ingredienser:&#10;400g spaghetti&#10;200g bacon&#10;4 egg&#10;..."></textarea>
            
            <button class="btn btn-primary" onclick="parseQuickRecipe()">
                ✨ Tolk oppskrift
            </button>
            
            <div id="parsedRecipePreview"></div>
        </div>
    `;
    
    showModal('📝 Rask oppskrift', html, []);
}
window.openQuickRecipeFromText = openQuickRecipeFromText;

function parseQuickRecipe() {
    const text = $('pastedRecipeText')?.value || '';
    if (!text.trim()) {
        showToast('Lim inn en oppskrift først', 'warning');
        return;
    }
    
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    // Try to extract name (first non-empty line that's not a number)
    const name = lines.find(l => l.length > 3 && !/^\d+/.test(l) && !l.toLowerCase().includes('ingrediens')) || 'Ukjent oppskrift';
    
    // Find ingredients section
    const ingredientStart = lines.findIndex(l => 
        l.toLowerCase().includes('ingrediens') || l.toLowerCase().includes('du trenger')
    );
    
    // Find instructions section
    const instructionStart = lines.findIndex(l => 
        l.toLowerCase().includes('fremgangsmåte') || 
        l.toLowerCase().includes('slik gjør du') ||
        l.toLowerCase().includes('instructions') ||
        l.toLowerCase().includes('steg')
    );
    
    // Extract ingredients
    const ingredientLines = [];
    const startIdx = ingredientStart >= 0 ? ingredientStart + 1 : 1;
    const endIdx = instructionStart >= 0 ? instructionStart : lines.length;
    
    for (let i = startIdx; i < endIdx && i < lines.length; i++) {
        const line = lines[i];
        if (line && !line.toLowerCase().includes('ingrediens') && line.length > 1) {
            // Parse ingredient line
            const match = line.match(/^(\d+[\s]*(?:g|kg|dl|l|ss|ts|stk|pk)?[\s]*)(.+)$/i);
            if (match) {
                ingredientLines.push({ amount: match[1].trim(), name: match[2].trim() });
            } else if (!line.includes(':')) {
                ingredientLines.push({ amount: '', name: line });
            }
        }
    }
    
    // Extract instructions
    const instructions = [];
    if (instructionStart >= 0) {
        for (let i = instructionStart + 1; i < lines.length; i++) {
            const line = lines[i].replace(/^\d+[\.\)]\s*/, '');
            if (line.length > 5) instructions.push(line);
        }
    }
    
    const preview = `
        <div class="parsed-preview">
            <h4>Tolket oppskrift:</h4>
            <p><strong>Navn:</strong> ${escapeHtml(name)}</p>
            <p><strong>Ingredienser (${ingredientLines.length}):</strong></p>
            <ul>${ingredientLines.slice(0, 10).map(i => `<li>${escapeHtml(i.amount)} ${escapeHtml(i.name)}</li>`).join('')}</ul>
            ${instructions.length > 0 ? `<p><strong>Fremgangsmåte:</strong> ${instructions.length} steg funnet</p>` : ''}
            
            <button class="btn btn-success" onclick="saveQuickParsedRecipe('${encodeURIComponent(JSON.stringify({name, ingredients: ingredientLines, instructions}))}')">
                💾 Lagre oppskrift
            </button>
        </div>
    `;
    
    const container = $('parsedRecipePreview');
    if (container) container.innerHTML = preview;
}
window.parseQuickRecipe = parseQuickRecipe;

function saveQuickParsedRecipe(encodedData) {
    const data = JSON.parse(decodeURIComponent(encodedData));
    
    // Create new recipe
    const newRecipe = {
        id: 'recipe_' + Date.now(),
        name: data.name,
        ingredients: data.ingredients,
        instructions: data.instructions.join('\n\n'),
        servings: 4,
        prepTime: '',
        cookTime: '',
        createdAt: new Date().toISOString()
    };
    
    state.recipes.push(newRecipe);
    saveToFirestore('recipes', newRecipe.id, newRecipe);
    
    showToast('Oppskrift lagret!', 'success');
    closeGenericModal();
    renderRecipes();
}
window.saveQuickParsedRecipe = saveQuickParsedRecipe;

// ===== RECIPE REMIX / VARIATION SUGGESTER =====
function suggestRecipeVariation(recipeId) {
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    const variations = [
        { type: 'vegetar', desc: 'Bytt kjøtt med bønner, tofu eller tempeh', icon: '🥬' },
        { type: 'lavkarbo', desc: 'Erstatt pasta/ris med blomkålris eller zucchininudler', icon: '🥒' },
        { type: 'protein', desc: 'Doble proteinmengden for treningsmat', icon: '💪' },
        { type: 'spicy', desc: 'Legg til chili, sriracha eller ingefær', icon: '🌶️' },
        { type: 'kremet', desc: 'Tilsett fløte, kremost eller kokosmælk', icon: '🥥' },
        { type: 'asiatisk', desc: 'Tilsett soyasaus, sesamolje og ingefær', icon: '🥢' },
        { type: 'italiensk', desc: 'Tilsett basilikum, oregano og parmesan', icon: '🇮🇹' },
        { type: 'meksikansk', desc: 'Tilsett spisskomman, koriander og lime', icon: '🌮' }
    ];
    
    const html = `
        <div class="variation-suggestions">
            <h3>🎨 Varianter av ${escapeHtml(recipe.name)}</h3>
            <p>Her er noen ideer til hvordan du kan variere oppskriften:</p>
            
            <div class="variation-grid">
                ${variations.map(v => `
                    <div class="variation-card">
                        <span class="variation-icon">${v.icon}</span>
                        <span class="variation-type">${v.type.charAt(0).toUpperCase() + v.type.slice(1)}</span>
                        <span class="variation-desc">${v.desc}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="variation-tips">
                <h4>💡 Generelle tips</h4>
                <ul>
                    <li>Start med små endringer og smak til underveis</li>
                    <li>Noter ned endringene dine så du kan gjenskape suksesser</li>
                    <li>Vær kreativ - de beste oppskriftene oppsto ved eksperimentering!</li>
                </ul>
            </div>
        </div>
    `;
    
    showModal('🎨 Oppskriftvariasjoner', html, []);
}
window.suggestRecipeVariation = suggestRecipeVariation;

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
window.closeGenericModal = closeGenericModal;
window.openBudgetPlanner = openBudgetPlanner;
window.openMealPrepAssistant = openMealPrepAssistant;
window.optimizeGroceryList = optimizeGroceryList;
window.openWhatCanIMake = openWhatCanIMake;
window.showHouseholdSelector = showHouseholdSelector;
window.showTopRatedRecipes = showTopRatedRecipes;
window.openQuickRecipeFromText = openQuickRecipeFromText;
window.getPlayerLevel = getPlayerLevel;
window.addXP = addXP;
window.updateDailyStreak = updateDailyStreak;
window.unlockAchievement = unlockAchievement;
window.renderRecipeOfTheDay = renderRecipeOfTheDay;
window.renderDailyChallenge = renderDailyChallenge;
window.getDailyCookingTip = getDailyCookingTip;
window.getMotivationalQuote = getMotivationalQuote;

// ===== URL RECIPE IMPORT =====
async function openUrlImport() {
    const html = `
        <div class="url-import">
            <h3>🔗 Importer fra URL</h3>
            <p>Lim inn lenken til en oppskrift fra en nettside, så henter vi den automatisk!</p>
            
            <div class="url-input-container">
                <input type="url" id="recipeUrl" placeholder="https://www.matprat.no/oppskrifter/..." class="url-input">
                <button class="btn btn-primary" onclick="importFromUrl()">
                    <span class="btn-icon">📥</span> Hent oppskrift
                </button>
            </div>
            
            <div class="supported-sites">
                <p><strong>Støttede nettsider:</strong></p>
                <div class="site-logos">
                    <span class="site-tag">🇳🇴 Matprat</span>
                    <span class="site-tag">🇳🇴 Tine</span>
                    <span class="site-tag">🇳🇴 Godt.no</span>
                    <span class="site-tag">🌍 AllRecipes</span>
                    <span class="site-tag">🌍 BBC Good Food</span>
                    <span class="site-tag">🌍 + flere...</span>
                </div>
            </div>
            
            <div id="urlImportStatus"></div>
            <div id="urlImportPreview"></div>
        </div>
    `;
    
    showModal('🔗 Importer oppskrift fra URL', html, []);
}
window.openUrlImport = openUrlImport;

async function importFromUrl() {
    const url = $('recipeUrl')?.value?.trim();
    const statusEl = $('urlImportStatus');
    const previewEl = $('urlImportPreview');
    
    if (!url) {
        showToast('Skriv inn en URL først', 'warning');
        return;
    }
    
    // Validate URL
    try {
        new URL(url);
    } catch {
        showToast('Ugyldig URL-format', 'error');
        return;
    }
    
    statusEl.innerHTML = `
        <div class="import-loading">
            <div class="spinner"></div>
            <p>Henter oppskrift fra ${new URL(url).hostname}...</p>
        </div>
    `;
    
    try {
        // Use a CORS proxy to fetch the page
        const corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
        
        let html = null;
        for (const proxy of corsProxies) {
            try {
                const response = await fetch(proxy + encodeURIComponent(url), {
                    timeout: 10000
                });
                if (response.ok) {
                    html = await response.text();
                    break;
                }
            } catch (e) {
                console.log('Proxy failed:', proxy);
            }
        }
        
        if (!html) {
            throw new Error('Kunne ikke hente siden');
        }
        
        // Parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Try to extract recipe data using multiple methods
        const recipe = extractRecipeFromHtml(doc, url);
        
        if (!recipe.name) {
            throw new Error('Kunne ikke finne oppskriften på denne siden');
        }
        
        // Show preview
        previewEl.innerHTML = `
            <div class="import-preview">
                <h4>✅ Funnet oppskrift!</h4>
                <div class="preview-card">
                    <strong>${escapeHtml(recipe.name)}</strong>
                    <p>${recipe.ingredients?.length || 0} ingredienser funnet</p>
                    ${recipe.servings ? `<p>Porsjoner: ${recipe.servings}</p>` : ''}
                    ${recipe.prepTime ? `<p>Tid: ${recipe.prepTime}</p>` : ''}
                </div>
                <button class="btn btn-success" onclick="saveImportedRecipe('${encodeURIComponent(JSON.stringify(recipe))}')">
                    💾 Lagre oppskrift
                </button>
            </div>
        `;
        
        statusEl.innerHTML = '';
        
    } catch (error) {
        console.error('Import error:', error);
        statusEl.innerHTML = `
            <div class="import-error">
                <span>❌</span>
                <p>${error.message}</p>
                <p class="hint">Prøv å kopiere oppskriften manuelt med "Lim inn oppskrift"-funksjonen.</p>
            </div>
        `;
    }
}
window.importFromUrl = importFromUrl;

function extractRecipeFromHtml(doc, url) {
    const recipe = {
        name: '',
        ingredients: [],
        instructions: '',
        servings: 4,
        prepTime: '',
        cookTime: '',
        source: url,
        importedAt: new Date().toISOString()
    };
    
    // Method 1: Try JSON-LD structured data (best method)
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
        try {
            const data = JSON.parse(script.textContent);
            const recipeData = findRecipeInJsonLd(data);
            if (recipeData) {
                recipe.name = recipeData.name || '';
                recipe.description = recipeData.description || '';
                recipe.servings = parseInt(recipeData.recipeYield) || 4;
                recipe.prepTime = formatDuration(recipeData.prepTime);
                recipe.cookTime = formatDuration(recipeData.cookTime);
                recipe.image = recipeData.image?.url || recipeData.image?.[0] || recipeData.image || '';
                
                // Parse ingredients
                if (recipeData.recipeIngredient) {
                    recipe.ingredients = recipeData.recipeIngredient.map(ing => {
                        const parsed = parseIngredientString(ing);
                        return { name: parsed.name, amount: parsed.amount };
                    });
                }
                
                // Parse instructions
                if (recipeData.recipeInstructions) {
                    if (Array.isArray(recipeData.recipeInstructions)) {
                        recipe.instructions = recipeData.recipeInstructions
                            .map(step => step.text || step)
                            .join('\n\n');
                    } else {
                        recipe.instructions = recipeData.recipeInstructions;
                    }
                }
                
                if (recipe.name) return recipe;
            }
        } catch (e) {
            console.log('JSON-LD parse error:', e);
        }
    }
    
    // Method 2: Look for common recipe markup patterns
    // Title
    recipe.name = doc.querySelector('h1.recipe-title, h1.entry-title, .recipe-name, [itemprop="name"], h1')?.textContent?.trim() || '';
    
    // Ingredients
    const ingredientEls = doc.querySelectorAll('[itemprop="recipeIngredient"], .ingredient, .recipe-ingredient, .ingredients li, .ingredient-list li');
    if (ingredientEls.length > 0) {
        recipe.ingredients = Array.from(ingredientEls).map(el => {
            const text = el.textContent.trim();
            const parsed = parseIngredientString(text);
            return { name: parsed.name, amount: parsed.amount };
        }).filter(i => i.name);
    }
    
    // Instructions
    const instructionEls = doc.querySelectorAll('[itemprop="recipeInstructions"], .recipe-instructions, .instructions li, .method li, .steps li');
    if (instructionEls.length > 0) {
        recipe.instructions = Array.from(instructionEls)
            .map(el => el.textContent.trim())
            .filter(t => t.length > 10)
            .join('\n\n');
    }
    
    // Servings
    const servingsEl = doc.querySelector('[itemprop="recipeYield"], .servings, .yield');
    if (servingsEl) {
        const match = servingsEl.textContent.match(/\d+/);
        if (match) recipe.servings = parseInt(match[0]);
    }
    
    return recipe;
}

function findRecipeInJsonLd(data) {
    if (!data) return null;
    if (data['@type'] === 'Recipe') return data;
    if (Array.isArray(data)) {
        for (const item of data) {
            const found = findRecipeInJsonLd(item);
            if (found) return found;
        }
    }
    if (data['@graph']) return findRecipeInJsonLd(data['@graph']);
    return null;
}

function formatDuration(isoDuration) {
    if (!isoDuration) return '';
    // Parse ISO 8601 duration (PT30M, PT1H30M, etc.)
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return isoDuration;
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    if (hours && minutes) return `${hours} t ${minutes} min`;
    if (hours) return `${hours} time${hours > 1 ? 'r' : ''}`;
    if (minutes) return `${minutes} min`;
    return '';
}

function parseIngredientString(str) {
    // Try to split amount from ingredient name
    const match = str.match(/^([\d\s,./½¼¾⅓⅔]+\s*(?:g|kg|dl|l|ml|ss|ts|stk|pk|kopp|cups?|tbsp|tsp)?)\s*(.+)$/i);
    if (match) {
        return { amount: match[1].trim(), name: match[2].trim() };
    }
    return { amount: '', name: str.trim() };
}

function saveImportedRecipe(encodedData) {
    const data = JSON.parse(decodeURIComponent(encodedData));
    
    const newRecipe = {
        id: 'recipe_' + Date.now(),
        name: data.name,
        description: data.description || '',
        ingredients: data.ingredients || [],
        instructions: data.instructions || '',
        servings: data.servings || 4,
        prepTime: data.prepTime || '',
        cookTime: data.cookTime || '',
        source: data.source,
        image: data.image || '',
        createdAt: new Date().toISOString(),
        imported: true
    };
    
    state.recipes.push(newRecipe);
    saveToFirestore('recipes', newRecipe.id, newRecipe);
    
    showToast('Oppskrift importert!', 'success');
    closeGenericModal();
    renderRecipeList();
    renderDashboard();
    checkAchievements();
}
window.saveImportedRecipe = saveImportedRecipe;

// ===== MÅL OG VEKT KALKULATOR (som Matprat men bedre) =====
const measurementData = {
    // Format: ingrediens -> { grPerDl, grPerSs, grPerTs, grPerKopp, stykkvekt }
    ingredients: {
        // Mel og stivelse
        'hvetemel': { grPerDl: 55, grPerSs: 9, grPerTs: 3, grPerKopp: 137.5 },
        'sammalt hvetemel': { grPerDl: 60, grPerSs: 10, grPerTs: 3.3, grPerKopp: 150 },
        'grovt mel': { grPerDl: 60, grPerSs: 10, grPerTs: 3.3, grPerKopp: 150 },
        'havremel': { grPerDl: 45, grPerSs: 7, grPerTs: 2.5, grPerKopp: 112.5 },
        'maisenna': { grPerDl: 60, grPerSs: 10, grPerTs: 3.3, grPerKopp: 150 },
        'potetmel': { grPerDl: 75, grPerSs: 12, grPerTs: 4, grPerKopp: 187.5 },
        'bakepulver': { grPerDl: 90, grPerSs: 15, grPerTs: 5, grPerKopp: 225 },
        'natron': { grPerDl: 100, grPerSs: 17, grPerTs: 5.5, grPerKopp: 250 },
        
        // Sukker
        'sukker': { grPerDl: 90, grPerSs: 13, grPerTs: 4.5, grPerKopp: 225 },
        'melis': { grPerDl: 55, grPerSs: 8, grPerTs: 2.5, grPerKopp: 137.5 },
        'brunt sukker': { grPerDl: 80, grPerSs: 12, grPerTs: 4, grPerKopp: 200 },
        'vaniljesukker': { grPerDl: 85, grPerSs: 13, grPerTs: 4, grPerKopp: 212.5 },
        'honning': { grPerDl: 140, grPerSs: 21, grPerTs: 7, grPerKopp: 350 },
        'sirup': { grPerDl: 140, grPerSs: 21, grPerTs: 7, grPerKopp: 350 },
        
        // Meieriprodukter
        'smør': { grPerDl: 85, grPerSs: 15, grPerTs: 5, grPerKopp: 212.5 },
        'margarin': { grPerDl: 85, grPerSs: 15, grPerTs: 5, grPerKopp: 212.5 },
        'melk': { grPerDl: 100, grPerSs: 15, grPerTs: 5, grPerKopp: 250 },
        'fløte': { grPerDl: 100, grPerSs: 15, grPerTs: 5, grPerKopp: 250 },
        'rømme': { grPerDl: 100, grPerSs: 15, grPerTs: 5, grPerKopp: 250 },
        'kremost': { grPerDl: 115, grPerSs: 17, grPerTs: 6, grPerKopp: 287.5 },
        'cottage cheese': { grPerDl: 110, grPerSs: 16, grPerTs: 5.5, grPerKopp: 275 },
        'yoghurt': { grPerDl: 105, grPerSs: 16, grPerTs: 5, grPerKopp: 262.5 },
        'parmesan revet': { grPerDl: 50, grPerSs: 8, grPerTs: 2.5, grPerKopp: 125 },
        'ost revet': { grPerDl: 45, grPerSs: 7, grPerTs: 2.3, grPerKopp: 112.5 },
        
        // Fett og olje
        'olje': { grPerDl: 90, grPerSs: 14, grPerTs: 4.5, grPerKopp: 225 },
        'olivenolje': { grPerDl: 90, grPerSs: 14, grPerTs: 4.5, grPerKopp: 225 },
        
        // Væsker
        'vann': { grPerDl: 100, grPerSs: 15, grPerTs: 5, grPerKopp: 250 },
        
        // Nøtter og frø
        'mandler': { grPerDl: 70, grPerSs: 11, grPerTs: 3.5, grPerKopp: 175 },
        'hasselnøtter': { grPerDl: 65, grPerSs: 10, grPerTs: 3.3, grPerKopp: 162.5 },
        'valnøtter': { grPerDl: 50, grPerSs: 8, grPerTs: 2.5, grPerKopp: 125 },
        'pinjekjerner': { grPerDl: 70, grPerSs: 11, grPerTs: 3.5, grPerKopp: 175 },
        'sesamfrø': { grPerDl: 65, grPerSs: 10, grPerTs: 3.3, grPerKopp: 162.5 },
        'solsikkefrø': { grPerDl: 60, grPerSs: 9, grPerTs: 3, grPerKopp: 150 },
        'chiafrø': { grPerDl: 80, grPerSs: 12, grPerTs: 4, grPerKopp: 200 },
        'linfrø': { grPerDl: 85, grPerSs: 13, grPerTs: 4.3, grPerKopp: 212.5 },
        
        // Frokostblanding
        'havregryn': { grPerDl: 40, grPerSs: 6, grPerTs: 2, grPerKopp: 100 },
        'lettkokte havregryn': { grPerDl: 40, grPerSs: 6, grPerTs: 2, grPerKopp: 100 },
        'cornflakes': { grPerDl: 15, grPerSs: 2.5, grPerTs: 0.8, grPerKopp: 37.5 },
        'müsli': { grPerDl: 45, grPerSs: 7, grPerTs: 2.3, grPerKopp: 112.5 },
        
        // Ris og pasta
        'ris': { grPerDl: 90, grPerSs: 14, grPerTs: 4.5, grPerKopp: 225 },
        'risotto-ris': { grPerDl: 95, grPerSs: 14, grPerTs: 4.7, grPerKopp: 237.5 },
        'couscous': { grPerDl: 90, grPerSs: 14, grPerTs: 4.5, grPerKopp: 225 },
        'bulgur': { grPerDl: 85, grPerSs: 13, grPerTs: 4.3, grPerKopp: 212.5 },
        'quinoa': { grPerDl: 85, grPerSs: 13, grPerTs: 4.3, grPerKopp: 212.5 },
        
        // Kakao og sjokolade
        'kakao': { grPerDl: 45, grPerSs: 7, grPerTs: 2.3, grPerKopp: 112.5 },
        'sjokoladebiter': { grPerDl: 85, grPerSs: 13, grPerTs: 4.3, grPerKopp: 212.5 },
        
        // Krydder
        'salt': { grPerDl: 120, grPerSs: 18, grPerTs: 6, grPerKopp: 300 },
        'pepper': { grPerDl: 50, grPerSs: 8, grPerTs: 2.5, grPerKopp: 125 },
        'kanel': { grPerDl: 55, grPerSs: 8, grPerTs: 2.8, grPerKopp: 137.5 },
        'ingefær malt': { grPerDl: 50, grPerSs: 8, grPerTs: 2.5, grPerKopp: 125 },
        'muskatnøtt': { grPerDl: 55, grPerSs: 8, grPerTs: 2.8, grPerKopp: 137.5 },
        'kardemomme': { grPerDl: 50, grPerSs: 8, grPerTs: 2.5, grPerKopp: 125 },
        
        // Hermetikk/annet
        'rosiner': { grPerDl: 70, grPerSs: 11, grPerTs: 3.5, grPerKopp: 175 },
        'tørkede aprikoser': { grPerDl: 65, grPerSs: 10, grPerTs: 3.3, grPerKopp: 162.5 },
        'kokos revet': { grPerDl: 35, grPerSs: 5, grPerTs: 1.8, grPerKopp: 87.5 },
        'peanøttsmør': { grPerDl: 130, grPerSs: 20, grPerTs: 6.5, grPerKopp: 325 },
        'syltetøy': { grPerDl: 130, grPerSs: 20, grPerTs: 6.5, grPerKopp: 325 },
        
        // Kaffe
        'kaffe malt': { grPerDl: 35, grPerSs: 6, grPerTs: 2, grPerKopp: 87.5 }
    },
    
    // Stykkvekt for frukt og grønnsaker
    produce: {
        'eple': { avgWeight: 150, unit: 'stk' },
        'banan': { avgWeight: 120, unit: 'stk' },
        'appelsin': { avgWeight: 200, unit: 'stk' },
        'sitron': { avgWeight: 80, unit: 'stk' },
        'lime': { avgWeight: 50, unit: 'stk' },
        'avokado': { avgWeight: 200, unit: 'stk' },
        'tomat': { avgWeight: 120, unit: 'stk' },
        'agurk': { avgWeight: 335, unit: 'stk' },
        'paprika': { avgWeight: 180, unit: 'stk' },
        'løk': { avgWeight: 150, unit: 'stk' },
        'hvitløkfedd': { avgWeight: 5, unit: 'fedd' },
        'gulrot': { avgWeight: 80, unit: 'stk' },
        'potet': { avgWeight: 150, unit: 'stk' },
        'brokkoli': { avgWeight: 400, unit: 'hode' },
        'blomkål': { avgWeight: 600, unit: 'hode' },
        'squash': { avgWeight: 300, unit: 'stk' },
        'aubergine': { avgWeight: 350, unit: 'stk' },
        'egg': { avgWeight: 60, unit: 'stk' }
    }
};

function openMeasurementCalculator() {
    const ingredientOptions = Object.keys(measurementData.ingredients)
        .map(i => `<option value="${i}">${i.charAt(0).toUpperCase() + i.slice(1)}</option>`)
        .join('');
    
    const produceOptions = Object.keys(measurementData.produce)
        .map(i => `<option value="${i}">${i.charAt(0).toUpperCase() + i.slice(1)}</option>`)
        .join('');
    
    const html = `
        <div class="measurement-calculator">
            <div class="calc-header">
                <span class="calc-header-icon">📐</span>
                <h3>Mål & Vekt Kalkulator</h3>
                <p>Konverter enkelt mellom ulike måleenheter</p>
            </div>
            
            <div class="calc-tabs">
                <button class="calc-tab active" onclick="switchCalcTab('convert')">🔄 Regn om</button>
                <button class="calc-tab" onclick="switchCalcTab('weight')">⚖️ Frukt & grønt</button>
                <button class="calc-tab" onclick="switchCalcTab('tools')">📐 Verktøy</button>
            </div>
            
            <div id="calcTabContent">
                <div id="convertTab" class="calc-content active">
                    <div class="calc-section-title">🥄 Ingrediens-kalkulator</div>
                    <p class="calc-section-desc">Velg ingrediens og skriv inn mengde i ett felt - resten beregnes automatisk</p>
                    
                    <div class="calc-row">
                        <select id="calcIngredient" onchange="updateCalculation()">
                            <option value="">📋 Velg ingrediens...</option>
                            ${ingredientOptions}
                        </select>
                    </div>
                    
                    <div class="calc-input-grid">
                        <div class="calc-input-item">
                            <label>GRAM</label>
                            <input type="number" id="calcGram" placeholder="0" oninput="calcFromGram()">
                        </div>
                        <div class="calc-input-item">
                            <label>DESILITER</label>
                            <input type="number" id="calcDl" placeholder="0" step="0.1" oninput="calcFromDl()">
                        </div>
                        <div class="calc-input-item">
                            <label>SPISESKJE</label>
                            <input type="number" id="calcSs" placeholder="0" step="0.5" oninput="calcFromSs()">
                        </div>
                        <div class="calc-input-item">
                            <label>TESKJE</label>
                            <input type="number" id="calcTs" placeholder="0" step="0.5" oninput="calcFromTs()">
                        </div>
                        <div class="calc-input-item">
                            <label>KOPP (2.5 DL)</label>
                            <input type="number" id="calcKopp" placeholder="0" step="0.25" oninput="calcFromKopp()">
                        </div>
                        <div class="calc-input-item">
                            <label>US CUP</label>
                            <input type="number" id="calcCup" placeholder="0" step="0.25" oninput="calcFromCup()">
                        </div>
                    </div>
                </div>
                
                <div id="weightTab" class="calc-content">
                    <div class="calc-section-title">🥕 Vekt til mengde</div>
                    <p class="calc-section-desc">Finn ut hvor mange stykker du trenger basert på vekt</p>
                    
                    <div class="calc-row">
                        <select id="produceSelect" onchange="updateProduceCalc()">
                            <option value="">📋 Velg råvare...</option>
                            ${produceOptions}
                        </select>
                    </div>
                    
                    <div class="produce-calc-row">
                        <div class="produce-input">
                            <label>GRAM</label>
                            <input type="number" id="produceGram" placeholder="500" oninput="calcProduceFromGram()">
                        </div>
                        <span class="calc-equals">→</span>
                        <div class="produce-result">
                            <span id="produceAmount">0</span>
                            <span id="produceUnit">stk</span>
                        </div>
                    </div>
                    
                    <div id="produceInfo" class="produce-info">
                        <p class="produce-avg">Velg en råvare for å se gjennomsnittsvekt</p>
                    </div>
                </div>
                
                <div id="toolsTab" class="calc-content">
                    <div class="calc-section-title">🔧 Konverteringsverktøy</div>
                    <p class="calc-section-desc">Konverter mellom vekt, volum og temperatur</p>
                    
                    <div class="tool-section">
                        <h5>⚖️ Vekt-konvertering</h5>
                        <div class="tool-row">
                            <input type="number" id="toolGram" placeholder="1000" value="1000" oninput="convertWeight()">
                            <span>g =</span>
                            <input type="number" id="toolHg" readonly>
                            <span>hg =</span>
                            <input type="number" id="toolKg" readonly>
                            <span>kg</span>
                        </div>
                    </div>
                    
                    <div class="tool-section">
                        <h5>🥛 Volum-konvertering</h5>
                        <div class="tool-row">
                            <input type="number" id="toolMl" placeholder="1000" value="1000" oninput="convertVolume()">
                            <span>ml =</span>
                            <input type="number" id="toolDl" readonly>
                            <span>dl =</span>
                            <input type="number" id="toolL" readonly>
                            <span>l</span>
                        </div>
                    </div>
                    
                    <div class="tool-section">
                        <h5>🌡️ Temperatur-konvertering</h5>
                        <div class="tool-row">
                            <input type="number" id="toolCelsius" placeholder="180" value="180" oninput="convertTemp()">
                            <span>°C =</span>
                            <input type="number" id="toolFahrenheit" readonly>
                            <span>°F</span>
                        </div>
                        <div class="temp-presets">
                            <button onclick="setTemp(150)">150°C</button>
                            <button onclick="setTemp(175)">175°C</button>
                            <button onclick="setTemp(180)">180°C</button>
                            <button onclick="setTemp(200)">200°C</button>
                            <button onclick="setTemp(220)">220°C</button>
                            <button onclick="setTemp(250)">250°C</button>
                        </div>
                    </div>
                    
                    <div class="quick-reference">
                        <h5>📝 Hurtigreferanse</h5>
                        <div class="ref-grid">
                            <div class="ref-item">
                                <span class="ref-icon">🥄</span>
                                <div class="ref-text">
                                    <strong>1 ss</strong>
                                    <span>= 15 ml</span>
                                </div>
                            </div>
                            <div class="ref-item">
                                <span class="ref-icon">🥄</span>
                                <div class="ref-text">
                                    <strong>1 ts</strong>
                                    <span>= 5 ml</span>
                                </div>
                            </div>
                            <div class="ref-item">
                                <span class="ref-icon">☕</span>
                                <div class="ref-text">
                                    <strong>1 kopp</strong>
                                    <span>= 2.5 dl</span>
                                </div>
                            </div>
                            <div class="ref-item">
                                <span class="ref-icon">🇺🇸</span>
                                <div class="ref-text">
                                    <strong>1 US cup</strong>
                                    <span>= 2.37 dl</span>
                                </div>
                            </div>
                            <div class="ref-item">
                                <span class="ref-icon">⚖️</span>
                                <div class="ref-text">
                                    <strong>1 oz</strong>
                                    <span>= 28.35 g</span>
                                </div>
                            </div>
                            <div class="ref-item">
                                <span class="ref-icon">⚖️</span>
                                <div class="ref-text">
                                    <strong>1 lb</strong>
                                    <span>= 453.6 g</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    showModal('📐 Mål og vekt-kalkulator', html, []);
    
    // Initialize tool values
    setTimeout(() => {
        convertWeight();
        convertVolume();
        convertTemp();
    }, 100);
}
window.openMeasurementCalculator = openMeasurementCalculator;

function switchCalcTab(tabId) {
    document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.calc-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`.calc-tab[onclick*="${tabId}"]`).classList.add('active');
    document.getElementById(tabId + 'Tab')?.classList.add('active');
}
window.switchCalcTab = switchCalcTab;

function updateCalculation() {
    // Reset all fields
    ['calcGram', 'calcDl', 'calcSs', 'calcTs', 'calcKopp', 'calcCup'].forEach(id => {
        const el = $(id);
        if (el) el.value = '';
    });
}

function getSelectedIngredient() {
    const select = $('calcIngredient');
    const ingredientName = select?.value;
    if (!ingredientName) return null;
    return measurementData.ingredients[ingredientName];
}

function calcFromGram() {
    const ing = getSelectedIngredient();
    if (!ing) return;
    const gram = parseFloat($('calcGram')?.value) || 0;
    
    $('calcDl').value = (gram / ing.grPerDl).toFixed(2);
    $('calcSs').value = (gram / ing.grPerSs).toFixed(1);
    $('calcTs').value = (gram / ing.grPerTs).toFixed(1);
    $('calcKopp').value = (gram / ing.grPerKopp).toFixed(2);
    $('calcCup').value = (gram / (ing.grPerKopp * 0.948)).toFixed(2); // US cup is ~237ml vs 250ml
}
window.calcFromGram = calcFromGram;

function calcFromDl() {
    const ing = getSelectedIngredient();
    if (!ing) return;
    const dl = parseFloat($('calcDl')?.value) || 0;
    const gram = dl * ing.grPerDl;
    
    $('calcGram').value = Math.round(gram);
    $('calcSs').value = (gram / ing.grPerSs).toFixed(1);
    $('calcTs').value = (gram / ing.grPerTs).toFixed(1);
    $('calcKopp').value = (gram / ing.grPerKopp).toFixed(2);
    $('calcCup').value = (gram / (ing.grPerKopp * 0.948)).toFixed(2);
}
window.calcFromDl = calcFromDl;

function calcFromSs() {
    const ing = getSelectedIngredient();
    if (!ing) return;
    const ss = parseFloat($('calcSs')?.value) || 0;
    const gram = ss * ing.grPerSs;
    
    $('calcGram').value = Math.round(gram);
    $('calcDl').value = (gram / ing.grPerDl).toFixed(2);
    $('calcTs').value = (gram / ing.grPerTs).toFixed(1);
    $('calcKopp').value = (gram / ing.grPerKopp).toFixed(2);
    $('calcCup').value = (gram / (ing.grPerKopp * 0.948)).toFixed(2);
}
window.calcFromSs = calcFromSs;

function calcFromTs() {
    const ing = getSelectedIngredient();
    if (!ing) return;
    const ts = parseFloat($('calcTs')?.value) || 0;
    const gram = ts * ing.grPerTs;
    
    $('calcGram').value = Math.round(gram);
    $('calcDl').value = (gram / ing.grPerDl).toFixed(2);
    $('calcSs').value = (gram / ing.grPerSs).toFixed(1);
    $('calcKopp').value = (gram / ing.grPerKopp).toFixed(2);
    $('calcCup').value = (gram / (ing.grPerKopp * 0.948)).toFixed(2);
}
window.calcFromTs = calcFromTs;

function calcFromKopp() {
    const ing = getSelectedIngredient();
    if (!ing) return;
    const kopp = parseFloat($('calcKopp')?.value) || 0;
    const gram = kopp * ing.grPerKopp;
    
    $('calcGram').value = Math.round(gram);
    $('calcDl').value = (gram / ing.grPerDl).toFixed(2);
    $('calcSs').value = (gram / ing.grPerSs).toFixed(1);
    $('calcTs').value = (gram / ing.grPerTs).toFixed(1);
    $('calcCup').value = (gram / (ing.grPerKopp * 0.948)).toFixed(2);
}
window.calcFromKopp = calcFromKopp;

function calcFromCup() {
    const ing = getSelectedIngredient();
    if (!ing) return;
    const cup = parseFloat($('calcCup')?.value) || 0;
    const gram = cup * ing.grPerKopp * 0.948;
    
    $('calcGram').value = Math.round(gram);
    $('calcDl').value = (gram / ing.grPerDl).toFixed(2);
    $('calcSs').value = (gram / ing.grPerSs).toFixed(1);
    $('calcTs').value = (gram / ing.grPerTs).toFixed(1);
    $('calcKopp').value = (gram / ing.grPerKopp).toFixed(2);
}
window.calcFromCup = calcFromCup;

function calcProduceFromGram() {
    const select = $('produceSelect');
    const produceName = select?.value;
    if (!produceName) return;
    
    const produce = measurementData.produce[produceName];
    const gram = parseFloat($('produceGram')?.value) || 0;
    
    const amount = gram / produce.avgWeight;
    $('produceAmount').textContent = amount.toFixed(1);
    $('produceUnit').textContent = produce.unit;
    
    $('produceInfo').innerHTML = `
        <p class="produce-avg">💡 Gjennomsnittlig vekt: ${produce.avgWeight}g per ${produce.unit}</p>
    `;
}
window.calcProduceFromGram = calcProduceFromGram;

function updateProduceCalc() {
    const select = $('produceSelect');
    const produceName = select?.value;
    if (!produceName) {
        $('produceInfo').innerHTML = '';
        return;
    }
    
    const produce = measurementData.produce[produceName];
    $('produceUnit').textContent = produce.unit;
    $('produceInfo').innerHTML = `
        <p class="produce-avg">💡 1 ${produce.unit} ${produceName} veier ca. ${produce.avgWeight}g</p>
    `;
    
    calcProduceFromGram();
}
window.updateProduceCalc = updateProduceCalc;

function convertWeight() {
    const gram = parseFloat($('toolGram')?.value) || 0;
    $('toolHg').value = (gram / 100).toFixed(1);
    $('toolKg').value = (gram / 1000).toFixed(3);
}
window.convertWeight = convertWeight;

function convertVolume() {
    const ml = parseFloat($('toolMl')?.value) || 0;
    $('toolDl').value = (ml / 100).toFixed(1);
    $('toolL').value = (ml / 1000).toFixed(3);
}
window.convertVolume = convertVolume;

function convertTemp() {
    const celsius = parseFloat($('toolCelsius')?.value) || 0;
    $('toolFahrenheit').value = Math.round(celsius * 9/5 + 32);
}
window.convertTemp = convertTemp;

function setTemp(temp) {
    $('toolCelsius').value = temp;
    convertTemp();
}
window.setTemp = setTemp;

// ===== AI MEAL PLANNER =====
const aiMealPreferences = {
    dietary: ['vanlig', 'vegetar', 'vegan', 'pescetarianer', 'lavkarbo', 'keto', 'glutenfri', 'laktosefri'],
    goals: ['balansert', 'høy-protein', 'lav-karbo', 'lav-fett', 'høy-fiber', 'lite-ultraprosessert'],
    budgets: ['budsjett', 'moderat', 'premium'],
    cooking: ['rask (<30 min)', 'middels (30-60 min)', 'tidkrevende (60+ min)', 'miks']
};

function openAiMealPlanner() {
    const dietaryOptions = aiMealPreferences.dietary.map(d => 
        `<option value="${d}">${d.charAt(0).toUpperCase() + d.slice(1)}</option>`
    ).join('');
    
    const goalsOptions = aiMealPreferences.goals.map(g => 
        `<option value="${g}">${g.charAt(0).toUpperCase() + g.slice(1).replace('-', ' ')}</option>`
    ).join('');
    
    const budgetOptions = aiMealPreferences.budgets.map(b => 
        `<option value="${b}">${b.charAt(0).toUpperCase() + b.slice(1)}</option>`
    ).join('');
    
    const cookingOptions = aiMealPreferences.cooking.map(c => 
        `<option value="${c}">${c}</option>`
    ).join('');
    
    const html = `
        <div class="ai-meal-planner">
            <div class="ai-header">
                <span class="ai-icon">🤖✨</span>
                <h3>AI Ukemenyplanlegger</h3>
                <p>La AI'en lage den perfekte ukemenyen for deg!</p>
            </div>
            
            <div class="ai-options">
                <div class="option-section">
                    <label>🥗 Kosthold</label>
                    <select id="aiDietary">
                        ${dietaryOptions}
                    </select>
                </div>
                
                <div class="option-section">
                    <label>🎯 Mål</label>
                    <select id="aiGoal">
                        ${goalsOptions}
                    </select>
                </div>
                
                <div class="option-section">
                    <label>💰 Budsjett</label>
                    <select id="aiBudget">
                        ${budgetOptions}
                    </select>
                </div>
                
                <div class="option-section">
                    <label>⏱️ Koketid</label>
                    <select id="aiCookTime">
                        ${cookingOptions}
                    </select>
                </div>
                
                <div class="option-section">
                    <label>👥 Antall personer</label>
                    <input type="number" id="aiPersons" min="1" max="12" value="${state.settings?.householdSize || 2}">
                </div>
                
                <div class="option-section">
                    <label>📅 Antall dager</label>
                    <select id="aiDays">
                        <option value="5">5 dager (arbeidsuke)</option>
                        <option value="7" selected>7 dager (hel uke)</option>
                        <option value="14">14 dager (to uker)</option>
                    </select>
                </div>
                
                <div class="option-section full-width">
                    <label>✨ Ekstra ønsker (valgfritt)</label>
                    <textarea id="aiCustom" placeholder="F.eks: 'Inkluder taco på fredag', 'Unngå svinekjøtt', 'Mer asiatisk mat'..."></textarea>
                </div>
                
                <div class="ai-checkboxes">
                    <label class="ai-checkbox">
                        <input type="checkbox" id="aiUseFavorites" checked>
                        <span>Bruk mine favoritter</span>
                    </label>
                    <label class="ai-checkbox">
                        <input type="checkbox" id="aiUseHistory" checked>
                        <span>Lær av kokehistorikk</span>
                    </label>
                    <label class="ai-checkbox">
                        <input type="checkbox" id="aiAvoidRepeat" checked>
                        <span>Unngå gjentakelse</span>
                    </label>
                    <label class="ai-checkbox">
                        <input type="checkbox" id="aiSeasonal">
                        <span>Sesongbaserte råvarer</span>
                    </label>
                </div>
            </div>
            
            <div class="ai-actions">
                <button class="btn btn-primary btn-large" onclick="generateAiMealPlan()">
                    <span class="btn-icon">🤖</span>
                    Generer ukesmeny
                </button>
                <button class="btn btn-secondary" onclick="generateAiMealPlan(true)">
                    <span class="btn-icon">🎲</span>
                    Overrask meg!
                </button>
            </div>
            
            <div id="aiMealPlanResult"></div>
        </div>
    `;
    
    showModal('🤖 AI Ukemenyplanlegger', html, []);
}
window.openAiMealPlanner = openAiMealPlanner;

function generateAiMealPlan(surprise = false) {
    const dietary = $('aiDietary')?.value || 'vanlig';
    const goal = $('aiGoal')?.value || 'balansert';
    const budget = $('aiBudget')?.value || 'moderat';
    const cookTime = $('aiCookTime')?.value || 'miks';
    const persons = parseInt($('aiPersons')?.value) || 2;
    const days = parseInt($('aiDays')?.value) || 7;
    const customWishes = $('aiCustom')?.value || '';
    const useFavorites = $('aiUseFavorites')?.checked;
    const useHistory = $('aiUseHistory')?.checked;
    const avoidRepeat = $('aiAvoidRepeat')?.checked;
    const seasonal = $('aiSeasonal')?.checked;
    
    // Show loading
    $('aiMealPlanResult').innerHTML = `
        <div class="ai-loading">
            <div class="ai-thinking">
                <span class="thinking-dot"></span>
                <span class="thinking-dot"></span>
                <span class="thinking-dot"></span>
            </div>
            <p>AI tenker på den perfekte ukemenyen for deg...</p>
        </div>
    `;
    
    // Simulate AI processing
    setTimeout(() => {
        const plan = createSmartMealPlan({
            dietary, goal, budget, cookTime, persons, days,
            customWishes, useFavorites, useHistory, avoidRepeat, seasonal, surprise
        });
        
        displayAiMealPlan(plan, days, persons);
    }, 1500);
}
window.generateAiMealPlan = generateAiMealPlan;

function createSmartMealPlan(options) {
    const dayNames = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
    const plan = [];
    
    // Get available recipes
    let availableRecipes = [...state.recipes];
    
    // Add external/saved recipes if any
    if (state.savedExternalRecipes) {
        availableRecipes = [...availableRecipes, ...state.savedExternalRecipes];
    }
    
    // If surprise mode, shuffle heavily
    if (options.surprise) {
        availableRecipes = shuffleArray(availableRecipes);
    }
    
    // Prioritize favorites if enabled
    if (options.useFavorites && state.favorites?.length > 0) {
        availableRecipes.sort((a, b) => {
            const aFav = state.favorites.includes(a.id) ? 1 : 0;
            const bFav = state.favorites.includes(b.id) ? 1 : 0;
            return bFav - aFav;
        });
    }
    
    // Filter by dietary
    if (options.dietary !== 'vanlig') {
        availableRecipes = availableRecipes.filter(r => {
            const name = (r.name + ' ' + (r.category || '')).toLowerCase();
            switch (options.dietary) {
                case 'vegetar': return name.includes('vegetar') || !containsMeat(r);
                case 'vegan': return name.includes('vegan') || (!containsMeat(r) && !containsDairy(r));
                case 'pescetarianer': return name.includes('fisk') || name.includes('sjømat') || !containsMeat(r);
                case 'lavkarbo': case 'keto': return !name.includes('pasta') && !name.includes('ris') && !name.includes('brød');
                default: return true;
            }
        });
    }
    
    // Get cooking history to avoid recent meals
    const history = JSON.parse(localStorage.getItem('kokebok_cooking_history') || '[]');
    const recentRecipes = history.slice(0, 14).map(h => h.recipeId);
    
    // Create day plan
    const usedRecipes = new Set();
    
    for (let i = 0; i < options.days; i++) {
        const dayName = dayNames[i % 7];
        let selectedRecipe = null;
        
        // Special day logic
        const isWeekend = dayName === 'Lørdag' || dayName === 'Søndag';
        const isFriday = dayName === 'Fredag';
        
        // Filter candidates
        let candidates = availableRecipes.filter(r => {
            if (options.avoidRepeat && usedRecipes.has(r.id)) return false;
            if (options.avoidRepeat && recentRecipes.includes(r.id)) return false;
            return true;
        });
        
        // Custom wishes parsing
        if (options.customWishes) {
            const wishes = options.customWishes.toLowerCase();
            if (isFriday && wishes.includes('taco')) {
                const tacoRecipe = candidates.find(r => r.name.toLowerCase().includes('taco'));
                if (tacoRecipe) selectedRecipe = tacoRecipe;
            }
        }
        
        // Weekend: suggest more elaborate meals
        if (!selectedRecipe && isWeekend && options.cookTime === 'miks') {
            candidates = candidates.filter(r => 
                (r.prepTime && parseInt(r.prepTime) > 30) || 
                (r.cookTime && parseInt(r.cookTime) > 30) ||
                r.name.toLowerCase().includes('gryterett') ||
                r.name.toLowerCase().includes('stek')
            );
        }
        
        // Budget filtering
        if (options.budget === 'budsjett') {
            candidates = candidates.filter(r => {
                const cost = estimateRecipeCost(r);
                return cost < 100;
            });
        }
        
        // Protein goal - prioritize meat/fish
        if (options.goal === 'høy-protein') {
            candidates.sort((a, b) => {
                const aProtein = containsMeat(a) || (a.name + '').toLowerCase().includes('fisk') ? 1 : 0;
                const bProtein = containsMeat(b) || (b.name + '').toLowerCase().includes('fisk') ? 1 : 0;
                return bProtein - aProtein;
            });
        }
        
        // Select recipe
        if (!selectedRecipe && candidates.length > 0) {
            // Add some randomness
            const topCandidates = candidates.slice(0, Math.min(5, candidates.length));
            selectedRecipe = topCandidates[Math.floor(Math.random() * topCandidates.length)];
        }
        
        // Fallback
        if (!selectedRecipe && availableRecipes.length > 0) {
            selectedRecipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
        }
        
        if (selectedRecipe) {
            usedRecipes.add(selectedRecipe.id);
            plan.push({
                day: dayName,
                recipe: selectedRecipe,
                isWeekend,
                estimatedCost: estimateRecipeCost(selectedRecipe),
                prepTime: selectedRecipe.prepTime || '30 min'
            });
        } else {
            plan.push({
                day: dayName,
                recipe: { name: 'Legg til oppskrift', id: null },
                isWeekend,
                estimatedCost: 0,
                prepTime: '-'
            });
        }
    }
    
    return plan;
}

function containsMeat(recipe) {
    const meatWords = ['kjøtt', 'kylling', 'svin', 'beef', 'biff', 'lam', 'bacon', 'pølse', 'deig', 'ribbe'];
    const text = (recipe.name + ' ' + JSON.stringify(recipe.ingredients || [])).toLowerCase();
    return meatWords.some(w => text.includes(w));
}

function containsDairy(recipe) {
    const dairyWords = ['melk', 'ost', 'fløte', 'smør', 'rømme', 'yoghurt'];
    const text = (recipe.name + ' ' + JSON.stringify(recipe.ingredients || [])).toLowerCase();
    return dairyWords.some(w => text.includes(w));
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function displayAiMealPlan(plan, days, persons) {
    const totalCost = plan.reduce((sum, day) => sum + day.estimatedCost, 0) * (persons / 4);
    
    const planCards = plan.map((day, i) => {
        const isWeekend = day.isWeekend;
        const weekendClass = isWeekend ? 'weekend' : '';
        const weekendBadge = isWeekend ? '<span class="weekend-badge">🌟</span>' : '';
        
        let contentHtml = '';
        let viewBtnHtml = '';
        
        if (day.recipe.id) {
            contentHtml = `
                <span class="ai-recipe-name">${escapeHtml(day.recipe.name)}</span>
                <div class="ai-recipe-meta">
                    <span>⏱️ ${day.prepTime}</span>
                    <span>💰 ~${day.estimatedCost} kr</span>
                </div>
            `;
            viewBtnHtml = `
                <button class="ai-view-btn" onclick="viewRecipe('${day.recipe.id}'); closeGenericModal();">
                    Se oppskrift →
                </button>
            `;
        } else {
            contentHtml = `<span class="ai-no-recipe">Ingen oppskrift</span>`;
        }
        
        return `
            <div class="ai-day-card ${weekendClass}">
                <div class="ai-day-header">
                    <span class="day-name">${day.day}</span>
                    ${weekendBadge}
                </div>
                <div class="ai-day-content">
                    ${contentHtml}
                </div>
                ${viewBtnHtml}
            </div>
        `;
    }).join('');
    
    const resultHtml = `
        <div class="ai-result">
            <div class="ai-result-header">
                <h4>✨ Din personlige ukesmeny</h4>
                <div class="ai-stats">
                    <span class="ai-stat">📅 ${days} dager</span>
                    <span class="ai-stat">👥 ${persons} personer</span>
                    <span class="ai-stat">💰 ca. ${Math.round(totalCost)} kr</span>
                </div>
            </div>
            
            <div class="ai-plan-grid">
                ${planCards}
            </div>
            
            <div class="ai-actions-bottom">
                <button class="btn btn-success" onclick="applyAiPlanToCalendar()">
                    ✅ Legg til i ukesplanen
                </button>
                <button class="btn btn-secondary" onclick="generateAiMealPlan()">
                    🔄 Generer ny
                </button>
                <button class="btn btn-secondary" onclick="copyWeekPlan()">
                    📋 Kopier uke
                </button>
            </div>
        </div>
    `;
    
    $('aiMealPlanResult').innerHTML = resultHtml;
    
    // Store plan for applying later
    window.currentAiPlan = plan;
}

function applyAiPlanToCalendar() {
    if (!window.currentAiPlan) return;
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    
    window.currentAiPlan.forEach((day, i) => {
        if (day.recipe.id) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];
            
            state.mealPlan[dateKey] = {
                name: day.recipe.name,
                recipeId: day.recipe.id,
                ingredients: day.recipe.ingredients || []
            };
        }
    });
    
    saveMealPlan();
    showToast('Ukesmeny lagt til!', 'success');
    closeGenericModal();
}
window.applyAiPlanToCalendar = applyAiPlanToCalendar;

function copyWeekPlan() {
    if (!window.currentAiPlan) return;
    
    // Store as template
    localStorage.setItem('kokebok_week_template', JSON.stringify(window.currentAiPlan));
    showToast('Ukesmeny lagret som mal!', 'success');
}
window.copyWeekPlan = copyWeekPlan;

function pasteWeekPlan() {
    const template = localStorage.getItem('kokebok_week_template');
    if (!template) {
        showToast('Ingen ukesmeny lagret', 'warning');
        return;
    }
    
    window.currentAiPlan = JSON.parse(template);
    applyAiPlanToCalendar();
}
window.pasteWeekPlan = pasteWeekPlan;

// ===== MATKALENDER / COOKING DIARY =====
function openCookingDiary() {
    // Get all cooking history
    const history = JSON.parse(localStorage.getItem('kokebok_cooking_history') || '[]');
    
    // Group by month
    const byMonth = {};
    history.forEach(entry => {
        const date = new Date(entry.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonth[monthKey]) byMonth[monthKey] = [];
        byMonth[monthKey].push(entry);
    });
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const recentMealsHtml = history.slice(0, 10).map(entry => {
        const recipe = state.recipes.find(r => r.id === entry.recipeId);
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' });
        const recipeName = recipe ? escapeHtml(recipe.name) : 'Ukjent oppskrift';
        const viewBtn = recipe ? `<button class="btn-sm" onclick="viewRecipe('${recipe.id}'); closeGenericModal();">Se</button>` : '';
        
        return `
            <div class="recent-meal-item">
                <span class="meal-date">${dateStr}</span>
                <span class="meal-name">${recipeName}</span>
                ${viewBtn}
            </div>
        `;
    }).join('');
    
    const html = `
        <div class="cooking-diary">
            <div class="diary-header">
                <button class="btn-icon" onclick="changeCalendarMonth(-1)">◀</button>
                <h3 id="diaryMonthTitle">${formatMonthYear(currentMonth)}</h3>
                <button class="btn-icon" onclick="changeCalendarMonth(1)">▶</button>
            </div>
            
            <div id="diaryCalendar" class="diary-calendar">
                ${renderDiaryCalendar(currentMonth, history)}
            </div>
            
            <div class="diary-stats">
                <h4>📊 Statistikk</h4>
                <div class="diary-stat-grid">
                    <div class="diary-stat">
                        <span class="stat-value">${history.length}</span>
                        <span class="stat-label">Måltider laget</span>
                    </div>
                    <div class="diary-stat">
                        <span class="stat-value">${new Set(history.map(h => h.recipeId)).size}</span>
                        <span class="stat-label">Unike oppskrifter</span>
                    </div>
                    <div class="diary-stat">
                        <span class="stat-value">${Object.keys(byMonth).length}</span>
                        <span class="stat-label">Måneder med data</span>
                    </div>
                </div>
            </div>
            
            <div class="diary-recent">
                <h4>🕐 Siste måltider</h4>
                <div class="recent-meals-list">
                    ${recentMealsHtml}
                </div>
            </div>
        </div>
    `;
    
    showModal('📅 Matkalender', html, []);
    
    window.currentDiaryMonth = currentMonth;
}
window.openCookingDiary = openCookingDiary;

function renderDiaryCalendar(monthKey, history) {
    const [year, month] = monthKey.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDay = (firstDay.getDay() + 6) % 7; // Monday = 0
    
    const daysInMonth = lastDay.getDate();
    const today = new Date();
    
    // Get meals for this month
    const monthMeals = {};
    history.forEach(entry => {
        const date = new Date(entry.date);
        if (date.getFullYear() === year && date.getMonth() === month - 1) {
            const dayKey = date.getDate();
            if (!monthMeals[dayKey]) monthMeals[dayKey] = [];
            monthMeals[dayKey].push(entry);
        }
    });
    
    let html = '<div class="calendar-header">';
    ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'].forEach(day => {
        html += `<span class="cal-day-name">${day}</span>`;
    });
    html += '</div><div class="calendar-grid">';
    
    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
        html += '<div class="cal-day empty"></div>';
    }
    
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = today.getFullYear() === year && today.getMonth() === month - 1 && today.getDate() === day;
        const meals = monthMeals[day] || [];
        const hasMeals = meals.length > 0;
        
        html += `
            <div class="cal-day ${isToday ? 'today' : ''} ${hasMeals ? 'has-meals' : ''}" 
                 onclick="showDayMeals(${year}, ${month}, ${day})"
                 title="${hasMeals ? meals.length + ' måltid(er)' : 'Ingen måltider'}">
                <span class="day-number">${day}</span>
                ${hasMeals ? `<span class="meal-dot">${meals.length}</span>` : ''}
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

function formatMonthYear(monthKey) {
    const [year, month] = monthKey.split('-');
    const months = ['Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni', 
                    'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'];
    return `${months[parseInt(month) - 1]} ${year}`;
}

function changeCalendarMonth(delta) {
    const [year, month] = window.currentDiaryMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1 + delta, 1);
    window.currentDiaryMonth = newDate.toISOString().slice(0, 7);
    
    const history = JSON.parse(localStorage.getItem('kokebok_cooking_history') || '[]');
    $('diaryMonthTitle').textContent = formatMonthYear(window.currentDiaryMonth);
    $('diaryCalendar').innerHTML = renderDiaryCalendar(window.currentDiaryMonth, history);
}
window.changeCalendarMonth = changeCalendarMonth;

function showDayMeals(year, month, day) {
    const history = JSON.parse(localStorage.getItem('kokebok_cooking_history') || '[]');
    const dayMeals = history.filter(entry => {
        const date = new Date(entry.date);
        return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    });
    
    if (dayMeals.length === 0) {
        showToast('Ingen måltider registrert denne dagen', 'info');
        return;
    }
    
    const dateStr = new Date(year, month - 1, day).toLocaleDateString('no-NO', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    
    const mealsHtml = dayMeals.map(entry => {
        const recipe = state.recipes.find(r => r.id === entry.recipeId);
        const recipeName = recipe ? escapeHtml(recipe.name) : 'Ukjent oppskrift';
        const viewBtn = recipe ? `<button class="btn btn-sm" onclick="viewRecipe('${recipe.id}'); closeGenericModal();">Se oppskrift</button>` : '';
        return `
            <div class="day-meal-card">
                <span class="meal-icon">🍽️</span>
                <span class="meal-name">${recipeName}</span>
                ${viewBtn}
            </div>
        `;
    }).join('');
    
    // Show in a sub-modal or toast
    showModal(`📅 ${dateStr}`, `<div class="day-meals-detail">${mealsHtml}</div>`, []);
}
window.showDayMeals = showDayMeals;

// ===== MARK RECIPE AS COOKED =====
function markAsCooked(recipeId) {
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    // Log to cooking history
    logCookingSession(recipeId);
    
    // Update last cooked date
    recipe.lastCooked = new Date().toISOString();
    recipe.cookCount = (recipe.cookCount || 0) + 1;
    saveToFirestore('recipes', recipeId, recipe);
    
    showToast(`✅ "${recipe.name}" registrert som laget!`, 'success');
    checkAchievements();
}
window.markAsCooked = markAsCooked;

// ===== LEGG TIL EKSISTERENDE OPPSKRIFTER I KOKEBOK =====
function openAddRecipesToBook(bookId = null) {
    const targetBookId = bookId || state.currentBook?.id;
    if (!targetBookId) {
        showToast('Velg en kokebok først', 'warning');
        return;
    }
    
    const book = state.books.find(b => b.id === targetBookId);
    if (!book) return;
    
    const recipesNotInBook = state.recipes.filter(r => r.bookId !== targetBookId);
    
    if (recipesNotInBook.length === 0) {
        showToast('Alle oppskrifter er allerede i denne kokeboken', 'info');
        return;
    }
    
    const recipesHtml = recipesNotInBook.map(r => `
        <div class="add-recipe-item" data-id="${r.id}">
            <div class="recipe-item-thumb">
                ${r.images?.[0] ? `<img src="${r.images[0]}" alt="">` : '<span>🍽️</span>'}
            </div>
            <div class="recipe-item-info">
                <strong>${escapeHtml(r.name)}</strong>
                <span>${getCategoryName(r.category)}</span>
            </div>
            <button class="btn btn-sm btn-success add-to-book-btn">➕ Legg til</button>
        </div>
    `).join('');
    
    const html = `
        <div class="add-recipes-to-book">
            <p>Velg oppskrifter å legge til i <strong>${escapeHtml(book.name)}</strong>:</p>
            
            <div class="search-container">
                <input type="text" id="addRecipeSearch" placeholder="🔍 Søk i oppskrifter..." class="search-input">
            </div>
            
            <div class="add-recipes-list" id="addRecipesList">
                ${recipesHtml}
            </div>
        </div>
    `;
    
    showModal(`📚 Legg til i ${escapeHtml(book.name)}`, html, []);
    
    // Setup handlers
    setTimeout(() => {
        // Search
        const searchInput = $('addRecipeSearch');
        if (searchInput) {
            searchInput.oninput = () => {
                const query = searchInput.value.toLowerCase();
                document.querySelectorAll('.add-recipe-item').forEach(item => {
                    const name = item.querySelector('strong')?.textContent.toLowerCase() || '';
                    item.style.display = name.includes(query) ? '' : 'none';
                });
            };
        }
        
        // Add buttons
        document.querySelectorAll('.add-to-book-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const item = btn.closest('.add-recipe-item');
                const recipeId = item.dataset.id;
                addRecipeToBook(recipeId, targetBookId);
                item.remove();
            };
        });
    }, 100);
}
window.openAddRecipesToBook = openAddRecipesToBook;

function addRecipeToBook(recipeId, bookId) {
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    recipe.bookId = bookId;
    saveToFirestore('recipes', recipeId, recipe);
    
    showToast(`"${recipe.name}" lagt til i kokeboken!`, 'success');
}
window.addRecipeToBook = addRecipeToBook;

// ===== HANDLEMODUS - ENKEL BUTIKKMODUS =====
function openShoppingMode() {
    const shoppingList = state.shoppingList || [];
    
    if (shoppingList.length === 0) {
        showToast('Handlelisten er tom! Legg til varer først.', 'warning');
        return;
    }
    
    // Group by category/department
    const departments = {
        'frukt_gront': { name: '🥬 Frukt & Grønt', items: [] },
        'meieri': { name: '🥛 Meieri', items: [] },
        'kjott': { name: '🥩 Kjøtt & Fisk', items: [] },
        'bakeri': { name: '🍞 Bakeri', items: [] },
        'fryser': { name: '❄️ Frysevarer', items: [] },
        'torvarer': { name: '🏪 Tørrvarer', items: [] },
        'hermetikk': { name: '🥫 Hermetikk', items: [] },
        'drikke': { name: '🥤 Drikke', items: [] },
        'annet': { name: '📦 Annet', items: [] }
    };
    
    // Categorize items
    shoppingList.forEach(item => {
        const dept = categorizeShoppingItem(item.name || item);
        if (departments[dept]) {
            departments[dept].items.push(item);
        } else {
            departments.annet.items.push(item);
        }
    });
    
    const deptHtml = Object.entries(departments)
        .filter(([_, dept]) => dept.items.length > 0)
        .map(([key, dept]) => {
            const itemsHtml = dept.items.map((item, idx) => {
                const itemName = item.name || item;
                const itemAmount = item.amount || '';
                return `
                    <div class="shopping-item" data-item="${escapeHtml(itemName)}">
                        <button class="check-btn" onclick="toggleShoppingItem(this)">
                            <span class="check-icon">○</span>
                        </button>
                        <span class="item-name">${escapeHtml(itemName)}</span>
                        ${itemAmount ? `<span class="item-amount">${escapeHtml(itemAmount)}</span>` : ''}
                    </div>
                `;
            }).join('');
            
            return `
                <div class="shopping-dept">
                    <div class="dept-header">${dept.name}</div>
                    <div class="dept-items">${itemsHtml}</div>
                </div>
            `;
        }).join('');
    
    const html = `
        <div class="shopping-mode">
            <div class="shopping-mode-header">
                <span class="shopping-icon">🛒</span>
                <h3>Handlemodus</h3>
                <p>Trykk på varer for å krysse av!</p>
            </div>
            
            <div class="shopping-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="shoppingProgress" style="width: 0%"></div>
                </div>
                <span id="shoppingCount">0 / ${shoppingList.length} varer</span>
            </div>
            
            <div class="shopping-departments">
                ${deptHtml}
            </div>
            
            <div class="shopping-mode-actions">
                <button class="btn btn-secondary" onclick="uncheckAllItems()">
                    🔄 Nullstill
                </button>
                <button class="btn btn-success" onclick="finishShopping()">
                    ✅ Ferdig!
                </button>
            </div>
        </div>
    `;
    
    showModal('🛒 Handlemodus', html, []);
}
window.openShoppingMode = openShoppingMode;

function categorizeShoppingItem(itemName) {
    // Ensure itemName is a string
    if (!itemName || typeof itemName !== 'string') {
        return 'annet';
    }
    const name = itemName.toLowerCase();
    
    // Frukt & Grønt
    if (/eple|banan|appelsin|sitron|tomat|agurk|paprika|løk|gulrot|brokkoli|salat|potet|avokado|mango|frukt|grønn/i.test(name)) {
        return 'frukt_gront';
    }
    // Meieri
    if (/melk|ost|fløte|smør|yoghurt|rømme|egg|kesam|skyr/i.test(name)) {
        return 'meieri';
    }
    // Kjøtt & Fisk
    if (/kjøtt|kylling|svin|biff|laks|fisk|torsk|bacon|pølse|kjøttdeig|ribbe|skinke/i.test(name)) {
        return 'kjott';
    }
    // Bakeri
    if (/brød|rundstykke|bolle|croissant|kake|baguette|lompe|lefse/i.test(name)) {
        return 'bakeri';
    }
    // Fryser
    if (/fross|frys|is |iskrem|pizza|ferdig|pommes/i.test(name)) {
        return 'fryser';
    }
    // Tørrvarer
    if (/mel|sukker|ris|pasta|havre|müsli|kaffe|te|kakao|krydder|salt|pepper/i.test(name)) {
        return 'torvarer';
    }
    // Hermetikk
    if (/boks|hermetisk|tomat.*boks|bønner|mais|tun/i.test(name)) {
        return 'hermetikk';
    }
    // Drikke
    if (/juice|brus|vann|øl|vin|drikke|cola|fanta|sprite/i.test(name)) {
        return 'drikke';
    }
    
    return 'annet';
}

function toggleShoppingItem(btn) {
    const item = btn.closest('.shopping-item');
    item.classList.toggle('checked');
    btn.querySelector('.check-icon').textContent = item.classList.contains('checked') ? '✓' : '○';
    
    updateShoppingProgress();
}
window.toggleShoppingItem = toggleShoppingItem;

function updateShoppingProgress() {
    const total = document.querySelectorAll('.shopping-item').length;
    const checked = document.querySelectorAll('.shopping-item.checked').length;
    const percent = Math.round((checked / total) * 100);
    
    const progressBar = $('shoppingProgress');
    const countEl = $('shoppingCount');
    
    if (progressBar) progressBar.style.width = percent + '%';
    if (countEl) countEl.textContent = `${checked} / ${total} varer`;
    
    // Celebration when done
    if (checked === total && total > 0) {
        showToast('🎉 Alle varer krysset av! Bra jobba!', 'success');
    }
}

function uncheckAllItems() {
    document.querySelectorAll('.shopping-item').forEach(item => {
        item.classList.remove('checked');
        item.querySelector('.check-icon').textContent = '○';
    });
    updateShoppingProgress();
}
window.uncheckAllItems = uncheckAllItems;

function finishShopping() {
    const checked = document.querySelectorAll('.shopping-item.checked').length;
    const total = document.querySelectorAll('.shopping-item').length;
    
    if (checked < total) {
        if (!confirm(`Du har ${total - checked} varer igjen. Vil du avslutte likevel?`)) {
            return;
        }
    }
    
    // Remove checked items from shopping list
    const checkedItems = Array.from(document.querySelectorAll('.shopping-item.checked'))
        .map(el => el.dataset.item);
    
    state.shoppingList = state.shoppingList.filter(item => 
        !checkedItems.includes(item.name || item)
    );
    
    saveShoppingList();
    closeGenericModal();
    showToast('🛒 Handletur fullført! Resterende varer er lagret.', 'success');
}
window.finishShopping = finishShopping;

// ===== OPPSKRIFT TIL NÆRBUTIKK - FINN NÆRMESTE BUTIKK =====
function findNearestStores() {
    if (!navigator.geolocation) {
        showToast('Geolokasjon støttes ikke i denne nettleseren', 'error');
        return;
    }
    
    showToast('📍 Finner din posisjon...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const mapsUrl = `https://www.google.com/maps/search/dagligvare+matbutikk/@${latitude},${longitude},15z`;
            window.open(mapsUrl, '_blank');
        },
        error => {
            showToast('Kunne ikke finne posisjonen din', 'error');
        }
    );
}
window.findNearestStores = findNearestStores;

// ===== VOICE SHOPPING - LES HANDLELISTE HØYT =====
function readShoppingListAloud() {
    if (!('speechSynthesis' in window)) {
        showToast('Talesyntese støttes ikke i denne nettleseren', 'error');
        return;
    }
    
    const list = state.shoppingList || [];
    if (list.length === 0) {
        showToast('Handlelisten er tom', 'warning');
        return;
    }
    
    const itemNames = list.map(item => item.name || item).join(', ');
    const text = `Du trenger: ${itemNames}`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'nb-NO';
    utterance.rate = 0.9;
    
    speechSynthesis.speak(utterance);
    showToast('🔊 Leser handleliste...', 'info');
}
window.readShoppingListAloud = readShoppingListAloud;

// ===== SMART LEFTOVER SUGGESTER =====
function openLeftoverSuggester() {
    const html = `
        <div class="leftover-suggester">
            <div class="suggester-header">
                <span class="suggester-icon">🥡</span>
                <h3>Rester-hjelper</h3>
                <p>Skriv inn hva du har igjen i kjøleskapet!</p>
            </div>
            
            <textarea id="leftoverInput" class="leftover-input" placeholder="F.eks:
- Litt kokt pasta
- Halv pakke bacon
- 2 egg
- Litt fløte
- Parmesan"></textarea>
            
            <button class="btn btn-primary btn-large" onclick="suggestLeftoverRecipes()">
                ✨ Finn oppskrifter
            </button>
            
            <div id="leftoverResults"></div>
        </div>
    `;
    
    showModal('🥡 Hva kan du lage av restene?', html, []);
}
window.openLeftoverSuggester = openLeftoverSuggester;

function suggestLeftoverRecipes() {
    const input = $('leftoverInput')?.value || '';
    const leftovers = input.split('\n')
        .map(l => l.replace(/^[\-\*\•]\s*/, '').trim().toLowerCase())
        .filter(l => l.length > 2);
    
    if (leftovers.length === 0) {
        showToast('Skriv inn noen rester først', 'warning');
        return;
    }
    
    // Search in recipes
    const matches = state.recipes.filter(recipe => {
        const recipeText = (recipe.name + ' ' + JSON.stringify(recipe.ingredients || [])).toLowerCase();
        return leftovers.some(leftover => recipeText.includes(leftover));
    });
    
    // Also suggest classic leftover recipes
    const suggestions = [
        { name: 'Pasta Carbonara', leftovers: ['pasta', 'bacon', 'egg', 'fløte', 'parmesan'] },
        { name: 'Omelett', leftovers: ['egg', 'ost', 'skinke', 'grønnsaker'] },
        { name: 'Stekt ris', leftovers: ['ris', 'grønnsaker', 'egg', 'soyasaus'] },
        { name: 'Suppe', leftovers: ['grønnsaker', 'kjøtt', 'buljong', 'pasta'] },
        { name: 'Grateng', leftovers: ['pasta', 'ost', 'fløte', 'kjøtt'] },
        { name: 'Wrap/Burrito', leftovers: ['kjøtt', 'grønnsaker', 'ris', 'bønner', 'ost'] },
        { name: 'Salat', leftovers: ['grønnsaker', 'kylling', 'ost', 'pasta'] },
        { name: 'Sandwich', leftovers: ['brød', 'skinke', 'ost', 'grønnsaker'] }
    ];
    
    const relevantSuggestions = suggestions.filter(s => 
        s.leftovers.some(l => leftovers.some(lo => lo.includes(l) || l.includes(lo)))
    );
    
    let resultsHtml = '';
    
    if (matches.length > 0) {
        resultsHtml += `
            <div class="leftover-section">
                <h4>📖 Fra dine oppskrifter:</h4>
                ${matches.slice(0, 5).map(r => `
                    <div class="leftover-match" onclick="viewRecipe('${r.id}'); closeGenericModal();">
                        <span class="match-icon">🍽️</span>
                        <span class="match-name">${escapeHtml(r.name)}</span>
                        <span class="match-arrow">→</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    if (relevantSuggestions.length > 0) {
        resultsHtml += `
            <div class="leftover-section">
                <h4>💡 Klassiske retter:</h4>
                ${relevantSuggestions.map(s => `
                    <div class="leftover-suggestion">
                        <span class="suggestion-name">${s.name}</span>
                        <span class="suggestion-hint">Passer med: ${s.leftovers.join(', ')}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    if (!resultsHtml) {
        resultsHtml = `
            <div class="no-matches">
                <p>🤔 Fant ingen direkte treff, men prøv å søke etter oppskrifter eller se om AI-planleggeren har forslag!</p>
            </div>
        `;
    }
    
    $('leftoverResults').innerHTML = resultsHtml;
}
window.suggestLeftoverRecipes = suggestLeftoverRecipes;

// ===== RECIPE SCALING CALCULATOR =====
function openRecipeScaler(recipeId) {
    const recipe = state.recipes.find(r => r.id === recipeId) || state.currentRecipe;
    if (!recipe) {
        showToast('Velg en oppskrift først', 'warning');
        return;
    }
    
    const originalServings = recipe.servings || 4;
    
    let ingredientsArray = recipe.ingredients || [];
    if (typeof ingredientsArray === 'string') {
        ingredientsArray = ingredientsArray.split('\n').filter(i => i.trim());
    }
    
    const html = `
        <div class="recipe-scaler">
            <h3>📊 Skalér "${escapeHtml(recipe.name)}"</h3>
            
            <div class="scaler-controls">
                <div class="scaler-original">
                    <label>Original:</label>
                    <span>${originalServings} porsjoner</span>
                </div>
                <div class="scaler-new">
                    <label>Ny mengde:</label>
                    <input type="number" id="scalerServings" value="${originalServings}" min="1" max="100" onchange="updateScaledIngredients()">
                    <span>porsjoner</span>
                </div>
            </div>
            
            <div class="quick-scale-btns">
                <button onclick="setScale(0.5)">½×</button>
                <button onclick="setScale(1)">1×</button>
                <button onclick="setScale(2)">2×</button>
                <button onclick="setScale(3)">3×</button>
                <button onclick="setScale(4)">4×</button>
            </div>
            
            <div id="scaledIngredients" class="scaled-ingredients">
                ${ingredientsArray.map(ing => {
                    const text = typeof ing === 'object' ? `${ing.amount || ''} ${ing.name || ''}` : ing;
                    return `<div class="scaled-item">${escapeHtml(text.trim())}</div>`;
                }).join('')}
            </div>
            
            <button class="btn btn-primary" onclick="copyScaledIngredients()">
                📋 Kopier til utklippstavle
            </button>
        </div>
    `;
    
    showModal('📊 Skalér oppskrift', html, []);
    
    window.currentScaleRecipe = recipe;
    window.originalServings = originalServings;
}
window.openRecipeScaler = openRecipeScaler;

function setScale(multiplier) {
    const original = window.originalServings || 4;
    $('scalerServings').value = Math.round(original * multiplier);
    updateScaledIngredients();
}
window.setScale = setScale;

function updateScaledIngredients() {
    const recipe = window.currentScaleRecipe;
    if (!recipe) return;
    
    const originalServings = window.originalServings || 4;
    const newServings = parseInt($('scalerServings')?.value) || originalServings;
    const multiplier = newServings / originalServings;
    
    let ingredientsArray = recipe.ingredients || [];
    if (typeof ingredientsArray === 'string') {
        ingredientsArray = ingredientsArray.split('\n').filter(i => i.trim());
    }
    
    const scaled = ingredientsArray.map(ing => {
        const text = typeof ing === 'object' ? `${ing.amount || ''} ${ing.name || ''}` : ing;
        return scaleIngredientText(text, multiplier);
    });
    
    $('scaledIngredients').innerHTML = scaled.map(s => 
        `<div class="scaled-item">${escapeHtml(s)}</div>`
    ).join('');
}
window.updateScaledIngredients = updateScaledIngredients;

function scaleIngredientText(text, multiplier) {
    // Find numbers and scale them
    return text.replace(/(\d+([.,]\d+)?)/g, (match) => {
        const num = parseFloat(match.replace(',', '.'));
        const scaled = num * multiplier;
        // Round to nice fractions
        if (scaled === Math.floor(scaled)) {
            return scaled.toString();
        } else if (Math.abs(scaled - Math.round(scaled * 2) / 2) < 0.1) {
            return (Math.round(scaled * 2) / 2).toString().replace('.', ',');
        } else {
            return scaled.toFixed(1).replace('.', ',');
        }
    });
}

function copyScaledIngredients() {
    const items = Array.from(document.querySelectorAll('.scaled-item'))
        .map(el => el.textContent)
        .join('\n');
    
    navigator.clipboard.writeText(items);
    showToast('📋 Ingredienser kopiert!', 'success');
}
window.copyScaledIngredients = copyScaledIngredients;

// ===== RECIPE NUTRITION TRACKER =====
function openNutritionTracker() {
    const history = JSON.parse(localStorage.getItem('kokebok_cooking_history') || '[]');
    const last7Days = history.filter(h => {
        const date = new Date(h.date);
        const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 7;
    });
    
    const mealCount = last7Days.length;
    const uniqueRecipes = new Set(last7Days.map(h => h.recipeId)).size;
    
    const html = `
        <div class="nutrition-tracker">
            <div class="tracker-header">
                <span class="tracker-icon">📈</span>
                <h3>Matdagbok - Siste 7 dager</h3>
            </div>
            
            <div class="tracker-stats">
                <div class="tracker-stat">
                    <span class="stat-value">${mealCount}</span>
                    <span class="stat-label">Måltider</span>
                </div>
                <div class="tracker-stat">
                    <span class="stat-value">${uniqueRecipes}</span>
                    <span class="stat-label">Unike retter</span>
                </div>
                <div class="tracker-stat">
                    <span class="stat-value">${(mealCount / 7).toFixed(1)}</span>
                    <span class="stat-label">Snitt/dag</span>
                </div>
            </div>
            
            <div class="tracker-tips">
                <h4>💡 Tips for bedre matplanlegging:</h4>
                <ul>
                    <li>Prøv å variere mellom proteinkildene</li>
                    <li>Inkluder minst 5 porsjoner frukt/grønt daglig</li>
                    <li>Planlegg neste uke på søndag</li>
                    <li>Bruk restene smart - se "Rester-hjelper"</li>
                </ul>
            </div>
            
            <div class="tracker-actions">
                <button class="btn btn-primary" onclick="openAiMealPlanner(); closeGenericModal();">
                    🤖 AI Ukemeny
                </button>
                <button class="btn btn-secondary" onclick="openCookingDiary(); closeGenericModal();">
                    📅 Se kalender
                </button>
            </div>
        </div>
    `;
    
    showModal('📈 Matdagbok', html, []);
}
window.openNutritionTracker = openNutritionTracker;

// ===== QUICK ADD TO SHOPPING =====
function quickAddToShopping() {
    const html = `
        <div class="quick-add">
            <p>Skriv inn varer (én per linje):</p>
            <textarea id="quickAddItems" class="quick-add-textarea" placeholder="Melk
Brød
Ost
Egg"></textarea>
            <button class="btn btn-primary" onclick="processQuickAdd()">
                ➕ Legg til alle
            </button>
        </div>
    `;
    
    showModal('🛒 Hurtig-legg til', html, []);
}
window.quickAddToShopping = quickAddToShopping;

function processQuickAdd() {
    const input = $('quickAddItems')?.value || '';
    const items = input.split('\n')
        .map(i => i.trim())
        .filter(i => i.length > 0);
    
    if (items.length === 0) {
        showToast('Skriv inn minst én vare', 'warning');
        return;
    }
    
    items.forEach(item => {
        if (!state.shoppingList) state.shoppingList = [];
        state.shoppingList.push({ name: item, amount: '' });
    });
    
    saveShoppingList();
    closeGenericModal();
    showToast(`✅ ${items.length} varer lagt til!`, 'success');
}
window.processQuickAdd = processQuickAdd;

// ===== RECIPE OF THE DAY =====
function showRecipeOfTheDay() {
    if (state.recipes.length === 0) {
        showToast('Legg til oppskrifter først', 'warning');
        return;
    }
    
    // Use date as seed for consistent daily recipe
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = seed % state.recipes.length;
    const recipe = state.recipes[index];
    
    const html = `
        <div class="recipe-of-day">
            <div class="rod-badge">⭐ Dagens oppskrift ⭐</div>
            
            <div class="rod-image">
                ${recipe.images?.[0] 
                    ? `<img src="${recipe.images[0]}" alt="${escapeHtml(recipe.name)}">`
                    : '<span class="rod-placeholder">🍽️</span>'}
            </div>
            
            <h2 class="rod-title">${escapeHtml(recipe.name)}</h2>
            
            <div class="rod-meta">
                <span>${getCategoryName(recipe.category)}</span>
                ${recipe.prepTime ? `<span>⏱️ ${recipe.prepTime}</span>` : ''}
                ${recipe.servings ? `<span>👥 ${recipe.servings} porsjoner</span>` : ''}
            </div>
            
            <button class="btn btn-primary btn-large" onclick="viewRecipe('${recipe.id}'); closeGenericModal();">
                Se oppskrift →
            </button>
        </div>
    `;
    
    showModal('⭐ Dagens oppskrift', html, []);
}
window.showRecipeOfTheDay = showRecipeOfTheDay;

