// ===== MÅL OG VEKT KALKULATOR (som Matprat men bedre) =====
const measurementData = {
    // Format: ingrediens -> { grPerDl, grPerSs, grPerTs, grPerKopp, stykkvekt }
    ingredients: {
        // Mel og stivelse
        'hvetemel': { grPerDl: 55, grPerSs: 9, grPerTs: 3, grPerKopp: 137.5 },
        'sammalt hvetemel': { grPerDl: 60, grPerSs: 10, grPerTs: 3.3, grPerKopp: 150 },
        'grovt mel': { grPerDl: 60, grPerSs: 10, grPerTs: 3.3, grPerKopp: 150 },
        'havremel': { grPerDl: 45, grPerSs: 7, grPerTs: 2.5, grPerKopp: 112.5 },
        'maisenna': { grPerDl: 60, grPerSs: 10, grPerTs: 3.3, grPerKopp: 150 },
        'potetmel': { grPerDl: 75, grPerSs: 12, grPerTs: 4, grPerKopp: 187.5 },
        'bakepulver': { grPerDl: 90, grPerSs: 15, grPerTs: 5, grPerKopp: 225 },
        'natron': { grPerDl: 100, grPerSs: 17, grPerTs: 5.5, grPerKopp: 250 },
        
        // Sukker
        'sukker': { grPerDl: 90, grPerSs: 13, grPerTs: 4.5, grPerKopp: 225 },
        'melis': { grPerDl: 55, grPerSs: 8, grPerTs: 2.5, grPerKopp: 137.5 },
        'brunt sukker': { grPerDl: 80, grPerSs: 12, grPerTs: 4, grPerKopp: 200 },
        'vaniljesukker': { grPerDl: 85, grPerSs: 13, grPerTs: 4, grPerKopp: 212.5 },
        'honning': { grPerDl: 140, grPerSs: 21, grPerTs: 7, grPerKopp: 350 },
        'sirup': { grPerDl: 140, grPerSs: 21, grPerTs: 7, grPerKopp: 350 },
        
        // Meieriprodukter
        'smør': { grPerDl: 85, grPerSs: 15, grPerTs: 5, grPerKopp: 212.5 },
        'margarin': { grPerDl: 85, grPerSs: 15, grPerTs: 5, grPerKopp: 212.5 },
        'melk': { grPerDl: 100, grPerSs: 15, grPerTs: 5, grPerKopp: 250 },
        'fløte': { grPerDl: 100, grPerSs: 15, grPerTs: 5, grPerKopp: 250 },
        'rømme': { grPerDl: 100, grPerSs: 15, grPerTs: 5, grPerKopp: 250 },
        'kremost': { grPerDl: 115, grPerSs: 17, grPerTs: 6, grPerKopp: 287.5 },
        'cottage cheese': { grPerDl: 110, grPerSs: 16, grPerTs: 5.5, grPerKopp: 275 },
        'yoghurt': { grPerDl: 105, grPerSs: 16, grPerTs: 5, grPerKopp: 262.5 },
        'parmesan revet': { grPerDl: 50, grPerSs: 8, grPerTs: 2.5, grPerKopp: 125 },
        'ost revet': { grPerDl: 45, grPerSs: 7, grPerTs: 2.3, grPerKopp: 112.5 },
        
        // Fett og olje
        'olje': { grPerDl: 90, grPerSs: 14, grPerTs: 4.5, grPerKopp: 225 },
        'olivenolje': { grPerDl: 90, grPerSs: 14, grPerTs: 4.5, grPerKopp: 225 },
        
        // Væsker
        'vann': { grPerDl: 100, grPerSs: 15, grPerTs: 5, grPerKopp: 250 },
        
        // Nøtter og frø
        'mandler': { grPerDl: 70, grPerSs: 11, grPerTs: 3.5, grPerKopp: 175 },
        'hasselnøtter': { grPerDl: 65, grPerSs: 10, grPerTs: 3.3, grPerKopp: 162.5 },
        'valnøtter': { grPerDl: 50, grPerSs: 8, grPerTs: 2.5, grPerKopp: 125 },
        'pinjekjerner': { grPerDl: 70, grPerSs: 11, grPerTs: 3.5, grPerKopp: 175 },
        'sesamfrø': { grPerDl: 65, grPerSs: 10, grPerTs: 3.3, grPerKopp: 162.5 },
        'solsikkefrø': { grPerDl: 60, grPerSs: 9, grPerTs: 3, grPerKopp: 150 },
        'chiafrø': { grPerDl: 80, grPerSs: 12, grPerTs: 4, grPerKopp: 200 },
        'linfrø': { grPerDl: 85, grPerSs: 13, grPerTs: 4.3, grPerKopp: 212.5 },
        
        // Frokostblanding
        'havregryn': { grPerDl: 40, grPerSs: 6, grPerTs: 2, grPerKopp: 100 },
        'lettkokte havregryn': { grPerDl: 40, grPerSs: 6, grPerTs: 2, grPerKopp: 100 },
        'cornflakes': { grPerDl: 15, grPerSs: 2.5, grPerTs: 0.8, grPerKopp: 37.5 },
        'müsli': { grPerDl: 45, grPerSs: 7, grPerTs: 2.3, grPerKopp: 112.5 },
        
        // Ris og pasta
        'ris': { grPerDl: 90, grPerSs: 14, grPerTs: 4.5, grPerKopp: 225 },
        'risotto-ris': { grPerDl: 95, grPerSs: 14, grPerTs: 4.7, grPerKopp: 237.5 },
        'couscous': { grPerDl: 90, grPerSs: 14, grPerTs: 4.5, grPerKopp: 225 },
        'bulgur': { grPerDl: 85, grPerSs: 13, grPerTs: 4.3, grPerKopp: 212.5 },
        'quinoa': { grPerDl: 85, grPerSs: 13, grPerTs: 4.3, grPerKopp: 212.5 },
        
        // Kakao og sjokolade
        'kakao': { grPerDl: 45, grPerSs: 7, grPerTs: 2.3, grPerKopp: 112.5 },
        'sjokoladebiter': { grPerDl: 85, grPerSs: 13, grPerTs: 4.3, grPerKopp: 212.5 },
        
        // Krydder
        'salt': { grPerDl: 120, grPerSs: 18, grPerTs: 6, grPerKopp: 300 },
        'pepper': { grPerDl: 50, grPerSs: 8, grPerTs: 2.5, grPerKopp: 125 },
        'kanel': { grPerDl: 55, grPerSs: 8, grPerTs: 2.8, grPerKopp: 137.5 },
        'ingefær malt': { grPerDl: 50, grPerSs: 8, grPerTs: 2.5, grPerKopp: 125 },
        'muskatnøtt': { grPerDl: 55, grPerSs: 8, grPerTs: 2.8, grPerKopp: 137.5 },
        'kardemomme': { grPerDl: 50, grPerSs: 8, grPerTs: 2.5, grPerKopp: 125 },
        
        // Hermetikk/annet
        'rosiner': { grPerDl: 70, grPerSs: 11, grPerTs: 3.5, grPerKopp: 175 },
        'tørkede aprikoser': { grPerDl: 65, grPerSs: 10, grPerTs: 3.3, grPerKopp: 162.5 },
        'kokos revet': { grPerDl: 35, grPerSs: 5, grPerTs: 1.8, grPerKopp: 87.5 },
        'peanøttsmør': { grPerDl: 130, grPerSs: 20, grPerTs: 6.5, grPerKopp: 325 },
        'syltetøy': { grPerDl: 130, grPerSs: 20, grPerTs: 6.5, grPerKopp: 325 },
        
        // Kaffe
        'kaffe malt': { grPerDl: 35, grPerSs: 6, grPerTs: 2, grPerKopp: 87.5 }
    },
    
    // Stykkvekt for frukt og grønnsaker
    produce: {
        'eple': { avgWeight: 150, unit: 'stk' },
        'banan': { avgWeight: 120, unit: 'stk' },
        'appelsin': { avgWeight: 200, unit: 'stk' },
        'sitron': { avgWeight: 80, unit: 'stk' },
        'lime': { avgWeight: 50, unit: 'stk' },
        'avokado': { avgWeight: 200, unit: 'stk' },
        'tomat': { avgWeight: 120, unit: 'stk' },
        'agurk': { avgWeight: 335, unit: 'stk' },
        'paprika': { avgWeight: 180, unit: 'stk' },
        'løk': { avgWeight: 150, unit: 'stk' },
        'hvitløkfedd': { avgWeight: 5, unit: 'fedd' },
        'gulrot': { avgWeight: 80, unit: 'stk' },
        'potet': { avgWeight: 150, unit: 'stk' },
        'brokkoli': { avgWeight: 400, unit: 'hode' },
        'blomkål': { avgWeight: 600, unit: 'hode' },
        'squash': { avgWeight: 300, unit: 'stk' },
        'aubergine': { avgWeight: 350, unit: 'stk' },
        'egg': { avgWeight: 60, unit: 'stk' }
    }
};

