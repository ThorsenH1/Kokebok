/**
 * ==========================================
 * KOKEBOK PERFORMANCE TESTS
 * Tester ytelse og optimaliseringsmuligheter
 * ==========================================
 */

const performanceSuite = new KokebokTestSuite();

// ===== RENDERING PERFORMANCE =====
performanceSuite.describe('Rendering Performance', () => {

    performanceSuite.test('render 100 recipes should be fast', () => {
        const recipes = [];
        for (let i = 0; i < 100; i++) {
            recipes.push({
                id: `recipe-${i}`,
                title: `Oppskrift ${i}`,
                category: 'hovedrett',
                ingredients: 'ingrediens 1, ingrediens 2',
                instructions: 'Gjør sånn og sånn'
            });
        }
        
        const renderRecipeCard = (recipe) => {
            return `
                <div class="recipe-card" data-id="${recipe.id}">
                    <h3>${recipe.title}</h3>
                    <span class="category">${recipe.category}</span>
                </div>
            `;
        };
        
        const start = performance.now();
        
        const html = recipes.map(renderRecipeCard).join('');
        
        const end = performance.now();
        const duration = end - start;
        
        assert.isTrue(html.length > 0);
        assert.lessThan(duration, 100, `Should render in < 100ms, took ${duration}ms`);
    });

    performanceSuite.test('render 500 recipes should complete', () => {
        const recipes = Array.from({ length: 500 }, (_, i) => ({
            id: `recipe-${i}`,
            title: `Oppskrift ${i}`,
            category: i % 2 === 0 ? 'hovedrett' : 'dessert'
        }));
        
        const start = performance.now();
        
        const html = recipes.map(r => `<div>${r.title}</div>`).join('');
        
        const end = performance.now();
        
        assert.lessThan(end - start, 500, 'Should handle 500 recipes in < 500ms');
    });

    performanceSuite.test('virtual scrolling simulation', () => {
        const totalItems = 1000;
        const viewportHeight = 600;
        const itemHeight = 80;
        const buffer = 5;
        
        const getVisibleRange = (scrollTop) => {
            const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
            const visibleCount = Math.ceil(viewportHeight / itemHeight) + (buffer * 2);
            const endIndex = Math.min(totalItems - 1, startIndex + visibleCount);
            return { startIndex, endIndex, visibleCount: endIndex - startIndex + 1 };
        };
        
        // Test at top
        const atTop = getVisibleRange(0);
        assert.equal(atTop.startIndex, 0);
        assert.lessThan(atTop.visibleCount, 30);
        
        // Test in middle
        const inMiddle = getVisibleRange(5000);
        assert.greaterThan(inMiddle.startIndex, 50);
        assert.lessThan(inMiddle.endIndex, 100);
        
        // Test at bottom
        const atBottom = getVisibleRange(80000);
        assert.equal(atBottom.endIndex, 999);
    });
});

// ===== SEARCH PERFORMANCE =====
performanceSuite.describe('Search Performance', () => {

    performanceSuite.test('search 1000 recipes by title', () => {
        const recipes = Array.from({ length: 1000 }, (_, i) => ({
            id: `recipe-${i}`,
            title: `Oppskrift nummer ${i} med ${['kylling', 'laks', 'biff', 'pasta'][i % 4]}`,
            ingredients: 'mel, egg, melk, sukker, smør',
            category: ['hovedrett', 'dessert', 'frokost'][i % 3]
        }));
        
        const searchRecipes = (recipes, query) => {
            if (!query) return recipes;
            const q = query.toLowerCase();
            return recipes.filter(r => 
                r.title.toLowerCase().includes(q) ||
                r.ingredients.toLowerCase().includes(q)
            );
        };
        
        const start = performance.now();
        
        const results = searchRecipes(recipes, 'kylling');
        
        const end = performance.now();
        
        assert.equal(results.length, 250); // 1000 / 4
        assert.lessThan(end - start, 50, `Search should be < 50ms`);
    });

    performanceSuite.test('fuzzy search performance', () => {
        const items = Array.from({ length: 500 }, (_, i) => `Ingredient ${i}`);
        
        const levenshteinDistance = (a, b) => {
            if (a.length === 0) return b.length;
            if (b.length === 0) return a.length;
            
            const matrix = [];
            for (let i = 0; i <= b.length; i++) {
                matrix[i] = [i];
            }
            for (let j = 0; j <= a.length; j++) {
                matrix[0][j] = j;
            }
            
            for (let i = 1; i <= b.length; i++) {
                for (let j = 1; j <= a.length; j++) {
                    if (b.charAt(i - 1) === a.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j] + 1
                        );
                    }
                }
            }
            
            return matrix[b.length][a.length];
        };
        
        const fuzzySearch = (items, query, maxDistance = 3) => {
            if (!query) return items;
            return items.filter(item => 
                levenshteinDistance(query.toLowerCase(), item.toLowerCase().substring(0, query.length)) <= maxDistance
            );
        };
        
        const start = performance.now();
        
        const results = fuzzySearch(items, 'Ingredent'); // Typo in query
        
        const end = performance.now();
        
        assert.greaterThan(results.length, 0);
        assert.lessThan(end - start, 200, 'Fuzzy search should complete in < 200ms');
    });
});

