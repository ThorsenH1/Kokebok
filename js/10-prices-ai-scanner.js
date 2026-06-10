// ===== v4.2 - KASSAL.APP API INTEGRATION =====

async function kassalApiRequest(endpoint, params = {}) {
    const url = new URL(`${KASSAL_API_BASE}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, value);
        }
    });
    
    try {
        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${KASSAL_API_KEY}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Kassal API error:', error);
        throw error;
    }
}

// Kassal-API-et returnerer current_price enten som tall eller som objekt
// ({ price, unit_price }) avhengig av endepunkt. Disse hjelperne håndterer begge.
function getKassalPrice(product) {
    if (!product) return 0;
    const cp = product.current_price;
    if (typeof cp === 'number') return cp;
    if (cp && typeof cp === 'object' && typeof cp.price === 'number') return cp.price;
    if (typeof product.price === 'number') return product.price;
    return 0;
}

function getKassalUnitPrice(product) {
    if (!product) return null;
    const cp = product.current_price;
    if (cp && typeof cp === 'object' && cp.unit_price) return cp.unit_price;
    return product.current_unit_price || null;
}

// Search products
async function searchProducts(query, options = {}) {
    return kassalApiRequest('/products', {
        search: query,
        size: options.size || 20,
        sort: options.sort || 'price_asc',
        ...options
    });
}

// Get product by barcode/EAN
async function getProductByBarcode(ean) {
    return kassalApiRequest('/products/ean/' + ean);
}

// Get product details
async function getProductById(id) {
    return kassalApiRequest('/products/' + id);
}

// Get stores
async function getStores(options = {}) {
    return kassalApiRequest('/physical-stores', options);
}

// Price comparison for shopping list
async function getPriceComparison(productNames) {
    const results = [];
    
    for (const name of productNames.slice(0, 10)) { // Limit to prevent too many API calls
        try {
            const data = await searchProducts(name, { size: 5 });
            if (data.data && data.data.length > 0) {
                results.push({
                    searchTerm: name,
                    products: data.data.map(p => ({
                        name: p.name,
                        brand: p.brand,
                        price: getKassalPrice(p) || null,
                        unit_price: getKassalUnitPrice(p),
                        store: p.store?.name,
                        image: p.image,
                        ean: p.ean
                    }))
                });
            }
        } catch (e) {
            console.warn(`Could not find prices for: ${name}`);
        }
    }
    
    return results;
}

// Open price checker
function openPriceChecker() {
    const html = `
        <div class="price-checker">
            <div class="price-search-box">
                <input type="text" id="priceSearchInput" placeholder="Søk etter vare..." 
                       onkeydown="if(event.key==='Enter')searchPrices()">
                <button class="price-search-btn" onclick="searchPrices()">
                    🔍 Søk
                </button>
            </div>
            
            <div class="quick-price-btns">
                <button onclick="searchPrices('melk')">🥛 Melk</button>
                <button onclick="searchPrices('brød')">🍞 Brød</button>
                <button onclick="searchPrices('egg')">🥚 Egg</button>
                <button onclick="searchPrices('ost')">🧀 Ost</button>
                <button onclick="searchPrices('kylling')">🍗 Kylling</button>
                <button onclick="searchPrices('laks')">🐟 Laks</button>
            </div>
            
            <div id="priceResults" class="price-results">
                <div class="price-placeholder">
                    <span class="price-icon">💰</span>
                    <p>Søk etter en vare for å sammenligne priser</p>
                    <p class="price-hint">Data fra norske matbutikker via Kassal.app</p>
                </div>
            </div>
        </div>
    `;
    
    showModal('💰 Prissammenligning', html, []);
    setTimeout(() => $('priceSearchInput')?.focus(), 100);
}
window.openPriceChecker = openPriceChecker;

async function searchPrices(query) {
    const searchInput = $('priceSearchInput');
    const searchTerm = query || searchInput?.value?.trim();
    
    if (!searchTerm) {
        showToast('Skriv inn en vare å søke etter', 'warning');
        return;
    }
    
    const resultsDiv = $('priceResults');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Søker etter priser...</p>
        </div>
    `;
    
    try {
        const data = await searchProducts(searchTerm, { size: 15 });
        
        if (!data.data || data.data.length === 0) {
            resultsDiv.innerHTML = `
                <div class="no-results">
                    <span>😕</span>
                    <p>Ingen produkter funnet for "${escapeHtml(searchTerm)}"</p>
                    <p class="hint">Prøv et annet søkeord</p>
                </div>
            `;
            return;
        }
        
        // Group by store for best prices
        const storeGroups = {};
        data.data.forEach(product => {
            const store = product.store?.name || 'Ukjent';
            if (!storeGroups[store]) storeGroups[store] = [];
            storeGroups[store].push(product);
        });
        
        // Find cheapest
        const sortedProducts = [...data.data].sort((a, b) =>
            (getKassalPrice(a) || 999) - (getKassalPrice(b) || 999)
        );
        
        const cheapest = sortedProducts[0];
        
        resultsDiv.innerHTML = `
            <div class="price-results-header">
                <h4>Resultater for "${escapeHtml(searchTerm)}"</h4>
                <span class="result-count">${data.data.length} produkter</span>
            </div>
            
            ${cheapest ? `
                <div class="cheapest-banner">
                    <span class="cheapest-icon">🏆</span>
                    <div class="cheapest-info">
                        <strong>Billigst: ${escapeHtml(cheapest.name)}</strong>
                        <span>${formatCurrency(getKassalPrice(cheapest))} hos ${cheapest.store?.name}</span>
                    </div>
                </div>
            ` : ''}
            
            <div class="product-grid">
                ${sortedProducts.map(product => `
                    <div class="product-card" onclick="showProductDetails('${product.id}')">
                        <div class="product-image">
                            ${product.image ? `<img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy">` : '<span class="no-image">📦</span>'}
                        </div>
                        <div class="product-info">
                            <span class="product-name">${escapeHtml(product.name)}</span>
                            ${product.brand ? `<span class="product-brand">${escapeHtml(product.brand)}</span>` : ''}
                            <div class="product-price-row">
                                <span class="product-price">${formatCurrency(getKassalPrice(product))}</span>
                                <span class="product-store">${product.store?.name || ''}</span>
                            </div>
                            ${getKassalUnitPrice(product) ? `
                                <span class="unit-price">${getKassalUnitPrice(product)}</span>
                            ` : ''}
                        </div>
                        <button class="add-to-pantry-btn" onclick="event.stopPropagation(); addProductToPantry('${escapeHtml(JSON.stringify(product).replace(/'/g, "\\'"))}')">
                            ➕
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        
    } catch (error) {
        console.error('Price search error:', error);
        resultsDiv.innerHTML = `
            <div class="error-state">
                <span>❌</span>
                <p>Kunne ikke hente priser</p>
                <p class="hint">Sjekk internettforbindelsen og prøv igjen</p>
            </div>
        `;
    }
}
window.searchPrices = searchPrices;