function openMeasurementCalculator() {
    const ingredientOptions = Object.keys(measurementData.ingredients)
        .map(i => `<option value="${i}">${i.charAt(0).toUpperCase() + i.slice(1)}</option>`)
        .join('');
    
    const produceOptions = Object.keys(measurementData.produce)
        .map(i => `<option value="${i}">${i.charAt(0).toUpperCase() + i.slice(1)}</option>`)
        .join('');
    
    const html = `
        <div class="measurement-calculator">
            <div class="calc-header">
                <span class="calc-header-icon">📐</span>
                <h3>Mål & Vekt Kalkulator</h3>
                <p>Konverter enkelt mellom ulike måleenheter</p>
            </div>
            
            <div class="calc-tabs">
                <button class="calc-tab active" onclick="switchCalcTab('convert')">🔄 Regn om</button>
                <button class="calc-tab" onclick="switchCalcTab('weight')">⚖️ Frukt & grønt</button>
                <button class="calc-tab" onclick="switchCalcTab('tools')">📐 Verktøy</button>
            </div>
            
            <div id="calcTabContent">
                <div id="convertTab" class="calc-content active">
                    <div class="calc-section-title">🥄 Ingrediens-kalkulator</div>
                    <p class="calc-section-desc">Velg ingrediens og skriv inn mengde i ett felt - resten beregnes automatisk</p>
                    
                    <div class="calc-row">
                        <select id="calcIngredient" onchange="updateCalculation()">
                            <option value="">📋 Velg ingrediens...</option>
                            ${ingredientOptions}
                        </select>
                    </div>
                    
                    <div class="calc-input-grid">
                        <div class="calc-input-item">
                            <label>GRAM</label>
                            <input type="number" id="calcGram" placeholder="0" oninput="calcFromGram()">
                        </div>
                        <div class="calc-input-item">
                            <label>DESILITER</label>
                            <input type="number" id="calcDl" placeholder="0" step="0.1" oninput="calcFromDl()">
                        </div>
                        <div class="calc-input-item">
                            <label>SPISESKJE</label>
                            <input type="number" id="calcSs" placeholder="0" step="0.5" oninput="calcFromSs()">
                        </div>
                        <div class="calc-input-item">
                            <label>TESKJE</label>
                            <input type="number" id="calcTs" placeholder="0" step="0.5" oninput="calcFromTs()">
                        </div>
                        <div class="calc-input-item">
                            <label>KOPP (2.5 DL)</label>
                            <input type="number" id="calcKopp" placeholder="0" step="0.25" oninput="calcFromKopp()">
                        </div>
                        <div class="calc-input-item">
                            <label>US CUP</label>
                            <input type="number" id="calcCup" placeholder="0" step="0.25" oninput="calcFromCup()">
                        </div>
                    </div>
                </div>
                
                <div id="weightTab" class="calc-content">
                    <div class="calc-section-title">🥕 Vekt til mengde</div>
                    <p class="calc-section-desc">Finn ut hvor mange stykker du trenger basert på vekt</p>
                    
                    <div class="calc-row">
                        <select id="produceSelect" onchange="updateProduceCalc()">
                            <option value="">📋 Velg råvare...</option>
                            ${produceOptions}
                        </select>
                    </div>
                    
                    <div class="produce-calc-row">
                        <div class="produce-input">
                            <label>GRAM</label>
                            <input type="number" id="produceGram" placeholder="500" oninput="calcProduceFromGram()">
                        </div>
                        <span class="calc-equals">→</span>
                        <div class="produce-result">
                            <span id="produceAmount">0</span>
                            <span id="produceUnit">stk</span>
                        </div>
                    </div>
                    
                    <div id="produceInfo" class="produce-info">
                        <p class="produce-avg">Velg en råvare for å se gjennomsnittsvekt</p>
                    </div>
                </div>
                
                <div id="toolsTab" class="calc-content">
                    <div class="calc-section-title">🔧 Konverteringsverktøy</div>
                    <p class="calc-section-desc">Konverter mellom vekt, volum og temperatur</p>
                    
                    <div class="tool-section">
                        <h5>⚖️ Vekt-konvertering</h5>
                        <div class="tool-row">
                            <input type="number" id="toolGram" placeholder="1000" value="1000" oninput="convertWeightSimple()">
                            <span>g =</span>
                            <input type="number" id="toolHg" readonly>
                            <span>hg =</span>
                            <input type="number" id="toolKg" readonly>
                            <span>kg</span>
                        </div>
                    </div>
                    
                    <div class="tool-section">
                        <h5>🥛 Volum-konvertering</h5>
                        <div class="tool-row">
                            <input type="number" id="toolMl" placeholder="1000" value="1000" oninput="convertVolumeSimple()">
                            <span>ml =</span>
                            <input type="number" id="toolDl" readonly>
                            <span>dl =</span>
                            <input type="number" id="toolL" readonly>
                            <span>l</span>
                        </div>
                    </div>
                    
                    <div class="tool-section">
                        <h5>🌡️ Temperatur-konvertering</h5>
                        <div class="tool-row">
                            <input type="number" id="toolCelsius" placeholder="180" value="180" oninput="convertTempSimple()">
                            <span>°C =</span>
                            <input type="number" id="toolFahrenheit" readonly>
                            <span>°F</span>
                        </div>
                        <div class="temp-presets">
                            <button onclick="setTempSimple(150)">150°C</button>
                            <button onclick="setTempSimple(175)">175°C</button>
                            <button onclick="setTempSimple(180)">180°C</button>
                            <button onclick="setTempSimple(200)">200°C</button>
                            <button onclick="setTempSimple(220)">220°C</button>
                            <button onclick="setTempSimple(250)">250°C</button>
                        </div>
                    </div>
                    
                    <div class="quick-reference">
                        <h5>📝 Hurtigreferanse</h5>
                        <div class="ref-grid">
                            <div class="ref-item">
                                <span class="ref-icon">🥄</span>
                                <div class="ref-text">
                                    <strong>1 ss</strong>
                                    <span>= 15 ml</span>
                                </div>
                            </div>
                            <div class="ref-item">
                                <span class="ref-icon">🥄</span>
                                <div class="ref-text">
                                    <strong>1 ts</strong>
                                    <span>= 5 ml</span>
                                </div>
                            </div>
                            <div class="ref-item">
                                <span class="ref-icon">☕</span>
                                <div class="ref-text">
                                    <strong>1 kopp</strong>
                                    <span>= 2.5 dl</span>
                                </div>
                            </div>
                            <div class="ref-item">
                                <span class="ref-icon">🇺🇸</span>
                                <div class="ref-text">
                                    <strong>1 US cup</strong>
                                    <span>= 2.37 dl</span>
                                </div>
                            </div>
                            <div class="ref-item">
                                <span class="ref-icon">⚖️</span>
                                <div class="ref-text">
                                    <strong>1 oz</strong>
                                    <span>= 28.35 g</span>
                                </div>
                            </div>
                            <div class="ref-item">
                                <span class="ref-icon">⚖️</span>
                                <div class="ref-text">
                                    <strong>1 lb</strong>
                                    <span>= 453.6 g</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    showModal('📐 Mål og vekt-kalkulator', html, []);
    
    // Initialize tool values
    setTimeout(() => {
        convertWeight();
        convertVolume();
        convertTemp();
    }, 100);
}
window.openMeasurementCalculator = openMeasurementCalculator;

function switchCalcTab(tabId) {
    document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.calc-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`.calc-tab[onclick*="${tabId}"]`).classList.add('active');
    document.getElementById(tabId + 'Tab')?.classList.add('active');
}
window.switchCalcTab = switchCalcTab;

function updateCalculation() {
    // Reset all fields
    ['calcGram', 'calcDl', 'calcSs', 'calcTs', 'calcKopp', 'calcCup'].forEach(id => {
        const el = $(id);
        if (el) el.value = '';
    });
}

function getSelectedIngredient() {
    const select = $('calcIngredient');
    const ingredientName = select?.value;
    if (!ingredientName) return null;
    return measurementData.ingredients[ingredientName];
}

function calcFromGram() {
    const ing = getSelectedIngredient();
    if (!ing) return;
    const gram = parseFloat($('calcGram')?.value) || 0;
    
    $('calcDl').value = (gram / ing.grPerDl).toFixed(2);
    $('calcSs').value = (gram / ing.grPerSs).toFixed(1);
    $('calcTs').value = (gram / ing.grPerTs).toFixed(1);
    $('calcKopp').value = (gram / ing.grPerKopp).toFixed(2);
    $('calcCup').value = (gram / (ing.grPerKopp * 0.948)).toFixed(2); // US cup is ~237ml vs 250ml
}
window.calcFromGram = calcFromGram;

function calcFromDl() {
    const ing = getSelectedIngredient();
    if (!ing) return;
    const dl = parseFloat($('calcDl')?.value) || 0;
    const gram = dl * ing.grPerDl;
    
    $('calcGram').value = Math.round(gram);
    $('calcSs').value = (gram / ing.grPerSs).toFixed(1);
    $('calcTs').value = (gram / ing.grPerTs).toFixed(1);
    $('calcKopp').value = (gram / ing.grPerKopp).toFixed(2);
    $('calcCup').value = (gram / (ing.grPerKopp * 0.948)).toFixed(2);
}
window.calcFromDl = calcFromDl;

function calcFromSs() {
    const ing = getSelectedIngredient();
    if (!ing) return;
    const ss = parseFloat($('calcSs')?.value) || 0;
    const gram = ss * ing.grPerSs;
    
    $('calcGram').value = Math.round(gram);
    $('calcDl').value = (gram / ing.grPerDl).toFixed(2);
    $('calcTs').value = (gram / ing.grPerTs).toFixed(1);
    $('calcKopp').value = (gram / ing.grPerKopp).toFixed(2);
    $('calcCup').value = (gram / (ing.grPerKopp * 0.948)).toFixed(2);
}
window.calcFromSs = calcFromSs;

function calcFromTs() {
    const ing = getSelectedIngredient();
    if (!ing) return;
    const ts = parseFloat($('calcTs')?.value) || 0;
    const gram = ts * ing.grPerTs;
    
    $('calcGram').value = Math.round(gram);
    $('calcDl').value = (gram / ing.grPerDl).toFixed(2);
    $('calcSs').value = (gram / ing.grPerSs).toFixed(1);
    $('calcKopp').value = (gram / ing.grPerKopp).toFixed(2);
    $('calcCup').value = (gram / (ing.grPerKopp * 0.948)).toFixed(2);
}
window.calcFromTs = calcFromTs;

function calcFromKopp() {
    const ing = getSelectedIngredient();
    if (!ing) return;
    const kopp = parseFloat($('calcKopp')?.value) || 0;
    const gram = kopp * ing.grPerKopp;
    
    $('calcGram').value = Math.round(gram);
    $('calcDl').value = (gram / ing.grPerDl).toFixed(2);
    $('calcSs').value = (gram / ing.grPerSs).toFixed(1);
    $('calcTs').value = (gram / ing.grPerTs).toFixed(1);
    $('calcCup').value = (gram / (ing.grPerKopp * 0.948)).toFixed(2);
}
window.calcFromKopp = calcFromKopp;

function calcFromCup() {
    const ing = getSelectedIngredient();
    if (!ing) return;
    const cup = parseFloat($('calcCup')?.value) || 0;
    const gram = cup * ing.grPerKopp * 0.948;
    
    $('calcGram').value = Math.round(gram);
    $('calcDl').value = (gram / ing.grPerDl).toFixed(2);
    $('calcSs').value = (gram / ing.grPerSs).toFixed(1);
    $('calcTs').value = (gram / ing.grPerTs).toFixed(1);
    $('calcKopp').value = (gram / ing.grPerKopp).toFixed(2);
}
window.calcFromCup = calcFromCup;

function calcProduceFromGram() {
    const select = $('produceSelect');
    const produceName = select?.value;
    if (!produceName) return;
    
    const produce = measurementData.produce[produceName];
    const gram = parseFloat($('produceGram')?.value) || 0;
    
    const amount = gram / produce.avgWeight;
    $('produceAmount').textContent = amount.toFixed(1);
    $('produceUnit').textContent = produce.unit;
    
    $('produceInfo').innerHTML = `
        <p class="produce-avg">💡 Gjennomsnittlig vekt: ${produce.avgWeight}g per ${produce.unit}</p>
    `;
}
window.calcProduceFromGram = calcProduceFromGram;

function updateProduceCalc() {
    const select = $('produceSelect');
    const produceName = select?.value;
    if (!produceName) {
        $('produceInfo').innerHTML = '';
        return;
    }
    
    const produce = measurementData.produce[produceName];
    $('produceUnit').textContent = produce.unit;
    $('produceInfo').innerHTML = `
        <p class="produce-avg">💡 1 ${produce.unit} ${produceName} veier ca. ${produce.avgWeight}g</p>
    `;
    
    calcProduceFromGram();
}
window.updateProduceCalc = updateProduceCalc;

function convertWeightSimple() {
    const gram = parseFloat($('toolGram')?.value) || 0;
    $('toolHg').value = (gram / 100).toFixed(1);
    $('toolKg').value = (gram / 1000).toFixed(3);
}
window.convertWeightSimple = convertWeightSimple;

function convertVolumeSimple() {
    const ml = parseFloat($('toolMl')?.value) || 0;
    $('toolDl').value = (ml / 100).toFixed(1);
    $('toolL').value = (ml / 1000).toFixed(3);
}
window.convertVolumeSimple = convertVolumeSimple;

function convertTempSimple() {
    const celsius = parseFloat($('toolCelsius')?.value) || 0;
    $('toolFahrenheit').value = Math.round(celsius * 9/5 + 32);
}
window.convertTempSimple = convertTempSimple;

function setTempSimple(temp) {
    $('toolCelsius').value = temp;
    convertTempSimple();
}
window.setTempSimple = setTempSimple;

// ===== AI MEAL PLANNER =====
const aiMealPreferences = {
    dietary: ['vanlig', 'vegetar', 'vegan', 'pescetarianer', 'lavkarbo', 'keto', 'glutenfri', 'laktosefri'],
    goals: ['balansert', 'høy-protein', 'lav-karbo', 'lav-fett', 'høy-fiber', 'lite-ultraprosessert'],
    budgets: ['budsjett', 'moderat', 'premium'],
    cooking: ['rask (<30 min)', 'middels (30-60 min)', 'tidkrevende (60+ min)', 'miks']
};

function openAiMealPlanner() {
    const dietaryOptions = aiMealPreferences.dietary.map(d => 
        `<option value="${d}">${d.charAt(0).toUpperCase() + d.slice(1)}</option>`
    ).join('');
    
    const goalsOptions = aiMealPreferences.goals.map(g => 
        `<option value="${g}">${g.charAt(0).toUpperCase() + g.slice(1).replace('-', ' ')}</option>`
    ).join('');
    
    const budgetOptions = aiMealPreferences.budgets.map(b => 
        `<option value="${b}">${b.charAt(0).toUpperCase() + b.slice(1)}</option>`
    ).join('');
    
    const cookingOptions = aiMealPreferences.cooking.map(c => 
        `<option value="${c}">${c}</option>`
    ).join('');
    
    const html = `
        <div class="ai-meal-planner">
            <div class="ai-header">
                <span class="ai-icon">🤖✨</span>
                <h3>AI Ukemenyplanlegger</h3>
                <p>La AI'en lage den perfekte ukemenyen for deg!</p>
            </div>
            
            <div class="ai-options">
                <div class="option-section">
                    <label>🥗 Kosthold</label>
                    <select id="aiDietary">
                        ${dietaryOptions}
                    </select>
                </div>
                
                <div class="option-section">
                    <label>🎯 Mål</label>
                    <select id="aiGoal">
                        ${goalsOptions}
                    </select>
                </div>
                
                <div class="option-section">
                    <label>💰 Budsjett</label>
                    <select id="aiBudget">
                        ${budgetOptions}
                    </select>
                </div>
                
                <div class="option-section">
                    <label>⏱️ Koketid</label>
                    <select id="aiCookTime">
                        ${cookingOptions}
                    </select>
                </div>
                
                <div class="option-section">
                    <label>👥 Antall personer</label>
                    <input type="number" id="aiPersons" min="1" max="12" value="${state.settings?.householdSize || 2}">
                </div>
                
                <div class="option-section">
                    <label>📅 Antall dager</label>
                    <select id="aiDays">
                        <option value="5">5 dager (arbeidsuke)</option>
                        <option value="7" selected>7 dager (hel uke)</option>
                        <option value="14">14 dager (to uker)</option>
                    </select>
                </div>
                
                <div class="option-section full-width">
                    <label>✨ Ekstra ønsker (valgfritt)</label>
                    <textarea id="aiCustom" placeholder="F.eks: 'Inkluder taco på fredag', 'Unngå svinekjøtt', 'Mer asiatisk mat'..."></textarea>
                </div>
                
                <div class="ai-checkboxes">
                    <label class="ai-checkbox">
                        <input type="checkbox" id="aiUseFavorites" checked>
                        <span>Bruk mine favoritter</span>
                    </label>
                    <label class="ai-checkbox">
                        <input type="checkbox" id="aiUseHistory" checked>
                        <span>Lær av kokehistorikk</span>
                    </label>
                    <label class="ai-checkbox">
                        <input type="checkbox" id="aiAvoidRepeat" checked>
                        <span>Unngå gjentakelse</span>
                    </label>
                    <label class="ai-checkbox">
                        <input type="checkbox" id="aiSeasonal">
                        <span>Sesongbaserte råvarer</span>
                    </label>
                </div>
            </div>
            
            <div class="ai-actions">
                <button class="btn btn-primary btn-large" onclick="generateAiMealPlan()">
                    <span class="btn-icon">🤖</span>
                    Generer ukesmeny
                </button>
                <button class="btn btn-secondary" onclick="generateAiMealPlan(true)">
                    <span class="btn-icon">🎲</span>
                    Overrask meg!
                </button>
            </div>
            
            <div id="aiMealPlanResult"></div>
        </div>
    `;
    
    showModal('🤖 AI Ukemenyplanlegger', html, []);
}
window.openAiMealPlanner = openAiMealPlanner;

function generateAiMealPlan(surprise = false) {
    const dietary = $('aiDietary')?.value || 'vanlig';
    const goal = $('aiGoal')?.value || 'balansert';
    const budget = $('aiBudget')?.value || 'moderat';
    const cookTime = $('aiCookTime')?.value || 'miks';
    const persons = parseInt($('aiPersons')?.value) || 2;
    const days = parseInt($('aiDays')?.value) || 7;
    const customWishes = $('aiCustom')?.value || '';
    const useFavorites = $('aiUseFavorites')?.checked;
    const useHistory = $('aiUseHistory')?.checked;
    const avoidRepeat = $('aiAvoidRepeat')?.checked;
    const seasonal = $('aiSeasonal')?.checked;
    
    // Show loading
    $('aiMealPlanResult').innerHTML = `
        <div class="ai-loading">
            <div class="ai-thinking">
                <span class="thinking-dot"></span>
                <span class="thinking-dot"></span>
                <span class="thinking-dot"></span>
            </div>
            <p>AI tenker på den perfekte ukemenyen for deg...</p>
        </div>
    `;
    
    // Simulate AI processing
    setTimeout(() => {
        const plan = createSmartMealPlan({
            dietary, goal, budget, cookTime, persons, days,
            customWishes, useFavorites, useHistory, avoidRepeat, seasonal, surprise
        });
        
        displayAiMealPlan(plan, days, persons);
    }, 1500);
}
window.generateAiMealPlan = generateAiMealPlan;

function createSmartMealPlan(options) {
    const dayNames = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
    const plan = [];
    
    // Get available recipes
    let availableRecipes = [...state.recipes];
    
    // Add external/saved recipes if any
    if (state.savedExternalRecipes) {
        availableRecipes = [...availableRecipes, ...state.savedExternalRecipes];
    }
    
    // If surprise mode, shuffle heavily
    if (options.surprise) {
        availableRecipes = shuffleArray(availableRecipes);
    }
    
    // Prioritize favorites if enabled
    if (options.useFavorites && state.favorites?.length > 0) {
        availableRecipes.sort((a, b) => {
            const aFav = state.favorites.includes(a.id) ? 1 : 0;
            const bFav = state.favorites.includes(b.id) ? 1 : 0;
            return bFav - aFav;
        });
    }
    
    // Filter by dietary
    if (options.dietary !== 'vanlig') {
        availableRecipes = availableRecipes.filter(r => {
            const name = (r.name + ' ' + (r.category || '')).toLowerCase();
            switch (options.dietary) {
                case 'vegetar': return name.includes('vegetar') || !containsMeat(r);
                case 'vegan': return name.includes('vegan') || (!containsMeat(r) && !containsDairy(r));
                case 'pescetarianer': return name.includes('fisk') || name.includes('sjømat') || !containsMeat(r);
                case 'lavkarbo': case 'keto': return !name.includes('pasta') && !name.includes('ris') && !name.includes('brød');
                default: return true;
            }
        });
    }
    
    // Get cooking history to avoid recent meals
    const history = JSON.parse(localStorage.getItem('kokebok_cooking_history') || '[]');
    const recentRecipes = history.slice(0, 14).map(h => h.recipeId);
    
    // Create day plan
    const usedRecipes = new Set();
    
    for (let i = 0; i < options.days; i++) {
        const dayName = dayNames[i % 7];
        let selectedRecipe = null;
        
        // Special day logic
        const isWeekend = dayName === 'Lørdag' || dayName === 'Søndag';
        const isFriday = dayName === 'Fredag';
        
        // Filter candidates
        let candidates = availableRecipes.filter(r => {
            if (options.avoidRepeat && usedRecipes.has(r.id)) return false;
            if (options.avoidRepeat && recentRecipes.includes(r.id)) return false;
            return true;
        });
        
        // Custom wishes parsing
        if (options.customWishes) {
            const wishes = options.customWishes.toLowerCase();
            if (isFriday && wishes.includes('taco')) {
                const tacoRecipe = candidates.find(r => r.name.toLowerCase().includes('taco'));
                if (tacoRecipe) selectedRecipe = tacoRecipe;
            }
        }
        
        // Weekend: suggest more elaborate meals
        if (!selectedRecipe && isWeekend && options.cookTime === 'miks') {
            candidates = candidates.filter(r => 
                (r.prepTime && parseInt(r.prepTime) > 30) || 
                (r.cookTime && parseInt(r.cookTime) > 30) ||
                r.name.toLowerCase().includes('gryterett') ||
                r.name.toLowerCase().includes('stek')
            );
        }
        
        // Budget filtering
        if (options.budget === 'budsjett') {
            candidates = candidates.filter(r => {
                const cost = estimateRecipeCost(r);
                return cost < 100;
            });
        }
        
        // Protein goal - prioritize meat/fish
        if (options.goal === 'høy-protein') {
            candidates.sort((a, b) => {
                const aProtein = containsMeat(a) || (a.name + '').toLowerCase().includes('fisk') ? 1 : 0;
                const bProtein = containsMeat(b) || (b.name + '').toLowerCase().includes('fisk') ? 1 : 0;
                return bProtein - aProtein;
            });
        }
        
        // Select recipe
        if (!selectedRecipe && candidates.length > 0) {
            // Add some randomness
            const topCandidates = candidates.slice(0, Math.min(5, candidates.length));
            selectedRecipe = topCandidates[Math.floor(Math.random() * topCandidates.length)];
        }
        
        // Fallback
        if (!selectedRecipe && availableRecipes.length > 0) {
            selectedRecipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
        }
        
        if (selectedRecipe) {
            usedRecipes.add(selectedRecipe.id);
            plan.push({
                day: dayName,
                recipe: selectedRecipe,
                isWeekend,
                estimatedCost: estimateRecipeCost(selectedRecipe),
                prepTime: selectedRecipe.prepTime || '30 min'
            });
        } else {
            plan.push({
                day: dayName,
                recipe: { name: 'Legg til oppskrift', id: null },
                isWeekend,
                estimatedCost: 0,
                prepTime: '-'
            });
        }
    }
    
    return plan;
}

function containsMeat(recipe) {
    const meatWords = ['kjøtt', 'kylling', 'svin', 'beef', 'biff', 'lam', 'bacon', 'pølse', 'deig', 'ribbe'];
    const text = (recipe.name + ' ' + JSON.stringify(recipe.ingredients || [])).toLowerCase();
    return meatWords.some(w => text.includes(w));
}

function containsDairy(recipe) {
    const dairyWords = ['melk', 'ost', 'fløte', 'smør', 'rømme', 'yoghurt'];
    const text = (recipe.name + ' ' + JSON.stringify(recipe.ingredients || [])).toLowerCase();
    return dairyWords.some(w => text.includes(w));
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function displayAiMealPlan(plan, days, persons) {
    const totalCost = plan.reduce((sum, day) => sum + day.estimatedCost, 0) * (persons / 4);
    
    const planCards = plan.map((day, i) => {
        const isWeekend = day.isWeekend;
        const weekendClass = isWeekend ? 'weekend' : '';
        const weekendBadge = isWeekend ? '<span class="weekend-badge">🌟</span>' : '';
        
        let contentHtml = '';
        let viewBtnHtml = '';
        
        if (day.recipe.id) {
            contentHtml = `
                <span class="ai-recipe-name">${escapeHtml(day.recipe.name)}</span>
                <div class="ai-recipe-meta">
                    <span>⏱️ ${day.prepTime}</span>
                    <span>💰 ~${day.estimatedCost} kr</span>
                </div>
            `;
            viewBtnHtml = `
                <button class="ai-view-btn" onclick="viewRecipe('${day.recipe.id}'); closeGenericModal();">
                    Se oppskrift →
                </button>
            `;
        } else {
            contentHtml = `<span class="ai-no-recipe">Ingen oppskrift</span>`;
        }
        
        return `
            <div class="ai-day-card ${weekendClass}">
                <div class="ai-day-header">
                    <span class="day-name">${day.day}</span>
                    ${weekendBadge}
                </div>
                <div class="ai-day-content">
                    ${contentHtml}
                </div>
                ${viewBtnHtml}
            </div>
        `;
    }).join('');
    
    const resultHtml = `
        <div class="ai-result">
            <div class="ai-result-header">
                <h4>✨ Din personlige ukesmeny</h4>
                <div class="ai-stats">
                    <span class="ai-stat">📅 ${days} dager</span>
                    <span class="ai-stat">👥 ${persons} personer</span>
                    <span class="ai-stat">💰 ca. ${Math.round(totalCost)} kr</span>
                </div>
            </div>
            
            <div class="ai-plan-grid">
                ${planCards}
            </div>
            
            <div class="ai-actions-bottom">
                <button class="btn btn-success" onclick="applyAiPlanToCalendar()">
                    ✅ Legg til i ukesplanen
                </button>
                <button class="btn btn-secondary" onclick="generateAiMealPlan()">
                    🔄 Generer ny
                </button>
                <button class="btn btn-secondary" onclick="copyWeekPlan()">
                    📋 Kopier uke
                </button>
            </div>
        </div>
    `;
    
    $('aiMealPlanResult').innerHTML = resultHtml;
    
    // Store plan for applying later
    window.currentAiPlan = plan;
}

function applyAiPlanToCalendar() {
    if (!window.currentAiPlan) return;
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    
    window.currentAiPlan.forEach((day, i) => {
        if (day.recipe.id) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];
            
            state.mealPlan[dateKey] = {
                name: day.recipe.name,
                recipeId: day.recipe.id,
                ingredients: day.recipe.ingredients || []
            };
        }
    });
    
    saveMealPlan();
    showToast('Ukesmeny lagt til!', 'success');
    closeGenericModal();
}
window.applyAiPlanToCalendar = applyAiPlanToCalendar;

function copyWeekPlan() {
    if (!window.currentAiPlan) return;
    
    // Store as template
    localStorage.setItem('kokebok_week_template', JSON.stringify(window.currentAiPlan));
    showToast('Ukesmeny lagret som mal!', 'success');
}
window.copyWeekPlan = copyWeekPlan;

function pasteWeekPlan() {
    const template = localStorage.getItem('kokebok_week_template');
    if (!template) {
        showToast('Ingen ukesmeny lagret', 'warning');
        return;
    }
    
    window.currentAiPlan = JSON.parse(template);
    applyAiPlanToCalendar();
}
window.pasteWeekPlan = pasteWeekPlan;

// ===== MATKALENDER / COOKING DIARY =====
function openCookingDiary() {
    // Get all cooking history
    const history = JSON.parse(localStorage.getItem('kokebok_cooking_history') || '[]');
    
    // Group by month
    const byMonth = {};
    history.forEach(entry => {
        const date = new Date(entry.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonth[monthKey]) byMonth[monthKey] = [];
        byMonth[monthKey].push(entry);
    });
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const recentMealsHtml = history.slice(0, 10).map(entry => {
        const recipe = state.recipes.find(r => r.id === entry.recipeId);
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' });
        const recipeName = recipe ? escapeHtml(recipe.name) : 'Ukjent oppskrift';
        const viewBtn = recipe ? `<button class="btn-sm" onclick="viewRecipe('${recipe.id}'); closeGenericModal();">Se</button>` : '';
        
        return `
            <div class="recent-meal-item">
                <span class="meal-date">${dateStr}</span>
                <span class="meal-name">${recipeName}</span>
                ${viewBtn}
            </div>
        `;
    }).join('');
    
    const html = `
        <div class="cooking-diary">
            <div class="diary-header">
                <button class="btn-icon" onclick="changeCalendarMonth(-1)">◀</button>
                <h3 id="diaryMonthTitle">${formatMonthYear(currentMonth)}</h3>
                <button class="btn-icon" onclick="changeCalendarMonth(1)">▶</button>
            </div>
            
            <div id="diaryCalendar" class="diary-calendar">
                ${renderDiaryCalendar(currentMonth, history)}
            </div>
            
            <div class="diary-stats">
                <h4>📊 Statistikk</h4>
                <div class="diary-stat-grid">
                    <div class="diary-stat">
                        <span class="stat-value">${history.length}</span>
                        <span class="stat-label">Måltider laget</span>
                    </div>
                    <div class="diary-stat">
                        <span class="stat-value">${new Set(history.map(h => h.recipeId)).size}</span>
                        <span class="stat-label">Unike oppskrifter</span>
                    </div>
                    <div class="diary-stat">
                        <span class="stat-value">${Object.keys(byMonth).length}</span>
                        <span class="stat-label">Måneder med data</span>
                    </div>
                </div>
            </div>
            
            <div class="diary-recent">
                <h4>🕐 Siste måltider</h4>
                <div class="recent-meals-list">
                    ${recentMealsHtml}
                </div>
            </div>
        </div>
    `;
    
    showModal('📅 Matkalender', html, []);
    
    window.currentDiaryMonth = currentMonth;
}
window.openCookingDiary = openCookingDiary;

function renderDiaryCalendar(monthKey, history) {
    const [year, month] = monthKey.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDay = (firstDay.getDay() + 6) % 7; // Monday = 0
    
    const daysInMonth = lastDay.getDate();
    const today = new Date();
    
    // Get meals for this month
    const monthMeals = {};
    history.forEach(entry => {
        const date = new Date(entry.date);
        if (date.getFullYear() === year && date.getMonth() === month - 1) {
            const dayKey = date.getDate();
            if (!monthMeals[dayKey]) monthMeals[dayKey] = [];
            monthMeals[dayKey].push(entry);
        }
    });
    
    let html = '<div class="calendar-header">';
    ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'].forEach(day => {
        html += `<span class="cal-day-name">${day}</span>`;
    });
    html += '</div><div class="calendar-grid">';
    
    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
        html += '<div class="cal-day empty"></div>';
    }
    
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = today.getFullYear() === year && today.getMonth() === month - 1 && today.getDate() === day;
        const meals = monthMeals[day] || [];
        const hasMeals = meals.length > 0;
        
        html += `
            <div class="cal-day ${isToday ? 'today' : ''} ${hasMeals ? 'has-meals' : ''}" 
                 onclick="showDayMeals(${year}, ${month}, ${day})"
                 title="${hasMeals ? meals.length + ' måltid(er)' : 'Ingen måltider'}">
                <span class="day-number">${day}</span>
                ${hasMeals ? `<span class="meal-dot">${meals.length}</span>` : ''}
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

function formatMonthYear(monthKey) {
    const [year, month] = monthKey.split('-');
    const months = ['Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni', 
                    'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'];
    return `${months[parseInt(month) - 1]} ${year}`;
}

function changeCalendarMonth(delta) {
    const [year, month] = window.currentDiaryMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1 + delta, 1);
    window.currentDiaryMonth = newDate.toISOString().slice(0, 7);
    
    const history = JSON.parse(localStorage.getItem('kokebok_cooking_history') || '[]');
    $('diaryMonthTitle').textContent = formatMonthYear(window.currentDiaryMonth);
    $('diaryCalendar').innerHTML = renderDiaryCalendar(window.currentDiaryMonth, history);
}
window.changeCalendarMonth = changeCalendarMonth;

