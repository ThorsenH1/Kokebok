/**
 * ==========================================
 * KOKEBOK INTEGRATION TESTS
 * Tester samspill mellom komponenter
 * ==========================================
 */

// Import test framework
if (typeof require !== 'undefined') {
    const { KokebokTestSuite, assert, mockFirebase, mockLocalStorage } = require('./test-suite.js');
}

const integrationSuite = new KokebokTestSuite();

// ===== FIREBASE INTEGRATION TESTS =====
integrationSuite.describe('Firebase Integration', () => {

    integrationSuite.test('saveToFirestore - should save document correctly', async () => {
        const mockDb = mockFirebase.firestore();
        
        const recipe = {
            title: 'Test Oppskrift',
            ingredients: 'mel, sukker',
            instructions: 'Bland sammen',
            category: 'dessert',
            createdAt: new Date()
        };
        
        // Simulate saving
        await mockDb.collection('recipes').add(recipe);
        
        // Verify it was saved
        const snapshot = await mockDb.collection('recipes').get();
        const docs = snapshot.docs || [];
        
        assert.greaterThan(docs.length, 0, 'Should have saved document');
    });

    integrationSuite.test('loadCollection - should load all documents', async () => {
        const mockDb = mockFirebase.firestore();
        
        // Add multiple documents
        await mockDb.collection('test').add({ name: 'Item 1' });
        await mockDb.collection('test').add({ name: 'Item 2' });
        await mockDb.collection('test').add({ name: 'Item 3' });
        
        const snapshot = await mockDb.collection('test').get();
        
        assert.greaterThanOrEqual(snapshot.docs.length, 3);
    });

    integrationSuite.test('deleteFromFirestore - should remove document', async () => {
        const mockDb = mockFirebase.firestore();
        
        const docRef = await mockDb.collection('delete-test').add({ name: 'To delete' });
        
        // Verify it exists
        const before = await mockDb.collection('delete-test').doc(docRef.id).get();
        assert.isTrue(before.exists);
        
        // Delete it
        await mockDb.collection('delete-test').doc(docRef.id).delete();
        
        // Verify it's gone
        const after = await mockDb.collection('delete-test').doc(docRef.id).get();
        assert.isFalse(after.exists);
    });

    integrationSuite.test('updateDocument - should update existing document', async () => {
        const mockDb = mockFirebase.firestore();
        
        const docRef = await mockDb.collection('update-test').add({ 
            name: 'Original',
            count: 1
        });
        
        await mockDb.collection('update-test').doc(docRef.id).update({ 
            name: 'Updated',
            count: 2
        });
        
        const doc = await mockDb.collection('update-test').doc(docRef.id).get();
        const data = doc.data();
        
        assert.equal(data.name, 'Updated');
        assert.equal(data.count, 2);
    });

    integrationSuite.test('batch write - should perform atomic operations', async () => {
        const mockDb = mockFirebase.firestore();
        
        const batch = mockDb.batch();
        const doc1Ref = mockDb.collection('batch-test').doc('doc1');
        const doc2Ref = mockDb.collection('batch-test').doc('doc2');
        
        batch.set(doc1Ref, { name: 'Batch 1' });
        batch.set(doc2Ref, { name: 'Batch 2' });
        
        await batch.commit();
        
        const doc1 = await doc1Ref.get();
        const doc2 = await doc2Ref.get();
        
        assert.isTrue(doc1.exists);
        assert.isTrue(doc2.exists);
    });
});

