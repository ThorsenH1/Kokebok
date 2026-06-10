// =============================================
// ===== SOCIAL FEATURES - FRIENDS SYSTEM =====
// =============================================

// Initialize social data
async function loadSocialData() {
    if (!state.user) return;
    
    try {
        // Load friends
        let friendsLoaded = false;
        try {
            console.log('🔄 Laster venneliste fra Firestore subcollection...');
            const friendsSnap = await db.collection('users').doc(state.user.uid).collection('friends').get();
            console.log(`📊 Friends subcollection: ${friendsSnap.size} dokumenter`);
            state.friends = friendsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            friendsLoaded = true;
        } catch (e) {
            console.warn('Kunne ikke lese venneliste:', e.message);
            state.friends = [];
        }
        if (!friendsLoaded || state.friends.length === 0) {
            console.log('⚠️ Ingen venner i subcollection, prøver fallback...');
            await loadFriendsFromAcceptedRequests();
        }
        
        console.log(`✓ Endelig venneliste: ${state.friends.length} venner`);
        state.friends.forEach(f => console.log(`   - ${f.displayName || f.email} (${f.friendUid})`));
        
        // Load incoming friend requests
        const requestsSnap = await db.collection('friendRequests')
            .where('toUid', '==', state.user.uid)
            .where('status', '==', 'pending')
            .get();
        state.friendRequests = requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Load sent requests
        const sentSnap = await db.collection('friendRequests')
            .where('fromUid', '==', state.user.uid)
            .where('status', '==', 'pending')
            .get();
        state.sentRequests = sentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Load shared recipes (without orderBy to avoid needing composite index)
        const sharedSnap = await db.collection('sharedRecipes')
            .where('toUid', '==', state.user.uid)
            .limit(50)
            .get();
        // Sort client-side instead
        state.sharedRecipes = sharedSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (b.sharedAt?.toMillis?.() || 0) - (a.sharedAt?.toMillis?.() || 0))
            .slice(0, 20);
        
        // Load shared cookbooks
        const sharedCookSnap = await db.collection('sharedCookbooks')
            .where('toUid', '==', state.user.uid)
            .get();
        state.sharedCookbooks = sharedCookSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (b.sharedAt?.toMillis?.() || 0) - (a.sharedAt?.toMillis?.() || 0));
        
        // Update public profile
        await updatePublicProfile();
        
        // Set up real-time listener for new requests and shares
        setupSocialListeners();
        
        console.log(`✓ Sosiale data: ${state.friends.length} venner, ${state.friendRequests.length} forespørsler`);
    } catch (e) {
        console.warn('Kunne ikke laste sosiale data:', e.message);
    }
}

async function loadFriendsFromAcceptedRequests() {
    try {
        console.log('🔍 loadFriendsFromAcceptedRequests: Søker etter aksepterte forespørsler...');
        const [fromSnap, toSnap] = await Promise.all([
            db.collection('friendRequests')
                .where('fromUid', '==', state.user.uid)
                .get(),
            db.collection('friendRequests')
                .where('toUid', '==', state.user.uid)
                .get()
        ]);

        const requestDocs = [...fromSnap.docs, ...toSnap.docs];
        console.log(`📋 Fant ${requestDocs.length} totale forespørsler (sendt: ${fromSnap.size}, mottatt: ${toSnap.size})`);
        
        if (requestDocs.length === 0) {
            console.log('❌ Ingen forespørsler funnet i databasen');
            return;
        }

        const friendUids = new Set();
        const requestMap = new Map();
        requestDocs.forEach(doc => {
            const data = doc.data();
            const statusRaw = data.status;
            const status = typeof statusRaw === 'string' ? statusRaw.toLowerCase() : statusRaw;
            const isAccepted =
                status === 'accepted' ||
                status === 'approved' ||
                status === 'ok' ||
                status === 'confirmed' ||
                status === true ||
                !!data.acceptedAt ||
                !!data.approvedAt ||
                !!data.confirmedAt;
            
            // Debug: Log each request
            console.log(`📝 Forespørsel: ${data.fromEmail} → ${data.toEmail}, status: "${statusRaw}", acceptedAt: ${data.acceptedAt ? 'JA' : 'nei'}, isAccepted: ${isAccepted}`);
            
            if (!isAccepted) {
                console.log(`   ↳ Hopper over (ikke akseptert)`);
                return;
            }
            const otherUid = data.fromUid === state.user.uid ? data.toUid : data.fromUid;
            if (otherUid) {
                friendUids.add(otherUid);
                requestMap.set(otherUid, data);
                console.log(`   ✓ Legger til som venn: ${otherUid}`);
            }
        });

        console.log(`🔢 Aksepterte forespørsler funnet: ${friendUids.size} venner å legge til`);
        
        if (friendUids.size === 0) {
            console.log('❌ Ingen aksepterte forespørsler - ingen venner å legge til');
            return;
        }

        const fallbackFriends = [];
        const batch = db.batch();
        for (const uid of friendUids) {
            const request = requestMap.get(uid) || {};
            let profile = null;
            try {
                const doc = await db.collection('publicProfiles').doc(uid).get();
                if (doc.exists) profile = doc.data();
            } catch (e) {
                // Ignore profile fetch errors
            }

            const friendData = {
                friendUid: uid,
                email: profile?.email || request.fromEmail || request.toEmail || null,
                displayName: profile?.displayName || request.fromName || 'Kokk',
                photoURL: profile?.photoURL || request.fromPhoto || null,
                addedAt: request.acceptedAt || request.createdAt || firebase.firestore.FieldValue.serverTimestamp()
            };

            const friendRef = db.collection('users').doc(state.user.uid).collection('friends').doc(uid);
            batch.set(friendRef, friendData, { merge: true });
            console.log(`📝 Forbereder batch write for venn: ${friendData.displayName} (${uid})`);

            fallbackFriends.push({
                id: uid,
                friendUid: uid,
                email: friendData.email,
                displayName: friendData.displayName,
                photoURL: friendData.photoURL,
                level: profile?.level || 1,
                recipeCount: profile?.recipeCount || 0,
                addedAt: friendData.addedAt
            });
        }

        try {
            console.log('💾 Forsøker å lagre venner til Firestore...');
            await batch.commit();
            console.log('✅ Venner lagret til Firestore!');
        } catch (e) {
            console.error('❌ FEIL ved lagring av venner til Firestore:', e.message, e);
        }

        if (fallbackFriends.length > 0) {
            console.log(`✓ Setter ${fallbackFriends.length} venner i lokal state`);
            state.friends = fallbackFriends;
        }
    } catch (e) {
        console.warn('Fallback for venner feilet:', e.message);
    }
}