function showDayMeals(year, month, day) {
    const history = JSON.parse(localStorage.getItem('kokebok_cooking_history') || '[]');
    const dayMeals = history.filter(entry => {
        const date = new Date(entry.date);
        return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    });
    
    if (dayMeals.length === 0) {
        showToast('Ingen måltider registrert denne dagen', 'info');
        return;
    }
    
    const dateStr = new Date(year, month - 1, day).toLocaleDateString('no-NO', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    
    const mealsHtml = dayMeals.map(entry => {
        const recipe = state.recipes.find(r => r.id === entry.recipeId);
        const recipeName = recipe ? escapeHtml(recipe.name) : 'Ukjent oppskrift';
        const viewBtn = recipe ? `<button class="btn btn-sm" onclick="viewRecipe('${recipe.id}'); closeGenericModal();">Se oppskrift</button>` : '';
        return `
            <div class="day-meal-card">
                <span class="meal-icon">🍽️</span>
                <span class="meal-name">${recipeName}</span>
                ${viewBtn}
            </div>
        `;
    }).join('');
    
    // Show in a sub-modal or toast
    showModal(`📅 ${dateStr}`, `<div class="day-meals-detail">${mealsHtml}</div>`, []);
}
window.showDayMeals = showDayMeals;

// ===== MARK RECIPE AS COOKED =====
function markAsCooked(recipeId) {
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    // Log to cooking history
    logCookingSession(recipeId);
    
    // Update last cooked date
    recipe.lastCooked = new Date().toISOString();
    recipe.cookCount = (recipe.cookCount || 0) + 1;
    saveToFirestore('recipes', recipeId, recipe);
    
    showToast(`✅ "${recipe.name}" registrert som laget!`, 'success');
    checkAchievements();
}
window.markAsCooked = markAsCooked;

// ===== LEGG TIL EKSISTERENDE OPPSKRIFTER I KOKEBOK =====
function openAddRecipesToBook(bookId = null) {
    const targetBookId = bookId || state.currentBook?.id;
    if (!targetBookId) {
        showToast('Velg en kokebok først', 'warning');
        return;
    }
    
    const book = state.books.find(b => b.id === targetBookId);
    if (!book) return;
    
    const recipesNotInBook = state.recipes.filter(r => r.bookId !== targetBookId);
    
    if (recipesNotInBook.length === 0) {
        showToast('Alle oppskrifter er allerede i denne kokeboken', 'info');
        return;
    }
    
    const recipesHtml = recipesNotInBook.map(r => `
        <div class="add-recipe-item" data-id="${r.id}">
            <div class="recipe-item-thumb">
                ${r.images?.[0] ? `<img src="${r.images[0]}" alt="">` : '<span>🍽️</span>'}
            </div>
            <div class="recipe-item-info">
                <strong>${escapeHtml(r.name)}</strong>
                <span>${getCategoryName(r.category)}</span>
            </div>
            <button class="btn btn-sm btn-success add-to-book-btn">➕ Legg til</button>
        </div>
    `).join('');
    
    const html = `
        <div class="add-recipes-to-book">
            <p>Velg oppskrifter å legge til i <strong>${escapeHtml(book.name)}</strong>:</p>
            
            <div class="search-container">
                <input type="text" id="addRecipeSearch" placeholder="🔍 Søk i oppskrifter..." class="search-input">
            </div>
            
            <div class="add-recipes-list" id="addRecipesList">
                ${recipesHtml}
            </div>
        </div>
    `;
    
    showModal(`📚 Legg til i ${escapeHtml(book.name)}`, html, []);
    
    // Setup handlers
    setTimeout(() => {
        // Search
        const searchInput = $('addRecipeSearch');
        if (searchInput) {
            searchInput.oninput = () => {
                const query = searchInput.value.toLowerCase();
                document.querySelectorAll('.add-recipe-item').forEach(item => {
                    const name = item.querySelector('strong')?.textContent.toLowerCase() || '';
                    item.style.display = name.includes(query) ? '' : 'none';
                });
            };
        }
        
        // Add buttons
        document.querySelectorAll('.add-to-book-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const item = btn.closest('.add-recipe-item');
                const recipeId = item.dataset.id;
                addRecipeToBook(recipeId, targetBookId);
                item.remove();
            };
        });
    }, 100);
}
window.openAddRecipesToBook = openAddRecipesToBook;

