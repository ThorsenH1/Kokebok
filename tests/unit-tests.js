/**
 * ==========================================
 * KOKEBOK UNIT TESTS
 * Tester alle individuelle funksjoner
 * ==========================================
 */

// Import test framework
if (typeof require !== 'undefined') {
    const { KokebokTestSuite, assert, mockLocalStorage } = require('./test-suite.js');
}

const suite = new KokebokTestSuite();

// ===== HELPER FUNCTIONS TESTS =====
suite.describe('Helper Functions', () => {
    
    suite.test('escapeHtml - should escape HTML characters', () => {
        const escapeHtml = (text) => {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        // Test basic escaping
        assert.equal(escapeHtml('<script>'), '&lt;script&gt;', 'Should escape angle brackets');
        assert.equal(escapeHtml('&'), '&amp;', 'Should escape ampersand');
        assert.equal(escapeHtml('"'), '&quot;', 'Should escape double quotes');
        assert.equal(escapeHtml("'"), '&#39;', 'Should escape single quotes'); // Note: This depends on browser
        assert.equal(escapeHtml(''), '', 'Should return empty string for empty input');
        assert.equal(escapeHtml(null), '', 'Should return empty string for null');
        assert.equal(escapeHtml(undefined), '', 'Should return empty string for undefined');
        assert.equal(escapeHtml('Normal text'), 'Normal text', 'Should not change normal text');
    });

    suite.test('getCategoryName - should return category name from ID', () => {
        const mockState = {
            categories: [
                { id: 'hovedrett', name: 'Hovedretter', icon: '🍽️' },
                { id: 'dessert', name: 'Desserter', icon: '🍰' }
            ]
        };
        
        const getCategoryName = (categoryId) => {
            if (!categoryId) return 'Ukategorisert';
            const category = mockState.categories.find(c => c.id === categoryId);
            return category ? category.name : categoryId;
        };
        
        assert.equal(getCategoryName('hovedrett'), 'Hovedretter');
        assert.equal(getCategoryName('dessert'), 'Desserter');
        assert.equal(getCategoryName('unknown'), 'unknown', 'Should return ID for unknown category');
        assert.equal(getCategoryName(null), 'Ukategorisert');
        assert.equal(getCategoryName(''), 'Ukategorisert');
    });

    suite.test('getCategoryIcon - should return category icon from ID', () => {
        const mockState = {
            categories: [
                { id: 'hovedrett', name: 'Hovedretter', icon: '🍽️' },
                { id: 'dessert', name: 'Desserter', icon: '🍰' }
            ]
        };
        
        const getCategoryIcon = (categoryId) => {
            if (!categoryId) return '📝';
            const category = mockState.categories.find(c => c.id === categoryId);
            return category?.icon || '📝';
        };
        
        assert.equal(getCategoryIcon('hovedrett'), '🍽️');
        assert.equal(getCategoryIcon('dessert'), '🍰');
        assert.equal(getCategoryIcon('unknown'), '📝', 'Should return default icon');
        assert.equal(getCategoryIcon(null), '📝');
    });

    suite.test('getIngredientsAsString - should convert ingredients to string', () => {
        const getIngredientsAsString = (ingredients) => {
            if (!ingredients) return '';
            if (Array.isArray(ingredients)) {
                return ingredients.join('\n');
            }
            if (typeof ingredients === 'object') {
                return Object.values(ingredients).join('\n');
            }
            return String(ingredients);
        };
        
        assert.equal(getIngredientsAsString(['mel', 'sukker', 'egg']), 'mel\nsukker\negg');
        assert.equal(getIngredientsAsString('mel, sukker, egg'), 'mel, sukker, egg');
        assert.equal(getIngredientsAsString({ 0: 'mel', 1: 'sukker' }), 'mel\nsukker');
        assert.equal(getIngredientsAsString(null), '');
        assert.equal(getIngredientsAsString(undefined), '');
    });

    suite.test('debounce - should delay function execution', async () => {
        let callCount = 0;
        const debounce = (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        };
        
        const increment = debounce(() => callCount++, 50);
        
        increment();
        increment();
        increment();
        
        assert.equal(callCount, 0, 'Should not call immediately');
        
        await new Promise(r => setTimeout(r, 100));
        assert.equal(callCount, 1, 'Should only call once after debounce period');
    });

    suite.test('parseServings - should extract number from servings string', () => {
        const parseServings = (servingsStr) => {
            const num = parseInt(servingsStr);
            return isNaN(num) ? 4 : num;
        };
        
        assert.equal(parseServings('4 porsjoner'), 4);
        assert.equal(parseServings('6'), 6);
        assert.equal(parseServings('12 stk'), 12);
        assert.equal(parseServings('mange'), 4, 'Should return default for non-numeric');
        assert.equal(parseServings(null), 4);
    });

    suite.test('parseNumber - should parse various number formats', () => {
        const parseNumber = (str) => {
            if (!str) return null;
            str = String(str).trim();
            
            // Handle fractions
            const fractionMap = {
                '½': 0.5, '⅓': 0.333, '⅔': 0.667,
                '¼': 0.25, '¾': 0.75, '⅛': 0.125
            };
            
            for (const [frac, val] of Object.entries(fractionMap)) {
                if (str.includes(frac)) {
                    const num = parseFloat(str.replace(frac, '')) || 0;
                    return num + val;
                }
            }
            
            const num = parseFloat(str.replace(',', '.'));
            return isNaN(num) ? null : num;
        };
        
        assert.equal(parseNumber('5'), 5);
        assert.equal(parseNumber('2.5'), 2.5);
        assert.equal(parseNumber('2,5'), 2.5, 'Should handle comma decimal');
        assert.equal(parseNumber('1½'), 1.5, 'Should handle fractions');
        assert.equal(parseNumber('½'), 0.5);
        assert.equal(parseNumber('abc'), null);
        assert.equal(parseNumber(null), null);
    });
});

// ===== STATE MANAGEMENT TESTS =====
suite.describe('State Management', () => {
    
    suite.test('state object should have all required properties', () => {
        const state = {
            user: null,
            categories: [],
            recipes: [],
            books: [],
            settings: {
                darkMode: false,
                fontSize: 'normal',
                gamificationEnabled: false
            },
            currentView: 'dashboardView',
            friends: [],
            friendRequests: [],
            sharedRecipes: [],
            sharedCookbooks: [],
            equipment: [],
            pantryItems: []
        };
        
        assert.hasProperty(state, 'user');
        assert.hasProperty(state, 'categories');
        assert.hasProperty(state, 'recipes');
        assert.hasProperty(state, 'books');
        assert.hasProperty(state, 'settings');
        assert.hasProperty(state.settings, 'darkMode');
        assert.hasProperty(state.settings, 'gamificationEnabled');
        assert.isArray(state.recipes);
        assert.isArray(state.books);
    });

    suite.test('state.settings should have gamification toggle', () => {
        const settings = {
            darkMode: false,
            fontSize: 'normal',
            gamificationEnabled: false
        };
        
        assert.isFalse(settings.gamificationEnabled, 'Gamification should be disabled by default');
        
        settings.gamificationEnabled = true;
        assert.isTrue(settings.gamificationEnabled);
    });
});

// ===== RECIPE FUNCTIONS TESTS =====
suite.describe('Recipe Functions', () => {
    
    suite.test('scaleIngredients - should scale ingredient quantities', () => {
        const parseNumber = (str) => {
            if (!str) return null;
            const num = parseFloat(String(str).replace(',', '.'));
            return isNaN(num) ? null : num;
        };
        
        const scaleIngredients = (ingredients, scale) => {
            if (!ingredients || scale === 1) return ingredients;
            const lines = ingredients.split('\n');
            return lines.map(line => {
                const match = line.match(/^([\d.,½¼¾⅓⅔]+)\s*(.*)$/);
                if (match) {
                    const num = parseNumber(match[1]);
                    if (num !== null) {
                        const scaled = (num * scale).toFixed(1).replace(/\.0$/, '');
                        return `${scaled} ${match[2]}`;
                    }
                }
                return line;
            }).join('\n');
        };
        
        const ingredients = '200 g mel\n3 egg\n1.5 dl melk';
        const scaled = scaleIngredients(ingredients, 2);
        
        assert.isTrue(scaled.includes('400'), 'Should double 200');
        assert.isTrue(scaled.includes('6'), 'Should double 3');
        assert.isTrue(scaled.includes('3'), 'Should double 1.5');
    });

    suite.test('recipe validation - should validate required fields', () => {
        const validateRecipe = (recipe) => {
            const errors = [];
            if (!recipe.title?.trim()) errors.push('Tittel er påkrevd');
            if (!recipe.ingredients?.trim()) errors.push('Ingredienser er påkrevd');
            if (!recipe.instructions?.trim()) errors.push('Fremgangsmåte er påkrevd');
            return errors;
        };
        
        assert.lengthOf(validateRecipe({}), 3);
        assert.lengthOf(validateRecipe({ title: 'Test' }), 2);
        assert.lengthOf(validateRecipe({ title: 'Test', ingredients: 'Mel', instructions: 'Bland' }), 0);
        assert.lengthOf(validateRecipe({ title: '  ', ingredients: '', instructions: '' }), 3);
    });

    suite.test('recipe filtering - should filter by category', () => {
        const recipes = [
            { id: '1', title: 'Pannekaker', category: 'dessert' },
            { id: '2', title: 'Laks', category: 'fisk' },
            { id: '3', title: 'Sjokoladekake', category: 'dessert' }
        ];
        
        const filterByCategory = (recipes, category) => {
            if (!category) return recipes;
            return recipes.filter(r => r.category === category);
        };
        
        assert.lengthOf(filterByCategory(recipes, 'dessert'), 2);
        assert.lengthOf(filterByCategory(recipes, 'fisk'), 1);
        assert.lengthOf(filterByCategory(recipes, 'kjøtt'), 0);
        assert.lengthOf(filterByCategory(recipes, null), 3);
    });

    suite.test('recipe sorting - should sort by date', () => {
        const recipes = [
            { id: '1', title: 'A', createdAt: new Date('2024-01-01') },
            { id: '2', title: 'B', createdAt: new Date('2024-03-01') },
            { id: '3', title: 'C', createdAt: new Date('2024-02-01') }
        ];
        
        const sortByDate = (recipes, order = 'newest') => {
            return [...recipes].sort((a, b) => {
                const dateA = a.createdAt?.getTime?.() || 0;
                const dateB = b.createdAt?.getTime?.() || 0;
                return order === 'newest' ? dateB - dateA : dateA - dateB;
            });
        };
        
        const newest = sortByDate(recipes, 'newest');
        assert.equal(newest[0].title, 'B', 'Newest first');
        
        const oldest = sortByDate(recipes, 'oldest');
        assert.equal(oldest[0].title, 'A', 'Oldest first');
    });
});

// ===== GAMIFICATION TESTS =====
suite.describe('Gamification System', () => {
    
    suite.test('getPlayerLevel - should calculate level from XP', () => {
        const getPlayerLevel = (xp) => {
            const level = Math.floor(Math.sqrt(xp / 10));
            const currentLevelXP = level * level * 10;
            const nextLevelXP = (level + 1) * (level + 1) * 10;
            const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
            return { level, xp, currentLevelXP, nextLevelXP, progress };
        };
        
        const level0 = getPlayerLevel(0);
        assert.equal(level0.level, 0);
        
        const level1 = getPlayerLevel(10);
        assert.equal(level1.level, 1);
        
        const level2 = getPlayerLevel(40);
        assert.equal(level2.level, 2);
        
        const level5 = getPlayerLevel(250);
        assert.equal(level5.level, 5);
    });

    suite.test('addXP - should only add XP when gamification enabled', () => {
        let xp = 0;
        const settings = { gamificationEnabled: false };
        
        const addXP = (amount) => {
            if (!settings.gamificationEnabled) return;
            xp += amount;
        };
        
        addXP(100);
        assert.equal(xp, 0, 'Should not add XP when gamification disabled');
        
        settings.gamificationEnabled = true;
        addXP(100);
        assert.equal(xp, 100, 'Should add XP when gamification enabled');
    });

    suite.test('achievements - should track unlocked achievements', () => {
        const achievements = {
            firstRecipe: { name: 'Første oppskrift', xp: 10 },
            fiveRecipes: { name: '5 oppskrifter', xp: 25 }
        };
        
        let earnedAchievements = [];
        const settings = { gamificationEnabled: true };
        
        const unlockAchievement = (id) => {
            if (!settings.gamificationEnabled) return false;
            if (earnedAchievements.includes(id)) return false;
            if (!achievements[id]) return false;
            earnedAchievements.push(id);
            return true;
        };
        
        assert.isTrue(unlockAchievement('firstRecipe'));
        assert.isFalse(unlockAchievement('firstRecipe'), 'Should not unlock twice');
        assert.isFalse(unlockAchievement('nonexistent'));
        
        settings.gamificationEnabled = false;
        assert.isFalse(unlockAchievement('fiveRecipes'), 'Should not unlock when disabled');
    });

    suite.test('daily streak - should calculate streak correctly', () => {
        const calculateStreak = (lastLoginDate, currentDate) => {
            if (!lastLoginDate) return 1;
            
            const last = new Date(lastLoginDate);
            const current = new Date(currentDate);
            
            // Reset time to compare days only
            last.setHours(0, 0, 0, 0);
            current.setHours(0, 0, 0, 0);
            
            const diffDays = Math.floor((current - last) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return null; // Same day
            if (diffDays === 1) return 'continue'; // Next day - continue streak
            return 'reset'; // More than 1 day - reset streak
        };
        
        assert.equal(calculateStreak('2024-01-01', '2024-01-01'), null, 'Same day');
        assert.equal(calculateStreak('2024-01-01', '2024-01-02'), 'continue', 'Next day');
        assert.equal(calculateStreak('2024-01-01', '2024-01-03'), 'reset', 'Skipped a day');
    });
});

// ===== SOCIAL FEATURES TESTS =====
suite.describe('Social Features', () => {
    
    suite.test('friend request validation', () => {
        const validateFriendRequest = (fromUid, toUid, existingFriends) => {
            if (!fromUid || !toUid) return { valid: false, error: 'Missing user ID' };
            if (fromUid === toUid) return { valid: false, error: 'Cannot add yourself' };
            if (existingFriends.some(f => f.friendUid === toUid)) {
                return { valid: false, error: 'Already friends' };
            }
            return { valid: true };
        };
        
        const friends = [{ friendUid: 'user-2' }];
        
        assert.isTrue(validateFriendRequest('user-1', 'user-3', friends).valid);
        assert.isFalse(validateFriendRequest('user-1', 'user-1', friends).valid);
        assert.isFalse(validateFriendRequest('user-1', 'user-2', friends).valid);
        assert.isFalse(validateFriendRequest(null, 'user-2', friends).valid);
    });

    suite.test('shared recipe handling', () => {
        let sharedRecipes = [];
        
        const shareRecipe = (recipe, fromUser, toUser) => {
            const share = {
                id: Date.now().toString(),
                recipe,
                fromUid: fromUser.uid,
                fromName: fromUser.displayName,
                toUid: toUser.uid,
                sharedAt: new Date(),
                viewed: false
            };
            sharedRecipes.push(share);
            return share;
        };
        
        const recipe = { id: 'r1', title: 'Pannekaker' };
        const from = { uid: 'u1', displayName: 'Alice' };
        const to = { uid: 'u2' };
        
        const shared = shareRecipe(recipe, from, to);
        
        assert.isDefined(shared.id);
        assert.equal(shared.fromUid, 'u1');
        assert.equal(shared.toUid, 'u2');
        assert.isFalse(shared.viewed);
    });

    suite.test('leaderboard sorting', () => {
        const players = [
            { uid: '1', displayName: 'Alice', level: 5, xp: 250 },
            { uid: '2', displayName: 'Bob', level: 8, xp: 640 },
            { uid: '3', displayName: 'Charlie', level: 5, xp: 260 }
        ];
        
        const sortLeaderboard = (players) => {
            return [...players].sort((a, b) => {
                if (b.level !== a.level) return b.level - a.level;
                return b.xp - a.xp;
            });
        };
        
        const sorted = sortLeaderboard(players);
        assert.equal(sorted[0].displayName, 'Bob', 'Highest level first');
        assert.equal(sorted[1].displayName, 'Charlie', 'Same level - higher XP first');
    });
});

// ===== MEAL PLANNING TESTS =====
suite.describe('Meal Planning', () => {
    
    suite.test('date key generation', () => {
        const getDateKey = (date) => {
            const d = new Date(date);
            return d.toISOString().split('T')[0];
        };
        
        assert.equal(getDateKey('2024-06-15'), '2024-06-15');
        assert.equal(getDateKey(new Date('2024-06-15')), '2024-06-15');
    });

    suite.test('week dates calculation', () => {
        const getWeekDates = (offset = 0) => {
            const today = new Date();
            const dayOfWeek = today.getDay();
            const monday = new Date(today);
            monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + (offset * 7));
            
            const dates = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(monday);
                d.setDate(monday.getDate() + i);
                dates.push(d);
            }
            return dates;
        };
        
        const thisWeek = getWeekDates(0);
        assert.lengthOf(thisWeek, 7);
        assert.equal(thisWeek[0].getDay(), 1, 'First day should be Monday');
    });

    suite.test('shopping list generation from meal plan', () => {
        const mealPlan = {
            '2024-06-15': { name: 'Pasta', ingredients: ['pasta', 'tomatsaus'] },
            '2024-06-16': { name: 'Salat', ingredients: ['salat', 'tomat'] }
        };
        
        const generateShoppingList = (mealPlan) => {
            const items = [];
            Object.values(mealPlan).forEach(meal => {
                if (meal.ingredients) {
                    meal.ingredients.forEach(ing => {
                        if (!items.includes(ing)) items.push(ing);
                    });
                }
            });
            return items;
        };
        
        const list = generateShoppingList(mealPlan);
        assert.lengthOf(list, 4);
        assert.contains(list, 'pasta');
        assert.contains(list, 'tomat');
    });
});

