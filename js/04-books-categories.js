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
            <button class="book-action-btn" id="shareBookBtn">
                <span>📚</span> Del kokebok
            </button>
            <button class="book-action-btn" id="exportBookActionBtn">
                <span>📄</span> Eksporter
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

    // Share book button
    on($('shareBookBtn'), 'click', () => {
        shareBookWithFriends();
    });

    // Export book file button
    on($('exportBookActionBtn'), 'click', () => {
        exportBookFile();
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

// Export cookbook as shareable JSON file
function exportBookFile() {
    if (!state.currentBook) return;
    
    const book = state.currentBook;
    const recipes = state.recipes.filter(r => r.bookId === book.id);
    
    const exportData = {
        type: 'kokebok-book',
        version: 1,
        exportedAt: new Date().toISOString(),
        book: {
            name: book.name,
            description: book.description || '',
            owner: book.owner || '',
            year: book.year || '',
            coverImage: book.coverImage || ''
        },
        recipes: recipes.map(r => ({
            name: r.name,
            category: r.category,
            ingredients: r.ingredients,
            instructions: r.instructions,
            servings: r.servings,
            prepTime: r.prepTime,
            cookTime: r.cookTime,
            notes: r.notes,
            tags: r.tags,
            images: r.images || []
        }))
    };
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.name.replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, '_')}.kokebok.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Kokebok eksportert som fil', 'success');
}
window.exportBookFile = exportBookFile;

// Import cookbook from file
async function handleBookFileImport(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data?.type !== 'kokebok-book' || !data.book) {
            showToast('Ugyldig kokebokfil', 'error');
            return;
        }
        
        const importedBook = {
            name: `${data.book.name} (importert)`,
            description: data.book.description || '',
            owner: data.book.owner || '',
            year: data.book.year || '',
            coverImage: data.book.coverImage || '',
            importedAt: new Date().toISOString()
        };
        
        const bookId = await saveToFirestore('books', null, importedBook);
        state.books.push({ id: bookId, ...importedBook });
        
        const recipes = Array.isArray(data.recipes) ? data.recipes : [];
        for (const r of recipes) {
            const newRecipe = {
                name: r.name,
                category: r.category || 'annet',
                ingredients: r.ingredients || '',
                instructions: r.instructions || '',
                servings: r.servings || '',
                prepTime: r.prepTime || '',
                cookTime: r.cookTime || '',
                notes: r.notes || '',
                tags: r.tags || '',
                images: r.images || [],
                bookId: bookId,
                importedAt: new Date().toISOString()
            };
            const recipeId = await saveToFirestore('recipes', null, newRecipe);
            state.recipes.push({ id: recipeId, ...newRecipe });
        }
        
        showToast(`📚 Kokebok importert (${recipes.length} oppskrifter)`, 'success');
        renderBookList();
        
    } catch (e) {
        console.error('Import cookbook error:', e);
        showToast('Kunne ikke importere kokebok', 'error');
    } finally {
        if (event?.target) event.target.value = '';
    }
}
window.handleBookFileImport = handleBookFileImport;

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
let viewerImageRotations = [];
let viewerImageRecipeId = null;

function openImageViewer(images, startIndex = 0, rotations = null, recipeId = null) {
    viewerImages = images;
    viewerIndex = startIndex;
    viewerImageRotations = Array.isArray(rotations) ? rotations : [];
    viewerImageRecipeId = recipeId || null;
    
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
    const imageEl = $('viewerImage');
    if (!imageEl) return;
    imageEl.src = viewerImages[viewerIndex];
    $('viewerCaption').textContent = `${viewerIndex + 1} / ${viewerImages.length}`;

    const rotation = viewerImageRotations[viewerIndex] || 0;
    currentImageRotation = rotation;
    currentImageScale = 1;
    translateX = 0;
    translateY = 0;
    updateImageTransform();
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
    const container = $('modalContainer');
    if (container) container.classList.add('hidden');
    // Mange knapper bruker closeModal og closeGenericModal om hverandre –
    // lukk begge slik at "Avbryt"/"Lukk" alltid fungerer.
    if (typeof closeGenericModal === 'function') closeGenericModal();
}

function showAddMenu() {
    // Vis modal for å velge oppskrift eller bok
    openRecipeEditor();
}

