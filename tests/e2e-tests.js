/**
 * ==========================================
 * KOKEBOK END-TO-END TESTS
 * Tester brukerscenarier og komplette flyter
 * ==========================================
 */

// Import test framework
if (typeof require !== 'undefined') {
    const { KokebokTestSuite, assert, mockFirebase, mockLocalStorage } = require('./test-suite.js');
}

const e2eSuite = new KokebokTestSuite();

// ===== BRUKER ONBOARDING SCENARIO =====
e2eSuite.describe('User Onboarding Flow', () => {

    e2eSuite.test('Complete new user onboarding', async () => {
        const mockDb = mockFirebase.firestore();
        const mockAuth = mockFirebase.auth();
        const storage = mockLocalStorage();
        
        // Step 1: User signs in with Google
        const mockUser = {
            uid: 'new-user-' + Date.now(),
            email: 'newuser@gmail.com',
            displayName: 'Ny Bruker',
            photoURL: 'https://example.com/photo.jpg'
        };
        
        mockAuth._currentUser = mockUser;
        
        // Step 2: Create user document and public profile
        await mockDb.collection('users').doc(mockUser.uid).set({
            email: mockUser.email,
            displayName: mockUser.displayName,
            createdAt: new Date(),
            lastLogin: new Date()
        });
        
        await mockDb.collection('publicProfiles').doc(mockUser.uid).set({
            displayName: mockUser.displayName,
            photoURL: mockUser.photoURL,
            level: 0,
            xp: 0,
            createdAt: new Date()
        });
        
        // Step 3: Initialize default settings
        const defaultSettings = {
            darkMode: false,
            fontSize: 'normal',
            gamificationEnabled: false,
            pushNotifications: true
        };
        
        await mockDb
            .collection('users')
            .doc(mockUser.uid)
            .collection('settings')
            .doc('preferences')
            .set(defaultSettings);
        
        // Step 4: Create default categories
        const defaultCategories = [
            { id: 'hovedrett', name: 'Hovedretter', icon: '🍽️' },
            { id: 'dessert', name: 'Desserter', icon: '🍰' },
            { id: 'frokost', name: 'Frokost', icon: '🌅' }
        ];
        
        for (const cat of defaultCategories) {
            await mockDb
                .collection('users')
                .doc(mockUser.uid)
                .collection('categories')
                .doc(cat.id)
                .set(cat);
        }
        
        // Verify complete onboarding
        const userDoc = await mockDb.collection('users').doc(mockUser.uid).get();
        assert.isTrue(userDoc.exists, 'User document should exist');
        
        const profileDoc = await mockDb.collection('publicProfiles').doc(mockUser.uid).get();
        assert.isTrue(profileDoc.exists, 'Public profile should exist');
        assert.equal(profileDoc.data().level, 0, 'Should start at level 0');
        
        const settingsDoc = await mockDb
            .collection('users')
            .doc(mockUser.uid)
            .collection('settings')
            .doc('preferences')
            .get();
        assert.isTrue(settingsDoc.exists, 'Settings should exist');
        assert.isFalse(settingsDoc.data().gamificationEnabled, 'Gamification should be off by default');
        
        console.log('✅ User onboarding complete');
    });
});

