// ==========================================
// FAMILIENS KOKEBOK APP v5.0.0
// Firebase-basert med Google Auth
// Digitaliser gamle kokebøker og oppskrifter
// 100% privat - ingen AI lærer av dine oppskrifter
// ==========================================

const APP_VERSION = '5.0.0';

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
let timerEndAt = null;
const TIMER_STORAGE_KEY = 'kokebok_timer_state_v1';

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
        reminderNotifications: true,
        // Gamification mode - disabled by default for simple experience
        gamificationEnabled: false
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
    sharedCookbooks: [],
    // v4.1 - Kitchen equipment
    equipment: [],
    pantryItems: []
};

const MAX_RECIPE_IMAGE_BYTES = 900 * 1024;
const PUSH_PROMPT_KEY = 'kokebok_push_prompted';

// ===== DOM Helpers =====
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function on(id, event, handler) {
    const el = typeof id === 'string' ? $(id) : id;
    if (el) el.addEventListener(event, handler);
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
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
    if (item === null || item === undefined) return '';
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    if (typeof item === 'object') {
        const candidates = [
            item.text,
            item.name,
            item.item,
            item.title,
            item.ingredient,
            item.product,
            item.value
        ];
        for (const c of candidates) {
            if (c === null || c === undefined) continue;
            const s = String(c).trim();
            if (s) return s;
        }
        // Ingen lesbar tekst funnet – returner tomt slik at
        // normalizeShoppingListItems() kan fjerne elementet
        // (JSON-fallback ga tidligere søppelrader som '{"checked":false}')
    }
    return '';
}

function normalizeShoppingListItems(list) {
    if (!Array.isArray(list)) return [];
    const normalized = [];
    const seen = new Set();
    for (const raw of list) {
        const text = getItemName(raw).trim();
        if (!text) continue;
        const key = text.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            normalized.push({
                ...raw,
                text,
                checked: !!raw.checked
            });
        } else {
            normalized.push({ text, checked: false });
        }
    }
    return normalized;
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
    
    // Bruk LOCAL persistence for alle enheter - dette holder brukeren innlogget
    try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        console.log('✓ Auth persistence satt til LOCAL');
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

function estimateBase64Bytes(dataUrl) {
    if (!dataUrl) return 0;
    const base64 = String(dataUrl).split(',')[1] || '';
    return Math.floor(base64.length * 0.75);
}