async function showProductDetails(productId) {
    try {
        showToast('Henter produktinfo...', 'info');
        const data = await getProductById(productId);
        
        if (!data.data) {
            showToast('Kunne ikke hente produktinfo', 'error');
            return;
        }
        
        const product = data.data;
        
        const html = `
            <div class="product-detail">
                <div class="product-detail-image">
                    ${product.image ? `<img src="${product.image}" alt="${escapeHtml(product.name)}">` : '<span class="no-image-large">📦</span>'}
                </div>
                
                <h3>${escapeHtml(product.name)}</h3>
                ${product.brand ? `<p class="brand">${escapeHtml(product.brand)}</p>` : ''}
                
                <div class="price-display">
                    <span class="current-price">${formatCurrency(getKassalPrice(product))}</span>
                    <span class="store-name">hos ${product.store?.name}</span>
                </div>
                
                ${getKassalUnitPrice(product) ? `
                    <p class="unit-price-detail">${getKassalUnitPrice(product)}</p>
                ` : ''}
                
                <div class="product-meta">
                    ${product.weight ? `<span>Vekt: ${product.weight}g</span>` : ''}
                    ${product.ean ? `<span>EAN: ${product.ean}</span>` : ''}
                </div>
                
                ${product.allergens && product.allergens.length > 0 ? `
                    <div class="allergens">
                        <strong>Allergener:</strong>
                        <span>${product.allergens.join(', ')}</span>
                    </div>
                ` : ''}
                
                ${product.nutrition ? `
                    <div class="nutrition-info">
                        <strong>Næringsinnhold per 100g:</strong>
                        <div class="nutrition-grid">
                            ${product.nutrition.calories ? `<span>Kalorier: ${product.nutrition.calories} kcal</span>` : ''}
                            ${product.nutrition.fat ? `<span>Fett: ${product.nutrition.fat}g</span>` : ''}
                            ${product.nutrition.carbohydrates ? `<span>Karbo: ${product.nutrition.carbohydrates}g</span>` : ''}
                            ${product.nutrition.protein ? `<span>Protein: ${product.nutrition.protein}g</span>` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        showModal('📦 ' + product.name, html, [
            { text: 'Lukk', onClick: closeModal },
            { text: '➕ Legg til matkammer', primary: true, onClick: () => addProductToPantryFromDetail(product) }
        ]);
        
    } catch (error) {
        console.error('Product detail error:', error);
        showToast('Kunne ikke hente produktinfo', 'error');
    }
}
window.showProductDetails = showProductDetails;

function addProductToPantry(productJson) {
    try {
        const product = JSON.parse(productJson);
        addProductToPantryFromDetail(product);
    } catch (e) {
        console.error('Parse error:', e);
    }
}
window.addProductToPantry = addProductToPantry;

async function addProductToPantryFromDetail(product) {
    const newItem = {
        id: 'pantry_' + Date.now(),
        name: product.name || product.title,
        brand: product.brand || '',
        quantity: 1,
        unit: 'stk',
        category: guessPantryCategory(product.name),
        estimatedPrice: getKassalPrice(product) || 0,
        ean: product.ean || '',
        image: product.image || '',
        createdAt: new Date().toISOString()
    };
    
    try {
        await saveToFirestore('pantry', newItem.id, newItem);
        state.pantryItems.push(newItem);
        showToast(`${product.name} lagt til i matkammeret! 🎉`, 'success');
        closeModal();
        
        // Update kitchen card
        updateKitchenCard();
        
    } catch (e) {
        console.error('Save pantry error:', e);
        showToast('Kunne ikke legge til vare', 'error');
    }
}

function guessPantryCategory(name) {
    const lowerName = name.toLowerCase();
    
    if (/melk|yoghurt|rømme|fløte|ost|smør|egg/.test(lowerName)) return 'dairy';
    if (/kylling|biff|svin|lam|kjøtt|pølse|bacon|fisk|laks|torsk|reke/.test(lowerName)) return 'meat';
    if (/eple|banan|appelsin|drue|bær|frukt/.test(lowerName)) return 'fruits';
    if (/salat|tomat|agurk|løk|gulrot|potet|grønnsak|brokkoli|spinat/.test(lowerName)) return 'vegetables';
    if (/frossen|is|pizza/.test(lowerName)) return 'frozen';
    if (/boks|hermetikk|tomat/.test(lowerName)) return 'canned';
    if (/mel|pasta|ris|havre|müsli|brød/.test(lowerName)) return 'grains';
    if (/krydder|salt|pepper|sukker/.test(lowerName)) return 'spices';
    if (/vann|brus|juice|kaffe|te/.test(lowerName)) return 'drinks';
    if (/chips|sjokolade|snacks|godteri/.test(lowerName)) return 'snacks';
    if (/ketchup|sennep|majones|dressing|saus/.test(lowerName)) return 'condiments';
    
    return 'other';
}

// ===== v4.2 - AI PANTRY SCANNER =====

function openPantryAIScanner() {
    const html = `
        <div class="ai-scanner-container">
            <div class="scanner-header">
                <h3>📸 AI Matkammer-skanner</h3>
                <p>Ta bilde av kjøleskapet, skapet eller matvarene dine, så legger vi dem automatisk til!</p>
            </div>
            
            <div class="scanner-preview">
                <video id="scannerVideo" autoplay playsinline></video>
                <canvas id="scannerCanvas" style="display:none;"></canvas>
                <img id="scannerPreview" style="display:none;" />
            </div>
            
            <div class="scanner-controls">
                <button id="captureBtn" class="capture-btn" onclick="captureAndAnalyze()">
                    <span class="capture-icon">📷</span>
                    Ta bilde
                </button>
                <span class="or-text">eller</span>
                <label class="upload-btn">
                    <input type="file" id="scannerFileInput" accept="image/*" onchange="handleScannerUpload(event)" hidden>
                    📁 Last opp bilde
                </label>
            </div>
            
            <div id="scannerResults" class="scanner-results" style="display:none;">
                <h4>🔍 Identifiserte varer:</h4>
                <div id="identifiedItems" class="identified-items"></div>
                <div class="scanner-actions">
                    <button class="add-all-btn" onclick="addAllIdentifiedItems()">
                        ✅ Legg til alle
                    </button>
                </div>
            </div>
            
            <div class="scanner-tips">
                <h4>💡 Tips for best resultat:</h4>
                <ul>
                    <li>Sørg for god belysning</li>
                    <li>Ta bildet rett forfra</li>
                    <li>Ha varene godt synlige</li>
                    <li>Ta flere bilder om nødvendig</li>
                </ul>
            </div>
        </div>
    `;
    
    showModal('🤖 AI Matkammer-skanner', html, [
        { text: 'Avbryt', onClick: () => { stopScanner(); closeGenericModal(); } }
    ]);
    
    // Start camera
    startScanner();
}
window.openPantryAIScanner = openPantryAIScanner;

let scannerStream = null;

async function startScanner() {
    try {
        const video = $('scannerVideo');
        if (!video) return;
        
        scannerStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        
        video.srcObject = scannerStream;
        video.style.display = 'block';
        
    } catch (error) {
        console.error('Camera error:', error);
        showToast('Kunne ikke åpne kameraet. Prøv å laste opp et bilde i stedet.', 'warning');
    }
}

function stopScanner() {
    if (scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
    }
}

async function captureAndAnalyze() {
    const video = $('scannerVideo');
    const canvas = $('scannerCanvas');
    const preview = $('scannerPreview');
    
    if (!video || !canvas) return;
    
    // Capture frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Show preview
    video.style.display = 'none';
    preview.src = imageData;
    preview.style.display = 'block';
    
    // Stop camera
    stopScanner();
    
    // Analyze image
    await analyzeImage(imageData);
}
window.captureAndAnalyze = captureAndAnalyze;

async function handleScannerUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    stopScanner();
    
    const video = $('scannerVideo');
    const preview = $('scannerPreview');
    
    const imageData = await fileToBase64(file);
    
    if (video) video.style.display = 'none';
    if (preview) {
        preview.src = imageData;
        preview.style.display = 'block';
    }
    
    await analyzeImage(imageData);
}
window.handleScannerUpload = handleScannerUpload;

