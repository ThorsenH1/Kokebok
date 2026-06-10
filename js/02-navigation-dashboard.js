// ===== Event Listeners =====
function setupEventListeners() {
    // Navigation
    $$('.nav-btn[data-view]').forEach(btn => {
        on(btn, 'click', () => {
            const view = btn.dataset.view;
            navigateTo(view);
        });
    });
    
    // Back buttons
    $$('.back-btn[data-view]').forEach(btn => {
        on(btn, 'click', () => navigateTo(btn.dataset.view));
    });
    
    // Cancel edit buttons
    $$('.cancel-edit').forEach(btn => {
        on(btn, 'click', () => {
            state.editingRecipe = null;
            state.editingBook = null;
            state.tempImages = [];
            state.tempCoverImage = null;
            navigateTo(state.currentView === 'recipeEditorView' ? 'dashboardView' : 'bookListView');
        });
    });
    
    // Header buttons
    on('homeBtn', 'click', () => navigateTo('dashboardView'));
    on('profileBtn', 'click', () => navigateTo('settingsView'));
    on('menuBtn', 'click', () => toggleSideMenu(true));
    on('closeMenuBtn', 'click', () => toggleSideMenu(false));
    
    // Side menu overlay
    const menuOverlay = document.querySelector('.side-menu-overlay');
    if (menuOverlay) {
        on(menuOverlay, 'click', () => toggleSideMenu(false));
    }
    
    // Side menu items
    $$('.menu-item[data-view]').forEach(item => {
        on(item, 'click', () => {
            navigateTo(item.dataset.view);
            toggleSideMenu(false);
        });
    });
    
    // Quick actions - åpne oppskriftseditor direkte
    on('addRecipeBtn', 'click', () => openRecipeEditor());
    on('addBookBtn', 'click', () => openBookEditor());
    on('navAddBtn', 'click', () => showAddMenu());
    on('importBookBtn', 'click', () => $('importBookFileInput')?.click());
    on('importBookFileInput', 'change', handleBookFileImport);
    
    // New v3.0 Feature Buttons
    on('searchRecipesBtn', 'click', openRecipeSearch);
    on('mealPlannerBtn', 'click', openMealPlanner);
    on('shoppingListBtn', 'click', openShoppingList);
    on('timerBtn', 'click', openTimer);
    on('floatingTimerBtn', 'click', openTimer);
    
    // Side Menu Feature Items
    on('menuFavorites', 'click', () => { navigateTo('recipeListView'); filterFavorites(); toggleSideMenu(false); });
    on('menuSearch', 'click', () => { openRecipeSearch(); toggleSideMenu(false); });
    on('menuMealPlanner', 'click', () => { openMealPlanner(); toggleSideMenu(false); });
    on('menuShoppingList', 'click', () => { openShoppingList(); toggleSideMenu(false); });
    on('menuTimer', 'click', () => { openTimer(); toggleSideMenu(false); });
    on('menuLanguage', 'click', () => { openLanguageSelector(); toggleSideMenu(false); });
    
    // Dashboard buttons
    on('manageCategoriesBtn', 'click', () => navigateTo('categoriesView'));
    on('viewAllRecipesBtn', 'click', () => {
        state.filterCategory = '';
        navigateTo('recipeListView');
    });
    on('viewAllBooksBtn', 'click', () => navigateTo('bookListView'));
    
    // Search
    const searchInput = $('searchInput');
    if (searchInput) {
        on(searchInput, 'input', (e) => {
            state.searchQuery = e.target.value;
            const clearBtn = $('clearSearch');
            if (clearBtn) {
                clearBtn.classList.toggle('hidden', !state.searchQuery);
            }
            if (state.currentView === 'recipeListView') {
                renderRecipeList();
            } else if (state.currentView === 'dashboardView' && state.searchQuery.length >= 2) {
                // Navigate to recipe list when searching from dashboard
                navigateTo('recipeListView');
                renderRecipeList();
            }
        });
        
        // Also handle Enter key to search from dashboard
        on(searchInput, 'keypress', (e) => {
            if (e.key === 'Enter' && state.searchQuery) {
                navigateTo('recipeListView');
                renderRecipeList();
            }
        });
    }
    
    on('clearSearch', 'click', () => {
        const input = $('searchInput');
        if (input) {
            input.value = '';
            state.searchQuery = '';
            $('clearSearch').classList.add('hidden');
            if (state.currentView === 'recipeListView') {
                renderRecipeList();
            }
        }
    });
    
    // Filters
    on('categoryFilter', 'change', (e) => {
        state.filterCategory = e.target.value;
        renderRecipeList();
    });
    
    on('sortFilter', 'change', (e) => {
        state.sortOrder = e.target.value;
        renderRecipeList();
    });
    
    // Recipe editor
    on('saveRecipeBtn', 'click', saveRecipe);
    on('uploadImageBtn', 'click', () => $('imageInput').click());
    on('cameraBtn', 'click', () => $('cameraInput').click());
    on('imageInput', 'change', handleImageUpload);
    on('cameraInput', 'change', handleImageUpload);
    
    // Recipe view actions
    on('editRecipeBtn', 'click', () => {
        if (state.currentRecipe) {
            openRecipeEditor(state.currentRecipe);
        }
    });
    on('shareRecipeBtn', 'click', shareRecipe);
    on('deleteRecipeBtn', 'click', deleteCurrentRecipe);
    
    // Book editor
    on('saveBookBtn', 'click', saveBook);
    on('uploadBookCoverBtn', 'click', () => $('bookCoverInput').click());
    on('cameraBookCoverBtn', 'click', () => $('bookCameraInput').click());
    on('bookCoverInput', 'change', handleBookCoverUpload);
    on('bookCameraInput', 'change', handleBookCoverUpload);
    
    // Book view actions
    on('editBookBtn', 'click', () => {
        if (state.currentBook) {
            openBookEditor(state.currentBook);
        }
    });
    on('exportBookBtn', 'click', exportBook);
    on('deleteBookBtn', 'click', deleteCurrentBook);
    
    // Digital book reader
    on('prevPageBtn', 'click', () => navigateBookPage(-1));
    on('nextPageBtn', 'click', () => navigateBookPage(1));
    
    // Categories
    on('addCategoryBtn', 'click', showAddCategoryModal);
    
    // Settings
    on('darkModeToggle', 'change', (e) => {
        state.settings.darkMode = e.target.checked;
        document.body.classList.toggle('dark-mode', e.target.checked);
        saveSettings();
    });
    
    on('fontSizeSelect', 'change', (e) => {
        state.settings.fontSize = e.target.value;
        applySettings();
        saveSettings();
    });
    
    // Search language setting
    on('searchLanguageSelect', 'change', (e) => {
        state.settings.searchLanguage = e.target.value;
        localStorage.setItem('kokebok_search_language', e.target.value);
        saveSettings();
        showToast(`Søkespråk endret til ${e.target.value === 'no' ? 'Norsk' : e.target.value.toUpperCase()}`, 'success');
    });
    
    // Timer notifications
    on('timerNotificationsToggle', 'change', (e) => {
        state.settings.timerNotifications = e.target.checked;
        saveSettings();
    });
    
    // Meal reminders
    on('mealReminderToggle', 'change', (e) => {
        state.settings.mealReminders = e.target.checked;
        saveSettings();
        if (e.target.checked) {
            requestNotificationPermission();
        }
    });
    
    // Public profile toggle (v4.0)
    on('publicProfileToggle', 'change', (e) => {
        state.settings.profilePublic = e.target.checked;
        saveSettings();
        updatePublicProfile();
        showToast(e.target.checked ? 'Profilen din er nå offentlig' : 'Profilen din er nå privat', 'success');
    });
    
    // v4.1 - Notification setting toggles
    on('pushNotificationsToggle', 'change', async (e) => {
        state.settings.pushNotifications = e.target.checked;
        saveSettings();
        if (e.target.checked) {
            await requestPushPermission();
        }
        showToast(e.target.checked ? 'Push-varsler aktivert' : 'Push-varsler deaktivert', 'success');
    });
    
    on('friendNotificationsToggle', 'change', (e) => {
        state.settings.friendNotifications = e.target.checked;
        saveSettings();
        showToast(e.target.checked ? 'Vennevarsler aktivert' : 'Vennevarsler deaktivert', 'success');
    });
    
    on('expiryNotificationsToggle', 'change', (e) => {
        state.settings.reminderNotifications = e.target.checked;
        saveSettings();
        showToast(e.target.checked ? 'Utløpsvarsler aktivert' : 'Utløpsvarsler deaktivert', 'success');
    });
    
    // v4.2 - Auto-deduct toggle
    on('autoDeductToggle', 'change', (e) => {
        state.settings.autoDeductIngredients = e.target.checked;
        saveSettings();
        showToast(e.target.checked ? 'Auto-fratrekk aktivert' : 'Auto-fratrekk deaktivert', 'success');
    });
    
    on('logoutBtn', 'click', () => {
        showConfirmModal('Logg ut', 'Er du sikker på at du vil logge ut?', doSignOut);
    });
    
    on('exportDataBtn', 'click', exportAllData);
    on('importDataBtn', 'click', () => $('importInput').click());
    on('importInput', 'change', importData);
    
    // Image viewer
    setupImageViewer();
    
    // Modal close
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
        on(modalOverlay, 'click', closeModal);
    }
    on(document.querySelector('.modal-close'), 'click', closeModal);
}