// ===== AUTH INTEGRATION TESTS =====
integrationSuite.describe('Authentication Integration', () => {

    integrationSuite.test('auth state change handler', async () => {
        let currentUser = null;
        const mockAuth = mockFirebase.auth();
        
        // Set up auth state listener
        mockAuth.onAuthStateChanged((user) => {
            currentUser = user;
        });
        
        // Simulate sign in
        const mockUser = {
            uid: 'test-user-123',
            email: 'test@test.com',
            displayName: 'Test User'
        };
        
        mockAuth._currentUser = mockUser;
        mockAuth._notifyListeners();
        
        assert.isDefined(currentUser);
        assert.equal(currentUser.uid, 'test-user-123');
    });

    integrationSuite.test('user profile creation on first login', async () => {
        const mockDb = mockFirebase.firestore();
        
        const createUserProfile = async (user) => {
            const profileRef = mockDb.collection('publicProfiles').doc(user.uid);
            const profileDoc = await profileRef.get();
            
            if (!profileDoc.exists) {
                await profileRef.set({
                    displayName: user.displayName || 'Anonym',
                    photoURL: user.photoURL || null,
                    createdAt: new Date(),
                    level: 0,
                    xp: 0
                });
                return true; // New profile created
            }
            return false; // Profile already exists
        };
        
        const user = { uid: 'new-user-123', displayName: 'New User' };
        
        const created = await createUserProfile(user);
        assert.isTrue(created, 'Should create new profile');
        
        const createdAgain = await createUserProfile(user);
        assert.isFalse(createdAgain, 'Should not create duplicate profile');
    });
});

// ===== RECIPE + CATEGORY INTEGRATION =====
integrationSuite.describe('Recipe-Category Integration', () => {

    integrationSuite.test('recipe filtering by category', () => {
        const state = {
            recipes: [
                { id: '1', title: 'Pannekaker', category: 'dessert' },
                { id: '2', title: 'Laks', category: 'fisk' },
                { id: '3', title: 'Sjokoladekake', category: 'dessert' },
                { id: '4', title: 'Pasta Carbonara', category: 'hovedrett' }
            ],
            categories: [
                { id: 'dessert', name: 'Desserter' },
                { id: 'fisk', name: 'Fisk og skalldyr' },
                { id: 'hovedrett', name: 'Hovedretter' }
            ]
        };
        
        const getRecipesByCategory = (categoryId) => {
            return state.recipes.filter(r => r.category === categoryId);
        };
        
        const getCategoryInfo = (categoryId) => {
            return state.categories.find(c => c.id === categoryId);
        };
        
        const desserts = getRecipesByCategory('dessert');
        assert.lengthOf(desserts, 2);
        
        const categoryInfo = getCategoryInfo('dessert');
        assert.equal(categoryInfo.name, 'Desserter');
    });

    integrationSuite.test('recipe count per category', () => {
        const recipes = [
            { category: 'dessert' },
            { category: 'dessert' },
            { category: 'fisk' },
            { category: 'hovedrett' },
            { category: 'hovedrett' },
            { category: 'hovedrett' }
        ];
        
        const countByCategory = (recipes) => {
            return recipes.reduce((acc, r) => {
                acc[r.category] = (acc[r.category] || 0) + 1;
                return acc;
            }, {});
        };
        
        const counts = countByCategory(recipes);
        
        assert.equal(counts.dessert, 2);
        assert.equal(counts.fisk, 1);
        assert.equal(counts.hovedrett, 3);
    });
});