function addRecipeToBook(recipeId, bookId) {
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    recipe.bookId = bookId;
    saveToFirestore('recipes', recipeId, recipe);
    
    showToast(`"${recipe.name}" lagt til i kokeboken!`, 'success');
}
window.addRecipeToBook = addRecipeToBook;

// ===== HANDLEMODUS - ENKEL BUTIKKMODUS =====
function openShoppingMode() {
    const shoppingList = state.shoppingList || [];
    
    if (shoppingList.length === 0) {
        showToast('Handlelisten er tom! Legg til varer først.', 'warning');
        return;
    }
    
    // Group by category/department
    const departments = {
        'frukt_gront': { name: '🥬 Frukt & Grønt', items: [] },
        'meieri': { name: '🥛 Meieri', items: [] },
        'kjott': { name: '🥩 Kjøtt & Fisk', items: [] },
        'bakeri': { name: '🍞 Bakeri', items: [] },
        'fryser': { name: '❄️ Frysevarer', items: [] },
        'torvarer': { name: '🏪 Tørrvarer', items: [] },
        'hermetikk': { name: '🥫 Hermetikk', items: [] },
        'drikke': { name: '🥤 Drikke', items: [] },
        'annet': { name: '📦 Annet', items: [] }
    };
    
    // Categorize items (varer lagres som { text, checked } – bruk getItemName)
    shoppingList.forEach(item => {
        const dept = categorizeShoppingItem(getItemName(item));
        if (departments[dept]) {
            departments[dept].items.push(item);
        } else {
            departments.annet.items.push(item);
        }
    });

    const deptHtml = Object.entries(departments)
        .filter(([_, dept]) => dept.items.length > 0)
        .map(([key, dept]) => {
            const itemsHtml = dept.items.map((item, idx) => {
                const itemName = getItemName(item);
                const itemAmount = item.amount || '';
                return `
                    <div class="shopping-item" data-item="${escapeHtml(itemName)}">
                        <button class="check-btn" onclick="toggleShoppingItem(this)">
                            <span class="check-icon">○</span>
                        </button>
                        <span class="item-name">${escapeHtml(itemName)}</span>
                        ${itemAmount ? `<span class="item-amount">${escapeHtml(itemAmount)}</span>` : ''}
                    </div>
                `;
            }).join('');
            
            return `
                <div class="shopping-dept">
                    <div class="dept-header">${dept.name}</div>
                    <div class="dept-items">${itemsHtml}</div>
                </div>
            `;
        }).join('');
    
    const html = `
        <div class="shopping-mode">
            <div class="shopping-mode-header">
                <span class="shopping-icon">🛒</span>
                <h3>Handlemodus</h3>
                <p>Trykk på varer for å krysse av!</p>
            </div>
            
            <div class="shopping-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="shoppingProgress" style="width: 0%"></div>
                </div>
                <span id="shoppingCount">0 / ${shoppingList.length} varer</span>
            </div>
            
            <div class="shopping-departments">
                ${deptHtml}
            </div>
            
            <div class="shopping-mode-actions">
                <button class="btn btn-secondary" onclick="uncheckAllItems()">
                    🔄 Nullstill
                </button>
                <button class="btn btn-success" onclick="finishShopping()">
                    ✅ Ferdig!
                </button>
            </div>
        </div>
    `;
    
    showModal('🛒 Handlemodus', html, []);
}
window.openShoppingMode = openShoppingMode;