// Request notification permission
async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            showToast('Varsler aktivert!', 'success');
        }
    }
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== Navigation =====
function navigateTo(viewId) {
    // Hide all views
    $$('.view').forEach(v => v.classList.add('hidden'));
    
    // Show target view
    const targetView = $(viewId);
    if (targetView) {
        targetView.classList.remove('hidden');
        targetView.classList.add('active');
    }
    
    // Update nav buttons
    $$('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewId);
    });
    
    state.currentView = viewId;
    
    // Render view content
    switch (viewId) {
        case 'dashboardView':
            renderDashboard();
            break;
        case 'recipeListView':
            renderRecipeList();
            break;
        case 'recipeView':
            renderRecipeView();
            break;
        case 'bookListView':
            renderBookList();
            break;
        case 'bookView':
            renderBookView();
            break;
        case 'categoriesView':
            renderCategoriesView();
            break;
        case 'digitalBookView':
            renderDigitalBook();
            break;
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function toggleSideMenu(show) {
    const menu = $('sideMenu');
    if (menu) {
        menu.classList.toggle('hidden', !show);
    }
}

// Toggle collapsible menu sections
function toggleMenuSection(sectionId) {
    const section = document.querySelector(`.menu-section[data-section="${sectionId}"]`);
    if (section) {
        section.classList.toggle('collapsed');
        // Save state to localStorage
        const collapsedSections = JSON.parse(localStorage.getItem('kokebok_collapsed_sections') || '[]');
        if (section.classList.contains('collapsed')) {
            if (!collapsedSections.includes(sectionId)) {
                collapsedSections.push(sectionId);
            }
        } else {
            const idx = collapsedSections.indexOf(sectionId);
            if (idx > -1) collapsedSections.splice(idx, 1);
        }
        localStorage.setItem('kokebok_collapsed_sections', JSON.stringify(collapsedSections));
    }
}
window.toggleMenuSection = toggleMenuSection;

// Restore collapsed menu sections state
function restoreMenuSectionStates() {
    const collapsedSections = JSON.parse(localStorage.getItem('kokebok_collapsed_sections') || '[]');
    collapsedSections.forEach(sectionId => {
        const section = document.querySelector(`.menu-section[data-section="${sectionId}"]`);
        if (section) section.classList.add('collapsed');
    });
}

// ===== Dashboard =====
function renderDashboard() {
    updateStats();
    renderCategories();
    renderRecentRecipes();
    renderBooksPreview();
    updateWelcomeMessage();
    renderRecipeOfTheDay();
    
    // Gamification features - only render if enabled
    if (state.settings.gamificationEnabled) {
        renderDailyChallenge();
        updateSocialCard();
    }
    
    updateKitchenCard(); // v4.1
    
    // Ensure gamification visibility is correct
    applyGamificationMode();
}

function updateStats() {
    const recipeCount = state.recipes.length;
    const bookCount = state.books.length;
    const categoryCount = state.categories.filter(c => 
        state.recipes.some(r => r.category === c.id)
    ).length;
    const imageCount = state.recipes.reduce((sum, r) => 
        sum + (r.images ? r.images.length : 0), 0
    );
    
    const statRecipes = $('statRecipes');
    const statBooks = $('statBooks');
    const statCategories = $('statCategories');
    const statImages = $('statImages');
    
    if (statRecipes) statRecipes.querySelector('.stat-value').textContent = recipeCount;
    if (statBooks) statBooks.querySelector('.stat-value').textContent = bookCount;
    if (statCategories) statCategories.querySelector('.stat-value').textContent = categoryCount;
    if (statImages) statImages.querySelector('.stat-value').textContent = imageCount;
}

function updateWelcomeMessage() {
    const welcomeStats = $('welcomeStats');
    if (welcomeStats) {
        const count = state.recipes.length;
        if (count === 0) {
            welcomeStats.textContent = 'Start med å legge til din første oppskrift';
        } else if (count === 1) {
            welcomeStats.textContent = 'Du har 1 oppskrift i samlingen din';
        } else {
            welcomeStats.textContent = `Du har ${count} oppskrifter i samlingen din`;
        }
    }
}

// v4.0 - Update social card on dashboard
function updateSocialCard() {
    const friendCountEl = $('friendCount');
    const leaderboardRankEl = $('leaderboardRank');
    const requestBadge = $('friendRequestBadge');
    const pendingCount = $('pendingRequestCount');
    
    if (friendCountEl) {
        friendCountEl.textContent = state.friends?.length || 0;
    }
    
    if (leaderboardRankEl) {
        // Show level instead of rank for now
        const level = getPlayerLevel().level;
        leaderboardRankEl.textContent = `Lv.${level}`;
    }
    
    const pending = (state.friendRequests?.length || 0)
        + (state.sharedRecipes?.filter(r => !r.viewed)?.length || 0)
        + (state.sharedCookbooks?.filter(s => !s.viewed && !s.accepted)?.length || 0);
    if (requestBadge && pendingCount) {
        if (pending > 0) {
            requestBadge.style.display = 'flex';
            pendingCount.textContent = pending;
        } else {
            requestBadge.style.display = 'none';
        }
    }
}

// v4.1 - Update kitchen card on dashboard
function updateKitchenCard() {
    const equipmentCountEl = $('equipmentCount');
    const pantryCountEl = $('pantryCount');
    const expiryAlertBadge = $('expiryAlertBadge');
    const expiryAlertCount = $('expiryAlertCount');
    
    if (equipmentCountEl) {
        equipmentCountEl.textContent = state.equipment?.length || 0;
    }
    
    if (pantryCountEl) {
        pantryCountEl.textContent = state.pantryItems?.length || 0;
    }
    
    // Count expiring items (within 3 days)
    const now = new Date();
    const expiringCount = (state.pantryItems || []).filter(item => {
        if (!item.expiryDate) return false;
        const days = Math.ceil((new Date(item.expiryDate) - now) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 3;
    }).length;
    
    if (expiryAlertBadge && expiryAlertCount) {
        if (expiringCount > 0) {
            expiryAlertBadge.style.display = 'flex';
            expiryAlertCount.textContent = expiringCount;
        } else {
            expiryAlertBadge.style.display = 'none';
        }
    }
}

function renderCategories() {
    const grid = $('categoriesGrid');
    if (!grid) return;
    
    // Get categories with recipe counts
    const categoriesWithCounts = state.categories.map(cat => ({
        ...cat,
        count: state.recipes.filter(r => r.category === cat.id).length
    })).filter(cat => cat.count > 0 || DEFAULT_CATEGORIES.some(dc => dc.id === cat.id));
    
    // Show ALL categories, not just top 8
    const categoriesToShow = categoriesWithCounts;
    
    grid.innerHTML = categoriesToShow.map(cat => `
        <div class="category-card" data-category="${cat.id}">
            <span class="category-icon">${cat.icon}</span>
            <span class="category-name">${escapeHtml(cat.name)}</span>
            <span class="category-count">${cat.count} oppskrifter</span>
        </div>
    `).join('');
    
    // Add click handlers
    grid.querySelectorAll('.category-card').forEach(card => {
        on(card, 'click', () => {
            state.filterCategory = card.dataset.category;
            navigateTo('recipeListView');
        });
    });
}

function renderRecentRecipes() {
    const container = $('recentRecipes');
    if (!container) return;
    
    // Sort by date and get recent 5
    const recent = [...state.recipes]
        .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        })
        .slice(0, 5);
    
    if (recent.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📝</span>
                <p class="empty-title">Ingen oppskrifter ennå</p>
                <p class="empty-text">Legg til din første oppskrift for å komme i gang</p>
                <button class="empty-btn" onclick="openRecipeEditor()">+ Legg til oppskrift</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recent.map(recipe => createRecipeCard(recipe)).join('');
    
    // Add click handlers
    container.querySelectorAll('.recipe-card').forEach(card => {
        on(card, 'click', () => {
            state.currentRecipe = state.recipes.find(r => r.id === card.dataset.id);
            navigateTo('recipeView');
        });
    });
}

function renderBooksPreview() {
    const grid = $('booksGrid');
    if (!grid) return;
    
    if (state.books.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <span class="empty-icon">📚</span>
                <p class="empty-title">Ingen kokebøker ennå</p>
                <p class="empty-text">Opprett en kokebok for å samle relaterte oppskrifter</p>
                <button class="empty-btn" onclick="openBookEditor()">+ Ny kokebok</button>
            </div>
        `;
        return;
    }
    
    // Show up to 4 books
    const booksToShow = state.books.slice(0, 4);
    
    grid.innerHTML = booksToShow.map(book => createBookCard(book)).join('');
    
    // Add click handlers
    grid.querySelectorAll('.book-card').forEach(card => {
        on(card, 'click', () => {
            state.currentBook = state.books.find(b => b.id === card.dataset.id);
            navigateTo('bookView');
        });
    });
}