let identifiedItemsData = [];
let lastScannedImageData = null;
let lastAIScanMeta = {
    provider: 'none',
    model: null,
    error: null
};

// "Prøv igjen"-knappen i skannerens feilmelding
function retryAnalysis() {
    if (lastScannedImageData) {
        analyzeImage(lastScannedImageData);
    } else {
        showToast('Ta eller last opp et bilde først', 'info');
    }
}
window.retryAnalysis = retryAnalysis;

async function analyzeImage(imageData) {
    const resultsDiv = $('scannerResults');
    const itemsDiv = $('identifiedItems');

    if (!resultsDiv || !itemsDiv) return;
    lastScannedImageData = imageData;
    
    resultsDiv.style.display = 'block';
    itemsDiv.innerHTML = `
        <div class="analyzing">
            <div class="spinner"></div>
            <p>Analyserer bildet med AI...</p>
        </div>
    `;
    
    try {
        // Use OpenAI Vision API to analyze the image
        const items = await analyzeImageWithAI(imageData);

        if (lastAIScanMeta.provider && lastAIScanMeta.provider !== 'fallback') {
            const providerName = lastAIScanMeta.provider === 'openai' ? 'GPT (OpenAI)' : 'Gemini';
            const modelText = lastAIScanMeta.model ? ` • ${lastAIScanMeta.model}` : '';
            showToast(`🤖 AI brukt: ${providerName}${modelText}`, 'info');
        }
        
        if (items.length === 0) {
            itemsDiv.innerHTML = `
                <div class="no-items-found">
                    <span>🤔</span>
                    <p>Fant ingen matvarer i bildet</p>
                    <p class="hint">Prøv å ta et nytt bilde med bedre belysning</p>
                </div>
            `;
            return;
        }
        
        identifiedItemsData = items;
        
        // Try to find prices for the items
        const itemsWithPrices = await enrichItemsWithPrices(items);
        identifiedItemsData = itemsWithPrices;
        
        itemsDiv.innerHTML = itemsWithPrices.map((item, index) => `
            <div class="identified-item" data-index="${index}">
                <input type="checkbox" id="item_${index}" checked>
                <label for="item_${index}">
                    <span class="item-name">${escapeHtml(item.name)}</span>
                    <input type="number" class="item-qty" value="${item.quantity || 1}" min="0.1" step="0.1" 
                           onchange="updateIdentifiedItemQty(${index}, this.value)">
                    <select class="item-unit" onchange="updateIdentifiedItemUnit(${index}, this.value)">
                        <option value="stk" ${item.unit === 'stk' ? 'selected' : ''}>stk</option>
                        <option value="liter" ${item.unit === 'liter' ? 'selected' : ''}>liter</option>
                        <option value="kg" ${item.unit === 'kg' ? 'selected' : ''}>kg</option>
                        <option value="g" ${item.unit === 'g' ? 'selected' : ''}>g</option>
                        <option value="pk" ${item.unit === 'pk' ? 'selected' : ''}>pk</option>
                    </select>
                    ${item.price ? `<span class="item-price">~${formatCurrency(item.price)}</span>` : ''}
                </label>
                <button class="remove-item-btn" onclick="removeIdentifiedItem(${index})">✕</button>
            </div>
        `).join('');
        
        showToast(`Fant ${items.length} matvarer! 🎉`, 'success');
        
    } catch (error) {
        console.error('Image analysis error:', error);
        itemsDiv.innerHTML = `
            <div class="error-state">
                <span>❌</span>
                <p>Kunne ikke analysere bildet</p>
                <button onclick="retryAnalysis()">Prøv igjen</button>
            </div>
        `;
    }
}