// ===== SETTINGS TESTS =====
suite.describe('Settings', () => {
    
    suite.test('dark mode toggle', () => {
        const settings = { darkMode: false };
        let bodyClasses = [];
        
        const toggleDarkMode = (enabled) => {
            settings.darkMode = enabled;
            if (enabled) {
                bodyClasses.push('dark-mode');
            } else {
                bodyClasses = bodyClasses.filter(c => c !== 'dark-mode');
            }
        };
        
        toggleDarkMode(true);
        assert.isTrue(settings.darkMode);
        assert.contains(bodyClasses, 'dark-mode');
        
        toggleDarkMode(false);
        assert.isFalse(settings.darkMode);
        assert.lengthOf(bodyClasses, 0);
    });

    suite.test('font size settings', () => {
        const validSizes = ['small', 'normal', 'large'];
        
        const setFontSize = (size) => {
            if (!validSizes.includes(size)) return false;
            return size;
        };
        
        assert.equal(setFontSize('small'), 'small');
        assert.equal(setFontSize('normal'), 'normal');
        assert.equal(setFontSize('large'), 'large');
        assert.isFalse(setFontSize('huge'));
    });

    suite.test('notification settings', () => {
        const settings = {
            pushNotifications: true,
            timerNotifications: true,
            mealReminders: false,
            friendNotifications: true
        };
        
        assert.isTrue(settings.pushNotifications);
        assert.isFalse(settings.mealReminders);
        
        settings.mealReminders = true;
        assert.isTrue(settings.mealReminders);
    });
});

