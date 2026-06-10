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
    
    const existing = state.shoppingList.find(i => getItemName(i).toLowerCase() === item.toLowerCase());
    
    if (!existing) {
        state.shoppingList.push({ text: item, checked: false, addedAt: Date.now() });
        state.shoppingList = normalizeShoppingListItems(state.shoppingList);
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
                    <button class="btn btn-secondary btn-small" onclick="searchRecipesByIngredients(${JSON.stringify(expiringSoon.map(i => i.name))})">
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

function searchRecipesByIngredients(ingredients) {
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
window.searchRecipesByIngredients = searchRecipesByIngredients;

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

// ===== WEEKLY BACKUP SYSTEM =====
const BACKUP_INTERVAL_DAYS = 7;
const BACKUP_KEY = 'kokebok_last_backup';
const MAX_LOCAL_BACKUPS = 4; // Keep last 4 backups (1 month)

async function checkAndPerformWeeklyBackup() {
    if (!state.user) return;
    
    const lastBackup = localStorage.getItem(BACKUP_KEY);
    const now = Date.now();
    const weekInMs = BACKUP_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
    
    if (!lastBackup || (now - parseInt(lastBackup)) > weekInMs) {
        console.log('📦 Ukentlig backup påkrevd...');
        await performAutomaticBackup();
    }
}

async function performAutomaticBackup() {
    try {
        const backupData = {
            version: APP_VERSION,
            backupDate: new Date().toISOString(),
            userId: state.user.uid,
            categories: state.categories,
            recipes: state.recipes.map(r => ({
                ...r,
                // Convert Firestore timestamps to ISO strings
                createdAt: r.createdAt?.toDate?.()?.toISOString() || r.createdAt,
                updatedAt: r.updatedAt?.toDate?.()?.toISOString() || r.updatedAt
            })),
            books: state.books.map(b => ({
                ...b,
                createdAt: b.createdAt?.toDate?.()?.toISOString() || b.createdAt,
                updatedAt: b.updatedAt?.toDate?.()?.toISOString() || b.updatedAt
            })),
            settings: state.settings,
            favorites: state.favorites,
            mealPlan: state.mealPlan,
            equipment: state.equipment || [],
            pantryItems: state.pantryItems || []
        };
        
        // Store backup locally with IndexedDB for persistence
        await saveBackupToIndexedDB(backupData);
        
        // Also store in localStorage as fallback (smaller version)
        saveBackupToLocalStorage(backupData);
        
        // Update last backup time
        localStorage.setItem(BACKUP_KEY, Date.now().toString());
        
        console.log('✅ Ukentlig backup fullført!');
        console.log(`   📊 ${state.recipes.length} oppskrifter, ${state.books.length} bøker sikret`);
        
        // Show subtle notification
        if (Notification.permission === 'granted') {
            new Notification('🔒 Backup fullført', {
                body: `${state.recipes.length} oppskrifter sikret automatisk`,
                icon: './icons/icon-192.svg',
                tag: 'backup-notification'
            });
        }
        
        return true;
    } catch (error) {
        console.error('Backup feilet:', error);
        return false;
    }
}

// IndexedDB backup storage for larger data
async function saveBackupToIndexedDB(backupData) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('KokebokBackups', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('backups')) {
                const store = db.createObjectStore('backups', { keyPath: 'id', autoIncrement: true });
                store.createIndex('backupDate', 'backupDate', { unique: false });
            }
        };
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['backups'], 'readwrite');
            const store = transaction.objectStore('backups');
            
            // Add new backup
            const addRequest = store.add(backupData);
            
            addRequest.onsuccess = () => {
                // Clean up old backups (keep only last MAX_LOCAL_BACKUPS)
                const countRequest = store.count();
                countRequest.onsuccess = () => {
                    const count = countRequest.result;
                    if (count > MAX_LOCAL_BACKUPS) {
                        const deleteCount = count - MAX_LOCAL_BACKUPS;
                        const cursorRequest = store.openCursor();
                        let deleted = 0;
                        cursorRequest.onsuccess = (e) => {
                            const cursor = e.target.result;
                            if (cursor && deleted < deleteCount) {
                                store.delete(cursor.primaryKey);
                                deleted++;
                                cursor.continue();
                            }
                        };
                    }
                };
                resolve();
            };
            
            addRequest.onerror = () => reject(addRequest.error);
        };
    });
}

// Fallback: localStorage backup (compressed, limited data)
function saveBackupToLocalStorage(backupData) {
    try {
        // Get existing backups
        const backups = JSON.parse(localStorage.getItem('kokebok_backups') || '[]');
        
        // Create a smaller version without images for localStorage
        const smallBackup = {
            ...backupData,
            recipes: backupData.recipes.map(r => ({
                ...r,
                images: r.images ? [`[${r.images.length} bilder]`] : [] // Don't store actual image data
            }))
        };
        
        // Add new backup
        backups.push(smallBackup);
        
        // Keep only last MAX_LOCAL_BACKUPS
        while (backups.length > MAX_LOCAL_BACKUPS) {
            backups.shift();
        }
        
        localStorage.setItem('kokebok_backups', JSON.stringify(backups));
    } catch (e) {
        console.warn('LocalStorage backup feilet (muligens for store data):', e);
    }
}

