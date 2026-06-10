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
                ${recipe.images.map((img, i) => {
                    const rotation = recipe.imageRotations?.[i] || 0;
                    return `<img src="${img}" class="gallery-image" data-index="${i}" style="transform: rotate(${rotation}deg)" alt="Oppskriftsbilde ${i + 1}">`;
                }).join('')}
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
            openImageViewer(recipe.images, parseInt(img.dataset.index), recipe.imageRotations, recipe.id);
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
            state.shoppingList.push({ text: trimmed, checked: false, addedAt: new Date() });
            added++;
        }
    }
    
    if (added > 0) {
        state.shoppingList = normalizeShoppingListItems(state.shoppingList);
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
            const tentativeImages = [...state.tempImages, compressed];
            if (getTotalImageBytes(tentativeImages) > MAX_RECIPE_IMAGE_BYTES) {
                const smaller = await compressImage(file, 1200, 1200, 0.7);
                const smallerTentative = [...state.tempImages, smaller];
                if (getTotalImageBytes(smallerTentative) > MAX_RECIPE_IMAGE_BYTES) {
                    showToast('Bildene er for store til å lagres. Fjern noen eller bruk mindre bilder.', 'error');
                    continue;
                }
                state.tempImages.push(smaller);
            } else {
                state.tempImages.push(compressed);
            }
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

    if (getTotalImageBytes(recipe.images) > MAX_RECIPE_IMAGE_BYTES) {
        showToast('Bildene er for store til å lagres. Fjern noen eller bruk mindre bilder.', 'error');
        return;
    }
    
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
    if (!state.friends || state.friends.length === 0) {
        await loadSocialData();
    }
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
window.shareRecipe = shareRecipe;

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