// ===== COOKBOOK + RECIPE INTEGRATION =====
integrationSuite.describe('Cookbook-Recipe Integration', () => {

    integrationSuite.test('cookbook recipe linking', () => {
        const state = {
            recipes: [
                { id: 'r1', title: 'Pannekaker' },
                { id: 'r2', title: 'Vafler' },
                { id: 'r3', title: 'Sjokoladekake' }
            ],
            books: [
                { id: 'b1', name: 'Søte favoritter', recipeIds: ['r1', 'r3'] },
                { id: 'b2', name: 'Frokost', recipeIds: ['r1', 'r2'] }
            ]
        };
        
        const getBookRecipes = (bookId) => {
            const book = state.books.find(b => b.id === bookId);
            if (!book) return [];
            return state.recipes.filter(r => book.recipeIds.includes(r.id));
        };
        
        const bookRecipes = getBookRecipes('b1');
        assert.lengthOf(bookRecipes, 2);
        assert.isTrue(bookRecipes.some(r => r.title === 'Pannekaker'));
        assert.isTrue(bookRecipes.some(r => r.title === 'Sjokoladekake'));
    });

    integrationSuite.test('add recipe to cookbook', () => {
        let book = { id: 'b1', name: 'Min kokebok', recipeIds: ['r1'] };
        
        const addRecipeToBook = (book, recipeId) => {
            if (book.recipeIds.includes(recipeId)) {
                return { success: false, error: 'Oppskriften er allerede i kokeboken' };
            }
            book.recipeIds.push(recipeId);
            return { success: true };
        };
        
        const result = addRecipeToBook(book, 'r2');
        assert.isTrue(result.success);
        assert.lengthOf(book.recipeIds, 2);
        
        const duplicate = addRecipeToBook(book, 'r2');
        assert.isFalse(duplicate.success);
    });

    integrationSuite.test('remove recipe from cookbook', () => {
        let book = { id: 'b1', name: 'Min kokebok', recipeIds: ['r1', 'r2', 'r3'] };
        
        const removeRecipeFromBook = (book, recipeId) => {
            const index = book.recipeIds.indexOf(recipeId);
            if (index === -1) return false;
            book.recipeIds.splice(index, 1);
            return true;
        };
        
        const removed = removeRecipeFromBook(book, 'r2');
        assert.isTrue(removed);
        assert.lengthOf(book.recipeIds, 2);
        assert.isFalse(book.recipeIds.includes('r2'));
    });
});

// ===== GAMIFICATION INTEGRATION =====
integrationSuite.describe('Gamification Integration', () => {

    integrationSuite.test('full gamification flow - recipe creation', () => {
        const state = {
            settings: { gamificationEnabled: true },
            userProgress: { xp: 0, level: 0, achievements: [], recipeCount: 0 }
        };
        
        const achievements = {
            firstRecipe: { id: 'firstRecipe', name: 'Første oppskrift', xp: 10 },
            fiveRecipes: { id: 'fiveRecipes', name: '5 oppskrifter', xp: 25 }
        };
        
        const addXP = (amount) => {
            if (!state.settings.gamificationEnabled) return;
            state.userProgress.xp += amount;
            // Recalculate level
            state.userProgress.level = Math.floor(Math.sqrt(state.userProgress.xp / 10));
        };
        
        const checkAchievements = () => {
            const earned = [];
            
            if (state.userProgress.recipeCount >= 1 && 
                !state.userProgress.achievements.includes('firstRecipe')) {
                state.userProgress.achievements.push('firstRecipe');
                addXP(achievements.firstRecipe.xp);
                earned.push(achievements.firstRecipe);
            }
            
            if (state.userProgress.recipeCount >= 5 && 
                !state.userProgress.achievements.includes('fiveRecipes')) {
                state.userProgress.achievements.push('fiveRecipes');
                addXP(achievements.fiveRecipes.xp);
                earned.push(achievements.fiveRecipes);
            }
            
            return earned;
        };
        
        const createRecipe = () => {
            state.userProgress.recipeCount++;
            addXP(5); // Base XP for creating recipe
            return checkAchievements();
        };
        
        // Create first recipe
        const firstAchievements = createRecipe();
        assert.equal(state.userProgress.xp, 15); // 5 base + 10 achievement
        assert.lengthOf(firstAchievements, 1);
        assert.equal(firstAchievements[0].name, 'Første oppskrift');
        
        // Create more recipes
        for (let i = 0; i < 4; i++) {
            createRecipe();
        }
        
        assert.equal(state.userProgress.recipeCount, 5);
        assert.isTrue(state.userProgress.achievements.includes('fiveRecipes'));
    });

    integrationSuite.test('gamification disabled - should not track progress', () => {
        const state = {
            settings: { gamificationEnabled: false },
            userProgress: { xp: 0 }
        };
        
        const addXP = (amount) => {
            if (!state.settings.gamificationEnabled) return false;
            state.userProgress.xp += amount;
            return true;
        };
        
        const result = addXP(100);
        assert.isFalse(result);
        assert.equal(state.userProgress.xp, 0);
    });

    integrationSuite.test('leaderboard with friends integration', () => {
        const friends = [
            { friendUid: 'friend-1', displayName: 'Alice' },
            { friendUid: 'friend-2', displayName: 'Bob' }
        ];
        
        const publicProfiles = {
            'me': { displayName: 'Me', xp: 150, level: 3 },
            'friend-1': { displayName: 'Alice', xp: 200, level: 4 },
            'friend-2': { displayName: 'Bob', xp: 100, level: 3 }
        };
        
        const getFriendLeaderboard = (myUid, friends, profiles) => {
            const entries = [{ uid: myUid, ...profiles[myUid] }];
            
            friends.forEach(f => {
                if (profiles[f.friendUid]) {
                    entries.push({ uid: f.friendUid, ...profiles[f.friendUid] });
                }
            });
            
            return entries.sort((a, b) => {
                if (b.level !== a.level) return b.level - a.level;
                return b.xp - a.xp;
            });
        };
        
        const leaderboard = getFriendLeaderboard('me', friends, publicProfiles);
        
        assert.lengthOf(leaderboard, 3);
        assert.equal(leaderboard[0].displayName, 'Alice', 'Highest level/XP first');
        assert.equal(leaderboard[2].displayName, 'Bob', 'Lowest last');
    });
});