// Restore from backup
async function showRestoreBackupOptions() {
    const backups = await getAllBackups();
    
    if (backups.length === 0) {
        showToast('Ingen backups funnet', 'warning');
        return;
    }
    
    const html = `
        <div class="backup-list">
            <p>Velg en backup å gjenopprette fra:</p>
            ${backups.map((backup, i) => `
                <div class="backup-item">
                    <div class="backup-info">
                        <strong>${new Date(backup.backupDate).toLocaleDateString('no-NO')}</strong>
                        <span>${backup.recipes?.length || 0} oppskrifter, ${backup.books?.length || 0} bøker</span>
                    </div>
                    <button class="btn btn-small" onclick="restoreFromBackup(${i})">Gjenopprett</button>
                </div>
            `).join('')}
            <p class="backup-warning">⚠️ Gjenoppretting vil erstatte alle nåværende data!</p>
        </div>
    `;
    
    showModal('🔄 Gjenopprett fra backup', html, []);
}
window.showRestoreBackupOptions = showRestoreBackupOptions;

async function getAllBackups() {
    const backups = [];
    
    // Get from IndexedDB
    try {
        const idbBackups = await getBackupsFromIndexedDB();
        backups.push(...idbBackups);
    } catch (e) {
        console.warn('Kunne ikke hente IndexedDB backups:', e);
    }
    
    // Get from localStorage as fallback
    try {
        const lsBackups = JSON.parse(localStorage.getItem('kokebok_backups') || '[]');
        // Add only if not duplicate (based on date)
        for (const b of lsBackups) {
            if (!backups.some(existing => existing.backupDate === b.backupDate)) {
                backups.push(b);
            }
        }
    } catch (e) {
        console.warn('Kunne ikke hente localStorage backups:', e);
    }
    
    // Sort by date, newest first
    backups.sort((a, b) => new Date(b.backupDate) - new Date(a.backupDate));
    
    return backups;
}

async function getBackupsFromIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('KokebokBackups', 1);
        request.onerror = () => resolve([]);
        request.onsuccess = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('backups')) {
                resolve([]);
                return;
            }
            const transaction = db.transaction(['backups'], 'readonly');
            const store = transaction.objectStore('backups');
            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
            getAllRequest.onerror = () => resolve([]);
        };
    });
}

async function restoreFromBackup(backupIndex) {
    const backups = await getAllBackups();
    const backup = backups[backupIndex];
    
    if (!backup) {
        showToast('Backup ikke funnet', 'error');
        return;
    }
    
    if (!confirm('Er du sikker på at du vil gjenopprette? Alle nåværende data vil bli erstattet.')) {
        return;
    }
    
    try {
        // Restore to Firestore
        for (const recipe of backup.recipes || []) {
            await saveToFirestore('recipes', recipe.id, recipe);
        }
        
        for (const book of backup.books || []) {
            await saveToFirestore('books', book.id, book);
        }
        
        for (const cat of backup.categories || []) {
            await saveToFirestore('categories', cat.id, cat);
        }
        
        // Update local state
        state.recipes = backup.recipes || [];
        state.books = backup.books || [];
        state.categories = backup.categories || [];
        state.settings = backup.settings || state.settings;
        
        closeGenericModal();
        showToast('🔄 Data gjenopprettet!', 'success');
        renderDashboard();
        
    } catch (error) {
        console.error('Gjenoppretting feilet:', error);
        showToast('Kunne ikke gjenopprette data', 'error');
    }
}
window.restoreFromBackup = restoreFromBackup;

// Manual backup trigger
async function createManualBackup() {
    showToast('Oppretter backup...', 'info');
    const success = await performAutomaticBackup();
    if (success) {
        showToast('✅ Backup opprettet!', 'success');
    } else {
        showToast('❌ Backup feilet', 'error');
    }
}
window.createManualBackup = createManualBackup;

// Check for backup on app load
setTimeout(() => {
    if (state.user) {
        checkAndPerformWeeklyBackup();
    }
}, 5000);

// ===== IMAGE VIEWER ENHANCEMENTS =====
let currentImageRotation = 0;
let currentImageScale = 1;
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;