// ===== OPPSKRIFT WORKFLOW =====
e2eSuite.describe('Recipe Complete Workflow', () => {

    e2eSuite.test('Create, edit, share, and delete recipe', async () => {
        const mockDb = mockFirebase.firestore();
        const user = { uid: 'test-user-recipes', displayName: 'Test User' };
        
        // Step 1: Create new recipe
        const newRecipe = {
            title: 'Pannekaker',
            ingredients: '3 dl mel\n3 egg\n5 dl melk\n1 ts salt',
            instructions: '1. Bland mel og salt\n2. Visp inn egg\n3. Tilsett melk litt etter litt\n4. Stek i panne',
            servings: '4 porsjoner',
            category: 'frokost',
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: user.uid
        };
        
        const recipeRef = await mockDb
            .collection('users')
            .doc(user.uid)
            .collection('recipes')
            .add(newRecipe);
        
        assert.isDefined(recipeRef.id, 'Recipe should have an ID');
        
        // Step 2: Edit recipe
        const updates = {
            title: 'Luftige Pannekaker',
            servings: '6 porsjoner',
            updatedAt: new Date()
        };
        
        await mockDb
            .collection('users')
            .doc(user.uid)
            .collection('recipes')
            .doc(recipeRef.id)
            .update(updates);
        
        const updatedRecipe = await mockDb
            .collection('users')
            .doc(user.uid)
            .collection('recipes')
            .doc(recipeRef.id)
            .get();
        
        assert.equal(updatedRecipe.data().title, 'Luftige Pannekaker');
        assert.equal(updatedRecipe.data().servings, '6 porsjoner');
        
        // Step 3: Share recipe
        const friend = { uid: 'friend-user', displayName: 'Friend' };
        
        const shareData = {
            recipeId: recipeRef.id,
            recipeName: updatedRecipe.data().title,
            recipeData: updatedRecipe.data(),
            fromUid: user.uid,
            fromName: user.displayName,
            toUid: friend.uid,
            sharedAt: new Date(),
            viewed: false
        };
        
        const shareRef = await mockDb
            .collection('users')
            .doc(friend.uid)
            .collection('sharedRecipes')
            .add(shareData);
        
        assert.isDefined(shareRef.id);
        
        // Step 4: Delete recipe
        await mockDb
            .collection('users')
            .doc(user.uid)
            .collection('recipes')
            .doc(recipeRef.id)
            .delete();
        
        const deletedRecipe = await mockDb
            .collection('users')
            .doc(user.uid)
            .collection('recipes')
            .doc(recipeRef.id)
            .get();
        
        assert.isFalse(deletedRecipe.exists, 'Recipe should be deleted');
        
        console.log('✅ Complete recipe workflow successful');
    });
});

// ===== GAMIFICATION SCENARIO =====
e2eSuite.describe('Gamification Complete Flow', () => {

    e2eSuite.test('Enable gamification and earn achievements', async () => {
        const mockDb = mockFirebase.firestore();
        const user = { uid: 'gamification-test-user' };
        
        let state = {
            settings: { gamificationEnabled: false },
            userProgress: {
                xp: 0,
                level: 0,
                achievements: [],
                dailyStreak: 0,
                recipeCount: 0
            }
        };
        
        const achievements = {
            firstRecipe: { id: 'firstRecipe', name: 'Første oppskrift!', description: 'Lag din første oppskrift', xp: 10, icon: '🎉' },
            fiveRecipes: { id: 'fiveRecipes', name: 'Kokkespire', description: 'Lag 5 oppskrifter', xp: 25, icon: '👨‍🍳' },
            tenRecipes: { id: 'tenRecipes', name: 'Oppskrifts-samler', description: 'Lag 10 oppskrifter', xp: 50, icon: '📚' },
            firstLogin: { id: 'firstLogin', name: 'Velkommen!', description: 'Din første pålogging', xp: 5, icon: '👋' },
            weekStreak: { id: 'weekStreak', name: 'Uke-streak', description: 'Logg inn 7 dager på rad', xp: 35, icon: '🔥' }
        };
        
        const earnedNotifications = [];
        
        const getPlayerLevel = (xp) => {
            const level = Math.floor(Math.sqrt(xp / 10));
            return level;
        };
        
        const addXP = (amount, reason) => {
            if (!state.settings.gamificationEnabled) return null;
            
            const oldLevel = getPlayerLevel(state.userProgress.xp);
            state.userProgress.xp += amount;
            const newLevel = getPlayerLevel(state.userProgress.xp);
            state.userProgress.level = newLevel;
            
            const result = { xpAdded: amount, reason, totalXp: state.userProgress.xp };
            
            if (newLevel > oldLevel) {
                result.levelUp = { oldLevel, newLevel };
            }
            
            return result;
        };
        
        const unlockAchievement = (achievementId) => {
            if (!state.settings.gamificationEnabled) return null;
            if (state.userProgress.achievements.includes(achievementId)) return null;
            
            const achievement = achievements[achievementId];
            if (!achievement) return null;
            
            state.userProgress.achievements.push(achievementId);
            const xpResult = addXP(achievement.xp, `Achievement: ${achievement.name}`);
            
            earnedNotifications.push({
                type: 'achievement',
                achievement,
                timestamp: new Date()
            });
            
            return { achievement, xpResult };
        };
        
        // Step 1: Enable gamification mode
        state.settings.gamificationEnabled = true;
        
        // Step 2: First login achievement
        const firstLoginResult = unlockAchievement('firstLogin');
        assert.isDefined(firstLoginResult);
        assert.equal(firstLoginResult.achievement.name, 'Velkommen!');
        assert.equal(state.userProgress.xp, 5);
        
        // Step 3: Create first recipe
        state.userProgress.recipeCount = 1;
        addXP(5, 'Lagde oppskrift');
        const firstRecipeResult = unlockAchievement('firstRecipe');
        
        assert.isDefined(firstRecipeResult);
        assert.equal(state.userProgress.xp, 20); // 5 + 5 + 10
        
        // Step 4: Create more recipes to get level up and achievements
        for (let i = 2; i <= 10; i++) {
            state.userProgress.recipeCount = i;
            const xpResult = addXP(5, 'Lagde oppskrift');
            
            if (i === 5) {
                const fiveRecipesResult = unlockAchievement('fiveRecipes');
                assert.isDefined(fiveRecipesResult);
            }
            
            if (i === 10) {
                const tenRecipesResult = unlockAchievement('tenRecipes');
                assert.isDefined(tenRecipesResult);
            }
        }
        
        // Verify final state
        assert.equal(state.userProgress.recipeCount, 10);
        assert.isTrue(state.userProgress.xp >= 100);
        assert.greaterThan(state.userProgress.level, 0);
        assert.lengthOf(state.userProgress.achievements, 4); // firstLogin, firstRecipe, fiveRecipes, tenRecipes
        assert.lengthOf(earnedNotifications, 4);
        
        console.log('✅ Gamification flow complete');
        console.log(`   Final XP: ${state.userProgress.xp}`);
        console.log(`   Level: ${state.userProgress.level}`);
        console.log(`   Achievements: ${state.userProgress.achievements.join(', ')}`);
    });
});

