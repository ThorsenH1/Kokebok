/**
 * ==========================================
 * KOKEBOK TEST SUITE v1.0
 * Omfattende testing av alle funksjoner
 * ==========================================
 * 
 * Kjør testene ved å åpne test-runner.html i nettleseren
 * eller kjør: node test-suite.js (krever jsdom)
 */

// ===== TEST FRAMEWORK =====
class KokebokTestSuite {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };
        this.startTime = null;
        this.currentCategory = '';
        this.mocks = {};
        this.originalFunctions = {};
    }

    // Registrer en test
    test(name, fn, options = {}) {
        this.tests.push({
            name,
            fn,
            category: this.currentCategory,
            timeout: options.timeout || 5000,
            skip: options.skip || false,
            only: options.only || false
        });
    }

    // Gruppér tester
    describe(category, fn) {
        this.currentCategory = category;
        fn();
        this.currentCategory = '';
    }

    // Kjør alle tester
    async runAll() {
        this.startTime = Date.now();
        console.log('\n🧪 KOKEBOK TEST SUITE STARTER...\n');
        console.log('='.repeat(60));

        // Sjekk om det er noen "only" tester
        const hasOnly = this.tests.some(t => t.only);
        const testsToRun = hasOnly ? this.tests.filter(t => t.only) : this.tests;

        let currentCategory = '';
        
        for (const test of testsToRun) {
            if (test.category !== currentCategory) {
                currentCategory = test.category;
                console.log(`\n📁 ${currentCategory || 'Generelle tester'}`);
                console.log('-'.repeat(40));
            }

            if (test.skip) {
                this.results.skipped++;
                console.log(`  ⏭️  SKIPPED: ${test.name}`);
                continue;
            }

            try {
                const result = await this.runWithTimeout(test.fn, test.timeout);
                if (result === true || result === undefined) {
                    this.results.passed++;
                    console.log(`  ✅ PASSED: ${test.name}`);
                } else {
                    throw new Error(result || 'Test returnerte false');
                }
            } catch (error) {
                this.results.failed++;
                this.results.errors.push({
                    test: test.name,
                    category: test.category,
                    error: error.message,
                    stack: error.stack
                });
                console.log(`  ❌ FAILED: ${test.name}`);
                console.log(`     Error: ${error.message}`);
            }
        }

        this.printSummary();
        return this.results;
    }

    // Kjør test med timeout
    async runWithTimeout(fn, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Test timed out after ${timeout}ms`));
            }, timeout);

            try {
                const result = fn();
                if (result instanceof Promise) {
                    result
                        .then(res => {
                            clearTimeout(timer);
                            resolve(res);
                        })
                        .catch(err => {
                            clearTimeout(timer);
                            reject(err);
                        });
                } else {
                    clearTimeout(timer);
                    resolve(result);
                }
            } catch (error) {
                clearTimeout(timer);
                reject(error);
            }
        });
    }

    // Print oppsummering
    printSummary() {
        const duration = Date.now() - this.startTime;
        const total = this.results.passed + this.results.failed + this.results.skipped;
        const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;

        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST RESULTAT OPPSUMMERING');
        console.log('='.repeat(60));
        console.log(`  Total tester:  ${total}`);
        console.log(`  ✅ Bestått:    ${this.results.passed}`);
        console.log(`  ❌ Feilet:     ${this.results.failed}`);
        console.log(`  ⏭️  Hoppet:     ${this.results.skipped}`);
        console.log(`  📈 Pass rate:  ${passRate}%`);
        console.log(`  ⏱️  Varighet:   ${duration}ms`);
        console.log('='.repeat(60));

        if (this.results.errors.length > 0) {
            console.log('\n🔴 FEILEDE TESTER DETALJER:');
            console.log('-'.repeat(60));
            this.results.errors.forEach((err, i) => {
                console.log(`\n${i + 1}. ${err.category} > ${err.test}`);
                console.log(`   Error: ${err.error}`);
                if (err.stack) {
                    console.log(`   Stack: ${err.stack.split('\n')[1]?.trim()}`);
                }
            });
        }

        return this.results;
    }

    // Mock en funksjon
    mock(obj, methodName, mockFn) {
        const key = `${obj.constructor?.name || 'global'}.${methodName}`;
        this.originalFunctions[key] = obj[methodName];
        obj[methodName] = mockFn;
        this.mocks[key] = { obj, methodName, original: this.originalFunctions[key] };
    }

    // Gjenopprett alle mocks
    restoreAllMocks() {
        Object.entries(this.mocks).forEach(([key, mock]) => {
            mock.obj[mock.methodName] = mock.original;
        });
        this.mocks = {};
    }

    // Spy på en funksjon
    spy(obj, methodName) {
        const original = obj[methodName];
        const calls = [];
        
        obj[methodName] = function(...args) {
            calls.push({ args, timestamp: Date.now() });
            return original.apply(this, args);
        };
        
        return {
            calls,
            callCount: () => calls.length,
            calledWith: (...expectedArgs) => 
                calls.some(call => 
                    JSON.stringify(call.args) === JSON.stringify(expectedArgs)
                ),
            restore: () => { obj[methodName] = original; }
        };
    }
}

// ===== ASSERTION HELPERS =====
const assert = {
    equal(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} Expected ${expected}, got ${actual}`);
        }
        return true;
    },

    deepEqual(actual, expected, message = '') {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`${message} Objects are not equal.\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
        }
        return true;
    },

    notEqual(actual, expected, message = '') {
        if (actual === expected) {
            throw new Error(`${message} Values should not be equal: ${actual}`);
        }
        return true;
    },

    isTrue(value, message = '') {
        if (value !== true) {
            throw new Error(`${message} Expected true, got ${value}`);
        }
        return true;
    },

    isFalse(value, message = '') {
        if (value !== false) {
            throw new Error(`${message} Expected false, got ${value}`);
        }
        return true;
    },

    isDefined(value, message = '') {
        if (value === undefined || value === null) {
            throw new Error(`${message} Value is undefined or null`);
        }
        return true;
    },

    isUndefined(value, message = '') {
        if (value !== undefined) {
            throw new Error(`${message} Expected undefined, got ${value}`);
        }
        return true;
    },

    isNull(value, message = '') {
        if (value !== null) {
            throw new Error(`${message} Expected null, got ${value}`);
        }
        return true;
    },

    isArray(value, message = '') {
        if (!Array.isArray(value)) {
            throw new Error(`${message} Expected array, got ${typeof value}`);
        }
        return true;
    },

    isObject(value, message = '') {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new Error(`${message} Expected object, got ${typeof value}`);
        }
        return true;
    },

    isFunction(value, message = '') {
        if (typeof value !== 'function') {
            throw new Error(`${message} Expected function, got ${typeof value}`);
        }
        return true;
    },

    isString(value, message = '') {
        if (typeof value !== 'string') {
            throw new Error(`${message} Expected string, got ${typeof value}`);
        }
        return true;
    },

    isNumber(value, message = '') {
        if (typeof value !== 'number' || isNaN(value)) {
            throw new Error(`${message} Expected number, got ${typeof value}`);
        }
        return true;
    },

    contains(array, item, message = '') {
        if (!array.includes(item)) {
            throw new Error(`${message} Array does not contain item: ${item}`);
        }
        return true;
    },

    hasProperty(obj, prop, message = '') {
        if (!(prop in obj)) {
            throw new Error(`${message} Object does not have property: ${prop}`);
        }
        return true;
    },

    throws(fn, expectedError = null, message = '') {
        let threw = false;
        try {
            fn();
        } catch (e) {
            threw = true;
            if (expectedError && !e.message.includes(expectedError)) {
                throw new Error(`${message} Expected error containing "${expectedError}", got "${e.message}"`);
            }
        }
        if (!threw) {
            throw new Error(`${message} Expected function to throw`);
        }
        return true;
    },

    async rejects(promise, expectedError = null, message = '') {
        let rejected = false;
        try {
            await promise;
        } catch (e) {
            rejected = true;
            if (expectedError && !e.message.includes(expectedError)) {
                throw new Error(`${message} Expected rejection containing "${expectedError}", got "${e.message}"`);
            }
        }
        if (!rejected) {
            throw new Error(`${message} Expected promise to reject`);
        }
        return true;
    },

    lengthOf(value, length, message = '') {
        if (value.length !== length) {
            throw new Error(`${message} Expected length ${length}, got ${value.length}`);
        }
        return true;
    },

    greaterThan(actual, expected, message = '') {
        if (actual <= expected) {
            throw new Error(`${message} Expected ${actual} to be greater than ${expected}`);
        }
        return true;
    },

    lessThan(actual, expected, message = '') {
        if (actual >= expected) {
            throw new Error(`${message} Expected ${actual} to be less than ${expected}`);
        }
        return true;
    },

    matches(value, regex, message = '') {
        if (!regex.test(value)) {
            throw new Error(`${message} Value "${value}" does not match regex ${regex}`);
        }
        return true;
    }
};

// ===== MOCK FIREBASE =====
const mockFirebase = {
    auth: {
        currentUser: {
            uid: 'test-user-123',
            email: 'test@example.com',
            displayName: 'Test User',
            photoURL: null
        },
        onAuthStateChanged: (callback) => {
            callback(mockFirebase.auth.currentUser);
            return () => {};
        },
        signInWithPopup: async () => ({ user: mockFirebase.auth.currentUser }),
        signOut: async () => {}
    },
    
    firestore: {
        _data: {},
        
        collection: (name) => ({
            doc: (id) => ({
                get: async () => ({
                    exists: !!mockFirebase.firestore._data[`${name}/${id}`],
                    data: () => mockFirebase.firestore._data[`${name}/${id}`],
                    id
                }),
                set: async (data, options) => {
                    if (options?.merge) {
                        mockFirebase.firestore._data[`${name}/${id}`] = {
                            ...mockFirebase.firestore._data[`${name}/${id}`],
                            ...data
                        };
                    } else {
                        mockFirebase.firestore._data[`${name}/${id}`] = data;
                    }
                },
                update: async (data) => {
                    mockFirebase.firestore._data[`${name}/${id}`] = {
                        ...mockFirebase.firestore._data[`${name}/${id}`],
                        ...data
                    };
                },
                delete: async () => {
                    delete mockFirebase.firestore._data[`${name}/${id}`];
                },
                collection: (subName) => mockFirebase.firestore.collection(`${name}/${id}/${subName}`)
            }),
            add: async (data) => {
                const id = 'auto-' + Date.now();
                mockFirebase.firestore._data[`${name}/${id}`] = data;
                return { id };
            },
            where: () => ({
                get: async () => ({
                    docs: Object.entries(mockFirebase.firestore._data)
                        .filter(([key]) => key.startsWith(name + '/'))
                        .map(([key, data]) => ({
                            id: key.split('/').pop(),
                            data: () => data
                        }))
                }),
                onSnapshot: (callback) => {
                    callback({
                        docs: [],
                        docChanges: () => []
                    });
                    return () => {};
                }
            }),
            get: async () => ({
                docs: Object.entries(mockFirebase.firestore._data)
                    .filter(([key]) => key.startsWith(name + '/'))
                    .map(([key, data]) => ({
                        id: key.split('/').pop(),
                        data: () => data
                    }))
            })
        }),
        
        reset: () => {
            mockFirebase.firestore._data = {};
        }
    }
};

// ===== MOCK LOCALSTORAGE =====
const mockLocalStorage = {
    _data: {},
    getItem: (key) => mockLocalStorage._data[key] || null,
    setItem: (key, value) => { mockLocalStorage._data[key] = String(value); },
    removeItem: (key) => { delete mockLocalStorage._data[key]; },
    clear: () => { mockLocalStorage._data = {}; },
    get length() { return Object.keys(mockLocalStorage._data).length; },
    key: (i) => Object.keys(mockLocalStorage._data)[i] || null
};

// ===== MOCK DOM =====
const mockDOM = {
    elements: {},
    
    getElementById: (id) => mockDOM.elements[id] || null,
    
    createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        innerHTML: '',
        textContent: '',
        classList: {
            _classes: [],
            add: function(...cls) { this._classes.push(...cls); },
            remove: function(...cls) { this._classes = this._classes.filter(c => !cls.includes(c)); },
            toggle: function(cls, force) {
                if (force !== undefined) {
                    force ? this.add(cls) : this.remove(cls);
                } else {
                    this._classes.includes(cls) ? this.remove(cls) : this.add(cls);
                }
            },
            contains: function(cls) { return this._classes.includes(cls); }
        },
        style: {},
        appendChild: function(child) { this.children = this.children || []; this.children.push(child); },
        addEventListener: function() {},
        removeEventListener: function() {},
        setAttribute: function(key, val) { this[key] = val; },
        getAttribute: function(key) { return this[key]; },
        children: []
    }),
    
    reset: () => { mockDOM.elements = {}; }
};

// ===== EKSPORTER FOR BROWSER/NODE =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        KokebokTestSuite, 
        assert, 
        mockFirebase, 
        mockLocalStorage, 
        mockDOM 
    };
}

// Global tilgang i browser
if (typeof window !== 'undefined') {
    window.KokebokTestSuite = KokebokTestSuite;
    window.assert = assert;
    window.mockFirebase = mockFirebase;
    window.mockLocalStorage = mockLocalStorage;
    window.mockDOM = mockDOM;
}
