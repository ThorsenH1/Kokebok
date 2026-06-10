// =============================================
// ===== KITCHEN EQUIPMENT TRACKER =====
// =============================================

const EQUIPMENT_CATEGORIES = [
    { id: 'appliances', name: 'Kjøkkenmaskiner', icon: '🔌', examples: 'Kjøkkenmaskin, blender, mikser' },
    { id: 'cookware', name: 'Gryter & Panner', icon: '🍳', examples: 'Stekepanner, kasseroller, wok' },
    { id: 'bakeware', name: 'Bakeutstyr', icon: '🧁', examples: 'Kakeformer, bakeplater, hevekurver' },
    { id: 'knives', name: 'Kniver', icon: '🔪', examples: 'Kokkekniv, brødkniv, urtekniv' },
    { id: 'utensils', name: 'Redskaper', icon: '🥄', examples: 'Sleiver, visper, spatler' },
    { id: 'cutting', name: 'Skjærebrett', icon: '🪵', examples: 'Trefjøler, plastfjøler' },
    { id: 'storage', name: 'Oppbevaring', icon: '🫙', examples: 'Bokser, glass, vakuumposer' },
    { id: 'measuring', name: 'Måling', icon: '⚖️', examples: 'Vekt, målebeger, termometer' },
    { id: 'serving', name: 'Servering', icon: '🍽️', examples: 'Fat, boller, serveringsutstyr' },
    { id: 'specialty', name: 'Spesialutstyr', icon: '🦞', examples: 'Pastamaskin, sous vide, røykoven' },
    { id: 'other', name: 'Annet', icon: '📦', examples: 'Alt annet kjøkkenutstyr' }
];

const EQUIPMENT_CONDITIONS = [
    { id: 'new', name: 'Ny', color: '#4CAF50' },
    { id: 'excellent', name: 'Utmerket', color: '#8BC34A' },
    { id: 'good', name: 'God', color: '#FFC107' },
    { id: 'fair', name: 'Brukbar', color: '#FF9800' },
    { id: 'poor', name: 'Slitt', color: '#F44336' }
];

// Load equipment from Firestore
async function loadEquipment() {
    if (!state.user) return;
    
    try {
        const snapshot = await userDoc('equipment').get();
        state.equipment = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`✓ Lastet ${state.equipment.length} utstyr`);
    } catch (e) {
        console.warn('Kunne ikke laste utstyr:', e.message);
        state.equipment = [];
    }
}

// Open equipment panel
function openEquipmentPanel() {
    loadEquipment().then(() => {
        renderEquipmentPanel();
    });
}
window.openEquipmentPanel = openEquipmentPanel;

function renderEquipmentPanel() {
    const totalItems = state.equipment.length;
    const totalValue = state.equipment.reduce((sum, e) => sum + (parseFloat(e.price) || 0), 0);
    const categoryCounts = {};
    
    state.equipment.forEach(e => {
        categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    });
    
    let html = `
        <div class="equipment-panel">
            <!-- Stats Overview -->
            <div class="equipment-stats-premium">
                <div class="equip-stat">
                    <span class="equip-stat-value">${totalItems}</span>
                    <span class="equip-stat-label">Utstyr totalt</span>
                </div>
                <div class="equip-stat">
                    <span class="equip-stat-value">${formatCurrency(totalValue)}</span>
                    <span class="equip-stat-label">Estimert verdi</span>
                </div>
                <div class="equip-stat">
                    <span class="equip-stat-value">${Object.keys(categoryCounts).length}</span>
                    <span class="equip-stat-label">Kategorier</span>
                </div>
            </div>
            
            <!-- Category Tabs -->
            <div class="equipment-categories-scroll">
                <button class="equip-cat-btn active" data-cat="all" onclick="filterEquipment('all')">
                    📋 Alle <span class="cat-count">${totalItems}</span>
                </button>
                ${EQUIPMENT_CATEGORIES.map(cat => `
                    <button class="equip-cat-btn" data-cat="${cat.id}" onclick="filterEquipment('${cat.id}')">
                        ${cat.icon} ${cat.name} <span class="cat-count">${categoryCounts[cat.id] || 0}</span>
                    </button>
                `).join('')}
            </div>
            
            <!-- Add Button -->
            <button class="add-equipment-btn" onclick="openEquipmentEditor()">
                <span>➕</span> Legg til utstyr
            </button>
            
            <!-- Equipment Grid -->
            <div id="equipmentGrid" class="equipment-grid">
                ${renderEquipmentGrid('all')}
            </div>
            
            <!-- Compare with Friends -->
            ${state.friends.length > 0 ? `
                <div class="equipment-compare-section">
                    <h4>👥 Sammenlign med venner</h4>
                    <button class="btn btn-secondary" onclick="compareEquipmentWithFriends()">
                        📊 Se sammenligning
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    showModal('🍳 Mitt Kjøkkenutstyr', html, []);
}