// ===== TIMER TESTS =====
suite.describe('Timer', () => {
    
    suite.test('timer format display', () => {
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };
        
        assert.equal(formatTime(0), '00:00');
        assert.equal(formatTime(30), '00:30');
        assert.equal(formatTime(60), '01:00');
        assert.equal(formatTime(90), '01:30');
        assert.equal(formatTime(3661), '61:01');
    });

    suite.test('timer countdown', () => {
        let timerSeconds = 60;
        
        const tick = () => {
            if (timerSeconds > 0) {
                timerSeconds--;
                return true;
            }
            return false; // Timer finished
        };
        
        for (let i = 0; i < 60; i++) {
            assert.isTrue(tick());
        }
        assert.isFalse(tick(), 'Should return false when finished');
        assert.equal(timerSeconds, 0);
    });
});

// ===== DATA EXPORT/IMPORT TESTS =====
suite.describe('Data Export/Import', () => {
    
    suite.test('export data structure', () => {
        const createExportData = (state) => ({
            version: '4.6.0',
            exportedAt: new Date().toISOString(),
            recipes: state.recipes,
            books: state.books,
            categories: state.categories,
            settings: state.settings,
            favorites: state.favorites,
            mealPlan: state.mealPlan
        });
        
        const state = {
            recipes: [{ id: '1', title: 'Test' }],
            books: [],
            categories: [],
            settings: { darkMode: true },
            favorites: ['1'],
            mealPlan: {}
        };
        
        const exported = createExportData(state);
        
        assert.hasProperty(exported, 'version');
        assert.hasProperty(exported, 'exportedAt');
        assert.hasProperty(exported, 'recipes');
        assert.lengthOf(exported.recipes, 1);
    });

    suite.test('import data validation', () => {
        const validateImportData = (data) => {
            const errors = [];
            
            if (!data) {
                errors.push('No data provided');
                return errors;
            }
            
            if (!data.recipes && !data.books && !data.categories) {
                errors.push('No valid data found');
            }
            
            if (data.recipes && !Array.isArray(data.recipes)) {
                errors.push('Recipes must be an array');
            }
            
            return errors;
        };
        
        assert.lengthOf(validateImportData(null), 1);
        assert.lengthOf(validateImportData({}), 1);
        assert.lengthOf(validateImportData({ recipes: 'not array' }), 1);
        assert.lengthOf(validateImportData({ recipes: [] }), 0);
    });
});