// ===== VENNSKAP SCENARIO =====
e2eSuite.describe('Friendship Complete Flow', () => {

    e2eSuite.test('Send, accept friend request and view leaderboard', async () => {
        const mockDb = mockFirebase.firestore();
        
        const user1 = { uid: 'user-alice', displayName: 'Alice' };
        const user2 = { uid: 'user-bob', displayName: 'Bob' };
        
        // Create public profiles
        await mockDb.collection('publicProfiles').doc(user1.uid).set({
            displayName: user1.displayName,
            level: 5,
            xp: 250
        });
        
        await mockDb.collection('publicProfiles').doc(user2.uid).set({
            displayName: user2.displayName,
            level: 3,
            xp: 100
        });
        
        // Step 1: Alice sends friend request to Bob
        const requestId = Date.now().toString();
        await mockDb.collection('users').doc(user2.uid).collection('friendRequests').doc(requestId).set({
            fromUid: user1.uid,
            fromName: user1.displayName,
            status: 'pending',
            createdAt: new Date()
        });
        
        // Verify request exists
        const request = await mockDb
            .collection('users')
            .doc(user2.uid)
            .collection('friendRequests')
            .doc(requestId)
            .get();
        
        assert.isTrue(request.exists);
        assert.equal(request.data().fromName, 'Alice');
        
        // Step 2: Bob accepts friend request
        const batch = mockDb.batch();
        
        // Add to Bob's friends
        const bobFriendRef = mockDb
            .collection('users')
            .doc(user2.uid)
            .collection('friends')
            .doc(user1.uid);
        
        batch.set(bobFriendRef, {
            friendUid: user1.uid,
            displayName: user1.displayName,
            addedAt: new Date()
        });
        
        // Add to Alice's friends (two-way)
        const aliceFriendRef = mockDb
            .collection('users')
            .doc(user1.uid)
            .collection('friends')
            .doc(user2.uid);
        
        batch.set(aliceFriendRef, {
            friendUid: user2.uid,
            displayName: user2.displayName,
            addedAt: new Date()
        });
        
        // Delete friend request
        const requestRef = mockDb
            .collection('users')
            .doc(user2.uid)
            .collection('friendRequests')
            .doc(requestId);
        
        batch.delete(requestRef);
        
        await batch.commit();
        
        // Verify two-way friendship
        const aliceFriend = await mockDb
            .collection('users')
            .doc(user1.uid)
            .collection('friends')
            .doc(user2.uid)
            .get();
        
        const bobFriend = await mockDb
            .collection('users')
            .doc(user2.uid)
            .collection('friends')
            .doc(user1.uid)
            .get();
        
        assert.isTrue(aliceFriend.exists, 'Alice should have Bob as friend');
        assert.isTrue(bobFriend.exists, 'Bob should have Alice as friend');
        
        // Step 3: View leaderboard
        const aliceProfile = await mockDb.collection('publicProfiles').doc(user1.uid).get();
        const bobProfile = await mockDb.collection('publicProfiles').doc(user2.uid).get();
        
        const leaderboard = [
            { uid: user1.uid, ...aliceProfile.data() },
            { uid: user2.uid, ...bobProfile.data() }
        ].sort((a, b) => b.level - a.level || b.xp - a.xp);
        
        assert.equal(leaderboard[0].displayName, 'Alice', 'Alice should be first (higher level)');
        assert.equal(leaderboard[1].displayName, 'Bob');
        
        console.log('✅ Friendship flow complete');
    });
});