// Real-time listeners for social updates
let socialListenersSetup = false;
function setupSocialListeners() {
    if (socialListenersSetup || !state.user) return;
    socialListenersSetup = true;
    
    console.log('🔄 Setter opp sanntidslyttere for sosiale data...');
    let friendsInitialSnapshot = true;
    let requestsInitialSnapshot = true;
    let sentInitialSnapshot = true;
    let sharedRecipesInitialSnapshot = true;
    let sharedCookbooksInitialSnapshot = true;
    let rebuildingFriends = false;
    
    // CRITICAL: Listen for changes to MY friends list (real-time sync when friend accepts)
    db.collection('users').doc(state.user.uid).collection('friends')
        .onSnapshot(snapshot => {
            const isInitial = friendsInitialSnapshot;
            friendsInitialSnapshot = false;
            const oldCount = state.friends.length;
            const snapshotFriends = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (snapshotFriends.length === 0 && state.friends.length > 0) {
                if (!rebuildingFriends) {
                    rebuildingFriends = true;
                    loadFriendsFromAcceptedRequests().finally(() => {
                        rebuildingFriends = false;
                        updateSocialCard();
                    });
                }
            } else {
                state.friends = snapshotFriends;
            }
            
            // Notify if a new friend was added (by someone accepting our request)
            // Only notify if initial load is complete AND this is actually a new friend
            const changes = snapshot.docChanges();
            const newFriends = changes.filter(c => c.type === 'added');
            if (!isInitial && newFriends.length > 0 && oldCount > 0) {
                const newFriend = newFriends[0].doc.data();
                showToast(`🎉 ${newFriend.displayName || newFriend.email} er nå din venn!`, 'success');
                triggerConfetti();
            }
            
            // Update UI if friends panel is open
            const friendsContent = $('friendsTabContent');
            if (friendsContent && document.querySelector('.friends-tab.active[onclick*="friends"]')) {
                friendsContent.innerHTML = renderFriendsList();
            }
            
            console.log(`✓ Venneliste oppdatert: ${state.friends.length} venner`);
        }, err => console.warn('Friends listener error:', err.message));
    
    // Listen for new friend requests TO me
    db.collection('friendRequests')
        .where('toUid', '==', state.user.uid)
        .where('status', '==', 'pending')
        .onSnapshot(snapshot => {
            const isInitial = requestsInitialSnapshot;
            requestsInitialSnapshot = false;
            const changes = snapshot.docChanges();
            const newRequests = changes.filter(c => c.type === 'added');
            
            // Only notify if initial load is complete
            if (!isInitial && newRequests.length > 0) {
                showToast('📬 Ny venneforespørsel!', 'info');
            }
            
            state.friendRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateFriendNotificationBadge();
            
            // Update UI if requests panel is open
            const friendsContent = $('friendsTabContent');
            if (friendsContent && document.querySelector('.friends-tab.active[onclick*="requests"]')) {
                friendsContent.innerHTML = renderFriendRequests();
            }
        }, err => console.warn('Friend request listener error:', err.message));
    
    // Listen for MY sent requests (to see when they're accepted/declined)
    db.collection('friendRequests')
        .where('fromUid', '==', state.user.uid)
        .onSnapshot(snapshot => {
            if (sentInitialSnapshot) {
                sentInitialSnapshot = false;
            }
            state.sentRequests = snapshot.docs
                .filter(doc => doc.data().status === 'pending')
                .map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Update UI if requests panel is open
            const friendsContent = $('friendsTabContent');
            if (friendsContent && document.querySelector('.friends-tab.active[onclick*="requests"]')) {
                friendsContent.innerHTML = renderFriendRequests();
            }
        }, err => console.warn('Sent requests listener error:', err.message));
    
    // Listen for new shared recipes (without orderBy to avoid composite index)
    db.collection('sharedRecipes')
        .where('toUid', '==', state.user.uid)
        .limit(50)
        .onSnapshot(snapshot => {
            const isInitial = sharedRecipesInitialSnapshot;
            sharedRecipesInitialSnapshot = false;
            const changes = snapshot.docChanges();
            const newShares = changes.filter(c => c.type === 'added');
            
            // Only notify if initial load is complete
            if (!isInitial && newShares.length > 0) {
                const share = newShares[0].doc.data();
                showToast(`🎁 ${share.fromName} delte en oppskrift med deg!`, 'success');
            }
            
            // Sort client-side
            state.sharedRecipes = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => (b.sharedAt?.toMillis?.() || 0) - (a.sharedAt?.toMillis?.() || 0))
                .slice(0, 20);
            updateFriendNotificationBadge();
        }, err => console.warn('Shared recipes listener error:', err.message));

    // Listen for new shared cookbooks
    db.collection('sharedCookbooks')
        .where('toUid', '==', state.user.uid)
        .onSnapshot(snapshot => {
            const isInitial = sharedCookbooksInitialSnapshot;
            sharedCookbooksInitialSnapshot = false;
            const changes = snapshot.docChanges();
            const newShares = changes.filter(c => c.type === 'added');
            
            // Only notify if initial load is complete
            if (!isInitial && newShares.length > 0) {
                const share = newShares[0].doc.data();
                showToast(`📚 ${share.fromName} delte kokeboken "${share.cookbookName}" med deg!`, 'success');
                notifySharedCookbook(share.fromName, share.cookbookName);
            }
            
            state.sharedCookbooks = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => (b.sharedAt?.toMillis?.() || 0) - (a.sharedAt?.toMillis?.() || 0));
            updateFriendNotificationBadge();
        }, err => console.warn('Shared cookbooks listener error:', err.message));
    
    console.log('✓ Alle sanntidslyttere aktivert');
}

// Update public profile for leaderboard/friends
async function updatePublicProfile() {
    if (!state.user) return;
    
    const playerLevel = getPlayerLevel();
    const achievements = JSON.parse(localStorage.getItem('kokebok_achievements') || '[]');
    const streak = parseInt(localStorage.getItem('kokebok_streak') || '0');
    const cookingStreak = parseInt(localStorage.getItem('kokebok_cooking_streak') || '0');
    const totalCooked = parseInt(localStorage.getItem('kokebok_total_cooked') || '0');
    
    try {
        await db.collection('publicProfiles').doc(state.user.uid).set({
            uid: state.user.uid, // REQUIRED for Firebase security rules!
            displayName: state.user.displayName || 'Anonym kokk',
            email: state.user.email.toLowerCase(), // Normalize for search
            photoURL: state.user.photoURL || null,
            level: playerLevel.level,
            xp: playerLevel.xp,
            achievementCount: achievements.length,
            recipeCount: state.recipes.length,
            streak: streak,
            cookingStreak: cookingStreak,
            totalCooked: totalCooked,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isPublic: state.settings.profilePublic !== false
        }, { merge: true });
        console.log('✓ Public profile updated');
    } catch (e) {
        console.warn('Kunne ikke oppdatere profil:', e.message);
    }
}