function renderEquipmentGrid(categoryFilter) {
    let items = state.equipment;
    
    if (categoryFilter && categoryFilter !== 'all') {
        items = items.filter(e => e.category === categoryFilter);
    }
    
    if (items.length === 0) {
        return `
            <div class="equipment-empty">
                <span class="empty-icon">🍳</span>
                <p>Ingen utstyr i denne kategorien</p>
                <p class="empty-hint">Legg til ditt kjøkkenutstyr for full oversikt!</p>
            </div>
        `;
    }
    
    // Sort by category and then by name
    items.sort((a, b) => {
        if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
        }
        return (a.name || '').localeCompare(b.name || '');
    });
    
    return items.map(item => {
        const cat = EQUIPMENT_CATEGORIES.find(c => c.id === item.category) || EQUIPMENT_CATEGORIES[10];
        const condition = EQUIPMENT_CONDITIONS.find(c => c.id === item.condition) || EQUIPMENT_CONDITIONS[2];
        const ageText = item.purchaseDate ? getEquipmentAge(item.purchaseDate) : '';
        
        return `
            <div class="equipment-card" onclick="viewEquipment('${item.id}')">
                <div class="equip-card-header">
                    <span class="equip-icon">${cat.icon}</span>
                    <span class="equip-condition" style="background: ${condition.color}">${condition.name}</span>
                </div>
                ${item.image ? `<img src="${item.image}" class="equip-image" alt="${item.name}">` : ''}
                <div class="equip-card-body">
                    <h4 class="equip-name">${escapeHtml(item.name)}</h4>
                    ${item.brand ? `<span class="equip-brand">${escapeHtml(item.brand)}</span>` : ''}
                    ${item.model ? `<span class="equip-model">${escapeHtml(item.model)}</span>` : ''}
                    ${ageText ? `<span class="equip-age">📅 ${ageText}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function filterEquipment(category) {
    document.querySelectorAll('.equip-cat-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === category);
    });
    
    const grid = $('equipmentGrid');
    if (grid) {
        grid.innerHTML = renderEquipmentGrid(category);
    }
}
window.filterEquipment = filterEquipment;

function getEquipmentAge(purchaseDate) {
    if (!purchaseDate) return '';
    
    const purchase = new Date(purchaseDate);
    const now = new Date();
    const diffMs = now - purchase;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} dager`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} måneder`;
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (months === 0) return `${years} år`;
    return `${years} år, ${months} mnd`;
}

function formatCurrency(amount) {
    if (!amount || isNaN(amount)) return 'kr 0';
    return `kr ${Math.round(amount).toLocaleString('nb-NO')}`;
}