// ===== SOCIAL INTEGRATION =====
integrationSuite.describe('Social Feature Integration', () => {

    integrationSuite.test('two-way friendship creation', async () => {
        const mockDb = mockFirebase.firestore();
        
        const createFriendship = async (user1Uid, user2Uid) => {
            const batch = mockDb.batch();
            
            // Add to user1's friends
            const friend1Ref = mockDb
                .collection('users')
                .doc(user1Uid)
                .collection('friends')
                .doc(user2Uid);
            
            batch.set(friend1Ref, {
                friendUid: user2Uid,
                addedAt: new Date()
            });
            
            // Add to user2's friends
            const friend2Ref = mockDb
                .collection('users')
                .doc(user2Uid)
                .collection('friends')
                .doc(user1Uid);
            
            batch.set(friend2Ref, {
                friendUid: user1Uid,
                addedAt: new Date()
            });
            
            await batch.commit();
            return true;
        };
        
        const result = await createFriendship('user-1', 'user-2');
        assert.isTrue(result);
    });

    integrationSuite.test('friend request flow', async () => {
        const state = {
            friendRequests: [],
            friends: []
        };
        
        const sendRequest = (fromUid, fromName, toUid) => {
            // Check if already friends
            if (state.friends.some(f => f.friendUid === toUid)) {
                return { success: false, error: 'Already friends' };
            }
            
            // Check if request already exists
            if (state.friendRequests.some(r => r.fromUid === fromUid && r.toUid === toUid)) {
                return { success: false, error: 'Request already sent' };
            }
            
            state.friendRequests.push({
                id: Date.now().toString(),
                fromUid,
                fromName,
                toUid,
                status: 'pending',
                createdAt: new Date()
            });
            
            return { success: true };
        };
        
        const acceptRequest = (requestId, toUid) => {
            const request = state.friendRequests.find(r => r.id === requestId);
            if (!request) return { success: false, error: 'Request not found' };
            
            // Add to friends list
            state.friends.push({
                friendUid: request.fromUid,
                displayName: request.fromName,
                addedAt: new Date()
            });
            
            // Remove request
            state.friendRequests = state.friendRequests.filter(r => r.id !== requestId);
            
            return { success: true };
        };
        
        // Send request
        const sendResult = sendRequest('user-1', 'Alice', 'user-2');
        assert.isTrue(sendResult.success);
        assert.lengthOf(state.friendRequests, 1);
        
        // Accept request
        const requestId = state.friendRequests[0].id;
        const acceptResult = acceptRequest(requestId, 'user-2');
        assert.isTrue(acceptResult.success);
        assert.lengthOf(state.friends, 1);
        assert.lengthOf(state.friendRequests, 0);
    });

    integrationSuite.test('share recipe to friend', () => {
        const state = {
            friends: [{ friendUid: 'friend-1' }],
            sharedRecipes: []
        };
        
        const shareRecipe = (recipe, fromUser, toUid) => {
            // Check if friend
            if (!state.friends.some(f => f.friendUid === toUid)) {
                return { success: false, error: 'Not friends' };
            }
            
            const share = {
                id: Date.now().toString(),
                recipeId: recipe.id,
                recipeName: recipe.title,
                fromUid: fromUser.uid,
                fromName: fromUser.displayName,
                toUid,
                sharedAt: new Date(),
                viewed: false
            };
            
            state.sharedRecipes.push(share);
            return { success: true, share };
        };
        
        const recipe = { id: 'r1', title: 'Pannekaker' };
        const fromUser = { uid: 'me', displayName: 'Me' };
        
        const result = shareRecipe(recipe, fromUser, 'friend-1');
        assert.isTrue(result.success);
        assert.lengthOf(state.sharedRecipes, 1);
        
        // Try sharing to non-friend
        const failResult = shareRecipe(recipe, fromUser, 'stranger');
        assert.isFalse(failResult.success);
    });
});