// Open friends panel
function openFriendsPanel() {
    const pendingCount = state.friendRequests.length;
    const sharedCount = state.sharedRecipes.filter(r => !r.viewed).length +
        state.sharedCookbooks.filter(s => !s.viewed && !s.accepted).length;
    
    const html = `
        <div class="friends-panel">
            <div class="friends-tabs">
                <button class="friends-tab active" onclick="switchFriendsTab('friends')">
                    👥 Venner <span class="tab-count">${state.friends.length}</span>
                </button>
                <button class="friends-tab" onclick="switchFriendsTab('requests')">
                    📬 Forespørsler ${pendingCount > 0 ? `<span class="tab-badge">${pendingCount}</span>` : ''}
                </button>
                <button class="friends-tab" onclick="switchFriendsTab('shared')">
                    🎁 Delt ${sharedCount > 0 ? `<span class="tab-badge">${sharedCount}</span>` : ''}
                </button>
                <button class="friends-tab" onclick="switchFriendsTab('leaderboard')">
                    🏆 Toppliste
                </button>
            </div>
            
            <div id="friendsTabContent">
                ${renderFriendsList()}
            </div>
        </div>
    `;
    
    showModal('👥 Venner & Sosialt', html, []);
}
window.openFriendsPanel = openFriendsPanel;