// Open equipment editor
function openEquipmentEditor(equipmentId = null) {
    const existing = equipmentId ? state.equipment.find(e => e.id === equipmentId) : null;
    
    const html = `
        <div class="equipment-editor">
            <div class="form-group">
                <label>Navn *</label>
                <input type="text" id="equipName" class="form-input" placeholder="F.eks. KitchenAid Artisan" 
                    value="${existing?.name || ''}">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Kategori *</label>
                    <select id="equipCategory" class="form-select">
                        ${EQUIPMENT_CATEGORIES.map(cat => `
                            <option value="${cat.id}" ${existing?.category === cat.id ? 'selected' : ''}>
                                ${cat.icon} ${cat.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Tilstand</label>
                    <select id="equipCondition" class="form-select">
                        ${EQUIPMENT_CONDITIONS.map(cond => `
                            <option value="${cond.id}" ${existing?.condition === cond.id ? 'selected' : ''}>
                                ${cond.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Merke</label>
                    <input type="text" id="equipBrand" class="form-input" placeholder="F.eks. KitchenAid" 
                        value="${existing?.brand || ''}">
                </div>
                <div class="form-group">
                    <label>Modell</label>
                    <input type="text" id="equipModel" class="form-input" placeholder="F.eks. 5KSM185PS" 
                        value="${existing?.model || ''}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Kjøpt</label>
                    <input type="date" id="equipPurchaseDate" class="form-input" 
                        value="${existing?.purchaseDate || ''}">
                </div>
                <div class="form-group">
                    <label>Pris (kr)</label>
                    <input type="number" id="equipPrice" class="form-input" placeholder="0" 
                        value="${existing?.price || ''}">
                </div>
            </div>
            
            <div class="form-group">
                <label>Kjøpt hos</label>
                <input type="text" id="equipStore" class="form-input" placeholder="F.eks. Elkjøp, Tilbords" 
                    value="${existing?.store || ''}">
            </div>
            
            <div class="form-group">
                <label>Serienummer / Garantinummer</label>
                <input type="text" id="equipSerial" class="form-input" placeholder="Valgfritt" 
                    value="${existing?.serial || ''}">
            </div>
            
            <div class="form-group">
                <label>Garantiutløp</label>
                <input type="date" id="equipWarrantyEnd" class="form-input" 
                    value="${existing?.warrantyEnd || ''}">
            </div>
            
            <div class="form-group">
                <label>Notater</label>
                <textarea id="equipNotes" class="form-textarea" rows="3" 
                    placeholder="Eventuelle notater...">${existing?.notes || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label>Bilde</label>
                <div class="image-upload-area" onclick="document.getElementById('equipImageInput').click()">
                    <input type="file" id="equipImageInput" accept="image/*" hidden onchange="previewEquipmentImage(event)">
                    <div id="equipImagePreview" class="image-preview">
                        ${existing?.image ? `<img src="${existing.image}" alt="Utstyr">` : '<span>📷 Klikk for å legge til bilde</span>'}
                    </div>
                </div>
            </div>
            
            <div class="form-group checkbox-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="equipShareWithFriends" ${existing?.shareWithFriends ? 'checked' : ''}>
                    <span>Del dette utstyret med venner (synlig i sammenligning)</span>
                </label>
            </div>
        </div>
    `;
    
    const buttons = [
        { text: 'Avbryt', class: 'btn-secondary', onClick: closeModal },
        { text: existing ? '💾 Oppdater' : '➕ Legg til', class: 'btn-primary', onClick: () => saveEquipment(equipmentId) }
    ];
    
    if (existing) {
        buttons.unshift({ text: '🗑️ Slett', class: 'btn-danger', onClick: () => deleteEquipment(equipmentId) });
    }
    
    showModal(existing ? '✏️ Rediger utstyr' : '➕ Legg til utstyr', html, buttons);
}
window.openEquipmentEditor = openEquipmentEditor;

let tempEquipmentImage = null;

async function previewEquipmentImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // Komprimer bildet – ukomprimerte mobilbilder overskrider Firestores
        // dokumentgrense på 1 MB og gjorde at lagring med bilde alltid feilet.
        tempEquipmentImage = await compressImage(file, 1200, 1200, 0.7);
        if (estimateBase64Bytes(tempEquipmentImage) > 700 * 1024) {
            tempEquipmentImage = await compressImage(file, 800, 800, 0.6);
        }
        const preview = $('equipImagePreview');
        if (preview) {
            preview.innerHTML = `<img src="${tempEquipmentImage}" alt="Forhåndsvisning">`;
        }
    } catch (e) {
        console.error('Kunne ikke behandle bildet:', e);
        showToast('Kunne ikke behandle bildet', 'error');
    }
}
window.previewEquipmentImage = previewEquipmentImage;

async function saveEquipment(existingId = null) {
    const name = $('equipName')?.value?.trim();
    const category = $('equipCategory')?.value;
    
    if (!name) {
        showToast('Navn er påkrevd', 'error');
        return;
    }
    
    const equipmentData = {
        name: name,
        category: category,
        condition: $('equipCondition')?.value || 'good',
        brand: $('equipBrand')?.value?.trim() || '',
        model: $('equipModel')?.value?.trim() || '',
        purchaseDate: $('equipPurchaseDate')?.value || '',
        price: parseFloat($('equipPrice')?.value) || 0,
        store: $('equipStore')?.value?.trim() || '',
        serial: $('equipSerial')?.value?.trim() || '',
        warrantyEnd: $('equipWarrantyEnd')?.value || '',
        notes: $('equipNotes')?.value?.trim() || '',
        shareWithFriends: $('equipShareWithFriends')?.checked || false,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Handle image
    if (tempEquipmentImage) {
        equipmentData.image = tempEquipmentImage;
    } else if (existingId) {
        const existing = state.equipment.find(e => e.id === existingId);
        if (existing?.image) {
            equipmentData.image = existing.image;
        }
    }
    
    try {
        if (existingId) {
            await saveToFirestore('equipment', existingId, equipmentData);
            const index = state.equipment.findIndex(e => e.id === existingId);
            if (index >= 0) {
                state.equipment[index] = { id: existingId, ...equipmentData };
            }
            showToast('Utstyr oppdatert! ✓', 'success');
        } else {
            equipmentData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            const newId = await saveToFirestore('equipment', null, equipmentData);
            state.equipment.push({ id: newId, ...equipmentData });
            showToast('Utstyr lagt til! 🎉', 'success');
            addXP(5, 'La til utstyr');
            
            // Achievement check
            if (state.equipment.length >= 10) {
                unlockAchievement('equipmentCollector');
            }
            if (state.equipment.length >= 50) {
                unlockAchievement('kitchenMaster');
            }
        }
        
        tempEquipmentImage = null;
        closeModal();
        openEquipmentPanel();
        
    } catch (e) {
        console.error('Save equipment error:', e);
        showToast('Kunne ikke lagre utstyret', 'error');
    }
}
window.saveEquipment = saveEquipment;

async function deleteEquipment(equipmentId) {
    if (!confirm('Er du sikker på at du vil slette dette utstyret?')) return;
    
    try {
        await deleteFromFirestore('equipment', equipmentId);
        state.equipment = state.equipment.filter(e => e.id !== equipmentId);
        showToast('Utstyr slettet', 'success');
        closeModal();
        openEquipmentPanel();
    } catch (e) {
        showToast('Kunne ikke slette utstyret', 'error');
    }
}
window.deleteEquipment = deleteEquipment;

function viewEquipment(equipmentId) {
    const item = state.equipment.find(e => e.id === equipmentId);
    if (!item) return;
    
    const cat = EQUIPMENT_CATEGORIES.find(c => c.id === item.category) || EQUIPMENT_CATEGORIES[10];
    const condition = EQUIPMENT_CONDITIONS.find(c => c.id === item.condition) || EQUIPMENT_CONDITIONS[2];
    const ageText = item.purchaseDate ? getEquipmentAge(item.purchaseDate) : 'Ukjent';
    const warrantyStatus = getWarrantyStatus(item.warrantyEnd);
    
    const html = `
        <div class="equipment-detail">
            ${item.image ? `
                <div class="equip-detail-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
            ` : ''}
            
            <div class="equip-detail-header">
                <span class="equip-detail-icon">${cat.icon}</span>
                <div class="equip-detail-title">
                    <h2>${escapeHtml(item.name)}</h2>
                    ${item.brand ? `<span class="equip-detail-brand">${escapeHtml(item.brand)}</span>` : ''}
                </div>
                <span class="equip-detail-condition" style="background: ${condition.color}">${condition.name}</span>
            </div>
            
            <div class="equip-detail-specs">
                ${item.model ? `
                    <div class="spec-row">
                        <span class="spec-label">Modell</span>
                        <span class="spec-value">${escapeHtml(item.model)}</span>
                    </div>
                ` : ''}
                <div class="spec-row">
                    <span class="spec-label">Kategori</span>
                    <span class="spec-value">${cat.icon} ${cat.name}</span>
                </div>
                ${item.purchaseDate ? `
                    <div class="spec-row">
                        <span class="spec-label">Kjøpt</span>
                        <span class="spec-value">${new Date(item.purchaseDate).toLocaleDateString('nb-NO')} (${ageText})</span>
                    </div>
                ` : ''}
                ${item.price ? `
                    <div class="spec-row">
                        <span class="spec-label">Pris</span>
                        <span class="spec-value">${formatCurrency(item.price)}</span>
                    </div>
                ` : ''}
                ${item.store ? `
                    <div class="spec-row">
                        <span class="spec-label">Kjøpt hos</span>
                        <span class="spec-value">${escapeHtml(item.store)}</span>
                    </div>
                ` : ''}
                ${item.serial ? `
                    <div class="spec-row">
                        <span class="spec-label">Serienr.</span>
                        <span class="spec-value">${escapeHtml(item.serial)}</span>
                    </div>
                ` : ''}
                ${item.warrantyEnd ? `
                    <div class="spec-row">
                        <span class="spec-label">Garanti</span>
                        <span class="spec-value ${warrantyStatus.class}">${warrantyStatus.text}</span>
                    </div>
                ` : ''}
            </div>
            
            ${item.notes ? `
                <div class="equip-detail-notes">
                    <h4>📝 Notater</h4>
                    <p>${escapeHtml(item.notes)}</p>
                </div>
            ` : ''}
            
            <div class="equip-detail-actions">
                <button class="btn btn-primary" onclick="openEquipmentEditor('${item.id}')">
                    ✏️ Rediger
                </button>
                <button class="btn btn-secondary" onclick="closeModal(); openEquipmentPanel();">
                    ← Tilbake
                </button>
            </div>
        </div>
    `;
    
    showModal(`${cat.icon} ${item.name}`, html, []);
}
window.viewEquipment = viewEquipment;

function getWarrantyStatus(warrantyEnd) {
    if (!warrantyEnd) return { text: 'Ukjent', class: '' };
    
    const endDate = new Date(warrantyEnd);
    const now = new Date();
    const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return { text: `Utløpt for ${Math.abs(diffDays)} dager siden`, class: 'warranty-expired' };
    } else if (diffDays <= 30) {
        return { text: `Utløper om ${diffDays} dager!`, class: 'warranty-warning' };
    } else if (diffDays <= 90) {
        return { text: `Utløper ${endDate.toLocaleDateString('nb-NO')}`, class: 'warranty-soon' };
    } else {
        return { text: `Gyldig til ${endDate.toLocaleDateString('nb-NO')}`, class: 'warranty-active' };
    }
}

// Compare equipment with friends
async function compareEquipmentWithFriends() {
    if (state.friends.length === 0) {
        showToast('Legg til venner for å sammenligne utstyr', 'info');
        return;
    }
    
    const myEquipment = state.equipment.filter(e => e.shareWithFriends);
    
    // Load friends' equipment
    let friendsData = [];
    for (const friend of state.friends) {
        try {
            const snapshot = await db.collection('users').doc(friend.friendUid)
                .collection('equipment')
                .where('shareWithFriends', '==', true)
                .get();
            
            const friendEquipment = snapshot.docs.map(doc => doc.data());
            friendsData.push({
                name: friend.displayName,
                equipment: friendEquipment
            });
        } catch (e) {
            // Skip if can't access
        }
    }
    
    const html = `
        <div class="equipment-comparison">
            <h4>📊 Utstyrssammenligning</h4>
            
            <div class="comparison-table">
                <div class="comparison-row header">
                    <span>Kategori</span>
                    <span>Du</span>
                    ${friendsData.map(f => `<span>${escapeHtml(f.name)}</span>`).join('')}
                </div>
                
                ${EQUIPMENT_CATEGORIES.map(cat => {
                    const myCount = myEquipment.filter(e => e.category === cat.id).length;
                    const friendCounts = friendsData.map(f => 
                        f.equipment.filter(e => e.category === cat.id).length
                    );
                    
                    if (myCount === 0 && friendCounts.every(c => c === 0)) return '';
                    
                    return `
                        <div class="comparison-row">
                            <span>${cat.icon} ${cat.name}</span>
                            <span class="count">${myCount}</span>
                            ${friendCounts.map(c => `<span class="count">${c}</span>`).join('')}
                        </div>
                    `;
                }).join('')}
                
                <div class="comparison-row total">
                    <span>Totalt</span>
                    <span class="count">${myEquipment.length}</span>
                    ${friendsData.map(f => `<span class="count">${f.equipment.length}</span>`).join('')}
                </div>
            </div>
            
            <p class="comparison-note">💡 Kun delt utstyr vises i sammenligningen</p>
        </div>
    `;
    
    showModal('📊 Sammenlign utstyr', html, [
        { text: 'Lukk', class: 'btn-secondary', onClick: closeModal }
    ]);
}
window.compareEquipmentWithFriends = compareEquipmentWithFriends;

// =============================================
// ===== PANTRY TRACKER (BONUS) =====
// =============================================

async function loadPantry() {
    if (!state.user) return;
    
    try {
        const snapshot = await userDoc('pantry').get();
        state.pantryItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        state.pantryItems = [];
    }
}

function openPantryTracker() {
    loadPantry().then(() => {
        renderPantryPanel();
    });
}
window.openPantryTracker = openPantryTracker;

function renderPantryPanel() {
    const expiringItems = state.pantryItems.filter(item => {
        if (!item.expiryDate) return false;
        const days = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return days <= 7 && days >= 0;
    });
    
    const expiredItems = state.pantryItems.filter(item => {
        if (!item.expiryDate) return false;
        return new Date(item.expiryDate) < new Date();
    });
    
    // Calculate total pantry value
    const totalValue = state.pantryItems.reduce((sum, item) => {
        return sum + (item.estimatedPrice || 0) * (item.quantity || 1);
    }, 0);
    
    let html = `
        <div class="pantry-panel">
            <!-- AI Scanner Button -->
            <div class="pantry-ai-scanner">
                <button class="ai-scan-btn" onclick="openPantryAIScanner()">
                    <span class="ai-icon">📸</span>
                    <div class="ai-scan-text">
                        <strong>AI Matkammer-skanner</strong>
                        <small>Ta bilde av kjøleskapet ditt</small>
                    </div>
                    <span class="ai-badge">AI</span>
                </button>
            </div>
            
            <!-- Stats Bar -->
            <div class="pantry-stats-bar">
                <div class="pantry-stat-item">
                    <span class="stat-value">${state.pantryItems.length}</span>
                    <span class="stat-label">varer</span>
                </div>
                <div class="pantry-stat-item">
                    <span class="stat-value">${totalValue > 0 ? formatCurrency(totalValue) : '-'}</span>
                    <span class="stat-label">verdi</span>
                </div>
                <div class="pantry-stat-item ${expiringItems.length > 0 ? 'warning' : ''}">
                    <span class="stat-value">${expiringItems.length}</span>
                    <span class="stat-label">utløper</span>
                </div>
            </div>
            
            ${expiringItems.length > 0 || expiredItems.length > 0 ? `
                <div class="pantry-alerts">
                    ${expiredItems.length > 0 ? `
                        <div class="alert alert-danger">
                            ⚠️ ${expiredItems.length} varer har gått ut på dato!
                        </div>
                    ` : ''}
                    ${expiringItems.length > 0 ? `
                        <div class="alert alert-warning">
                            ⏰ ${expiringItems.length} varer utløper snart!
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            <div class="pantry-actions">
                <button class="add-pantry-btn" onclick="openPantryEditor()">
                    ➕ Legg til vare
                </button>
                <button class="price-check-btn" onclick="openPriceChecker()">
                    💰 Prissjekk
                </button>
            </div>
            
            <div id="pantryList" class="pantry-list">
                ${renderPantryList()}
            </div>
        </div>
    `;
    
    showModal('🫙 Mitt Matkammer', html, []);
}

function renderPantryList() {
    if (state.pantryItems.length === 0) {
        return `
            <div class="empty-state">
                <span class="empty-icon">🫙</span>
                <p>Matkammeret er tomt</p>
                <p class="empty-hint">Legg til varer for å holde oversikt over hva du har!</p>
            </div>
        `;
    }
    
    // Group by category
    const groups = {};
    state.pantryItems.forEach(item => {
        const cat = item.category || 'other';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
    });
    
    return Object.entries(groups).map(([cat, items]) => `
        <div class="pantry-group">
            <h4>${getPantryCategoryIcon(cat)} ${getPantryCategoryName(cat)}</h4>
            <div class="pantry-items">
                ${items.map(item => {
                    const expiryStatus = getExpiryStatus(item.expiryDate);
                    return `
                        <div class="pantry-item ${expiryStatus.class}" onclick="editPantryItem('${item.id}')">
                            <span class="pantry-name">${escapeHtml(item.name)}</span>
                            <span class="pantry-qty">${item.quantity || ''} ${item.unit || ''}</span>
                            ${expiryStatus.text ? `<span class="pantry-expiry">${expiryStatus.text}</span>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');
}

function getExpiryStatus(expiryDate) {
    if (!expiryDate) return { text: '', class: '' };
    
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { text: `Utløpt!`, class: 'expired' };
    if (days === 0) return { text: 'Utløper i dag!', class: 'expiring-today' };
    if (days <= 3) return { text: `${days} dager`, class: 'expiring-soon' };
    if (days <= 7) return { text: `${days} dager`, class: 'expiring-week' };
    
    return { text: new Date(expiryDate).toLocaleDateString('nb-NO'), class: '' };
}

// Pantry categories
const PANTRY_CATEGORIES = [
    { id: 'vegetables', name: 'Grønnsaker', icon: '🥬' },
    { id: 'fruits', name: 'Frukt', icon: '🍎' },
    { id: 'dairy', name: 'Meieri', icon: '🧀' },
    { id: 'meat', name: 'Kjøtt & Fisk', icon: '🥩' },
    { id: 'frozen', name: 'Frysevarer', icon: '🧊' },
    { id: 'canned', name: 'Hermetikk', icon: '🥫' },
    { id: 'grains', name: 'Korn & Pasta', icon: '🍝' },
    { id: 'spices', name: 'Krydder', icon: '🧂' },
    { id: 'baking', name: 'Bakevarer', icon: '🧁' },
    { id: 'drinks', name: 'Drikke', icon: '🍶' },
    { id: 'snacks', name: 'Snacks', icon: '🍿' },
    { id: 'condiments', name: 'Sauser', icon: '🍯' },
    { id: 'other', name: 'Annet', icon: '📦' }
];

function getPantryCategoryIcon(categoryId) {
    const cat = PANTRY_CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.icon : '📦';
}

function getPantryCategoryName(categoryId) {
    const cat = PANTRY_CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.name : 'Annet';
}

function openPantryEditor(itemId = null) {
    const item = itemId ? state.pantryItems.find(i => i.id === itemId) : null;
    const isEdit = !!item;
    
    const html = `
        <div class="pantry-editor">
            <div class="form-group">
                <label>Varenavn *</label>
                <input type="text" id="pantryItemName" value="${item?.name || ''}" placeholder="f.eks. Melk" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Antall</label>
                    <input type="number" id="pantryItemQty" value="${item?.quantity || 1}" min="0" step="0.1">
                </div>
                <div class="form-group">
                    <label>Enhet</label>
                    <select id="pantryItemUnit">
                        <option value="stk" ${item?.unit === 'stk' ? 'selected' : ''}>stk</option>
                        <option value="liter" ${item?.unit === 'liter' ? 'selected' : ''}>liter</option>
                        <option value="dl" ${item?.unit === 'dl' ? 'selected' : ''}>dl</option>
                        <option value="kg" ${item?.unit === 'kg' ? 'selected' : ''}>kg</option>
                        <option value="g" ${item?.unit === 'g' ? 'selected' : ''}>g</option>
                        <option value="pk" ${item?.unit === 'pk' ? 'selected' : ''}>pakke</option>
                        <option value="boks" ${item?.unit === 'boks' ? 'selected' : ''}>boks</option>
                        <option value="pose" ${item?.unit === 'pose' ? 'selected' : ''}>pose</option>
                        <option value="flaske" ${item?.unit === 'flaske' ? 'selected' : ''}>flaske</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label>Kategori</label>
                <select id="pantryItemCategory">
                    ${PANTRY_CATEGORIES.map(cat => `
                        <option value="${cat.id}" ${item?.category === cat.id ? 'selected' : ''}>
                            ${cat.icon} ${cat.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>Utløpsdato</label>
                <input type="date" id="pantryItemExpiry" value="${item?.expiryDate || ''}">
            </div>
            
            <div class="form-group">
                <label>Plassering</label>
                <select id="pantryItemLocation">
                    <option value="fridge" ${item?.location === 'fridge' ? 'selected' : ''}>🧊 Kjøleskap</option>
                    <option value="freezer" ${item?.location === 'freezer' ? 'selected' : ''}>❄️ Fryser</option>
                    <option value="pantry" ${item?.location === 'pantry' ? 'selected' : ''}>🗄️ Skap</option>
                    <option value="counter" ${item?.location === 'counter' ? 'selected' : ''}>🍎 Benk</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Notat</label>
                <input type="text" id="pantryItemNote" value="${item?.note || ''}" placeholder="f.eks. Åpnet 15. jan">
            </div>
            
            ${isEdit ? `
                <button class="delete-pantry-btn" onclick="deletePantryItem('${item.id}')">
                    🗑️ Slett vare
                </button>
            ` : ''}
        </div>
    `;
    
    const buttons = [
        { text: 'Avbryt', onClick: () => closeModal() },
        { 
            text: isEdit ? 'Oppdater' : 'Legg til', 
            primary: true, 
            onClick: () => savePantryItem(itemId)
        }
    ];
    
    showModal(isEdit ? '✏️ Rediger vare' : '➕ Ny vare', html, buttons);
    
    // Focus name input
    setTimeout(() => $('pantryItemName')?.focus(), 100);
}

function editPantryItem(itemId) {
    openPantryEditor(itemId);
}

async function savePantryItem(itemId = null) {
    const name = $('pantryItemName')?.value?.trim();
    if (!name) {
        showToast('Skriv inn varenavn', 'error');
        return;
    }
    
    const itemData = {
        name,
        quantity: parseFloat($('pantryItemQty')?.value) || 1,
        unit: $('pantryItemUnit')?.value || 'stk',
        category: $('pantryItemCategory')?.value || 'other',
        expiryDate: $('pantryItemExpiry')?.value || null,
        location: $('pantryItemLocation')?.value || 'pantry',
        note: $('pantryItemNote')?.value?.trim() || '',
        updatedAt: new Date().toISOString()
    };
    
    try {
        if (itemId) {
            // Update existing item
            await saveToFirestore('pantry', itemId, { ...itemData, id: itemId });
            const index = state.pantryItems.findIndex(i => i.id === itemId);
            if (index !== -1) {
                state.pantryItems[index] = { ...itemData, id: itemId };
            }
            showToast('Vare oppdatert!', 'success');
        } else {
            // Add new item
            const newId = 'pantry_' + Date.now();
            itemData.id = newId;
            itemData.createdAt = new Date().toISOString();
            await saveToFirestore('pantry', newId, itemData);
            state.pantryItems.push(itemData);
            showToast('Vare lagt til!', 'success');
            
            // Check achievement
            if (state.pantryItems.length >= 20) {
                unlockAchievement('pantryOrganizer');
            }
        }
        
        closeModal();
        openPantryTracker(); // Refresh view
        
    } catch (error) {
        console.error('Error saving pantry item:', error);
        showToast('Kunne ikke lagre vare', 'error');
    }
}

async function deletePantryItem(itemId) {
    if (!confirm('Vil du slette denne varen fra matkammeret?')) return;
    
    try {
        await deleteFromFirestore('pantry', itemId);
        state.pantryItems = state.pantryItems.filter(i => i.id !== itemId);
        showToast('Vare slettet', 'success');
        closeModal();
        openPantryTracker(); // Refresh view
    } catch (error) {
        console.error('Error deleting pantry item:', error);
        showToast('Kunne ikke slette vare', 'error');
    }
}

function usePantryItem(itemId) {
    const item = state.pantryItems.find(i => i.id === itemId);
    if (!item) return;
    
    if (item.quantity > 1) {
        item.quantity -= 1;
        saveToFirestore('pantry', itemId, item);
        showToast(`Brukte 1 ${item.unit} ${item.name}`, 'success');
    } else {
        if (confirm(`Dette var siste ${item.name}. Vil du slette den fra matkammeret?`)) {
            deletePantryItem(itemId);
        }
    }
    
    // Refresh display
    const listEl = $('pantryList');
    if (listEl) listEl.innerHTML = renderPantryList();
}

function checkExpiringItems() {
    const now = new Date();
    const expiringItems = state.pantryItems.filter(item => {
        if (!item.expiryDate) return false;
        const days = Math.ceil((new Date(item.expiryDate) - now) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 3;
    });
    
    if (expiringItems.length > 0 && state.settings.reminderNotifications) {
        notifyExpiringItems(expiringItems);
    }
    
    return expiringItems;
}

function notifyExpiringItems(items) {
    if (!state.settings.pushNotifications) return;
    
    const itemNames = items.slice(0, 3).map(i => i.name).join(', ');
    const more = items.length > 3 ? ` og ${items.length - 3} til` : '';
    
    showLocalNotification('⏰ Varer utløper snart!', {
        body: `${itemNames}${more} - sjekk matkammeret ditt`,
        tag: 'expiring-items'
    });
}

