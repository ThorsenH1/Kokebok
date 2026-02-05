// ==========================================
// FAMILIENS KOKEBOK APP v4.2.0
// Firebase-basert med Google Auth
// Digitaliser gamle kokebøker og oppskrifter
// 100% privat - ingen AI lærer av dine oppskrifter
// ==========================================

const APP_VERSION = '4.3.0';

// ===== Kassal.app API Configuration =====
const KASSAL_API_KEY = 't6U34fylDhsVo028tQ75rTwlgvN8YfRIXAelcLIj';
const KASSAL_API_BASE = 'https://kassal.app/api/v1';

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
        mealReminders: false,
        profilePublic: true,
        pushNotifications: true,
        friendNotifications: true,
        shareNotifications: true,
        reminderNotifications: true
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
    portionScale: 1,
    // v4.0 - Social features
    friends: [],
    friendRequests: [],
    sentRequests: [],
    sharedRecipes: [],
    // v4.1 - Kitchen equipment
    equipment: [],
    pantryItems: []
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
        
        // Prøv popup først for alle enheter (bedre UX og unngår redirect-problemer)
        try {
            console.log('Prøver popup-innlogging...');
            const result = await auth.signInWithPopup(provider);
            if (result.user) {
                console.log('✓ Popup login vellykket:', result.user.email);
                sessionStorage.setItem('kokebok_just_logged_in', 'true');
            }
        } catch (popupError) {
            console.log('Popup feilet:', popupError.code, popupError.message);
            
            // Sjekk spesifikke feil
            if (popupError.code === 'auth/popup-blocked') {
                showToast('⚠️ Popup ble blokkert! Tillat popups for denne siden, eller deaktiver adblocker.', 'warning');
                resetLoginButton(btn);
                return;
            }
            
            if (popupError.code === 'auth/popup-closed-by-user') {
                showToast('Innlogging avbrutt', 'info');
                resetLoginButton(btn);
                return;
            }
            
            if (popupError.code === 'auth/cancelled-popup-request') {
                // Ignorer - bruker åpnet ny popup
                resetLoginButton(btn);
                return;
            }
            
            if (popupError.code === 'auth/network-request-failed') {
                showToast('⚠️ Nettverksfeil - sjekk internett eller adblocker', 'error');
                resetLoginButton(btn);
                return;
            }
            
            // Fall tilbake til redirect for andre feil
            console.log('Prøver redirect som fallback...');
            try {
                await auth.signInWithRedirect(provider);
            } catch (redirectError) {
                console.error('Redirect login feilet:', redirectError);
                showToast('Innlogging feilet. Prøv å deaktivere adblocker eller bruk inkognitomodus.', 'error');
                resetLoginButton(btn);
            }
        }
    });

    // Håndter redirect-resultat ved oppstart
    auth.getRedirectResult().then((result) => {
        if (result && result.user) {
            console.log('✓ Redirect login vellykket:', result.user.email);
            sessionStorage.setItem('kokebok_just_logged_in', 'true');
        }
    }).catch((error) => {
        console.error('Redirect result error:', error);
        if (error.code !== 'auth/popup-closed-by-user') {
            showToast('Innlogging feilet ved redirect', 'error');
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
        
        // CRITICAL: Create public profile EARLY so friends can find us
        await ensurePublicProfile();
        
        setupEventListeners();
        renderDashboard();
        applySettings();
        updateUserInfo();
        restoreMenuSectionStates();
        
        // v4.0 - Load social data and update badge
        loadSocialData().then(() => {
            updateFriendNotificationBadge();
        });
        
        // v4.1 - Check expiring items and request push permission
        setTimeout(() => {
            checkExpiringItems();
            // Auto-request push permission if user hasn't been asked
            if (state.settings.pushNotifications && isPushSupported()) {
                requestPushPermission();
            }
        }, 2000);
        
        // Check expiring items daily
        setInterval(checkExpiringItems, 24 * 60 * 60 * 1000);
        
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

// Ensure user has a public profile that others can find
async function ensurePublicProfile() {
    if (!state.user) return;
    
    try {
        await db.collection('publicProfiles').doc(state.user.uid).set({
            uid: state.user.uid,
            email: state.user.email.toLowerCase(),
            displayName: state.user.displayName || 'Anonym kokk',
            photoURL: state.user.photoURL || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isPublic: true
        }, { merge: true });
        console.log('✓ Public profile oppdatert');
    } catch (e) {
        console.warn('Kunne ikke opprette public profile:', e.message);
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
        
        // v4.1 - Load equipment and pantry data
        try {
            state.equipment = await loadCollection('equipment');
            console.log(`  ✓ Utstyr: ${state.equipment.length}`);
        } catch (e) {
            console.warn('  Kunne ikke laste utstyr:', e.message);
            state.equipment = [];
        }
        
        try {
            state.pantryItems = await loadCollection('pantry');
            console.log(`  ✓ Spisskammer: ${state.pantryItems.length}`);
        } catch (e) {
            console.warn('  Kunne ikke laste spisskammer:', e.message);
            state.pantryItems = [];
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
    
    // Public profile (v4.0)
    const publicProfileToggle = $('publicProfileToggle');
    if (publicProfileToggle) {
        publicProfileToggle.checked = state.settings.profilePublic !== false;
    }
    
    // v4.1 - Notification settings
    const pushNotifToggle = $('pushNotificationsToggle');
    if (pushNotifToggle) {
        pushNotifToggle.checked = state.settings.pushNotifications !== false;
    }
    
    const friendNotifToggle = $('friendNotificationsToggle');
    if (friendNotifToggle) {
        friendNotifToggle.checked = state.settings.friendNotifications !== false;
    }
    
    const expiryNotifToggle = $('expiryNotificationsToggle');
    if (expiryNotifToggle) {
        expiryNotifToggle.checked = state.settings.reminderNotifications !== false;
    }
    
    // v4.2 - AI Settings
    const autoDeductToggle = $('autoDeductToggle');
    if (autoDeductToggle) {
        autoDeductToggle.checked = state.settings.autoDeductIngredients || false;
    }
    
    // Load OpenAI key from localStorage
    const openaiKeyInput = $('openaiKeyInput');
    if (openaiKeyInput) {
        const savedKey = localStorage.getItem('openai_api_key');
        if (savedKey) {
            openaiKeyInput.value = savedKey;
        }
    }
    
    // Load Gemini key from localStorage
    const geminiKeyInput = $('geminiKeyInput');
    if (geminiKeyInput) {
        const savedGeminiKey = localStorage.getItem('kokebok_gemini_key');
        if (savedGeminiKey) {
            geminiKeyInput.value = savedGeminiKey;
        }
    }
}

// v4.2 - Save OpenAI API Key
function saveOpenAIKey() {
    const keyInput = $('openaiKeyInput');
    if (!keyInput) return;
    
    const key = keyInput.value.trim();
    if (key) {
        localStorage.setItem('openai_api_key', key);
        showToast('✅ API-nøkkel lagret!');
    } else {
        localStorage.removeItem('openai_api_key');
        showToast('🗑️ API-nøkkel fjernet');
    }
}

// v4.2 - Test OpenAI Connection
async function testOpenAIConnection() {
    const key = localStorage.getItem('openai_api_key');
    
    if (!key) {
        showToast('⚠️ Ingen API-nøkkel lagret');
        return;
    }
    
    showToast('🔄 Tester tilkobling...');
    
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${key}`
            }
        });
        
        if (response.ok) {
            showToast('✅ AI-tilkobling fungerer!');
        } else if (response.status === 401) {
            showToast('❌ Ugyldig API-nøkkel');
        } else {
            showToast('⚠️ Kunne ikke verifisere nøkkel');
        }
    } catch (error) {
        console.error('OpenAI test error:', error);
        showToast('❌ Tilkoblingsfeil');
    }
}
window.saveOpenAIKey = saveOpenAIKey;
window.testOpenAIConnection = testOpenAIConnection;

// v4.5 - Google Gemini API (FREE!)
function saveGeminiKey() {
    const keyInput = $('geminiKeyInput');
    if (!keyInput) return;
    
    const key = keyInput.value.trim();
    if (key) {
        localStorage.setItem('kokebok_gemini_key', key);
        showToast('✅ Gemini API-nøkkel lagret!', 'success');
    } else {
        localStorage.removeItem('kokebok_gemini_key');
        showToast('🗑️ Gemini API-nøkkel fjernet');
    }
}
window.saveGeminiKey = saveGeminiKey;

// v4.5 - Load Gemini key on init
function loadGeminiKey() {
    const geminiKeyInput = $('geminiKeyInput');
    if (geminiKeyInput) {
        const savedKey = localStorage.getItem('kokebok_gemini_key');
        if (savedKey) {
            geminiKeyInput.value = savedKey;
        }
    }
}

// v4.5 - Test Gemini Connection  
async function testGeminiConnection() {
    const key = localStorage.getItem('kokebok_gemini_key');
    
    if (!key) {
        showToast('⚠️ Ingen Gemini API-nøkkel lagret', 'warning');
        return;
    }
    
    showToast('🔄 Tester Gemini-tilkobling...', 'info');
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Svar bare med: OK'
                    }]
                }]
            })
        });
        
        if (response.ok) {
            showToast('✅ Gemini-tilkobling fungerer! AI-skanning er klar.', 'success');
        } else {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || 'Ukjent feil';
            
            if (response.status === 400 && errorMsg.includes('API key')) {
                showToast('❌ Ugyldig Gemini API-nøkkel', 'error');
            } else if (response.status === 403) {
                showToast('❌ API-nøkkel har ikke tilgang til Gemini', 'error');
            } else {
                showToast(`⚠️ Feil: ${errorMsg}`, 'warning');
            }
        }
    } catch (error) {
        console.error('Gemini test error:', error);
        showToast('❌ Tilkoblingsfeil', 'error');
    }
}
window.testGeminiConnection = testGeminiConnection;

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
            } else if (state.currentView === 'dashboardView' && state.searchQuery.length >= 2) {
                // Navigate to recipe list when searching from dashboard
                navigateTo('recipeListView');
                renderRecipeList();
            }
        });
        
        // Also handle Enter key to search from dashboard
        on(searchInput, 'keypress', (e) => {
            if (e.key === 'Enter' && state.searchQuery) {
                navigateTo('recipeListView');
                renderRecipeList();
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
    
    // Public profile toggle (v4.0)
    on('publicProfileToggle', 'change', (e) => {
        state.settings.profilePublic = e.target.checked;
        saveSettings();
        updatePublicProfile();
        showToast(e.target.checked ? 'Profilen din er nå offentlig' : 'Profilen din er nå privat', 'success');
    });
    
    // v4.1 - Notification setting toggles
    on('pushNotificationsToggle', 'change', async (e) => {
        state.settings.pushNotifications = e.target.checked;
        saveSettings();
        if (e.target.checked) {
            await requestPushPermission();
        }
        showToast(e.target.checked ? 'Push-varsler aktivert' : 'Push-varsler deaktivert', 'success');
    });
    
    on('friendNotificationsToggle', 'change', (e) => {
        state.settings.friendNotifications = e.target.checked;
        saveSettings();
        showToast(e.target.checked ? 'Vennevarsler aktivert' : 'Vennevarsler deaktivert', 'success');
    });
    
    on('expiryNotificationsToggle', 'change', (e) => {
        state.settings.reminderNotifications = e.target.checked;
        saveSettings();
        showToast(e.target.checked ? 'Utløpsvarsler aktivert' : 'Utløpsvarsler deaktivert', 'success');
    });
    
    // v4.2 - Auto-deduct toggle
    on('autoDeductToggle', 'change', (e) => {
        state.settings.autoDeductIngredients = e.target.checked;
        saveSettings();
        showToast(e.target.checked ? 'Auto-fratrekk aktivert' : 'Auto-fratrekk deaktivert', 'success');
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
    updateSocialCard();
    updateKitchenCard(); // v4.1
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

// v4.0 - Update social card on dashboard
function updateSocialCard() {
    const friendCountEl = $('friendCount');
    const leaderboardRankEl = $('leaderboardRank');
    const requestBadge = $('friendRequestBadge');
    const pendingCount = $('pendingRequestCount');
    
    if (friendCountEl) {
        friendCountEl.textContent = state.friends?.length || 0;
    }
    
    if (leaderboardRankEl) {
        // Show level instead of rank for now
        const level = getPlayerLevel().level;
        leaderboardRankEl.textContent = `Lv.${level}`;
    }
    
    const pending = (state.friendRequests?.length || 0) + (state.sharedRecipes?.filter(r => !r.viewed)?.length || 0);
    if (requestBadge && pendingCount) {
        if (pending > 0) {
            requestBadge.style.display = 'flex';
            pendingCount.textContent = pending;
        } else {
            requestBadge.style.display = 'none';
        }
    }
}

// v4.1 - Update kitchen card on dashboard
function updateKitchenCard() {
    const equipmentCountEl = $('equipmentCount');
    const pantryCountEl = $('pantryCount');
    const expiryAlertBadge = $('expiryAlertBadge');
    const expiryAlertCount = $('expiryAlertCount');
    
    if (equipmentCountEl) {
        equipmentCountEl.textContent = state.equipment?.length || 0;
    }
    
    if (pantryCountEl) {
        pantryCountEl.textContent = state.pantryItems?.length || 0;
    }
    
    // Count expiring items (within 3 days)
    const now = new Date();
    const expiringCount = (state.pantryItems || []).filter(item => {
        if (!item.expiryDate) return false;
        const days = Math.ceil((new Date(item.expiryDate) - now) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 3;
    }).length;
    
    if (expiryAlertBadge && expiryAlertCount) {
        if (expiringCount > 0) {
            expiryAlertBadge.style.display = 'flex';
            expiryAlertCount.textContent = expiringCount;
        } else {
            expiryAlertBadge.style.display = 'none';
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
        
        <!-- v4.2 - Cooking Actions -->
        <div class="cooking-actions" style="margin-top: 24px; padding-top: 20px; border-top: 2px solid var(--border-light);">
            <button class="btn btn-primary btn-large" onclick="onRecipeCooked('${recipe.id}')" style="width: 100%; padding: 16px; font-size: 1.1rem;">
                👨‍🍳 Jeg har laget denne!
            </button>
            <p style="text-align: center; margin-top: 8px; font-size: 0.85rem; color: var(--text-light);">
                ${state.settings.autoDeductIngredients ? 'Ingredienser trekkes fra matkammeret automatisk' : 'Aktiver auto-fratrekk i innstillinger'}
            </p>
        </div>
        
        <!-- v4.4 - Premium Recipe Actions -->
        <div class="premium-actions" style="margin-top: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            <button class="premium-btn" onclick="rateRecipe('${recipe.id}')" style="padding: 14px; background: var(--bg-card); border: 2px solid var(--border); border-radius: var(--radius); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px; transition: all 0.2s;">
                <span style="font-size: 1.5rem;">⭐</span>
                <span style="font-size: 0.85rem; color: var(--text);">${recipe.rating ? `${recipe.rating}/5` : 'Vurder'}</span>
            </button>
            <button class="premium-btn" onclick="openRecipeNotes('${recipe.id}')" style="padding: 14px; background: var(--bg-card); border: 2px solid var(--border); border-radius: var(--radius); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px; transition: all 0.2s;">
                <span style="font-size: 1.5rem;">📝</span>
                <span style="font-size: 0.85rem; color: var(--text);">Notater ${recipe.cookingNotes?.length ? '(' + recipe.cookingNotes.length + ')' : ''}</span>
            </button>
            <button class="premium-btn" onclick="addToCollection('${recipe.id}')" style="padding: 14px; background: var(--bg-card); border: 2px solid var(--border); border-radius: var(--radius); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px; transition: all 0.2s;">
                <span style="font-size: 1.5rem;">📁</span>
                <span style="font-size: 0.85rem; color: var(--text);">Samling</span>
            </button>
            <button class="premium-btn cook-mode" onclick="startCookingMode('${recipe.id}')" style="padding: 14px; background: linear-gradient(135deg, #4f46e5, #7c3aed); border: none; border-radius: var(--radius); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px; color: white; transition: all 0.2s;">
                <span style="font-size: 1.5rem;">👨‍🍳</span>
                <span style="font-size: 0.85rem;">Kokemodus</span>
            </button>
        </div>
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
    
    // Show share options modal
    const hasFriends = state.friends && state.friends.length > 0;
    
    let friendsHtml = '';
    if (hasFriends) {
        friendsHtml = `
            <h4 style="margin: 1rem 0 0.5rem;">👥 Del med venner i appen</h4>
            <div class="friends-share-list">
                ${state.friends.map(f => `
                    <div class="friend-share-item" onclick="confirmShareRecipe('${recipe.id}', '${f.friendUid}'); closeModal();">
                        <div class="friend-avatar-small">${f.photoURL ? `<img src="${f.photoURL}">` : '👤'}</div>
                        <span>${escapeHtml(f.displayName || 'Kokk')}</span>
                        <span class="share-icon">📤</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        friendsHtml = `
            <div class="no-friends-hint">
                <p>💡 Legg til venner for å dele oppskrifter direkte!</p>
                <button class="btn btn-secondary" onclick="closeModal(); openFriendsPanel();">👥 Finn venner</button>
            </div>
        `;
    }
    
    const html = `
        <div class="share-options">
            <h4>📱 Del eksternt</h4>
            <div class="share-external-buttons">
                <button class="btn btn-secondary" onclick="shareExternal()">📤 Del via enhet</button>
                <button class="btn btn-secondary" onclick="copyRecipeToClipboard()">📋 Kopier tekst</button>
            </div>
            ${friendsHtml}
        </div>
    `;
    
    showModal(`📤 Del "${recipe.name}"`, html, []);
}

async function shareExternal() {
    if (!state.currentRecipe) return;
    const recipe = state.currentRecipe;
    const text = `${recipe.name}\n\nIngredienser:\n${recipe.ingredients || 'Ikke angitt'}\n\nFremgangsmåte:\n${recipe.instructions || 'Ikke angitt'}`;
    
    if (navigator.share) {
        try {
            await navigator.share({ title: recipe.name, text: text });
            closeModal();
        } catch (err) {
            if (err.name !== 'AbortError') {
                copyToClipboard(text);
                closeModal();
            }
        }
    } else {
        copyToClipboard(text);
        closeModal();
    }
}
window.shareExternal = shareExternal;

function copyRecipeToClipboard() {
    if (!state.currentRecipe) return;
    const recipe = state.currentRecipe;
    const text = `${recipe.name}\n\nIngredienser:\n${recipe.ingredients || 'Ikke angitt'}\n\nFremgangsmåte:\n${recipe.instructions || 'Ikke angitt'}`;
    copyToClipboard(text);
    closeModal();
}
window.copyRecipeToClipboard = copyRecipeToClipboard;

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
    levelFifty: { name: 'Nivå 50', icon: '👑', desc: 'Nådde nivå 50 - legende!', xp: 0 },
    
    // v4.0 - Sosiale prestasjoner
    firstFriend: { name: 'Ny venn', icon: '🤝', desc: 'Fikk din første venn', xp: 20 },
    socialButterfly: { name: 'Sosial sommerfugl', icon: '🦋', desc: 'Har 5 venner', xp: 50 },
    popularChef: { name: 'Populær kokk', icon: '🌟', desc: 'Har 10 venner', xp: 100 },
    influencer: { name: 'Matinfluenser', icon: '📱', desc: 'Har 25 venner', xp: 200 },
    recipeSharer: { name: 'Sjenerøs kokk', icon: '💝', desc: 'Delte 5 oppskrifter med venner', xp: 30 },
    shareKing: { name: 'Delingskonge', icon: '👑', desc: 'Delte 20 oppskrifter med venner', xp: 75 },
    giftReceiver: { name: 'Gavemottaker', icon: '🎁', desc: 'Mottok 5 oppskrifter fra venner', xp: 25 },
    topTen: { name: 'Topp 10', icon: '🏅', desc: 'Kom på topp 10 på topplisten', xp: 50 },
    friendLeader: { name: 'Venneleder', icon: '🏆', desc: 'Topp 1 blant dine venner', xp: 40 },
    dailyChamp: { name: 'Daglig mester', icon: '📆', desc: 'Fullførte 7 daglige utfordringer', xp: 50 },
    challengeHero: { name: 'Utfordringshelt', icon: '⚔️', desc: 'Fullførte 30 daglige utfordringer', xp: 150 },
    // Equipment achievements
    equipmentCollector: { name: 'Utstyrssamler', icon: '🔧', desc: 'Registrerte 10 kjøkkenutstyr', xp: 30 },
    kitchenMaster: { name: 'Kjøkkenmester', icon: '👨‍🍳', desc: 'Registrerte 25 kjøkkenutstyr', xp: 75 },
    pantryOrganizer: { name: 'Spisskammerekspert', icon: '🗄️', desc: 'Har 20 varer i spisskammeret', xp: 40 },
    expiryWatcher: { name: 'Holdbarhetsvakt', icon: '⏰', desc: 'Forhindret 10 produkter fra å gå ut på dato', xp: 50 }
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

// =============================================
// ===== SOCIAL FEATURES - FRIENDS SYSTEM =====
// =============================================

// Initialize social data
async function loadSocialData() {
    if (!state.user) return;
    
    try {
        // Load friends
        const friendsSnap = await db.collection('users').doc(state.user.uid).collection('friends').get();
        state.friends = friendsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Load incoming friend requests
        const requestsSnap = await db.collection('friendRequests')
            .where('toUid', '==', state.user.uid)
            .where('status', '==', 'pending')
            .get();
        state.friendRequests = requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Load sent requests
        const sentSnap = await db.collection('friendRequests')
            .where('fromUid', '==', state.user.uid)
            .where('status', '==', 'pending')
            .get();
        state.sentRequests = sentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Load shared recipes (without orderBy to avoid needing composite index)
        const sharedSnap = await db.collection('sharedRecipes')
            .where('toUid', '==', state.user.uid)
            .limit(50)
            .get();
        // Sort client-side instead
        state.sharedRecipes = sharedSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (b.sharedAt?.toMillis?.() || 0) - (a.sharedAt?.toMillis?.() || 0))
            .slice(0, 20);
        
        // Update public profile
        await updatePublicProfile();
        
        // Set up real-time listener for new requests and shares
        setupSocialListeners();
        
        console.log(`✓ Sosiale data: ${state.friends.length} venner, ${state.friendRequests.length} forespørsler`);
    } catch (e) {
        console.warn('Kunne ikke laste sosiale data:', e.message);
    }
}

// Real-time listeners for social updates
let socialListenersSetup = false;
function setupSocialListeners() {
    if (socialListenersSetup || !state.user) return;
    socialListenersSetup = true;
    
    // Listen for new friend requests
    db.collection('friendRequests')
        .where('toUid', '==', state.user.uid)
        .where('status', '==', 'pending')
        .onSnapshot(snapshot => {
            const changes = snapshot.docChanges();
            const newRequests = changes.filter(c => c.type === 'added');
            
            if (newRequests.length > 0 && state.friendRequests.length > 0) {
                // This is a new request (not initial load)
                showToast('📬 Ny venneforespørsel!', 'info');
            }
            
            state.friendRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateFriendNotificationBadge();
        }, err => console.warn('Friend request listener error:', err.message));
    
    // Listen for new shared recipes
    db.collection('sharedRecipes')
        .where('toUid', '==', state.user.uid)
        .orderBy('sharedAt', 'desc')
        .limit(20)
        .onSnapshot(snapshot => {
            const changes = snapshot.docChanges();
            const newShares = changes.filter(c => c.type === 'added');
            
            if (newShares.length > 0 && state.sharedRecipes.length > 0) {
                const share = newShares[0].doc.data();
                showToast(`🎁 ${share.fromName} delte en oppskrift med deg!`, 'success');
            }
            
            state.sharedRecipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateFriendNotificationBadge();
        }, err => console.warn('Shared recipes listener error:', err.message));
}

// Update public profile for leaderboard/friends
async function updatePublicProfile() {
    if (!state.user) return;
    
    const playerLevel = getPlayerLevel();
    const achievements = JSON.parse(localStorage.getItem('kokebok_achievements') || '[]');
    const streak = parseInt(localStorage.getItem('kokebok_streak') || '0');
    const cookingStreak = parseInt(localStorage.getItem('kokebok_cooking_streak') || '0');
    const totalCooked = parseInt(localStorage.getItem('kokebok_total_cooked') || '0');
    
    try {
        await db.collection('publicProfiles').doc(state.user.uid).set({
            uid: state.user.uid, // REQUIRED for Firebase security rules!
            displayName: state.user.displayName || 'Anonym kokk',
            email: state.user.email.toLowerCase(), // Normalize for search
            photoURL: state.user.photoURL || null,
            level: playerLevel.level,
            xp: playerLevel.xp,
            achievementCount: achievements.length,
            recipeCount: state.recipes.length,
            streak: streak,
            cookingStreak: cookingStreak,
            totalCooked: totalCooked,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isPublic: state.settings.profilePublic !== false
        }, { merge: true });
        console.log('✓ Public profile updated');
    } catch (e) {
        console.warn('Kunne ikke oppdatere profil:', e.message);
    }
}

// Open friends panel
function openFriendsPanel() {
    const pendingCount = state.friendRequests.length;
    const sharedCount = state.sharedRecipes.filter(r => !r.viewed).length;
    
    const html = `
        <div class="friends-panel">
            <div class="friends-tabs">
                <button class="friends-tab active" onclick="switchFriendsTab('friends')">
                    👥 Venner <span class="tab-count">${state.friends.length}</span>
                </button>
                <button class="friends-tab" onclick="switchFriendsTab('requests')">
                    📬 Forespørsler ${pendingCount > 0 ? `<span class="tab-badge">${pendingCount}</span>` : ''}
                </button>
                <button class="friends-tab" onclick="switchFriendsTab('shared')">
                    🎁 Delt ${sharedCount > 0 ? `<span class="tab-badge">${sharedCount}</span>` : ''}
                </button>
                <button class="friends-tab" onclick="switchFriendsTab('leaderboard')">
                    🏆 Toppliste
                </button>
            </div>
            
            <div id="friendsTabContent">
                ${renderFriendsList()}
            </div>
        </div>
    `;
    
    showModal('👥 Venner & Sosialt', html, []);
}
window.openFriendsPanel = openFriendsPanel;

function switchFriendsTab(tab) {
    document.querySelectorAll('.friends-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.friends-tab[onclick*="${tab}"]`)?.classList.add('active');
    
    const content = $('friendsTabContent');
    if (!content) return;
    
    switch(tab) {
        case 'friends':
            content.innerHTML = renderFriendsList();
            break;
        case 'requests':
            content.innerHTML = renderFriendRequests();
            break;
        case 'shared':
            content.innerHTML = renderSharedRecipes();
            break;
        case 'leaderboard':
            content.innerHTML = '<div class="loading-spinner">Laster toppliste...</div>';
            loadLeaderboard().then(html => content.innerHTML = html);
            break;
    }
}
window.switchFriendsTab = switchFriendsTab;

// Render friends list
function renderFriendsList() {
    let html = `
        <div class="add-friend-section">
            <h4>➕ Legg til venn</h4>
            <div class="add-friend-form">
                <input type="email" id="friendEmailInput" placeholder="Vennens e-postadresse..." class="friend-input">
                <button class="btn btn-primary" onclick="sendFriendRequest()">Send forespørsel</button>
            </div>
        </div>
    `;
    
    if (state.friends.length === 0) {
        html += `
            <div class="empty-state">
                <span class="empty-icon">👥</span>
                <p>Du har ingen venner ennå</p>
                <p class="empty-hint">Legg til venner med e-postadressen deres for å dele oppskrifter og konkurrere!</p>
            </div>
        `;
    } else {
        html += `<div class="friends-list">`;
        for (const friend of state.friends) {
            html += `
                <div class="friend-card" data-uid="${friend.friendUid}">
                    <div class="friend-avatar">
                        ${friend.photoURL ? `<img src="${friend.photoURL}" alt="">` : '👤'}
                    </div>
                    <div class="friend-info">
                        <span class="friend-name">${escapeHtml(friend.displayName || 'Kokk')}</span>
                        <span class="friend-stats">
                            Nivå ${friend.level || 1} • ${friend.recipeCount || 0} oppskrifter
                        </span>
                    </div>
                    <div class="friend-actions">
                        <button class="btn-icon" onclick="viewFriendProfile('${friend.friendUid}')" title="Se profil">👁️</button>
                        <button class="btn-icon" onclick="shareRecipeWithFriend('${friend.friendUid}')" title="Del oppskrift">📤</button>
                        <button class="btn-icon danger" onclick="removeFriend('${friend.id}')" title="Fjern venn">❌</button>
                    </div>
                </div>
            `;
        }
        html += `</div>`;
    }
    
    return html;
}

// Render friend requests
function renderFriendRequests() {
    let html = '';
    
    // Incoming requests
    html += `<h4>📥 Innkommende forespørsler</h4>`;
    if (state.friendRequests.length === 0) {
        html += `<p class="empty-hint">Ingen ventende forespørsler</p>`;
    } else {
        html += `<div class="requests-list">`;
        for (const req of state.friendRequests) {
            html += `
                <div class="request-card">
                    <div class="request-avatar">
                        ${req.fromPhoto ? `<img src="${req.fromPhoto}" alt="">` : '👤'}
                    </div>
                    <div class="request-info">
                        <span class="request-name">${escapeHtml(req.fromName || 'Kokk')}</span>
                        <span class="request-email">${escapeHtml(req.fromEmail)}</span>
                    </div>
                    <div class="request-actions">
                        <button class="btn btn-primary btn-sm" onclick="acceptFriendRequest('${req.id}')">✓ Godta</button>
                        <button class="btn btn-secondary btn-sm" onclick="declineFriendRequest('${req.id}')">✕ Avslå</button>
                    </div>
                </div>
            `;
        }
        html += `</div>`;
    }
    
    // Sent requests
    html += `<h4 style="margin-top: 24px;">📤 Sendte forespørsler</h4>`;
    if (state.sentRequests.length === 0) {
        html += `<p class="empty-hint">Ingen ventende forespørsler sendt</p>`;
    } else {
        html += `<div class="requests-list">`;
        for (const req of state.sentRequests) {
            html += `
                <div class="request-card sent">
                    <div class="request-info">
                        <span class="request-name">Til: ${escapeHtml(req.toEmail)}</span>
                        <span class="request-status">⏳ Venter på svar</span>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="cancelFriendRequest('${req.id}')">Avbryt</button>
                </div>
            `;
        }
        html += `</div>`;
    }
    
    return html;
}

// Render shared recipes
function renderSharedRecipes() {
    if (state.sharedRecipes.length === 0) {
        return `
            <div class="empty-state">
                <span class="empty-icon">🎁</span>
                <p>Ingen delte oppskrifter</p>
                <p class="empty-hint">Når venner deler oppskrifter med deg, vises de her!</p>
            </div>
        `;
    }
    
    let html = `<div class="shared-recipes-list">`;
    for (const shared of state.sharedRecipes) {
        const isNew = !shared.viewed;
        html += `
            <div class="shared-recipe-card ${isNew ? 'new' : ''}" onclick="viewSharedRecipe('${shared.id}')">
                ${isNew ? '<span class="new-badge">NY!</span>' : ''}
                <div class="shared-recipe-content">
                    <span class="shared-recipe-name">${escapeHtml(shared.recipeName)}</span>
                    <span class="shared-recipe-from">Fra: ${escapeHtml(shared.fromName)}</span>
                    <span class="shared-recipe-date">${formatDate(shared.sharedAt?.toDate?.() || new Date())}</span>
                </div>
                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); saveSharedRecipe('${shared.id}')">
                    💾 Lagre
                </button>
            </div>
        `;
    }
    html += `</div>`;
    
    return html;
}

// Load leaderboard
async function loadLeaderboard() {
    try {
        // Get top 20 public profiles by XP
        const snapshot = await db.collection('publicProfiles')
            .where('isPublic', '==', true)
            .orderBy('xp', 'desc')
            .limit(20)
            .get();
        
        const profiles = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        
        // Find current user's rank
        let userRank = profiles.findIndex(p => p.uid === state.user?.uid) + 1;
        
        let html = `
            <div class="leaderboard">
                <div class="leaderboard-header">
                    <h4>🏆 Global toppliste</h4>
                    ${userRank > 0 ? `<span class="your-rank">Din plassering: #${userRank}</span>` : ''}
                </div>
                <div class="leaderboard-list">
        `;
        
        profiles.forEach((profile, index) => {
            const isMe = profile.uid === state.user?.uid;
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            
            html += `
                <div class="leaderboard-item ${isMe ? 'is-me' : ''}">
                    <span class="leaderboard-rank">${medal}</span>
                    <div class="leaderboard-avatar">
                        ${profile.photoURL ? `<img src="${profile.photoURL}" alt="">` : '👤'}
                    </div>
                    <div class="leaderboard-info">
                        <span class="leaderboard-name">${escapeHtml(profile.displayName || 'Kokk')} ${isMe ? '(deg)' : ''}</span>
                        <span class="leaderboard-stats">
                            Nivå ${profile.level} • ${profile.xp} XP • ${profile.recipeCount} oppskrifter
                        </span>
                    </div>
                    <div class="leaderboard-badges">
                        🏅 ${profile.achievementCount || 0}
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
                <div class="leaderboard-friends">
                    <h4>👥 Blant venner</h4>
                    ${await renderFriendsLeaderboard()}
                </div>
            </div>
        `;
        
        return html;
    } catch (e) {
        console.error('Leaderboard error:', e);
        return `<p class="error">Kunne ikke laste topplisten</p>`;
    }
}

// Render friends leaderboard
async function renderFriendsLeaderboard() {
    if (state.friends.length === 0) {
        return `<p class="empty-hint">Legg til venner for å sammenligne!</p>`;
    }
    
    // Get friend profiles
    const friendProfiles = [];
    for (const friend of state.friends) {
        try {
            const doc = await db.collection('publicProfiles').doc(friend.friendUid).get();
            if (doc.exists) {
                friendProfiles.push({ uid: friend.friendUid, ...doc.data() });
            }
        } catch (e) {
            // Skip
        }
    }
    
    // Add current user
    const playerLevel = getPlayerLevel();
    friendProfiles.push({
        uid: state.user.uid,
        displayName: state.user.displayName,
        photoURL: state.user.photoURL,
        level: playerLevel.level,
        xp: playerLevel.xp,
        recipeCount: state.recipes.length,
        achievementCount: JSON.parse(localStorage.getItem('kokebok_achievements') || '[]').length
    });
    
    // Sort by XP
    friendProfiles.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    
    let html = '<div class="friends-leaderboard">';
    friendProfiles.forEach((profile, index) => {
        const isMe = profile.uid === state.user?.uid;
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        
        html += `
            <div class="leaderboard-item ${isMe ? 'is-me' : ''}">
                <span class="leaderboard-rank">${medal}</span>
                <span class="leaderboard-name">${escapeHtml(profile.displayName || 'Kokk')} ${isMe ? '(deg)' : ''}</span>
                <span class="leaderboard-xp">${profile.xp || 0} XP</span>
            </div>
        `;
    });
    html += '</div>';
    
    return html;
}

// Send friend request
async function sendFriendRequest() {
    const emailInput = $('friendEmailInput');
    const email = emailInput?.value?.trim().toLowerCase();
    
    if (!email) {
        showToast('Skriv inn en e-postadresse', 'error');
        return;
    }
    
    if (email === state.user.email.toLowerCase()) {
        showToast('Du kan ikke legge til deg selv som venn!', 'error');
        return;
    }
    
    // Check if already friends
    if (state.friends.some(f => f.email?.toLowerCase() === email)) {
        showToast('Dere er allerede venner!', 'info');
        return;
    }
    
    // Check if request already sent
    if (state.sentRequests.some(r => r.toEmail?.toLowerCase() === email)) {
        showToast('Forespørsel allerede sendt!', 'info');
        return;
    }
    
    try {
        // Find user by email
        const userSnap = await db.collection('publicProfiles')
            .where('email', '==', email)
            .limit(1)
            .get();
        
        if (userSnap.empty) {
            showToast('Fant ingen bruker med denne e-posten. Inviter dem til å laste ned appen!', 'warning');
            return;
        }
        
        const toUser = userSnap.docs[0];
        
        // Create friend request
        await db.collection('friendRequests').add({
            fromUid: state.user.uid,
            fromEmail: state.user.email,
            fromName: state.user.displayName,
            fromPhoto: state.user.photoURL,
            toUid: toUser.id,
            toEmail: email,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        emailInput.value = '';
        showToast('Venneforespørsel sendt! 🎉', 'success');
        
        // Reload
        await loadSocialData();
        switchFriendsTab('requests');
        
    } catch (e) {
        console.error('Friend request error:', e);
        showToast('Kunne ikke sende forespørsel', 'error');
    }
}
window.sendFriendRequest = sendFriendRequest;

// Accept friend request
async function acceptFriendRequest(requestId) {
    const request = state.friendRequests.find(r => r.id === requestId);
    if (!request) return;
    
    try {
        // Update request status
        await db.collection('friendRequests').doc(requestId).update({
            status: 'accepted',
            acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Add to both users' friend lists
        const friendData = {
            addedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add friend to my list
        await db.collection('users').doc(state.user.uid).collection('friends').add({
            ...friendData,
            friendUid: request.fromUid,
            email: request.fromEmail,
            displayName: request.fromName,
            photoURL: request.fromPhoto
        });
        
        // Add me to their list
        await db.collection('users').doc(request.fromUid).collection('friends').add({
            ...friendData,
            friendUid: state.user.uid,
            email: state.user.email,
            displayName: state.user.displayName,
            photoURL: state.user.photoURL
        });
        
        showToast(`Du er nå venn med ${request.fromName}! 🎉`, 'success');
        triggerConfetti();
        
        // Achievement check
        await loadSocialData();
        if (state.friends.length === 1) {
            unlockAchievement('firstFriend');
        }
        if (state.friends.length >= 5) {
            unlockAchievement('socialButterfly');
        }
        
        switchFriendsTab('friends');
        
    } catch (e) {
        console.error('Accept friend error:', e);
        showToast('Kunne ikke godta forespørselen', 'error');
    }
}
window.acceptFriendRequest = acceptFriendRequest;

// Decline friend request
async function declineFriendRequest(requestId) {
    try {
        await db.collection('friendRequests').doc(requestId).update({
            status: 'declined'
        });
        
        await loadSocialData();
        switchFriendsTab('requests');
        showToast('Forespørsel avslått');
    } catch (e) {
        showToast('Kunne ikke avslå forespørselen', 'error');
    }
}
window.declineFriendRequest = declineFriendRequest;

// Cancel sent request
async function cancelFriendRequest(requestId) {
    try {
        await db.collection('friendRequests').doc(requestId).delete();
        
        await loadSocialData();
        switchFriendsTab('requests');
        showToast('Forespørsel kansellert');
    } catch (e) {
        showToast('Kunne ikke kansellere forespørselen', 'error');
    }
}
window.cancelFriendRequest = cancelFriendRequest;

// Remove friend
async function removeFriend(friendDocId) {
    if (!confirm('Er du sikker på at du vil fjerne denne vennen?')) return;
    
    try {
        await db.collection('users').doc(state.user.uid).collection('friends').doc(friendDocId).delete();
        
        await loadSocialData();
        switchFriendsTab('friends');
        showToast('Venn fjernet');
    } catch (e) {
        showToast('Kunne ikke fjerne vennen', 'error');
    }
}
window.removeFriend = removeFriend;

// View friend profile
async function viewFriendProfile(friendUid) {
    try {
        const doc = await db.collection('publicProfiles').doc(friendUid).get();
        if (!doc.exists) {
            showToast('Profil ikke funnet', 'error');
            return;
        }
        
        const profile = doc.data();
        const achievements = await getFriendAchievements(friendUid);
        
        const html = `
            <div class="friend-profile">
                <div class="profile-header">
                    <div class="profile-avatar-large">
                        ${profile.photoURL ? `<img src="${profile.photoURL}" alt="">` : '👤'}
                    </div>
                    <div class="profile-details">
                        <h2>${escapeHtml(profile.displayName || 'Kokk')}</h2>
                        <div class="profile-level">
                            <span class="level-badge-large">Nivå ${profile.level || 1}</span>
                            <span class="xp-text">${profile.xp || 0} XP</span>
                        </div>
                    </div>
                </div>
                
                <div class="profile-stats-grid">
                    <div class="profile-stat">
                        <span class="stat-value">${profile.recipeCount || 0}</span>
                        <span class="stat-label">Oppskrifter</span>
                    </div>
                    <div class="profile-stat">
                        <span class="stat-value">${profile.achievementCount || 0}</span>
                        <span class="stat-label">Prestasjoner</span>
                    </div>
                    <div class="profile-stat">
                        <span class="stat-value">🔥 ${profile.cookingStreak || 0}</span>
                        <span class="stat-label">Cooking streak</span>
                    </div>
                    <div class="profile-stat">
                        <span class="stat-value">${profile.totalCooked || 0}</span>
                        <span class="stat-label">Retter laget</span>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button class="btn btn-primary" onclick="shareRecipeWithFriend('${friendUid}')">
                        📤 Del oppskrift
                    </button>
                    <button class="btn btn-secondary" onclick="challengeFriend('${friendUid}')">
                        ⚔️ Utfordre
                    </button>
                </div>
            </div>
        `;
        
        showModal(`👤 ${profile.displayName || 'Profil'}`, html, []);
        
    } catch (e) {
        console.error('View profile error:', e);
        showToast('Kunne ikke laste profilen', 'error');
    }
}
window.viewFriendProfile = viewFriendProfile;

// Get friend's achievements (placeholder - would need Firestore storage)
async function getFriendAchievements(friendUid) {
    // In a full implementation, achievements would be stored in Firestore
    return [];
}

// Share recipe with friend
function shareRecipeWithFriend(friendUid) {
    if (state.recipes.length === 0) {
        showToast('Du har ingen oppskrifter å dele', 'warning');
        return;
    }
    
    const friend = state.friends.find(f => f.friendUid === friendUid);
    const friendName = friend?.displayName || 'venn';
    
    let html = `
        <div class="share-recipe-picker">
            <h4>Velg oppskrift å dele med ${escapeHtml(friendName)}</h4>
            <div class="recipe-picker-list">
    `;
    
    for (const recipe of state.recipes) {
        html += `
            <div class="recipe-picker-item" onclick="confirmShareRecipe('${recipe.id}', '${friendUid}')">
                <span class="recipe-picker-name">${escapeHtml(recipe.name)}</span>
                <span class="recipe-picker-icon">📤</span>
            </div>
        `;
    }
    
    html += `</div></div>`;
    
    showModal('📤 Del oppskrift', html, []);
}
window.shareRecipeWithFriend = shareRecipeWithFriend;

// Confirm and share recipe
async function confirmShareRecipe(recipeId, friendUid) {
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    try {
        await db.collection('sharedRecipes').add({
            fromUid: state.user.uid,
            fromName: state.user.displayName,
            fromPhoto: state.user.photoURL,
            toUid: friendUid,
            recipeName: recipe.name,
            recipeData: {
                name: recipe.name,
                category: recipe.category,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                servings: recipe.servings,
                prepTime: recipe.prepTime,
                notes: recipe.notes,
                tags: recipe.tags,
                images: recipe.images?.slice(0, 2) || [] // Limit images
            },
            sharedAt: firebase.firestore.FieldValue.serverTimestamp(),
            viewed: false
        });
        
        closeModal();
        showToast(`"${recipe.name}" delt! 🎉`, 'success');
        
        // Achievement
        const earned = JSON.parse(localStorage.getItem('kokebok_achievements') || '[]');
        if (!earned.includes('firstShare')) {
            unlockAchievement('firstShare');
        }
        
        addXP(10, 'Delte oppskrift');
        
    } catch (e) {
        console.error('Share recipe error:', e);
        showToast('Kunne ikke dele oppskriften', 'error');
    }
}
window.confirmShareRecipe = confirmShareRecipe;

// View shared recipe
async function viewSharedRecipe(sharedId) {
    const shared = state.sharedRecipes.find(r => r.id === sharedId);
    if (!shared) return;
    
    // Mark as viewed
    if (!shared.viewed) {
        try {
            await db.collection('sharedRecipes').doc(sharedId).update({ viewed: true });
            shared.viewed = true;
        } catch (e) {}
    }
    
    const recipe = shared.recipeData;
    
    const html = `
        <div class="shared-recipe-view">
            <div class="shared-from-banner">
                🎁 Delt fra ${escapeHtml(shared.fromName)}
            </div>
            
            <h2>${escapeHtml(recipe.name)}</h2>
            
            ${recipe.images?.length > 0 ? `
                <div class="shared-recipe-image">
                    <img src="${recipe.images[0]}" alt="${recipe.name}">
                </div>
            ` : ''}
            
            <div class="recipe-details-row">
                ${recipe.servings ? `<span>👥 ${escapeHtml(recipe.servings)}</span>` : ''}
                ${recipe.prepTime ? `<span>⏱️ ${escapeHtml(recipe.prepTime)}</span>` : ''}
            </div>
            
            ${recipe.ingredients ? `
                <div class="recipe-section">
                    <h4>🥄 Ingredienser</h4>
                    <pre>${escapeHtml(recipe.ingredients)}</pre>
                </div>
            ` : ''}
            
            ${recipe.instructions ? `
                <div class="recipe-section">
                    <h4>👩‍🍳 Fremgangsmåte</h4>
                    <pre>${escapeHtml(recipe.instructions)}</pre>
                </div>
            ` : ''}
            
            <div class="shared-recipe-actions">
                <button class="btn btn-primary" onclick="saveSharedRecipe('${sharedId}')">
                    💾 Lagre i min kokebok
                </button>
            </div>
        </div>
    `;
    
    showModal('🎁 Delt oppskrift', html, []);
}
window.viewSharedRecipe = viewSharedRecipe;

// Save shared recipe to own collection
async function saveSharedRecipe(sharedId) {
    const shared = state.sharedRecipes.find(r => r.id === sharedId);
    if (!shared) return;
    
    const recipe = shared.recipeData;
    
    try {
        // Add to own recipes
        const newRecipe = {
            ...recipe,
            source: `Delt fra ${shared.fromName}`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const id = await saveToFirestore('recipes', null, newRecipe);
        state.recipes.push({ id, ...newRecipe, createdAt: { toDate: () => new Date() } });
        
        closeModal();
        showToast(`"${recipe.name}" lagret i din kokebok! 🎉`, 'success');
        
        addXP(5, 'Lagret delt oppskrift');
        checkAchievements();
        
    } catch (e) {
        console.error('Save shared recipe error:', e);
        showToast('Kunne ikke lagre oppskriften', 'error');
    }
}
window.saveSharedRecipe = saveSharedRecipe;

// Challenge friend (placeholder)
function challengeFriend(friendUid) {
    const friend = state.friends.find(f => f.friendUid === friendUid);
    const friendName = friend?.displayName || 'venn';
    
    showToast(`Utfordringsfunksjonen kommer snart! 🎯`, 'info');
}
window.challengeFriend = challengeFriend;

// Format date helper
function formatDate(date) {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'I dag';
    if (days === 1) return 'I går';
    if (days < 7) return `${days} dager siden`;
    
    return date.toLocaleDateString('nb-NO');
}

// Close modal helper
function closeModal() {
    const modal = $('modalContainer');
    if (modal) modal.classList.add('hidden');
}

// Update friend notification badge
function updateFriendNotificationBadge() {
    const badge = $('friendNotificationBadge');
    if (!badge) return;
    
    const pendingRequests = state.friendRequests?.length || 0;
    const unviewedShares = state.sharedRecipes?.filter(r => !r.viewed)?.length || 0;
    const total = pendingRequests + unviewedShares;
    
    if (total > 0) {
        badge.textContent = total > 9 ? '9+' : total;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
    
    // Also update social card on dashboard
    updateSocialCard();
}

// =============================================
// ===== PUSH NOTIFICATIONS SYSTEM =====
// =============================================

// Check if push notifications are supported
function isPushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Request push notification permission
async function requestPushPermission() {
    if (!isPushSupported()) {
        showToast('Push-varsler støttes ikke på denne enheten', 'warning');
        return false;
    }
    
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            showToast('Push-varsler aktivert! 🔔', 'success');
            await subscribeToPush();
            return true;
        } else {
            showToast('Du må tillate varsler for å motta dem', 'info');
            return false;
        }
    } catch (e) {
        console.error('Push permission error:', e);
        return false;
    }
}

// Subscribe to push notifications
async function subscribeToPush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        
        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
            // Create new subscription
            // Note: In production, you'd use your own VAPID key
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
                )
            });
        }
        
        // Save subscription to Firestore for server-side notifications
        if (state.user) {
            await db.collection('pushSubscriptions').doc(state.user.uid).set({
                subscription: JSON.stringify(subscription),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        console.log('✓ Push subscription saved');
        return subscription;
    } catch (e) {
        console.error('Push subscription error:', e);
        return null;
    }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Show local notification (when app is in foreground)
function showLocalNotification(title, body, options = {}) {
    if (!state.settings.pushNotifications) return;
    if (Notification.permission !== 'granted') return;
    
    const notification = new Notification(title, {
        body: body,
        icon: './icons/icon-192.svg',
        badge: './icons/icon-192.svg',
        tag: options.tag || 'kokebok-notification',
        renotify: options.renotify || false,
        data: options.data || {},
        ...options
    });
    
    notification.onclick = () => {
        window.focus();
        if (options.onClick) options.onClick();
        notification.close();
    };
    
    return notification;
}

// Schedule a notification for later
function scheduleNotification(title, body, delayMs, options = {}) {
    if (!state.settings.pushNotifications) return null;
    
    const timeoutId = setTimeout(() => {
        showLocalNotification(title, body, options);
    }, delayMs);
    
    return timeoutId;
}

// Send notification through service worker (works when app is closed)
async function sendPushNotification(title, body, data = {}) {
    if (!state.settings.pushNotifications) return;
    
    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
            body: body,
            icon: './icons/icon-192.svg',
            badge: './icons/icon-192.svg',
            vibrate: [200, 100, 200],
            data: data,
            actions: [
                { action: 'open', title: 'Åpne' },
                { action: 'dismiss', title: 'Lukk' }
            ]
        });
    } catch (e) {
        console.error('Push notification error:', e);
    }
}

// Notify about friend request
function notifyFriendRequest(fromName) {
    if (!state.settings.friendNotifications) return;
    sendPushNotification(
        '👥 Ny venneforespørsel',
        `${fromName} vil bli din venn!`,
        { type: 'friendRequest' }
    );
}

// Notify about shared recipe
function notifySharedRecipe(fromName, recipeName) {
    if (!state.settings.shareNotifications) return;
    sendPushNotification(
        '🎁 Ny oppskrift delt',
        `${fromName} delte "${recipeName}" med deg!`,
        { type: 'sharedRecipe' }
    );
}

// Notify meal reminder
function notifyMealReminder(mealName) {
    if (!state.settings.reminderNotifications) return;
    sendPushNotification(
        '🍽️ Måltidspåminnelse',
        `Tid for å lage ${mealName}!`,
        { type: 'mealReminder' }
    );
}

// =============================================
// ===== KITCHEN EQUIPMENT TRACKER =====
// =============================================

const EQUIPMENT_CATEGORIES = [
    { id: 'appliances', name: 'Kjøkkenmaskiner', icon: '🔌', examples: 'Kjøkkenmaskin, blender, mikser' },
    { id: 'cookware', name: 'Gryter & Panner', icon: '🍳', examples: 'Stekepanner, kasseroller, wok' },
    { id: 'bakeware', name: 'Bakeutstyr', icon: '🧁', examples: 'Kakeformer, bakeplater, hevekurver' },
    { id: 'knives', name: 'Kniver', icon: '🔪', examples: 'Kokkekniv, brødkniv, urtekniv' },
    { id: 'utensils', name: 'Redskaper', icon: '🥄', examples: 'Sleiver, visper, spatler' },
    { id: 'cutting', name: 'Skjærebrett', icon: '🪵', examples: 'Trefjøler, plastfjøler' },
    { id: 'storage', name: 'Oppbevaring', icon: '🫙', examples: 'Bokser, glass, vakuumposer' },
    { id: 'measuring', name: 'Måling', icon: '⚖️', examples: 'Vekt, målebeger, termometer' },
    { id: 'serving', name: 'Servering', icon: '🍽️', examples: 'Fat, boller, serveringsutstyr' },
    { id: 'specialty', name: 'Spesialutstyr', icon: '🦞', examples: 'Pastamaskin, sous vide, røykoven' },
    { id: 'other', name: 'Annet', icon: '📦', examples: 'Alt annet kjøkkenutstyr' }
];

const EQUIPMENT_CONDITIONS = [
    { id: 'new', name: 'Ny', color: '#4CAF50' },
    { id: 'excellent', name: 'Utmerket', color: '#8BC34A' },
    { id: 'good', name: 'God', color: '#FFC107' },
    { id: 'fair', name: 'Brukbar', color: '#FF9800' },
    { id: 'poor', name: 'Slitt', color: '#F44336' }
];

// Load equipment from Firestore
async function loadEquipment() {
    if (!state.user) return;
    
    try {
        const snapshot = await userDoc('equipment').get();
        state.equipment = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`✓ Lastet ${state.equipment.length} utstyr`);
    } catch (e) {
        console.warn('Kunne ikke laste utstyr:', e.message);
        state.equipment = [];
    }
}

// Open equipment panel
function openEquipmentPanel() {
    loadEquipment().then(() => {
        renderEquipmentPanel();
    });
}
window.openEquipmentPanel = openEquipmentPanel;

function renderEquipmentPanel() {
    const totalItems = state.equipment.length;
    const totalValue = state.equipment.reduce((sum, e) => sum + (parseFloat(e.price) || 0), 0);
    const categoryCounts = {};
    
    state.equipment.forEach(e => {
        categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    });
    
    let html = `
        <div class="equipment-panel">
            <!-- Stats Overview -->
            <div class="equipment-stats-premium">
                <div class="equip-stat">
                    <span class="equip-stat-value">${totalItems}</span>
                    <span class="equip-stat-label">Utstyr totalt</span>
                </div>
                <div class="equip-stat">
                    <span class="equip-stat-value">${formatCurrency(totalValue)}</span>
                    <span class="equip-stat-label">Estimert verdi</span>
                </div>
                <div class="equip-stat">
                    <span class="equip-stat-value">${Object.keys(categoryCounts).length}</span>
                    <span class="equip-stat-label">Kategorier</span>
                </div>
            </div>
            
            <!-- Category Tabs -->
            <div class="equipment-categories-scroll">
                <button class="equip-cat-btn active" data-cat="all" onclick="filterEquipment('all')">
                    📋 Alle <span class="cat-count">${totalItems}</span>
                </button>
                ${EQUIPMENT_CATEGORIES.map(cat => `
                    <button class="equip-cat-btn" data-cat="${cat.id}" onclick="filterEquipment('${cat.id}')">
                        ${cat.icon} ${cat.name} <span class="cat-count">${categoryCounts[cat.id] || 0}</span>
                    </button>
                `).join('')}
            </div>
            
            <!-- Add Button -->
            <button class="add-equipment-btn" onclick="openEquipmentEditor()">
                <span>➕</span> Legg til utstyr
            </button>
            
            <!-- Equipment Grid -->
            <div id="equipmentGrid" class="equipment-grid">
                ${renderEquipmentGrid('all')}
            </div>
            
            <!-- Compare with Friends -->
            ${state.friends.length > 0 ? `
                <div class="equipment-compare-section">
                    <h4>👥 Sammenlign med venner</h4>
                    <button class="btn btn-secondary" onclick="compareEquipmentWithFriends()">
                        📊 Se sammenligning
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    showModal('🍳 Mitt Kjøkkenutstyr', html, []);
}

function renderEquipmentGrid(categoryFilter) {
    let items = state.equipment;
    
    if (categoryFilter && categoryFilter !== 'all') {
        items = items.filter(e => e.category === categoryFilter);
    }
    
    if (items.length === 0) {
        return `
            <div class="equipment-empty">
                <span class="empty-icon">🍳</span>
                <p>Ingen utstyr i denne kategorien</p>
                <p class="empty-hint">Legg til ditt kjøkkenutstyr for full oversikt!</p>
            </div>
        `;
    }
    
    // Sort by category and then by name
    items.sort((a, b) => {
        if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
        }
        return (a.name || '').localeCompare(b.name || '');
    });
    
    return items.map(item => {
        const cat = EQUIPMENT_CATEGORIES.find(c => c.id === item.category) || EQUIPMENT_CATEGORIES[10];
        const condition = EQUIPMENT_CONDITIONS.find(c => c.id === item.condition) || EQUIPMENT_CONDITIONS[2];
        const ageText = item.purchaseDate ? getEquipmentAge(item.purchaseDate) : '';
        
        return `
            <div class="equipment-card" onclick="viewEquipment('${item.id}')">
                <div class="equip-card-header">
                    <span class="equip-icon">${cat.icon}</span>
                    <span class="equip-condition" style="background: ${condition.color}">${condition.name}</span>
                </div>
                ${item.image ? `<img src="${item.image}" class="equip-image" alt="${item.name}">` : ''}
                <div class="equip-card-body">
                    <h4 class="equip-name">${escapeHtml(item.name)}</h4>
                    ${item.brand ? `<span class="equip-brand">${escapeHtml(item.brand)}</span>` : ''}
                    ${item.model ? `<span class="equip-model">${escapeHtml(item.model)}</span>` : ''}
                    ${ageText ? `<span class="equip-age">📅 ${ageText}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function filterEquipment(category) {
    document.querySelectorAll('.equip-cat-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === category);
    });
    
    const grid = $('equipmentGrid');
    if (grid) {
        grid.innerHTML = renderEquipmentGrid(category);
    }
}
window.filterEquipment = filterEquipment;

function getEquipmentAge(purchaseDate) {
    if (!purchaseDate) return '';
    
    const purchase = new Date(purchaseDate);
    const now = new Date();
    const diffMs = now - purchase;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} dager`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} måneder`;
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (months === 0) return `${years} år`;
    return `${years} år, ${months} mnd`;
}

function formatCurrency(amount) {
    if (!amount || isNaN(amount)) return 'kr 0';
    return `kr ${Math.round(amount).toLocaleString('nb-NO')}`;
}

// Open equipment editor
function openEquipmentEditor(equipmentId = null) {
    const existing = equipmentId ? state.equipment.find(e => e.id === equipmentId) : null;
    
    const html = `
        <div class="equipment-editor">
            <div class="form-group">
                <label>Navn *</label>
                <input type="text" id="equipName" class="form-input" placeholder="F.eks. KitchenAid Artisan" 
                    value="${existing?.name || ''}">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Kategori *</label>
                    <select id="equipCategory" class="form-select">
                        ${EQUIPMENT_CATEGORIES.map(cat => `
                            <option value="${cat.id}" ${existing?.category === cat.id ? 'selected' : ''}>
                                ${cat.icon} ${cat.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Tilstand</label>
                    <select id="equipCondition" class="form-select">
                        ${EQUIPMENT_CONDITIONS.map(cond => `
                            <option value="${cond.id}" ${existing?.condition === cond.id ? 'selected' : ''}>
                                ${cond.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Merke</label>
                    <input type="text" id="equipBrand" class="form-input" placeholder="F.eks. KitchenAid" 
                        value="${existing?.brand || ''}">
                </div>
                <div class="form-group">
                    <label>Modell</label>
                    <input type="text" id="equipModel" class="form-input" placeholder="F.eks. 5KSM185PS" 
                        value="${existing?.model || ''}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Kjøpt</label>
                    <input type="date" id="equipPurchaseDate" class="form-input" 
                        value="${existing?.purchaseDate || ''}">
                </div>
                <div class="form-group">
                    <label>Pris (kr)</label>
                    <input type="number" id="equipPrice" class="form-input" placeholder="0" 
                        value="${existing?.price || ''}">
                </div>
            </div>
            
            <div class="form-group">
                <label>Kjøpt hos</label>
                <input type="text" id="equipStore" class="form-input" placeholder="F.eks. Elkjøp, Tilbords" 
                    value="${existing?.store || ''}">
            </div>
            
            <div class="form-group">
                <label>Serienummer / Garantinummer</label>
                <input type="text" id="equipSerial" class="form-input" placeholder="Valgfritt" 
                    value="${existing?.serial || ''}">
            </div>
            
            <div class="form-group">
                <label>Garantiutløp</label>
                <input type="date" id="equipWarrantyEnd" class="form-input" 
                    value="${existing?.warrantyEnd || ''}">
            </div>
            
            <div class="form-group">
                <label>Notater</label>
                <textarea id="equipNotes" class="form-textarea" rows="3" 
                    placeholder="Eventuelle notater...">${existing?.notes || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label>Bilde</label>
                <div class="image-upload-area" onclick="$('equipImageInput').click()">
                    <input type="file" id="equipImageInput" accept="image/*" hidden onchange="previewEquipmentImage(event)">
                    <div id="equipImagePreview" class="image-preview">
                        ${existing?.image ? `<img src="${existing.image}" alt="Utstyr">` : '<span>📷 Klikk for å legge til bilde</span>'}
                    </div>
                </div>
            </div>
            
            <div class="form-group checkbox-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="equipShareWithFriends" ${existing?.shareWithFriends ? 'checked' : ''}>
                    <span>Del dette utstyret med venner (synlig i sammenligning)</span>
                </label>
            </div>
        </div>
    `;
    
    const buttons = [
        { text: 'Avbryt', class: 'btn-secondary', onClick: closeModal },
        { text: existing ? '💾 Oppdater' : '➕ Legg til', class: 'btn-primary', onClick: () => saveEquipment(equipmentId) }
    ];
    
    if (existing) {
        buttons.unshift({ text: '🗑️ Slett', class: 'btn-danger', onClick: () => deleteEquipment(equipmentId) });
    }
    
    showModal(existing ? '✏️ Rediger utstyr' : '➕ Legg til utstyr', html, buttons);
}
window.openEquipmentEditor = openEquipmentEditor;

let tempEquipmentImage = null;

function previewEquipmentImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        tempEquipmentImage = e.target.result;
        const preview = $('equipImagePreview');
        if (preview) {
            preview.innerHTML = `<img src="${tempEquipmentImage}" alt="Forhåndsvisning">`;
        }
    };
    reader.readAsDataURL(file);
}
window.previewEquipmentImage = previewEquipmentImage;

async function saveEquipment(existingId = null) {
    const name = $('equipName')?.value?.trim();
    const category = $('equipCategory')?.value;
    
    if (!name) {
        showToast('Navn er påkrevd', 'error');
        return;
    }
    
    const equipmentData = {
        name: name,
        category: category,
        condition: $('equipCondition')?.value || 'good',
        brand: $('equipBrand')?.value?.trim() || '',
        model: $('equipModel')?.value?.trim() || '',
        purchaseDate: $('equipPurchaseDate')?.value || '',
        price: parseFloat($('equipPrice')?.value) || 0,
        store: $('equipStore')?.value?.trim() || '',
        serial: $('equipSerial')?.value?.trim() || '',
        warrantyEnd: $('equipWarrantyEnd')?.value || '',
        notes: $('equipNotes')?.value?.trim() || '',
        shareWithFriends: $('equipShareWithFriends')?.checked || false,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Handle image
    if (tempEquipmentImage) {
        equipmentData.image = tempEquipmentImage;
    } else if (existingId) {
        const existing = state.equipment.find(e => e.id === existingId);
        if (existing?.image) {
            equipmentData.image = existing.image;
        }
    }
    
    try {
        if (existingId) {
            await saveToFirestore('equipment', existingId, equipmentData);
            const index = state.equipment.findIndex(e => e.id === existingId);
            if (index >= 0) {
                state.equipment[index] = { id: existingId, ...equipmentData };
            }
            showToast('Utstyr oppdatert! ✓', 'success');
        } else {
            equipmentData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            const newId = await saveToFirestore('equipment', null, equipmentData);
            state.equipment.push({ id: newId, ...equipmentData });
            showToast('Utstyr lagt til! 🎉', 'success');
            addXP(5, 'La til utstyr');
            
            // Achievement check
            if (state.equipment.length >= 10) {
                unlockAchievement('equipmentCollector');
            }
            if (state.equipment.length >= 50) {
                unlockAchievement('kitchenMaster');
            }
        }
        
        tempEquipmentImage = null;
        closeModal();
        openEquipmentPanel();
        
    } catch (e) {
        console.error('Save equipment error:', e);
        showToast('Kunne ikke lagre utstyret', 'error');
    }
}
window.saveEquipment = saveEquipment;

async function deleteEquipment(equipmentId) {
    if (!confirm('Er du sikker på at du vil slette dette utstyret?')) return;
    
    try {
        await deleteFromFirestore('equipment', equipmentId);
        state.equipment = state.equipment.filter(e => e.id !== equipmentId);
        showToast('Utstyr slettet', 'success');
        closeModal();
        openEquipmentPanel();
    } catch (e) {
        showToast('Kunne ikke slette utstyret', 'error');
    }
}
window.deleteEquipment = deleteEquipment;

function viewEquipment(equipmentId) {
    const item = state.equipment.find(e => e.id === equipmentId);
    if (!item) return;
    
    const cat = EQUIPMENT_CATEGORIES.find(c => c.id === item.category) || EQUIPMENT_CATEGORIES[10];
    const condition = EQUIPMENT_CONDITIONS.find(c => c.id === item.condition) || EQUIPMENT_CONDITIONS[2];
    const ageText = item.purchaseDate ? getEquipmentAge(item.purchaseDate) : 'Ukjent';
    const warrantyStatus = getWarrantyStatus(item.warrantyEnd);
    
    const html = `
        <div class="equipment-detail">
            ${item.image ? `
                <div class="equip-detail-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
            ` : ''}
            
            <div class="equip-detail-header">
                <span class="equip-detail-icon">${cat.icon}</span>
                <div class="equip-detail-title">
                    <h2>${escapeHtml(item.name)}</h2>
                    ${item.brand ? `<span class="equip-detail-brand">${escapeHtml(item.brand)}</span>` : ''}
                </div>
                <span class="equip-detail-condition" style="background: ${condition.color}">${condition.name}</span>
            </div>
            
            <div class="equip-detail-specs">
                ${item.model ? `
                    <div class="spec-row">
                        <span class="spec-label">Modell</span>
                        <span class="spec-value">${escapeHtml(item.model)}</span>
                    </div>
                ` : ''}
                <div class="spec-row">
                    <span class="spec-label">Kategori</span>
                    <span class="spec-value">${cat.icon} ${cat.name}</span>
                </div>
                ${item.purchaseDate ? `
                    <div class="spec-row">
                        <span class="spec-label">Kjøpt</span>
                        <span class="spec-value">${new Date(item.purchaseDate).toLocaleDateString('nb-NO')} (${ageText})</span>
                    </div>
                ` : ''}
                ${item.price ? `
                    <div class="spec-row">
                        <span class="spec-label">Pris</span>
                        <span class="spec-value">${formatCurrency(item.price)}</span>
                    </div>
                ` : ''}
                ${item.store ? `
                    <div class="spec-row">
                        <span class="spec-label">Kjøpt hos</span>
                        <span class="spec-value">${escapeHtml(item.store)}</span>
                    </div>
                ` : ''}
                ${item.serial ? `
                    <div class="spec-row">
                        <span class="spec-label">Serienr.</span>
                        <span class="spec-value">${escapeHtml(item.serial)}</span>
                    </div>
                ` : ''}
                ${item.warrantyEnd ? `
                    <div class="spec-row">
                        <span class="spec-label">Garanti</span>
                        <span class="spec-value ${warrantyStatus.class}">${warrantyStatus.text}</span>
                    </div>
                ` : ''}
            </div>
            
            ${item.notes ? `
                <div class="equip-detail-notes">
                    <h4>📝 Notater</h4>
                    <p>${escapeHtml(item.notes)}</p>
                </div>
            ` : ''}
            
            <div class="equip-detail-actions">
                <button class="btn btn-primary" onclick="openEquipmentEditor('${item.id}')">
                    ✏️ Rediger
                </button>
                <button class="btn btn-secondary" onclick="closeModal(); openEquipmentPanel();">
                    ← Tilbake
                </button>
            </div>
        </div>
    `;
    
    showModal(`${cat.icon} ${item.name}`, html, []);
}
window.viewEquipment = viewEquipment;

function getWarrantyStatus(warrantyEnd) {
    if (!warrantyEnd) return { text: 'Ukjent', class: '' };
    
    const endDate = new Date(warrantyEnd);
    const now = new Date();
    const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return { text: `Utløpt for ${Math.abs(diffDays)} dager siden`, class: 'warranty-expired' };
    } else if (diffDays <= 30) {
        return { text: `Utløper om ${diffDays} dager!`, class: 'warranty-warning' };
    } else if (diffDays <= 90) {
        return { text: `Utløper ${endDate.toLocaleDateString('nb-NO')}`, class: 'warranty-soon' };
    } else {
        return { text: `Gyldig til ${endDate.toLocaleDateString('nb-NO')}`, class: 'warranty-active' };
    }
}

// Compare equipment with friends
async function compareEquipmentWithFriends() {
    if (state.friends.length === 0) {
        showToast('Legg til venner for å sammenligne utstyr', 'info');
        return;
    }
    
    const myEquipment = state.equipment.filter(e => e.shareWithFriends);
    
    // Load friends' equipment
    let friendsData = [];
    for (const friend of state.friends) {
        try {
            const snapshot = await db.collection('users').doc(friend.friendUid)
                .collection('equipment')
                .where('shareWithFriends', '==', true)
                .get();
            
            const friendEquipment = snapshot.docs.map(doc => doc.data());
            friendsData.push({
                name: friend.displayName,
                equipment: friendEquipment
            });
        } catch (e) {
            // Skip if can't access
        }
    }
    
    const html = `
        <div class="equipment-comparison">
            <h4>📊 Utstyrssammenligning</h4>
            
            <div class="comparison-table">
                <div class="comparison-row header">
                    <span>Kategori</span>
                    <span>Du</span>
                    ${friendsData.map(f => `<span>${escapeHtml(f.name)}</span>`).join('')}
                </div>
                
                ${EQUIPMENT_CATEGORIES.map(cat => {
                    const myCount = myEquipment.filter(e => e.category === cat.id).length;
                    const friendCounts = friendsData.map(f => 
                        f.equipment.filter(e => e.category === cat.id).length
                    );
                    
                    if (myCount === 0 && friendCounts.every(c => c === 0)) return '';
                    
                    return `
                        <div class="comparison-row">
                            <span>${cat.icon} ${cat.name}</span>
                            <span class="count">${myCount}</span>
                            ${friendCounts.map(c => `<span class="count">${c}</span>`).join('')}
                        </div>
                    `;
                }).join('')}
                
                <div class="comparison-row total">
                    <span>Totalt</span>
                    <span class="count">${myEquipment.length}</span>
                    ${friendsData.map(f => `<span class="count">${f.equipment.length}</span>`).join('')}
                </div>
            </div>
            
            <p class="comparison-note">💡 Kun delt utstyr vises i sammenligningen</p>
        </div>
    `;
    
    showModal('📊 Sammenlign utstyr', html, [
        { text: 'Lukk', class: 'btn-secondary', onClick: closeModal }
    ]);
}
window.compareEquipmentWithFriends = compareEquipmentWithFriends;

// =============================================
// ===== PANTRY TRACKER (BONUS) =====
// =============================================

async function loadPantry() {
    if (!state.user) return;
    
    try {
        const snapshot = await userDoc('pantry').get();
        state.pantryItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        state.pantryItems = [];
    }
}

function openPantryTracker() {
    loadPantry().then(() => {
        renderPantryPanel();
    });
}
window.openPantryTracker = openPantryTracker;

function renderPantryPanel() {
    const expiringItems = state.pantryItems.filter(item => {
        if (!item.expiryDate) return false;
        const days = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return days <= 7 && days >= 0;
    });
    
    const expiredItems = state.pantryItems.filter(item => {
        if (!item.expiryDate) return false;
        return new Date(item.expiryDate) < new Date();
    });
    
    // Calculate total pantry value
    const totalValue = state.pantryItems.reduce((sum, item) => {
        return sum + (item.estimatedPrice || 0) * (item.quantity || 1);
    }, 0);
    
    let html = `
        <div class="pantry-panel">
            <!-- AI Scanner Button -->
            <div class="pantry-ai-scanner">
                <button class="ai-scan-btn" onclick="openPantryAIScanner()">
                    <span class="ai-icon">📸</span>
                    <div class="ai-scan-text">
                        <strong>AI Matkammer-skanner</strong>
                        <small>Ta bilde av kjøleskapet ditt</small>
                    </div>
                    <span class="ai-badge">AI</span>
                </button>
            </div>
            
            <!-- Stats Bar -->
            <div class="pantry-stats-bar">
                <div class="pantry-stat-item">
                    <span class="stat-value">${state.pantryItems.length}</span>
                    <span class="stat-label">varer</span>
                </div>
                <div class="pantry-stat-item">
                    <span class="stat-value">${totalValue > 0 ? formatCurrency(totalValue) : '-'}</span>
                    <span class="stat-label">verdi</span>
                </div>
                <div class="pantry-stat-item ${expiringItems.length > 0 ? 'warning' : ''}">
                    <span class="stat-value">${expiringItems.length}</span>
                    <span class="stat-label">utløper</span>
                </div>
            </div>
            
            ${expiringItems.length > 0 || expiredItems.length > 0 ? `
                <div class="pantry-alerts">
                    ${expiredItems.length > 0 ? `
                        <div class="alert alert-danger">
                            ⚠️ ${expiredItems.length} varer har gått ut på dato!
                        </div>
                    ` : ''}
                    ${expiringItems.length > 0 ? `
                        <div class="alert alert-warning">
                            ⏰ ${expiringItems.length} varer utløper snart!
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            <div class="pantry-actions">
                <button class="add-pantry-btn" onclick="openPantryEditor()">
                    ➕ Legg til vare
                </button>
                <button class="price-check-btn" onclick="openPriceChecker()">
                    💰 Prissjekk
                </button>
            </div>
            
            <div id="pantryList" class="pantry-list">
                ${renderPantryList()}
            </div>
        </div>
    `;
    
    showModal('🫙 Mitt Matkammer', html, []);
}

function renderPantryList() {
    if (state.pantryItems.length === 0) {
        return `
            <div class="empty-state">
                <span class="empty-icon">🫙</span>
                <p>Matkammeret er tomt</p>
                <p class="empty-hint">Legg til varer for å holde oversikt over hva du har!</p>
            </div>
        `;
    }
    
    // Group by category
    const groups = {};
    state.pantryItems.forEach(item => {
        const cat = item.category || 'other';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
    });
    
    return Object.entries(groups).map(([cat, items]) => `
        <div class="pantry-group">
            <h4>${getPantryCategoryIcon(cat)} ${getPantryCategoryName(cat)}</h4>
            <div class="pantry-items">
                ${items.map(item => {
                    const expiryStatus = getExpiryStatus(item.expiryDate);
                    return `
                        <div class="pantry-item ${expiryStatus.class}" onclick="editPantryItem('${item.id}')">
                            <span class="pantry-name">${escapeHtml(item.name)}</span>
                            <span class="pantry-qty">${item.quantity || ''} ${item.unit || ''}</span>
                            ${expiryStatus.text ? `<span class="pantry-expiry">${expiryStatus.text}</span>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');
}

function getExpiryStatus(expiryDate) {
    if (!expiryDate) return { text: '', class: '' };
    
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { text: `Utløpt!`, class: 'expired' };
    if (days === 0) return { text: 'Utløper i dag!', class: 'expiring-today' };
    if (days <= 3) return { text: `${days} dager`, class: 'expiring-soon' };
    if (days <= 7) return { text: `${days} dager`, class: 'expiring-week' };
    
    return { text: new Date(expiryDate).toLocaleDateString('nb-NO'), class: '' };
}

// Pantry categories
const PANTRY_CATEGORIES = [
    { id: 'vegetables', name: 'Grønnsaker', icon: '🥬' },
    { id: 'fruits', name: 'Frukt', icon: '🍎' },
    { id: 'dairy', name: 'Meieri', icon: '🧀' },
    { id: 'meat', name: 'Kjøtt & Fisk', icon: '🥩' },
    { id: 'frozen', name: 'Frysevarer', icon: '🧊' },
    { id: 'canned', name: 'Hermetikk', icon: '🥫' },
    { id: 'grains', name: 'Korn & Pasta', icon: '🍝' },
    { id: 'spices', name: 'Krydder', icon: '🧂' },
    { id: 'baking', name: 'Bakevarer', icon: '🧁' },
    { id: 'drinks', name: 'Drikke', icon: '🍶' },
    { id: 'snacks', name: 'Snacks', icon: '🍿' },
    { id: 'condiments', name: 'Sauser', icon: '🍯' },
    { id: 'other', name: 'Annet', icon: '📦' }
];

function getPantryCategoryIcon(categoryId) {
    const cat = PANTRY_CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.icon : '📦';
}

function getPantryCategoryName(categoryId) {
    const cat = PANTRY_CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.name : 'Annet';
}

function openPantryEditor(itemId = null) {
    const item = itemId ? state.pantryItems.find(i => i.id === itemId) : null;
    const isEdit = !!item;
    
    const html = `
        <div class="pantry-editor">
            <div class="form-group">
                <label>Varenavn *</label>
                <input type="text" id="pantryItemName" value="${item?.name || ''}" placeholder="f.eks. Melk" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Antall</label>
                    <input type="number" id="pantryItemQty" value="${item?.quantity || 1}" min="0" step="0.1">
                </div>
                <div class="form-group">
                    <label>Enhet</label>
                    <select id="pantryItemUnit">
                        <option value="stk" ${item?.unit === 'stk' ? 'selected' : ''}>stk</option>
                        <option value="liter" ${item?.unit === 'liter' ? 'selected' : ''}>liter</option>
                        <option value="dl" ${item?.unit === 'dl' ? 'selected' : ''}>dl</option>
                        <option value="kg" ${item?.unit === 'kg' ? 'selected' : ''}>kg</option>
                        <option value="g" ${item?.unit === 'g' ? 'selected' : ''}>g</option>
                        <option value="pk" ${item?.unit === 'pk' ? 'selected' : ''}>pakke</option>
                        <option value="boks" ${item?.unit === 'boks' ? 'selected' : ''}>boks</option>
                        <option value="pose" ${item?.unit === 'pose' ? 'selected' : ''}>pose</option>
                        <option value="flaske" ${item?.unit === 'flaske' ? 'selected' : ''}>flaske</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label>Kategori</label>
                <select id="pantryItemCategory">
                    ${PANTRY_CATEGORIES.map(cat => `
                        <option value="${cat.id}" ${item?.category === cat.id ? 'selected' : ''}>
                            ${cat.icon} ${cat.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>Utløpsdato</label>
                <input type="date" id="pantryItemExpiry" value="${item?.expiryDate || ''}">
            </div>
            
            <div class="form-group">
                <label>Plassering</label>
                <select id="pantryItemLocation">
                    <option value="fridge" ${item?.location === 'fridge' ? 'selected' : ''}>🧊 Kjøleskap</option>
                    <option value="freezer" ${item?.location === 'freezer' ? 'selected' : ''}>❄️ Fryser</option>
                    <option value="pantry" ${item?.location === 'pantry' ? 'selected' : ''}>🗄️ Skap</option>
                    <option value="counter" ${item?.location === 'counter' ? 'selected' : ''}>🍎 Benk</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Notat</label>
                <input type="text" id="pantryItemNote" value="${item?.note || ''}" placeholder="f.eks. Åpnet 15. jan">
            </div>
            
            ${isEdit ? `
                <button class="delete-pantry-btn" onclick="deletePantryItem('${item.id}')">
                    🗑️ Slett vare
                </button>
            ` : ''}
        </div>
    `;
    
    const buttons = [
        { text: 'Avbryt', onClick: () => closeModal() },
        { 
            text: isEdit ? 'Oppdater' : 'Legg til', 
            primary: true, 
            onClick: () => savePantryItem(itemId)
        }
    ];
    
    showModal(isEdit ? '✏️ Rediger vare' : '➕ Ny vare', html, buttons);
    
    // Focus name input
    setTimeout(() => $('pantryItemName')?.focus(), 100);
}

function editPantryItem(itemId) {
    openPantryEditor(itemId);
}

async function savePantryItem(itemId = null) {
    const name = $('pantryItemName')?.value?.trim();
    if (!name) {
        showToast('Skriv inn varenavn', 'error');
        return;
    }
    
    const itemData = {
        name,
        quantity: parseFloat($('pantryItemQty')?.value) || 1,
        unit: $('pantryItemUnit')?.value || 'stk',
        category: $('pantryItemCategory')?.value || 'other',
        expiryDate: $('pantryItemExpiry')?.value || null,
        location: $('pantryItemLocation')?.value || 'pantry',
        note: $('pantryItemNote')?.value?.trim() || '',
        updatedAt: new Date().toISOString()
    };
    
    try {
        if (itemId) {
            // Update existing item
            await saveToFirestore('pantry', itemId, { ...itemData, id: itemId });
            const index = state.pantryItems.findIndex(i => i.id === itemId);
            if (index !== -1) {
                state.pantryItems[index] = { ...itemData, id: itemId };
            }
            showToast('Vare oppdatert!', 'success');
        } else {
            // Add new item
            const newId = 'pantry_' + Date.now();
            itemData.id = newId;
            itemData.createdAt = new Date().toISOString();
            await saveToFirestore('pantry', newId, itemData);
            state.pantryItems.push(itemData);
            showToast('Vare lagt til!', 'success');
            
            // Check achievement
            if (state.pantryItems.length >= 20) {
                unlockAchievement('pantryOrganizer');
            }
        }
        
        closeModal();
        openPantryTracker(); // Refresh view
        
    } catch (error) {
        console.error('Error saving pantry item:', error);
        showToast('Kunne ikke lagre vare', 'error');
    }
}

async function deletePantryItem(itemId) {
    if (!confirm('Vil du slette denne varen fra matkammeret?')) return;
    
    try {
        await deleteFromFirestore('pantry', itemId);
        state.pantryItems = state.pantryItems.filter(i => i.id !== itemId);
        showToast('Vare slettet', 'success');
        closeModal();
        openPantryTracker(); // Refresh view
    } catch (error) {
        console.error('Error deleting pantry item:', error);
        showToast('Kunne ikke slette vare', 'error');
    }
}

function usePantryItem(itemId) {
    const item = state.pantryItems.find(i => i.id === itemId);
    if (!item) return;
    
    if (item.quantity > 1) {
        item.quantity -= 1;
        saveToFirestore('pantry', itemId, item);
        showToast(`Brukte 1 ${item.unit} ${item.name}`, 'success');
    } else {
        if (confirm(`Dette var siste ${item.name}. Vil du slette den fra matkammeret?`)) {
            deletePantryItem(itemId);
        }
    }
    
    // Refresh display
    const listEl = $('pantryList');
    if (listEl) listEl.innerHTML = renderPantryList();
}

function checkExpiringItems() {
    const now = new Date();
    const expiringItems = state.pantryItems.filter(item => {
        if (!item.expiryDate) return false;
        const days = Math.ceil((new Date(item.expiryDate) - now) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 3;
    });
    
    if (expiringItems.length > 0 && state.settings.reminderNotifications) {
        notifyExpiringItems(expiringItems);
    }
    
    return expiringItems;
}

function notifyExpiringItems(items) {
    if (!state.settings.pushNotifications) return;
    
    const itemNames = items.slice(0, 3).map(i => i.name).join(', ');
    const more = items.length > 3 ? ` og ${items.length - 3} til` : '';
    
    showLocalNotification('⏰ Varer utløper snart!', {
        body: `${itemNames}${more} - sjekk matkammeret ditt`,
        tag: 'expiring-items'
    });
}

// ===== v4.2 - KASSAL.APP API INTEGRATION =====

async function kassalApiRequest(endpoint, params = {}) {
    const url = new URL(`${KASSAL_API_BASE}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, value);
        }
    });
    
    try {
        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${KASSAL_API_KEY}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Kassal API error:', error);
        throw error;
    }
}

// Search products
async function searchProducts(query, options = {}) {
    return kassalApiRequest('/products', {
        search: query,
        size: options.size || 20,
        sort: options.sort || 'price_asc',
        ...options
    });
}

// Get product by barcode/EAN
async function getProductByBarcode(ean) {
    return kassalApiRequest('/products/ean/' + ean);
}

// Get product details
async function getProductById(id) {
    return kassalApiRequest('/products/' + id);
}

// Get stores
async function getStores(options = {}) {
    return kassalApiRequest('/physical-stores', options);
}

// Price comparison for shopping list
async function getPriceComparison(productNames) {
    const results = [];
    
    for (const name of productNames.slice(0, 10)) { // Limit to prevent too many API calls
        try {
            const data = await searchProducts(name, { size: 5 });
            if (data.data && data.data.length > 0) {
                results.push({
                    searchTerm: name,
                    products: data.data.map(p => ({
                        name: p.name,
                        brand: p.brand,
                        price: p.current_price?.price,
                        unit_price: p.current_price?.unit_price,
                        store: p.store?.name,
                        image: p.image,
                        ean: p.ean
                    }))
                });
            }
        } catch (e) {
            console.warn(`Could not find prices for: ${name}`);
        }
    }
    
    return results;
}

// Open price checker
function openPriceChecker() {
    const html = `
        <div class="price-checker">
            <div class="price-search-box">
                <input type="text" id="priceSearchInput" placeholder="Søk etter vare..." 
                       onkeydown="if(event.key==='Enter')searchPrices()">
                <button class="price-search-btn" onclick="searchPrices()">
                    🔍 Søk
                </button>
            </div>
            
            <div class="quick-price-btns">
                <button onclick="searchPrices('melk')">🥛 Melk</button>
                <button onclick="searchPrices('brød')">🍞 Brød</button>
                <button onclick="searchPrices('egg')">🥚 Egg</button>
                <button onclick="searchPrices('ost')">🧀 Ost</button>
                <button onclick="searchPrices('kylling')">🍗 Kylling</button>
                <button onclick="searchPrices('laks')">🐟 Laks</button>
            </div>
            
            <div id="priceResults" class="price-results">
                <div class="price-placeholder">
                    <span class="price-icon">💰</span>
                    <p>Søk etter en vare for å sammenligne priser</p>
                    <p class="price-hint">Data fra norske matbutikker via Kassal.app</p>
                </div>
            </div>
        </div>
    `;
    
    showModal('💰 Prissammenligning', html, []);
    setTimeout(() => $('priceSearchInput')?.focus(), 100);
}
window.openPriceChecker = openPriceChecker;

async function searchPrices(query) {
    const searchInput = $('priceSearchInput');
    const searchTerm = query || searchInput?.value?.trim();
    
    if (!searchTerm) {
        showToast('Skriv inn en vare å søke etter', 'warning');
        return;
    }
    
    const resultsDiv = $('priceResults');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Søker etter priser...</p>
        </div>
    `;
    
    try {
        const data = await searchProducts(searchTerm, { size: 15 });
        
        if (!data.data || data.data.length === 0) {
            resultsDiv.innerHTML = `
                <div class="no-results">
                    <span>😕</span>
                    <p>Ingen produkter funnet for "${escapeHtml(searchTerm)}"</p>
                    <p class="hint">Prøv et annet søkeord</p>
                </div>
            `;
            return;
        }
        
        // Group by store for best prices
        const storeGroups = {};
        data.data.forEach(product => {
            const store = product.store?.name || 'Ukjent';
            if (!storeGroups[store]) storeGroups[store] = [];
            storeGroups[store].push(product);
        });
        
        // Find cheapest
        const sortedProducts = [...data.data].sort((a, b) => 
            (a.current_price?.price || 999) - (b.current_price?.price || 999)
        );
        
        const cheapest = sortedProducts[0];
        
        resultsDiv.innerHTML = `
            <div class="price-results-header">
                <h4>Resultater for "${escapeHtml(searchTerm)}"</h4>
                <span class="result-count">${data.data.length} produkter</span>
            </div>
            
            ${cheapest ? `
                <div class="cheapest-banner">
                    <span class="cheapest-icon">🏆</span>
                    <div class="cheapest-info">
                        <strong>Billigst: ${escapeHtml(cheapest.name)}</strong>
                        <span>${formatCurrency(cheapest.current_price?.price)} hos ${cheapest.store?.name}</span>
                    </div>
                </div>
            ` : ''}
            
            <div class="product-grid">
                ${sortedProducts.map(product => `
                    <div class="product-card" onclick="showProductDetails('${product.id}')">
                        <div class="product-image">
                            ${product.image ? `<img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy">` : '<span class="no-image">📦</span>'}
                        </div>
                        <div class="product-info">
                            <span class="product-name">${escapeHtml(product.name)}</span>
                            ${product.brand ? `<span class="product-brand">${escapeHtml(product.brand)}</span>` : ''}
                            <div class="product-price-row">
                                <span class="product-price">${formatCurrency(product.current_price?.price)}</span>
                                <span class="product-store">${product.store?.name || ''}</span>
                            </div>
                            ${product.current_price?.unit_price ? `
                                <span class="unit-price">${product.current_price.unit_price}</span>
                            ` : ''}
                        </div>
                        <button class="add-to-pantry-btn" onclick="event.stopPropagation(); addProductToPantry('${escapeHtml(JSON.stringify(product).replace(/'/g, "\\'"))}')">
                            ➕
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        
    } catch (error) {
        console.error('Price search error:', error);
        resultsDiv.innerHTML = `
            <div class="error-state">
                <span>❌</span>
                <p>Kunne ikke hente priser</p>
                <p class="hint">Sjekk internettforbindelsen og prøv igjen</p>
            </div>
        `;
    }
}
window.searchPrices = searchPrices;

async function showProductDetails(productId) {
    try {
        showToast('Henter produktinfo...', 'info');
        const data = await getProductById(productId);
        
        if (!data.data) {
            showToast('Kunne ikke hente produktinfo', 'error');
            return;
        }
        
        const product = data.data;
        
        const html = `
            <div class="product-detail">
                <div class="product-detail-image">
                    ${product.image ? `<img src="${product.image}" alt="${escapeHtml(product.name)}">` : '<span class="no-image-large">📦</span>'}
                </div>
                
                <h3>${escapeHtml(product.name)}</h3>
                ${product.brand ? `<p class="brand">${escapeHtml(product.brand)}</p>` : ''}
                
                <div class="price-display">
                    <span class="current-price">${formatCurrency(product.current_price?.price)}</span>
                    <span class="store-name">hos ${product.store?.name}</span>
                </div>
                
                ${product.current_price?.unit_price ? `
                    <p class="unit-price-detail">${product.current_price.unit_price}</p>
                ` : ''}
                
                <div class="product-meta">
                    ${product.weight ? `<span>Vekt: ${product.weight}g</span>` : ''}
                    ${product.ean ? `<span>EAN: ${product.ean}</span>` : ''}
                </div>
                
                ${product.allergens && product.allergens.length > 0 ? `
                    <div class="allergens">
                        <strong>Allergener:</strong>
                        <span>${product.allergens.join(', ')}</span>
                    </div>
                ` : ''}
                
                ${product.nutrition ? `
                    <div class="nutrition-info">
                        <strong>Næringsinnhold per 100g:</strong>
                        <div class="nutrition-grid">
                            ${product.nutrition.calories ? `<span>Kalorier: ${product.nutrition.calories} kcal</span>` : ''}
                            ${product.nutrition.fat ? `<span>Fett: ${product.nutrition.fat}g</span>` : ''}
                            ${product.nutrition.carbohydrates ? `<span>Karbo: ${product.nutrition.carbohydrates}g</span>` : ''}
                            ${product.nutrition.protein ? `<span>Protein: ${product.nutrition.protein}g</span>` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        showModal('📦 ' + product.name, html, [
            { text: 'Lukk', onClick: closeModal },
            { text: '➕ Legg til matkammer', primary: true, onClick: () => addProductToPantryFromDetail(product) }
        ]);
        
    } catch (error) {
        console.error('Product detail error:', error);
        showToast('Kunne ikke hente produktinfo', 'error');
    }
}
window.showProductDetails = showProductDetails;

function addProductToPantry(productJson) {
    try {
        const product = JSON.parse(productJson);
        addProductToPantryFromDetail(product);
    } catch (e) {
        console.error('Parse error:', e);
    }
}
window.addProductToPantry = addProductToPantry;

async function addProductToPantryFromDetail(product) {
    const newItem = {
        id: 'pantry_' + Date.now(),
        name: product.name || product.title,
        brand: product.brand || '',
        quantity: 1,
        unit: 'stk',
        category: guessPantryCategory(product.name),
        estimatedPrice: product.current_price?.price || 0,
        ean: product.ean || '',
        image: product.image || '',
        createdAt: new Date().toISOString()
    };
    
    try {
        await saveToFirestore('pantry', newItem.id, newItem);
        state.pantryItems.push(newItem);
        showToast(`${product.name} lagt til i matkammeret! 🎉`, 'success');
        closeModal();
        
        // Update kitchen card
        updateKitchenCard();
        
    } catch (e) {
        console.error('Save pantry error:', e);
        showToast('Kunne ikke legge til vare', 'error');
    }
}

function guessPantryCategory(name) {
    const lowerName = name.toLowerCase();
    
    if (/melk|yoghurt|rømme|fløte|ost|smør|egg/.test(lowerName)) return 'dairy';
    if (/kylling|biff|svin|lam|kjøtt|pølse|bacon|fisk|laks|torsk|reke/.test(lowerName)) return 'meat';
    if (/eple|banan|appelsin|drue|bær|frukt/.test(lowerName)) return 'fruits';
    if (/salat|tomat|agurk|løk|gulrot|potet|grønnsak|brokkoli|spinat/.test(lowerName)) return 'vegetables';
    if (/frossen|is|pizza/.test(lowerName)) return 'frozen';
    if (/boks|hermetikk|tomat/.test(lowerName)) return 'canned';
    if (/mel|pasta|ris|havre|müsli|brød/.test(lowerName)) return 'grains';
    if (/krydder|salt|pepper|sukker/.test(lowerName)) return 'spices';
    if (/vann|brus|juice|kaffe|te/.test(lowerName)) return 'drinks';
    if (/chips|sjokolade|snacks|godteri/.test(lowerName)) return 'snacks';
    if (/ketchup|sennep|majones|dressing|saus/.test(lowerName)) return 'condiments';
    
    return 'other';
}

// ===== v4.2 - AI PANTRY SCANNER =====

function openPantryAIScanner() {
    const html = `
        <div class="ai-scanner-container">
            <div class="scanner-header">
                <h3>📸 AI Matkammer-skanner</h3>
                <p>Ta bilde av kjøleskapet, skapet eller matvarene dine, så legger vi dem automatisk til!</p>
            </div>
            
            <div class="scanner-preview">
                <video id="scannerVideo" autoplay playsinline></video>
                <canvas id="scannerCanvas" style="display:none;"></canvas>
                <img id="scannerPreview" style="display:none;" />
            </div>
            
            <div class="scanner-controls">
                <button id="captureBtn" class="capture-btn" onclick="captureAndAnalyze()">
                    <span class="capture-icon">📷</span>
                    Ta bilde
                </button>
                <span class="or-text">eller</span>
                <label class="upload-btn">
                    <input type="file" id="scannerFileInput" accept="image/*" onchange="handleScannerUpload(event)" hidden>
                    📁 Last opp bilde
                </label>
            </div>
            
            <div id="scannerResults" class="scanner-results" style="display:none;">
                <h4>🔍 Identifiserte varer:</h4>
                <div id="identifiedItems" class="identified-items"></div>
                <div class="scanner-actions">
                    <button class="add-all-btn" onclick="addAllIdentifiedItems()">
                        ✅ Legg til alle
                    </button>
                </div>
            </div>
            
            <div class="scanner-tips">
                <h4>💡 Tips for best resultat:</h4>
                <ul>
                    <li>Sørg for god belysning</li>
                    <li>Ta bildet rett forfra</li>
                    <li>Ha varene godt synlige</li>
                    <li>Ta flere bilder om nødvendig</li>
                </ul>
            </div>
        </div>
    `;
    
    showModal('🤖 AI Matkammer-skanner', html, [
        { text: 'Avbryt', onClick: () => { stopScanner(); closeGenericModal(); } }
    ]);
    
    // Start camera
    startScanner();
}
window.openPantryAIScanner = openPantryAIScanner;

let scannerStream = null;

async function startScanner() {
    try {
        const video = $('scannerVideo');
        if (!video) return;
        
        scannerStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        
        video.srcObject = scannerStream;
        video.style.display = 'block';
        
    } catch (error) {
        console.error('Camera error:', error);
        showToast('Kunne ikke åpne kameraet. Prøv å laste opp et bilde i stedet.', 'warning');
    }
}

function stopScanner() {
    if (scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
    }
}

async function captureAndAnalyze() {
    const video = $('scannerVideo');
    const canvas = $('scannerCanvas');
    const preview = $('scannerPreview');
    
    if (!video || !canvas) return;
    
    // Capture frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Show preview
    video.style.display = 'none';
    preview.src = imageData;
    preview.style.display = 'block';
    
    // Stop camera
    stopScanner();
    
    // Analyze image
    await analyzeImage(imageData);
}
window.captureAndAnalyze = captureAndAnalyze;

async function handleScannerUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    stopScanner();
    
    const video = $('scannerVideo');
    const preview = $('scannerPreview');
    
    const imageData = await fileToBase64(file);
    
    if (video) video.style.display = 'none';
    if (preview) {
        preview.src = imageData;
        preview.style.display = 'block';
    }
    
    await analyzeImage(imageData);
}
window.handleScannerUpload = handleScannerUpload;

let identifiedItemsData = [];

async function analyzeImage(imageData) {
    const resultsDiv = $('scannerResults');
    const itemsDiv = $('identifiedItems');
    
    if (!resultsDiv || !itemsDiv) return;
    
    resultsDiv.style.display = 'block';
    itemsDiv.innerHTML = `
        <div class="analyzing">
            <div class="spinner"></div>
            <p>Analyserer bildet med AI...</p>
        </div>
    `;
    
    try {
        // Use OpenAI Vision API to analyze the image
        const items = await analyzeImageWithAI(imageData);
        
        if (items.length === 0) {
            itemsDiv.innerHTML = `
                <div class="no-items-found">
                    <span>🤔</span>
                    <p>Fant ingen matvarer i bildet</p>
                    <p class="hint">Prøv å ta et nytt bilde med bedre belysning</p>
                </div>
            `;
            return;
        }
        
        identifiedItemsData = items;
        
        // Try to find prices for the items
        const itemsWithPrices = await enrichItemsWithPrices(items);
        identifiedItemsData = itemsWithPrices;
        
        itemsDiv.innerHTML = itemsWithPrices.map((item, index) => `
            <div class="identified-item" data-index="${index}">
                <input type="checkbox" id="item_${index}" checked>
                <label for="item_${index}">
                    <span class="item-name">${escapeHtml(item.name)}</span>
                    <input type="number" class="item-qty" value="${item.quantity || 1}" min="0.1" step="0.1" 
                           onchange="updateIdentifiedItemQty(${index}, this.value)">
                    <select class="item-unit" onchange="updateIdentifiedItemUnit(${index}, this.value)">
                        <option value="stk" ${item.unit === 'stk' ? 'selected' : ''}>stk</option>
                        <option value="liter" ${item.unit === 'liter' ? 'selected' : ''}>liter</option>
                        <option value="kg" ${item.unit === 'kg' ? 'selected' : ''}>kg</option>
                        <option value="g" ${item.unit === 'g' ? 'selected' : ''}>g</option>
                        <option value="pk" ${item.unit === 'pk' ? 'selected' : ''}>pk</option>
                    </select>
                    ${item.price ? `<span class="item-price">~${formatCurrency(item.price)}</span>` : ''}
                </label>
                <button class="remove-item-btn" onclick="removeIdentifiedItem(${index})">✕</button>
            </div>
        `).join('');
        
        showToast(`Fant ${items.length} matvarer! 🎉`, 'success');
        
    } catch (error) {
        console.error('Image analysis error:', error);
        itemsDiv.innerHTML = `
            <div class="error-state">
                <span>❌</span>
                <p>Kunne ikke analysere bildet</p>
                <button onclick="retryAnalysis()">Prøv igjen</button>
            </div>
        `;
    }
}

async function analyzeImageWithAI(imageData) {
    // Try Gemini first (free), then OpenAI, then fallback
    const geminiKey = localStorage.getItem('kokebok_gemini_key');
    const openaiKey = localStorage.getItem('kokebok_openai_key');
    
    if (geminiKey) {
        try {
            return await analyzeWithGemini(imageData, geminiKey);
        } catch (e) {
            console.warn('Gemini API error, trying fallback:', e.message);
        }
    }
    
    if (openaiKey) {
        try {
            return await analyzeWithOpenAI(imageData, openaiKey);
        } catch (e) {
            console.warn('OpenAI API error:', e.message);
        }
    }
    
    // Fallback to basic pattern recognition
    return basicImageAnalysis(imageData);
}

// Google Gemini Vision API (FREE tier available!)
async function analyzeWithGemini(imageData, apiKey) {
    // Extract base64 data without the prefix
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = imageData.match(/^data:(image\/\w+);/)?.[1] || 'image/jpeg';
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [
                    {
                        text: `Du er en ekspert på å identifisere matvarer i bilder.
Analyser bildet og identifiser ALLE synlige matvarer, ingredienser, og dagligvarer.
Vær grundig - se etter emballasje, merker, og produkttyper.

VIKTIG: Svar BARE med en JSON-array i dette eksakte formatet:
[
  {"name": "Produktnavn på norsk", "quantity": 1, "unit": "stk"},
  {"name": "Annet produkt", "quantity": 0.5, "unit": "kg"}
]

Enheter kan være: stk, liter, kg, g, pk, boks, pose, flaske

Ikke inkluder noen forklaring eller annen tekst - BARE JSON-arrayet.`
                    },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Data
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2000
            }
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    
    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1] || jsonMatch[0];
    }
    
    try {
        const items = JSON.parse(jsonStr);
        console.log('✓ Gemini identifiserte', items.length, 'varer');
        return Array.isArray(items) ? items : [];
    } catch (e) {
        console.warn('JSON parse error:', e, content);
        return [];
    }
}

// OpenAI Vision API (requires paid API key)
async function analyzeWithOpenAI(imageData, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `Du er en ekspert på å identifisere matvarer i bilder. 
                    Analyser bildet og list opp alle synlige matvarer.
                    For hver vare, estimer mengden.
                    Svar BARE med JSON i dette formatet:
                    [{"name": "Melk", "quantity": 1, "unit": "liter"}, ...]
                    Bruk norske navn. Ikke inkluder forklaringer.`
                },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Identifiser alle matvarer i dette bildet:' },
                        { type: 'image_url', image_url: { url: imageData } }
                    ]
                }
            ],
            max_tokens: 1000
        })
    });
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    
    return [];
}

function basicImageAnalysis(imageData) {
    // Fallback: Return empty array and suggest getting Gemini API key
    showToast('🌟 For AI-skanning: Hent GRATIS Gemini API-nøkkel i innstillinger!', 'info');
    return [];
}

async function enrichItemsWithPrices(items) {
    const enriched = [];
    
    for (const item of items) {
        try {
            const searchResult = await searchProducts(item.name, { size: 1 });
            if (searchResult.data && searchResult.data.length > 0) {
                const product = searchResult.data[0];
                enriched.push({
                    ...item,
                    price: product.current_price?.price,
                    ean: product.ean,
                    category: guessPantryCategory(item.name)
                });
            } else {
                enriched.push({
                    ...item,
                    category: guessPantryCategory(item.name)
                });
            }
        } catch (e) {
            enriched.push({
                ...item,
                category: guessPantryCategory(item.name)
            });
        }
    }
    
    return enriched;
}

function updateIdentifiedItemQty(index, value) {
    if (identifiedItemsData[index]) {
        identifiedItemsData[index].quantity = parseFloat(value) || 1;
    }
}
window.updateIdentifiedItemQty = updateIdentifiedItemQty;

function updateIdentifiedItemUnit(index, value) {
    if (identifiedItemsData[index]) {
        identifiedItemsData[index].unit = value;
    }
}
window.updateIdentifiedItemUnit = updateIdentifiedItemUnit;

function removeIdentifiedItem(index) {
    const el = document.querySelector(`.identified-item[data-index="${index}"]`);
    if (el) el.remove();
    identifiedItemsData[index] = null;
}
window.removeIdentifiedItem = removeIdentifiedItem;

async function addAllIdentifiedItems() {
    const checkboxes = document.querySelectorAll('.identified-item input[type="checkbox"]:checked');
    const itemsToAdd = [];
    
    checkboxes.forEach(cb => {
        const index = parseInt(cb.closest('.identified-item').dataset.index);
        if (identifiedItemsData[index]) {
            itemsToAdd.push(identifiedItemsData[index]);
        }
    });
    
    if (itemsToAdd.length === 0) {
        showToast('Velg minst én vare å legge til', 'warning');
        return;
    }
    
    let added = 0;
    for (const item of itemsToAdd) {
        try {
            const newItem = {
                id: 'pantry_' + Date.now() + '_' + added,
                name: item.name,
                quantity: item.quantity || 1,
                unit: item.unit || 'stk',
                category: item.category || 'other',
                estimatedPrice: item.price || 0,
                ean: item.ean || '',
                createdAt: new Date().toISOString(),
                source: 'ai_scan'
            };
            
            await saveToFirestore('pantry', newItem.id, newItem);
            state.pantryItems.push(newItem);
            added++;
        } catch (e) {
            console.error('Error adding item:', e);
        }
    }
    
    showToast(`${added} varer lagt til i matkammeret! 🎉`, 'success');
    closeModal();
    updateKitchenCard();
    
    // Check achievement
    if (state.pantryItems.length >= 20) {
        unlockAchievement('pantryOrganizer');
    }
}
window.addAllIdentifiedItems = addAllIdentifiedItems;

// ===== v4.2 - AUTO INGREDIENT DEDUCTION =====

async function deductIngredientsFromPantry(recipe) {
    if (!recipe || !recipe.ingredients) return;
    
    const ingredients = getIngredientsAsString(recipe.ingredients).split('\n').filter(i => i.trim());
    const deductions = [];
    
    for (const ingredient of ingredients) {
        const parsed = parseIngredient(ingredient);
        if (!parsed) continue;
        
        // Find matching pantry item
        const pantryItem = findMatchingPantryItem(parsed.name);
        if (pantryItem) {
            deductions.push({
                pantryItem,
                amount: parsed.amount,
                unit: parsed.unit,
                ingredient: parsed.name
            });
        }
    }
    
    if (deductions.length === 0) {
        return;
    }
    
    // Show confirmation dialog
    const html = `
        <div class="deduction-dialog">
            <p>Vil du trekke fra disse ingrediensene fra matkammeret?</p>
            <div class="deduction-list">
                ${deductions.map((d, i) => `
                    <div class="deduction-item">
                        <input type="checkbox" id="deduct_${i}" checked>
                        <label for="deduct_${i}">
                            <span class="deduct-name">${escapeHtml(d.pantryItem.name)}</span>
                            <span class="deduct-amount">-${d.amount} ${d.unit}</span>
                            <span class="deduct-remaining">(${d.pantryItem.quantity} ${d.pantryItem.unit} → ${Math.max(0, d.pantryItem.quantity - d.amount)} ${d.pantryItem.unit})</span>
                        </label>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    showModal('🍳 Oppdater matkammer?', html, [
        { text: 'Hopp over', onClick: closeModal },
        { text: 'Trekk fra', primary: true, onClick: () => executeDeductions(deductions) }
    ]);
}

async function executeDeductions(deductions) {
    let updated = 0;
    
    for (let i = 0; i < deductions.length; i++) {
        const checkbox = $(`deduct_${i}`);
        if (!checkbox?.checked) continue;
        
        const d = deductions[i];
        const newQty = Math.max(0, d.pantryItem.quantity - d.amount);
        
        if (newQty <= 0) {
            // Remove item from pantry
            await deleteFromFirestore('pantry', d.pantryItem.id);
            state.pantryItems = state.pantryItems.filter(p => p.id !== d.pantryItem.id);
        } else {
            // Update quantity
            d.pantryItem.quantity = newQty;
            await saveToFirestore('pantry', d.pantryItem.id, d.pantryItem);
        }
        updated++;
    }
    
    closeModal();
    showToast(`${updated} varer oppdatert i matkammeret`, 'success');
    updateKitchenCard();
}

function parseIngredient(text) {
    if (!text) return null;
    
    // Common patterns: "2 dl melk", "200g kjøttdeig", "1 stk løk"
    const patterns = [
        /^(\d+(?:[.,]\d+)?)\s*(dl|l|liter|ml|g|kg|stk|ss|ts|kopp|kopper)\s+(.+)$/i,
        /^(\d+(?:[.,]\d+)?)\s*(.+)$/i
    ];
    
    for (const pattern of patterns) {
        const match = text.trim().match(pattern);
        if (match) {
            return {
                amount: parseFloat(match[1].replace(',', '.')) || 1,
                unit: match[2]?.toLowerCase() || 'stk',
                name: match[3] || match[2]
            };
        }
    }
    
    return { amount: 1, unit: 'stk', name: text.trim() };
}

function findMatchingPantryItem(ingredientName) {
    if (!ingredientName) return null;
    
    const searchTerms = ingredientName.toLowerCase().split(' ');
    
    // Try exact match first
    let match = state.pantryItems.find(p => 
        p.name.toLowerCase() === ingredientName.toLowerCase()
    );
    
    if (match) return match;
    
    // Try partial match
    match = state.pantryItems.find(p => {
        const pantryName = p.name.toLowerCase();
        return searchTerms.some(term => pantryName.includes(term) || term.includes(pantryName));
    });
    
    return match;
}

// Hook into recipe cooking/viewing
function onRecipeCooked(recipeOrId) {
    // Support both recipe object and recipe ID
    let recipe = recipeOrId;
    if (typeof recipeOrId === 'string') {
        recipe = state.recipes.find(r => r.id === recipeOrId);
    }
    
    if (!recipe) {
        showToast('Oppskrift ikke funnet', 'error');
        return;
    }
    
    // Always track that user cooked this
    trackCookedRecipe(recipe.id);
    
    // Auto-deduct if enabled
    if (state.settings.autoDeductIngredients) {
        deductIngredientsFromPantry(recipe);
    } else {
        showToast(`✅ "${recipe.name}" markert som laget!`, 'success');
    }
}
window.onRecipeCooked = onRecipeCooked;

// Track cooked recipe for statistics
function trackCookedRecipe(recipeId) {
    const cookedHistory = JSON.parse(localStorage.getItem('kokebok_cooked_history') || '[]');
    cookedHistory.push({
        recipeId,
        cookedAt: new Date().toISOString()
    });
    // Keep only last 100 entries
    if (cookedHistory.length > 100) {
        cookedHistory.shift();
    }
    localStorage.setItem('kokebok_cooked_history', JSON.stringify(cookedHistory));
}

// ===== v4.2 - SHOPPING LIST WITH PRICES =====

async function calculateShoppingListPrices() {
    if (!state.shoppingList || state.shoppingList.length === 0) {
        showToast('Handlelisten er tom', 'info');
        return;
    }
    
    showToast('Henter priser...', 'info');
    
    const items = state.shoppingList.filter(item => !item.checked);
    const itemNames = items.map(item => getItemName(item));
    
    const priceData = await getPriceComparison(itemNames);
    
    // Calculate total estimate
    let totalMin = 0;
    let totalMax = 0;
    
    const enrichedItems = items.map(item => {
        const name = getItemName(item);
        const priceInfo = priceData.find(p => p.searchTerm.toLowerCase() === name.toLowerCase());
        
        if (priceInfo && priceInfo.products.length > 0) {
            const prices = priceInfo.products.map(p => p.price).filter(p => p);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            totalMin += minPrice;
            totalMax += maxPrice;
            
            return {
                ...item,
                priceRange: { min: minPrice, max: maxPrice },
                cheapestStore: priceInfo.products.find(p => p.price === minPrice)?.store
            };
        }
        return item;
    });
    
    // Update shopping list display with prices
    showShoppingListWithPrices(enrichedItems, totalMin, totalMax);
}
window.calculateShoppingListPrices = calculateShoppingListPrices;

function showShoppingListWithPrices(items, totalMin, totalMax) {
    const html = `
        <div class="priced-shopping-list">
            <div class="price-estimate-header">
                <h3>💰 Prisestimat</h3>
                <div class="total-estimate">
                    <span class="estimate-range">${formatCurrency(totalMin)} - ${formatCurrency(totalMax)}</span>
                    <span class="estimate-label">estimert total</span>
                </div>
            </div>
            
            <div class="priced-items">
                ${items.map(item => `
                    <div class="priced-item ${item.checked ? 'checked' : ''}">
                        <span class="item-name">${escapeHtml(getItemName(item))}</span>
                        ${item.priceRange ? `
                            <span class="item-price-range">
                                ${formatCurrency(item.priceRange.min)}
                                ${item.cheapestStore ? `<small>(${item.cheapestStore})</small>` : ''}
                            </span>
                        ` : '<span class="no-price">-</span>'}
                    </div>
                `).join('')}
            </div>
            
            <div class="price-disclaimer">
                <small>💡 Prisene er veiledende og kan variere. Data fra Kassal.app</small>
            </div>
        </div>
    `;
    
    showModal('🛒 Handleliste med priser', html, [
        { text: 'Lukk', onClick: closeModal }
    ]);
}

// ===== v4.2 - RECIPE COST CALCULATOR =====

async function calculateRecipeCost(recipe) {
    if (!recipe || !recipe.ingredients) return null;
    
    const ingredients = getIngredientsAsString(recipe.ingredients).split('\n').filter(i => i.trim());
    let totalCost = 0;
    const breakdown = [];
    
    for (const ingredient of ingredients.slice(0, 15)) { // Limit API calls
        const parsed = parseIngredient(ingredient);
        if (!parsed) continue;
        
        try {
            const searchResult = await searchProducts(parsed.name, { size: 1 });
            if (searchResult.data && searchResult.data.length > 0) {
                const product = searchResult.data[0];
                const price = product.current_price?.price || 0;
                totalCost += price;
                breakdown.push({
                    ingredient: parsed.name,
                    price,
                    product: product.name,
                    store: product.store?.name
                });
            }
        } catch (e) {
            // Skip on error
        }
    }
    
    return { total: totalCost, breakdown };
}

function showRecipeCostEstimate(recipe) {
    showToast('Beregner kostnad...', 'info');
    
    calculateRecipeCost(recipe).then(cost => {
        if (!cost || cost.breakdown.length === 0) {
            showToast('Kunne ikke beregne kostnad', 'warning');
            return;
        }
        
        const html = `
            <div class="recipe-cost">
                <div class="cost-total">
                    <span class="cost-amount">${formatCurrency(cost.total)}</span>
                    <span class="cost-label">estimert kostnad</span>
                </div>
                
                <h4>Prisfordeling:</h4>
                <div class="cost-breakdown">
                    ${cost.breakdown.map(item => `
                        <div class="cost-item">
                            <span class="cost-ingredient">${escapeHtml(item.ingredient)}</span>
                            <span class="cost-price">${formatCurrency(item.price)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <p class="cost-disclaimer">
                    <small>Prisene er veiledende basert på rimeligste alternativ. Data fra Kassal.app</small>
                </p>
            </div>
        `;
        
        showModal('💰 Kostnad: ' + recipe.title, html, [
            { text: 'Lukk', onClick: closeModal }
        ]);
    });
}
window.showRecipeCostEstimate = showRecipeCostEstimate;

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

// =====================================================
// v4.3.0 - PREMIUM FEATURES
// =====================================================

// ===== NUTRITION CALCULATOR =====
const NUTRITION_DATABASE = {
    // Per 100g - kalorier, protein, karbs, fett
    'mel': { cal: 364, protein: 10, carbs: 76, fat: 1 },
    'sukker': { cal: 387, protein: 0, carbs: 100, fat: 0 },
    'smør': { cal: 717, protein: 1, carbs: 0, fat: 81 },
    'egg': { cal: 155, protein: 13, carbs: 1, fat: 11 },
    'melk': { cal: 42, protein: 3, carbs: 5, fat: 1 },
    'fløte': { cal: 340, protein: 2, carbs: 3, fat: 36 },
    'ost': { cal: 402, protein: 25, carbs: 1, fat: 33 },
    'kylling': { cal: 239, protein: 27, carbs: 0, fat: 14 },
    'laks': { cal: 208, protein: 20, carbs: 0, fat: 13 },
    'torsk': { cal: 82, protein: 18, carbs: 0, fat: 1 },
    'kjøttdeig': { cal: 254, protein: 17, carbs: 0, fat: 20 },
    'biff': { cal: 250, protein: 26, carbs: 0, fat: 15 },
    'svinekjøtt': { cal: 242, protein: 27, carbs: 0, fat: 14 },
    'bacon': { cal: 541, protein: 37, carbs: 1, fat: 42 },
    'ris': { cal: 130, protein: 3, carbs: 28, fat: 0 },
    'pasta': { cal: 131, protein: 5, carbs: 25, fat: 1 },
    'brød': { cal: 265, protein: 9, carbs: 49, fat: 3 },
    'poteter': { cal: 77, protein: 2, carbs: 17, fat: 0 },
    'gulrot': { cal: 41, protein: 1, carbs: 10, fat: 0 },
    'brokkoli': { cal: 34, protein: 3, carbs: 7, fat: 0 },
    'spinat': { cal: 23, protein: 3, carbs: 4, fat: 0 },
    'tomat': { cal: 18, protein: 1, carbs: 4, fat: 0 },
    'løk': { cal: 40, protein: 1, carbs: 9, fat: 0 },
    'hvitløk': { cal: 149, protein: 6, carbs: 33, fat: 1 },
    'paprika': { cal: 31, protein: 1, carbs: 6, fat: 0 },
    'avokado': { cal: 160, protein: 2, carbs: 9, fat: 15 },
    'banan': { cal: 89, protein: 1, carbs: 23, fat: 0 },
    'eple': { cal: 52, protein: 0, carbs: 14, fat: 0 },
    'appelsin': { cal: 47, protein: 1, carbs: 12, fat: 0 },
    'honning': { cal: 304, protein: 0, carbs: 82, fat: 0 },
    'olivenolje': { cal: 884, protein: 0, carbs: 0, fat: 100 },
    'rømme': { cal: 193, protein: 3, carbs: 4, fat: 18 },
    'yoghurt': { cal: 59, protein: 10, carbs: 4, fat: 0 },
    'cottage cheese': { cal: 98, protein: 11, carbs: 3, fat: 4 },
    'mandler': { cal: 579, protein: 21, carbs: 22, fat: 50 },
    'peanøtter': { cal: 567, protein: 26, carbs: 16, fat: 49 },
    'sjokolade': { cal: 546, protein: 5, carbs: 60, fat: 31 },
    'kakao': { cal: 228, protein: 20, carbs: 58, fat: 14 },
    'hvetemel': { cal: 364, protein: 10, carbs: 76, fat: 1 },
    'havregryn': { cal: 389, protein: 17, carbs: 66, fat: 7 },
    'linser': { cal: 116, protein: 9, carbs: 20, fat: 0 },
    'bønner': { cal: 127, protein: 9, carbs: 23, fat: 1 },
    'kikerter': { cal: 164, protein: 9, carbs: 27, fat: 3 },
    'tofu': { cal: 76, protein: 8, carbs: 2, fat: 5 }
};

// Allergen database
const ALLERGEN_DATABASE = {
    'gluten': ['mel', 'hvetemel', 'pasta', 'brød', 'spaghetti', 'nudler', 'couscous', 'bulgur', 'seitan', 'øl', 'bygg', 'rug', 'havre'],
    'melk': ['melk', 'fløte', 'smør', 'ost', 'rømme', 'yoghurt', 'iskrem', 'krem', 'cottage', 'mozzarella', 'parmesan', 'cheddar'],
    'egg': ['egg', 'eggehvite', 'eggeplomme', 'majones', 'majonez'],
    'nøtter': ['mandler', 'valnøtter', 'hasselnøtter', 'cashew', 'pistasjnøtter', 'pekannøtter', 'macadamia', 'nøtter'],
    'peanøtter': ['peanøtter', 'peanøttsmør', 'jordnøtter'],
    'soya': ['soya', 'tofu', 'edamame', 'tempeh', 'soyasaus', 'miso'],
    'fisk': ['laks', 'torsk', 'sei', 'makrell', 'ørret', 'kveite', 'hyse', 'sardiner', 'ansjos', 'tuna'],
    'skalldyr': ['reker', 'krabbe', 'hummer', 'blåskjell', 'østers', 'kamskjell', 'scampi'],
    'selleri': ['selleri', 'stangselleri', 'sellerirot'],
    'sennep': ['sennep', 'sennepsfrø'],
    'sesam': ['sesam', 'sesamfrø', 'tahini'],
    'sulfitter': ['vin', 'tørket frukt', 'syltet']
};

function openNutritionCalculator(recipe = null) {
    const currentRecipe = recipe || state.currentRecipe;
    
    if (!currentRecipe?.ingredients) {
        showToast('Ingen ingredienser å beregne', 'warning');
        return;
    }
    
    const ingredients = getIngredientsAsString(currentRecipe.ingredients);
    const nutrition = calculateNutrition(ingredients);
    const servings = parseServings(currentRecipe.servings) || 4;
    const perServing = {
        cal: Math.round(nutrition.cal / servings),
        protein: Math.round(nutrition.protein / servings),
        carbs: Math.round(nutrition.carbs / servings),
        fat: Math.round(nutrition.fat / servings)
    };
    
    const allergensFound = detectAllergens(ingredients);
    
    const html = `
        <div class="nutrition-calculator">
            <div class="nutrition-header">
                <h3>${escapeHtml(currentRecipe.name)}</h3>
                <p>${servings} porsjoner</p>
            </div>
            
            <div class="nutrition-cards">
                <div class="nutrition-card total">
                    <div class="nutrition-icon">📊</div>
                    <div class="nutrition-label">Totalt</div>
                    <div class="nutrition-values">
                        <div class="nv-item cal"><span>${nutrition.cal}</span> kcal</div>
                        <div class="nv-item"><span>${nutrition.protein}g</span> protein</div>
                        <div class="nv-item"><span>${nutrition.carbs}g</span> karbo</div>
                        <div class="nv-item"><span>${nutrition.fat}g</span> fett</div>
                    </div>
                </div>
                
                <div class="nutrition-card per-serving">
                    <div class="nutrition-icon">🍽️</div>
                    <div class="nutrition-label">Per porsjon</div>
                    <div class="nutrition-values">
                        <div class="nv-item cal"><span>${perServing.cal}</span> kcal</div>
                        <div class="nv-item"><span>${perServing.protein}g</span> protein</div>
                        <div class="nv-item"><span>${perServing.carbs}g</span> karbo</div>
                        <div class="nv-item"><span>${perServing.fat}g</span> fett</div>
                    </div>
                </div>
            </div>
            
            <div class="macro-chart">
                <h4>Makrofordeling</h4>
                <div class="macro-bars">
                    <div class="macro-bar">
                        <div class="macro-label">Protein</div>
                        <div class="macro-track">
                            <div class="macro-fill protein" style="width: ${Math.min(100, (nutrition.protein * 4 / nutrition.cal) * 100)}%"></div>
                        </div>
                        <div class="macro-percent">${Math.round((nutrition.protein * 4 / nutrition.cal) * 100)}%</div>
                    </div>
                    <div class="macro-bar">
                        <div class="macro-label">Karbohydrater</div>
                        <div class="macro-track">
                            <div class="macro-fill carbs" style="width: ${Math.min(100, (nutrition.carbs * 4 / nutrition.cal) * 100)}%"></div>
                        </div>
                        <div class="macro-percent">${Math.round((nutrition.carbs * 4 / nutrition.cal) * 100)}%</div>
                    </div>
                    <div class="macro-bar">
                        <div class="macro-label">Fett</div>
                        <div class="macro-track">
                            <div class="macro-fill fat" style="width: ${Math.min(100, (nutrition.fat * 9 / nutrition.cal) * 100)}%"></div>
                        </div>
                        <div class="macro-percent">${Math.round((nutrition.fat * 9 / nutrition.cal) * 100)}%</div>
                    </div>
                </div>
            </div>
            
            ${allergensFound.length > 0 ? `
                <div class="allergen-warning">
                    <h4>⚠️ Allergener oppdaget</h4>
                    <div class="allergen-tags">
                        ${allergensFound.map(a => `<span class="allergen-tag">${a}</span>`).join('')}
                    </div>
                    <p class="allergen-hint">Basert på ingredienslisten. Sjekk alltid produktetiketter.</p>
                </div>
            ` : `
                <div class="allergen-ok">
                    <span>✅</span> Ingen vanlige allergener oppdaget
                </div>
            `}
            
            <p class="nutrition-disclaimer">
                ⓘ Estimater basert på standardverdier. Faktisk næringsinnhold kan variere.
            </p>
        </div>
    `;
    
    showModal('🥗 Næringsinnhold', html, []);
}
window.openNutritionCalculator = openNutritionCalculator;

function calculateNutrition(ingredientsStr) {
    const nutrition = { cal: 0, protein: 0, carbs: 0, fat: 0 };
    const lines = ingredientsStr.toLowerCase().split('\n');
    
    for (const line of lines) {
        // Parse amount (look for numbers with units)
        const amountMatch = line.match(/(\d+(?:[.,]\d+)?)\s*(g|gram|kg|dl|l|ml|ss|ts|stk)?/);
        let grams = 100; // Default assumption
        
        if (amountMatch) {
            const num = parseFloat(amountMatch[1].replace(',', '.'));
            const unit = amountMatch[2] || '';
            
            // Convert to grams
            if (unit === 'kg' || unit === 'kilo') grams = num * 1000;
            else if (unit === 'g' || unit === 'gram') grams = num;
            else if (unit === 'dl') grams = num * 100;
            else if (unit === 'l' || unit === 'liter') grams = num * 1000;
            else if (unit === 'ml') grams = num;
            else if (unit === 'ss') grams = num * 15;
            else if (unit === 'ts') grams = num * 5;
            else if (unit === 'stk') grams = num * 50; // Rough estimate for "pieces"
            else grams = num * 10; // Default multiplier
        }
        
        // Find matching ingredient
        for (const [ingredient, values] of Object.entries(NUTRITION_DATABASE)) {
            if (line.includes(ingredient)) {
                const factor = grams / 100;
                nutrition.cal += Math.round(values.cal * factor);
                nutrition.protein += Math.round(values.protein * factor);
                nutrition.carbs += Math.round(values.carbs * factor);
                nutrition.fat += Math.round(values.fat * factor);
                break;
            }
        }
    }
    
    return nutrition;
}

function detectAllergens(ingredientsStr) {
    const found = new Set();
    const ingredientsLower = ingredientsStr.toLowerCase();
    
    for (const [allergen, keywords] of Object.entries(ALLERGEN_DATABASE)) {
        for (const keyword of keywords) {
            if (ingredientsLower.includes(keyword)) {
                found.add(allergen.charAt(0).toUpperCase() + allergen.slice(1));
                break;
            }
        }
    }
    
    return Array.from(found);
}

// ===== VOICE COMMANDS =====
let voiceRecognition = null;
let voiceEnabled = false;

function initVoiceCommands() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log('Stemmegjenkjenning ikke støttet');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    voiceRecognition = new SpeechRecognition();
    voiceRecognition.continuous = true;
    voiceRecognition.interimResults = false;
    voiceRecognition.lang = 'nb-NO';
    
    voiceRecognition.onresult = (event) => {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript.toLowerCase().trim();
        processVoiceCommand(command);
    };
    
    voiceRecognition.onerror = (event) => {
        console.error('Voice error:', event.error);
        if (event.error === 'not-allowed') {
            showToast('Mikrofontilgang nektet', 'error');
        }
    };
}

function toggleVoiceCommands() {
    if (!voiceRecognition) {
        initVoiceCommands();
    }
    
    if (!voiceRecognition) {
        showToast('Stemmekommandoer støttes ikke i denne nettleseren', 'warning');
        return;
    }
    
    voiceEnabled = !voiceEnabled;
    
    if (voiceEnabled) {
        voiceRecognition.start();
        showToast('🎤 Stemmekommandoer aktivert! Si "hjelp" for kommandoer.', 'success');
    } else {
        voiceRecognition.stop();
        showToast('🎤 Stemmekommandoer deaktivert', 'info');
    }
}
window.toggleVoiceCommands = toggleVoiceCommands;

function processVoiceCommand(command) {
    console.log('Voice command:', command);
    
    // Timer commands
    if (command.includes('start timer') || command.includes('sett timer')) {
        const minutes = command.match(/(\d+)\s*(minutt|min)/);
        if (minutes) {
            setTimerMinutes(parseInt(minutes[1]));
            startTimer();
            speak(`Timer satt til ${minutes[1]} minutter`);
        } else {
            speak('Hvor mange minutter?');
        }
    } else if (command.includes('stopp timer') || command.includes('pause timer')) {
        pauseTimer();
        speak('Timer pauset');
    } else if (command.includes('nullstill timer') || command.includes('reset timer')) {
        resetTimer();
        speak('Timer nullstilt');
    }
    // Navigation
    else if (command.includes('åpne oppskrift') || command.includes('vis oppskrift')) {
        navigateTo('recipeListView');
        speak('Åpner oppskrifter');
    } else if (command.includes('åpne handleliste') || command.includes('vis handleliste')) {
        openShoppingList();
        speak('Åpner handlelisten');
    } else if (command.includes('åpne matkammer') || command.includes('vis matkammer')) {
        openPantryTracker();
        speak('Åpner matkammeret');
    } else if (command.includes('hjem') || command.includes('gå hjem')) {
        navigateTo('dashboardView');
        speak('Går til forsiden');
    }
    // Recipe actions
    else if (command.includes('neste steg') || command.includes('neste trinn')) {
        speak('Går til neste steg');
        showToast('➡️ Neste steg', 'info');
    } else if (command.includes('forrige steg') || command.includes('forrige trinn')) {
        speak('Går tilbake');
        showToast('⬅️ Forrige steg', 'info');
    } else if (command.includes('legg til i handleliste')) {
        addScaledToShoppingList();
        speak('Ingredienser lagt til i handlelisten');
    }
    // Help
    else if (command.includes('hjelp') || command.includes('kommandoer')) {
        speak('Du kan si: start timer, stopp timer, åpne oppskrifter, åpne handleliste, og mer.');
        showVoiceHelp();
    }
    // Search
    else if (command.includes('søk etter')) {
        const searchTerm = command.replace('søk etter', '').trim();
        if (searchTerm) {
            performRecipeSearch(searchTerm);
            speak(`Søker etter ${searchTerm}`);
        }
    }
}

function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'nb-NO';
        utterance.rate = 1.0;
        speechSynthesis.speak(utterance);
    }
}

function showVoiceHelp() {
    const html = `
        <div class="voice-help">
            <div class="voice-status ${voiceEnabled ? 'active' : ''}">
                <span class="voice-icon">${voiceEnabled ? '🎤' : '🔇'}</span>
                <span>${voiceEnabled ? 'Lytter...' : 'Mikrofon av'}</span>
            </div>
            
            <h4>Tilgjengelige kommandoer:</h4>
            
            <div class="voice-commands-list">
                <div class="voice-cmd-group">
                    <h5>⏱️ Timer</h5>
                    <ul>
                        <li>"Start timer 10 minutter"</li>
                        <li>"Stopp timer"</li>
                        <li>"Nullstill timer"</li>
                    </ul>
                </div>
                
                <div class="voice-cmd-group">
                    <h5>📱 Navigasjon</h5>
                    <ul>
                        <li>"Åpne oppskrifter"</li>
                        <li>"Åpne handleliste"</li>
                        <li>"Åpne matkammer"</li>
                        <li>"Gå hjem"</li>
                    </ul>
                </div>
                
                <div class="voice-cmd-group">
                    <h5>🍳 Matlaging</h5>
                    <ul>
                        <li>"Neste steg"</li>
                        <li>"Forrige steg"</li>
                        <li>"Legg til i handleliste"</li>
                    </ul>
                </div>
                
                <div class="voice-cmd-group">
                    <h5>🔍 Søk</h5>
                    <ul>
                        <li>"Søk etter lasagne"</li>
                    </ul>
                </div>
            </div>
            
            <button class="btn btn-primary" onclick="toggleVoiceCommands()">
                ${voiceEnabled ? '🔇 Deaktiver mikrofon' : '🎤 Aktiver mikrofon'}
            </button>
        </div>
    `;
    
    showModal('🎤 Stemmekommandoer', html, []);
}
window.showVoiceHelp = showVoiceHelp;

// ===== COOKING TIP OF THE DAY =====
const COOKING_TIPS = [
    { tip: "Salt pasta-vannet godt - det skal smake som sjøvann!", category: "Pasta" },
    { tip: "La kjøtt hvile etter steking for saftigere resultat.", category: "Kjøtt" },
    { tip: "Bruk romtemperert egg for luftigere kaker.", category: "Baking" },
    { tip: "Hakk urter med litt salt for å forhindre at de blir brune.", category: "Urter" },
    { tip: "Test om oljen er varm nok med en trekulepinne - bobler = klar!", category: "Steking" },
    { tip: "Tilsett sitronjuice til avokado for å forhindre brunfarging.", category: "Frukt" },
    { tip: "Oppbevar ingefær i fryseren - lettere å rive!", category: "Krydder" },
    { tip: "Bruk kald smør i paideig for flakete resultat.", category: "Baking" },
    { tip: "Tilsett en klype sukker til tomatsaus for å balansere syrligheten.", category: "Saus" },
    { tip: "Skjær løk under rennende kaldt vann for å unngå tårer.", category: "Grønnsaker" },
    { tip: "Legg bacon i kald panne og stek langsomt for sprøere resultat.", category: "Kjøtt" },
    { tip: "Bruk steketerm til presist stekt kjøtt hver gang.", category: "Kjøtt" },
    { tip: "Tilsett salt til bønner først etter koking - ellers blir de harde.", category: "Belgfrukter" },
    { tip: "Rist krydder i tørr panne for å frigjøre aromaner.", category: "Krydder" },
    { tip: "La deig hvile i kjøleskapet for lettere håndtering.", category: "Baking" },
    { tip: "Bruk iskaldt vann når du lager tempura for sprøere deig.", category: "Steking" },
    { tip: "Tilsett litt eddik til posjert egg-vannet for bedre form.", category: "Egg" },
    { tip: "Oppbevar ferske urter i glass med vann i kjøleskapet.", category: "Oppbevaring" },
    { tip: "Bruk mandolin for jevne skiver - men vær forsiktig!", category: "Teknikk" },
    { tip: "La stekepannen bli ordentlig varm før du legger i maten.", category: "Steking" },
    { tip: "Tilsett pasta-vann til sausen for silkemyk konsistens.", category: "Pasta" },
    { tip: "Frys sitroner og lime for enklere riving av skall.", category: "Frukt" },
    { tip: "Bruk bakepapir mellom hamburgerkarbonadene før frysing.", category: "Oppbevaring" },
    { tip: "Tilsett honning til marinader for bedre bruning.", category: "Marinade" },
    { tip: "Skyll ris til vannet er klart for løsere, fluffigere ris.", category: "Ris" },
    { tip: "Bruk en skje til å skrelle ingefær - mindre svinn!", category: "Teknikk" },
    { tip: "Tilsett litt kaffe til sjokoladeoppskrifter for dypere smak.", category: "Baking" },
    { tip: "Oppbevar nøtter i fryser for å holde dem ferske lenger.", category: "Oppbevaring" },
    { tip: "Bruk stekebrett på baksiden for større arbeidsflate.", category: "Teknikk" },
    { tip: "Tilsett grønnsaker i rekkefølge etter koketid.", category: "Grønnsaker" }
];

function showCookingTip() {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const tipIndex = seed % COOKING_TIPS.length;
    const { tip, category } = COOKING_TIPS[tipIndex];
    
    const html = `
        <div class="cooking-tip">
            <div class="tip-icon">💡</div>
            <div class="tip-category">${category}</div>
            <p class="tip-text">${tip}</p>
            <div class="tip-actions">
                <button class="btn btn-secondary" onclick="saveTipToFavorites('${tip.replace(/'/g, "\\'")}')">
                    ⭐ Lagre tips
                </button>
                <button class="btn btn-secondary" onclick="showAllTips()">
                    📚 Alle tips
                </button>
            </div>
        </div>
    `;
    
    showModal('💡 Dagens kokketips', html, []);
}
window.showCookingTip = showCookingTip;

function saveTipToFavorites(tip) {
    const savedTips = JSON.parse(localStorage.getItem('kokebok_saved_tips') || '[]');
    if (!savedTips.includes(tip)) {
        savedTips.push(tip);
        localStorage.setItem('kokebok_saved_tips', JSON.stringify(savedTips));
        showToast('⭐ Tips lagret!', 'success');
    } else {
        showToast('Tips allerede lagret', 'info');
    }
}
window.saveTipToFavorites = saveTipToFavorites;

function showAllTips() {
    const savedTips = JSON.parse(localStorage.getItem('kokebok_saved_tips') || '[]');
    
    const html = `
        <div class="all-tips">
            <div class="tips-tabs">
                <button class="tip-tab active" onclick="showTipsTab('all')">Alle tips (${COOKING_TIPS.length})</button>
                <button class="tip-tab" onclick="showTipsTab('saved')">Lagrede (${savedTips.length})</button>
            </div>
            
            <div class="tips-content" id="tipsAllContent">
                ${COOKING_TIPS.map((t, i) => `
                    <div class="tip-item">
                        <span class="tip-num">${i + 1}</span>
                        <div class="tip-body">
                            <span class="tip-cat-badge">${t.category}</span>
                            <p>${t.tip}</p>
                        </div>
                        <button class="tip-save-btn" onclick="saveTipToFavorites('${t.tip.replace(/'/g, "\\'")}')">⭐</button>
                    </div>
                `).join('')}
            </div>
            
            <div class="tips-content hidden" id="tipsSavedContent">
                ${savedTips.length > 0 ? savedTips.map((t, i) => `
                    <div class="tip-item saved">
                        <span class="tip-num">⭐</span>
                        <p>${t}</p>
                    </div>
                `).join('') : '<p class="no-tips">Ingen lagrede tips ennå</p>'}
            </div>
        </div>
    `;
    
    showModal('📚 Kokketips-samling', html, []);
}
window.showAllTips = showAllTips;

function showTipsTab(tab) {
    document.querySelectorAll('.tip-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tips-content').forEach(c => c.classList.add('hidden'));
    
    if (tab === 'all') {
        document.querySelector('.tip-tab:first-child').classList.add('active');
        document.getElementById('tipsAllContent').classList.remove('hidden');
    } else {
        document.querySelector('.tip-tab:last-child').classList.add('active');
        document.getElementById('tipsSavedContent').classList.remove('hidden');
    }
}
window.showTipsTab = showTipsTab;

// ===== SEASONAL CALENDAR =====
const SEASONAL_PRODUCE = {
    1: { // Januar
        vegetables: ['Kål', 'Gulrot', 'Potet', 'Selleri', 'Purre', 'Rosenkål'],
        fruits: ['Eple', 'Pære', 'Sitrus'],
        proteins: ['Torsk', 'Sei', 'Svinekjøtt']
    },
    2: { // Februar
        vegetables: ['Kål', 'Gulrot', 'Potet', 'Selleri', 'Purre'],
        fruits: ['Eple', 'Pære', 'Sitrus'],
        proteins: ['Torsk', 'Skrei', 'Lam']
    },
    3: { // Mars
        vegetables: ['Kål', 'Gulrot', 'Potet', 'Purre', 'Spinat'],
        fruits: ['Eple', 'Rabarbra'],
        proteins: ['Skrei', 'Lam', 'Kylling']
    },
    4: { // April
        vegetables: ['Spinat', 'Reddiker', 'Asparges', 'Salat'],
        fruits: ['Rabarbra'],
        proteins: ['Lam', 'Kylling', 'Ørret']
    },
    5: { // Mai
        vegetables: ['Asparges', 'Spinat', 'Reddiker', 'Salat', 'Vårløk'],
        fruits: ['Rabarbra', 'Jordbær'],
        proteins: ['Lam', 'Ørret', 'Makrell']
    },
    6: { // Juni
        vegetables: ['Asparges', 'Erter', 'Agurk', 'Tomater', 'Salat', 'Nypoteter'],
        fruits: ['Jordbær', 'Rips', 'Stikkelsbær', 'Kirsebær'],
        proteins: ['Makrell', 'Reker', 'Krabbe']
    },
    7: { // Juli
        vegetables: ['Tomater', 'Agurk', 'Squash', 'Mais', 'Bønner', 'Paprika'],
        fruits: ['Jordbær', 'Bringebær', 'Blåbær', 'Kirsebær', 'Plommer'],
        proteins: ['Reker', 'Krabbe', 'Hummer']
    },
    8: { // August
        vegetables: ['Tomater', 'Squash', 'Mais', 'Paprika', 'Aubergine', 'Brokkoli'],
        fruits: ['Bringebær', 'Blåbær', 'Plommer', 'Eple', 'Pære'],
        proteins: ['Hummer', 'Krabbe', 'Villsvin']
    },
    9: { // September
        vegetables: ['Squash', 'Gresskar', 'Kål', 'Brokkoli', 'Løk', 'Rotgrønnsaker'],
        fruits: ['Eple', 'Pære', 'Plommer', 'Druer'],
        proteins: ['Elg', 'Hjort', 'Rype']
    },
    10: { // Oktober
        vegetables: ['Gresskar', 'Kål', 'Rosenkål', 'Rotgrønnsaker', 'Sopp'],
        fruits: ['Eple', 'Pære'],
        proteins: ['Elg', 'Hjort', 'Rype', 'Torsk']
    },
    11: { // November
        vegetables: ['Kål', 'Rosenkål', 'Gulrot', 'Potet', 'Purre'],
        fruits: ['Eple', 'Pære', 'Sitrus'],
        proteins: ['Torsk', 'Svin', 'Vilt']
    },
    12: { // Desember
        vegetables: ['Kål', 'Rosenkål', 'Gulrot', 'Potet', 'Selleri'],
        fruits: ['Eple', 'Pære', 'Sitrus', 'Klementin'],
        proteins: ['Torsk', 'Ribbe', 'Pinnekjøtt']
    }
};

const MONTH_NAMES = ['Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'];

function openSeasonalCalendar() {
    const currentMonth = new Date().getMonth() + 1;
    const data = SEASONAL_PRODUCE[currentMonth];
    
    const html = `
        <div class="seasonal-calendar">
            <div class="season-nav">
                <button onclick="changeSeasonMonth(-1)">←</button>
                <h3 id="seasonMonth">${MONTH_NAMES[currentMonth - 1]}</h3>
                <button onclick="changeSeasonMonth(1)">→</button>
            </div>
            
            <div class="season-grid" id="seasonContent">
                ${renderSeasonContent(currentMonth)}
            </div>
            
            <div class="season-legend">
                <span class="legend-item"><span class="legend-dot veg"></span> Grønnsaker</span>
                <span class="legend-item"><span class="legend-dot fruit"></span> Frukt & bær</span>
                <span class="legend-item"><span class="legend-dot protein"></span> Kjøtt & fisk</span>
            </div>
            
            <button class="btn btn-secondary" onclick="findSeasonalRecipes(${currentMonth})">
                🔍 Finn oppskrifter med sesongens råvarer
            </button>
        </div>
    `;
    
    showModal('🌱 Sesongkalender', html, []);
    window.currentSeasonMonth = currentMonth;
}
window.openSeasonalCalendar = openSeasonalCalendar;

function renderSeasonContent(month) {
    const data = SEASONAL_PRODUCE[month];
    return `
        <div class="season-section">
            <h4>🥬 Grønnsaker</h4>
            <div class="season-items">
                ${data.vegetables.map(v => `<span class="season-item veg">${v}</span>`).join('')}
            </div>
        </div>
        
        <div class="season-section">
            <h4>🍎 Frukt & bær</h4>
            <div class="season-items">
                ${data.fruits.map(f => `<span class="season-item fruit">${f}</span>`).join('')}
            </div>
        </div>
        
        <div class="season-section">
            <h4>🥩 Kjøtt & fisk</h4>
            <div class="season-items">
                ${data.proteins.map(p => `<span class="season-item protein">${p}</span>`).join('')}
            </div>
        </div>
    `;
}

function changeSeasonMonth(delta) {
    window.currentSeasonMonth = ((window.currentSeasonMonth - 1 + delta + 12) % 12) + 1;
    document.getElementById('seasonMonth').textContent = MONTH_NAMES[window.currentSeasonMonth - 1];
    document.getElementById('seasonContent').innerHTML = renderSeasonContent(window.currentSeasonMonth);
}
window.changeSeasonMonth = changeSeasonMonth;

function findSeasonalRecipes(month) {
    const data = SEASONAL_PRODUCE[month];
    const allIngredients = [...data.vegetables, ...data.fruits, ...data.proteins].map(i => i.toLowerCase());
    
    const matches = state.recipes.filter(recipe => {
        const ingredients = getIngredientsAsString(recipe.ingredients).toLowerCase();
        return allIngredients.some(seasonal => ingredients.includes(seasonal.toLowerCase()));
    });
    
    if (matches.length === 0) {
        showToast('Ingen oppskrifter med sesongens råvarer funnet', 'info');
        return;
    }
    
    const html = `
        <div class="seasonal-recipes">
            <p>Fant ${matches.length} oppskrift${matches.length > 1 ? 'er' : ''} med sesongens råvarer:</p>
            <div class="recipe-matches">
                ${matches.slice(0, 10).map(r => `
                    <div class="recipe-match" onclick="viewRecipe('${r.id}'); closeGenericModal();">
                        <span class="match-icon">${getCategoryIcon(r.category)}</span>
                        <span class="match-name">${escapeHtml(r.name)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    showModal(`🌱 Sesongoppskrifter - ${MONTH_NAMES[month - 1]}`, html, []);
}
window.findSeasonalRecipes = findSeasonalRecipes;

// ===== ADVANCED STATISTICS DASHBOARD =====
function openStatsDashboard() {
    const stats = calculateDetailedStats();
    
    const html = `
        <div class="stats-dashboard">
            <div class="stats-hero">
                <div class="stat-hero-item">
                    <span class="hero-num">${stats.totalRecipes}</span>
                    <span class="hero-label">Oppskrifter</span>
                </div>
                <div class="stat-hero-item">
                    <span class="hero-num">${stats.totalBooks}</span>
                    <span class="hero-label">Kokebøker</span>
                </div>
                <div class="stat-hero-item">
                    <span class="hero-num">${stats.favorites}</span>
                    <span class="hero-label">Favoritter</span>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>📊 Kategorier</h4>
                    <div class="category-breakdown">
                        ${stats.byCategory.slice(0, 5).map(c => `
                            <div class="cat-bar">
                                <span class="cat-icon">${c.icon}</span>
                                <span class="cat-name">${c.name}</span>
                                <div class="cat-progress">
                                    <div class="cat-fill" style="width: ${c.percent}%"></div>
                                </div>
                                <span class="cat-count">${c.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="stat-card">
                    <h4>⏱️ Koketider</h4>
                    <div class="time-breakdown">
                        <div class="time-stat">
                            <span class="time-icon">⚡</span>
                            <span>${stats.quickRecipes}</span>
                            <span class="time-label">Under 30 min</span>
                        </div>
                        <div class="time-stat">
                            <span class="time-icon">🍳</span>
                            <span>${stats.mediumRecipes}</span>
                            <span class="time-label">30-60 min</span>
                        </div>
                        <div class="time-stat">
                            <span class="time-icon">🍲</span>
                            <span>${stats.longRecipes}</span>
                            <span class="time-label">Over 60 min</span>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <h4>📅 Aktivitet</h4>
                    <div class="activity-stats">
                        <p>🗓️ Oppskrifter denne måneden: <strong>${stats.thisMonth}</strong></p>
                        <p>📆 Siste 7 dager: <strong>${stats.lastWeek}</strong></p>
                        <p>🏆 Lengste streak: <strong>${stats.streak} dager</strong></p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <h4>🛒 Matkammer</h4>
                    <div class="pantry-stats-detail">
                        <p>📦 Totalt varer: <strong>${stats.pantryItems}</strong></p>
                        <p>💰 Estimert verdi: <strong>~${stats.pantryValue} kr</strong></p>
                        <p>⚠️ Utløper snart: <strong>${stats.expiringItems}</strong></p>
                    </div>
                </div>
                
                <div class="stat-card wide">
                    <h4>🍽️ Kokede oppskrifter</h4>
                    ${stats.recentlyCooked.length > 0 ? `
                        <div class="cooked-history">
                            ${stats.recentlyCooked.map(c => `
                                <div class="cooked-item">
                                    <span class="cooked-name">${escapeHtml(c.name)}</span>
                                    <span class="cooked-date">${c.date}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="no-data">Ingen registrerte kokinger ennå</p>'}
                </div>
            </div>
            
            <div class="stats-achievements">
                <h4>🏆 Prestasjoner</h4>
                <div class="achievement-badges">
                    ${stats.totalRecipes >= 1 ? '<span class="badge earned">👶 Første oppskrift</span>' : '<span class="badge">👶 Første oppskrift</span>'}
                    ${stats.totalRecipes >= 10 ? '<span class="badge earned">📚 10 oppskrifter</span>' : '<span class="badge">📚 10 oppskrifter</span>'}
                    ${stats.totalRecipes >= 50 ? '<span class="badge earned">🏅 50 oppskrifter</span>' : '<span class="badge">🏅 50 oppskrifter</span>'}
                    ${stats.totalRecipes >= 100 ? '<span class="badge earned">🏆 100 oppskrifter</span>' : '<span class="badge">🏆 100 oppskrifter</span>'}
                    ${stats.favorites >= 5 ? '<span class="badge earned">⭐ 5 favoritter</span>' : '<span class="badge">⭐ 5 favoritter</span>'}
                    ${stats.totalBooks >= 3 ? '<span class="badge earned">📖 3 kokebøker</span>' : '<span class="badge">📖 3 kokebøker</span>'}
                </div>
            </div>
        </div>
    `;
    
    showModal('📈 Statistikk-dashboard', html, []);
}
window.openStatsDashboard = openStatsDashboard;

function calculateDetailedStats() {
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Category breakdown
    const categoryCount = {};
    state.recipes.forEach(r => {
        const cat = state.categories.find(c => c.id === r.category) || { name: 'Annet', icon: '🍽️' };
        if (!categoryCount[cat.name]) {
            categoryCount[cat.name] = { count: 0, icon: cat.icon };
        }
        categoryCount[cat.name].count++;
    });
    
    const byCategory = Object.entries(categoryCount)
        .map(([name, data]) => ({
            name,
            icon: data.icon,
            count: data.count,
            percent: Math.round((data.count / Math.max(1, state.recipes.length)) * 100)
        }))
        .sort((a, b) => b.count - a.count);
    
    // Time breakdown
    let quickRecipes = 0, mediumRecipes = 0, longRecipes = 0;
    state.recipes.forEach(r => {
        const time = parseTime(r.prepTime);
        if (time > 0) {
            if (time < 30) quickRecipes++;
            else if (time <= 60) mediumRecipes++;
            else longRecipes++;
        }
    });
    
    // Cooked history
    const cookedHistory = JSON.parse(localStorage.getItem('kokebok_cooked_history') || '[]');
    const recentlyCooked = cookedHistory.slice(-5).reverse().map(c => {
        const recipe = state.recipes.find(r => r.id === c.recipeId);
        return {
            name: recipe?.name || 'Ukjent',
            date: new Date(c.cookedAt).toLocaleDateString('nb-NO')
        };
    });
    
    // Pantry stats
    const pantryItems = state.pantryItems?.length || 0;
    let pantryValue = 0;
    let expiringItems = 0;
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    state.pantryItems?.forEach(item => {
        pantryValue += (item.estimatedPrice || 25) * (item.quantity || 1);
        if (item.expiryDate && new Date(item.expiryDate) <= threeDaysFromNow) {
            expiringItems++;
        }
    });
    
    return {
        totalRecipes: state.recipes.length,
        totalBooks: state.books.length,
        favorites: state.recipes.filter(r => r.favorite).length,
        byCategory,
        quickRecipes,
        mediumRecipes,
        longRecipes,
        thisMonth: state.recipes.filter(r => r.createdAt?.toDate?.() >= monthAgo).length,
        lastWeek: state.recipes.filter(r => r.createdAt?.toDate?.() >= weekAgo).length,
        streak: calculateStreak(),
        pantryItems,
        pantryValue: Math.round(pantryValue),
        expiringItems,
        recentlyCooked
    };
}

function parseTime(timeStr) {
    if (!timeStr) return 0;
    const match = String(timeStr).match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

function calculateStreak() {
    const cookedHistory = JSON.parse(localStorage.getItem('kokebok_cooked_history') || '[]');
    if (cookedHistory.length === 0) return 0;
    
    // Group by day
    const days = new Set();
    cookedHistory.forEach(c => {
        days.add(new Date(c.cookedAt).toDateString());
    });
    
    // Calculate longest streak
    const sortedDays = Array.from(days).sort((a, b) => new Date(b) - new Date(a));
    let streak = 1;
    let maxStreak = 1;
    
    for (let i = 1; i < sortedDays.length; i++) {
        const diff = (new Date(sortedDays[i-1]) - new Date(sortedDays[i])) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
            streak++;
            maxStreak = Math.max(maxStreak, streak);
        } else {
            streak = 1;
        }
    }
    
    return maxStreak;
}

// ===== FOOD WASTE TRACKER =====
function openWasteTracker() {
    const wasteData = JSON.parse(localStorage.getItem('kokebok_waste_log') || '[]');
    const thisMonth = wasteData.filter(w => {
        const date = new Date(w.date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    
    const totalWaste = thisMonth.reduce((sum, w) => sum + (w.quantity || 1), 0);
    const totalValue = thisMonth.reduce((sum, w) => sum + (w.estimatedValue || 0), 0);
    
    const html = `
        <div class="waste-tracker">
            <div class="waste-summary">
                <div class="waste-stat">
                    <span class="waste-num">${totalWaste}</span>
                    <span class="waste-label">Varer kastet</span>
                </div>
                <div class="waste-stat">
                    <span class="waste-num">~${totalValue} kr</span>
                    <span class="waste-label">Estimert verdi</span>
                </div>
            </div>
            
            <div class="waste-goal">
                <p>🎯 Mål: Reduser matsvinn med 20% denne måneden</p>
                <div class="goal-progress">
                    <div class="goal-bar" style="width: ${Math.min(100, 100 - (totalWaste * 10))}%"></div>
                </div>
            </div>
            
            <button class="btn btn-primary" onclick="logWaste()">
                🗑️ Loggfør kastet mat
            </button>
            
            <div class="waste-log">
                <h4>Siste loggføringer</h4>
                ${wasteData.slice(-5).reverse().map(w => `
                    <div class="waste-item">
                        <span class="waste-name">${escapeHtml(w.name)}</span>
                        <span class="waste-reason">${w.reason || 'Ikke spesifisert'}</span>
                        <span class="waste-date">${new Date(w.date).toLocaleDateString('nb-NO')}</span>
                    </div>
                `).join('') || '<p class="no-waste">Ingen loggføringer ennå - flott!</p>'}
            </div>
            
            <div class="waste-tips">
                <h4>💡 Tips for å redusere matsvinn</h4>
                <ul>
                    <li>Planlegg måltider og handlelister</li>
                    <li>Sjekk matkammeret før handling</li>
                    <li>Bruk "først inn, først ut"-prinsippet</li>
                    <li>Frys mat som nærmer seg utløp</li>
                    <li>Lag "resteopskrifter" med det du har</li>
                </ul>
            </div>
        </div>
    `;
    
    showModal('♻️ Matsvinn-tracker', html, []);
}
window.openWasteTracker = openWasteTracker;

function logWaste() {
    const html = `
        <div class="log-waste-form">
            <div class="form-group">
                <label>Hva kastet du?</label>
                <input type="text" id="wasteName" placeholder="f.eks. Brød, melk, grønnsaker...">
            </div>
            <div class="form-group">
                <label>Hvorfor?</label>
                <select id="wasteReason">
                    <option value="expired">Gått ut på dato</option>
                    <option value="spoiled">Blitt dårlig</option>
                    <option value="leftover">Rester ble ikke spist</option>
                    <option value="bought_too_much">Kjøpte for mye</option>
                    <option value="forgot">Glemte at jeg hadde det</option>
                    <option value="other">Annet</option>
                </select>
            </div>
            <div class="form-group">
                <label>Estimert verdi (kr)</label>
                <input type="number" id="wasteValue" placeholder="0" value="25">
            </div>
            <button class="btn btn-primary" onclick="saveWasteLog()">Lagre</button>
        </div>
    `;
    
    showModal('🗑️ Loggfør matsvinn', html, []);
}
window.logWaste = logWaste;

function saveWasteLog() {
    const name = document.getElementById('wasteName')?.value;
    const reason = document.getElementById('wasteReason')?.value;
    const value = parseInt(document.getElementById('wasteValue')?.value) || 0;
    
    if (!name) {
        showToast('Skriv hva du kastet', 'warning');
        return;
    }
    
    const wasteData = JSON.parse(localStorage.getItem('kokebok_waste_log') || '[]');
    wasteData.push({
        name,
        reason,
        estimatedValue: value,
        date: new Date().toISOString()
    });
    localStorage.setItem('kokebok_waste_log', JSON.stringify(wasteData));
    
    closeGenericModal();
    showToast('Loggført - du er på god vei til å redusere matsvinn!', 'success');
    openWasteTracker();
}
window.saveWasteLog = saveWasteLog;

// ===== RECIPE PRINT / EXPORT =====
function printRecipe() {
    const recipe = state.currentRecipe;
    if (!recipe) return;
    
    const printWindow = window.open('', '_blank');
    const ingredients = getIngredientsAsString(recipe.ingredients);
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${escapeHtml(recipe.name)} - Familiens Kokebok</title>
            <style>
                body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 20px; }
                h1 { color: #8B4513; border-bottom: 2px solid #8B4513; padding-bottom: 10px; }
                .meta { color: #666; margin-bottom: 20px; }
                .section { margin: 20px 0; }
                .section h2 { color: #5D3A1A; font-size: 1.2em; }
                pre { white-space: pre-wrap; font-family: inherit; }
                .source { font-style: italic; color: #888; }
                @media print { 
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>${escapeHtml(recipe.name)}</h1>
            <div class="meta">
                ${recipe.servings ? `👥 ${escapeHtml(recipe.servings)} porsjoner` : ''}
                ${recipe.prepTime ? ` • ⏱️ ${escapeHtml(recipe.prepTime)}` : ''}
            </div>
            
            <div class="section">
                <h2>🥄 Ingredienser</h2>
                <pre>${escapeHtml(ingredients)}</pre>
            </div>
            
            <div class="section">
                <h2>👩‍🍳 Fremgangsmåte</h2>
                <pre>${escapeHtml(recipe.instructions || '')}</pre>
            </div>
            
            ${recipe.notes ? `
                <div class="section">
                    <h2>📝 Notater</h2>
                    <p>${escapeHtml(recipe.notes)}</p>
                </div>
            ` : ''}
            
            ${recipe.source ? `<p class="source">Kilde: ${escapeHtml(recipe.source)}</p>` : ''}
            
            <p class="source">Utskrift fra Familiens Kokebok</p>
            
            <button class="no-print" onclick="window.print()">🖨️ Skriv ut</button>
        </body>
        </html>
    `);
    printWindow.document.close();
}
window.printRecipe = printRecipe;

function shareRecipe() {
    const recipe = state.currentRecipe;
    if (!recipe) return;
    
    const text = `${recipe.name}\n\nIngredienser:\n${getIngredientsAsString(recipe.ingredients)}\n\nFremgangsmåte:\n${recipe.instructions || ''}\n\nDelt fra Familiens Kokebok`;
    
    if (navigator.share) {
        navigator.share({
            title: recipe.name,
            text: text
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Oppskrift kopiert til utklippstavle!', 'success');
        });
    }
}
window.shareRecipe = shareRecipe;

// ===== QUICK RECIPE MODE (Step-by-step cooking) =====
let cookingModeActive = false;
let currentCookingStep = 0;
let cookingSteps = [];

function startCookingMode() {
    const recipe = state.currentRecipe;
    if (!recipe?.instructions) {
        showToast('Ingen fremgangsmåte tilgjengelig', 'warning');
        return;
    }
    
    // Parse instructions into steps
    cookingSteps = recipe.instructions
        .split(/\n+/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.match(/^[\d.)\-]+$/));
    
    if (cookingSteps.length === 0) {
        showToast('Kunne ikke dele opp i steg', 'warning');
        return;
    }
    
    currentCookingStep = 0;
    cookingModeActive = true;
    renderCookingStep();
}
window.startCookingMode = startCookingMode;

function renderCookingStep() {
    const recipe = state.currentRecipe;
    const step = cookingSteps[currentCookingStep];
    const progress = Math.round(((currentCookingStep + 1) / cookingSteps.length) * 100);
    
    const html = `
        <div class="cooking-mode">
            <div class="cooking-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <span class="progress-text">Steg ${currentCookingStep + 1} av ${cookingSteps.length}</span>
            </div>
            
            <div class="cooking-step-content">
                <p class="step-text">${escapeHtml(step)}</p>
            </div>
            
            <div class="cooking-controls">
                <button class="cook-btn prev" onclick="prevCookingStep()" ${currentCookingStep === 0 ? 'disabled' : ''}>
                    ← Forrige
                </button>
                
                <button class="cook-btn timer" onclick="showQuickTimer()">
                    ⏱️ Timer
                </button>
                
                ${currentCookingStep === cookingSteps.length - 1 ? `
                    <button class="cook-btn finish" onclick="finishCooking()">
                        ✅ Ferdig!
                    </button>
                ` : `
                    <button class="cook-btn next" onclick="nextCookingStep()">
                        Neste →
                    </button>
                `}
            </div>
            
            <button class="btn btn-secondary btn-small" onclick="exitCookingMode()">
                Avslutt kokmodus
            </button>
        </div>
    `;
    
    showModal(`👨‍🍳 ${escapeHtml(recipe.name)}`, html, []);
}

function nextCookingStep() {
    if (currentCookingStep < cookingSteps.length - 1) {
        currentCookingStep++;
        renderCookingStep();
    }
}
window.nextCookingStep = nextCookingStep;

function prevCookingStep() {
    if (currentCookingStep > 0) {
        currentCookingStep--;
        renderCookingStep();
    }
}
window.prevCookingStep = prevCookingStep;

function finishCooking() {
    cookingModeActive = false;
    closeGenericModal();
    
    const recipe = state.currentRecipe;
    if (recipe) {
        onRecipeCooked(recipe.id);
    }
    
    showToast('🎉 Gratulerer! Du har fullført oppskriften!', 'success');
}
window.finishCooking = finishCooking;

function exitCookingMode() {
    cookingModeActive = false;
    closeGenericModal();
}
window.exitCookingMode = exitCookingMode;

function showQuickTimer() {
    const html = `
        <div class="quick-timer">
            <div class="timer-presets">
                <button onclick="setAndStartTimer(1)">1 min</button>
                <button onclick="setAndStartTimer(3)">3 min</button>
                <button onclick="setAndStartTimer(5)">5 min</button>
                <button onclick="setAndStartTimer(10)">10 min</button>
                <button onclick="setAndStartTimer(15)">15 min</button>
                <button onclick="setAndStartTimer(30)">30 min</button>
            </div>
            <button class="btn btn-secondary" onclick="closeQuickTimer()">Tilbake</button>
        </div>
    `;
    
    showModal('⏱️ Sett timer', html, []);
}
window.showQuickTimer = showQuickTimer;

function setAndStartTimer(minutes) {
    setTimerMinutes(minutes);
    startTimer();
    closeGenericModal();
    showToast(`⏱️ Timer satt til ${minutes} minutter`, 'success');
    
    // Return to cooking mode if active
    if (cookingModeActive) {
        setTimeout(renderCookingStep, 500);
    }
}
window.setAndStartTimer = setAndStartTimer;

function closeQuickTimer() {
    if (cookingModeActive) {
        renderCookingStep();
    } else {
        closeGenericModal();
    }
}
window.closeQuickTimer = closeQuickTimer;

// ===== INITIALIZE PREMIUM FEATURES =====
function initPremiumFeatures() {
    // Initialize voice commands if supported
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        console.log('Voice commands available');
    }
    
    // Show cooking tip on first visit of the day
    const lastTipDate = localStorage.getItem('kokebok_last_tip_date');
    const today = new Date().toDateString();
    if (lastTipDate !== today && state.recipes.length > 0) {
        localStorage.setItem('kokebok_last_tip_date', today);
        setTimeout(showCookingTip, 2000);
    }
}

// =====================================================
// v4.4.0 - ULTIMATE PREMIUM FEATURES
// =====================================================

// ===== INGREDIENT SUBSTITUTION DATABASE =====
const SUBSTITUTIONS = {
    'smør': [
        { sub: 'Margarin', ratio: '1:1', note: 'Fungerer i de fleste oppskrifter' },
        { sub: 'Kokosolje', ratio: '1:1', note: 'Gir mild kokossmak' },
        { sub: 'Olivenolje', ratio: '3/4 mengde', note: 'Best i salte retter' },
        { sub: 'Avokado', ratio: '1:1', note: 'Gir kremete tekstur' }
    ],
    'egg': [
        { sub: 'Chiafrø + vann', ratio: '1 ss chia + 3 ss vann = 1 egg', note: 'La svelle i 5 min' },
        { sub: 'Banan', ratio: '1/2 banan = 1 egg', note: 'Gir søt smak' },
        { sub: 'Eplemos', ratio: '1/4 dl = 1 egg', note: 'Fungerer i kaker' },
        { sub: 'Aquafaba', ratio: '3 ss = 1 egg', note: 'Væske fra kikerter' }
    ],
    'melk': [
        { sub: 'Havremelk', ratio: '1:1', note: 'Nøytral smak' },
        { sub: 'Mandelmelk', ratio: '1:1', note: 'Lett nøttesmak' },
        { sub: 'Kokosmelk', ratio: '1:1', note: 'Rik og kremet' },
        { sub: 'Sojamelk', ratio: '1:1', note: 'Høy proteininnhold' }
    ],
    'fløte': [
        { sub: 'Kokoskrem', ratio: '1:1', note: 'Kjøl ned boksen først' },
        { sub: 'Cashewkrem', ratio: '1:1', note: 'Bløtlegg cashewnøtter' },
        { sub: 'Silketofu', ratio: '1:1', note: 'Blend til glatt' }
    ],
    'hvetemel': [
        { sub: 'Mandelmel', ratio: '1:1', note: 'Glutenfritt, nøttesmak' },
        { sub: 'Havremel', ratio: '1:1', note: 'Glutenfritt alternativ' },
        { sub: 'Kokosmel', ratio: '1/4 mengde', note: 'Absorberer mye væske' },
        { sub: 'Ris­mel', ratio: '7/8 mengde', note: 'Lett tekstur' }
    ],
    'sukker': [
        { sub: 'Honning', ratio: '3/4 mengde', note: 'Reduser væske litt' },
        { sub: 'Lønnesirup', ratio: '3/4 mengde', note: 'Karamellsmak' },
        { sub: 'Stevia', ratio: '1 ts = 1 dl sukker', note: 'Svært søt' },
        { sub: 'Dadler', ratio: '1:1', note: 'Blend med litt vann' }
    ],
    'hvitløk': [
        { sub: 'Hvitløkspulver', ratio: '1/8 ts = 1 fedd', note: 'Mildere smak' },
        { sub: 'Sjalottløk', ratio: '1 liten = 1 fedd', note: 'Mildere smak' }
    ],
    'sitronjuice': [
        { sub: 'Limejuice', ratio: '1:1', note: 'Litt annen smak' },
        { sub: 'Eddik', ratio: '1/2 mengde', note: 'Sterkere smak' },
        { sub: 'Hvitvin', ratio: '1:1', note: 'For koking' }
    ],
    'soyasaus': [
        { sub: 'Tamari', ratio: '1:1', note: 'Glutenfritt' },
        { sub: 'Coconut aminos', ratio: '1:1', note: 'Soyafritt, søtere' },
        { sub: 'Worcestershire', ratio: '1:1', note: 'Annen smaksprofil' }
    ],
    'ost': [
        { sub: 'Nutritional yeast', ratio: '2 ss = 1/4 dl ost', note: 'Osteaktig smak' },
        { sub: 'Vegansk ost', ratio: '1:1', note: 'Varierer i kvalitet' }
    ]
};

function openSubstitutionFinder() {
    const html = `
        <div class="substitution-finder">
            <div class="sub-search">
                <input type="text" id="subSearchInput" placeholder="Søk etter ingrediens..." 
                       oninput="searchSubstitutions(this.value)">
            </div>
            
            <div class="sub-quick-links">
                <h4>Vanlige erstatninger:</h4>
                <div class="sub-tags">
                    ${Object.keys(SUBSTITUTIONS).map(ing => 
                        `<button class="sub-tag" onclick="showSubstitution('${ing}')">${ing}</button>`
                    ).join('')}
                </div>
            </div>
            
            <div id="subResults" class="sub-results">
                <p class="sub-hint">Velg en ingrediens eller søk for å finne erstatninger</p>
            </div>
        </div>
    `;
    
    showModal('🔄 Ingrediens-erstatter', html, []);
}
window.openSubstitutionFinder = openSubstitutionFinder;

function showSubstitution(ingredient) {
    const subs = SUBSTITUTIONS[ingredient.toLowerCase()];
    if (!subs) {
        document.getElementById('subResults').innerHTML = `
            <p class="no-subs">Ingen erstatninger funnet for "${ingredient}"</p>
        `;
        return;
    }
    
    document.getElementById('subResults').innerHTML = `
        <div class="sub-card">
            <h3>Erstatninger for ${ingredient}</h3>
            <div class="sub-list">
                ${subs.map(s => `
                    <div class="sub-item">
                        <div class="sub-main">
                            <span class="sub-name">${s.sub}</span>
                            <span class="sub-ratio">${s.ratio}</span>
                        </div>
                        <p class="sub-note">${s.note}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}
window.showSubstitution = showSubstitution;

function searchSubstitutions(query) {
    if (!query || query.length < 2) {
        document.getElementById('subResults').innerHTML = `
            <p class="sub-hint">Velg en ingrediens eller søk for å finne erstatninger</p>
        `;
        return;
    }
    
    const matches = Object.keys(SUBSTITUTIONS).filter(ing => 
        ing.includes(query.toLowerCase())
    );
    
    if (matches.length > 0) {
        showSubstitution(matches[0]);
    } else {
        document.getElementById('subResults').innerHTML = `
            <p class="no-subs">Ingen erstatninger funnet for "${query}"</p>
        `;
    }
}
window.searchSubstitutions = searchSubstitutions;

// ===== TEMPERATURE CONVERTER =====
function openTemperatureConverter() {
    const html = `
        <div class="temp-converter">
            <div class="temp-input-group">
                <div class="temp-input">
                    <label>Celsius</label>
                    <input type="number" id="celsiusInput" placeholder="°C" oninput="convertTemp('c')">
                </div>
                <span class="temp-arrow">⇄</span>
                <div class="temp-input">
                    <label>Fahrenheit</label>
                    <input type="number" id="fahrenheitInput" placeholder="°F" oninput="convertTemp('f')">
                </div>
            </div>
            
            <div class="temp-presets">
                <h4>Vanlige ovnstemperaturer:</h4>
                <div class="temp-preset-grid">
                    <div class="temp-preset" onclick="setTemp(150)">
                        <span class="temp-c">150°C</span>
                        <span class="temp-f">300°F</span>
                        <span class="temp-desc">Lav</span>
                    </div>
                    <div class="temp-preset" onclick="setTemp(175)">
                        <span class="temp-c">175°C</span>
                        <span class="temp-f">350°F</span>
                        <span class="temp-desc">Middels</span>
                    </div>
                    <div class="temp-preset" onclick="setTemp(200)">
                        <span class="temp-c">200°C</span>
                        <span class="temp-f">400°F</span>
                        <span class="temp-desc">Høy</span>
                    </div>
                    <div class="temp-preset" onclick="setTemp(220)">
                        <span class="temp-c">220°C</span>
                        <span class="temp-f">425°F</span>
                        <span class="temp-desc">Veldig høy</span>
                    </div>
                    <div class="temp-preset" onclick="setTemp(250)">
                        <span class="temp-c">250°C</span>
                        <span class="temp-f">480°F</span>
                        <span class="temp-desc">Maks</span>
                    </div>
                </div>
            </div>
            
            <div class="temp-tips">
                <h4>💡 Tips:</h4>
                <p>Vifteovn: Reduser temperaturen med 20-25°C</p>
            </div>
        </div>
    `;
    
    showModal('🌡️ Temperaturomregner', html, []);
}
window.openTemperatureConverter = openTemperatureConverter;

function convertTemp(from) {
    const celsiusInput = document.getElementById('celsiusInput');
    const fahrenheitInput = document.getElementById('fahrenheitInput');
    
    if (from === 'c') {
        const c = parseFloat(celsiusInput.value);
        if (!isNaN(c)) {
            fahrenheitInput.value = Math.round((c * 9/5) + 32);
        }
    } else {
        const f = parseFloat(fahrenheitInput.value);
        if (!isNaN(f)) {
            celsiusInput.value = Math.round((f - 32) * 5/9);
        }
    }
}
window.convertTemp = convertTemp;

function setTemp(celsius) {
    document.getElementById('celsiusInput').value = celsius;
    convertTemp('c');
}
window.setTemp = setTemp;

// ===== MEAT TEMPERATURE GUIDE =====
const MEAT_TEMPERATURES = {
    beef: {
        name: 'Storfe / Biff',
        icon: '🥩',
        temps: [
            { level: 'Blue rare (rå)', temp: '46-49°C', desc: 'Veldig rå, kjølig senter' },
            { level: 'Rare (rå+)', temp: '52-55°C', desc: 'Rød kjerne, saftig' },
            { level: 'Medium rare', temp: '55-57°C', desc: 'Varmrosa kjerne, anbefalt' },
            { level: 'Medium', temp: '60-63°C', desc: 'Rosa kjerne' },
            { level: 'Medium well', temp: '65-69°C', desc: 'Svakt rosa' },
            { level: 'Well done (gjennomstekt)', temp: '71°C+', desc: 'Ingen rosa, tørrere' }
        ],
        tips: 'La biffen hvile 5-10 min etter steking. Temperaturen stiger 3-5°C under hvile.'
    },
    pork: {
        name: 'Svin',
        icon: '🐷',
        temps: [
            { level: 'Medium (saftig)', temp: '63-65°C', desc: 'Svakt rosa, saftig' },
            { level: 'Well done (anbefalt)', temp: '68-71°C', desc: 'Gjennomstekt, trygt' },
            { level: 'Ribbe/pulled pork', temp: '88-95°C', desc: 'Mørt og fallende av beinet' }
        ],
        tips: 'Svinekjøtt bør alltid være minimum 63°C for mattrygghet.'
    },
    chicken: {
        name: 'Kylling',
        icon: '🍗',
        temps: [
            { level: 'Bryst', temp: '74°C', desc: 'Hvit, saftig, ingen rosa' },
            { level: 'Lår', temp: '76-82°C', desc: 'Mørt, faller av beinet' },
            { level: 'Hel kylling', temp: '74-82°C', desc: 'Sjekk tykkeste del av låret' }
        ],
        tips: '⚠️ Kylling må ALLTID være minimum 74°C! Aldri rosa.'
    },
    lamb: {
        name: 'Lam',
        icon: '🐑',
        temps: [
            { level: 'Rare (rå)', temp: '52-55°C', desc: 'Rød kjerne' },
            { level: 'Medium rare', temp: '55-60°C', desc: 'Varmrosa, anbefalt' },
            { level: 'Medium', temp: '60-65°C', desc: 'Rosa kjerne' },
            { level: 'Well done', temp: '70°C+', desc: 'Gjennomstekt' },
            { level: 'Lammelår (langsom)', temp: '85-90°C', desc: 'Mørt og saftig' }
        ],
        tips: 'Lam tåler å være rosa. La hvile 10-15 min etter steking.'
    },
    fish: {
        name: 'Fisk',
        icon: '🐟',
        temps: [
            { level: 'Laks (medium)', temp: '52-54°C', desc: 'Halvgjennomsiktig senter, saftig' },
            { level: 'Laks (gjennomstekt)', temp: '60-63°C', desc: 'Gjennomstekt, flaker lett' },
            { level: 'Hvitfisk (torsk, sei)', temp: '60-63°C', desc: 'Hvit og flaker lett' },
            { level: 'Tunfisk (rå)', temp: '43-52°C', desc: 'Rå i midten, stekt utenpå' },
            { level: 'Reker', temp: '57-60°C', desc: 'Rosa og fast' }
        ],
        tips: 'Fisk fortsetter å tilberedes etter at den tas av varmen.'
    },
    ground: {
        name: 'Kvernet kjøtt',
        icon: '🍔',
        temps: [
            { level: 'Burger (medium rare)', temp: '60°C', desc: 'Rosa i midten (kun fersk kjøtt)' },
            { level: 'Burger (trygg)', temp: '71°C', desc: 'Gjennomstekt, anbefalt' },
            { level: 'Kjøttboller', temp: '74°C', desc: 'Gjennomstekt' },
            { level: 'Kjøttdeig (alle typer)', temp: '71-74°C', desc: 'Minimum for mattrygghet' }
        ],
        tips: '⚠️ Kvernet kjøtt har bakterier på hele overflaten - bør alltid være gjennomstekt!'
    },
    game: {
        name: 'Vilt',
        icon: '🦌',
        temps: [
            { level: 'Hjort (rare)', temp: '52-55°C', desc: 'Mørkerød kjerne' },
            { level: 'Hjort (medium rare)', temp: '55-60°C', desc: 'Rosa kjerne, anbefalt' },
            { level: 'Hjort (medium)', temp: '60-65°C', desc: 'Varmrosa' },
            { level: 'Elg', temp: '55-63°C', desc: 'Rosa til medium' },
            { level: 'Villsvin', temp: '71°C', desc: 'Gjennomstekt, som svin' }
        ],
        tips: 'Vilt er magert - oversteker lett. Hold temperaturen lav og la hvile godt.'
    },
    duck: {
        name: 'And / Ender',
        icon: '🦆',
        temps: [
            { level: 'Bryst (medium rare)', temp: '54-57°C', desc: 'Rosa kjerne, saftig' },
            { level: 'Bryst (medium)', temp: '60-63°C', desc: 'Varmrosa' },
            { level: 'Lår (confit)', temp: '74-82°C', desc: 'Mørt, faller av bein' }
        ],
        tips: 'Andebryst kan serveres rosa som biff. Stek med skinnsiden ned først.'
    }
};

function openMeatTemperatureGuide() {
    const html = `
        <div class="meat-temp-guide">
            <div class="meat-categories">
                ${Object.entries(MEAT_TEMPERATURES).map(([key, data]) => `
                    <button class="meat-cat-btn" onclick="showMeatTemps('${key}')">
                        <span class="meat-icon">${data.icon}</span>
                        <span class="meat-name">${data.name}</span>
                    </button>
                `).join('')}
            </div>
            
            <div id="meatTempResults" class="meat-temp-results">
                <p class="meat-temp-hint">👆 Velg type kjøtt for å se anbefalte temperaturer</p>
            </div>
            
            <div class="meat-temp-disclaimer">
                <p>⚠️ <strong>Viktig:</strong> Disse temperaturene er for kjernetemperatur målt med steketermometer.</p>
                <p>🍼 Gravide, barn og eldre bør unngå rått kjøtt.</p>
            </div>
        </div>
    `;
    
    showModal('🌡️🥩 Steketemperaturer', html, []);
}
window.openMeatTemperatureGuide = openMeatTemperatureGuide;

function showMeatTemps(meatType) {
    const data = MEAT_TEMPERATURES[meatType];
    if (!data) return;
    
    const resultsDiv = document.getElementById('meatTempResults');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = `
        <div class="meat-temp-card">
            <div class="meat-temp-header">
                <span class="meat-big-icon">${data.icon}</span>
                <h3>${data.name}</h3>
            </div>
            
            <div class="temp-levels">
                ${data.temps.map(t => `
                    <div class="temp-level">
                        <div class="temp-level-main">
                            <span class="temp-name">${t.level}</span>
                            <span class="temp-value">${t.temp}</span>
                        </div>
                        <p class="temp-desc">${t.desc}</p>
                    </div>
                `).join('')}
            </div>
            
            <div class="meat-tip">
                <span>💡</span>
                <p>${data.tips}</p>
            </div>
        </div>
    `;
    
    // Highlight selected button
    document.querySelectorAll('.meat-cat-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.meat-cat-btn')?.classList.add('active');
}
window.showMeatTemps = showMeatTemps;

// ===== WINE PAIRING GUIDE =====
const winePairings = {
    'beef': {
        emoji: '🥩',
        name: 'Biff & Storfe',
        wines: [
            { type: 'Cabernet Sauvignon', desc: 'Klassisk til biff med tanniner som balanserer fettet', rating: 5 },
            { type: 'Malbec', desc: 'Argentinsk fullkroppsvin, perfekt til grillet kjøtt', rating: 5 },
            { type: 'Syrah/Shiraz', desc: 'Krydret og kraftig, god til marinert biff', rating: 4 },
            { type: 'Barolo', desc: 'Italiensk luksus til spesielle anledninger', rating: 5 },
            { type: 'Merlot', desc: 'Mykere alternativ, god til mørt kjøtt', rating: 4 }
        ]
    },
    'lamb': {
        emoji: '🍖',
        name: 'Lam',
        wines: [
            { type: 'Rioja', desc: 'Spansk klassiker, perfekt match til lam', rating: 5 },
            { type: 'Côtes du Rhône', desc: 'Krydret og elegant med urtenoter', rating: 5 },
            { type: 'Pinot Noir', desc: 'Lettere alternativ til lammesteak', rating: 4 },
            { type: 'Châteauneuf-du-Pape', desc: 'Kraftig og kompleks til feiring', rating: 5 },
            { type: 'Grenache', desc: 'Fruktdreven og vennlig pris', rating: 4 }
        ]
    },
    'pork': {
        emoji: '🥓',
        name: 'Svin',
        wines: [
            { type: 'Riesling', desc: 'Spesielt tørr Riesling til svinekjøtt', rating: 5 },
            { type: 'Chardonnay', desc: 'Eiket utgave til kremet tilberedning', rating: 4 },
            { type: 'Pinot Noir', desc: 'Universell match, spesielt til ribbe', rating: 5 },
            { type: 'Rosé', desc: 'Forfriskende til svinenakke og pulled pork', rating: 4 },
            { type: 'Zinfandel', desc: 'Fruktdreven, god til BBQ-saus', rating: 4 }
        ]
    },
    'chicken': {
        emoji: '🍗',
        name: 'Kylling & Fjærfe',
        wines: [
            { type: 'Chardonnay', desc: 'Klassiker til stekt kylling', rating: 5 },
            { type: 'Pinot Grigio', desc: 'Frisk og lett til hvitt kjøtt', rating: 4 },
            { type: 'Sauvignon Blanc', desc: 'Perfekt til urtemrinert kylling', rating: 5 },
            { type: 'Champagne/Musserende', desc: 'Elegant til kyllingrett', rating: 4 },
            { type: 'Viognier', desc: 'Blomstret og aromatisk alternativ', rating: 4 }
        ]
    },
    'fish': {
        emoji: '🐟',
        name: 'Fisk',
        wines: [
            { type: 'Chablis', desc: 'Mineralsk, perfekt til skalldyr og hvitfisk', rating: 5 },
            { type: 'Muscadet', desc: 'Klassiker til østers og blåskjell', rating: 5 },
            { type: 'Pinot Grigio', desc: 'Lett og spritsende til laks', rating: 4 },
            { type: 'Albariño', desc: 'Spansk hvitvin til sjømat', rating: 5 },
            { type: 'Sancerre', desc: 'Elegant Sauvignon Blanc til fin fisk', rating: 5 }
        ]
    },
    'pasta': {
        emoji: '🍝',
        name: 'Pasta',
        wines: [
            { type: 'Chianti', desc: 'Italiensk klassiker til tomatsaus', rating: 5 },
            { type: 'Sangiovese', desc: 'Frisk syre balanserer tomater', rating: 5 },
            { type: 'Pinot Grigio', desc: 'Perfekt til hvite sauser og pesto', rating: 4 },
            { type: 'Barbera', desc: 'Lett og fruktig til bolognese', rating: 4 },
            { type: 'Verdicchio', desc: 'Til sjømatpasta', rating: 4 }
        ]
    },
    'pizza': {
        emoji: '🍕',
        name: 'Pizza',
        wines: [
            { type: 'Montepulciano', desc: 'Klassisk italiensk, uformell og god', rating: 5 },
            { type: 'Barbera', desc: 'Lett og frisk til ostepizza', rating: 4 },
            { type: 'Lambrusco', desc: 'Lettbrusende, perfekt match!', rating: 5 },
            { type: 'Nero d\'Avola', desc: 'Siciliansk til kjøttpizza', rating: 4 },
            { type: 'Prosecco', desc: 'Feiring med pizza!', rating: 4 }
        ]
    },
    'cheese': {
        emoji: '🧀',
        name: 'Ost',
        wines: [
            { type: 'Port', desc: 'Klassiker til blåost', rating: 5 },
            { type: 'Sauternes', desc: 'Søt vin til kraftige oster', rating: 5 },
            { type: 'Champagne', desc: 'Bobler til brie og camembert', rating: 5 },
            { type: 'Riesling', desc: 'Aromatisk til geitost', rating: 4 },
            { type: 'Amarone', desc: 'Kraftig til parmesan', rating: 5 }
        ]
    },
    'dessert': {
        emoji: '🍰',
        name: 'Dessert',
        wines: [
            { type: 'Moscato d\'Asti', desc: 'Lett søt til frukdessert', rating: 5 },
            { type: 'Late Harvest Riesling', desc: 'Honning og aprikos', rating: 5 },
            { type: 'Sherry (Pedro Ximénez)', desc: 'Til sjokolade!', rating: 5 },
            { type: 'Champagne Demi-Sec', desc: 'Til kake og macarons', rating: 4 },
            { type: 'Brachetto', desc: 'Lett rød til bær', rating: 4 }
        ]
    }
};

function openWinePairing(recipeId = null) {
    let selectedCategory = null;
    
    // If called from a recipe, try to auto-detect category
    if (recipeId) {
        const recipe = state.recipes.find(r => r.id === recipeId);
        if (recipe) {
            const name = (recipe.name + ' ' + (recipe.description || '')).toLowerCase();
            if (name.includes('biff') || name.includes('okse') || name.includes('storfe')) selectedCategory = 'beef';
            else if (name.includes('lam')) selectedCategory = 'lamb';
            else if (name.includes('svin') || name.includes('ribbe') || name.includes('nakke')) selectedCategory = 'pork';
            else if (name.includes('kylling') || name.includes('and') || name.includes('kalkun')) selectedCategory = 'chicken';
            else if (name.includes('fisk') || name.includes('laks') || name.includes('torsk') || name.includes('reke')) selectedCategory = 'fish';
            else if (name.includes('pasta') || name.includes('spaghetti') || name.includes('lasagne')) selectedCategory = 'pasta';
            else if (name.includes('pizza')) selectedCategory = 'pizza';
            else if (name.includes('ost') || name.includes('fondue')) selectedCategory = 'cheese';
            else if (name.includes('kake') || name.includes('dessert') || name.includes('sjokolade')) selectedCategory = 'dessert';
        }
    }
    
    const categoryButtons = Object.entries(winePairings).map(([key, data]) => 
        `<button class="wine-cat-btn ${selectedCategory === key ? 'active' : ''}" onclick="showWinePairings('${key}')">${data.emoji}<br>${data.name}</button>`
    ).join('');
    
    openGenericModal('🍷 Vinanbefaling', `
        <div class="wine-pairing-guide">
            <p style="text-align: center; color: var(--text-secondary); margin-bottom: 16px;">
                Velg mattype for å få vinforslag
            </p>
            <div class="wine-categories" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px;">
                ${categoryButtons}
            </div>
            <div id="winePairingResults" class="wine-results">
                ${selectedCategory ? getWinePairingHtml(selectedCategory) : '<p style="text-align: center; color: var(--text-tertiary);">👆 Velg en kategori over</p>'}
            </div>
        </div>
    `, [], { width: '450px' });
}
window.openWinePairing = openWinePairing;

function showWinePairings(category) {
    const resultsDiv = document.getElementById('winePairingResults');
    if (!resultsDiv || !winePairings[category]) return;
    
    resultsDiv.innerHTML = getWinePairingHtml(category);
    
    // Highlight selected button
    document.querySelectorAll('.wine-cat-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.wine-cat-btn')?.classList.add('active');
}
window.showWinePairings = showWinePairings;

function getWinePairingHtml(category) {
    const data = winePairings[category];
    if (!data) return '';
    
    return `
        <div class="wine-pairing-list">
            <h4 style="margin: 0 0 12px 0;">${data.emoji} Viner til ${data.name}</h4>
            ${data.wines.map(wine => `
                <div class="wine-item" style="padding: 12px; background: var(--card-bg); border-radius: 8px; margin-bottom: 8px; border: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="color: var(--accent-color);">🍷 ${wine.type}</strong>
                        <span style="color: #f4c430;">${'★'.repeat(wine.rating)}${'☆'.repeat(5-wine.rating)}</span>
                    </div>
                    <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: var(--text-secondary);">${wine.desc}</p>
                </div>
            `).join('')}
            <p style="margin: 12px 0 0 0; font-size: 0.8rem; color: var(--text-tertiary); text-align: center;">
                💡 Tips: Temperaturen for rødvin er 16-18°C, hvitvin 8-12°C
            </p>
        </div>
    `;
}

// ===== KITCHEN CONVERSION CALCULATOR =====
const kitchenConversions = {
    volume: {
        'dl': { 'ml': 100, 'liter': 0.1, 'ss': 6.67, 'ts': 20, 'kopp': 0.42 },
        'ml': { 'dl': 0.01, 'liter': 0.001, 'ss': 0.067, 'ts': 0.2, 'kopp': 0.0042 },
        'liter': { 'dl': 10, 'ml': 1000, 'ss': 66.7, 'ts': 200, 'kopp': 4.2 },
        'ss': { 'dl': 0.15, 'ml': 15, 'ts': 3, 'kopp': 0.063 },
        'ts': { 'dl': 0.05, 'ml': 5, 'ss': 0.33, 'kopp': 0.021 },
        'kopp': { 'dl': 2.37, 'ml': 237, 'liter': 0.237, 'ss': 16, 'ts': 48 }
    },
    weight: {
        'g': { 'kg': 0.001, 'mg': 1000, 'oz': 0.035, 'lb': 0.0022 },
        'kg': { 'g': 1000, 'mg': 1000000, 'oz': 35.27, 'lb': 2.2 },
        'oz': { 'g': 28.35, 'kg': 0.028, 'lb': 0.0625 },
        'lb': { 'g': 453.6, 'kg': 0.454, 'oz': 16 }
    },
    temperature: {
        'celsius': { 'fahrenheit': (c) => c * 9/5 + 32, 'kelvin': (c) => c + 273.15 },
        'fahrenheit': { 'celsius': (f) => (f - 32) * 5/9, 'kelvin': (f) => (f - 32) * 5/9 + 273.15 },
        'kelvin': { 'celsius': (k) => k - 273.15, 'fahrenheit': (k) => (k - 273.15) * 9/5 + 32 }
    }
};

// Common ingredient densities (g per dl)
const ingredientDensities = {
    'mel': 60, 'hvetemel': 60, 'sukker': 85, 'melis': 50, 'brunt sukker': 90,
    'smør': 96, 'olje': 92, 'melk': 103, 'fløte': 100, 'rømme': 115,
    'ris': 95, 'havregryn': 40, 'mandler': 70, 'valnøtter': 50,
    'honning': 140, 'sirup': 140, 'kakao': 45, 'salt': 120, 'pepper': 50,
    'parmesan': 50, 'cottage cheese': 115, 'yoghurt': 102
};

function openKitchenCalculator() {
    openGenericModal('🧮 Kjøkken-kalkulator', `
        <div class="kitchen-calculator">
            <div class="calc-tabs" style="display: flex; gap: 8px; margin-bottom: 16px;">
                <button class="calc-tab active" onclick="showCalcTab('volume')">📏 Volum</button>
                <button class="calc-tab" onclick="showCalcTab('weight')">⚖️ Vekt</button>
                <button class="calc-tab" onclick="showCalcTab('temp')">🌡️ Temperatur</button>
                <button class="calc-tab" onclick="showCalcTab('ingredient')">🥄 Ingrediens</button>
            </div>
            
            <div id="calcTabContent">
                ${getVolumeCalcHtml()}
            </div>
        </div>
    `, [], { width: '400px' });
}
window.openKitchenCalculator = openKitchenCalculator;

function showCalcTab(tab) {
    document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    const content = document.getElementById('calcTabContent');
    if (tab === 'volume') content.innerHTML = getVolumeCalcHtml();
    else if (tab === 'weight') content.innerHTML = getWeightCalcHtml();
    else if (tab === 'temp') content.innerHTML = getTempCalcHtml();
    else if (tab === 'ingredient') content.innerHTML = getIngredientCalcHtml();
}
window.showCalcTab = showCalcTab;

function getVolumeCalcHtml() {
    return `
        <div class="calc-section">
            <input type="number" id="volumeAmount" placeholder="Mengde" style="width: 100%; padding: 12px; font-size: 1.2rem; margin-bottom: 8px; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <select id="volumeFrom" style="flex: 1; padding: 10px; border-radius: 8px;" onchange="convertVolume()">
                    <option value="dl">dl (desiliter)</option>
                    <option value="ml">ml (milliliter)</option>
                    <option value="liter">liter</option>
                    <option value="ss">ss (spiseskje)</option>
                    <option value="ts">ts (teskje)</option>
                    <option value="kopp">kopp (US)</option>
                </select>
                <span style="padding: 10px;">→</span>
                <select id="volumeTo" style="flex: 1; padding: 10px; border-radius: 8px;" onchange="convertVolume()">
                    <option value="ml">ml</option>
                    <option value="dl">dl</option>
                    <option value="liter">liter</option>
                    <option value="ss">ss</option>
                    <option value="ts">ts</option>
                    <option value="kopp">kopp</option>
                </select>
            </div>
            <button onclick="convertVolume()" class="btn-primary" style="width: 100%; padding: 12px;">Konverter</button>
            <div id="volumeResult" style="margin-top: 12px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px; text-align: center; font-size: 1.3rem; font-weight: bold;"></div>
        </div>
    `;
}

function getWeightCalcHtml() {
    return `
        <div class="calc-section">
            <input type="number" id="weightAmount" placeholder="Mengde" style="width: 100%; padding: 12px; font-size: 1.2rem; margin-bottom: 8px; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <select id="weightFrom" style="flex: 1; padding: 10px; border-radius: 8px;">
                    <option value="g">gram</option>
                    <option value="kg">kilogram</option>
                    <option value="oz">ounce</option>
                    <option value="lb">pound</option>
                </select>
                <span style="padding: 10px;">→</span>
                <select id="weightTo" style="flex: 1; padding: 10px; border-radius: 8px;">
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="oz">oz</option>
                    <option value="lb">lb</option>
                </select>
            </div>
            <button onclick="convertWeight()" class="btn-primary" style="width: 100%; padding: 12px;">Konverter</button>
            <div id="weightResult" style="margin-top: 12px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px; text-align: center; font-size: 1.3rem; font-weight: bold;"></div>
        </div>
    `;
}

function getTempCalcHtml() {
    return `
        <div class="calc-section">
            <input type="number" id="tempAmount" placeholder="Temperatur" style="width: 100%; padding: 12px; font-size: 1.2rem; margin-bottom: 8px; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <select id="tempFrom" style="flex: 1; padding: 10px; border-radius: 8px;">
                    <option value="celsius">Celsius (°C)</option>
                    <option value="fahrenheit">Fahrenheit (°F)</option>
                </select>
                <span style="padding: 10px;">→</span>
                <select id="tempTo" style="flex: 1; padding: 10px; border-radius: 8px;">
                    <option value="fahrenheit">Fahrenheit (°F)</option>
                    <option value="celsius">Celsius (°C)</option>
                </select>
            </div>
            <button onclick="convertTemp()" class="btn-primary" style="width: 100%; padding: 12px;">Konverter</button>
            <div id="tempResult" style="margin-top: 12px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px; text-align: center; font-size: 1.3rem; font-weight: bold;"></div>
            <div style="margin-top: 12px; font-size: 0.9rem; color: var(--text-secondary);">
                <p>🔥 Vanlige ovnstemp: 175°C = 350°F, 200°C = 400°F, 225°C = 435°F</p>
            </div>
        </div>
    `;
}

function getIngredientCalcHtml() {
    const options = Object.keys(ingredientDensities).map(i => `<option value="${i}">${i}</option>`).join('');
    return `
        <div class="calc-section">
            <p style="margin-bottom: 12px; color: var(--text-secondary);">Konverter mellom volum og vekt for vanlige ingredienser</p>
            <select id="ingredientSelect" style="width: 100%; padding: 10px; border-radius: 8px; margin-bottom: 8px;">
                ${options}
            </select>
            <input type="number" id="ingredientAmount" placeholder="Mengde" style="width: 100%; padding: 12px; font-size: 1.2rem; margin-bottom: 8px; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <select id="ingredientFrom" style="flex: 1; padding: 10px; border-radius: 8px;">
                    <option value="dl">dl</option>
                    <option value="g">gram</option>
                </select>
                <span style="padding: 10px;">→</span>
                <select id="ingredientTo" style="flex: 1; padding: 10px; border-radius: 8px;">
                    <option value="g">gram</option>
                    <option value="dl">dl</option>
                </select>
            </div>
            <button onclick="convertIngredient()" class="btn-primary" style="width: 100%; padding: 12px;">Konverter</button>
            <div id="ingredientResult" style="margin-top: 12px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px; text-align: center; font-size: 1.3rem; font-weight: bold;"></div>
        </div>
    `;
}

function convertVolume() {
    const amount = parseFloat($('volumeAmount')?.value);
    const from = $('volumeFrom')?.value;
    const to = $('volumeTo')?.value;
    const result = $('volumeResult');
    
    if (!amount || !from || !to || !result) return;
    
    if (from === to) {
        result.innerHTML = `${amount} ${from}`;
        return;
    }
    
    const factor = kitchenConversions.volume[from]?.[to];
    if (factor) {
        const converted = (amount * factor).toFixed(2);
        result.innerHTML = `${amount} ${from} = <strong>${converted} ${to}</strong>`;
    }
}
window.convertVolume = convertVolume;

function convertWeight() {
    const amount = parseFloat($('weightAmount')?.value);
    const from = $('weightFrom')?.value;
    const to = $('weightTo')?.value;
    const result = $('weightResult');
    
    if (!amount || !from || !to || !result) return;
    
    if (from === to) {
        result.innerHTML = `${amount} ${from}`;
        return;
    }
    
    const factor = kitchenConversions.weight[from]?.[to];
    if (factor) {
        const converted = (amount * factor).toFixed(2);
        result.innerHTML = `${amount} ${from} = <strong>${converted} ${to}</strong>`;
    }
}
window.convertWeight = convertWeight;

function convertTemp() {
    const amount = parseFloat($('tempAmount')?.value);
    const from = $('tempFrom')?.value;
    const to = $('tempTo')?.value;
    const result = $('tempResult');
    
    if (isNaN(amount) || !from || !to || !result) return;
    
    if (from === to) {
        result.innerHTML = `${amount}°`;
        return;
    }
    
    const converter = kitchenConversions.temperature[from]?.[to];
    if (converter) {
        const converted = converter(amount).toFixed(1);
        const symbol = to === 'celsius' ? '°C' : to === 'fahrenheit' ? '°F' : 'K';
        const fromSymbol = from === 'celsius' ? '°C' : from === 'fahrenheit' ? '°F' : 'K';
        result.innerHTML = `${amount}${fromSymbol} = <strong>${converted}${symbol}</strong>`;
    }
}
window.convertTemp = convertTemp;

function convertIngredient() {
    const ingredient = $('ingredientSelect')?.value;
    const amount = parseFloat($('ingredientAmount')?.value);
    const from = $('ingredientFrom')?.value;
    const to = $('ingredientTo')?.value;
    const result = $('ingredientResult');
    
    if (!ingredient || !amount || !from || !to || !result) return;
    
    const density = ingredientDensities[ingredient]; // g per dl
    
    let converted;
    if (from === 'dl' && to === 'g') {
        converted = amount * density;
    } else if (from === 'g' && to === 'dl') {
        converted = amount / density;
    } else {
        result.innerHTML = `${amount} ${from}`;
        return;
    }
    
    result.innerHTML = `${amount} ${from} ${ingredient} = <strong>${converted.toFixed(1)} ${to}</strong>`;
}
window.convertIngredient = convertIngredient;

// ===== RECIPE COST CALCULATOR =====
function openRecipeCostCalculator(recipeId = null) {
    let recipe = null;
    if (recipeId) {
        recipe = state.recipes.find(r => r.id === recipeId);
    }
    
    const ingredientRows = recipe?.ingredients?.map((ing, i) => `
        <div class="cost-row" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
            <span style="flex: 2;">${escapeHtml(ing)}</span>
            <input type="number" class="cost-input" data-index="${i}" placeholder="Pris" 
                   style="flex: 1; padding: 8px; border-radius: 8px; border: 1px solid var(--border-color);">
        </div>
    `).join('') || '<p>Velg en oppskrift først</p>';
    
    openGenericModal('💰 Kostnadskalkulator', `
        <div class="cost-calculator">
            ${!recipe ? `
                <select id="costRecipeSelect" onchange="loadRecipeForCost(this.value)" 
                        style="width: 100%; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                    <option value="">Velg oppskrift...</option>
                    ${state.recipes.map(r => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('')}
                </select>
            ` : `<h3 style="margin-bottom: 16px;">${escapeHtml(recipe.name)}</h3>`}
            
            <div id="costIngredients">
                ${ingredientRows}
            </div>
            
            <div style="margin-top: 16px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Antall porsjoner:</span>
                    <input type="number" id="costPortions" value="${recipe?.servings || 4}" min="1" 
                           style="width: 80px; padding: 8px; text-align: center; border-radius: 8px;">
                </div>
                <button onclick="calculateRecipeCost()" class="btn-primary" style="width: 100%; padding: 12px; margin-top: 8px;">
                    Beregn kostnad
                </button>
            </div>
            
            <div id="costResult" style="margin-top: 16px; display: none; padding: 20px; background: linear-gradient(135deg, var(--accent-color), var(--accent-secondary)); border-radius: 12px; color: white; text-align: center;">
            </div>
        </div>
    `, [], { width: '450px' });
}
window.openRecipeCostCalculator = openRecipeCostCalculator;

function loadRecipeForCost(recipeId) {
    if (!recipeId) return;
    openRecipeCostCalculator(recipeId);
}
window.loadRecipeForCost = loadRecipeForCost;

function calculateRecipeCost() {
    const inputs = document.querySelectorAll('.cost-input');
    const portions = parseInt($('costPortions')?.value) || 4;
    
    let total = 0;
    inputs.forEach(input => {
        const price = parseFloat(input.value) || 0;
        total += price;
    });
    
    const perPortion = total / portions;
    const result = $('costResult');
    
    if (result) {
        result.style.display = 'block';
        result.innerHTML = `
            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 8px;">${formatCurrency(total)}</div>
            <div style="font-size: 1rem; opacity: 0.9;">Total kostnad</div>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.3);">
                <div style="font-size: 1.5rem; font-weight: bold;">${formatCurrency(perPortion)}</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">per porsjon (${portions} stk)</div>
            </div>
        `;
    }
}
window.calculateRecipeCost = calculateRecipeCost;

// ===== COOKING PLAYLIST / SPOTIFY INTEGRATION =====
function openCookingPlaylist() {
    const playlists = [
        { name: 'Italian Dinner', mood: '🇮🇹 Italiensk middag', url: 'https://open.spotify.com/playlist/37i9dQZF1DX6ThddIjWuGT' },
        { name: 'Sunday Brunch', mood: '☀️ Søndagsbrunch', url: 'https://open.spotify.com/playlist/37i9dQZF1DWVkpjcLfcMvH' },
        { name: 'Cooking Jazz', mood: '🎷 Jazz i kjøkkenet', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4wta20PHgwo' },
        { name: 'French Café', mood: '🥐 Fransk kaféstemning', url: 'https://open.spotify.com/playlist/37i9dQZF1DX5xiztvBdlUf' },
        { name: 'Dinner Party', mood: '🥂 Middagsselskap', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4xuWVBs4FgJ' },
        { name: 'Acoustic Cooking', mood: '🎸 Akustisk stemning', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4E3UdUs7fUx' },
        { name: 'Latin Kitchen', mood: '💃 Latinamerikansk', url: 'https://open.spotify.com/playlist/37i9dQZF1DX10zKzsJ2jva' },
        { name: 'Classical Cooking', mood: '🎻 Klassisk musikk', url: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn' }
    ];
    
    openGenericModal('🎵 Kokemusikk', `
        <div class="cooking-playlist">
            <p style="text-align: center; color: var(--text-secondary); margin-bottom: 16px;">
                Velg stemningen for matlagingen!
            </p>
            <div class="playlist-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                ${playlists.map(p => `
                    <a href="${p.url}" target="_blank" rel="noopener noreferrer" 
                       class="playlist-card" style="display: block; padding: 16px; background: var(--card-bg); border-radius: 12px; text-decoration: none; color: inherit; border: 1px solid var(--border-color); transition: transform 0.2s, box-shadow 0.2s;"
                       onmouseover="this.style.transform='scale(1.03)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';"
                       onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                        <div style="font-size: 1.5rem; margin-bottom: 8px;">${p.mood.split(' ')[0]}</div>
                        <div style="font-weight: 600; margin-bottom: 4px;">${p.name}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">${p.mood}</div>
                    </a>
                `).join('')}
            </div>
            <p style="text-align: center; color: var(--text-tertiary); font-size: 0.85rem; margin-top: 16px;">
                🎧 Åpnes i Spotify
            </p>
        </div>
    `, [], { width: '450px' });
}
window.openCookingPlaylist = openCookingPlaylist;

// ===== QUICK RECIPE SHARING (QR Code) =====
function shareRecipeWithQR(recipeId) {
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    // Create shareable data
    const shareData = {
        n: recipe.name,
        i: recipe.ingredients?.slice(0, 10),
        s: recipe.steps?.slice(0, 10),
        p: recipe.servings,
        t: recipe.prepTime
    };
    
    const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)));
    const shareUrl = `${window.location.origin}${window.location.pathname}?recipe=${encoded}`;
    
    // Generate QR code using a simple API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
    
    openGenericModal('📲 Del oppskrift', `
        <div style="text-align: center;">
            <h3 style="margin-bottom: 16px;">${escapeHtml(recipe.name)}</h3>
            <img src="${qrUrl}" alt="QR Code" style="border-radius: 12px; margin-bottom: 16px;">
            <p style="color: var(--text-secondary); margin-bottom: 16px;">
                Skann QR-koden for å dele oppskriften
            </p>
            <div style="display: flex; gap: 8px; justify-content: center;">
                <button onclick="copyRecipeLink('${shareUrl}')" class="btn-secondary" style="padding: 12px 20px;">
                    📋 Kopier lenke
                </button>
                <button onclick="nativeShareRecipe('${escapeHtml(recipe.name)}', '${shareUrl}')" class="btn-primary" style="padding: 12px 20px;">
                    📤 Del
                </button>
            </div>
        </div>
    `, [], { width: '350px' });
}
window.shareRecipeWithQR = shareRecipeWithQR;

function copyRecipeLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast('📋 Lenke kopiert!', 'success');
    });
}
window.copyRecipeLink = copyRecipeLink;

function nativeShareRecipe(name, url) {
    if (navigator.share) {
        navigator.share({
            title: name,
            text: `Sjekk ut denne oppskriften: ${name}`,
            url: url
        });
    } else {
        copyRecipeLink(url);
    }
}
window.nativeShareRecipe = nativeShareRecipe;

// ===== RECIPE PRINT MODE =====
function printRecipe(recipeId) {
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${recipe.name} - Familiens Kokebok</title>
            <style>
                body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #333; }
                h1 { font-size: 2rem; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .meta { color: #666; margin-bottom: 20px; }
                h2 { font-size: 1.3rem; margin-top: 24px; color: #555; }
                ul, ol { line-height: 1.8; }
                li { margin-bottom: 8px; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9rem; color: #888; }
                @media print { body { margin: 20px; } }
            </style>
        </head>
        <body>
            <h1>🍳 ${escapeHtml(recipe.name)}</h1>
            <div class="meta">
                ${recipe.servings ? `👥 ${recipe.servings} porsjoner` : ''}
                ${recipe.prepTime ? ` • ⏱️ ${recipe.prepTime} min` : ''}
                ${recipe.category ? ` • 📁 ${escapeHtml(recipe.category)}` : ''}
            </div>
            
            ${recipe.description ? `<p><em>${escapeHtml(recipe.description)}</em></p>` : ''}
            
            <h2>📝 Ingredienser</h2>
            <ul>
                ${(recipe.ingredients || []).map(i => `<li>${escapeHtml(i)}</li>`).join('')}
            </ul>
            
            <h2>👨‍🍳 Fremgangsmåte</h2>
            <ol>
                ${(recipe.steps || []).map(s => `<li>${escapeHtml(s)}</li>`).join('')}
            </ol>
            
            ${recipe.notes ? `<h2>💡 Notater</h2><p>${escapeHtml(recipe.notes)}</p>` : ''}
            
            <div class="footer">
                <p>Skrevet ut fra Familiens Kokebok • ${new Date().toLocaleDateString('nb-NO')}</p>
            </div>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}
window.printRecipe = printRecipe;

// ===== RECIPE RATING SYSTEM =====
function rateRecipe(recipeId) {
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    const currentRating = recipe.rating || 0;
    
    const html = `
        <div class="rating-dialog">
            <h3>Vurder "${escapeHtml(recipe.name)}"</h3>
            
            <div class="star-rating" id="starRating">
                ${[1, 2, 3, 4, 5].map(n => `
                    <span class="star ${n <= currentRating ? 'filled' : ''}" 
                          onclick="setRating(${n})" 
                          onmouseover="previewRating(${n})"
                          onmouseout="resetRatingPreview()">★</span>
                `).join('')}
            </div>
            <p class="rating-text" id="ratingText">${getRatingText(currentRating)}</p>
            
            <div class="rating-notes">
                <label>Notater (valgfritt):</label>
                <textarea id="ratingNotes" placeholder="Hva syntes du om oppskriften?">${recipe.ratingNotes || ''}</textarea>
            </div>
            
            <button class="btn btn-primary" onclick="saveRating('${recipeId}')">Lagre vurdering</button>
        </div>
    `;
    
    showModal('⭐ Vurder oppskrift', html, []);
    window.currentRatingValue = currentRating;
}
window.rateRecipe = rateRecipe;

function getRatingText(rating) {
    const texts = ['Ikke vurdert', 'Dårlig', 'OK', 'Bra', 'Veldig bra', 'Fantastisk!'];
    return texts[rating] || texts[0];
}

function setRating(value) {
    window.currentRatingValue = value;
    updateStarDisplay(value);
    document.getElementById('ratingText').textContent = getRatingText(value);
}
window.setRating = setRating;

function previewRating(value) {
    updateStarDisplay(value);
}
window.previewRating = previewRating;

function resetRatingPreview() {
    updateStarDisplay(window.currentRatingValue || 0);
}
window.resetRatingPreview = resetRatingPreview;

function updateStarDisplay(value) {
    const stars = document.querySelectorAll('#starRating .star');
    stars.forEach((star, index) => {
        star.classList.toggle('filled', index < value);
    });
}

async function saveRating(recipeId) {
    const rating = window.currentRatingValue;
    const notes = document.getElementById('ratingNotes')?.value || '';
    
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    recipe.rating = rating;
    recipe.ratingNotes = notes;
    recipe.ratedAt = new Date().toISOString();
    
    await saveToFirestore('recipes', recipeId, recipe);
    closeGenericModal();
    showToast(`⭐ Oppskrift vurdert: ${rating}/5`, 'success');
    
    // Update view if currently viewing this recipe
    if (state.currentRecipe?.id === recipeId) {
        state.currentRecipe = recipe;
        renderRecipeView();
    }
}
window.saveRating = saveRating;

// ===== RECIPE COLLECTIONS =====
function openCollections() {
    const collections = JSON.parse(localStorage.getItem('kokebok_collections') || '[]');
    
    const html = `
        <div class="collections-view">
            <div class="collections-header">
                <button class="btn btn-primary" onclick="createCollection()">
                    ➕ Ny samling
                </button>
            </div>
            
            <div class="collections-grid" id="collectionsGrid">
                ${collections.length > 0 ? collections.map(col => `
                    <div class="collection-card" onclick="viewCollection('${col.id}')">
                        <div class="collection-icon">${col.icon || '📁'}</div>
                        <div class="collection-info">
                            <h4>${escapeHtml(col.name)}</h4>
                            <span>${col.recipes?.length || 0} oppskrifter</span>
                        </div>
                        <button class="collection-menu-btn" onclick="event.stopPropagation(); collectionMenu('${col.id}')">⋮</button>
                    </div>
                `).join('') : `
                    <div class="no-collections">
                        <p>📁 Ingen samlinger ennå</p>
                        <p>Lag samlinger for å organisere favorittoppskriftene dine!</p>
                    </div>
                `}
            </div>
            
            <div class="collections-suggestions">
                <h4>Forslag til samlinger:</h4>
                <div class="suggestion-tags">
                    <button onclick="quickCreateCollection('🎄 Jul', '🎄')">🎄 Jul</button>
                    <button onclick="quickCreateCollection('🥗 Sunn mat', '🥗')">🥗 Sunn mat</button>
                    <button onclick="quickCreateCollection('⚡ Kjappe retter', '⚡')">⚡ Kjappe retter</button>
                    <button onclick="quickCreateCollection('👨‍👩‍👧‍👦 Familie-favoritter', '👨‍👩‍👧‍👦')">👨‍👩‍👧‍👦 Familie</button>
                    <button onclick="quickCreateCollection('🍰 Baking', '🍰')">🍰 Baking</button>
                    <button onclick="quickCreateCollection('🌱 Vegetar', '🌱')">🌱 Vegetar</button>
                </div>
            </div>
        </div>
    `;
    
    showModal('📁 Mine samlinger', html, []);
}
window.openCollections = openCollections;

function createCollection() {
    const html = `
        <div class="create-collection">
            <div class="form-group">
                <label>Navn på samling</label>
                <input type="text" id="collectionName" placeholder="F.eks. Søndagsmiddager">
            </div>
            <div class="form-group">
                <label>Velg ikon</label>
                <div class="icon-picker" id="iconPicker">
                    ${['📁', '❤️', '⭐', '🎄', '🥗', '⚡', '👨‍👩‍👧‍👦', '🍰', '🌱', '🍝', '🍕', '🍣', '🥘', '🍲', '🎂', '🍪'].map(icon => 
                        `<button type="button" class="icon-option" onclick="selectCollectionIcon('${icon}')">${icon}</button>`
                    ).join('')}
                </div>
                <input type="hidden" id="selectedIcon" value="📁">
            </div>
            <button class="btn btn-primary" onclick="saveNewCollection()">Opprett samling</button>
        </div>
    `;
    
    showModal('➕ Ny samling', html, []);
}
window.createCollection = createCollection;

function selectCollectionIcon(icon) {
    document.getElementById('selectedIcon').value = icon;
    document.querySelectorAll('.icon-option').forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
}
window.selectCollectionIcon = selectCollectionIcon;

function saveNewCollection() {
    const name = document.getElementById('collectionName')?.value?.trim();
    const icon = document.getElementById('selectedIcon')?.value || '📁';
    
    if (!name) {
        showToast('Skriv inn et navn', 'warning');
        return;
    }
    
    const collections = JSON.parse(localStorage.getItem('kokebok_collections') || '[]');
    collections.push({
        id: Date.now().toString(),
        name,
        icon,
        recipes: [],
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('kokebok_collections', JSON.stringify(collections));
    
    closeGenericModal();
    showToast('📁 Samling opprettet!', 'success');
    openCollections();
}
window.saveNewCollection = saveNewCollection;

function quickCreateCollection(name, icon) {
    const collections = JSON.parse(localStorage.getItem('kokebok_collections') || '[]');
    
    if (collections.some(c => c.name === name)) {
        showToast('Samling finnes allerede', 'info');
        return;
    }
    
    collections.push({
        id: Date.now().toString(),
        name,
        icon,
        recipes: [],
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('kokebok_collections', JSON.stringify(collections));
    
    showToast(`${icon} "${name}" opprettet!`, 'success');
    openCollections();
}
window.quickCreateCollection = quickCreateCollection;

function addToCollection(recipeId) {
    const collections = JSON.parse(localStorage.getItem('kokebok_collections') || '[]');
    const recipe = state.recipes.find(r => r.id === recipeId);
    
    if (collections.length === 0) {
        showToast('Opprett en samling først', 'info');
        openCollections();
        return;
    }
    
    const html = `
        <div class="add-to-collection">
            <h3>Legg "${escapeHtml(recipe?.name || 'oppskrift')}" i samling</h3>
            <div class="collection-options">
                ${collections.map(col => `
                    <button class="collection-option ${col.recipes?.includes(recipeId) ? 'added' : ''}" 
                            onclick="toggleRecipeInCollection('${col.id}', '${recipeId}')">
                        <span class="col-icon">${col.icon}</span>
                        <span class="col-name">${escapeHtml(col.name)}</span>
                        <span class="col-check">${col.recipes?.includes(recipeId) ? '✓' : '+'}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    showModal('📁 Legg i samling', html, []);
}
window.addToCollection = addToCollection;

function toggleRecipeInCollection(collectionId, recipeId) {
    const collections = JSON.parse(localStorage.getItem('kokebok_collections') || '[]');
    const collection = collections.find(c => c.id === collectionId);
    
    if (!collection) return;
    
    if (!collection.recipes) collection.recipes = [];
    
    const index = collection.recipes.indexOf(recipeId);
    if (index > -1) {
        collection.recipes.splice(index, 1);
        showToast(`Fjernet fra ${collection.icon} ${collection.name}`, 'info');
    } else {
        collection.recipes.push(recipeId);
        showToast(`Lagt til i ${collection.icon} ${collection.name}`, 'success');
    }
    
    localStorage.setItem('kokebok_collections', JSON.stringify(collections));
    addToCollection(recipeId); // Refresh view
}
window.toggleRecipeInCollection = toggleRecipeInCollection;

function viewCollection(collectionId) {
    const collections = JSON.parse(localStorage.getItem('kokebok_collections') || '[]');
    const collection = collections.find(c => c.id === collectionId);
    
    if (!collection) return;
    
    const recipes = (collection.recipes || [])
        .map(id => state.recipes.find(r => r.id === id))
        .filter(Boolean);
    
    const html = `
        <div class="collection-view">
            <div class="collection-header">
                <span class="collection-big-icon">${collection.icon}</span>
                <h2>${escapeHtml(collection.name)}</h2>
                <p>${recipes.length} oppskrift${recipes.length !== 1 ? 'er' : ''}</p>
            </div>
            
            <div class="collection-recipes">
                ${recipes.length > 0 ? recipes.map(r => `
                    <div class="collection-recipe-item" onclick="viewRecipe('${r.id}'); closeGenericModal();">
                        <span class="recipe-icon">${getCategoryIcon(r.category)}</span>
                        <span class="recipe-name">${escapeHtml(r.name)}</span>
                        ${r.rating ? `<span class="recipe-rating">⭐ ${r.rating}</span>` : ''}
                    </div>
                `).join('') : `
                    <div class="no-recipes-in-collection">
                        <p>Ingen oppskrifter i denne samlingen ennå</p>
                        <p>Åpne en oppskrift og trykk "Legg i samling"</p>
                    </div>
                `}
            </div>
        </div>
    `;
    
    showModal(`${collection.icon} ${collection.name}`, html, []);
}
window.viewCollection = viewCollection;

// ===== BATCH COOKING PLANNER =====
function openBatchCookingPlanner() {
    const html = `
        <div class="batch-planner">
            <div class="batch-intro">
                <h3>🍲 Batch Cooking</h3>
                <p>Planlegg matlaging for flere dager samtidig</p>
            </div>
            
            <div class="batch-settings">
                <div class="form-group">
                    <label>Hvor mange porsjoner totalt?</label>
                    <input type="number" id="batchPortions" value="12" min="4" max="50">
                </div>
                <div class="form-group">
                    <label>Antall dager</label>
                    <select id="batchDays">
                        <option value="3">3 dager</option>
                        <option value="5" selected>5 dager</option>
                        <option value="7">7 dager</option>
                    </select>
                </div>
            </div>
            
            <div class="batch-select">
                <h4>Velg oppskrifter til batch cooking:</h4>
                <div class="batch-recipe-list">
                    ${state.recipes.slice(0, 15).map(r => `
                        <label class="batch-recipe-option">
                            <input type="checkbox" value="${r.id}" class="batch-recipe-check">
                            <span class="recipe-icon">${getCategoryIcon(r.category)}</span>
                            <span class="recipe-name">${escapeHtml(r.name)}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <button class="btn btn-primary" onclick="generateBatchPlan()">
                📋 Generer batch-plan
            </button>
        </div>
    `;
    
    showModal('🍲 Batch Cooking Planner', html, []);
}
window.openBatchCookingPlanner = openBatchCookingPlanner;

function generateBatchPlan() {
    const portions = parseInt(document.getElementById('batchPortions')?.value) || 12;
    const days = parseInt(document.getElementById('batchDays')?.value) || 5;
    const selectedIds = Array.from(document.querySelectorAll('.batch-recipe-check:checked'))
        .map(cb => cb.value);
    
    if (selectedIds.length === 0) {
        showToast('Velg minst én oppskrift', 'warning');
        return;
    }
    
    const selectedRecipes = selectedIds.map(id => state.recipes.find(r => r.id === id)).filter(Boolean);
    const portionsPerRecipe = Math.ceil(portions / selectedRecipes.length);
    
    // Combine all ingredients
    const combinedIngredients = {};
    selectedRecipes.forEach(recipe => {
        const ingredients = getIngredientsAsString(recipe.ingredients);
        const lines = ingredients.split('\n');
        lines.forEach(line => {
            // Simple combination - in real app would parse and combine
            if (line.trim()) {
                combinedIngredients[line.trim()] = (combinedIngredients[line.trim()] || 0) + 1;
            }
        });
    });
    
    const html = `
        <div class="batch-plan-result">
            <div class="batch-summary">
                <h3>🍲 Din Batch Cooking Plan</h3>
                <div class="batch-stats">
                    <div class="stat">${selectedRecipes.length} oppskrifter</div>
                    <div class="stat">${portions} porsjoner</div>
                    <div class="stat">${days} dager</div>
                </div>
            </div>
            
            <div class="batch-schedule">
                <h4>📅 Måltidsplan</h4>
                ${Array.from({length: days}, (_, i) => {
                    const recipe = selectedRecipes[i % selectedRecipes.length];
                    return `
                        <div class="batch-day">
                            <span class="day-label">Dag ${i + 1}</span>
                            <span class="day-recipe">${escapeHtml(recipe.name)}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="batch-shopping">
                <h4>🛒 Samlet handleliste</h4>
                <p class="batch-hint">Alle ingredienser multiplisert for ${portionsPerRecipe}x porsjoner per oppskrift</p>
                <button class="btn btn-secondary" onclick="addBatchToShoppingList(${JSON.stringify(selectedIds).replace(/"/g, "'")})">
                    Legg til i handleliste
                </button>
            </div>
            
            <div class="batch-tips">
                <h4>💡 Batch Cooking Tips</h4>
                <ul>
                    <li>Start med oppskriftene som tar lengst tid</li>
                    <li>Bruk flere gryter/panner samtidig</li>
                    <li>Merk beholdere med dato og innhold</li>
                    <li>De fleste retter holder 3-5 dager i kjøleskap</li>
                </ul>
            </div>
        </div>
    `;
    
    showModal('📋 Batch Cooking Plan', html, []);
}
window.generateBatchPlan = generateBatchPlan;

function addBatchToShoppingList(recipeIds) {
    recipeIds = typeof recipeIds === 'string' ? JSON.parse(recipeIds.replace(/'/g, '"')) : recipeIds;
    
    recipeIds.forEach(id => {
        const recipe = state.recipes.find(r => r.id === id);
        if (recipe?.ingredients) {
            const ingredients = getIngredientsAsString(recipe.ingredients);
            ingredients.split('\n').forEach(line => {
                if (line.trim()) {
                    addToShoppingListDirect(line.trim());
                }
            });
        }
    });
    
    closeGenericModal();
    showToast('🛒 Ingredienser lagt til i handlelisten!', 'success');
}
window.addBatchToShoppingList = addBatchToShoppingList;

function addToShoppingListDirect(item) {
    if (!state.shoppingList) state.shoppingList = [];
    
    const existing = state.shoppingList.find(i => 
        (typeof i === 'string' ? i : i.name).toLowerCase() === item.toLowerCase()
    );
    
    if (!existing) {
        state.shoppingList.push({ name: item, checked: false, addedAt: Date.now() });
        saveShoppingList();
    }
}

// ===== RECIPE DIFFICULTY CALCULATOR =====
function calculateDifficulty(recipe) {
    let score = 0;
    
    // Time factor
    const time = parseTime(recipe.prepTime);
    if (time > 60) score += 2;
    else if (time > 30) score += 1;
    
    // Ingredients count
    const ingredientCount = getIngredientsAsString(recipe.ingredients).split('\n').filter(l => l.trim()).length;
    if (ingredientCount > 15) score += 2;
    else if (ingredientCount > 8) score += 1;
    
    // Instructions length
    const instructionLength = (recipe.instructions || '').length;
    if (instructionLength > 1000) score += 2;
    else if (instructionLength > 500) score += 1;
    
    // Complex techniques (simple keyword check)
    const complexTerms = ['sous vide', 'flamber', 'pochér', 'reduser', 'karamelliser', 'temperér', 'braisér'];
    const hasComplex = complexTerms.some(term => 
        (recipe.instructions || '').toLowerCase().includes(term)
    );
    if (hasComplex) score += 1;
    
    if (score <= 1) return { level: 'Enkel', icon: '🟢', color: '#10b981' };
    if (score <= 3) return { level: 'Middels', icon: '🟡', color: '#f59e0b' };
    return { level: 'Avansert', icon: '🔴', color: '#ef4444' };
}

// ===== WEEKLY COOKING REPORT =====
function showWeeklyReport() {
    const cookedHistory = JSON.parse(localStorage.getItem('kokebok_cooked_history') || '[]');
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const thisWeek = cookedHistory.filter(c => new Date(c.cookedAt) >= weekAgo);
    const recipes = thisWeek.map(c => state.recipes.find(r => r.id === c.recipeId)).filter(Boolean);
    
    // Calculate stats
    const uniqueRecipes = new Set(recipes.map(r => r.id)).size;
    const categories = {};
    recipes.forEach(r => {
        const cat = getCategoryName(r.category);
        categories[cat] = (categories[cat] || 0) + 1;
    });
    
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    
    const html = `
        <div class="weekly-report">
            <div class="report-header">
                <h3>📊 Ukens kokerapport</h3>
                <p>${new Date(weekAgo).toLocaleDateString('nb-NO')} - ${new Date().toLocaleDateString('nb-NO')}</p>
            </div>
            
            <div class="report-stats">
                <div class="report-stat">
                    <span class="stat-num">${thisWeek.length}</span>
                    <span class="stat-label">Måltider laget</span>
                </div>
                <div class="report-stat">
                    <span class="stat-num">${uniqueRecipes}</span>
                    <span class="stat-label">Unike oppskrifter</span>
                </div>
                <div class="report-stat">
                    <span class="stat-num">${topCategory ? topCategory[0] : '-'}</span>
                    <span class="stat-label">Mest laget</span>
                </div>
            </div>
            
            <div class="report-history">
                <h4>Hva du laget:</h4>
                ${thisWeek.length > 0 ? thisWeek.map(c => {
                    const recipe = state.recipes.find(r => r.id === c.recipeId);
                    return recipe ? `
                        <div class="report-item">
                            <span class="item-icon">${getCategoryIcon(recipe.category)}</span>
                            <span class="item-name">${escapeHtml(recipe.name)}</span>
                            <span class="item-date">${new Date(c.cookedAt).toLocaleDateString('nb-NO', { weekday: 'short' })}</span>
                        </div>
                    ` : '';
                }).join('') : '<p class="no-cooking">Ingen registrerte kokinger denne uken</p>'}
            </div>
            
            ${thisWeek.length >= 5 ? `
                <div class="report-achievement">
                    <span>🏆</span> Flott innsats! Du har laget ${thisWeek.length} måltider denne uken!
                </div>
            ` : thisWeek.length > 0 ? `
                <div class="report-encouragement">
                    <span>💪</span> Fortsett sånn! ${5 - thisWeek.length} til for å nå ukas mål!
                </div>
            ` : ''}
        </div>
    `;
    
    showModal('📊 Ukerapport', html, []);
}
window.showWeeklyReport = showWeeklyReport;

// ===== SMART SHOPPING SUGGESTIONS =====
function openSmartShopping() {
    // Analyze pantry for low items
    const lowItems = (state.pantryItems || []).filter(item => {
        const qty = item.quantity || 1;
        return qty <= 1; // Low stock
    });
    
    // Analyze frequently used ingredients
    const cookedHistory = JSON.parse(localStorage.getItem('kokebok_cooked_history') || '[]');
    const frequentIngredients = {};
    
    cookedHistory.slice(-20).forEach(c => {
        const recipe = state.recipes.find(r => r.id === c.recipeId);
        if (recipe?.ingredients) {
            const lines = getIngredientsAsString(recipe.ingredients).toLowerCase().split('\n');
            lines.forEach(line => {
                const words = line.split(/\s+/).filter(w => w.length > 3);
                words.forEach(word => {
                    frequentIngredients[word] = (frequentIngredients[word] || 0) + 1;
                });
            });
        }
    });
    
    const topIngredients = Object.entries(frequentIngredients)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    // Check expiring soon
    const expiringSoon = (state.pantryItems || []).filter(item => {
        if (!item.expiryDate) return false;
        const daysUntil = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 3 && daysUntil >= 0;
    });
    
    const html = `
        <div class="smart-shopping">
            <div class="smart-section">
                <h4>⚠️ Utløper snart (bruk først!)</h4>
                ${expiringSoon.length > 0 ? `
                    <div class="expiring-items">
                        ${expiringSoon.map(item => `
                            <div class="expiring-item">
                                <span>${escapeHtml(item.name)}</span>
                                <span class="expiry-badge">${Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))} dager</span>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-secondary btn-small" onclick="findRecipesWithIngredients(${JSON.stringify(expiringSoon.map(i => i.name))})">
                        🔍 Finn oppskrifter med disse
                    </button>
                ` : '<p class="no-items">✅ Ingen varer utløper snart</p>'}
            </div>
            
            <div class="smart-section">
                <h4>📉 Lav beholdning</h4>
                ${lowItems.length > 0 ? `
                    <div class="low-items">
                        ${lowItems.map(item => `
                            <div class="low-item">
                                <span>${escapeHtml(item.name)}</span>
                                <button class="add-btn" onclick="addToShoppingListDirect('${item.name}'); showToast('Lagt til i handlelisten')">+</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-secondary btn-small" onclick="addAllLowToShopping()">
                        🛒 Legg alle til handleliste
                    </button>
                ` : '<p class="no-items">✅ Alt på lager</p>'}
            </div>
            
            <div class="smart-section">
                <h4>🔥 Du bruker ofte</h4>
                <div class="frequent-items">
                    ${topIngredients.slice(0, 8).map(([ingredient, count]) => `
                        <span class="frequent-tag">${ingredient}</span>
                    `).join('') || '<p>Ikke nok data ennå</p>'}
                </div>
            </div>
        </div>
    `;
    
    showModal('🧠 Smart Handlehjelp', html, []);
}
window.openSmartShopping = openSmartShopping;

function findRecipesWithIngredients(ingredients) {
    const ingredientsLower = ingredients.map(i => i.toLowerCase());
    
    const matches = state.recipes.filter(recipe => {
        const recipeIngredients = getIngredientsAsString(recipe.ingredients).toLowerCase();
        return ingredientsLower.some(ing => recipeIngredients.includes(ing));
    });
    
    if (matches.length === 0) {
        showToast('Ingen oppskrifter funnet med disse ingrediensene', 'info');
        return;
    }
    
    const html = `
        <div class="ingredient-recipes">
            <h3>Oppskrifter med ${ingredients.join(', ')}</h3>
            <div class="recipe-matches">
                ${matches.slice(0, 10).map(r => `
                    <div class="recipe-match" onclick="viewRecipe('${r.id}'); closeGenericModal();">
                        <span class="match-icon">${getCategoryIcon(r.category)}</span>
                        <span class="match-name">${escapeHtml(r.name)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    showModal('🔍 Oppskrifter funnet', html, []);
}
window.findRecipesWithIngredients = findRecipesWithIngredients;

function addAllLowToShopping() {
    const lowItems = (state.pantryItems || []).filter(item => (item.quantity || 1) <= 1);
    lowItems.forEach(item => addToShoppingListDirect(item.name));
    closeGenericModal();
    showToast(`🛒 ${lowItems.length} varer lagt til i handlelisten`, 'success');
}
window.addAllLowToShopping = addAllLowToShopping;

// ===== RECIPE NOTES/JOURNAL =====
function openRecipeNotes(recipeId) {
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    const notes = recipe.cookingNotes || [];
    
    const html = `
        <div class="recipe-notes">
            <h3>📝 Notater for "${escapeHtml(recipe.name)}"</h3>
            
            <div class="add-note-form">
                <textarea id="newNoteText" placeholder="Skriv et notat... (f.eks. 'Brukte mindre salt', 'Barna elsket det!')"></textarea>
                <button class="btn btn-primary btn-small" onclick="addRecipeNote('${recipeId}')">Legg til notat</button>
            </div>
            
            <div class="notes-list">
                ${notes.length > 0 ? notes.map((note, i) => `
                    <div class="note-item">
                        <div class="note-header">
                            <span class="note-date">${new Date(note.date).toLocaleDateString('nb-NO')}</span>
                            <button class="note-delete" onclick="deleteRecipeNote('${recipeId}', ${i})">🗑️</button>
                        </div>
                        <p class="note-text">${escapeHtml(note.text)}</p>
                    </div>
                `).join('') : '<p class="no-notes">Ingen notater ennå. Legg til dine erfaringer!</p>'}
            </div>
        </div>
    `;
    
    showModal('📝 Oppskriftsnotater', html, []);
}
window.openRecipeNotes = openRecipeNotes;

async function addRecipeNote(recipeId) {
    const text = document.getElementById('newNoteText')?.value?.trim();
    if (!text) {
        showToast('Skriv et notat først', 'warning');
        return;
    }
    
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    if (!recipe.cookingNotes) recipe.cookingNotes = [];
    recipe.cookingNotes.unshift({
        text,
        date: new Date().toISOString()
    });
    
    await saveToFirestore('recipes', recipeId, recipe);
    showToast('📝 Notat lagt til!', 'success');
    openRecipeNotes(recipeId);
}
window.addRecipeNote = addRecipeNote;

async function deleteRecipeNote(recipeId, noteIndex) {
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe?.cookingNotes) return;
    
    recipe.cookingNotes.splice(noteIndex, 1);
    await saveToFirestore('recipes', recipeId, recipe);
    showToast('Notat slettet', 'info');
    openRecipeNotes(recipeId);
}
window.deleteRecipeNote = deleteRecipeNote;

// ===== QUICK ADD FROM CAMERA (BARCODE PLACEHOLDER) =====
function openQuickAdd() {
    const html = `
        <div class="quick-add-options">
            <button class="quick-add-option" onclick="openPantryAIScanner()">
                <span class="qa-icon">📸</span>
                <span class="qa-title">AI Skanner</span>
                <span class="qa-desc">Ta bilde av matvarer</span>
            </button>
            
            <button class="quick-add-option" onclick="manualQuickAdd()">
                <span class="qa-icon">✏️</span>
                <span class="qa-title">Manuelt</span>
                <span class="qa-desc">Skriv inn vare</span>
            </button>
            
            <button class="quick-add-option" onclick="voiceQuickAdd()">
                <span class="qa-icon">🎤</span>
                <span class="qa-title">Stemme</span>
                <span class="qa-desc">Si hva du vil legge til</span>
            </button>
            
            <button class="quick-add-option" onclick="recentQuickAdd()">
                <span class="qa-icon">🕐</span>
                <span class="qa-title">Nylige</span>
                <span class="qa-desc">Legg til fra historikk</span>
            </button>
        </div>
    `;
    
    showModal('➕ Hurtigregistrering', html, []);
}
window.openQuickAdd = openQuickAdd;

function manualQuickAdd() {
    const html = `
        <div class="manual-add">
            <input type="text" id="quickAddInput" placeholder="Skriv varenavn..." autofocus>
            <div class="quick-category-select">
                <button class="qcat active" data-cat="kjøleskap" onclick="selectQuickCat(this)">🧊 Kjøleskap</button>
                <button class="qcat" data-cat="fryser" onclick="selectQuickCat(this)">❄️ Fryser</button>
                <button class="qcat" data-cat="skuffer" onclick="selectQuickCat(this)">🗄️ Skap</button>
            </div>
            <button class="btn btn-primary" onclick="submitQuickAdd()">Legg til</button>
        </div>
    `;
    
    showModal('✏️ Legg til vare', html, []);
}
window.manualQuickAdd = manualQuickAdd;

function selectQuickCat(btn) {
    document.querySelectorAll('.qcat').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}
window.selectQuickCat = selectQuickCat;

function submitQuickAdd() {
    const name = document.getElementById('quickAddInput')?.value?.trim();
    const category = document.querySelector('.qcat.active')?.dataset?.cat || 'kjøleskap';
    
    if (!name) {
        showToast('Skriv inn et varenavn', 'warning');
        return;
    }
    
    // Add to pantry
    if (!state.pantryItems) state.pantryItems = [];
    state.pantryItems.push({
        id: Date.now().toString(),
        name,
        category,
        quantity: 1,
        addedAt: new Date().toISOString()
    });
    savePantryItems();
    
    closeGenericModal();
    showToast(`✅ ${name} lagt til i ${category}`, 'success');
}
window.submitQuickAdd = submitQuickAdd;

function voiceQuickAdd() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Stemmegjenkjenning støttes ikke i denne nettleseren', 'warning');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'nb-NO';
    recognition.interimResults = false;
    
    showToast('🎤 Lytter... Si hva du vil legge til', 'info');
    
    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        document.getElementById('quickAddInput').value = text;
        showToast(`Hørte: "${text}"`, 'success');
    };
    
    recognition.onerror = () => {
        showToast('Kunne ikke høre deg. Prøv igjen.', 'error');
    };
    
    recognition.start();
    manualQuickAdd();
}
window.voiceQuickAdd = voiceQuickAdd;

function recentQuickAdd() {
    const recent = JSON.parse(localStorage.getItem('kokebok_recent_pantry') || '[]');
    
    const html = `
        <div class="recent-add">
            <h4>Nylig lagt til:</h4>
            ${recent.length > 0 ? `
                <div class="recent-items">
                    ${recent.slice(0, 10).map(item => `
                        <button class="recent-item" onclick="addRecentToPantry('${item}')">${item}</button>
                    `).join('')}
                </div>
            ` : '<p>Ingen nylige varer</p>'}
        </div>
    `;
    
    showModal('🕐 Nylige varer', html, []);
}
window.recentQuickAdd = recentQuickAdd;

function addRecentToPantry(name) {
    if (!state.pantryItems) state.pantryItems = [];
    state.pantryItems.push({
        id: Date.now().toString(),
        name,
        category: 'kjøleskap',
        quantity: 1,
        addedAt: new Date().toISOString()
    });
    savePantryItems();
    closeGenericModal();
    showToast(`✅ ${name} lagt til`, 'success');
}
window.addRecentToPantry = addRecentToPantry;

// Show login troubleshooting after failed attempts
let loginAttempts = 0;
function showLoginTroubleshoot() {
    loginAttempts++;
    if (loginAttempts >= 1) {
        const troubleshoot = document.getElementById('loginTroubleshoot');
        if (troubleshoot) troubleshoot.style.display = 'block';
    }
}

// Update version
const APP_VERSION_ULTIMATE = '4.4.0';
console.log(`Familiens Kokebok ${APP_VERSION_ULTIMATE} - Ultimate Premium Features Loaded`);