function setupEnhancedImageViewer() {
    const viewer = $('imageViewer');
    const img = $('viewerImage');
    if (!viewer || !img) return;
    
    // Pinch to zoom support for touch devices
    let initialDistance = 0;
    let initialScale = 1;
    
    img.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            initialDistance = getDistance(e.touches);
            initialScale = currentImageScale;
        } else if (e.touches.length === 1) {
            isDragging = true;
            startX = e.touches[0].clientX - translateX;
            startY = e.touches[0].clientY - translateY;
        }
    });
    
    img.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const distance = getDistance(e.touches);
            const scale = (distance / initialDistance) * initialScale;
            currentImageScale = Math.min(Math.max(scale, 0.5), 5);
            updateImageTransform();
        } else if (e.touches.length === 1 && isDragging && currentImageScale > 1) {
            e.preventDefault();
            translateX = e.touches[0].clientX - startX;
            translateY = e.touches[0].clientY - startY;
            updateImageTransform();
        }
    });
    
    img.addEventListener('touchend', () => {
        isDragging = false;
    });
    
    // Mouse wheel zoom for desktop
    img.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        currentImageScale = Math.min(Math.max(currentImageScale + delta, 0.5), 5);
        updateImageTransform();
    });
    
    // Double-tap/click to reset
    img.addEventListener('dblclick', resetImageView);
    
    let lastTap = 0;
    img.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTap < 300 && e.touches.length === 0) {
            resetImageView();
        }
        lastTap = now;
    });
    
    // Mouse drag for desktop
    img.addEventListener('mousedown', (e) => {
        if (currentImageScale > 1) {
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            img.style.cursor = 'grabbing';
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging && currentImageScale > 1) {
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateImageTransform();
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        if (img) img.style.cursor = currentImageScale > 1 ? 'grab' : 'zoom-in';
    });
}

function getDistance(touches) {
    return Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
    );
}

function updateImageTransform() {
    const img = $('viewerImage');
    if (!img) return;
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentImageScale}) rotate(${currentImageRotation}deg)`;
    img.style.cursor = currentImageScale > 1 ? 'grab' : 'zoom-in';
}

function rotateImage(degrees) {
    currentImageRotation = (currentImageRotation + degrees) % 360;
    if (currentImageRotation < 0) currentImageRotation += 360;
    updateImageTransform();
    persistCurrentImageRotation();
}
window.rotateImage = rotateImage;

async function persistCurrentImageRotation() {
    if (!viewerImageRecipeId || !state.currentRecipe || state.currentRecipe.id !== viewerImageRecipeId) return;

    const rotations = Array.isArray(state.currentRecipe.imageRotations)
        ? [...state.currentRecipe.imageRotations]
        : [];

    while (rotations.length < viewerImages.length) {
        rotations.push(0);
    }

    rotations[viewerIndex] = currentImageRotation;
    state.currentRecipe.imageRotations = rotations;

    // Keep viewer state in sync when navigating images
    if (Array.isArray(viewerImageRotations)) {
        while (viewerImageRotations.length < viewerImages.length) viewerImageRotations.push(0);
        viewerImageRotations[viewerIndex] = currentImageRotation;
    }

    // Ensure the recipe in the master list also gets updated (so it persists on recipe page)
    const recipeIndex = state.recipes?.findIndex(r => r.id === viewerImageRecipeId) ?? -1;
    if (recipeIndex >= 0) {
        state.recipes[recipeIndex].imageRotations = rotations;
    }

    const galleryImg = document.querySelector(`.gallery-image[data-index="${viewerIndex}"]`);
    if (galleryImg) {
        galleryImg.style.transform = `rotate(${currentImageRotation}deg)`;
    }

    try {
        await saveToFirestore('recipes', viewerImageRecipeId, { imageRotations: rotations });
    } catch (e) {
        console.warn('Kunne ikke lagre bilde-rotasjon:', e.message);
    }
}

function zoomImage(factor) {
    currentImageScale = Math.min(Math.max(currentImageScale * factor, 0.5), 5);
    updateImageTransform();
}
window.zoomImage = zoomImage;

function resetImageView() {
    currentImageRotation = 0;
    currentImageScale = 1;
    translateX = 0;
    translateY = 0;
    updateImageTransform();
}
window.resetImageView = resetImageView;

// Override original openImageViewer to reset transform state
const originalOpenImageViewer = typeof openImageViewer === 'function' ? openImageViewer : null;
function enhancedOpenImageViewer(images, startIndex = 0, rotations = null, recipeId = null) {
    resetImageView();
    viewerImages = images;
    viewerIndex = startIndex;
    viewerImageRotations = Array.isArray(rotations) ? rotations : [];
    viewerImageRecipeId = recipeId || null;
    
    const viewer = $('imageViewer');
    viewer.classList.remove('hidden');
    updateViewerImage();
}
// Redefine if exists
if (originalOpenImageViewer) {
    window.openImageViewer = enhancedOpenImageViewer;
}

// Initialize enhanced image viewer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupEnhancedImageViewer();
});

// Show login troubleshooting after failed attempts
let loginAttempts = 0;
function showLoginTroubleshoot() {
    loginAttempts++;
    if (loginAttempts >= 1) {
        const troubleshoot = document.getElementById('loginTroubleshoot');
        if (troubleshoot) troubleshoot.style.display = 'block';
    }
}

console.log(`Familiens Kokebok v${APP_VERSION} – alle moduler lastet`);
