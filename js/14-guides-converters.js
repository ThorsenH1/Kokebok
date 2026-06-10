// =====================================================
// v4.4.0 - ULTIMATE PREMIUM FEATURES
// =====================================================

// ===== INGREDIENT SUBSTITUTION DATABASE =====
const SUBSTITUTIONS = {
    'smør': [
        { sub: 'Margarin', ratio: '1:1', note: 'Fungerer i de fleste oppskrifter' },
        { sub: 'Kokosolje', ratio: '1:1', note: 'Gir mild kokossmak' },
        { sub: 'Olivenolje', ratio: '3/4 mengde', note: 'Best i salte retter' },
        { sub: 'Avokado', ratio: '1:1', note: 'Gir kremete tekstur' }
    ],
    'egg': [
        { sub: 'Chiafrø + vann', ratio: '1 ss chia + 3 ss vann = 1 egg', note: 'La svelle i 5 min' },
        { sub: 'Banan', ratio: '1/2 banan = 1 egg', note: 'Gir søt smak' },
        { sub: 'Eplemos', ratio: '1/4 dl = 1 egg', note: 'Fungerer i kaker' },
        { sub: 'Aquafaba', ratio: '3 ss = 1 egg', note: 'Væske fra kikerter' }
    ],
    'melk': [
        { sub: 'Havremelk', ratio: '1:1', note: 'Nøytral smak' },
        { sub: 'Mandelmelk', ratio: '1:1', note: 'Lett nøttesmak' },
        { sub: 'Kokosmelk', ratio: '1:1', note: 'Rik og kremet' },
        { sub: 'Sojamelk', ratio: '1:1', note: 'Høy proteininnhold' }
    ],
    'fløte': [
        { sub: 'Kokoskrem', ratio: '1:1', note: 'Kjøl ned boksen først' },
        { sub: 'Cashewkrem', ratio: '1:1', note: 'Bløtlegg cashewnøtter' },
        { sub: 'Silketofu', ratio: '1:1', note: 'Blend til glatt' }
    ],
    'hvetemel': [
        { sub: 'Mandelmel', ratio: '1:1', note: 'Glutenfritt, nøttesmak' },
        { sub: 'Havremel', ratio: '1:1', note: 'Glutenfritt alternativ' },
        { sub: 'Kokosmel', ratio: '1/4 mengde', note: 'Absorberer mye væske' },
        { sub: 'Ris­mel', ratio: '7/8 mengde', note: 'Lett tekstur' }
    ],
    'sukker': [
        { sub: 'Honning', ratio: '3/4 mengde', note: 'Reduser væske litt' },
        { sub: 'Lønnesirup', ratio: '3/4 mengde', note: 'Karamellsmak' },
        { sub: 'Stevia', ratio: '1 ts = 1 dl sukker', note: 'Svært søt' },
        { sub: 'Dadler', ratio: '1:1', note: 'Blend med litt vann' }
    ],
    'hvitløk': [
        { sub: 'Hvitløkspulver', ratio: '1/8 ts = 1 fedd', note: 'Mildere smak' },
        { sub: 'Sjalottløk', ratio: '1 liten = 1 fedd', note: 'Mildere smak' }
    ],
    'sitronjuice': [
        { sub: 'Limejuice', ratio: '1:1', note: 'Litt annen smak' },
        { sub: 'Eddik', ratio: '1/2 mengde', note: 'Sterkere smak' },
        { sub: 'Hvitvin', ratio: '1:1', note: 'For koking' }
    ],
    'soyasaus': [
        { sub: 'Tamari', ratio: '1:1', note: 'Glutenfritt' },
        { sub: 'Coconut aminos', ratio: '1:1', note: 'Soyafritt, søtere' },
        { sub: 'Worcestershire', ratio: '1:1', note: 'Annen smaksprofil' }
    ],
    'ost': [
        { sub: 'Nutritional yeast', ratio: '2 ss = 1/4 dl ost', note: 'Osteaktig smak' },
        { sub: 'Vegansk ost', ratio: '1:1', note: 'Varierer i kvalitet' }
    ]
};

function openSubstitutionFinder() {
    const html = `
        <div class="substitution-finder">
            <div class="sub-search">
                <input type="text" id="subSearchInput" placeholder="Søk etter ingrediens..." 
                       oninput="searchSubstitutions(this.value)">
            </div>
            
            <div class="sub-quick-links">
                <h4>Vanlige erstatninger:</h4>
                <div class="sub-tags">
                    ${Object.keys(SUBSTITUTIONS).map(ing => 
                        `<button class="sub-tag" onclick="showSubstitution('${ing}')">${ing}</button>`
                    ).join('')}
                </div>
            </div>
            
            <div id="subResults" class="sub-results">
                <p class="sub-hint">Velg en ingrediens eller søk for å finne erstatninger</p>
            </div>
        </div>
    `;
    
    showModal('🔄 Ingrediens-erstatter', html, []);
}
window.openSubstitutionFinder = openSubstitutionFinder;

function showSubstitution(ingredient) {
    const subs = SUBSTITUTIONS[ingredient.toLowerCase()];
    if (!subs) {
        document.getElementById('subResults').innerHTML = `
            <p class="no-subs">Ingen erstatninger funnet for "${ingredient}"</p>
        `;
        return;
    }
    
    document.getElementById('subResults').innerHTML = `
        <div class="sub-card">
            <h3>Erstatninger for ${ingredient}</h3>
            <div class="sub-list">
                ${subs.map(s => `
                    <div class="sub-item">
                        <div class="sub-main">
                            <span class="sub-name">${s.sub}</span>
                            <span class="sub-ratio">${s.ratio}</span>
                        </div>
                        <p class="sub-note">${s.note}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}
window.showSubstitution = showSubstitution;

function searchSubstitutions(query) {
    if (!query || query.length < 2) {
        document.getElementById('subResults').innerHTML = `
            <p class="sub-hint">Velg en ingrediens eller søk for å finne erstatninger</p>
        `;
        return;
    }
    
    const matches = Object.keys(SUBSTITUTIONS).filter(ing => 
        ing.includes(query.toLowerCase())
    );
    
    if (matches.length > 0) {
        showSubstitution(matches[0]);
    } else {
        document.getElementById('subResults').innerHTML = `
            <p class="no-subs">Ingen erstatninger funnet for "${query}"</p>
        `;
    }
}
window.searchSubstitutions = searchSubstitutions;