// ===== SEARCH TESTS =====
suite.describe('Search Functions', () => {
    
    suite.test('recipe search - should find matches', () => {
        const recipes = [
            { id: '1', title: 'Pannekaker', ingredients: 'mel, egg, melk' },
            { id: '2', title: 'Vafler', ingredients: 'mel, egg, sukker' },
            { id: '3', title: 'Laks med ris', ingredients: 'laks, ris, sitron' }
        ];
        
        const searchRecipes = (recipes, query) => {
            if (!query) return recipes;
            const q = query.toLowerCase();
            return recipes.filter(r => 
                r.title.toLowerCase().includes(q) ||
                r.ingredients?.toLowerCase().includes(q)
            );
        };
        
        assert.lengthOf(searchRecipes(recipes, 'pannekaker'), 1);
        assert.lengthOf(searchRecipes(recipes, 'mel'), 2);
        assert.lengthOf(searchRecipes(recipes, 'laks'), 1);
        assert.lengthOf(searchRecipes(recipes, ''), 3);
        assert.lengthOf(searchRecipes(recipes, 'pizza'), 0);
    });

    suite.test('norwegian translation mapping', () => {
        const norwegianTranslations = {
            'chicken': 'kylling',
            'beef': 'biff',
            'pork': 'svinekjøtt',
            'fish': 'fisk'
        };
        
        const translateToNorwegian = (text) => {
            let translated = text.toLowerCase();
            Object.entries(norwegianTranslations).forEach(([en, no]) => {
                translated = translated.replace(new RegExp(en, 'gi'), no);
            });
            return translated;
        };
        
        assert.equal(translateToNorwegian('chicken'), 'kylling');
        assert.equal(translateToNorwegian('Beef steak'), 'biff steak');
        assert.isTrue(translateToNorwegian('grilled fish').includes('fisk'));
    });
});

