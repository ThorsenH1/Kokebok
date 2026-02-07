/**
 * ==========================================
 * KOKEBOK SECURITY TESTS
 * Tester sikkerhet, validering og XSS-beskyttelse
 * ==========================================
 */

const securitySuite = new KokebokTestSuite();

// ===== XSS PREVENTION TESTS =====
securitySuite.describe('XSS Prevention', () => {

    securitySuite.test('escapeHtml should prevent script injection', () => {
        const escapeHtml = (text) => {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        const maliciousInputs = [
            '<script>alert("xss")</script>',
            '<img src=x onerror=alert("xss")>',
            '<svg onload=alert("xss")>',
            'javascript:alert("xss")',
            '<a href="javascript:alert(\'xss\')">click</a>',
            '"><script>alert("xss")</script>',
            '\';alert(String.fromCharCode(88,83,83))//\';',
            '<IMG SRC="javascript:alert(\'XSS\');">',
            '<BODY ONLOAD=alert(\'XSS\')>',
            '<INPUT TYPE="IMAGE" SRC="javascript:alert(\'XSS\');">'
        ];
        
        maliciousInputs.forEach(input => {
            const escaped = escapeHtml(input);
            assert.isFalse(escaped.includes('<script'), `Should escape: ${input}`);
            assert.isFalse(escaped.includes('onerror='), `Should escape onerror: ${input}`);
            assert.isFalse(escaped.includes('onload='), `Should escape onload: ${input}`);
        });
    });

    securitySuite.test('recipe title sanitization', () => {
        const sanitizeTitle = (title) => {
            if (!title) return '';
            // Remove HTML tags
            let clean = title.replace(/<[^>]*>/g, '');
            // Remove special characters that could be used in attacks
            clean = clean.replace(/[<>"'&;]/g, '');
            // Trim and limit length
            return clean.trim().substring(0, 200);
        };
        
        assert.equal(sanitizeTitle('<script>'), '');
        assert.equal(sanitizeTitle('Normal Title'), 'Normal Title');
        assert.equal(sanitizeTitle('Title with <b>bold</b>'), 'Title with bold');
        assert.equal(sanitizeTitle("Title with 'quotes'"), 'Title with quotes');
        
        // Test length limit
        const longTitle = 'A'.repeat(300);
        assert.equal(sanitizeTitle(longTitle).length, 200);
    });

    securitySuite.test('URL validation', () => {
        const isValidUrl = (url) => {
            if (!url) return false;
            try {
                const parsed = new URL(url);
                // Only allow http and https
                return ['http:', 'https:'].includes(parsed.protocol);
            } catch {
                return false;
            }
        };
        
        assert.isTrue(isValidUrl('https://example.com'));
        assert.isTrue(isValidUrl('http://example.com'));
        assert.isFalse(isValidUrl('javascript:alert(1)'));
        assert.isFalse(isValidUrl('data:text/html,<script>alert(1)</script>'));
        assert.isFalse(isValidUrl('vbscript:alert(1)'));
        assert.isFalse(isValidUrl('not a url'));
        assert.isFalse(isValidUrl(null));
    });
});

// ===== INPUT VALIDATION TESTS =====
securitySuite.describe('Input Validation', () => {

    securitySuite.test('email validation', () => {
        const isValidEmail = (email) => {
            if (!email) return false;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        };
        
        assert.isTrue(isValidEmail('test@example.com'));
        assert.isTrue(isValidEmail('user.name@domain.co.uk'));
        assert.isFalse(isValidEmail('invalid'));
        assert.isFalse(isValidEmail('invalid@'));
        assert.isFalse(isValidEmail('@invalid.com'));
        assert.isFalse(isValidEmail(null));
        assert.isFalse(isValidEmail(''));
    });

    securitySuite.test('recipe validation - required fields', () => {
        const validateRecipe = (recipe) => {
            const errors = [];
            
            if (!recipe) {
                return ['Recipe object is required'];
            }
            
            if (!recipe.title || typeof recipe.title !== 'string' || recipe.title.trim().length === 0) {
                errors.push('Title is required');
            }
            
            if (recipe.title && recipe.title.length > 200) {
                errors.push('Title must be less than 200 characters');
            }
            
            if (!recipe.ingredients || recipe.ingredients.trim().length === 0) {
                errors.push('Ingredients are required');
            }
            
            if (!recipe.instructions || recipe.instructions.trim().length === 0) {
                errors.push('Instructions are required');
            }
            
            if (recipe.servings && isNaN(parseInt(recipe.servings))) {
                errors.push('Servings must be a number');
            }
            
            return errors;
        };
        
        assert.lengthOf(validateRecipe(null), 1);
        assert.lengthOf(validateRecipe({}), 3);
        assert.lengthOf(validateRecipe({ title: '' }), 3);
        assert.lengthOf(validateRecipe({ title: '   ' }), 3);
        assert.lengthOf(validateRecipe({ title: 'Test', ingredients: 'a', instructions: 'b' }), 0);
        
        const longTitle = 'A'.repeat(201);
        const errors = validateRecipe({ title: longTitle, ingredients: 'a', instructions: 'b' });
        assert.isTrue(errors.some(e => e.includes('200 characters')));
    });

    securitySuite.test('friend request validation', () => {
        const validateFriendRequest = (request, currentUserId) => {
            const errors = [];
            
            if (!request.toUid) {
                errors.push('Target user is required');
            }
            
            if (request.toUid === currentUserId) {
                errors.push('Cannot send friend request to yourself');
            }
            
            if (!request.fromUid) {
                errors.push('Sender is required');
            }
            
            return errors;
        };
        
        const currentUser = 'user-123';
        
        assert.lengthOf(validateFriendRequest({ fromUid: 'user-123', toUid: 'user-456' }, currentUser), 0);
        assert.lengthOf(validateFriendRequest({ fromUid: 'user-123', toUid: 'user-123' }, currentUser), 1);
        assert.lengthOf(validateFriendRequest({ toUid: 'user-456' }, currentUser), 1);
        assert.lengthOf(validateFriendRequest({}, currentUser), 2);
    });
});

// ===== DATA INTEGRITY TESTS =====
securitySuite.describe('Data Integrity', () => {

    securitySuite.test('JSON parsing safety', () => {
        const safeJsonParse = (str, defaultValue = null) => {
            try {
                return JSON.parse(str);
            } catch {
                return defaultValue;
            }
        };
        
        assert.deepEqual(safeJsonParse('{"a": 1}'), { a: 1 });
        assert.deepEqual(safeJsonParse('invalid json', {}), {});
        assert.equal(safeJsonParse(null, []), []);
        assert.equal(safeJsonParse(undefined, 'default'), 'default');
    });

    securitySuite.test('prototype pollution prevention', () => {
        const safeAssign = (target, source) => {
            const result = { ...target };
            
            Object.keys(source).forEach(key => {
                // Prevent prototype pollution
                if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                    return;
                }
                result[key] = source[key];
            });
            
            return result;
        };
        
        const malicious = JSON.parse('{"__proto__": {"isAdmin": true}}');
        const safe = safeAssign({}, malicious);
        
        assert.isFalse(({}).isAdmin);
        assert.isFalse(safe.hasOwnProperty('__proto__'));
    });

    securitySuite.test('number validation for servings/portions', () => {
        const validateNumber = (value, min = 0, max = 1000) => {
            const num = parseInt(value);
            if (isNaN(num)) return { valid: false, error: 'Not a number' };
            if (num < min) return { valid: false, error: `Must be at least ${min}` };
            if (num > max) return { valid: false, error: `Must be at most ${max}` };
            return { valid: true, value: num };
        };
        
        assert.isTrue(validateNumber(4).valid);
        assert.isTrue(validateNumber('8').valid);
        assert.isFalse(validateNumber('abc').valid);
        assert.isFalse(validateNumber(-1).valid);
        assert.isFalse(validateNumber(10000).valid);
    });
});

// ===== AUTHENTICATION SECURITY =====
securitySuite.describe('Authentication Security', () => {

    securitySuite.test('user object validation', () => {
        const isValidUser = (user) => {
            if (!user) return false;
            if (!user.uid || typeof user.uid !== 'string') return false;
            if (user.uid.length < 10) return false;
            return true;
        };
        
        assert.isTrue(isValidUser({ uid: 'abcdefghijklmn' }));
        assert.isFalse(isValidUser(null));
        assert.isFalse(isValidUser({}));
        assert.isFalse(isValidUser({ uid: 'short' }));
        assert.isFalse(isValidUser({ uid: 123 }));
    });

    securitySuite.test('permission check for data access', () => {
        const canAccessData = (userId, dataOwnerId, isPublic = false) => {
            if (isPublic) return true;
            if (!userId || !dataOwnerId) return false;
            return userId === dataOwnerId;
        };
        
        assert.isTrue(canAccessData('user-1', 'user-1'));
        assert.isFalse(canAccessData('user-1', 'user-2'));
        assert.isTrue(canAccessData('user-1', 'user-2', true)); // Public data
        assert.isFalse(canAccessData(null, 'user-1'));
    });

    securitySuite.test('token expiry check', () => {
        const isTokenExpired = (expiryTimestamp) => {
            if (!expiryTimestamp) return true;
            return Date.now() >= expiryTimestamp;
        };
        
        const futureTime = Date.now() + 3600000; // 1 hour from now
        const pastTime = Date.now() - 3600000; // 1 hour ago
        
        assert.isFalse(isTokenExpired(futureTime));
        assert.isTrue(isTokenExpired(pastTime));
        assert.isTrue(isTokenExpired(null));
    });
});

// ===== RATE LIMITING SIMULATION =====
securitySuite.describe('Rate Limiting', () => {

    securitySuite.test('action rate limiter', () => {
        const rateLimiter = {
            actions: [],
            maxActions: 5,
            windowMs: 60000, // 1 minute
            
            canPerformAction() {
                const now = Date.now();
                // Remove old actions outside window
                this.actions = this.actions.filter(t => now - t < this.windowMs);
                return this.actions.length < this.maxActions;
            },
            
            recordAction() {
                if (this.canPerformAction()) {
                    this.actions.push(Date.now());
                    return true;
                }
                return false;
            },
            
            reset() {
                this.actions = [];
            }
        };
        
        rateLimiter.reset();
        
        // Should allow first 5 actions
        for (let i = 0; i < 5; i++) {
            assert.isTrue(rateLimiter.recordAction(), `Action ${i + 1} should be allowed`);
        }
        
        // Should block 6th action
        assert.isFalse(rateLimiter.recordAction(), 'Action 6 should be blocked');
        assert.isFalse(rateLimiter.canPerformAction());
    });

    securitySuite.test('login attempt limiter', () => {
        const loginAttempts = {};
        const maxAttempts = 5;
        const lockoutTime = 900000; // 15 minutes
        
        const canAttemptLogin = (userId) => {
            const attempts = loginAttempts[userId];
            if (!attempts) return true;
            
            if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
                return false;
            }
            
            return attempts.count < maxAttempts;
        };
        
        const recordLoginAttempt = (userId, success) => {
            if (!loginAttempts[userId]) {
                loginAttempts[userId] = { count: 0 };
            }
            
            if (success) {
                loginAttempts[userId] = { count: 0 };
            } else {
                loginAttempts[userId].count++;
                if (loginAttempts[userId].count >= maxAttempts) {
                    loginAttempts[userId].lockedUntil = Date.now() + lockoutTime;
                }
            }
        };
        
        const testUser = 'test-user';
        
        // First attempts should be allowed
        for (let i = 0; i < 5; i++) {
            assert.isTrue(canAttemptLogin(testUser));
            recordLoginAttempt(testUser, false);
        }
        
        // Should be locked out
        assert.isFalse(canAttemptLogin(testUser));
        
        // Successful login should reset
        recordLoginAttempt('other-user', true);
        assert.isTrue(canAttemptLogin('other-user'));
    });
});

// ===== CONTENT SECURITY =====
securitySuite.describe('Content Security', () => {

    securitySuite.test('image URL validation', () => {
        const isValidImageUrl = (url) => {
            if (!url) return false;
            
            // Check for data URLs (base64)
            if (url.startsWith('data:image/')) {
                return /^data:image\/(jpeg|jpg|png|gif|webp);base64,/.test(url);
            }
            
            // Check for http/https URLs
            try {
                const parsed = new URL(url);
                if (!['http:', 'https:'].includes(parsed.protocol)) return false;
                
                // Check file extension
                const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
                return validExtensions.some(ext => parsed.pathname.toLowerCase().endsWith(ext));
            } catch {
                return false;
            }
        };
        
        assert.isTrue(isValidImageUrl('https://example.com/image.jpg'));
        assert.isTrue(isValidImageUrl('https://example.com/photo.PNG'));
        assert.isTrue(isValidImageUrl('data:image/png;base64,iVBORw0KGgo'));
        assert.isFalse(isValidImageUrl('javascript:alert(1)'));
        assert.isFalse(isValidImageUrl('https://example.com/script.js'));
        assert.isFalse(isValidImageUrl(null));
    });

    securitySuite.test('file size validation', () => {
        const maxFileSize = 5 * 1024 * 1024; // 5MB
        
        const validateFileSize = (size) => {
            if (!size || typeof size !== 'number') return { valid: false, error: 'Invalid size' };
            if (size > maxFileSize) return { valid: false, error: 'File too large (max 5MB)' };
            if (size <= 0) return { valid: false, error: 'Invalid file size' };
            return { valid: true };
        };
        
        assert.isTrue(validateFileSize(1024).valid);
        assert.isTrue(validateFileSize(1000000).valid);
        assert.isFalse(validateFileSize(10000000).valid);
        assert.isFalse(validateFileSize(-1).valid);
        assert.isFalse(validateFileSize(null).valid);
    });
});

// ===== FIRESTORE SECURITY RULES SIMULATION =====
securitySuite.describe('Firestore Security Rules Simulation', () => {

    securitySuite.test('user can only access own data', () => {
        const simulateSecurityRule = (requestUserId, documentOwnerId, operation) => {
            // Simulate: allow read, write: if request.auth.uid == resource.data.userId
            if (!requestUserId) return false;
            
            switch (operation) {
                case 'read':
                case 'write':
                case 'delete':
                    return requestUserId === documentOwnerId;
                default:
                    return false;
            }
        };
        
        assert.isTrue(simulateSecurityRule('user-1', 'user-1', 'read'));
        assert.isTrue(simulateSecurityRule('user-1', 'user-1', 'write'));
        assert.isFalse(simulateSecurityRule('user-1', 'user-2', 'read'));
        assert.isFalse(simulateSecurityRule(null, 'user-1', 'read'));
    });

    securitySuite.test('public profile access rules', () => {
        const canAccessPublicProfile = (requestUserId, profileUserId, operation) => {
            switch (operation) {
                case 'read':
                    return true; // Anyone can read public profiles
                case 'write':
                    return requestUserId === profileUserId; // Only owner can write
                default:
                    return false;
            }
        };
        
        assert.isTrue(canAccessPublicProfile('user-1', 'user-2', 'read'));
        assert.isTrue(canAccessPublicProfile(null, 'user-2', 'read'));
        assert.isTrue(canAccessPublicProfile('user-1', 'user-1', 'write'));
        assert.isFalse(canAccessPublicProfile('user-1', 'user-2', 'write'));
    });

    securitySuite.test('friend request security', () => {
        const canAccessFriendRequest = (requestUserId, fromUid, toUid, operation) => {
            if (!requestUserId) return false;
            
            switch (operation) {
                case 'create':
                    return requestUserId === fromUid;
                case 'read':
                case 'delete':
                    return requestUserId === fromUid || requestUserId === toUid;
                default:
                    return false;
            }
        };
        
        assert.isTrue(canAccessFriendRequest('user-1', 'user-1', 'user-2', 'create'));
        assert.isFalse(canAccessFriendRequest('user-3', 'user-1', 'user-2', 'create'));
        assert.isTrue(canAccessFriendRequest('user-2', 'user-1', 'user-2', 'read'));
        assert.isTrue(canAccessFriendRequest('user-2', 'user-1', 'user-2', 'delete'));
    });
});

// Eksporter for bruk
if (typeof module !== 'undefined' && module.exports) {
    module.exports = securitySuite;
}

if (typeof window !== 'undefined') {
    window.securityTestSuite = securitySuite;
}