// ===== TEMPERATURE CONVERTER =====
function openTemperatureConverter() {
    const html = `
        <div class="temp-converter">
            <div class="temp-input-group">
                <div class="temp-input">
                    <label>Celsius</label>
                    <input type="number" id="celsiusInput" placeholder="°C" oninput="convertTempBidirectional('c')">
                </div>
                <span class="temp-arrow">⇄</span>
                <div class="temp-input">
                    <label>Fahrenheit</label>
                    <input type="number" id="fahrenheitInput" placeholder="°F" oninput="convertTempBidirectional('f')">
                </div>
            </div>
            
            <div class="temp-presets">
                <h4>Vanlige ovnstemperaturer:</h4>
                <div class="temp-preset-grid">
                    <div class="temp-preset" onclick="setTempBidirectional(150)">
                        <span class="temp-c">150°C</span>
                        <span class="temp-f">300°F</span>
                        <span class="temp-desc">Lav</span>
                    </div>
                    <div class="temp-preset" onclick="setTempBidirectional(175)">
                        <span class="temp-c">175°C</span>
                        <span class="temp-f">350°F</span>
                        <span class="temp-desc">Middels</span>
                    </div>
                    <div class="temp-preset" onclick="setTempBidirectional(200)">
                        <span class="temp-c">200°C</span>
                        <span class="temp-f">400°F</span>
                        <span class="temp-desc">Høy</span>
                    </div>
                    <div class="temp-preset" onclick="setTempBidirectional(220)">
                        <span class="temp-c">220°C</span>
                        <span class="temp-f">425°F</span>
                        <span class="temp-desc">Veldig høy</span>
                    </div>
                    <div class="temp-preset" onclick="setTempBidirectional(250)">
                        <span class="temp-c">250°C</span>
                        <span class="temp-f">480°F</span>
                        <span class="temp-desc">Maks</span>
                    </div>
                </div>
            </div>
            
            <div class="temp-tips">
                <h4>💡 Tips:</h4>
                <p>Vifteovn: Reduser temperaturen med 20-25°C</p>
            </div>
        </div>
    `;
    
    showModal('🌡️ Temperaturomregner', html, []);
}
window.openTemperatureConverter = openTemperatureConverter;

function convertTempBidirectional(from) {
    const celsiusInput = document.getElementById('celsiusInput');
    const fahrenheitInput = document.getElementById('fahrenheitInput');
    
    if (from === 'c') {
        const c = parseFloat(celsiusInput.value);
        if (!isNaN(c)) {
            fahrenheitInput.value = Math.round((c * 9/5) + 32);
        }
    } else {
        const f = parseFloat(fahrenheitInput.value);
        if (!isNaN(f)) {
            celsiusInput.value = Math.round((f - 32) * 5/9);
        }
    }
}
window.convertTempBidirectional = convertTempBidirectional;

function setTempBidirectional(celsius) {
    document.getElementById('celsiusInput').value = celsius;
    convertTempBidirectional('c');
}
window.setTempBidirectional = setTempBidirectional;

// ===== MEAT TEMPERATURE GUIDE =====
const MEAT_TEMPERATURES = {
    beef: {
        name: 'Storfe / Biff',
        icon: '🥩',
        temps: [
            { level: 'Blue rare (rå)', temp: '46-49°C', desc: 'Veldig rå, kjølig senter' },
            { level: 'Rare (rå+)', temp: '52-55°C', desc: 'Rød kjerne, saftig' },
            { level: 'Medium rare', temp: '55-57°C', desc: 'Varmrosa kjerne, anbefalt' },
            { level: 'Medium', temp: '60-63°C', desc: 'Rosa kjerne' },
            { level: 'Medium well', temp: '65-69°C', desc: 'Svakt rosa' },
            { level: 'Well done (gjennomstekt)', temp: '71°C+', desc: 'Ingen rosa, tørrere' }
        ],
        tips: 'La biffen hvile 5-10 min etter steking. Temperaturen stiger 3-5°C under hvile.'
    },
    pork: {
        name: 'Svin',
        icon: '🐷',
        temps: [
            { level: 'Medium (saftig)', temp: '63-65°C', desc: 'Svakt rosa, saftig' },
            { level: 'Well done (anbefalt)', temp: '68-71°C', desc: 'Gjennomstekt, trygt' },
            { level: 'Ribbe/pulled pork', temp: '88-95°C', desc: 'Mørt og fallende av beinet' }
        ],
        tips: 'Svinekjøtt bør alltid være minimum 63°C for mattrygghet.'
    },
    chicken: {
        name: 'Kylling',
        icon: '🍗',
        temps: [
            { level: 'Bryst', temp: '74°C', desc: 'Hvit, saftig, ingen rosa' },
            { level: 'Lår', temp: '76-82°C', desc: 'Mørt, faller av beinet' },
            { level: 'Hel kylling', temp: '74-82°C', desc: 'Sjekk tykkeste del av låret' }
        ],
        tips: '⚠️ Kylling må ALLTID være minimum 74°C! Aldri rosa.'
    },
    lamb: {
        name: 'Lam',
        icon: '🐑',
        temps: [
            { level: 'Rare (rå)', temp: '52-55°C', desc: 'Rød kjerne' },
            { level: 'Medium rare', temp: '55-60°C', desc: 'Varmrosa, anbefalt' },
            { level: 'Medium', temp: '60-65°C', desc: 'Rosa kjerne' },
            { level: 'Well done', temp: '70°C+', desc: 'Gjennomstekt' },
            { level: 'Lammelår (langsom)', temp: '85-90°C', desc: 'Mørt og saftig' }
        ],
        tips: 'Lam tåler å være rosa. La hvile 10-15 min etter steking.'
    },
    fish: {
        name: 'Fisk',
        icon: '🐟',
        temps: [
            { level: 'Laks (medium)', temp: '52-54°C', desc: 'Halvgjennomsiktig senter, saftig' },
            { level: 'Laks (gjennomstekt)', temp: '60-63°C', desc: 'Gjennomstekt, flaker lett' },
            { level: 'Hvitfisk (torsk, sei)', temp: '60-63°C', desc: 'Hvit og flaker lett' },
            { level: 'Tunfisk (rå)', temp: '43-52°C', desc: 'Rå i midten, stekt utenpå' },
            { level: 'Reker', temp: '57-60°C', desc: 'Rosa og fast' }
        ],
        tips: 'Fisk fortsetter å tilberedes etter at den tas av varmen.'
    },
    ground: {
        name: 'Kvernet kjøtt',
        icon: '🍔',
        temps: [
            { level: 'Burger (medium rare)', temp: '60°C', desc: 'Rosa i midten (kun fersk kjøtt)' },
            { level: 'Burger (trygg)', temp: '71°C', desc: 'Gjennomstekt, anbefalt' },
            { level: 'Kjøttboller', temp: '74°C', desc: 'Gjennomstekt' },
            { level: 'Kjøttdeig (alle typer)', temp: '71-74°C', desc: 'Minimum for mattrygghet' }
        ],
        tips: '⚠️ Kvernet kjøtt har bakterier på hele overflaten - bør alltid være gjennomstekt!'
    },
    game: {
        name: 'Vilt',
        icon: '🦌',
        temps: [
            { level: 'Hjort (rare)', temp: '52-55°C', desc: 'Mørkerød kjerne' },
            { level: 'Hjort (medium rare)', temp: '55-60°C', desc: 'Rosa kjerne, anbefalt' },
            { level: 'Hjort (medium)', temp: '60-65°C', desc: 'Varmrosa' },
            { level: 'Elg', temp: '55-63°C', desc: 'Rosa til medium' },
            { level: 'Villsvin', temp: '71°C', desc: 'Gjennomstekt, som svin' }
        ],
        tips: 'Vilt er magert - oversteker lett. Hold temperaturen lav og la hvile godt.'
    },
    duck: {
        name: 'And / Ender',
        icon: '🦆',
        temps: [
            { level: 'Bryst (medium rare)', temp: '54-57°C', desc: 'Rosa kjerne, saftig' },
            { level: 'Bryst (medium)', temp: '60-63°C', desc: 'Varmrosa' },
            { level: 'Lår (confit)', temp: '74-82°C', desc: 'Mørt, faller av bein' }
        ],
        tips: 'Andebryst kan serveres rosa som biff. Stek med skinnsiden ned først.'
    }
};