function categorizeShoppingItem(itemName) {
    // Ensure itemName is a string
    if (!itemName || typeof itemName !== 'string') {
        return 'annet';
    }
    const name = itemName.toLowerCase();
    
    // Frukt & Grønt
    if (/eple|banan|appelsin|sitron|tomat|agurk|paprika|løk|gulrot|brokkoli|salat|potet|avokado|mango|frukt|grønn/i.test(name)) {
        return 'frukt_gront';
    }
    // Meieri
    if (/melk|ost|fløte|smør|yoghurt|rømme|egg|kesam|skyr/i.test(name)) {
        return 'meieri';
    }
    // Kjøtt & Fisk
    if (/kjøtt|kylling|svin|biff|laks|fisk|torsk|bacon|pølse|kjøttdeig|ribbe|skinke/i.test(name)) {
        return 'kjott';
    }
    // Bakeri
    if (/brød|rundstykke|bolle|croissant|kake|baguette|lompe|lefse/i.test(name)) {
        return 'bakeri';
    }
    // Fryser
    if (/fross|frys|is |iskrem|pizza|ferdig|pommes/i.test(name)) {
        return 'fryser';
    }
    // Tørrvarer
    if (/mel|sukker|ris|pasta|havre|müsli|kaffe|te|kakao|krydder|salt|pepper/i.test(name)) {
        return 'torvarer';
    }
    // Hermetikk
    if (/boks|hermetisk|tomat.*boks|bønner|mais|tun/i.test(name)) {
        return 'hermetikk';
    }
    // Drikke
    if (/juice|brus|vann|øl|vin|drikke|cola|fanta|sprite/i.test(name)) {
        return 'drikke';
    }
    
    return 'annet';
}

