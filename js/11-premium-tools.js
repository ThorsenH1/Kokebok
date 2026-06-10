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
    // ingredients kan være streng (flerlinjet) eller array – normaliser til linjer
    const lines = getIngredientsAsString(ingredients).split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
        return { level: 'unknown', score: 0, warnings: [] };
    }

    const warnings = [];
    let maxScore = 1;

    const ingredientText = lines.join(' ').toLowerCase();
    
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
    if (lines.length > 15) {
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
    // Ingrediensene lagres som flerlinjet tekst – del opp i linjer
    // (tidligere ble strengen iterert tegn for tegn, som ga meningsløse priser)
    const ingredientLines = getIngredientLines(recipe);
    if (ingredientLines.length === 0) {
        showToast('Ingen ingredienser å sammenligne', 'warning');
        return;
    }

    // Calculate total estimated cost
    let totalEstimate = 0;
    const priceDetails = [];

    for (const name of ingredientLines) {
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

    lastBudgetWeekPlan = weekPlan;
}
window.generateBudgetMealPlan = generateBudgetMealPlan;

// Siste genererte budsjettplan – brukes av "Legg til i ukesplanen"-knappen
let lastBudgetWeekPlan = null;

function applyBudgetPlanToWeek() {
    if (!lastBudgetWeekPlan || lastBudgetWeekPlan.length === 0) {
        showToast('Generer en budsjettplan først', 'warning');
        return;
    }

    // Finn mandag i inneværende uke og legg planen inn dag for dag
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);

    lastBudgetWeekPlan.forEach((day, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        const recipe = state.recipes.find(r => r.name === day.recipe);
        const ingredients = recipe
            ? getIngredientsAsString(recipe.ingredients).split('\n').filter(l => l.trim())
            : [];
        state.mealPlan[dateKey] = { name: day.recipe, ingredients };
    });

    saveMealPlan();
    updatePlannedMealsCount();
    closeGenericModal();
    showToast('📅 Budsjettplanen er lagt inn i ukemenyen!', 'success');
}
window.applyBudgetPlanToWeek = applyBudgetPlanToWeek;

// Hent ingredienslinjene fra en oppskrift (ingredients kan være streng eller array)
function getIngredientLines(recipe) {
    return getIngredientsAsString(recipe?.ingredients)
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);
}

function estimateRecipeCost(recipe) {
    const lines = getIngredientLines(recipe);
    if (lines.length === 0) return 50;

    let total = 0;
    for (const line of lines) {
        const estimate = estimateIngredientPrice(line);
        total += estimate.price * 0.3; // antar at ca. 30 % av pakken brukes
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
                                <span class="item-name">${escapeHtml(getItemName(item))}</span>
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
        const name = getItemName(item);
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