function openMeatTemperatureGuide() {
    const html = `
        <div class="meat-temp-guide">
            <div class="meat-categories">
                ${Object.entries(MEAT_TEMPERATURES).map(([key, data]) => `
                    <button class="meat-cat-btn" onclick="showMeatTemps('${key}')">
                        <span class="meat-icon">${data.icon}</span>
                        <span class="meat-name">${data.name}</span>
                    </button>
                `).join('')}
            </div>
            
            <div id="meatTempResults" class="meat-temp-results">
                <p class="meat-temp-hint">👆 Velg type kjøtt for å se anbefalte temperaturer</p>
            </div>
            
            <div class="meat-temp-disclaimer">
                <p>⚠️ <strong>Viktig:</strong> Disse temperaturene er for kjernetemperatur målt med steketermometer.</p>
                <p>🍼 Gravide, barn og eldre bør unngå rått kjøtt.</p>
            </div>
        </div>
    `;
    
    showModal('🌡️🥩 Steketemperaturer', html, []);
}
window.openMeatTemperatureGuide = openMeatTemperatureGuide;

function showMeatTemps(meatType) {
    const data = MEAT_TEMPERATURES[meatType];
    if (!data) return;
    
    const resultsDiv = document.getElementById('meatTempResults');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = `
        <div class="meat-temp-card">
            <div class="meat-temp-header">
                <span class="meat-big-icon">${data.icon}</span>
                <h3>${data.name}</h3>
            </div>
            
            <div class="temp-levels">
                ${data.temps.map(t => `
                    <div class="temp-level">
                        <div class="temp-level-main">
                            <span class="temp-name">${t.level}</span>
                            <span class="temp-value">${t.temp}</span>
                        </div>
                        <p class="temp-desc">${t.desc}</p>
                    </div>
                `).join('')}
            </div>
            
            <div class="meat-tip">
                <span>💡</span>
                <p>${data.tips}</p>
            </div>
        </div>
    `;
    
    // Highlight selected button
    document.querySelectorAll('.meat-cat-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.meat-cat-btn')?.classList.add('active');
}
window.showMeatTemps = showMeatTemps;

