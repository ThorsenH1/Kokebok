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
    // Only add XP if gamification is enabled
    if (!state.settings.gamificationEnabled) return;
    
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
    // Only unlock achievements if gamification is enabled
    if (!state.settings.gamificationEnabled) return;
    
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

