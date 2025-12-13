# Pole Vault Coach – Local Web App

This mobile‑first web application enables a pole vault coach to log practice jumps on a single device without any backend services or user accounts. All data is stored locally in the browser using `localStorage` and can be exported as a JSON file when needed.

## Running Locally

1. **Download the app**: Copy the entire `pole-vault-app` folder to your computer. It contains `index.html`, JavaScript and CSS files, a manifest, a service worker and an icon.
2. **Serve the app over HTTP**: Many browsers restrict access to certain APIs (like `serviceWorker` and `localStorage`) when running directly from the filesystem. Use a simple HTTP server instead. For example:

   ```bash
   cd pole-vault-app
   python3 -m http.server 8000
   ```

   Then navigate to `http://localhost:8000` in your browser.

3. **Usage**: The app will start on the Athletes list screen. You can add athletes, open an athlete to view or add jumps, and inspect individual jump details.

## Adding to Home Screen on iPhone

### Important note about browsers on iOS

All third‑party browsers on iOS (Chrome, Edge, Brave, Firefox, etc.) are built on top of WebKit and **cannot install progressive web apps**. Only Safari exposes the “Add to Home Screen” option. After installation, however, you can launch the app from its icon without opening Safari again.

### Installation steps

1. Serve the app from a web server (e.g. with the `python3 -m http.server` command above) or deploy it to a static hosting service (see below).
2. On your iPhone, open **Safari** and navigate to the app’s URL.
3. Tap the **Share** icon at the bottom of Safari.
4. Select **Add to Home Screen**.
5. Choose a name if desired and tap **Add**. The app icon (`PV`) will appear on your home screen. Launching it from there runs it fullscreen like a native app and works offline thanks to the service worker.

If you open the app in Chrome, Edge, or Brave on iOS, a small banner will appear at the bottom reminding you to install it via Safari. You can dismiss this banner and it will not reappear.

## Hosting on GitHub Pages or Other Static Hosts

For the most seamless experience on iPhone, you can host the app on a static hosting platform. This allows you to install the app without running a local server every time. The following example uses GitHub Pages:

1. Create a new repository on GitHub (e.g. `pole-vault-app`).
2. Copy the contents of the `pole-vault-app` folder into the repository. Commit and push your changes.
3. In the repository settings, enable GitHub Pages and select the main branch as the source. GitHub will deploy your site under a URL like `https://<username>.github.io/<repo-name>/`.
4. Wait a few minutes for the site to build. Then visit the URL in Safari on your iPhone and follow the installation steps above.

Other static hosts such as Netlify or Vercel work similarly: upload the contents of the `pole-vault-app` folder and deploy a static site. Make sure your `manifest.json` and `service-worker.js` are served from the root of the deployed site.

## Data Storage and Export

All data (athletes and jumps) is saved in the browser’s `localStorage` under a single key. Each athlete and jump is assigned a UUID. You can clear your browser storage to reset the app. To back up or transfer your data:

1. Tap the **Export Data** button fixed at the bottom of the screen.
2. Your browser will download `pole-vault-data.json`, which contains all athletes and jumps in a simple JSON structure matching the specification:

   ```json
   {
     "athletes": [ ... ],
     "jumps": [ ... ]
   }
   ```

You can later import or synchronize this data in future versions of the app that support cloud sync or multi‑device use.

## Architecture & Extensibility

The app separates data storage from UI logic via the `Storage` module (`storage.js`). The main UI code (`app.js`) renders one of four screens (Athletes List, Athlete Detail, New Jump, Jump Detail) and uses event listeners to handle user interactions. The codebase is organized to enable future upgrades:

* **Cloud sync and user accounts**: Replace or extend `Storage` with asynchronous calls to a remote API while keeping the same interface.
* **Video uploads**: Use the reserved placeholder in Jump Detail for a file picker and video player. Add video metadata to the Jump model when implementing uploads.
* **Multi‑device use**: Introduce authentication and remote storage while retaining local caching via the service worker.

Feel free to adapt the styling and code structure as needed. Comments throughout the code highlight areas intended for future development.