// ===== WINE PAIRING GUIDE =====
const winePairings = {
    'beef': {
        emoji: '🥩',
        name: 'Biff & Storfe',
        wines: [
            { type: 'Cabernet Sauvignon', desc: 'Klassisk til biff med tanniner som balanserer fettet', rating: 5 },
            { type: 'Malbec', desc: 'Argentinsk fullkroppsvin, perfekt til grillet kjøtt', rating: 5 },
            { type: 'Syrah/Shiraz', desc: 'Krydret og kraftig, god til marinert biff', rating: 4 },
            { type: 'Barolo', desc: 'Italiensk luksus til spesielle anledninger', rating: 5 },
            { type: 'Merlot', desc: 'Mykere alternativ, god til mørt kjøtt', rating: 4 }
        ]
    },
    'lamb': {
        emoji: '🍖',
        name: 'Lam',
        wines: [
            { type: 'Rioja', desc: 'Spansk klassiker, perfekt match til lam', rating: 5 },
            { type: 'Côtes du Rhône', desc: 'Krydret og elegant med urtenoter', rating: 5 },
            { type: 'Pinot Noir', desc: 'Lettere alternativ til lammesteak', rating: 4 },
            { type: 'Châteauneuf-du-Pape', desc: 'Kraftig og kompleks til feiring', rating: 5 },
            { type: 'Grenache', desc: 'Fruktdreven og vennlig pris', rating: 4 }
        ]
    },
    'pork': {
        emoji: '🥓',
        name: 'Svin',
        wines: [
            { type: 'Riesling', desc: 'Spesielt tørr Riesling til svinekjøtt', rating: 5 },
            { type: 'Chardonnay', desc: 'Eiket utgave til kremet tilberedning', rating: 4 },
            { type: 'Pinot Noir', desc: 'Universell match, spesielt til ribbe', rating: 5 },
            { type: 'Rosé', desc: 'Forfriskende til svinenakke og pulled pork', rating: 4 },
            { type: 'Zinfandel', desc: 'Fruktdreven, god til BBQ-saus', rating: 4 }
        ]
    },
    'chicken': {
        emoji: '🍗',
        name: 'Kylling & Fjærfe',
        wines: [
            { type: 'Chardonnay', desc: 'Klassiker til stekt kylling', rating: 5 },
            { type: 'Pinot Grigio', desc: 'Frisk og lett til hvitt kjøtt', rating: 4 },
            { type: 'Sauvignon Blanc', desc: 'Perfekt til urtemrinert kylling', rating: 5 },
            { type: 'Champagne/Musserende', desc: 'Elegant til kyllingrett', rating: 4 },
            { type: 'Viognier', desc: 'Blomstret og aromatisk alternativ', rating: 4 }
        ]
    },
    'fish': {
        emoji: '🐟',
        name: 'Fisk',
        wines: [
            { type: 'Chablis', desc: 'Mineralsk, perfekt til skalldyr og hvitfisk', rating: 5 },
            { type: 'Muscadet', desc: 'Klassiker til østers og blåskjell', rating: 5 },
            { type: 'Pinot Grigio', desc: 'Lett og spritsende til laks', rating: 4 },
            { type: 'Albariño', desc: 'Spansk hvitvin til sjømat', rating: 5 },
            { type: 'Sancerre', desc: 'Elegant Sauvignon Blanc til fin fisk', rating: 5 }
        ]
    },
    'pasta': {
        emoji: '🍝',
        name: 'Pasta',
        wines: [
            { type: 'Chianti', desc: 'Italiensk klassiker til tomatsaus', rating: 5 },
            { type: 'Sangiovese', desc: 'Frisk syre balanserer tomater', rating: 5 },
            { type: 'Pinot Grigio', desc: 'Perfekt til hvite sauser og pesto', rating: 4 },
            { type: 'Barbera', desc: 'Lett og fruktig til bolognese', rating: 4 },
            { type: 'Verdicchio', desc: 'Til sjømatpasta', rating: 4 }
        ]
    },
    'pizza': {
        emoji: '🍕',
        name: 'Pizza',
        wines: [
            { type: 'Montepulciano', desc: 'Klassisk italiensk, uformell og god', rating: 5 },
            { type: 'Barbera', desc: 'Lett og frisk til ostepizza', rating: 4 },
            { type: 'Lambrusco', desc: 'Lettbrusende, perfekt match!', rating: 5 },
            { type: 'Nero d\'Avola', desc: 'Siciliansk til kjøttpizza', rating: 4 },
            { type: 'Prosecco', desc: 'Feiring med pizza!', rating: 4 }
        ]
    },
    'cheese': {
        emoji: '🧀',
        name: 'Ost',
        wines: [
            { type: 'Port', desc: 'Klassiker til blåost', rating: 5 },
            { type: 'Sauternes', desc: 'Søt vin til kraftige oster', rating: 5 },
            { type: 'Champagne', desc: 'Bobler til brie og camembert', rating: 5 },
            { type: 'Riesling', desc: 'Aromatisk til geitost', rating: 4 },
            { type: 'Amarone', desc: 'Kraftig til parmesan', rating: 5 }
        ]
    },
    'dessert': {
        emoji: '🍰',
        name: 'Dessert',
        wines: [
            { type: 'Moscato d\'Asti', desc: 'Lett søt til frukdessert', rating: 5 },
            { type: 'Late Harvest Riesling', desc: 'Honning og aprikos', rating: 5 },
            { type: 'Sherry (Pedro Ximénez)', desc: 'Til sjokolade!', rating: 5 },
            { type: 'Champagne Demi-Sec', desc: 'Til kake og macarons', rating: 4 },
            { type: 'Brachetto', desc: 'Lett rød til bær', rating: 4 }
        ]
    }
};

function openWinePairing(recipeId = null) {
    let selectedCategory = null;
    
    // If called from a recipe, try to auto-detect category
    if (recipeId) {
        const recipe = state.recipes.find(r => r.id === recipeId);
        if (recipe) {
            const name = (recipe.name + ' ' + (recipe.description || '')).toLowerCase();
            if (name.includes('biff') || name.includes('okse') || name.includes('storfe')) selectedCategory = 'beef';
            else if (name.includes('lam')) selectedCategory = 'lamb';
            else if (name.includes('svin') || name.includes('ribbe') || name.includes('nakke')) selectedCategory = 'pork';
            else if (name.includes('kylling') || name.includes('and') || name.includes('kalkun')) selectedCategory = 'chicken';
            else if (name.includes('fisk') || name.includes('laks') || name.includes('torsk') || name.includes('reke')) selectedCategory = 'fish';
            else if (name.includes('pasta') || name.includes('spaghetti') || name.includes('lasagne')) selectedCategory = 'pasta';
            else if (name.includes('pizza')) selectedCategory = 'pizza';
            else if (name.includes('ost') || name.includes('fondue')) selectedCategory = 'cheese';
            else if (name.includes('kake') || name.includes('dessert') || name.includes('sjokolade')) selectedCategory = 'dessert';
        }
    }
    
    const categoryButtons = Object.entries(winePairings).map(([key, data]) => 
        `<button class="wine-cat-btn ${selectedCategory === key ? 'active' : ''}" onclick="showWinePairings('${key}')">${data.emoji}<br>${data.name}</button>`
    ).join('');
    
    showModal('🍷 Vinanbefaling', `
        <div class="wine-pairing-guide">
            <p style="text-align: center; color: var(--text-secondary); margin-bottom: 16px;">
                Velg mattype for å få vinforslag
            </p>
            <div class="wine-categories" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px;">
                ${categoryButtons}
            </div>
            <div id="winePairingResults" class="wine-results">
                ${selectedCategory ? getWinePairingHtml(selectedCategory) : '<p style="text-align: center; color: var(--text-tertiary);">👆 Velg en kategori over</p>'}
            </div>
        </div>
    `, [], { width: '450px' });
}
window.openWinePairing = openWinePairing;