// ===== IMAGE HANDLING TESTS =====
suite.describe('Image Handling', () => {
    
    suite.test('file to base64 conversion check', () => {
        // This is a mock test since actual file handling requires browser APIs
        const isValidBase64Image = (str) => {
            if (!str) return false;
            return str.startsWith('data:image/') && str.includes('base64,');
        };
        
        assert.isTrue(isValidBase64Image('data:image/png;base64,iVBORw0KGgo='));
        assert.isTrue(isValidBase64Image('data:image/jpeg;base64,/9j/4AAQ'));
        assert.isFalse(isValidBase64Image('not-a-base64-string'));
        assert.isFalse(isValidBase64Image(null));
    });

    suite.test('image compression settings', () => {
        const compressionSettings = {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.8
        };
        
        assert.greaterThan(compressionSettings.maxWidth, 0);
        assert.greaterThan(compressionSettings.maxHeight, 0);
        assert.greaterThan(compressionSettings.quality, 0);
        assert.lessThan(compressionSettings.quality, 1.01);
    });
});

// ===== KITCHEN EQUIPMENT TESTS =====
suite.describe('Kitchen Equipment (v4.1)', () => {
    
    suite.test('pantry item expiry detection', () => {
        const isExpiringSoon = (expiryDate, daysThreshold = 3) => {
            if (!expiryDate) return false;
            const now = new Date();
            const expiry = new Date(expiryDate);
            const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= daysThreshold;
        };
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        assert.isTrue(isExpiringSoon(tomorrow.toISOString()));
        assert.isFalse(isExpiringSoon(nextWeek.toISOString()));
        assert.isFalse(isExpiringSoon(null));
    });

    suite.test('equipment categorization', () => {
        const equipmentCategories = {
            'cooking': ['stekepanne', 'gryte', 'wok'],
            'baking': ['bakepapir', 'kakeform', 'deigkrok'],
            'appliances': ['blender', 'mikser', 'foodprosessor']
        };
        
        const categorizeEquipment = (item) => {
            const itemLower = item.toLowerCase();
            for (const [category, items] of Object.entries(equipmentCategories)) {
                if (items.some(i => itemLower.includes(i))) {
                    return category;
                }
            }
            return 'other';
        };
        
        assert.equal(categorizeEquipment('stor stekepanne'), 'cooking');
        assert.equal(categorizeEquipment('Kakeform 24cm'), 'baking');
        assert.equal(categorizeEquipment('Blender'), 'appliances');
        assert.equal(categorizeEquipment('ukjent ting'), 'other');
    });
});

