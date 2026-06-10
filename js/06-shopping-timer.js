// ===== SHOPPING LIST =====
function openShoppingList() {
    const modal = $('shoppingListModal');
    if (modal) {
        modal.classList.remove('hidden');
        renderShoppingList();
        setupShoppingListEvents();
    }
}

function closeShoppingList() {
    const modal = $('shoppingListModal');
    if (modal) modal.classList.add('hidden');
}

function setupShoppingListEvents() {
    const closeBtn = $('closeShoppingListBtn');
    const overlay = document.querySelector('#shoppingListModal .feature-modal-overlay');
    const addItemBtn = $('addShoppingItemBtn');
    const clearCheckedBtn = $('clearCheckedBtn');
    const shareListBtn = $('shareShoppingListBtn');
    
    if (closeBtn) closeBtn.onclick = closeShoppingList;
    if (overlay) overlay.onclick = closeShoppingList;
    if (addItemBtn) addItemBtn.onclick = addShoppingItem;
    if (clearCheckedBtn) clearCheckedBtn.onclick = clearCheckedItems;
    if (shareListBtn) shareListBtn.onclick = shareShoppingList;
    
    // Sort buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            sortShoppingList(btn.dataset.sort);
        };
    });
}

function sortShoppingList(sortType) {
    switch (sortType) {
        case 'alpha':
            state.shoppingList.sort((a, b) => {
                const aText = getItemName(a);
                const bText = getItemName(b);
                return aText.localeCompare(bText, 'no');
            });
            break;
        case 'category':
            state.shoppingList.sort((a, b) => (a.category || 'annet').localeCompare(b.category || 'annet', 'no'));
            break;
        case 'added':
        default:
            // Keep original order
            break;
    }
    renderShoppingList();
    saveShoppingList();
}