function showWinePairings(category) {
    const resultsDiv = document.getElementById('winePairingResults');
    if (!resultsDiv || !winePairings[category]) return;
    
    resultsDiv.innerHTML = getWinePairingHtml(category);
    
    // Highlight selected button
    document.querySelectorAll('.wine-cat-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.wine-cat-btn')?.classList.add('active');
}
window.showWinePairings = showWinePairings;

function getWinePairingHtml(category) {
    const data = winePairings[category];
    if (!data) return '';
    
    return `
        <div class="wine-pairing-list">
            <h4 style="margin: 0 0 12px 0;">${data.emoji} Viner til ${data.name}</h4>
            ${data.wines.map(wine => `
                <div class="wine-item" style="padding: 12px; background: var(--card-bg); border-radius: 8px; margin-bottom: 8px; border: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="color: var(--accent-color);">🍷 ${wine.type}</strong>
                        <span style="color: #f4c430;">${'★'.repeat(wine.rating)}${'☆'.repeat(5-wine.rating)}</span>
                    </div>
                    <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: var(--text-secondary);">${wine.desc}</p>
                </div>
            `).join('')}
            <p style="margin: 12px 0 0 0; font-size: 0.8rem; color: var(--text-tertiary); text-align: center;">
                💡 Tips: Temperaturen for rødvin er 16-18°C, hvitvin 8-12°C
            </p>
        </div>
    `;
}

// ===== KITCHEN CONVERSION CALCULATOR =====
const kitchenConversions = {
    volume: {
        'dl': { 'ml': 100, 'liter': 0.1, 'ss': 6.67, 'ts': 20, 'kopp': 0.42 },
        'ml': { 'dl': 0.01, 'liter': 0.001, 'ss': 0.067, 'ts': 0.2, 'kopp': 0.0042 },
        'liter': { 'dl': 10, 'ml': 1000, 'ss': 66.7, 'ts': 200, 'kopp': 4.2 },
        'ss': { 'dl': 0.15, 'ml': 15, 'ts': 3, 'kopp': 0.063 },
        'ts': { 'dl': 0.05, 'ml': 5, 'ss': 0.33, 'kopp': 0.021 },
        'kopp': { 'dl': 2.37, 'ml': 237, 'liter': 0.237, 'ss': 16, 'ts': 48 }
    },
    weight: {
        'g': { 'kg': 0.001, 'mg': 1000, 'oz': 0.035, 'lb': 0.0022 },
        'kg': { 'g': 1000, 'mg': 1000000, 'oz': 35.27, 'lb': 2.2 },
        'oz': { 'g': 28.35, 'kg': 0.028, 'lb': 0.0625 },
        'lb': { 'g': 453.6, 'kg': 0.454, 'oz': 16 }
    },
    temperature: {
        'celsius': { 'fahrenheit': (c) => c * 9/5 + 32, 'kelvin': (c) => c + 273.15 },
        'fahrenheit': { 'celsius': (f) => (f - 32) * 5/9, 'kelvin': (f) => (f - 32) * 5/9 + 273.15 },
        'kelvin': { 'celsius': (k) => k - 273.15, 'fahrenheit': (k) => (k - 273.15) * 9/5 + 32 }
    }
};

// Common ingredient densities (g per dl)
const ingredientDensities = {
    'mel': 60, 'hvetemel': 60, 'sukker': 85, 'melis': 50, 'brunt sukker': 90,
    'smør': 96, 'olje': 92, 'melk': 103, 'fløte': 100, 'rømme': 115,
    'ris': 95, 'havregryn': 40, 'mandler': 70, 'valnøtter': 50,
    'honning': 140, 'sirup': 140, 'kakao': 45, 'salt': 120, 'pepper': 50,
    'parmesan': 50, 'cottage cheese': 115, 'yoghurt': 102
};

function openKitchenCalculator() {
    showModal('🧮 Kjøkken-kalkulator', `
        <div class="kitchen-calculator">
            <div class="calc-tabs" style="display: flex; gap: 8px; margin-bottom: 16px;">
                <button class="calc-tab active" onclick="showCalcTab('volume')">📏 Volum</button>
                <button class="calc-tab" onclick="showCalcTab('weight')">⚖️ Vekt</button>
                <button class="calc-tab" onclick="showCalcTab('temp')">🌡️ Temperatur</button>
                <button class="calc-tab" onclick="showCalcTab('ingredient')">🥄 Ingrediens</button>
            </div>
            
            <div id="calcTabContent">
                ${getVolumeCalcHtml()}
            </div>
        </div>
    `, [], { width: '400px' });
}
window.openKitchenCalculator = openKitchenCalculator;

function showCalcTab(tab) {
    document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    const content = document.getElementById('calcTabContent');
    if (tab === 'volume') content.innerHTML = getVolumeCalcHtml();
    else if (tab === 'weight') content.innerHTML = getWeightCalcHtml();
    else if (tab === 'temp') content.innerHTML = getTempCalcHtml();
    else if (tab === 'ingredient') content.innerHTML = getIngredientCalcHtml();
}
window.showCalcTab = showCalcTab;

function getVolumeCalcHtml() {
    return `
        <div class="calc-section">
            <input type="number" id="volumeAmount" placeholder="Mengde" style="width: 100%; padding: 12px; font-size: 1.2rem; margin-bottom: 8px; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <select id="volumeFrom" style="flex: 1; padding: 10px; border-radius: 8px;" onchange="convertVolume()">
                    <option value="dl">dl (desiliter)</option>
                    <option value="ml">ml (milliliter)</option>
                    <option value="liter">liter</option>
                    <option value="ss">ss (spiseskje)</option>
                    <option value="ts">ts (teskje)</option>
                    <option value="kopp">kopp (US)</option>
                </select>
                <span style="padding: 10px;">→</span>
                <select id="volumeTo" style="flex: 1; padding: 10px; border-radius: 8px;" onchange="convertVolume()">
                    <option value="ml">ml</option>
                    <option value="dl">dl</option>
                    <option value="liter">liter</option>
                    <option value="ss">ss</option>
                    <option value="ts">ts</option>
                    <option value="kopp">kopp</option>
                </select>
            </div>
            <button onclick="convertVolume()" class="btn-primary" style="width: 100%; padding: 12px;">Konverter</button>
            <div id="volumeResult" style="margin-top: 12px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px; text-align: center; font-size: 1.3rem; font-weight: bold;"></div>
        </div>
    `;
}