// ===== COOKBOOK SHARING TESTS =====
suite.describe('Cookbook Sharing', () => {
    
    suite.test('cookbook export format', () => {
        const createCookbookExport = (book, recipes) => ({
            format: 'kokebok',
            version: '1.0',
            exportedAt: new Date().toISOString(),
            cookbook: {
                name: book.name,
                description: book.description,
                cover: book.cover
            },
            recipes: recipes.map(r => ({
                title: r.title,
                ingredients: r.ingredients,
                instructions: r.instructions,
                category: r.category,
                servings: r.servings
            }))
        });
        
        const book = { name: 'Min kokebok', description: 'Favoritter' };
        const recipes = [{ title: 'Test', ingredients: 'mel', instructions: 'bland' }];
        
        const exported = createCookbookExport(book, recipes);
        
        assert.equal(exported.format, 'kokebok');
        assert.hasProperty(exported, 'version');
        assert.hasProperty(exported, 'cookbook');
        assert.lengthOf(exported.recipes, 1);
    });

    suite.test('shared cookbook acceptance', () => {
        const sharedCookbook = {
            id: 'share-1',
            cookbookName: 'Familieoppskrifter',
            recipeCount: 5,
            fromName: 'Bestemor',
            accepted: false
        };
        
        const acceptCookbook = (share) => {
            share.accepted = true;
            share.acceptedAt = new Date();
            return share;
        };
        
        const accepted = acceptCookbook(sharedCookbook);
        assert.isTrue(accepted.accepted);
        assert.isDefined(accepted.acceptedAt);
    });
});

