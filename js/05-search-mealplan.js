// ===== V3.0 NEW FEATURES =====

// ===== NORWEGIAN TO ENGLISH TRANSLATION FOR SEARCH =====
const norwegianToEnglish = {
    // Common Norwegian food terms - Proteins
    'kylling': 'chicken', 'kyllingbryst': 'chicken breast', 'kyllinglår': 'chicken thigh',
    'biff': 'beef', 'oksekjøtt': 'beef', 'oksefilet': 'beef fillet', 'entrecote': 'ribeye',
    'svinekjøtt': 'pork', 'svin': 'pork', 'svinekoteletter': 'pork chops', 'ribbe': 'pork ribs',
    'lam': 'lamb', 'lammekoteletter': 'lamb chops', 'lammeskank': 'lamb shank',
    'fisk': 'fish', 'laks': 'salmon', 'torsk': 'cod', 'sei': 'pollock', 'hyse': 'haddock',
    'kveite': 'halibut', 'ørret': 'trout', 'makrell': 'mackerel', 'tunfisk': 'tuna',
    'reker': 'shrimp', 'krabbe': 'crab', 'hummer': 'lobster', 'blåskjell': 'mussels',
    'kjøttdeig': 'ground beef', 'kjøttkaker': 'meatballs', 'bacon': 'bacon',
    'pølse': 'sausage', 'skinke': 'ham', 'kalkun': 'turkey', 'and': 'duck',
    
    // Pasta and Carbs
    'pasta': 'pasta', 'spaghetti': 'spaghetti', 'penne': 'penne', 'rigatoni': 'rigatoni',
    'ris': 'rice', 'langkornet ris': 'long grain rice', 'jasminris': 'jasmine rice',
    'nudler': 'noodles', 'pizza': 'pizza', 'brød': 'bread', 'focaccia': 'focaccia',
    'gnocchi': 'gnocchi', 'ravioli': 'ravioli', 'tortellini': 'tortellini',
    
    // Soups and Stews
    'suppe': 'soup', 'gryte': 'stew', 'lapskaus': 'stew', 'gryterett': 'casserole',
    'fiskesuppe': 'fish soup', 'tomatsuppe': 'tomato soup', 'løksuppe': 'onion soup',
    
    // Desserts and Sweets
    'kake': 'cake', 'sjokoladekake': 'chocolate cake', 'ostekake': 'cheesecake',
    'dessert': 'dessert', 'is': 'ice cream', 'pudding': 'pudding', 'mousse': 'mousse',
    'bolle': 'bun', 'kanelbolle': 'cinnamon roll', 'kringle': 'pastry',
    'kjeks': 'cookie', 'småkaker': 'cookies', 'brownies': 'brownies',
    'vafler': 'waffles', 'vaffel': 'waffle', 'pannekaker': 'pancakes', 'pannekake': 'pancake',
    'pai': 'pie', 'eplepai': 'apple pie', 'terte': 'tart', 'crumble': 'crumble',
    'sukker': 'sugar', 'sjokolade': 'chocolate', 'karamell': 'caramel',
    
    // Fruits
    'banan': 'banana', 'eple': 'apple', 'appelsin': 'orange', 'sitron': 'lemon',
    'lime': 'lime', 'jordbær': 'strawberry', 'bringebær': 'raspberry',
    'blåbær': 'blueberry', 'multer': 'cloudberry', 'kirsebær': 'cherry',
    'druer': 'grapes', 'melon': 'melon', 'vannmelon': 'watermelon', 'pære': 'pear',
    'plomme': 'plum', 'aprikos': 'apricot', 'fersken': 'peach', 'mango': 'mango',
    'ananas': 'pineapple', 'kiwi': 'kiwi', 'avokado': 'avocado',
    
    // Vegetables
    'tomat': 'tomato', 'potet': 'potato', 'gulrot': 'carrot', 'løk': 'onion',
    'hvitløk': 'garlic', 'sopp': 'mushroom', 'paprika': 'pepper', 'chili': 'chili',
    'brokkoli': 'broccoli', 'blomkål': 'cauliflower', 'spinat': 'spinach',
    'salat': 'salad', 'isbergsalat': 'iceberg lettuce', 'ruccola': 'arugula',
    'agurk': 'cucumber', 'squash': 'zucchini', 'aubergine': 'eggplant',
    'kål': 'cabbage', 'rødkål': 'red cabbage', 'grønnkål': 'kale',
    'bønner': 'beans', 'erter': 'peas', 'mais': 'corn', 'linser': 'lentils',
    'purre': 'leek', 'selleri': 'celery', 'fennikel': 'fennel',
    'rødbete': 'beet', 'kålrot': 'rutabaga', 'nepe': 'turnip',
    'asparges': 'asparagus', 'artisjokk': 'artichoke', 'reddik': 'radish',
    
    // Dairy
    'ost': 'cheese', 'mozzarella': 'mozzarella', 'parmesan': 'parmesan',
    'feta': 'feta', 'cheddar': 'cheddar', 'brie': 'brie',
    'egg': 'egg', 'smør': 'butter', 'melk': 'milk', 'fløte': 'cream',
    'rømme': 'sour cream', 'yoghurt': 'yogurt', 'kesam': 'quark',
    
    // Meals and Dishes
    'frokost': 'breakfast', 'middag': 'dinner', 'lunsj': 'lunch',
    'forrett': 'appetizer', 'hovedrett': 'main course', 'tilbehør': 'side dish',
    'aperitiff': 'appetizer', 'snacks': 'snacks',
    
    // Diets
    'vegetar': 'vegetarian', 'vegan': 'vegan', 'glutenfri': 'gluten free',
    'sunn': 'healthy', 'lavkarbo': 'low carb', 'keto': 'keto',
    
    // Cooking styles
    'enkel': 'easy', 'rask': 'quick', 'tradisjonell': 'traditional',
    'festmat': 'party food', 'hverdagsmat': 'everyday food',
    
    // Cuisines
    'italiensk': 'italian', 'meksikansk': 'mexican', 'indisk': 'indian',
    'thai': 'thai', 'kinesisk': 'chinese', 'japansk': 'japanese',
    'gresk': 'greek', 'spansk': 'spanish', 'fransk': 'french',
    'norsk': 'norwegian', 'skandinavisk': 'scandinavian', 'amerikanisirk': 'american',
    'asiatisk': 'asian', 'middelhavet': 'mediterranean', 'marokkansk': 'moroccan',
    
    // Specific dishes
    'burger': 'burger', 'taco': 'taco', 'wrap': 'wrap', 'sandwich': 'sandwich',
    'lasagne': 'lasagne', 'carbonara': 'carbonara', 'bolognese': 'bolognese',
    'curry': 'curry', 'wok': 'stir fry', 'risotto': 'risotto', 'paella': 'paella',
    'sushi': 'sushi', 'ramen': 'ramen', 'pho': 'pho', 'fajitas': 'fajitas',
    'enchiladas': 'enchiladas', 'quesadilla': 'quesadilla', 'nachos': 'nachos',
    'tikka masala': 'tikka masala', 'butter chicken': 'butter chicken',
    'pad thai': 'pad thai', 'sweet and sour': 'sweet and sour',
    'teriyaki': 'teriyaki', 'satay': 'satay',
    
    // Cooking methods
    'grillet': 'grilled', 'stekt': 'fried', 'bakt': 'baked', 'kokt': 'boiled',
    'ovnsbakt': 'roasted', 'dampet': 'steamed', 'wokket': 'stir fried',
    'marinert': 'marinated', 'røkt': 'smoked', 'syltet': 'pickled',
    
    // Norwegian Traditional
    'fårikål': 'lamb stew', 'kjøttkaker': 'meatballs', 'fiskekaker': 'fish cakes',
    'fiskeboller': 'fish balls', 'pinnekjøtt': 'dried lamb ribs', 'lutefisk': 'lutefisk',
    'raspeballer': 'potato dumplings', 'komle': 'potato dumplings', 'klubb': 'potato dumplings',
    'rømmegrøt': 'sour cream porridge', 'risengryn': 'rice pudding', 'risgrøt': 'rice porridge',
    'lefse': 'lefse', 'lompe': 'potato flatbread', 'flatbrød': 'flatbread',
    'krumkake': 'waffle cookie', 'fattigmann': 'traditional cookie', 'berlinerbolle': 'donut',
    'skillingsbolle': 'cinnamon bun', 'skolebolle': 'custard bun'
};

function translateToEnglish(query) {
    let translated = query.toLowerCase().trim();
    
    // Check for direct translation
    if (norwegianToEnglish[translated]) {
        return norwegianToEnglish[translated];
    }
    
    // Check for partial matches - replace all matching words
    let words = translated.split(/\s+/);
    let translatedWords = words.map(word => {
        // Try exact match first
        if (norwegianToEnglish[word]) {
            return norwegianToEnglish[word];
        }
        // Try partial match
        for (const [no, en] of Object.entries(norwegianToEnglish)) {
            if (word.includes(no) && word.length - no.length < 3) {
                return en;
            }
        }
        return word;
    });
    
    translated = translatedWords.join(' ');
    
    // Also do a full-text partial match replacement for compound words
    for (const [no, en] of Object.entries(norwegianToEnglish)) {
        if (translated.includes(no) && translated !== en) {
            translated = translated.replace(new RegExp(no, 'g'), en);
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
    const existingTexts = state.shoppingList
        .map(item => getItemName(item).toLowerCase())
        .filter(name => name);
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