function toggleShoppingItem(btn) {
    const item = btn.closest('.shopping-item');
    item.classList.toggle('checked');
    btn.querySelector('.check-icon').textContent = item.classList.contains('checked') ? '✓' : '○';
    
    updateShoppingProgress();
}
window.toggleShoppingItem = toggleShoppingItem;

function updateShoppingProgress() {
    const total = document.querySelectorAll('.shopping-item').length;
    const checked = document.querySelectorAll('.shopping-item.checked').length;
    const percent = Math.round((checked / total) * 100);
    
    const progressBar = $('shoppingProgress');
    const countEl = $('shoppingCount');
    
    if (progressBar) progressBar.style.width = percent + '%';
    if (countEl) countEl.textContent = `${checked} / ${total} varer`;
    
    // Celebration when done
    if (checked === total && total > 0) {
        showToast('🎉 Alle varer krysset av! Bra jobba!', 'success');
    }
}

function uncheckAllItems() {
    document.querySelectorAll('.shopping-item').forEach(item => {
        item.classList.remove('checked');
        item.querySelector('.check-icon').textContent = '○';
    });
    updateShoppingProgress();
}
window.uncheckAllItems = uncheckAllItems;

function finishShopping() {
    const checked = document.querySelectorAll('.shopping-item.checked').length;
    const total = document.querySelectorAll('.shopping-item').length;
    
    if (checked < total) {
        if (!confirm(`Du har ${total - checked} varer igjen. Vil du avslutte likevel?`)) {
            return;
        }
    }
    
    // Remove checked items from shopping list
    const checkedItems = Array.from(document.querySelectorAll('.shopping-item.checked'))
        .map(el => el.dataset.item);
    
    state.shoppingList = state.shoppingList.filter(item =>
        !checkedItems.includes(getItemName(item))
    );
    
    saveShoppingList();
    closeGenericModal();
    showToast('🛒 Handletur fullført! Resterende varer er lagret.', 'success');
}
window.finishShopping = finishShopping;