function getWeightCalcHtml() {
    return `
        <div class="calc-section">
            <input type="number" id="weightAmount" placeholder="Mengde" style="width: 100%; padding: 12px; font-size: 1.2rem; margin-bottom: 8px; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <select id="weightFrom" style="flex: 1; padding: 10px; border-radius: 8px;">
                    <option value="g">gram</option>
                    <option value="kg">kilogram</option>
                    <option value="oz">ounce</option>
                    <option value="lb">pound</option>
                </select>
                <span style="padding: 10px;">→</span>
                <select id="weightTo" style="flex: 1; padding: 10px; border-radius: 8px;">
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="oz">oz</option>
                    <option value="lb">lb</option>
                </select>
            </div>
            <button onclick="convertWeight()" class="btn-primary" style="width: 100%; padding: 12px;">Konverter</button>
            <div id="weightResult" style="margin-top: 12px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px; text-align: center; font-size: 1.3rem; font-weight: bold;"></div>
        </div>
    `;
}

function getTempCalcHtml() {
    return `
        <div class="calc-section">
            <input type="number" id="tempAmount" placeholder="Temperatur" style="width: 100%; padding: 12px; font-size: 1.2rem; margin-bottom: 8px; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <select id="tempFrom" style="flex: 1; padding: 10px; border-radius: 8px;">
                    <option value="celsius">Celsius (°C)</option>
                    <option value="fahrenheit">Fahrenheit (°F)</option>
                </select>
                <span style="padding: 10px;">→</span>
                <select id="tempTo" style="flex: 1; padding: 10px; border-radius: 8px;">
                    <option value="fahrenheit">Fahrenheit (°F)</option>
                    <option value="celsius">Celsius (°C)</option>
                </select>
            </div>
            <button onclick="convertTemp()" class="btn-primary" style="width: 100%; padding: 12px;">Konverter</button>
            <div id="tempResult" style="margin-top: 12px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px; text-align: center; font-size: 1.3rem; font-weight: bold;"></div>
            <div style="margin-top: 12px; font-size: 0.9rem; color: var(--text-secondary);">
                <p>🔥 Vanlige ovnstemp: 175°C = 350°F, 200°C = 400°F, 225°C = 435°F</p>
            </div>
        </div>
    `;
}

function getIngredientCalcHtml() {
    const options = Object.keys(ingredientDensities).map(i => `<option value="${i}">${i}</option>`).join('');
    return `
        <div class="calc-section">
            <p style="margin-bottom: 12px; color: var(--text-secondary);">Konverter mellom volum og vekt for vanlige ingredienser</p>
            <select id="ingredientSelect" style="width: 100%; padding: 10px; border-radius: 8px; margin-bottom: 8px;">
                ${options}
            </select>
            <input type="number" id="ingredientAmount" placeholder="Mengde" style="width: 100%; padding: 12px; font-size: 1.2rem; margin-bottom: 8px; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <select id="ingredientFrom" style="flex: 1; padding: 10px; border-radius: 8px;">
                    <option value="dl">dl</option>
                    <option value="g">gram</option>
                </select>
                <span style="padding: 10px;">→</span>
                <select id="ingredientTo" style="flex: 1; padding: 10px; border-radius: 8px;">
                    <option value="g">gram</option>
                    <option value="dl">dl</option>
                </select>
            </div>
            <button onclick="convertIngredient()" class="btn-primary" style="width: 100%; padding: 12px;">Konverter</button>
            <div id="ingredientResult" style="margin-top: 12px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px; text-align: center; font-size: 1.3rem; font-weight: bold;"></div>
        </div>
    `;
}

function convertVolume() {
    const amount = parseFloat($('volumeAmount')?.value);
    const from = $('volumeFrom')?.value;
    const to = $('volumeTo')?.value;
    const result = $('volumeResult');
    
    if (!amount || !from || !to || !result) return;
    
    if (from === to) {
        result.innerHTML = `${amount} ${from}`;
        return;
    }
    
    const factor = kitchenConversions.volume[from]?.[to];
    if (factor) {
        const converted = (amount * factor).toFixed(2);
        result.innerHTML = `${amount} ${from} = <strong>${converted} ${to}</strong>`;
    }
}
window.convertVolume = convertVolume;

function convertWeight() {
    const amount = parseFloat($('weightAmount')?.value);
    const from = $('weightFrom')?.value;
    const to = $('weightTo')?.value;
    const result = $('weightResult');
    
    if (!amount || !from || !to || !result) return;
    
    if (from === to) {
        result.innerHTML = `${amount} ${from}`;
        return;
    }
    
    const factor = kitchenConversions.weight[from]?.[to];
    if (factor) {
        const converted = (amount * factor).toFixed(2);
        result.innerHTML = `${amount} ${from} = <strong>${converted} ${to}</strong>`;
    }
}
window.convertWeight = convertWeight;

function convertTemp() {
    const amount = parseFloat($('tempAmount')?.value);
    const from = $('tempFrom')?.value;
    const to = $('tempTo')?.value;
    const result = $('tempResult');
    
    if (isNaN(amount) || !from || !to || !result) return;
    
    if (from === to) {
        result.innerHTML = `${amount}°`;
        return;
    }
    
    const converter = kitchenConversions.temperature[from]?.[to];
    if (converter) {
        const converted = converter(amount).toFixed(1);
        const symbol = to === 'celsius' ? '°C' : to === 'fahrenheit' ? '°F' : 'K';
        const fromSymbol = from === 'celsius' ? '°C' : from === 'fahrenheit' ? '°F' : 'K';
        result.innerHTML = `${amount}${fromSymbol} = <strong>${converted}${symbol}</strong>`;
    }
}
window.convertTemp = convertTemp;

function convertIngredient() {
    const ingredient = $('ingredientSelect')?.value;
    const amount = parseFloat($('ingredientAmount')?.value);
    const from = $('ingredientFrom')?.value;
    const to = $('ingredientTo')?.value;
    const result = $('ingredientResult');
    
    if (!ingredient || !amount || !from || !to || !result) return;
    
    const density = ingredientDensities[ingredient]; // g per dl
    
    let converted;
    if (from === 'dl' && to === 'g') {
        converted = amount * density;
    } else if (from === 'g' && to === 'dl') {
        converted = amount / density;
    } else {
        result.innerHTML = `${amount} ${from}`;
        return;
    }
    
    result.innerHTML = `${amount} ${from} ${ingredient} = <strong>${converted.toFixed(1)} ${to}</strong>`;
}
window.convertIngredient = convertIngredient;