// ===== MÅLTIDSPLANLEGGING SCENARIO =====
e2eSuite.describe('Meal Planning Complete Flow', () => {

    e2eSuite.test('Plan week and generate shopping list', async () => {
        const user = { uid: 'meal-plan-user' };
        
        const recipes = {
            'pasta': {
                id: 'pasta',
                title: 'Pasta Bolognese',
                servings: 4,
                ingredients: '400g pasta\n500g kjøttdeig\n400g hermetiske tomater\n1 stk løk'
            },
            'laks': {
                id: 'laks',
                title: 'Ovnsbakt laks',
                servings: 4,
                ingredients: '600g laksefilet\n2 stk sitron\n200g brokkoli'
            },
            'taco': {
                id: 'taco',
                title: 'Fredagstaco',
                servings: 4,
                ingredients: '8 stk tacoskjell\n500g kjøttdeig\n1 stk løk\n1 stk paprika'
            }
        };
        
        // Step 1: Create meal plan for the week
        const mealPlan = {};
        const today = new Date();
        
        // Monday - Pasta
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        mealPlan[monday.toISOString().split('T')[0]] = { recipeId: 'pasta', mealType: 'dinner' };
        
        // Wednesday - Laks
        const wednesday = new Date(monday);
        wednesday.setDate(monday.getDate() + 2);
        mealPlan[wednesday.toISOString().split('T')[0]] = { recipeId: 'laks', mealType: 'dinner' };
        
        // Friday - Taco
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);
        mealPlan[friday.toISOString().split('T')[0]] = { recipeId: 'taco', mealType: 'dinner' };
        
        assert.equal(Object.keys(mealPlan).length, 3, 'Should have 3 planned meals');
        
        // Step 2: Parse ingredients from all planned recipes
        const parseIngredient = (line) => {
            const match = line.match(/^([\d.,]+)\s*(\w+)\s+(.+)$/);
            if (match) {
                return {
                    amount: parseFloat(match[1]),
                    unit: match[2],
                    name: match[3].trim()
                };
            }
            return { amount: 1, unit: 'stk', name: line.trim() };
        };
        
        const aggregatedIngredients = {};
        
        Object.values(mealPlan).forEach(meal => {
            const recipe = recipes[meal.recipeId];
            if (!recipe) return;
            
            recipe.ingredients.split('\n').forEach(line => {
                const ing = parseIngredient(line);
                const key = `${ing.name}|${ing.unit}`;
                
                if (aggregatedIngredients[key]) {
                    aggregatedIngredients[key].amount += ing.amount;
                } else {
                    aggregatedIngredients[key] = { ...ing };
                }
            });
        });
        
        // Step 3: Create shopping list
        const shoppingList = Object.values(aggregatedIngredients).map(ing => ({
            ...ing,
            checked: false
        }));
        
        assert.greaterThan(shoppingList.length, 0, 'Shopping list should have items');
        
        // Check kjøttdeig is aggregated (pasta + taco = 1000g)
        const kjottdeig = shoppingList.find(i => i.name === 'kjøttdeig');
        assert.isDefined(kjottdeig);
        assert.equal(kjottdeig.amount, 1000, 'Kjøttdeig should be aggregated');
        
        // Check løk is aggregated (1 + 1 = 2)
        const lok = shoppingList.find(i => i.name === 'løk');
        assert.isDefined(lok);
        assert.equal(lok.amount, 2, 'Løk should be aggregated');
        
        console.log('✅ Meal planning flow complete');
        console.log(`   Planned meals: ${Object.keys(mealPlan).length}`);
        console.log(`   Shopping list items: ${shoppingList.length}`);
    });
});