async function analyzeImageWithAI(imageData) {
    lastAIScanMeta = { provider: 'none', model: null, error: null };

    // Prefer OpenAI (ChatGPT) first, then Gemini, then fallback
    const openaiKey = localStorage.getItem('kokebok_openai_key') || localStorage.getItem('openai_api_key');
    const geminiKey = localStorage.getItem('kokebok_gemini_key');

    if (openaiKey) {
        try {
            const items = await analyzeWithOpenAI(imageData, openaiKey);
            lastAIScanMeta.provider = 'openai';
            return items;
        } catch (e) {
            lastAIScanMeta.error = e?.message || String(e);
            console.warn('OpenAI API error, trying fallback:', e.message);
        }
    }

    if (geminiKey) {
        try {
            const items = await analyzeWithGemini(imageData, geminiKey);
            lastAIScanMeta.provider = 'gemini';
            return items;
        } catch (e) {
            lastAIScanMeta.error = e?.message || String(e);
            console.warn('Gemini API error:', e.message);
        }
    }
    
    // Fallback to basic pattern recognition
    lastAIScanMeta.provider = 'fallback';
    return basicImageAnalysis(imageData);
}

function parseAiItemsFromText(content) {
    if (!content) return [];

    let parsed = null;
    const raw = String(content).trim();

    // 1) Try full JSON parse first
    try {
        parsed = JSON.parse(raw);
    } catch (e) {}

    // 2) Try fenced JSON
    if (!parsed) {
        const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (fenced?.[1]) {
            try {
                parsed = JSON.parse(fenced[1]);
            } catch (e) {}
        }
    }

    // 3) Try extracting first array in text
    if (!parsed) {
        const arrMatch = raw.match(/\[[\s\S]*\]/);
        if (arrMatch?.[0]) {
            try {
                parsed = JSON.parse(arrMatch[0]);
            } catch (e) {}
        }
    }

    // Support object wrappers
    let items = [];
    if (Array.isArray(parsed)) {
        items = parsed;
    } else if (parsed && typeof parsed === 'object') {
        items = parsed.items || parsed.products || parsed.ingredients || [];
    }

    if (!Array.isArray(items)) return [];

    return items
        .map(item => {
            const name = getItemName(item).trim();
            if (!name) return null;
            return {
                name,
                quantity: Number(item?.quantity) > 0 ? Number(item.quantity) : 1,
                unit: item?.unit ? String(item.unit).trim() : 'stk'
            };
        })
        .filter(Boolean);
}