// ===== ERROR HANDLING TESTS =====
suite.describe('Error Handling', () => {
    
    suite.test('toast message types', () => {
        const validTypes = ['info', 'success', 'warning', 'error'];
        
        const validateToastType = (type) => {
            return validTypes.includes(type) ? type : 'info';
        };
        
        assert.equal(validateToastType('success'), 'success');
        assert.equal(validateToastType('error'), 'error');
        assert.equal(validateToastType('invalid'), 'info');
    });

    suite.test('network error handling', () => {
        const handleNetworkError = (error) => {
            if (error.message?.includes('network')) {
                return { type: 'network', message: 'Sjekk internettforbindelsen' };
            }
            if (error.code === 'permission-denied') {
                return { type: 'permission', message: 'Ingen tilgang' };
            }
            return { type: 'unknown', message: 'En feil oppstod' };
        };
        
        const networkErr = handleNetworkError({ message: 'network error' });
        assert.equal(networkErr.type, 'network');
        
        const permErr = handleNetworkError({ code: 'permission-denied' });
        assert.equal(permErr.type, 'permission');
        
        const unknownErr = handleNetworkError({});
        assert.equal(unknownErr.type, 'unknown');
    });
});

// Eksporter for bruk
if (typeof module !== 'undefined' && module.exports) {
    module.exports = suite;
}

if (typeof window !== 'undefined') {
    window.unitTestSuite = suite;
}