// ===== OPPSKRIFT TIL NÆRBUTIKK - FINN NÆRMESTE BUTIKK =====
function findNearestStores() {
    if (!navigator.geolocation) {
        showToast('Geolokasjon støttes ikke i denne nettleseren', 'error');
        return;
    }
    
    showToast('📍 Finner din posisjon...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const mapsUrl = `https://www.google.com/maps/search/dagligvare+matbutikk/@${latitude},${longitude},15z`;
            window.open(mapsUrl, '_blank');
        },
        error => {
            showToast('Kunne ikke finne posisjonen din', 'error');
        }
    );
}
window.findNearestStores = findNearestStores;

// ===== VOICE SHOPPING - LES HANDLELISTE HØYT =====
function readShoppingListAloud() {
    if (!('speechSynthesis' in window)) {
        showToast('Talesyntese støttes ikke i denne nettleseren', 'error');
        return;
    }
    
    const list = state.shoppingList || [];
    if (list.length === 0) {
        showToast('Handlelisten er tom', 'warning');
        return;
    }
    
    const itemNames = list.map(item => getItemName(item)).filter(Boolean).join(', ');
    const text = `Du trenger: ${itemNames}`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'nb-NO';
    utterance.rate = 0.9;
    
    speechSynthesis.speak(utterance);
    showToast('🔊 Leser handleliste...', 'info');
}
window.readShoppingListAloud = readShoppingListAloud;

// ===== SMART LEFTOVER SUGGESTER =====
function openLeftoverSuggester() {
    const html = `
        <div class="leftover-suggester">
            <div class="suggester-header">
                <span class="suggester-icon">🥡</span>
                <h3>Rester-hjelper</h3>
                <p>Skriv inn hva du har igjen i kjøleskapet!</p>
            </div>
            
            <textarea id="leftoverInput" class="leftover-input" placeholder="F.eks:
- Litt kokt pasta
- Halv pakke bacon
- 2 egg
- Litt fløte
- Parmesan"></textarea>
            
            <button class="btn btn-primary btn-large" onclick="suggestLeftoverRecipes()">
                ✨ Finn oppskrifter
            </button>
            
            <div id="leftoverResults"></div>
        </div>
    `;
    
    showModal('🥡 Hva kan du lage av restene?', html, []);
}
window.openLeftoverSuggester = openLeftoverSuggester;