// ===== MEAL PLANNING INTEGRATION =====
integrationSuite.describe('Meal Planning Integration', () => {

    integrationSuite.test('meal plan to shopping list', () => {
        const mealPlan = {
            '2024-06-17': { recipeId: 'r1' },
            '2024-06-18': { recipeId: 'r2' },
            '2024-06-19': { recipeId: 'r1' } // Same recipe, should dedupe ingredients
        };
        
        const recipes = {
            'r1': {
                title: 'Pasta',
                ingredients: '400g pasta\n200g tomatsaus\n100g parmesan'
            },
            'r2': {
                title: 'Salat',
                ingredients: '1 stk salat\n2 stk tomater\n100g ost'
            }
        };
        
        const parseIngredients = (ingredientsStr) => {
            return ingredientsStr.split('\n').map(line => {
                const match = line.match(/^([\d.,]+)\s*(\w+)\s+(.+)$/);
                if (match) {
                    return { amount: parseFloat(match[1]), unit: match[2], name: match[3] };
                }
                return { amount: 1, unit: 'stk', name: line };
            });
        };
        
        const generateShoppingList = (mealPlan, recipes) => {
            const items = {};
            
            Object.values(mealPlan).forEach(meal => {
                const recipe = recipes[meal.recipeId];
                if (!recipe) return;
                
                parseIngredients(recipe.ingredients).forEach(ing => {
                    const key = `${ing.name}-${ing.unit}`;
                    if (items[key]) {
                        items[key].amount += ing.amount;
                    } else {
                        items[key] = { ...ing };
                    }
                });
            });
            
            return Object.values(items);
        };
        
        const shoppingList = generateShoppingList(mealPlan, recipes);
        
        // Pasta appears twice, so 800g total
        const pasta = shoppingList.find(i => i.name === 'pasta');
        assert.equal(pasta.amount, 800);
        
        // Parmesan also appears twice
        const parmesan = shoppingList.find(i => i.name === 'parmesan');
        assert.equal(parmesan.amount, 200);
    });

    integrationSuite.test('shopping list persistence', () => {
        const shoppingList = {
            items: [
                { id: '1', name: 'Melk', checked: false },
                { id: '2', name: 'Brød', checked: true }
            ],
            lastUpdated: new Date()
        };
        
        const toggleItem = (list, itemId) => {
            const item = list.items.find(i => i.id === itemId);
            if (item) {
                item.checked = !item.checked;
                list.lastUpdated = new Date();
            }
        };
        
        const clearChecked = (list) => {
            list.items = list.items.filter(i => !i.checked);
            list.lastUpdated = new Date();
        };
        
        toggleItem(shoppingList, '1');
        assert.isTrue(shoppingList.items.find(i => i.id === '1').checked);
        
        clearChecked(shoppingList);
        assert.lengthOf(shoppingList.items, 0);
    });
});