// Google Gemini Vision API (FREE tier available!)
async function analyzeWithGemini(imageData, apiKey) {
    // Extract base64 data without the prefix
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = imageData.match(/^data:(image\/\w+);/)?.[1] || 'image/jpeg';
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [
                    {
                        text: `Du er en ekspert på å identifisere matvarer i bilder.
Analyser bildet og identifiser ALLE synlige matvarer, ingredienser, og dagligvarer.
Vær grundig - se etter emballasje, merker, og produkttyper.

VIKTIG: Svar BARE med en JSON-array i dette eksakte formatet:
[
  {"name": "Produktnavn på norsk", "quantity": 1, "unit": "stk"},
  {"name": "Annet produkt", "quantity": 0.5, "unit": "kg"}
]

Enheter kan være: stk, liter, kg, g, pk, boks, pose, flaske

Ikke inkluder noen forklaring eller annen tekst - BARE JSON-arrayet.`
                    },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Data
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2000
            }
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `Gemini API error: ${response.status}`;
        
        // Check for rate limit / quota exceeded
        if (response.status === 429 || errorMsg.includes('quota') || errorMsg.includes('Quota exceeded') || errorMsg.includes('rate')) {
            // Trigger quota exceeded modal instead of just toast
            showGeminiQuotaExceededModal();
            throw new Error('Gemini quota exceeded');
        }
        
        throw new Error(errorMsg);
    }
    
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    
    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1] || jsonMatch[0];
    }
    
    try {
        const items = JSON.parse(jsonStr);
        console.log('✓ Gemini identifiserte', items.length, 'varer');
        return Array.isArray(items) ? items : [];
    } catch (e) {
        console.warn('JSON parse error:', e, content);
        return [];
    }
}

// OpenAI Vision API (requires paid API key)
async function analyzeWithOpenAI(imageData, apiKey) {
    const candidateModels = ['gpt-4o-mini', 'gpt-4o'];

    let lastError = null;
    for (const model of candidateModels) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: 'system',
                            content: `Du er en ekspert på å identifisere matvarer i bilder.
Analyser bildet og list opp alle synlige matvarer.
Svar KUN med gyldig JSON.
Format:
[{"name":"melk","quantity":1,"unit":"liter"}]
Bruk norske navn. Ikke legg til forklaringer.`
                        },
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: 'Identifiser alle matvarer i dette bildet.' },
                                { type: 'image_url', image_url: { url: imageData } }
                            ]
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.1
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const msg = data?.error?.message || `OpenAI API error: ${response.status}`;
                throw new Error(msg);
            }

            const content = data?.choices?.[0]?.message?.content || '';
            const items = parseAiItemsFromText(content);

            lastAIScanMeta.model = model;
            if (items.length > 0) return items;

            // If model responded but no parsable items, treat as no-result (not hard fail)
            return [];
        } catch (e) {
            lastError = e;
            console.warn(`OpenAI vision model ${model} failed:`, e?.message || e);
        }
    }

    throw lastError || new Error('OpenAI vision failed');
}

function basicImageAnalysis(imageData) {
    // Fallback: Return empty array and suggest configuring AI keys
    showToast('🤖 For AI-skanning: legg inn OpenAI API-nøkkel i Innstillinger (GPT foretrukket).', 'info');
    return [];
}

