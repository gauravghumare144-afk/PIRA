PRIA — Principal's Responsible Intelligent Assistant
=====================================================

FILES
-----
index.html   Main app
app.js       Goals, alarms, notifications, progress and installation
sw.js        Service worker for PWA/offline caching
manifest.json PWA installation information
icon.svg     App icon
principal.jpg Optional Principal Sir photo

HOW TO USE ON A COMPUTER
------------------------
1. Put all files in one folder.
2. Add your Principal Sir photo as "principal.jpg" in the same folder.
3. For full PWA installation and service-worker features, run the folder from HTTPS hosting
   or localhost. Opening index.html directly with file:// works for the main goal features,
   but service workers/PWA installation may not work.
4. Click "Allow Notifications & Alarms".
5. Add goals with date and exact time.
6. Click "Test Alarm" to test sound.

HOW TO INSTALL
--------------
Upload this folder to an HTTPS static host such as GitHub Pages, Netlify, Vercel, or
another static HTTPS host. Open the URL in a supported browser and use the visible
"Install PRIA" button, or the browser's Install app / Add to Home Screen option.

IMPORTANT ALARM LIMITATION
--------------------------
Web browsers do not guarantee exact background alarms when the browser/device is fully
closed, sleeping, or the operating system restricts background activity. The reminder
checker is designed to work while PRIA is open/active, and notifications require browser
permission. For guaranteed native background alarms, a native Android/iOS app would be
needed.

PHOTO
-----
Place a file named principal.jpg beside index.html. The app will automatically display it.