// ===== RECIPE COST CALCULATOR =====
function openRecipeCostCalculator(recipeId = null) {
    let recipe = null;
    if (recipeId) {
        recipe = state.recipes.find(r => r.id === recipeId);
    }
    
    const ingredientRows = recipe?.ingredients?.map((ing, i) => `
        <div class="cost-row" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
            <span style="flex: 2;">${escapeHtml(ing)}</span>
            <input type="number" class="cost-input" data-index="${i}" placeholder="Pris" 
                   style="flex: 1; padding: 8px; border-radius: 8px; border: 1px solid var(--border-color);">
        </div>
    `).join('') || '<p>Velg en oppskrift først</p>';
    
    showModal('💰 Kostnadskalkulator', `
        <div class="cost-calculator">
            ${!recipe ? `
                <select id="costRecipeSelect" onchange="loadRecipeForCost(this.value)" 
                        style="width: 100%; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                    <option value="">Velg oppskrift...</option>
                    ${state.recipes.map(r => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('')}
                </select>
            ` : `<h3 style="margin-bottom: 16px;">${escapeHtml(recipe.name)}</h3>`}
            
            <div id="costIngredients">
                ${ingredientRows}
            </div>
            
            <div style="margin-top: 16px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Antall porsjoner:</span>
                    <input type="number" id="costPortions" value="${recipe?.servings || 4}" min="1" 
                           style="width: 80px; padding: 8px; text-align: center; border-radius: 8px;">
                </div>
                <button onclick="calculateManualRecipeCost()" class="btn-primary" style="width: 100%; padding: 12px; margin-top: 8px;">
                    Beregn kostnad
                </button>
            </div>
            
            <div id="costResult" style="margin-top: 16px; display: none; padding: 20px; background: linear-gradient(135deg, var(--accent-color), var(--accent-secondary)); border-radius: 12px; color: white; text-align: center;">
            </div>
        </div>
    `, [], { width: '450px' });
}
window.openRecipeCostCalculator = openRecipeCostCalculator;

function loadRecipeForCost(recipeId) {
    if (!recipeId) return;
    openRecipeCostCalculator(recipeId);
}
window.loadRecipeForCost = loadRecipeForCost;

function calculateManualRecipeCost() {
    const inputs = document.querySelectorAll('.cost-input');
    const portions = parseInt($('costPortions')?.value) || 4;
    
    let total = 0;
    inputs.forEach(input => {
        const price = parseFloat(input.value) || 0;
        total += price;
    });
    
    const perPortion = total / portions;
    const result = $('costResult');
    
    if (result) {
        result.style.display = 'block';
        result.innerHTML = `
            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 8px;">${formatCurrency(total)}</div>
            <div style="font-size: 1rem; opacity: 0.9;">Total kostnad</div>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.3);">
                <div style="font-size: 1.5rem; font-weight: bold;">${formatCurrency(perPortion)}</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">per porsjon (${portions} stk)</div>
            </div>
        `;
    }
}
window.calculateManualRecipeCost = calculateManualRecipeCost;

// ===== COOKING PLAYLIST / SPOTIFY INTEGRATION =====
function openCookingPlaylist() {
    const playlists = [
        { name: 'Italian Dinner', mood: '🇮🇹 Italiensk middag', url: 'https://open.spotify.com/playlist/37i9dQZF1DX6ThddIjWuGT' },
        { name: 'Sunday Brunch', mood: '☀️ Søndagsbrunch', url: 'https://open.spotify.com/playlist/37i9dQZF1DWVkpjcLfcMvH' },
        { name: 'Cooking Jazz', mood: '🎷 Jazz i kjøkkenet', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4wta20PHgwo' },
        { name: 'French Café', mood: '🥐 Fransk kaféstemning', url: 'https://open.spotify.com/playlist/37i9dQZF1DX5xiztvBdlUf' },
        { name: 'Dinner Party', mood: '🥂 Middagsselskap', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4xuWVBs4FgJ' },
        { name: 'Acoustic Cooking', mood: '🎸 Akustisk stemning', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4E3UdUs7fUx' },
        { name: 'Latin Kitchen', mood: '💃 Latinamerikansk', url: 'https://open.spotify.com/playlist/37i9dQZF1DX10zKzsJ2jva' },
        { name: 'Classical Cooking', mood: '🎻 Klassisk musikk', url: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn' }
    ];
    
    showModal('🎵 Kokemusikk', `
        <div class="cooking-playlist">
            <p style="text-align: center; color: var(--text-secondary); margin-bottom: 16px;">
                Velg stemningen for matlagingen!
            </p>
            <div class="playlist-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                ${playlists.map(p => `
                    <a href="${p.url}" target="_blank" rel="noopener noreferrer" 
                       class="playlist-card" style="display: block; padding: 16px; background: var(--card-bg); border-radius: 12px; text-decoration: none; color: inherit; border: 1px solid var(--border-color); transition: transform 0.2s, box-shadow 0.2s;"
                       onmouseover="this.style.transform='scale(1.03)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';"
                       onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                        <div style="font-size: 1.5rem; margin-bottom: 8px;">${p.mood.split(' ')[0]}</div>
                        <div style="font-weight: 600; margin-bottom: 4px;">${p.name}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">${p.mood}</div>
                    </a>
                `).join('')}
            </div>
            <p style="text-align: center; color: var(--text-tertiary); font-size: 0.85rem; margin-top: 16px;">
                🎧 Åpnes i Spotify
            </p>
        </div>
    `, [], { width: '450px' });
}
window.openCookingPlaylist = openCookingPlaylist;

// ===== QUICK RECIPE SHARING (QR Code) =====
function shareRecipeWithQR(recipeId) {
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    // Create shareable data
    const shareData = {
        n: recipe.name,
        i: recipe.ingredients?.slice(0, 10),
        s: recipe.steps?.slice(0, 10),
        p: recipe.servings,
        t: recipe.prepTime
    };
    
    const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)));
    const shareUrl = `${window.location.origin}${window.location.pathname}?recipe=${encoded}`;
    
    // Generate QR code using a simple API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
    
    showModal('📲 Del oppskrift', `
        <div style="text-align: center;">
            <h3 style="margin-bottom: 16px;">${escapeHtml(recipe.name)}</h3>
            <img src="${qrUrl}" alt="QR Code" style="border-radius: 12px; margin-bottom: 16px;">
            <p style="color: var(--text-secondary); margin-bottom: 16px;">
                Skann QR-koden for å dele oppskriften
            </p>
            <div style="display: flex; gap: 8px; justify-content: center;">
                <button onclick="copyRecipeLink('${shareUrl}')" class="btn-secondary" style="padding: 12px 20px;">
                    📋 Kopier lenke
                </button>
                <button onclick="nativeShareRecipe('${escapeHtml(recipe.name)}', '${shareUrl}')" class="btn-primary" style="padding: 12px 20px;">
                    📤 Del
                </button>
            </div>
        </div>
    `, [], { width: '350px' });
}
window.shareRecipeWithQR = shareRecipeWithQR;

function copyRecipeLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast('📋 Lenke kopiert!', 'success');
    });
}
window.copyRecipeLink = copyRecipeLink;