async function enrichItemsWithPrices(items) {
    const enriched = [];
    
    for (const item of items) {
        try {
            const searchResult = await searchProducts(item.name, { size: 1 });
            if (searchResult.data && searchResult.data.length > 0) {
                const product = searchResult.data[0];
                enriched.push({
                    ...item,
                    price: getKassalPrice(product) || null,
                    ean: product.ean,
                    category: guessPantryCategory(item.name)
                });
            } else {
                enriched.push({
                    ...item,
                    category: guessPantryCategory(item.name)
                });
            }
        } catch (e) {
            enriched.push({
                ...item,
                category: guessPantryCategory(item.name)
            });
        }
    }
    
    return enriched;
}

function updateIdentifiedItemQty(index, value) {
    if (identifiedItemsData[index]) {
        identifiedItemsData[index].quantity = parseFloat(value) || 1;
    }
}
window.updateIdentifiedItemQty = updateIdentifiedItemQty;

function updateIdentifiedItemUnit(index, value) {
    if (identifiedItemsData[index]) {
        identifiedItemsData[index].unit = value;
    }
}
window.updateIdentifiedItemUnit = updateIdentifiedItemUnit;

function removeIdentifiedItem(index) {
    const el = document.querySelector(`.identified-item[data-index="${index}"]`);
    if (el) el.remove();
    identifiedItemsData[index] = null;
}
window.removeIdentifiedItem = removeIdentifiedItem;

async function addAllIdentifiedItems() {
    const checkboxes = document.querySelectorAll('.identified-item input[type="checkbox"]:checked');
    const itemsToAdd = [];
    
    checkboxes.forEach(cb => {
        const index = parseInt(cb.closest('.identified-item').dataset.index);
        if (identifiedItemsData[index]) {
            itemsToAdd.push(identifiedItemsData[index]);
        }
    });
    
    if (itemsToAdd.length === 0) {
        showToast('Velg minst én vare å legge til', 'warning');
        return;
    }
    
    let added = 0;
    for (const item of itemsToAdd) {
        try {
            const newItem = {
                id: 'pantry_' + Date.now() + '_' + added,
                name: item.name,
                quantity: item.quantity || 1,
                unit: item.unit || 'stk',
                category: item.category || 'other',
                estimatedPrice: item.price || 0,
                ean: item.ean || '',
                createdAt: new Date().toISOString(),
                source: 'ai_scan'
            };
            
            await saveToFirestore('pantry', newItem.id, newItem);
            state.pantryItems.push(newItem);
            added++;
        } catch (e) {
            console.error('Error adding item:', e);
        }
    }
    
    showToast(`${added} varer lagt til i matkammeret! 🎉`, 'success');
    closeModal();
    updateKitchenCard();
    
    // Check achievement
    if (state.pantryItems.length >= 20) {
        unlockAchievement('pantryOrganizer');
    }
}
window.addAllIdentifiedItems = addAllIdentifiedItems;

// ===== v4.2 - AUTO INGREDIENT DEDUCTION =====

async function deductIngredientsFromPantry(recipe) {
    if (!recipe || !recipe.ingredients) return;
    
    const ingredients = getIngredientsAsString(recipe.ingredients).split('\n').filter(i => i.trim());
    const deductions = [];
    
    for (const ingredient of ingredients) {
        const parsed = parseIngredient(ingredient);
        if (!parsed) continue;
        
        // Find matching pantry item
        const pantryItem = findMatchingPantryItem(parsed.name);
        if (pantryItem) {
            deductions.push({
                pantryItem,
                amount: parsed.amount,
                unit: parsed.unit,
                ingredient: parsed.name
            });
        }
    }
    
    if (deductions.length === 0) {
        return;
    }
    
    // Show confirmation dialog
    const html = `
        <div class="deduction-dialog">
            <p>Vil du trekke fra disse ingrediensene fra matkammeret?</p>
            <div class="deduction-list">
                ${deductions.map((d, i) => `
                    <div class="deduction-item">
                        <input type="checkbox" id="deduct_${i}" checked>
                        <label for="deduct_${i}">
                            <span class="deduct-name">${escapeHtml(d.pantryItem.name)}</span>
                            <span class="deduct-amount">-${d.amount} ${d.unit}</span>
                            <span class="deduct-remaining">(${d.pantryItem.quantity} ${d.pantryItem.unit} → ${Math.max(0, d.pantryItem.quantity - d.amount)} ${d.pantryItem.unit})</span>
                        </label>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    showModal('🍳 Oppdater matkammer?', html, [
        { text: 'Hopp over', onClick: closeModal },
        { text: 'Trekk fra', primary: true, onClick: () => executeDeductions(deductions) }
    ]);
}