// ===== KOKEBOK DELING SCENARIO =====
e2eSuite.describe('Cookbook Sharing Complete Flow', () => {

    e2eSuite.test('Create, fill, and share cookbook', async () => {
        const mockDb = mockFirebase.firestore();
        const user = { uid: 'cookbook-user', displayName: 'Chef' };
        const friend = { uid: 'friend-user', displayName: 'Friend' };
        
        // Step 1: Create cookbook
        const cookbook = {
            name: 'Sommermat',
            description: 'Mine beste sommeroppskrifter',
            cover: null,
            recipeIds: [],
            createdAt: new Date(),
            userId: user.uid
        };
        
        const cookbookRef = await mockDb
            .collection('users')
            .doc(user.uid)
            .collection('cookbooks')
            .add(cookbook);
        
        assert.isDefined(cookbookRef.id);
        
        // Step 2: Add recipes to cookbook
        const recipe1 = { id: 'r1', title: 'Grillspyd', category: 'hovedrett' };
        const recipe2 = { id: 'r2', title: 'Sommersalat', category: 'tilbehør' };
        const recipe3 = { id: 'r3', title: 'Jordbærdessert', category: 'dessert' };
        
        await mockDb
            .collection('users')
            .doc(user.uid)
            .collection('cookbooks')
            .doc(cookbookRef.id)
            .update({
                recipeIds: ['r1', 'r2', 'r3']
            });
        
        // Step 3: Share cookbook with friend
        const sharedCookbook = {
            cookbookId: cookbookRef.id,
            cookbookName: cookbook.name,
            recipes: [recipe1, recipe2, recipe3],
            fromUid: user.uid,
            fromName: user.displayName,
            sharedAt: new Date(),
            accepted: false
        };
        
        const shareRef = await mockDb
            .collection('users')
            .doc(friend.uid)
            .collection('sharedCookbooks')
            .add(sharedCookbook);
        
        // Verify share exists
        const share = await mockDb
            .collection('users')
            .doc(friend.uid)
            .collection('sharedCookbooks')
            .doc(shareRef.id)
            .get();
        
        assert.isTrue(share.exists);
        assert.equal(share.data().cookbookName, 'Sommermat');
        assert.lengthOf(share.data().recipes, 3);
        
        // Step 4: Friend accepts shared cookbook
        await mockDb
            .collection('users')
            .doc(friend.uid)
            .collection('sharedCookbooks')
            .doc(shareRef.id)
            .update({
                accepted: true,
                acceptedAt: new Date()
            });
        
        // Create copies of recipes for friend
        for (const recipe of [recipe1, recipe2, recipe3]) {
            await mockDb
                .collection('users')
                .doc(friend.uid)
                .collection('recipes')
                .add({
                    ...recipe,
                    importedFrom: user.uid,
                    importedAt: new Date()
                });
        }
        
        // Verify friend has recipes
        const friendRecipes = await mockDb
            .collection('users')
            .doc(friend.uid)
            .collection('recipes')
            .get();
        
        assert.greaterThanOrEqual(friendRecipes.docs.length, 3);
        
        console.log('✅ Cookbook sharing flow complete');
    });
});