function switchFriendsTab(tab) {
    document.querySelectorAll('.friends-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.friends-tab[onclick*="${tab}"]`)?.classList.add('active');
    
    const content = $('friendsTabContent');
    if (!content) return;
    
    switch(tab) {
        case 'friends':
            content.innerHTML = renderFriendsList();
            break;
        case 'requests':
            content.innerHTML = renderFriendRequests();
            break;
        case 'shared':
            content.innerHTML = renderSharedContent();
            markSharedCookbooksViewed();
            break;
        case 'leaderboard':
            content.innerHTML = '<div class="loading-spinner">Laster toppliste...</div>';
            loadLeaderboard().then(html => content.innerHTML = html);
            break;
    }
}
window.switchFriendsTab = switchFriendsTab;

// ===== COOKBOOK SHARING =====

// Open cookbook sharing modal
function shareBookWithFriends() {
    if (!state.currentBook) {
        showToast('Velg en kokebok først', 'warning');
        return;
    }
    
    const book = state.currentBook;
    const friendsList = state.friends.map(f => `
        <div class="friend-checkbox">
            <input type="checkbox" id="friend_${f.id}" value="${f.friendUid}">
            <label for="friend_${f.id}">
                ${f.photoURL ? `<img src="${f.photoURL}" class="friend-avatar">` : '👤'}
                ${escapeHtml(f.displayName)}
            </label>
        </div>
    `).join('');
    
    if (state.friends.length === 0) {
        showToast('Du må ha venner for å dele kokeboken', 'info');
        return;
    }
    
    const html = `
        <div class="share-cookbook-modal">
            <h3>📚 Del kokebok: ${escapeHtml(book.name)}</h3>
            <p>Velg venner du vil dele denne kokeboken med:</p>
            
            <div class="share-friends-list">
                ${friendsList}
            </div>
            
            <textarea id="shareMessage" placeholder="Legg til en melding (valgfritt)" class="share-message" maxlength="200"></textarea>
            
            <div class="modal-actions">
                <button onclick="confirmShareBook('${book.id}')" class="btn-primary">Del kokebok</button>
                <button onclick="closeGenericModal()" class="btn-secondary">Avbryt</button>
            </div>
        </div>
    `;
    
    showModal('📚 Del kokebok', html, []);
}
window.shareBookWithFriends = shareBookWithFriends;

// Confirm and share cookbook
async function confirmShareBook(bookId) {
    const book = state.books.find(b => b.id === bookId);
    if (!book) return;
    
    // Get selected friends
    const selectedFriends = Array.from(document.querySelectorAll('.friend-checkbox input:checked'))
        .map(input => input.value);
    
    if (selectedFriends.length === 0) {
        showToast('Velg minst en venn', 'warning');
        return;
    }
    
    const message = document.getElementById('shareMessage')?.value || '';
    
    try {
        // Share with each selected friend
        for (const friendUid of selectedFriends) {
            const friend = state.friends.find(f => f.friendUid === friendUid);
            if (!friend) continue;
            
            // Get all recipes in this book
            const cookbookRecipes = state.recipes.filter(r => r.bookId === bookId);
            
            await db.collection('sharedCookbooks').add({
                fromUid: state.user.uid,
                fromName: state.user.displayName,
                fromPhoto: state.user.photoURL,
                toUid: friendUid,
                toName: friend.displayName,
                toEmail: friend.email,
                cookbookId: bookId,
                cookbookName: book.name,
                cookbookDescription: book.description || '',
                recipeCount: cookbookRecipes.length,
                message: message,
                recipes: cookbookRecipes.map(r => ({
                    id: r.id,
                    name: r.name,
                    category: r.category,
                    ingredients: r.ingredients,
                    instructions: r.instructions,
                    servings: r.servings,
                    prepTime: r.prepTime,
                    cookTime: r.cookTime,
                    images: r.images?.slice(0, 1) || []
                })),
                sharedAt: firebase.firestore.FieldValue.serverTimestamp(),
                accepted: false,
                viewed: false
            });
        }
        
        closeGenericModal();
        showToast(`📚 Kokebok delt med ${selectedFriends.length} venn${selectedFriends.length > 1 ? 'er' : ''}! 🎉`, 'success');
        addXP(10, 'Delt kokebok med venn');
        
    } catch (e) {
        console.error('Share book error:', e);
        showToast('Kunne ikke dele kokeboken', 'error');
    }
}
window.confirmShareBook = confirmShareBook;

// Accept shared cookbook
async function acceptSharedCookbook(shareId) {
    const share = state.sharedCookbooks.find(s => s.id === shareId);
    if (!share) return;
    
    try {
        // Create new cookbook from shared data
        const newBook = {
            name: `${share.cookbookName} (fra ${share.fromName})`,
            description: share.cookbookDescription,
            fromFriend: share.fromName,
            sharedFrom: share.fromUid,
            sharedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        const bookId = await saveToFirestore('books', null, newBook);
        const newBook_full = { id: bookId, ...newBook };
        state.books.push(newBook_full);
        
        // Add all recipes to this new book
        for (const recipeData of (share.recipes || [])) {
            const newRecipe = {
                ...recipeData,
                bookId: bookId,
                copiedFrom: share.fromUid,
                createdAt: new Date().toISOString()
            };
            const recipeId = await saveToFirestore('recipes', null, newRecipe);
            state.recipes.push({ id: recipeId, ...newRecipe });
        }
        
        // Mark as accepted
        await db.collection('sharedCookbooks').doc(shareId).update({
            accepted: true,
            acceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
            viewed: true
        });
        share.accepted = true;
        share.viewed = true;
        
        showToast(`📚 Kokebok "${share.cookbookName}" mottatt! 🎉`, 'success');
        triggerConfetti();
        addXP(5, 'Akseptert delt kokebok');
        
        // Refresh view
        renderBookList();
        updateFriendNotificationBadge();
        
    } catch (e) {
        console.error('Accept cookbook error:', e);
        showToast('Kunne ikke motta kokeboken', 'error');
    }
}
window.acceptSharedCookbook = acceptSharedCookbook;

// Reject shared cookbook
async function rejectSharedCookbook(shareId) {
    try {
        await db.collection('sharedCookbooks').doc(shareId).delete();
        state.sharedCookbooks = state.sharedCookbooks.filter(s => s.id !== shareId);
        showToast('Kokebok avslått', 'info');
        updateFriendNotificationBadge();
    } catch (e) {
        console.error('Reject cookbook error:', e);
    }
}
window.rejectSharedCookbook = rejectSharedCookbook;

// Mark shared cookbooks as viewed
async function markSharedCookbooksViewed() {
    const unviewed = state.sharedCookbooks.filter(s => !s.viewed);
    if (unviewed.length === 0) return;
    
    for (const share of unviewed) {
        try {
            await db.collection('sharedCookbooks').doc(share.id).update({ viewed: true });
            share.viewed = true;
        } catch (e) {}
    }
    updateFriendNotificationBadge();
}

// Render friends list
function renderFriendsList() {
    let html = `
        <div class="add-friend-section">
            <h4>➕ Legg til venn</h4>
            <div class="add-friend-form">
                <input type="email" id="friendEmailInput" placeholder="Vennens e-postadresse..." class="friend-input">
                <button class="btn btn-primary" onclick="sendFriendRequest()">Send forespørsel</button>
            </div>
        </div>
    `;
    
    if (state.friends.length === 0) {
        html += `
            <div class="empty-state">
                <span class="empty-icon">👥</span>
                <p>Du har ingen venner ennå</p>
                <p class="empty-hint">Legg til venner med e-postadressen deres for å dele oppskrifter og konkurrere!</p>
            </div>
        `;
    } else {
        html += `<div class="friends-list">`;
        for (const friend of state.friends) {
            html += `
                <div class="friend-card" data-uid="${friend.friendUid}">
                    <div class="friend-avatar">
                        ${friend.photoURL ? `<img src="${friend.photoURL}" alt="">` : '👤'}
                    </div>
                    <div class="friend-info">
                        <span class="friend-name">${escapeHtml(friend.displayName || 'Kokk')}</span>
                        <span class="friend-stats">
                            Nivå ${friend.level || 1} • ${friend.recipeCount || 0} oppskrifter
                        </span>
                    </div>
                    <div class="friend-actions">
                        <button class="btn-icon" onclick="viewFriendProfile('${friend.friendUid}')" title="Se profil">👁️</button>
                        <button class="btn-icon" onclick="shareRecipeWithFriend('${friend.friendUid}')" title="Del oppskrift">📤</button>
                        <button class="btn-icon danger" onclick="removeFriend('${friend.id}')" title="Fjern venn">❌</button>
                    </div>
                </div>
            `;
        }
        html += `</div>`;
    }
    
    return html;
}

// Render friend requests
function renderFriendRequests() {
    let html = '';
    
    // Incoming requests
    html += `<h4>📥 Innkommende forespørsler</h4>`;
    if (state.friendRequests.length === 0) {
        html += `<p class="empty-hint">Ingen ventende forespørsler</p>`;
    } else {
        html += `<div class="requests-list">`;
        for (const req of state.friendRequests) {
            html += `
                <div class="request-card">
                    <div class="request-avatar">
                        ${req.fromPhoto ? `<img src="${req.fromPhoto}" alt="">` : '👤'}
                    </div>
                    <div class="request-info">
                        <span class="request-name">${escapeHtml(req.fromName || 'Kokk')}</span>
                        <span class="request-email">${escapeHtml(req.fromEmail)}</span>
                    </div>
                    <div class="request-actions">
                        <button class="btn btn-primary btn-sm" onclick="acceptFriendRequest('${req.id}')">✓ Godta</button>
                        <button class="btn btn-secondary btn-sm" onclick="declineFriendRequest('${req.id}')">✕ Avslå</button>
                    </div>
                </div>
            `;
        }
        html += `</div>`;
    }
    
    // Sent requests
    html += `<h4 style="margin-top: 24px;">📤 Sendte forespørsler</h4>`;
    if (state.sentRequests.length === 0) {
        html += `<p class="empty-hint">Ingen ventende forespørsler sendt</p>`;
    } else {
        html += `<div class="requests-list">`;
        for (const req of state.sentRequests) {
            html += `
                <div class="request-card sent">
                    <div class="request-info">
                        <span class="request-name">Til: ${escapeHtml(req.toEmail)}</span>
                        <span class="request-status">⏳ Venter på svar</span>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="cancelFriendRequest('${req.id}')">Avbryt</button>
                </div>
            `;
        }
        html += `</div>`;
    }
    
    return html;
}

// Render shared recipes
function renderSharedRecipes() {
    if (state.sharedRecipes.length === 0) {
        return `
            <div class="empty-state">
                <span class="empty-icon">🎁</span>
                <p>Ingen delte oppskrifter</p>
                <p class="empty-hint">Når venner deler oppskrifter med deg, vises de her!</p>
            </div>
        `;
    }
    
    let html = `<div class="shared-recipes-list">`;
    for (const shared of state.sharedRecipes) {
        const isNew = !shared.viewed;
        html += `
            <div class="shared-recipe-card ${isNew ? 'new' : ''}" onclick="viewSharedRecipe('${shared.id}')">
                ${isNew ? '<span class="new-badge">NY!</span>' : ''}
                <div class="shared-recipe-content">
                    <span class="shared-recipe-name">${escapeHtml(shared.recipeName)}</span>
                    <span class="shared-recipe-from">Fra: ${escapeHtml(shared.fromName)}</span>
                    <span class="shared-recipe-date">${formatDate(shared.sharedAt?.toDate?.() || new Date())}</span>
                </div>
                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); saveSharedRecipe('${shared.id}')">
                    💾 Lagre
                </button>
            </div>
        `;
    }
    html += `</div>`;
    
    return html;
}

// Render shared cookbooks
function renderSharedCookbooks() {
    if (state.sharedCookbooks.length === 0) {
        return `
            <div class="empty-state">
                <span class="empty-icon">📚</span>
                <p>Ingen delte kokebøker</p>
                <p class="empty-hint">Når venner deler kokebøker med deg, vises de her!</p>
            </div>
        `;
    }
    
    let html = `<div class="shared-cookbooks-list">`;
    for (const share of state.sharedCookbooks) {
        const isNew = !share.viewed && !share.accepted;
        const isAccepted = share.accepted;
        html += `
            <div class="shared-cookbook-card ${isNew ? 'new' : ''} ${isAccepted ? 'accepted' : ''}">
                ${isNew ? '<span class="new-badge">NY!</span>' : ''}
                ${isAccepted ? '<span class="accepted-badge">✓ Mottatt</span>' : ''}
                <div class="shared-cookbook-header">
                    <div class="shared-cookbook-info">
                        <h4>${escapeHtml(share.cookbookName)}</h4>
                        <p class="shared-from">Fra: ${escapeHtml(share.fromName)}</p>
                        <p class="recipe-count">📖 ${share.recipeCount} oppskrifter</p>
                    </div>
                    <div class="shared-cookbook-avatar">
                        ${share.fromPhoto ? `<img src="${share.fromPhoto}" alt="">` : '👤'}
                    </div>
                </div>
                ${share.message ? `<p class="share-message">"${escapeHtml(share.message)}"</p>` : ''}
                <div class="shared-cookbook-actions">
                    ${!isAccepted ? `
                        <button class="btn btn-primary btn-sm" onclick="acceptSharedCookbook('${share.id}')">
                            ✓ Godta
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="rejectSharedCookbook('${share.id}')">
                            ✗ Avslå
                        </button>
                    ` : `
                        <span class="accepted-text">Du har mottatt denne kokeboken</span>
                    `}
                </div>
            </div>
        `;
    }
    html += `</div>`;
    
    return html;
}

// Shared tab content (recipes + cookbooks)
function renderSharedContent() {
    const cookbooksHtml = renderSharedCookbooks();
    const recipesHtml = renderSharedRecipes();
    
    return `
        <div class="shared-section">
            <h4>📚 Delte kokebøker</h4>
            ${cookbooksHtml}
        </div>
        <div class="shared-section" style="margin-top: 24px;">
            <h4>🎁 Delte oppskrifter</h4>
            ${recipesHtml}
        </div>
    `;
}

// Load leaderboard
async function loadLeaderboard() {
    try {
        // Get public profiles and sort client-side to avoid composite index requirement
        const snapshot = await db.collection('publicProfiles')
            .where('isPublic', '==', true)
            .limit(100)
            .get();
        
        let profiles = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        
        // Sort by XP descending (client-side to avoid composite index)
        profiles.sort((a, b) => (b.xp || 0) - (a.xp || 0));
        
        // Take top 20
        profiles = profiles.slice(0, 20);
        
        // Find current user's rank
        let userRank = profiles.findIndex(p => p.uid === state.user?.uid) + 1;
        
        let html = `
            <div class="leaderboard">
                <div class="leaderboard-header">
                    <h4>🏆 Global toppliste</h4>
                    ${userRank > 0 ? `<span class="your-rank">Din plassering: #${userRank}</span>` : ''}
                </div>
                <div class="leaderboard-list">
        `;
        
        profiles.forEach((profile, index) => {
            const isMe = profile.uid === state.user?.uid;
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            
            html += `
                <div class="leaderboard-item ${isMe ? 'is-me' : ''}">
                    <span class="leaderboard-rank">${medal}</span>
                    <div class="leaderboard-avatar">
                        ${profile.photoURL ? `<img src="${profile.photoURL}" alt="">` : '👤'}
                    </div>
                    <div class="leaderboard-info">
                        <span class="leaderboard-name">${escapeHtml(profile.displayName || 'Kokk')} ${isMe ? '(deg)' : ''}</span>
                        <span class="leaderboard-stats">
                            Nivå ${profile.level} • ${profile.xp} XP • ${profile.recipeCount} oppskrifter
                        </span>
                    </div>
                    <div class="leaderboard-badges">
                        🏅 ${profile.achievementCount || 0}
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
                <div class="leaderboard-friends">
                    <h4>👥 Blant venner</h4>
                    ${await renderFriendsLeaderboard()}
                </div>
            </div>
        `;
        
        return html;
    } catch (e) {
        console.error('Leaderboard error:', e);
        return `<p class="error">Kunne ikke laste topplisten</p>`;
    }
}

// Render friends leaderboard
async function renderFriendsLeaderboard() {
    if (state.friends.length === 0) {
        return `<p class="empty-hint">Legg til venner for å sammenligne!</p>`;
    }
    
    // Get friend profiles
    const friendProfiles = [];
    for (const friend of state.friends) {
        try {
            const doc = await db.collection('publicProfiles').doc(friend.friendUid).get();
            if (doc.exists) {
                friendProfiles.push({ uid: friend.friendUid, ...doc.data() });
            }
        } catch (e) {
            // Skip
        }
    }
    
    // Add current user
    const playerLevel = getPlayerLevel();
    friendProfiles.push({
        uid: state.user.uid,
        displayName: state.user.displayName,
        photoURL: state.user.photoURL,
        level: playerLevel.level,
        xp: playerLevel.xp,
        recipeCount: state.recipes.length,
        achievementCount: JSON.parse(localStorage.getItem('kokebok_achievements') || '[]').length
    });
    
    // Sort by XP
    friendProfiles.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    
    let html = '<div class="friends-leaderboard">';
    friendProfiles.forEach((profile, index) => {
        const isMe = profile.uid === state.user?.uid;
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        
        html += `
            <div class="leaderboard-item ${isMe ? 'is-me' : ''}">
                <span class="leaderboard-rank">${medal}</span>
                <span class="leaderboard-name">${escapeHtml(profile.displayName || 'Kokk')} ${isMe ? '(deg)' : ''}</span>
                <span class="leaderboard-xp">${profile.xp || 0} XP</span>
            </div>
        `;
    });
    html += '</div>';
    
    return html;
}

// Send friend request
async function sendFriendRequest() {
    const emailInput = $('friendEmailInput');
    const email = emailInput?.value?.trim().toLowerCase();
    
    if (!email) {
        showToast('Skriv inn en e-postadresse', 'error');
        return;
    }
    
    if (email === state.user.email.toLowerCase()) {
        showToast('Du kan ikke legge til deg selv som venn!', 'error');
        return;
    }
    
    // Check if already friends
    if (state.friends.some(f => f.email?.toLowerCase() === email)) {
        showToast('Dere er allerede venner!', 'info');
        return;
    }
    
    // Check if request already sent
    if (state.sentRequests.some(r => r.toEmail?.toLowerCase() === email)) {
        showToast('Forespørsel allerede sendt!', 'info');
        return;
    }
    
    try {
        // Find user by email
        const userSnap = await db.collection('publicProfiles')
            .where('email', '==', email)
            .limit(1)
            .get();
        
        if (userSnap.empty) {
            showToast('Fant ingen bruker med denne e-posten. Inviter dem til å laste ned appen!', 'warning');
            return;
        }
        
        const toUser = userSnap.docs[0];
        
        // Create friend request
        await db.collection('friendRequests').add({
            fromUid: state.user.uid,
            fromEmail: state.user.email,
            fromName: state.user.displayName,
            fromPhoto: state.user.photoURL,
            toUid: toUser.id,
            toEmail: email,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        emailInput.value = '';
        showToast('Venneforespørsel sendt! 🎉', 'success');
        
        // Reload
        await loadSocialData();
        switchFriendsTab('requests');
        
    } catch (e) {
        console.error('Friend request error:', e);
        showToast('Kunne ikke sende forespørsel', 'error');
    }
}
window.sendFriendRequest = sendFriendRequest;

// Accept friend request - COMPLETELY REWRITTEN for proper two-way friendship
async function acceptFriendRequest(requestId) {
    const request = state.friendRequests.find(r => r.id === requestId);
    if (!request) {
        console.error('Friend request not found:', requestId);
        showToast('Forespørsel ikke funnet', 'error');
        return;
    }
    
    console.log('🤝 Godtar venneforespørsel fra:', request.fromName);
    
    // Show loading state
    const btn = document.querySelector(`button[onclick*="acceptFriendRequest('${requestId}')"]`);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-small"></span>';
    }
    
    try {
        // Use a batch write to ensure BOTH friend entries are created atomically
        const batch = db.batch();
        
        // 1. Update the friend request status
        const requestRef = db.collection('friendRequests').doc(requestId);
        batch.update(requestRef, {
            status: 'accepted',
            acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // 2. Add friend to MY list (I'm accepting, so request.fromUid is my new friend)
        const myFriendRef = db.collection('users').doc(state.user.uid).collection('friends').doc();
        batch.set(myFriendRef, {
            friendUid: request.fromUid,
            email: request.fromEmail,
            displayName: request.fromName,
            photoURL: request.fromPhoto || null,
            addedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // 3. Add ME to THEIR list (so it's two-way!)
        const theirFriendRef = db.collection('users').doc(request.fromUid).collection('friends').doc();
        batch.set(theirFriendRef, {
            friendUid: state.user.uid,
            email: state.user.email,
            displayName: state.user.displayName || 'Anonym',
            photoURL: state.user.photoURL || null,
            addedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Commit the batch - all or nothing
        await batch.commit();
        
        console.log('✓ Toveis vennskap opprettet!');
        
        // Update local state (real-time listener will also update, but this is faster)
        state.friendRequests = state.friendRequests.filter(r => r.id !== requestId);
        state.friends.push({
            id: myFriendRef.id,
            friendUid: request.fromUid,
            email: request.fromEmail,
            displayName: request.fromName,
            photoURL: request.fromPhoto,
            addedAt: new Date()
        });
        
        // Show success
        showToast(`Du er nå venn med ${request.fromName}! 🎉`, 'success');
        triggerConfetti();
        switchFriendsTab('friends');
        
        // Check achievements
        if (state.friends.length === 1) {
            unlockAchievement('firstFriend');
        }
        if (state.friends.length >= 5) {
            unlockAchievement('socialButterfly');
        }
        
    } catch (e) {
        console.error('Accept friend error:', e);
        
        // Re-enable button
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '✓ Godta';
        }
        
        // Show detailed error
        if (e.code === 'permission-denied') {
            showToast('Ingen tilgang - sjekk at du er logget inn', 'error');
        } else if (e.code === 'not-found') {
            showToast('Forespørselen finnes ikke lenger', 'error');
            // Remove from local state
            state.friendRequests = state.friendRequests.filter(r => r.id !== requestId);
            switchFriendsTab('requests');
        } else {
            showToast('Kunne ikke godta forespørselen: ' + e.message, 'error');
        }
    }
}
window.acceptFriendRequest = acceptFriendRequest;

// Decline friend request
async function declineFriendRequest(requestId) {
    try {
        await db.collection('friendRequests').doc(requestId).update({
            status: 'declined'
        });
        
        await loadSocialData();
        switchFriendsTab('requests');
        showToast('Forespørsel avslått');
    } catch (e) {
        showToast('Kunne ikke avslå forespørselen', 'error');
    }
}
window.declineFriendRequest = declineFriendRequest;

// Cancel sent request
async function cancelFriendRequest(requestId) {
    try {
        await db.collection('friendRequests').doc(requestId).delete();
        
        await loadSocialData();
        switchFriendsTab('requests');
        showToast('Forespørsel kansellert');
    } catch (e) {
        showToast('Kunne ikke kansellere forespørselen', 'error');
    }
}
window.cancelFriendRequest = cancelFriendRequest;

// Remove friend
async function removeFriend(friendDocId) {
    if (!confirm('Er du sikker på at du vil fjerne denne vennen?')) return;
    
    try {
        await db.collection('users').doc(state.user.uid).collection('friends').doc(friendDocId).delete();
        
        await loadSocialData();
        switchFriendsTab('friends');
        showToast('Venn fjernet');
    } catch (e) {
        showToast('Kunne ikke fjerne vennen', 'error');
    }
}
window.removeFriend = removeFriend;

// View friend profile
async function viewFriendProfile(friendUid) {
    try {
        const doc = await db.collection('publicProfiles').doc(friendUid).get();
        if (!doc.exists) {
            showToast('Profil ikke funnet', 'error');
            return;
        }
        
        const profile = doc.data();
        const achievements = await getFriendAchievements(friendUid);
        
        const html = `
            <div class="friend-profile">
                <div class="profile-header">
                    <div class="profile-avatar-large">
                        ${profile.photoURL ? `<img src="${profile.photoURL}" alt="">` : '👤'}
                    </div>
                    <div class="profile-details">
                        <h2>${escapeHtml(profile.displayName || 'Kokk')}</h2>
                        <div class="profile-level">
                            <span class="level-badge-large">Nivå ${profile.level || 1}</span>
                            <span class="xp-text">${profile.xp || 0} XP</span>
                        </div>
                    </div>
                </div>
                
                <div class="profile-stats-grid">
                    <div class="profile-stat">
                        <span class="stat-value">${profile.recipeCount || 0}</span>
                        <span class="stat-label">Oppskrifter</span>
                    </div>
                    <div class="profile-stat">
                        <span class="stat-value">${profile.achievementCount || 0}</span>
                        <span class="stat-label">Prestasjoner</span>
                    </div>
                    <div class="profile-stat">
                        <span class="stat-value">🔥 ${profile.cookingStreak || 0}</span>
                        <span class="stat-label">Cooking streak</span>
                    </div>
                    <div class="profile-stat">
                        <span class="stat-value">${profile.totalCooked || 0}</span>
                        <span class="stat-label">Retter laget</span>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button class="btn btn-primary" onclick="shareRecipeWithFriend('${friendUid}')">
                        📤 Del oppskrift
                    </button>
                    <button class="btn btn-secondary" onclick="challengeFriend('${friendUid}')">
                        ⚔️ Utfordre
                    </button>
                </div>
            </div>
        `;
        
        showModal(`👤 ${profile.displayName || 'Profil'}`, html, []);
        
    } catch (e) {
        console.error('View profile error:', e);
        showToast('Kunne ikke laste profilen', 'error');
    }
}
window.viewFriendProfile = viewFriendProfile;

// Get friend's achievements (placeholder - would need Firestore storage)
async function getFriendAchievements(friendUid) {
    // In a full implementation, achievements would be stored in Firestore
    return [];
}

// Share recipe with friend
function shareRecipeWithFriend(friendUid) {
    if (state.recipes.length === 0) {
        showToast('Du har ingen oppskrifter å dele', 'warning');
        return;
    }
    
    const friend = state.friends.find(f => f.friendUid === friendUid);
    const friendName = friend?.displayName || 'venn';
    
    let html = `
        <div class="share-recipe-picker">
            <h4>Velg oppskrift å dele med ${escapeHtml(friendName)}</h4>
            <div class="recipe-picker-list">
    `;
    
    for (const recipe of state.recipes) {
        html += `
            <div class="recipe-picker-item" onclick="confirmShareRecipe('${recipe.id}', '${friendUid}')">
                <span class="recipe-picker-name">${escapeHtml(recipe.name)}</span>
                <span class="recipe-picker-icon">📤</span>
            </div>
        `;
    }
    
    html += `</div></div>`;
    
    showModal('📤 Del oppskrift', html, []);
}
window.shareRecipeWithFriend = shareRecipeWithFriend;

// Confirm and share recipe
async function confirmShareRecipe(recipeId, friendUid) {
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    try {
        await db.collection('sharedRecipes').add({
            fromUid: state.user.uid,
            fromName: state.user.displayName,
            fromPhoto: state.user.photoURL,
            toUid: friendUid,
            recipeName: recipe.name,
            recipeData: {
                name: recipe.name,
                category: recipe.category,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                servings: recipe.servings,
                prepTime: recipe.prepTime,
                notes: recipe.notes,
                tags: recipe.tags,
                images: recipe.images?.slice(0, 2) || [] // Limit images
            },
            sharedAt: firebase.firestore.FieldValue.serverTimestamp(),
            viewed: false
        });
        
        closeModal();
        showToast(`"${recipe.name}" delt! 🎉`, 'success');
        
        // Achievement
        const earned = JSON.parse(localStorage.getItem('kokebok_achievements') || '[]');
        if (!earned.includes('firstShare')) {
            unlockAchievement('firstShare');
        }
        
        addXP(10, 'Delte oppskrift');
        
    } catch (e) {
        console.error('Share recipe error:', e);
        showToast('Kunne ikke dele oppskriften', 'error');
    }
}
window.confirmShareRecipe = confirmShareRecipe;

// View shared recipe
async function viewSharedRecipe(sharedId) {
    const shared = state.sharedRecipes.find(r => r.id === sharedId);
    if (!shared) return;
    
    // Mark as viewed
    if (!shared.viewed) {
        try {
            await db.collection('sharedRecipes').doc(sharedId).update({ viewed: true });
            shared.viewed = true;
        } catch (e) {}
    }
    
    const recipe = shared.recipeData;
    
    const html = `
        <div class="shared-recipe-view">
            <div class="shared-from-banner">
                🎁 Delt fra ${escapeHtml(shared.fromName)}
            </div>
            
            <h2>${escapeHtml(recipe.name)}</h2>
            
            ${recipe.images?.length > 0 ? `
                <div class="shared-recipe-image">
                    <img src="${recipe.images[0]}" alt="${recipe.name}">
                </div>
            ` : ''}
            
            <div class="recipe-details-row">
                ${recipe.servings ? `<span>👥 ${escapeHtml(recipe.servings)}</span>` : ''}
                ${recipe.prepTime ? `<span>⏱️ ${escapeHtml(recipe.prepTime)}</span>` : ''}
            </div>
            
            ${recipe.ingredients ? `
                <div class="recipe-section">
                    <h4>🥄 Ingredienser</h4>
                    <pre>${escapeHtml(recipe.ingredients)}</pre>
                </div>
            ` : ''}
            
            ${recipe.instructions ? `
                <div class="recipe-section">
                    <h4>👩‍🍳 Fremgangsmåte</h4>
                    <pre>${escapeHtml(recipe.instructions)}</pre>
                </div>
            ` : ''}
            
            <div class="shared-recipe-actions">
                <button class="btn btn-primary" onclick="saveSharedRecipe('${sharedId}')">
                    💾 Lagre i min kokebok
                </button>
            </div>
        </div>
    `;
    
    showModal('🎁 Delt oppskrift', html, []);
}
window.viewSharedRecipe = viewSharedRecipe;

// Save shared recipe to own collection
async function saveSharedRecipe(sharedId) {
    const shared = state.sharedRecipes.find(r => r.id === sharedId);
    if (!shared) return;
    
    const recipe = shared.recipeData;
    
    try {
        // Add to own recipes
        const newRecipe = {
            ...recipe,
            source: `Delt fra ${shared.fromName}`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const id = await saveToFirestore('recipes', null, newRecipe);
        state.recipes.push({ id, ...newRecipe, createdAt: { toDate: () => new Date() } });
        
        closeModal();
        showToast(`"${recipe.name}" lagret i din kokebok! 🎉`, 'success');
        
        addXP(5, 'Lagret delt oppskrift');
        checkAchievements();
        
    } catch (e) {
        console.error('Save shared recipe error:', e);
        showToast('Kunne ikke lagre oppskriften', 'error');
    }
}
window.saveSharedRecipe = saveSharedRecipe;

// Challenge friend (placeholder)
function challengeFriend(friendUid) {
    const friend = state.friends.find(f => f.friendUid === friendUid);
    const friendName = friend?.displayName || 'venn';
    
    showToast(`Utfordringsfunksjonen kommer snart! 🎯`, 'info');
}
window.challengeFriend = challengeFriend;

// Format date helper
function formatDate(date) {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'I dag';
    if (days === 1) return 'I går';
    if (days < 7) return `${days} dager siden`;
    
    return date.toLocaleDateString('nb-NO');
}

// Update friend notification badge
function updateFriendNotificationBadge() {
    const badge = $('friendNotificationBadge');
    if (!badge) return;
    
    const pendingRequests = state.friendRequests?.length || 0;
    const unviewedShares = state.sharedRecipes?.filter(r => !r.viewed)?.length || 0;
    const unviewedCookbooks = state.sharedCookbooks?.filter(s => !s.viewed && !s.accepted)?.length || 0;
    const total = pendingRequests + unviewedShares + unviewedCookbooks;
    
    if (total > 0) {
        badge.textContent = total > 9 ? '9+' : total;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
    
    // Also update social card on dashboard
    updateSocialCard();
}

// =============================================
// ===== PUSH NOTIFICATIONS SYSTEM =====
// =============================================

// Check if push notifications are supported
function isPushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function shouldAutoRequestPush() {
    if (!isPushSupported()) return false;
    return Notification.permission === 'default' && localStorage.getItem(PUSH_PROMPT_KEY) !== 'true';
}

// Request push notification permission
async function requestPushPermission(silent = false) {
    if (!isPushSupported()) {
        if (!silent) {
            showToast('Push-varsler støttes ikke på denne enheten', 'warning');
        }
        return false;
    }

    if (Notification.permission !== 'default') {
        return Notification.permission === 'granted';
    }
    
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            if (!silent) {
                showToast('Push-varsler aktivert! 🔔', 'success');
            }
            await subscribeToPush();
            return true;
        } else {
            if (!silent) {
                showToast('Du må tillate varsler for å motta dem', 'info');
            }
            return false;
        }
    } catch (e) {
        console.error('Push permission error:', e);
        return false;
    }
}

// Subscribe to push notifications
async function subscribeToPush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        
        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
            // Create new subscription
            // Note: In production, you'd use your own VAPID key
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
                )
            });
        }
        
        // Save subscription to Firestore for server-side notifications
        if (state.user) {
            try {
                await db.collection('pushSubscriptions').doc(state.user.uid).set({
                    userId: state.user.uid,
                    subscription: JSON.stringify(subscription),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                
                console.log('✓ Push subscription saved');
            } catch (writeError) {
                if (writeError.message && writeError.message.includes('permission')) {
                    console.warn('⚠️ Push notification permission denied by Firestore rules');
                    console.log('Tip: User may need to verify their email or check privacy settings');
                    showToast('Kunne ikke aktivere push-varsler - sjekk innstillinger', 'warning');
                } else {
                    throw writeError;
                }
            }
        }
        
        return subscription;
    } catch (e) {
        console.error('Push subscription error:', e);
        if (e.message && e.message.includes('permission')) {
            showToast('Push-varsler krever tillatelse', 'info');
        }
        return null;
    }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Show local notification (when app is in foreground)
function showLocalNotification(title, body, options = {}) {
    if (!state.settings.pushNotifications) return;
    if (Notification.permission !== 'granted') return;
    
    const notification = new Notification(title, {
        body: body,
        icon: './icons/icon-192.svg',
        badge: './icons/icon-192.svg',
        tag: options.tag || 'kokebok-notification',
        renotify: options.renotify || false,
        data: options.data || {},
        ...options
    });
    
    notification.onclick = () => {
        window.focus();
        if (options.onClick) options.onClick();
        notification.close();
    };
    
    return notification;
}

// Schedule a notification for later
function scheduleNotification(title, body, delayMs, options = {}) {
    if (!state.settings.pushNotifications) return null;
    
    const timeoutId = setTimeout(() => {
        showLocalNotification(title, body, options);
    }, delayMs);
    
    return timeoutId;
}

// Send notification through service worker (works when app is closed)
async function sendPushNotification(title, body, data = {}) {
    if (!state.settings.pushNotifications) return;
    
    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
            body: body,
            icon: './icons/icon-192.svg',
            badge: './icons/icon-192.svg',
            vibrate: [200, 100, 200],
            data: data,
            actions: [
                { action: 'open', title: 'Åpne' },
                { action: 'dismiss', title: 'Lukk' }
            ]
        });
    } catch (e) {
        console.error('Push notification error:', e);
    }
}

// Notify about friend request
function notifyFriendRequest(fromName) {
    if (!state.settings.friendNotifications) return;
    sendPushNotification(
        '👥 Ny venneforespørsel',
        `${fromName} vil bli din venn!`,
        { type: 'friendRequest' }
    );
}

// Notify about shared recipe
function notifySharedRecipe(fromName, recipeName) {
    if (!state.settings.shareNotifications) return;
    sendPushNotification(
        '🎁 Ny oppskrift delt',
        `${fromName} delte "${recipeName}" med deg!`,
        { type: 'sharedRecipe' }
    );
}

// Notify about shared cookbook
function notifySharedCookbook(fromName, cookbookName) {
    if (!state.settings.shareNotifications) return;
    sendPushNotification(
        '📚 Ny kokebok delt',
        `${fromName} delte "${cookbookName}" med deg!`,
        { type: 'sharedCookbook' }
    );
}

// Notify meal reminder
function notifyMealReminder(mealName) {
    if (!state.settings.reminderNotifications) return;
    sendPushNotification(
        '🍽️ Måltidspåminnelse',
        `Tid for å lage ${mealName}!`,
        { type: 'mealReminder' }
    );
}