async function executeDeductions(deductions) {
    let updated = 0;
    
    for (let i = 0; i < deductions.length; i++) {
        const checkbox = $(`deduct_${i}`);
        if (!checkbox?.checked) continue;
        
        const d = deductions[i];
        const newQty = Math.max(0, d.pantryItem.quantity - d.amount);
        
        if (newQty <= 0) {
            // Remove item from pantry
            await deleteFromFirestore('pantry', d.pantryItem.id);
            state.pantryItems = state.pantryItems.filter(p => p.id !== d.pantryItem.id);
        } else {
            // Update quantity
            d.pantryItem.quantity = newQty;
            await saveToFirestore('pantry', d.pantryItem.id, d.pantryItem);
        }
        updated++;
    }
    
    closeModal();
    showToast(`${updated} varer oppdatert i matkammeret`, 'success');
    updateKitchenCard();
}

function parseIngredient(text) {
    if (!text) return null;
    
    // Common patterns: "2 dl melk", "200g kjøttdeig", "1 stk løk"
    const patterns = [
        /^(\d+(?:[.,]\d+)?)\s*(dl|l|liter|ml|g|kg|stk|ss|ts|kopp|kopper)\s+(.+)$/i,
        /^(\d+(?:[.,]\d+)?)\s*(.+)$/i
    ];
    
    for (const pattern of patterns) {
        const match = text.trim().match(pattern);
        if (match) {
            return {
                amount: parseFloat(match[1].replace(',', '.')) || 1,
                unit: match[2]?.toLowerCase() || 'stk',
                name: match[3] || match[2]
            };
        }
    }
    
    return { amount: 1, unit: 'stk', name: text.trim() };
}

function findMatchingPantryItem(ingredientName) {
    if (!ingredientName) return null;
    
    const searchTerms = ingredientName.toLowerCase().split(' ');
    
    // Try exact match first
    let match = state.pantryItems.find(p => 
        p.name.toLowerCase() === ingredientName.toLowerCase()
    );
    
    if (match) return match;
    
    // Try partial match
    match = state.pantryItems.find(p => {
        const pantryName = p.name.toLowerCase();
        return searchTerms.some(term => pantryName.includes(term) || term.includes(pantryName));
    });
    
    return match;
}

// Hook into recipe cooking/viewing
function onRecipeCooked(recipeOrId) {
    // Support both recipe object and recipe ID
    let recipe = recipeOrId;
    if (typeof recipeOrId === 'string') {
        recipe = state.recipes.find(r => r.id === recipeOrId);
    }
    
    if (!recipe) {
        showToast('Oppskrift ikke funnet', 'error');
        return;
    }
    
    // Always track that user cooked this
    trackCookedRecipe(recipe.id);
    
    // Auto-deduct if enabled
    if (state.settings.autoDeductIngredients) {
        deductIngredientsFromPantry(recipe);
    } else {
        showToast(`✅ "${recipe.name}" markert som laget!`, 'success');
    }
}
window.onRecipeCooked = onRecipeCooked;

// Track cooked recipe for statistics
function trackCookedRecipe(recipeId) {
    const cookedHistory = JSON.parse(localStorage.getItem('kokebok_cooked_history') || '[]');
    cookedHistory.push({
        recipeId,
        cookedAt: new Date().toISOString()
    });
    // Keep only last 100 entries
    if (cookedHistory.length > 100) {
        cookedHistory.shift();
    }
    localStorage.setItem('kokebok_cooked_history', JSON.stringify(cookedHistory));
}

// ===== v4.2 - SHOPPING LIST WITH PRICES =====

async function calculateShoppingListPrices() {
    if (!state.shoppingList || state.shoppingList.length === 0) {
        showToast('Handlelisten er tom', 'info');
        return;
    }
    
    showToast('Henter priser...', 'info');
    
    const items = state.shoppingList.filter(item => !item.checked);
    const itemNames = items.map(item => getItemName(item));
    
    const priceData = await getPriceComparison(itemNames);
    
    // Calculate total estimate
    let totalMin = 0;
    let totalMax = 0;
    
    const enrichedItems = items.map(item => {
        const name = getItemName(item);
        const priceInfo = priceData.find(p => p.searchTerm.toLowerCase() === name.toLowerCase());
        
        if (priceInfo && priceInfo.products.length > 0) {
            const prices = priceInfo.products.map(p => p.price).filter(p => p);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            totalMin += minPrice;
            totalMax += maxPrice;
            
            return {
                ...item,
                priceRange: { min: minPrice, max: maxPrice },
                cheapestStore: priceInfo.products.find(p => p.price === minPrice)?.store
            };
        }
        // Fallback estimate when API fails/no match
        const estimate = estimateIngredientPrice(name);
        const minPrice = Math.max(1, Math.round((estimate.price || 25) * 0.9));
        const maxPrice = Math.max(minPrice, Math.round((estimate.price || 25) * 1.1));
        totalMin += minPrice;
        totalMax += maxPrice;
        return {
            ...item,
            priceRange: { min: minPrice, max: maxPrice },
            cheapestStore: 'Estimat'
        };
    });
    
    // Update shopping list display with prices
    showShoppingListWithPrices(enrichedItems, totalMin, totalMax);
}
window.calculateShoppingListPrices = calculateShoppingListPrices;