// ===== DATA EKSPORT/IMPORT SCENARIO =====
e2eSuite.describe('Data Export/Import Flow', () => {

    e2eSuite.test('Export all data and reimport', async () => {
        // Simulate current user data
        const userData = {
            recipes: [
                { id: 'r1', title: 'Pannekaker', category: 'frokost', ingredients: 'mel, egg' },
                { id: 'r2', title: 'Vafler', category: 'dessert', ingredients: 'mel, egg, sukker' }
            ],
            cookbooks: [
                { id: 'b1', name: 'Favoritter', recipeIds: ['r1', 'r2'] }
            ],
            categories: [
                { id: 'frokost', name: 'Frokost', icon: '🌅' },
                { id: 'dessert', name: 'Desserter', icon: '🍰' }
            ],
            settings: {
                darkMode: true,
                gamificationEnabled: true
            },
            mealPlan: {
                '2024-06-17': { recipeId: 'r1' }
            }
        };
        
        // Step 1: Create export
        const exportData = {
            version: '4.6.0',
            exportedAt: new Date().toISOString(),
            source: 'Familiens Kokebok',
            data: userData
        };
        
        const exportJson = JSON.stringify(exportData, null, 2);
        
        assert.isTrue(exportJson.length > 0);
        assert.isTrue(exportJson.includes('Pannekaker'));
        assert.isTrue(exportJson.includes('4.6.0'));
        
        // Step 2: Validate import data
        const validateImport = (jsonStr) => {
            try {
                const data = JSON.parse(jsonStr);
                const errors = [];
                
                if (!data.version) errors.push('Missing version');
                if (!data.data) errors.push('Missing data');
                if (data.data && !data.data.recipes) errors.push('Missing recipes');
                
                return { valid: errors.length === 0, errors, data };
            } catch (e) {
                return { valid: false, errors: ['Invalid JSON: ' + e.message] };
            }
        };
        
        const validation = validateImport(exportJson);
        assert.isTrue(validation.valid);
        assert.lengthOf(validation.errors, 0);
        
        // Step 3: Import data
        const importedData = validation.data.data;
        
        assert.lengthOf(importedData.recipes, 2);
        assert.lengthOf(importedData.cookbooks, 1);
        assert.isTrue(importedData.settings.darkMode);
        
        // Step 4: Merge with existing data
        const existingRecipes = [
            { id: 'existing1', title: 'Eksisterende oppskrift' }
        ];
        
        const mergedRecipes = [...existingRecipes];
        
        importedData.recipes.forEach(recipe => {
            const exists = mergedRecipes.some(r => r.id === recipe.id);
            if (!exists) {
                mergedRecipes.push({
                    ...recipe,
                    id: 'imported_' + recipe.id, // Rename to avoid conflicts
                    importedAt: new Date()
                });
            }
        });
        
        assert.lengthOf(mergedRecipes, 3, 'Should have merged recipes');
        
        console.log('✅ Data export/import flow complete');
    });
});