// ===== DATA STRUCTURE PERFORMANCE =====
performanceSuite.describe('Data Structure Performance', () => {

    performanceSuite.test('Map vs Object lookup performance', () => {
        const size = 10000;
        
        // Create object
        const obj = {};
        for (let i = 0; i < size; i++) {
            obj[`key-${i}`] = { value: i };
        }
        
        // Create Map
        const map = new Map();
        for (let i = 0; i < size; i++) {
            map.set(`key-${i}`, { value: i });
        }
        
        // Test Object lookup
        const objStart = performance.now();
        for (let i = 0; i < 1000; i++) {
            const key = `key-${Math.floor(Math.random() * size)}`;
            const val = obj[key];
        }
        const objTime = performance.now() - objStart;
        
        // Test Map lookup
        const mapStart = performance.now();
        for (let i = 0; i < 1000; i++) {
            const key = `key-${Math.floor(Math.random() * size)}`;
            const val = map.get(key);
        }
        const mapTime = performance.now() - mapStart;
        
        // Both should be fast
        assert.lessThan(objTime, 50);
        assert.lessThan(mapTime, 50);
    });

    performanceSuite.test('array find vs index lookup', () => {
        const recipes = Array.from({ length: 1000 }, (_, i) => ({
            id: `recipe-${i}`,
            title: `Recipe ${i}`
        }));
        
        const recipeIndex = {};
        recipes.forEach(r => recipeIndex[r.id] = r);
        
        // Find by array search
        const arrayStart = performance.now();
        for (let i = 0; i < 1000; i++) {
            const id = `recipe-${Math.floor(Math.random() * 1000)}`;
            const recipe = recipes.find(r => r.id === id);
        }
        const arrayTime = performance.now() - arrayStart;
        
        // Find by index
        const indexStart = performance.now();
        for (let i = 0; i < 1000; i++) {
            const id = `recipe-${Math.floor(Math.random() * 1000)}`;
            const recipe = recipeIndex[id];
        }
        const indexTime = performance.now() - indexStart;
        
        // Index should be significantly faster
        assert.lessThan(indexTime, arrayTime, 'Index lookup should be faster than array find');
    });
});

// ===== MEMORY OPTIMIZATION =====
performanceSuite.describe('Memory Optimization', () => {

    performanceSuite.test('avoid memory leaks in event listeners pattern', () => {
        let listeners = [];
        let cleanedUp = 0;
        
        const addListener = (handler) => {
            listeners.push(handler);
            return () => {
                const index = listeners.indexOf(handler);
                if (index > -1) {
                    listeners.splice(index, 1);
                    cleanedUp++;
                }
            };
        };
        
        const cleanup1 = addListener(() => {});
        const cleanup2 = addListener(() => {});
        const cleanup3 = addListener(() => {});
        
        assert.equal(listeners.length, 3);
        
        cleanup1();
        cleanup2();
        cleanup3();
        
        assert.equal(listeners.length, 0);
        assert.equal(cleanedUp, 3);
    });

    performanceSuite.test('efficient state updates', () => {
        let state = {
            recipes: [],
            selectedId: null,
            filter: ''
        };
        
        let renderCount = 0;
        
        const setState = (updates) => {
            const newState = { ...state, ...updates };
            
            // Only trigger render if something actually changed
            const hasChanges = Object.keys(updates).some(key => 
                state[key] !== updates[key]
            );
            
            if (hasChanges) {
                state = newState;
                renderCount++;
            }
        };
        
        // Should trigger render
        setState({ filter: 'search' });
        assert.equal(renderCount, 1);
        
        // Should NOT trigger render (same value)
        setState({ filter: 'search' });
        assert.equal(renderCount, 1);
        
        // Should trigger render (new value)
        setState({ filter: 'other' });
        assert.equal(renderCount, 2);
    });
});

// ===== DEBOUNCE/THROTTLE TESTS =====
performanceSuite.describe('Debounce and Throttle', () => {

    performanceSuite.test('debounce should limit function calls', async () => {
        let callCount = 0;
        
        const debounce = (func, wait) => {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        };
        
        const debouncedFn = debounce(() => callCount++, 50);
        
        // Call many times in quick succession
        for (let i = 0; i < 10; i++) {
            debouncedFn();
        }
        
        // Wait for debounce
        await new Promise(r => setTimeout(r, 100));
        
        assert.equal(callCount, 1, 'Should only call once after rapid calls');
    });

    performanceSuite.test('throttle should limit call frequency', async () => {
        let callCount = 0;
        
        const throttle = (func, limit) => {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        };
        
        const throttledFn = throttle(() => callCount++, 50);
        
        // Call many times over 120ms
        const intervalId = setInterval(throttledFn, 10);
        
        await new Promise(r => setTimeout(r, 120));
        clearInterval(intervalId);
        
        // Should have called 2-3 times (not 12)
        assert.lessThanOrEqual(callCount, 4);
        assert.greaterThan(callCount, 1);
    });
});