// ===== SETTINGS INTEGRATION =====
integrationSuite.describe('Settings Integration', () => {

    integrationSuite.test('settings save and load from localStorage', () => {
        const storage = mockLocalStorage();
        
        const defaultSettings = {
            darkMode: false,
            fontSize: 'normal',
            gamificationEnabled: false,
            pushNotifications: true,
            autoSave: true
        };
        
        const saveSettings = (settings) => {
            storage.setItem('kokebok_settings', JSON.stringify(settings));
        };
        
        const loadSettings = () => {
            const saved = storage.getItem('kokebok_settings');
            if (saved) {
                return { ...defaultSettings, ...JSON.parse(saved) };
            }
            return { ...defaultSettings };
        };
        
        // Save modified settings
        saveSettings({ ...defaultSettings, darkMode: true, gamificationEnabled: true });
        
        // Load and verify
        const loaded = loadSettings();
        assert.isTrue(loaded.darkMode);
        assert.isTrue(loaded.gamificationEnabled);
        assert.equal(loaded.fontSize, 'normal'); // Should keep default
    });

    integrationSuite.test('settings sync to Firestore', async () => {
        const mockDb = mockFirebase.firestore();
        const user = { uid: 'test-user' };
        
        const syncSettings = async (user, settings) => {
            await mockDb
                .collection('users')
                .doc(user.uid)
                .collection('settings')
                .doc('preferences')
                .set(settings);
        };
        
        const settings = { darkMode: true, gamificationEnabled: false };
        await syncSettings(user, settings);
        
        const doc = await mockDb
            .collection('users')
            .doc(user.uid)
            .collection('settings')
            .doc('preferences')
            .get();
        
        assert.isTrue(doc.exists);
        assert.equal(doc.data().darkMode, true);
    });
});

// ===== TIMER INTEGRATION =====
integrationSuite.describe('Timer Integration', () => {

    integrationSuite.test('multiple timers management', () => {
        const timers = [];
        
        const createTimer = (name, seconds) => {
            const timer = {
                id: Date.now().toString(),
                name,
                totalSeconds: seconds,
                remainingSeconds: seconds,
                isRunning: false,
                interval: null
            };
            timers.push(timer);
            return timer;
        };
        
        const startTimer = (timerId) => {
            const timer = timers.find(t => t.id === timerId);
            if (!timer || timer.isRunning) return false;
            timer.isRunning = true;
            return true;
        };
        
        const stopTimer = (timerId) => {
            const timer = timers.find(t => t.id === timerId);
            if (!timer) return false;
            timer.isRunning = false;
            return true;
        };
        
        const timer1 = createTimer('Pasta', 600);
        const timer2 = createTimer('Egg', 360);
        
        assert.lengthOf(timers, 2);
        
        startTimer(timer1.id);
        assert.isTrue(timer1.isRunning);
        assert.isFalse(timer2.isRunning);
        
        stopTimer(timer1.id);
        assert.isFalse(timer1.isRunning);
    });
});

// Eksporter for bruk
if (typeof module !== 'undefined' && module.exports) {
    module.exports = integrationSuite;
}

if (typeof window !== 'undefined') {
    window.integrationTestSuite = integrationSuite;
}