// ===== ERROR RECOVERY SCENARIO =====
e2eSuite.describe('Error Recovery Scenarios', () => {

    e2eSuite.test('Handle network failure gracefully', async () => {
        const storage = mockLocalStorage();
        let isOnline = true;
        
        const pendingOperations = [];
        
        const saveWithRetry = async (data, type) => {
            if (!isOnline) {
                // Queue for later
                pendingOperations.push({ data, type, timestamp: Date.now() });
                storage.setItem('pendingOperations', JSON.stringify(pendingOperations));
                return { queued: true, message: 'Lagret lokalt for synkronisering' };
            }
            
            // Simulate save
            return { success: true };
        };
        
        const processPendingOperations = async () => {
            if (!isOnline) return { processed: 0 };
            
            const pending = JSON.parse(storage.getItem('pendingOperations') || '[]');
            let processed = 0;
            
            for (const op of pending) {
                // Process each operation
                processed++;
            }
            
            storage.removeItem('pendingOperations');
            return { processed };
        };
        
        // Test offline scenario
        isOnline = false;
        
        const result1 = await saveWithRetry({ title: 'Test' }, 'recipe');
        assert.isTrue(result1.queued);
        
        const result2 = await saveWithRetry({ name: 'Book' }, 'cookbook');
        assert.isTrue(result2.queued);
        
        assert.lengthOf(pendingOperations, 2);
        
        // Come back online
        isOnline = true;
        
        const processResult = await processPendingOperations();
        assert.equal(processResult.processed, 2);
        
        console.log('✅ Error recovery scenario complete');
    });

    e2eSuite.test('Handle corrupted localStorage', () => {
        const storage = mockLocalStorage();
        
        const loadSettingsSafe = () => {
            const defaults = {
                darkMode: false,
                fontSize: 'normal',
                gamificationEnabled: false
            };
            
            try {
                const saved = storage.getItem('settings');
                if (!saved) return defaults;
                
                const parsed = JSON.parse(saved);
                return { ...defaults, ...parsed };
            } catch (e) {
                console.error('Corrupted settings, using defaults');
                storage.removeItem('settings');
                return defaults;
            }
        };
        
        // Test with corrupted data
        storage.setItem('settings', 'not valid json {{{');
        
        const settings = loadSettingsSafe();
        assert.isFalse(settings.darkMode);
        assert.equal(settings.fontSize, 'normal');
        
        console.log('✅ Corrupted data handling complete');
    });
});

// ===== TIMER SCENARIO =====
e2eSuite.describe('Timer Complete Flow', () => {

    e2eSuite.test('Multi-timer cooking scenario', async () => {
        const timers = [];
        let completedTimers = [];
        
        const createTimer = (name, seconds) => {
            const timer = {
                id: `timer-${Date.now()}-${Math.random()}`,
                name,
                totalSeconds: seconds,
                remainingSeconds: seconds,
                isRunning: false,
                createdAt: new Date()
            };
            timers.push(timer);
            return timer;
        };
        
        const startTimer = (timerId) => {
            const timer = timers.find(t => t.id === timerId);
            if (!timer) return false;
            timer.isRunning = true;
            timer.startedAt = Date.now();
            return true;
        };
        
        const tickAll = (elapsedSeconds) => {
            timers.forEach(timer => {
                if (timer.isRunning && timer.remainingSeconds > 0) {
                    timer.remainingSeconds = Math.max(0, timer.remainingSeconds - elapsedSeconds);
                    
                    if (timer.remainingSeconds === 0) {
                        timer.isRunning = false;
                        completedTimers.push(timer);
                    }
                }
            });
        };
        
        // Create timers for cooking scenario
        const pastaTimer = createTimer('Pasta', 600); // 10 minutes
        const sauceTimer = createTimer('Saus', 900); // 15 minutes
        const garlicBreadTimer = createTimer('Hvitløksbrød', 300); // 5 minutes
        
        // Start all timers
        startTimer(pastaTimer.id);
        startTimer(sauceTimer.id);
        startTimer(garlicBreadTimer.id);
        
        assert.lengthOf(timers, 3);
        assert.isTrue(pastaTimer.isRunning);
        
        // Simulate 5 minutes passing
        tickAll(300);
        
        assert.equal(garlicBreadTimer.remainingSeconds, 0);
        assert.lengthOf(completedTimers, 1);
        assert.equal(completedTimers[0].name, 'Hvitløksbrød');
        
        // Simulate another 5 minutes
        tickAll(300);
        
        assert.equal(pastaTimer.remainingSeconds, 0);
        assert.lengthOf(completedTimers, 2);
        
        // Simulate final 5 minutes
        tickAll(300);
        
        assert.equal(sauceTimer.remainingSeconds, 0);
        assert.lengthOf(completedTimers, 3);
        
        console.log('✅ Multi-timer scenario complete');
    });
});

// Eksporter for bruk
if (typeof module !== 'undefined' && module.exports) {
    module.exports = e2eSuite;
}

if (typeof window !== 'undefined') {
    window.e2eTestSuite = e2eSuite;
}