// ===== LAZY LOADING SIMULATION =====
performanceSuite.describe('Lazy Loading', () => {

    performanceSuite.test('lazy load images pattern', () => {
        const images = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            src: `https://example.com/image-${i}.jpg`,
            loaded: false
        }));
        
        const loadImage = (image) => {
            image.loaded = true;
        };
        
        const lazyLoad = (images, viewportStart, viewportEnd) => {
            const toLoad = images.filter((img, idx) => 
                idx >= viewportStart && 
                idx <= viewportEnd && 
                !img.loaded
            );
            
            toLoad.forEach(loadImage);
            return toLoad.length;
        };
        
        // Load first 10
        const loaded1 = lazyLoad(images, 0, 9);
        assert.equal(loaded1, 10);
        assert.isTrue(images[0].loaded);
        assert.isFalse(images[10].loaded);
        
        // Scroll to 20-30
        const loaded2 = lazyLoad(images, 20, 30);
        assert.equal(loaded2, 11);
        assert.isTrue(images[25].loaded);
        
        // Load same range again (should not reload)
        const loaded3 = lazyLoad(images, 20, 30);
        assert.equal(loaded3, 0);
    });

    performanceSuite.test('pagination performance', () => {
        const allData = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
        const pageSize = 20;
        
        const getPage = (data, page) => {
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            return {
                items: data.slice(start, end),
                totalPages: Math.ceil(data.length / pageSize),
                currentPage: page,
                hasNext: end < data.length,
                hasPrev: page > 1
            };
        };
        
        const start = performance.now();
        
        const page1 = getPage(allData, 1);
        const page25 = getPage(allData, 25);
        const page50 = getPage(allData, 50);
        
        const end = performance.now();
        
        assert.lengthOf(page1.items, 20);
        assert.isTrue(page1.hasNext);
        assert.isFalse(page1.hasPrev);
        
        assert.equal(page25.currentPage, 25);
        
        assert.isFalse(page50.hasNext);
        
        assert.lessThan(end - start, 10, 'Pagination should be very fast');
    });
});

// ===== CACHING TESTS =====
performanceSuite.describe('Caching', () => {

    performanceSuite.test('memoization pattern', () => {
        let computeCount = 0;
        
        const memoize = (fn) => {
            const cache = new Map();
            return (...args) => {
                const key = JSON.stringify(args);
                if (cache.has(key)) {
                    return cache.get(key);
                }
                const result = fn(...args);
                cache.set(key, result);
                return result;
            };
        };
        
        const expensiveComputation = (n) => {
            computeCount++;
            return n * n;
        };
        
        const memoizedFn = memoize(expensiveComputation);
        
        // First call should compute
        assert.equal(memoizedFn(5), 25);
        assert.equal(computeCount, 1);
        
        // Second call should use cache
        assert.equal(memoizedFn(5), 25);
        assert.equal(computeCount, 1);
        
        // Different input should compute
        assert.equal(memoizedFn(6), 36);
        assert.equal(computeCount, 2);
    });

    performanceSuite.test('LRU cache implementation', () => {
        class LRUCache {
            constructor(capacity) {
                this.capacity = capacity;
                this.cache = new Map();
            }
            
            get(key) {
                if (!this.cache.has(key)) return undefined;
                const value = this.cache.get(key);
                this.cache.delete(key);
                this.cache.set(key, value);
                return value;
            }
            
            set(key, value) {
                if (this.cache.has(key)) {
                    this.cache.delete(key);
                } else if (this.cache.size >= this.capacity) {
                    const firstKey = this.cache.keys().next().value;
                    this.cache.delete(firstKey);
                }
                this.cache.set(key, value);
            }
        }
        
        const cache = new LRUCache(3);
        
        cache.set('a', 1);
        cache.set('b', 2);
        cache.set('c', 3);
        
        assert.equal(cache.get('a'), 1);
        
        cache.set('d', 4); // Should evict 'b' (least recently used)
        
        assert.equal(cache.get('b'), undefined);
        assert.equal(cache.get('c'), 3);
        assert.equal(cache.get('d'), 4);
    });
});

// Eksporter for bruk
if (typeof module !== 'undefined' && module.exports) {
    module.exports = performanceSuite;
}

if (typeof window !== 'undefined') {
    window.performanceTestSuite = performanceSuite;
}
