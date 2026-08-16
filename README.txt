PRIA — Principal's Responsible Intelligent Assistant
=======================================================

PACKAGE FILES
-------------
index.html       Main app
style.css        Birthday-themed design
app.js           Goals, reminders, alarms, speech, notifications and progress
manifest.json    PWA installation settings
sw.js            Offline service worker
icon.svg         PRIA app icon
principal.png    Uploaded Principal Sir photo

FEATURES
--------
- Multiple goals
- Goal/activity + date + exact time
- Edit, delete and complete goals
- Local device storage with localStorage
- Repeating on-screen alarm until dismissed/completed
- Voice reminder using browser speech synthesis
- Browser notification when permission is granted
- 6:00 AM daily reminder
- Daily progress percentage
- PERFECT DAY message
- Test alarm button
- Visible PWA Install button
- Install button hides in installed/standalone mode
- Birthday background and Principal Sir photo
- No account/login required

DEPLOYMENT
----------
Upload ALL files to GitHub Pages, Vercel, Netlify, etc.
Use HTTPS. PWA installation requires a secure context such as HTTPS
(localhost is also supported for development).

IMPORTANT ABOUT WEB ALARMS
--------------------------
A normal web/PWA app cannot guarantee an exact alarm while the browser
or operating system has completely suspended the app. This version checks
the clock every second while PRIA is active. Notifications also depend on
browser/OS permissions.

For best results:
1. Deploy PRIA using HTTPS.
2. Install PRIA.
3. Press "Allow Notifications & Alarms".
4. Press "Test Alarm".
5. Keep the app available/running when exact-time alarms are important.

PHOTO
-----
The uploaded photo is already included as principal.png and displayed
in the birthday header.