function suggestLeftoverRecipes() {
    const input = $('leftoverInput')?.value || '';
    const leftovers = input.split('\n')
        .map(l => l.replace(/^[\-\*\•]\s*/, '').trim().toLowerCase())
        .filter(l => l.length > 2);
    
    if (leftovers.length === 0) {
        showToast('Skriv inn noen rester først', 'warning');
        return;
    }
    
    // Search in recipes
    const matches = state.recipes.filter(recipe => {
        const recipeText = (recipe.name + ' ' + JSON.stringify(recipe.ingredients || [])).toLowerCase();
        return leftovers.some(leftover => recipeText.includes(leftover));
    });
    
    // Also suggest classic leftover recipes
    const suggestions = [
        { name: 'Pasta Carbonara', leftovers: ['pasta', 'bacon', 'egg', 'fløte', 'parmesan'] },
        { name: 'Omelett', leftovers: ['egg', 'ost', 'skinke', 'grønnsaker'] },
        { name: 'Stekt ris', leftovers: ['ris', 'grønnsaker', 'egg', 'soyasaus'] },
        { name: 'Suppe', leftovers: ['grønnsaker', 'kjøtt', 'buljong', 'pasta'] },
        { name: 'Grateng', leftovers: ['pasta', 'ost', 'fløte', 'kjøtt'] },
        { name: 'Wrap/Burrito', leftovers: ['kjøtt', 'grønnsaker', 'ris', 'bønner', 'ost'] },
        { name: 'Salat', leftovers: ['grønnsaker', 'kylling', 'ost', 'pasta'] },
        { name: 'Sandwich', leftovers: ['brød', 'skinke', 'ost', 'grønnsaker'] }
    ];
    
    const relevantSuggestions = suggestions.filter(s => 
        s.leftovers.some(l => leftovers.some(lo => lo.includes(l) || l.includes(lo)))
    );
    
    let resultsHtml = '';
    
    if (matches.length > 0) {
        resultsHtml += `
            <div class="leftover-section">
                <h4>📖 Fra dine oppskrifter:</h4>
                ${matches.slice(0, 5).map(r => `
                    <div class="leftover-match" onclick="viewRecipe('${r.id}'); closeGenericModal();">
                        <span class="match-icon">🍽️</span>
                        <span class="match-name">${escapeHtml(r.name)}</span>
                        <span class="match-arrow">→</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    if (relevantSuggestions.length > 0) {
        resultsHtml += `
            <div class="leftover-section">
                <h4>💡 Klassiske retter:</h4>
                ${relevantSuggestions.map(s => `
                    <div class="leftover-suggestion">
                        <span class="suggestion-name">${s.name}</span>
                        <span class="suggestion-hint">Passer med: ${s.leftovers.join(', ')}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    if (!resultsHtml) {
        resultsHtml = `
            <div class="no-matches">
                <p>🤔 Fant ingen direkte treff, men prøv å søke etter oppskrifter eller se om AI-planleggeren har forslag!</p>
            </div>
        `;
    }
    
    $('leftoverResults').innerHTML = resultsHtml;
}
window.suggestLeftoverRecipes = suggestLeftoverRecipes;

// ===== RECIPE SCALING CALCULATOR =====
function openRecipeScaler(recipeId) {
    const recipe = state.recipes.find(r => r.id === recipeId) || state.currentRecipe;
    if (!recipe) {
        showToast('Velg en oppskrift først', 'warning');
        return;
    }
    
    const originalServings = recipe.servings || 4;
    
    let ingredientsArray = recipe.ingredients || [];
    if (typeof ingredientsArray === 'string') {
        ingredientsArray = ingredientsArray.split('\n').filter(i => i.trim());
    }
    
    const html = `
        <div class="recipe-scaler">
            <h3>📊 Skalér "${escapeHtml(recipe.name)}"</h3>
            
            <div class="scaler-controls">
                <div class="scaler-original">
                    <label>Original:</label>
                    <span>${originalServings} porsjoner</span>
                </div>
                <div class="scaler-new">
                    <label>Ny mengde:</label>
                    <input type="number" id="scalerServings" value="${originalServings}" min="1" max="100" onchange="updateScaledIngredients()">
                    <span>porsjoner</span>
                </div>
            </div>
            
            <div class="quick-scale-btns">
                <button onclick="setScale(0.5)">½×</button>
                <button onclick="setScale(1)">1×</button>
                <button onclick="setScale(2)">2×</button>
                <button onclick="setScale(3)">3×</button>
                <button onclick="setScale(4)">4×</button>
            </div>
            
            <div id="scaledIngredients" class="scaled-ingredients">
                ${ingredientsArray.map(ing => {
                    const text = typeof ing === 'object' ? `${ing.amount || ''} ${ing.name || ''}` : ing;
                    return `<div class="scaled-item">${escapeHtml(text.trim())}</div>`;
                }).join('')}
            </div>
            
            <button class="btn btn-primary" onclick="copyScaledIngredients()">
                📋 Kopier til utklippstavle
            </button>
        </div>
    `;
    
    showModal('📊 Skalér oppskrift', html, []);
    
    window.currentScaleRecipe = recipe;
    window.originalServings = originalServings;
}
window.openRecipeScaler = openRecipeScaler;

function setScale(multiplier) {
    const original = window.originalServings || 4;
    $('scalerServings').value = Math.round(original * multiplier);
    updateScaledIngredients();
}
window.setScale = setScale;

function updateScaledIngredients() {
    const recipe = window.currentScaleRecipe;
    if (!recipe) return;
    
    const originalServings = window.originalServings || 4;
    const newServings = parseInt($('scalerServings')?.value) || originalServings;
    const multiplier = newServings / originalServings;
    
    let ingredientsArray = recipe.ingredients || [];
    if (typeof ingredientsArray === 'string') {
        ingredientsArray = ingredientsArray.split('\n').filter(i => i.trim());
    }
    
    const scaled = ingredientsArray.map(ing => {
        const text = typeof ing === 'object' ? `${ing.amount || ''} ${ing.name || ''}` : ing;
        return scaleIngredientText(text, multiplier);
    });
    
    $('scaledIngredients').innerHTML = scaled.map(s => 
        `<div class="scaled-item">${escapeHtml(s)}</div>`
    ).join('');
}
window.updateScaledIngredients = updateScaledIngredients;

function scaleIngredientText(text, multiplier) {
    // Find numbers and scale them
    return text.replace(/(\d+([.,]\d+)?)/g, (match) => {
        const num = parseFloat(match.replace(',', '.'));
        const scaled = num * multiplier;
        // Round to nice fractions
        if (scaled === Math.floor(scaled)) {
            return scaled.toString();
        } else if (Math.abs(scaled - Math.round(scaled * 2) / 2) < 0.1) {
            return (Math.round(scaled * 2) / 2).toString().replace('.', ',');
        } else {
            return scaled.toFixed(1).replace('.', ',');
        }
    });
}

function copyScaledIngredients() {
    const items = Array.from(document.querySelectorAll('.scaled-item'))
        .map(el => el.textContent)
        .join('\n');
    
    navigator.clipboard.writeText(items);
    showToast('📋 Ingredienser kopiert!', 'success');
}
window.copyScaledIngredients = copyScaledIngredients;

// ===== RECIPE NUTRITION TRACKER =====
function openNutritionTracker() {
    const history = JSON.parse(localStorage.getItem('kokebok_cooking_history') || '[]');
    const last7Days = history.filter(h => {
        const date = new Date(h.date);
        const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 7;
    });
    
    const mealCount = last7Days.length;
    const uniqueRecipes = new Set(last7Days.map(h => h.recipeId)).size;
    
    const html = `
        <div class="nutrition-tracker">
            <div class="tracker-header">
                <span class="tracker-icon">📈</span>
                <h3>Matdagbok - Siste 7 dager</h3>
            </div>
            
            <div class="tracker-stats">
                <div class="tracker-stat">
                    <span class="stat-value">${mealCount}</span>
                    <span class="stat-label">Måltider</span>
                </div>
                <div class="tracker-stat">
                    <span class="stat-value">${uniqueRecipes}</span>
                    <span class="stat-label">Unike retter</span>
                </div>
                <div class="tracker-stat">
                    <span class="stat-value">${(mealCount / 7).toFixed(1)}</span>
                    <span class="stat-label">Snitt/dag</span>
                </div>
            </div>
            
            <div class="tracker-tips">
                <h4>💡 Tips for bedre matplanlegging:</h4>
                <ul>
                    <li>Prøv å variere mellom proteinkildene</li>
                    <li>Inkluder minst 5 porsjoner frukt/grønt daglig</li>
                    <li>Planlegg neste uke på søndag</li>
                    <li>Bruk restene smart - se "Rester-hjelper"</li>
                </ul>
            </div>
            
            <div class="tracker-actions">
                <button class="btn btn-primary" onclick="openAiMealPlanner(); closeGenericModal();">
                    🤖 AI Ukemeny
                </button>
                <button class="btn btn-secondary" onclick="openCookingDiary(); closeGenericModal();">
                    📅 Se kalender
                </button>
            </div>
        </div>
    `;
    
    showModal('📈 Matdagbok', html, []);
}
window.openNutritionTracker = openNutritionTracker;

// ===== QUICK ADD TO SHOPPING =====
function quickAddToShopping() {
    const html = `
        <div class="quick-add">
            <p>Skriv inn varer (én per linje):</p>
            <textarea id="quickAddItems" class="quick-add-textarea" placeholder="Melk
Brød
Ost
Egg"></textarea>
            <button class="btn btn-primary" onclick="processQuickAdd()">
                ➕ Legg til alle
            </button>
        </div>
    `;
    
    showModal('🛒 Hurtig-legg til', html, []);
}
window.quickAddToShopping = quickAddToShopping;

function processQuickAdd() {
    const input = $('quickAddItems')?.value || '';
    const items = input.split('\n')
        .map(i => i.trim())
        .filter(i => i.length > 0);
    
    if (items.length === 0) {
        showToast('Skriv inn minst én vare', 'warning');
        return;
    }
    
    if (!state.shoppingList) state.shoppingList = [];
    items.forEach(item => {
        state.shoppingList.push({ text: item, checked: false, addedAt: Date.now() });
    });
    state.shoppingList = normalizeShoppingListItems(state.shoppingList);
    
    saveShoppingList();
    closeGenericModal();
    showToast(`✅ ${items.length} varer lagt til!`, 'success');
}
window.processQuickAdd = processQuickAdd;

// ===== RECIPE OF THE DAY =====
function showRecipeOfTheDay() {
    if (state.recipes.length === 0) {
        showToast('Legg til oppskrifter først', 'warning');
        return;
    }
    
    // Use date as seed for consistent daily recipe
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = seed % state.recipes.length;
    const recipe = state.recipes[index];
    
    const html = `
        <div class="recipe-of-day">
            <div class="rod-badge">⭐ Dagens oppskrift ⭐</div>
            
            <div class="rod-image">
                ${recipe.images?.[0] 
                    ? `<img src="${recipe.images[0]}" alt="${escapeHtml(recipe.name)}">`
                    : '<span class="rod-placeholder">🍽️</span>'}
            </div>
            
            <h2 class="rod-title">${escapeHtml(recipe.name)}</h2>
            
            <div class="rod-meta">
                <span>${getCategoryName(recipe.category)}</span>
                ${recipe.prepTime ? `<span>⏱️ ${recipe.prepTime}</span>` : ''}
                ${recipe.servings ? `<span>👥 ${recipe.servings} porsjoner</span>` : ''}
            </div>
            
            <button class="btn btn-primary btn-large" onclick="viewRecipe('${recipe.id}'); closeGenericModal();">
                Se oppskrift →
            </button>
        </div>
    `;
    
    showModal('⭐ Dagens oppskrift', html, []);
}
window.showRecipeOfTheDay = showRecipeOfTheDay;