function showShoppingListWithPrices(items, totalMin, totalMax) {
    const hasAnyPrices = items.some(i => i && i.priceRange && (i.priceRange.min || i.priceRange.max));
    const html = `
        <div class="priced-shopping-list">
            <div class="price-estimate-header">
                <h3>💰 Prisestimat</h3>
                <div class="total-estimate">
                    <span class="estimate-range">${hasAnyPrices ? `${formatCurrency(totalMin)} - ${formatCurrency(totalMax)}` : '-'}</span>
                    <span class="estimate-label">estimert total</span>
                </div>
            </div>
            
            <div class="priced-items">
                ${items.map(item => `
                    <div class="priced-item ${item.checked ? 'checked' : ''}">
                        <span class="item-name">${escapeHtml(getItemName(item))}</span>
                        ${item.priceRange ? `
                            <span class="item-price-range">
                                ${formatCurrency(item.priceRange.min)}
                                ${item.cheapestStore ? `<small>(${item.cheapestStore})</small>` : ''}
                            </span>
                        ` : '<span class="no-price">-</span>'}
                    </div>
                `).join('')}
            </div>
            
            <div class="price-disclaimer">
                <small>💡 Prisene er veiledende og kan variere. Data fra Kassal.app</small>
            </div>
        </div>
    `;
    
    showModal('🛒 Handleliste med priser', html, [
        { text: 'Lukk', onClick: closeModal }
    ]);
}

// ===== v4.2 - RECIPE COST CALCULATOR =====

async function calculateRecipeCost(recipe) {
    if (!recipe || !recipe.ingredients) return null;
    
    const ingredients = getIngredientsAsString(recipe.ingredients).split('\n').filter(i => i.trim());
    let totalCost = 0;
    const breakdown = [];
    
    for (const ingredient of ingredients.slice(0, 15)) { // Limit API calls
        const parsed = parseIngredient(ingredient);
        if (!parsed) continue;
        
        try {
            const searchResult = await searchProducts(parsed.name, { size: 1 });
            if (searchResult.data && searchResult.data.length > 0) {
                const product = searchResult.data[0];
                let price = getKassalPrice(product) || 0;
                if (!price || price <= 0) {
                    const estimate = estimateIngredientPrice(parsed.name);
                    price = Math.round((estimate.price || 25) * 0.3);
                }
                totalCost += price;
                breakdown.push({
                    ingredient: parsed.name,
                    price,
                    product: product.name,
                    store: product.store?.name
                });
            } else {
                // No API match, use local estimate
                const estimate = estimateIngredientPrice(parsed.name);
                const price = Math.round((estimate.price || 25) * 0.3);
                totalCost += price;
                breakdown.push({
                    ingredient: parsed.name,
                    price,
                    product: `${estimate.match || 'estimat'} (${estimate.unit || 'stk'})`,
                    store: 'Estimat'
                });
            }
        } catch (e) {
            // Fallback on error
            const estimate = estimateIngredientPrice(parsed.name);
            const price = Math.round((estimate.price || 25) * 0.3);
            totalCost += price;
            breakdown.push({
                ingredient: parsed.name,
                price,
                product: `${estimate.match || 'estimat'} (${estimate.unit || 'stk'})`,
                store: 'Estimat'
            });
        }
    }
    
    return { total: totalCost, breakdown };
}

function showRecipeCostEstimate(recipe) {
    if (!recipe || !recipe.ingredients) {
        showToast('Ingen ingredienser å beregne pris for', 'warning');
        return;
    }
    showToast('Beregner kostnad...', 'info');
    
    calculateRecipeCost(recipe).then(cost => {
        if (!cost || cost.breakdown.length === 0) {
            showToast('Kunne ikke beregne kostnad', 'warning');
            return;
        }
        
        const html = `
            <div class="recipe-cost">
                <div class="cost-total">
                    <span class="cost-amount">${formatCurrency(cost.total)}</span>
                    <span class="cost-label">estimert kostnad</span>
                </div>
                
                <h4>Prisfordeling:</h4>
                <div class="cost-breakdown">
                    ${cost.breakdown.map(item => `
                        <div class="cost-item">
                            <span class="cost-ingredient">${escapeHtml(item.ingredient)}</span>
                            <span class="cost-price">${formatCurrency(item.price)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <p class="cost-disclaimer">
                    <small>Prisene er veiledende basert på rimeligste alternativ. Data fra Kassal.app</small>
                </p>
            </div>
        `;
        
        showModal('💰 Kostnad: ' + recipe.name, html, [
            { text: 'Lukk', onClick: closeModal }
        ]);
    });
}
window.showRecipeCostEstimate = showRecipeCostEstimate;