function getTotalImageBytes(images) {
    if (!Array.isArray(images)) return 0;
    return images.reduce((sum, img) => sum + estimateBase64Bytes(img), 0);
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
        
        // v4.0 - Load social data for friends/sharing
        loadSocialData().then(() => {
            updateFriendNotificationBadge();
        });
        
        // v4.1 - Check expiring items and request push permission
        setTimeout(() => {
            checkExpiringItems();
            // Auto-request push permission if user hasn't been asked
            if (state.settings.pushNotifications && shouldAutoRequestPush()) {
                localStorage.setItem(PUSH_PROMPT_KEY, 'true');
                requestPushPermission(true);
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
        
        // Register Service Worker med oppdateringshåndtering
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => {
                    console.log('✓ Service Worker registrert');
                    reg.update().catch(() => {});
                })
                .catch(err => console.warn('SW registrering feilet:', err));

            // Når en ny service worker tar over: last siden på nytt én gang
            // (rett etter sidelast), ellers gi beskjed slik at brukeren kan oppdatere selv.
            let swRefreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (swRefreshing) return;
                swRefreshing = true;
                if (performance.now() < 30000) {
                    window.location.reload();
                } else {
                    showToast('🔄 Ny versjon er klar – last siden på nytt for å oppdatere', 'info');
                }
            });
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
                } catch (e) {
                    console.warn(`  Kunne ikke lagre kategori ${cat.id}:`, e.message);
                }
            }
        }
        // Ensure defaults exist locally even if Firestore save fails
        const categoryMap = new Map(state.categories.map(c => [c.id, c]));
        DEFAULT_CATEGORIES.forEach(cat => {
            if (!categoryMap.has(cat.id)) categoryMap.set(cat.id, cat);
        });
        state.categories = Array.from(categoryMap.values());
        
        // Load recipes and books
        state.recipes = await loadCollection('recipes');
        console.log(`  ✓ Oppskrifter: ${state.recipes.length}`);
        
        state.books = await loadCollection('books');
        console.log(`  ✓ Bøker: ${state.books.length}`);
        
        // Load settings (kun selve innstillingsdokumentet – samlingen inneholder
        // også shoppingList/mealPlan/favorites som IKKE skal blandes inn her)
        const settingsDocs = await loadCollection('settings');
        const userSettingsDoc = settingsDocs.find(s => s.id === 'user-settings');
        if (userSettingsDoc) {
            const { id, ...savedSettings } = userSettingsDoc;
            state.settings = { ...state.settings, ...savedSettings };
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
        const savedKey = localStorage.getItem('kokebok_openai_key') || localStorage.getItem('openai_api_key');
        if (savedKey) openaiKeyInput.value = savedKey;

        // Migrate legacy key name
        if (!localStorage.getItem('kokebok_openai_key') && localStorage.getItem('openai_api_key')) {
            localStorage.setItem('kokebok_openai_key', localStorage.getItem('openai_api_key'));
            localStorage.removeItem('openai_api_key');
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
    
    // Gamification mode toggle
    const gamificationToggle = $('gamificationToggle');
    if (gamificationToggle) {
        gamificationToggle.checked = state.settings.gamificationEnabled || false;
    }
    
    // Apply gamification visibility
    applyGamificationMode();
}

// Toggle gamification features visibility
function applyGamificationMode() {
    const enabled = state.settings.gamificationEnabled || false;
    
    // Elements to show/hide based on gamification mode
    const gamificationElements = [
        'achievementsBanner',      // Achievements banner on dashboard
        'dailyChallengeCard',      // Daily challenge card
        'socialCard',              // Friends & leaderboard card
        'xpDisplay',               // XP/Level display
        'streakDisplay'            // Streak display
    ];
    
    // Toggle visibility for each element
    gamificationElements.forEach(id => {
        const el = $(id);
        if (el) {
            el.style.display = enabled ? '' : 'none';
        }
    });
    
    // Also toggle by class
    document.querySelectorAll('.gamification-feature').forEach(el => {
        el.style.display = enabled ? '' : 'none';
    });
    
    // Show/hide gamification-related settings section
    const gamificationSettingsSection = $('gamificationSettingsSection');
    if (gamificationSettingsSection) {
        // Show the content inside but keep section visible
        const content = gamificationSettingsSection.querySelector('.gamification-settings-content');
        if (content) {
            content.style.display = enabled ? '' : 'none';
        }
    }
    
    // Toggle body class for CSS-based hiding
    document.body.classList.toggle('gamification-enabled', enabled);
    document.body.classList.toggle('gamification-disabled', !enabled);
    
    console.log(`🎮 Gamification mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
}
window.applyGamificationMode = applyGamificationMode;

// Toggle gamification and save
function toggleGamification(enabled) {
    state.settings.gamificationEnabled = enabled;
    applyGamificationMode();
    saveSettings();
    
    if (enabled) {
        showToast('🎮 Spillmodus aktivert! Nyt prestasjoner, utfordringer og toppliste.', 'success');
        triggerConfetti();
        
        // Load social data when gamification is enabled
        loadSocialData().then(() => {
            updateFriendNotificationBadge();
            updatePublicProfile();
        });
    } else {
        showToast('📝 Enkel modus aktivert. Fokus på oppskrifter.', 'info');
    }
    
    // Re-render dashboard to update
    renderDashboard();
}
window.toggleGamification = toggleGamification;

// v4.2 - Save OpenAI API Key
function saveOpenAIKey() {
    const keyInput = $('openaiKeyInput');
    if (!keyInput) return;
    
    const key = keyInput.value.trim();
    if (key) {
        localStorage.setItem('kokebok_openai_key', key);
        localStorage.removeItem('openai_api_key');
        showToast('✅ OpenAI API-nøkkel lagret!');
    } else {
        localStorage.removeItem('kokebok_openai_key');
        localStorage.removeItem('openai_api_key');
        showToast('🗑️ OpenAI API-nøkkel fjernet');
    }
}

// v4.2 - Test OpenAI Connection
async function testOpenAIConnection() {
    const key = localStorage.getItem('kokebok_openai_key') || localStorage.getItem('openai_api_key');
    
    if (!key) {
        showToast('⚠️ Ingen API-nøkkel lagret');
        return;
    }
    
    showToast('🔄 Tester GPT-tilkobling...');
    
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'Svar kun med ordet: OK' },
                    { role: 'user', content: 'OK?' }
                ],
                max_tokens: 5,
                temperature: 0
            })
        });

        const data = await response.json().catch(() => ({}));
        const apiErrorCode = data?.error?.code || '';
        const apiErrorMsg = data?.error?.message || '';

        if (response.ok) {
            const answer = data?.choices?.[0]?.message?.content?.trim() || 'OK';
            showToast(`✅ GPT aktivert! Svar: ${answer}`);
        } else if (response.status === 401) {
            showToast('❌ Ugyldig OpenAI API-nøkkel');
        } else if (response.status === 429) {
            if (apiErrorCode === 'insufficient_quota' || /insufficient_quota|billing|quota/i.test(apiErrorMsg)) {
                showToast('⚠️ OpenAI API mangler aktiv kvote/betaling (ChatGPT-abonnement er separat)', 'warning');
            } else {
                showToast('⚠️ Rate limit nådd for OpenAI (for mange kall på kort tid)', 'warning');
            }
        } else if (response.status === 403) {
            showToast('⚠️ OpenAI-prosjektet mangler tilgang/rettigheter til modellen', 'warning');
        } else {
            const msg = apiErrorMsg || 'Kunne ikke verifisere nøkkel';
            showToast(`⚠️ ${msg}`);
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
            const lowerError = String(errorMsg).toLowerCase();
            
            if (response.status === 429 || lowerError.includes('quota') || lowerError.includes('rate')) {
                // Quota exceeded - show detailed modal
                showGeminiQuotaExceededModal();
                if (lowerError.includes('billing') || lowerError.includes('paid') || lowerError.includes('free tier')) {
                    showToast('⚠️ Gemini krever aktiv kvote/billing i Google AI Studio/Cloud-prosjektet', 'warning');
                }
            } else if (response.status === 400 && errorMsg.includes('API key')) {
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

// Show detailed modal for Gemini quota exceeded
function showGeminiQuotaExceededModal() {
    const html = `
        <div class="quota-exceeded-modal" style="max-width: 600px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 3rem; margin-bottom: 12px;">⚠️</div>
                <h2 style="margin: 0; color: var(--text-primary);">Gemini Gratis Kvote Oppbrukt</h2>
            </div>
            
            <div style="background: var(--card-bg); border-radius: 12px; padding: 16px; margin-bottom: 16px; border-left: 4px solid #ff6b6b;">
                <p style="margin: 0 0 8px 0; font-weight: 600;">Hva skjedde?</p>
                <p style="margin: 0; opacity: 0.9;">Google Gemini gratis tier har daglige og månedlige grenser. Disse limitene er nå brukt opp.</p>
            </div>
            
            <div style="background: var(--card-bg); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                <p style="margin: 0 0 12px 0; font-weight: 600;">📋 Løsningsalternativer:</p>
                
                <div style="margin-bottom: 12px; padding: 12px; background: rgba(255,193,7,0.1); border-radius: 8px; border-left: 3px solid #ffc107;">
                    <strong>1️⃣ Vent til neste dag</strong>
                    <p style="margin: 4px 0 0 0; font-size: 0.9rem;">Gratis kvote gjenoppsettes daglig. Kom tilbake i morgen!</p>
                </div>
                
                <div style="margin-bottom: 12px; padding: 12px; background: rgba(76,175,80,0.1); border-radius: 8px; border-left: 3px solid #4caf50;">
                    <strong>2️⃣ Oppgrader til Gemini Pro</strong>
                    <p style="margin: 4px 0 0 0; font-size: 0.9rem;">Få ubegrenset tilgang til Gemini AI (~$20/måned)</p>
                    <a href="https://ai.google.dev/pricing" target="_blank" style="display: inline-block; margin-top: 6px; padding: 6px 12px; background: #4caf50; color: white; border-radius: 6px; text-decoration: none; font-size: 0.85rem;">Se priser →</a>
                </div>
                
                <div style="margin-bottom: 12px; padding: 12px; background: rgba(33,150,243,0.1); border-radius: 8px; border-left: 3px solid #2196f3;">
                    <strong>3️⃣ Bruk OpenAI ChatGPT Vision</strong>
                    <p style="margin: 4px 0 0 0; font-size: 0.9rem;">Hent API-nøkkel fra OpenAI og bruk deres Vision API</p>
                    <a href="https://platform.openai.com/api-keys" target="_blank" style="display: inline-block; margin-top: 6px; padding: 6px 12px; background: #2196f3; color: white; border-radius: 6px; text-decoration: none; font-size: 0.85rem;">OpenAI API-keys →</a>
                </div>
                
                <div style="padding: 12px; background: rgba(156,39,176,0.1); border-radius: 8px; border-left: 3px solid #9c27b0;">
                    <strong>4️⃣ Bruk annen Google-konto</strong>
                    <p style="margin: 4px 0 0 0; font-size: 0.9rem;">Lag eller bruk en annen Google-konto for ny gratis kvote</p>
                </div>
            </div>
            
            <div style="background: var(--card-bg); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                <p style="margin: 0 0 8px 0; font-weight: 600;">📊 Gratis kvote-info:</p>
                <ul style="margin: 0; padding-left: 20px; opacity: 0.9; font-size: 0.9rem;">
                    <li>Gratis tier: 15 forespørsler per minutt</li>
                    <li>Maks 1 million tokens per dag</li>
                    <li>Kjørende av daglige og månedlige grenser</li>
                    <li><a href="https://ai.google.dev/rate-limits" target="_blank" style="color: var(--link-color);">Se alle limitene →</a></li>
                </ul>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <button class="btn btn-secondary" onclick="closeGenericModal()" style="width: 100%;">Lukk</button>
                <button class="btn btn-primary" onclick="window.open('https://ai.google.dev/pricing', '_blank')" style="width: 100%;">💳 Oppgrader →</button>
            </div>
        </div>
    `;
    
    showModal('⚠️ Gemini Gratis Kvote Oppbrukt', html, []);
}
window.showGeminiQuotaExceededModal = showGeminiQuotaExceededModal;

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