function renderShoppingList() {
    const container = $('shoppingListItems');
    const statsEl = $('shoppingListStats');
    if (!container) return;
    
    // Update stats
    const total = state.shoppingList.length;
    const checked = state.shoppingList.filter(i => i.checked).length;
    if (statsEl) statsEl.textContent = `${total} varer • ${checked} kjøpt`;
    
    if (state.shoppingList.length === 0) {
        container.innerHTML = `
            <div class="shopping-list-empty">
                <span>🛒</span>
                <p>Handlelisten er tom</p>
                <p>Generer fra ukemeny eller legg til manuelt</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.shoppingList.map((item, i) => `
        <div class="shopping-item ${item.checked ? 'checked' : ''}">
            <input type="checkbox" ${item.checked ? 'checked' : ''} data-index="${i}">
            <span class="shopping-item-text">${escapeHtml(getItemName(item))}</span>
            <button class="shopping-item-delete" data-index="${i}">🗑️</button>
        </div>
    `).join('');
    
    // Add event handlers
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.onchange = () => {
            const index = parseInt(cb.dataset.index);
            state.shoppingList[index].checked = cb.checked;
            saveShoppingList();
            renderShoppingList();
        };
    });
    
    container.querySelectorAll('.shopping-item-delete').forEach(btn => {
        btn.onclick = () => {
            const index = parseInt(btn.dataset.index);
            state.shoppingList.splice(index, 1);
            saveShoppingList();
            renderShoppingList();
        };
    });
}

function addShoppingItem() {
    const item = prompt('Legg til vare:');
    if (item && item.trim()) {
        state.shoppingList.push({ text: item.trim(), checked: false, addedAt: Date.now() });
        state.shoppingList = normalizeShoppingListItems(state.shoppingList);
        saveShoppingList();
        renderShoppingList();
    }
}

function clearCheckedItems() {
    state.shoppingList = state.shoppingList.filter(item => !item.checked);
    saveShoppingList();
    renderShoppingList();
    showToast('Avkryssede varer fjernet', 'success');
}

async function saveShoppingList() {
    try {
        state.shoppingList = normalizeShoppingListItems(state.shoppingList);
        await saveToFirestore('settings', 'shoppingList', { data: state.shoppingList });
    } catch (e) {
        console.warn('Could not save shopping list:', e);
    }
}

// ===== TIMER PERSISTENCE (for floating/home sync) =====
function persistTimerState() {
    try {
        const stateToSave = {
            seconds: timerSeconds,
            running: !!timerRunning,
            label: timerLabel || '',
            endAt: timerRunning && timerEndAt ? timerEndAt : null,
            updatedAt: Date.now()
        };
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
        // ignore
    }
}

function clearPersistedTimerState() {
    try {
        localStorage.removeItem(TIMER_STORAGE_KEY);
    } catch (e) {
        // ignore
    }
}

function tickTimerFromEndAt() {
    if (!timerRunning || !timerEndAt) return;
    const remaining = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000));
    timerSeconds = remaining;
    renderTimerDisplay();

    if (remaining <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerRunning = false;
        timerEndAt = null;
        persistTimerState();
        timerFinished();
    }
}

function startTimerTicker() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (timerRunning && timerEndAt) {
            tickTimerFromEndAt();
        } else if (timerRunning) {
            // Safety fallback if endAt is missing
            if (timerSeconds > 0) timerSeconds--;
            renderTimerDisplay();
            if (timerSeconds <= 0) {
                timerRunning = false;
                persistTimerState();
                timerFinished();
            }
        }
    }, 1000);
}

function restoreTimerState() {
    try {
        const raw = localStorage.getItem(TIMER_STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        timerLabel = saved?.label || '';

        if (saved?.running && saved?.endAt) {
            timerEndAt = saved.endAt;
            const remaining = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000));
            timerSeconds = remaining;
            timerRunning = remaining > 0;
            renderTimerDisplay();
            if (timerRunning) startTimerTicker();
            else {
                timerEndAt = null;
                persistTimerState();
            }
            return;
        }

        timerRunning = false;
        timerEndAt = null;
        timerSeconds = Math.max(0, parseInt(saved?.seconds) || 0);
        renderTimerDisplay();
    } catch (e) {
        // ignore
    }
}

// ===== COOKING TIMER =====
function openTimer() {
    const modal = $('timerModal');
    if (modal) {
        modal.classList.remove('hidden');
        renderTimerDisplay();
        setupTimerEvents();
    }
}

function closeTimer() {
    const modal = $('timerModal');
    if (modal) modal.classList.add('hidden');
}

function setupTimerEvents() {
    const closeBtn = $('closeTimerBtn');
    const overlay = document.querySelector('#timerModal .feature-modal-overlay');
    const startBtn = $('startTimerBtn');  // Fixed: was timerStartBtn
    const pauseBtn = $('pauseTimerBtn');  // Fixed: was timerPauseBtn
    const resetBtn = $('resetTimerBtn');  // Fixed: was timerResetBtn
    const setCustomBtn = $('setCustomTimerBtn');
    
    if (closeBtn) closeBtn.onclick = closeTimer;
    if (overlay) overlay.onclick = closeTimer;
    if (startBtn) startBtn.onclick = startTimer;
    if (pauseBtn) pauseBtn.onclick = pauseTimer;
    if (resetBtn) resetBtn.onclick = resetTimer;
    
    // Custom timer button
    if (setCustomBtn) {
        setCustomBtn.onclick = () => {
            const customMinutes = $('customMinutes');
            const minutes = parseInt(customMinutes?.value) || 0;
            if (minutes > 0) {
                timerSeconds = minutes * 60;
                timerLabel = `${minutes} min`;
                timerEndAt = null;
                timerRunning = false;
                $$('.timer-preset').forEach(p => p.classList.remove('active'));
                renderTimerDisplay();
                persistTimerState();
                showToast(`Timer satt til ${minutes} minutter`, 'success');
            } else {
                showToast('Skriv inn antall minutter', 'warning');
            }
        };
    }
    
    // Presets
    $$('.timer-preset').forEach(preset => {
        preset.onclick = () => {
            const minutes = parseInt(preset.dataset.minutes);
            timerSeconds = minutes * 60;
            timerLabel = preset.textContent;
            timerEndAt = null;
            timerRunning = false;
            $$('.timer-preset').forEach(p => p.classList.remove('active'));
            preset.classList.add('active');
            renderTimerDisplay();
            persistTimerState();
        };
    });
    
    // Custom input - also set timer when user presses Enter
    const customMinutes = $('customMinutes');
    if (customMinutes) {
        customMinutes.onkeypress = (e) => {
            if (e.key === 'Enter') {
                setCustomBtn?.click();
            }
        };
    }
}

function renderTimerDisplay() {
    const display = $('timerValue');  // Fixed: was timerDisplay
    const labelEl = $('timerLabel');
    const floatingDisplay = $('floatingTimerValue');
    const startBtn = $('startTimerBtn');
    const pauseBtn = $('pauseTimerBtn');
    
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    if (display) {
        display.textContent = timeStr;
        display.classList.toggle('running', timerRunning);
        display.classList.toggle('finished', timerSeconds === 0 && !timerRunning && timerLabel);
    }
    
    // Update label
    if (labelEl) {
        if (timerRunning) {
            labelEl.textContent = timerLabel || 'Kjører...';
        } else if (timerSeconds === 0 && timerLabel) {
            labelEl.textContent = 'Ferdig!';
        } else if (timerSeconds > 0) {
            labelEl.textContent = timerLabel || 'Klar';
        } else {
            labelEl.textContent = 'Klar';
        }
    }
    
    // Toggle start/pause buttons visibility
    if (startBtn && pauseBtn) {
        if (timerRunning) {
            startBtn.classList.add('hidden');
            pauseBtn.classList.remove('hidden');
        } else {
            startBtn.classList.remove('hidden');
            pauseBtn.classList.add('hidden');
        }
    }
    
    if (floatingDisplay) {
        floatingDisplay.textContent = timeStr;
        floatingDisplay.classList.toggle('running', timerRunning);
        floatingDisplay.classList.toggle('finished', timerSeconds === 0 && !timerRunning && timerLabel);
    }
    
    // Show/hide floating timer
    const floatingTimer = $('floatingTimer');
    if (floatingTimer) {
        floatingTimer.classList.toggle('hidden', !timerRunning && timerSeconds === 0);
    }
}

// Sett timer til et gitt antall minutter (brukes av hurtigtimer og talekommandoer)
function setTimerMinutes(minutes) {
    const mins = Math.max(0, parseInt(minutes) || 0);
    timerSeconds = mins * 60;
    timerLabel = `${mins} min`;
    timerEndAt = null;
    timerRunning = false;
    persistTimerState();
    renderTimerDisplay();
}
window.setTimerMinutes = setTimerMinutes;

function startTimer() {
    if (timerSeconds <= 0) {
        showToast('Velg en tid først', 'warning');
        return;
    }

    timerRunning = true;
    timerEndAt = Date.now() + (timerSeconds * 1000);
    persistTimerState();
    startTimerTicker();

    renderTimerDisplay();
    showToast('Timer startet! ⏱️', 'success');
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
    timerEndAt = null;
    persistTimerState();
    renderTimerDisplay();
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
    timerSeconds = 0;
    timerLabel = '';
    timerEndAt = null;
    $$('.timer-preset').forEach(p => p.classList.remove('active'));
    clearPersistedTimerState();
    renderTimerDisplay();
}

function timerFinished() {
    // Sound notification (if possible)
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR4Idce/bABKXbz/AAAA');
        audio.play().catch(() => {});
    } catch (e) {}
    
    // Visual notification
    showToast(`⏰ ${timerLabel || 'Timer'} er ferdig!`, 'success');
    triggerConfetti();
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏰ Timer ferdig!', { body: timerLabel || 'Tiden er ute!' });
    }
}

// ===== LANGUAGE SELECTOR =====
function openLanguageSelector() {
    const modal = $('languageModal');
    if (modal) {
        modal.classList.remove('hidden');
        setupLanguageEvents();
        updateLanguageButtons();
    }
}

function closeLanguageSelector() {
    const modal = $('languageModal');
    if (modal) modal.classList.add('hidden');
}

function setupLanguageEvents() {
    const closeBtn = $('closeLanguageBtn');
    const overlay = document.querySelector('#languageModal .feature-modal-overlay');
    
    if (closeBtn) closeBtn.onclick = closeLanguageSelector;
    if (overlay) overlay.onclick = closeLanguageSelector;
    
    $$('.language-btn').forEach(btn => {
        btn.onclick = () => {
            const lang = btn.dataset.lang;
            setLanguage(lang);
            closeLanguageSelector();
        };
    });
}

function updateLanguageButtons() {
    $$('.language-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLanguage);
    });
}

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('kokebok_language', lang);
    showToast(`Språk endret til ${getLanguageName(lang)}`, 'success');
    // In a full implementation, this would update all UI text
}

function getLanguageName(code) {
    const names = { no: 'Norsk', en: 'English', sv: 'Svenska', da: 'Dansk', de: 'Deutsch' };
    return names[code] || code;
}

// ===== PORTION CALCULATOR =====
function openPortionCalculator() {
    const modal = $('portionCalculatorModal');
    if (modal) {
        modal.classList.remove('hidden');
        setupPortionCalculatorEvents();
    }
}

function closePortionCalculator() {
    const modal = $('portionCalculatorModal');
    if (modal) modal.classList.add('hidden');
}

function setupPortionCalculatorEvents() {
    const closeBtn = $('closePortionCalculatorBtn');
    const overlay = document.querySelector('#portionCalculatorModal .feature-modal-overlay');
    const minusBtn = $('portionMinusBtn');
    const plusBtn = $('portionPlusBtn');
    
    if (closeBtn) closeBtn.onclick = closePortionCalculator;
    if (overlay) overlay.onclick = closePortionCalculator;
    if (minusBtn) minusBtn.onclick = () => adjustPortionsModal(-1);
    if (plusBtn) plusBtn.onclick = () => adjustPortionsModal(1);
}

function adjustPortionsModal(delta) {
    const originalInput = $('originalPortions');
    const newInput = $('newPortions');
    
    if (!newInput) return;
    
    let newValue = (parseInt(newInput.value) || 4) + delta;
    if (newValue < 1) newValue = 1;
    if (newValue > 50) newValue = 50;
    
    newInput.value = newValue;
    calculateAdjustedIngredients();
}

function calculateAdjustedIngredients() {
    const originalInput = $('originalPortions');
    const newInput = $('newPortions');
    const container = $('adjustedIngredients');
    
    if (!container || !state.currentRecipe) return;
    
    const originalPortions = parseInt(originalInput?.value) || 4;
    const newPortions = parseInt(newInput?.value) || 4;
    const multiplier = newPortions / originalPortions;
    
    const ingredients = state.currentRecipe.ingredients?.split('\n') || [];
    
    container.innerHTML = ingredients.map(ing => {
        // Try to parse numbers
        const adjusted = ing.replace(/(\d+(?:[.,]\d+)?)/g, (match) => {
            const num = parseFloat(match.replace(',', '.'));
            const result = (num * multiplier).toFixed(1).replace('.0', '');
            return result;
        });
        
        return `
            <div class="adjusted-ingredient">
                <span>${escapeHtml(adjusted)}</span>
                ${adjusted !== ing ? `<span class="adjusted-amount">×${multiplier.toFixed(1)}</span>` : ''}
            </div>
        `;
    }).join('');
}

// ===== FAVORITES =====
function filterFavorites() {
    state.filterCategory = '';
    // In a real implementation, this would filter by favorite flag
    showToast('Viser favoritter', 'info');
}

function toggleFavorite(recipeId) {
    const index = state.favorites.indexOf(recipeId);
    if (index === -1) {
        state.favorites.push(recipeId);
        showToast('Lagt til i favoritter ⭐', 'success');
    } else {
        state.favorites.splice(index, 1);
        showToast('Fjernet fra favoritter', 'info');
    }
    saveFavorites();
    updateFavoritesCount();
}

async function saveFavorites() {
    try {
        await saveToFirestore('settings', 'favorites', { data: state.favorites });
    } catch (e) {
        console.warn('Could not save favorites:', e);
    }
}

function updateFavoritesCount() {
    const el = $('statFavorites');
    if (el) {
        const count = state.favorites.length;
        el.querySelector('.stat-value').textContent = count;
    }
}

function updatePlannedMealsCount() {
    const el = $('statPlanned');
    if (el) {
        const count = Object.keys(state.mealPlan).length;
        el.querySelector('.stat-value').textContent = count;
    }
}

// ===== CONFETTI EFFECT =====
function triggerConfetti() {
    const canvas = $('confettiCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3'];
    
    // Create particles
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20 - 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 10 + 5,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10
        });
    }
    
    let frame = 0;
    const maxFrames = 120;
    
    function animate() {
        if (frame >= maxFrames) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.5; // Gravity
            p.rotation += p.rotationSpeed;
            p.vx *= 0.99; // Air resistance
            
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 1 - (frame / maxFrames);
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            ctx.restore();
        });
        
        frame++;
        requestAnimationFrame(animate);
    }
    
    animate();
}

// ===== Toast =====
function showToast(message, type = 'info') {
    const container = $('toastContainer');
    if (!container) return;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
    `;
    
    container.appendChild(toast);
    
    // Success celebration
    if (type === 'success') {
        toast.classList.add('success-pulse');
    }
    
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== GENERIC MODAL FUNCTION =====
function showModal(title, content, buttons = [], options = {}) {
    // Remove existing modal
    const existing = document.querySelector('.generic-modal-overlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'generic-modal-overlay';
    
    const buttonsHtml = '<div class="modal-buttons"></div>';
    
    // Apply custom width if provided
    const modalStyle = options.width ? `style="max-width: ${options.width};"` : '';
    
    overlay.innerHTML = `
        <div class="generic-modal" ${modalStyle}>
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="close-btn" onclick="closeGenericModal()">×</button>
            </div>
            <div class="modal-content">
                ${content}
            </div>
            ${buttonsHtml}
        </div>
    `;
    
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeGenericModal();
    });

    const buttonsContainer = overlay.querySelector('.modal-buttons');
    const buttonList = buttons.length > 0
        ? buttons
        : [{ text: 'Lukk', class: 'btn-primary', onClick: closeGenericModal }];

    if (buttonsContainer) {
        buttonList.forEach(btn => {
            const button = document.createElement('button');
            button.className = `btn ${btn.class || 'btn-primary'}`;
            button.textContent = btn.text;

            const handler = btn.onClick || btn.onclick;
            if (typeof handler === 'function') {
                button.addEventListener('click', handler);
            } else if (typeof handler === 'string') {
                button.setAttribute('onclick', handler);
            } else if (!buttons.length) {
                button.addEventListener('click', closeGenericModal);
            }

            buttonsContainer.appendChild(button);
        });
    }
    
    // Animate in
    requestAnimationFrame(() => overlay.classList.add('active'));
}

function closeGenericModal() {
    const overlay = document.querySelector('.generic-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    setupAuth();
    requestNotificationPermission();
    restoreTimerState();
});

// Load extra settings after user login
async function loadExtraSettings() {
    try {
        // Load favorites
        const favSettings = await loadCollection('settings');
        const favDoc = favSettings.find(s => s.id === 'favorites');
        if (favDoc?.data) state.favorites = favDoc.data;
        
        // Load meal plan
        const mealPlanDoc = favSettings.find(s => s.id === 'mealPlan');
        if (mealPlanDoc?.data) state.mealPlan = mealPlanDoc.data;
        
        // Load shopping list
        const shoppingDoc = favSettings.find(s => s.id === 'shoppingList');
        if (shoppingDoc?.data) {
            state.shoppingList = normalizeShoppingListItems(shoppingDoc.data);
        }
        
        updateFavoritesCount();
        updatePlannedMealsCount();
    } catch (e) {
        console.warn('Could not load extra settings:', e);
    }
}

// Make functions available globally for onclick handlers
window.openRecipeEditor = openRecipeEditor;
window.openBookEditor = openBookEditor;
window.closeModal = closeModal;
window.saveExternalRecipe = saveExternalRecipe;
window.addToMealPlanFromSearch = addToMealPlanFromSearch;
window.openRecipeSearch = openRecipeSearch;
window.openMealPlanner = openMealPlanner;
window.openShoppingList = openShoppingList;
window.openTimer = openTimer;
window.openLanguageSelector = openLanguageSelector;
window.openPortionCalculator = openPortionCalculator;
window.toggleFavorite = toggleFavorite;

