# 🚀 Deployment Guide - v4.1.0

## 📋 Pre-deployment Checklist

### ✅ Code Updates
- [x] Updated version to 4.1.0 in app.js
- [x] Updated version in index.html CSS link
- [x] Updated version in manifest.json
- [x] Updated version in sw.js and cache name
- [x] Added push notification system
- [x] Added equipment tracker
- [x] Added pantry tracker
- [x] Added new achievements
- [x] Updated Firebase Security Rules

### ✅ UI Updates
- [x] Added "Mitt Kjøkken" section in menu
- [x] Added Equipment and Pantry menu items
- [x] Added notification settings toggles
- [x] Added Kitchen card to dashboard
- [x] Updated all version numbers in UI

### ✅ CSS Updates
- [x] Added equipment tracker styles
- [x] Added pantry tracker styles
- [x] Added kitchen card styles
- [x] Added mobile responsive styles
- [x] Added dark mode support

### ✅ Service Worker
- [x] Updated to v4.1.0
- [x] Added push notification event handlers
- [x] Added notification click handlers
- [x] Updated cached assets

## 🔥 Firebase Deployment Steps

### 1. Deploy Firebase Security Rules

```bash
# Navigate to project directory
cd "C:\Users\hat\OneDrive - University of Bergen\Kokebok"

# Deploy firestore rules
firebase deploy --only firestore:rules
```

**Or manually in Firebase Console:**
1. Go to https://console.firebase.google.com
2. Select project: kokebok-c5c07
3. Go to Firestore Database → Rules
4. Copy content from `firestore.rules`
5. Publish rules

### 2. Verify Firebase Configuration

Check that `firebase-config.js` contains correct credentials:
```javascript
messagingSenderId: "915848411687"
```

### 3. Enable Firebase Cloud Messaging (FCM)

1. Go to Firebase Console → Project Settings
2. Navigate to Cloud Messaging tab
3. Generate Web Push certificates if not already done
4. Copy the VAPID key (Public key)
5. Update VAPID_PUBLIC_KEY in app.js if needed

## 📱 GitHub Pages Deployment

### Automatic Deployment (Recommended)

Simply push to GitHub:

```bash
git add .
git commit -m "Release v4.1.0 - Equipment, Pantry & Push Notifications"
git push origin main
```

GitHub Pages will automatically deploy the updated version.

### Manual Verification

1. Visit: https://thorsenh1.github.io/Kokebok
2. Clear browser cache (Ctrl + Shift + Delete)
3. Reload page (Ctrl + F5)
4. Check version in Settings: Should show "v4.1.0"
5. Open browser console: Should show "✓ Service Worker registrert"

## 🧪 Post-deployment Testing

### Critical Tests

1. **Service Worker Update**
   - Open DevTools → Application → Service Workers
   - Should show "kokebok-v4.1.0"
   - Click "Update" if old version is still active

2. **Push Notifications**
   - Go to Settings → Varsler
   - Enable "Push-varsler"
   - Should show browser permission dialog
   - Grant permission
   - Test by having a friend send you a recipe

3. **Equipment Tracker**
   - Menu → Mitt Kjøkken → Utstyr
   - Add test equipment item
   - Verify it saves to Firebase
   - Test image upload
   - Test filtering

4. **Pantry Tracker**
   - Menu → Mitt Kjøkken → Matkammer
   - Add item with expiry date in 2 days
   - Should show warning badge
   - Should appear on dashboard kitchen card

5. **Kitchen Card**
   - Dashboard should show kitchen card
   - Equipment count should update
   - Pantry count should update
   - Expiry alert badge should appear if items expiring

6. **New Achievements**
   - Add 10 equipment items → "Utstyrssamler" unlocked
   - Add 20 pantry items → "Spisskammerekspert" unlocked

7. **Mobile Responsive**
   - Test on mobile device or DevTools mobile view
   - All new features should work
   - Kitchen card should be responsive

## 🔍 Troubleshooting

### Service Worker Not Updating

```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(r => r.unregister());
    location.reload();
});
```

### Push Notifications Not Working

1. Check browser support: Chrome, Edge, Firefox, Safari (iOS 16.4+)
2. Verify HTTPS connection (required for push)
3. Check notification permission: Settings → Site Settings
4. Verify FCM configuration in Firebase Console

### Equipment/Pantry Not Loading

1. Check browser console for errors
2. Verify Firebase rules are deployed
3. Check network tab for failed requests
4. Verify user is authenticated

### Cache Issues

1. Clear browser cache
2. Hard reload (Ctrl + Shift + R)
3. Unregister service worker (see above)
4. Clear Application Storage in DevTools

## 📊 Monitoring

### Firebase Console
- Monitor Firestore usage
- Check for security rule violations
- Monitor authentication activity

### Browser DevTools
- Console: Check for JavaScript errors
- Network: Verify API calls succeed
- Application: Check service worker status
- Application: Verify local storage

## 🎉 Success Criteria

- [ ] Version shows "v4.1.0" in settings
- [ ] Service worker cache name is "kokebok-v4.1.0"
- [ ] Push notifications work when app is closed
- [ ] Equipment tracker saves and loads correctly
- [ ] Pantry tracker shows expiry warnings
- [ ] Kitchen card appears on dashboard
- [ ] New achievements can be unlocked
- [ ] All menu items work
- [ ] Mobile layout is correct
- [ ] Dark mode works with new features

## 🔄 Rollback Plan

If critical issues arise:

```bash
# Revert to v4.0.0
git revert HEAD
git push origin main

# Or reset to previous commit
git reset --hard <commit-hash-of-v4.0.0>
git push origin main --force
```

## 📝 Notes

- Users will automatically get the update when they reload the app
- Service worker will update in background
- Old cache will be automatically cleared
- Firebase rules are backwards compatible with v4.0.0

## 🚨 Emergency Contacts

- Firebase Project: kokebok-c5c07
- GitHub Repo: https://github.com/thorsenh1/Kokebok
- Live Site: https://thorsenh1.github.io/Kokebok

---

**Deployment Date**: ____________________  
**Deployed By**: ____________________  
**Issues**: ____________________