function nativeShareRecipe(name, url) {
    if (navigator.share) {
        navigator.share({
            title: name,
            text: `Sjekk ut denne oppskriften: ${name}`,
            url: url
        });
    } else {
        copyRecipeLink(url);
    }
}
window.nativeShareRecipe = nativeShareRecipe;

// ===== RECIPE PRINT MODE =====
function printRecipe(recipeId = null) {
    // Support both recipeId parameter and state.currentRecipe
    const recipe = recipeId 
        ? state.recipes.find(r => r.id === recipeId)
        : state.currentRecipe;
    if (!recipe) return;
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${recipe.name} - Familiens Kokebok</title>
            <style>
                body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #333; }
                h1 { font-size: 2rem; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .meta { color: #666; margin-bottom: 20px; }
                h2 { font-size: 1.3rem; margin-top: 24px; color: #555; }
                ul, ol { line-height: 1.8; }
                li { margin-bottom: 8px; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9rem; color: #888; }
                @media print { body { margin: 20px; } }
            </style>
        </head>
        <body>
            <h1>🍳 ${escapeHtml(recipe.name)}</h1>
            <div class="meta">
                ${recipe.servings ? `👥 ${recipe.servings} porsjoner` : ''}
                ${recipe.prepTime ? ` • ⏱️ ${recipe.prepTime} min` : ''}
                ${recipe.category ? ` • 📁 ${escapeHtml(recipe.category)}` : ''}
            </div>
            
            ${recipe.description ? `<p><em>${escapeHtml(recipe.description)}</em></p>` : ''}
            
            <h2>📝 Ingredienser</h2>
            <div style="white-space: pre-wrap; line-height: 1.8;">${escapeHtml(getIngredientsAsString(recipe.ingredients))}</div>
            
            <h2>👨‍🍳 Fremgangsmåte</h2>
            <div style="white-space: pre-wrap; line-height: 1.8;">${escapeHtml(recipe.instructions || recipe.steps?.join('\n') || 'Ingen fremgangsmåte angitt')}</div>
            
            ${recipe.notes ? `<h2>💡 Notater</h2><p>${escapeHtml(recipe.notes)}</p>` : ''}
            
            <div class="footer">
                <p>Skrevet ut fra Familiens Kokebok • ${new Date().toLocaleDateString('nb-NO')}</p>
            </div>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}
window.printRecipe = printRecipe;

// ===== RECIPE RATING SYSTEM =====
function rateRecipe(recipeId) {
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    const currentRating = recipe.rating || 0;
    
    const html = `
        <div class="rating-dialog">
            <h3>Vurder "${escapeHtml(recipe.name)}"</h3>
            
            <div class="star-rating" id="starRating">
                ${[1, 2, 3, 4, 5].map(n => `
                    <span class="star ${n <= currentRating ? 'filled' : ''}" 
                          onclick="setRating(${n})" 
                          onmouseover="previewRating(${n})"
                          onmouseout="resetRatingPreview()">★</span>
                `).join('')}
            </div>
            <p class="rating-text" id="ratingText">${getRatingText(currentRating)}</p>
            
            <div class="rating-notes">
                <label>Notater (valgfritt):</label>
                <textarea id="ratingNotes" placeholder="Hva syntes du om oppskriften?">${recipe.ratingNotes || ''}</textarea>
            </div>
            
            <button class="btn btn-primary" onclick="saveRating('${recipeId}')">Lagre vurdering</button>
        </div>
    `;
    
    showModal('⭐ Vurder oppskrift', html, []);
    window.currentRatingValue = currentRating;
}
window.rateRecipe = rateRecipe;

function getRatingText(rating) {
    const texts = ['Ikke vurdert', 'Dårlig', 'OK', 'Bra', 'Veldig bra', 'Fantastisk!'];
    return texts[rating] || texts[0];
}

function setRating(value) {
    window.currentRatingValue = value;
    updateStarDisplay(value);
    document.getElementById('ratingText').textContent = getRatingText(value);
}
window.setRating = setRating;

function previewRating(value) {
    updateStarDisplay(value);
}
window.previewRating = previewRating;

function resetRatingPreview() {
    updateStarDisplay(window.currentRatingValue || 0);
}
window.resetRatingPreview = resetRatingPreview;

function updateStarDisplay(value) {
    const stars = document.querySelectorAll('#starRating .star');
    stars.forEach((star, index) => {
        star.classList.toggle('filled', index < value);
    });
}

async function saveRating(recipeId) {
    const rating = window.currentRatingValue;
    const notes = document.getElementById('ratingNotes')?.value || '';
    
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    recipe.rating = rating;
    recipe.ratingNotes = notes;
    recipe.ratedAt = new Date().toISOString();
    
    await saveToFirestore('recipes', recipeId, recipe);
    closeGenericModal();
    showToast(`⭐ Oppskrift vurdert: ${rating}/5`, 'success');
    
    // Update view if currently viewing this recipe
    if (state.currentRecipe?.id === recipeId) {
        state.currentRecipe = recipe;
        renderRecipeView();
    }
}
window.saveRating = saveRating;

