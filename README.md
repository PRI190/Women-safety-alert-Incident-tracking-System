# SafeGuard360 - Women Safety & Emergency Dispatch System

SafeGuard360 is a full-stack Web Application built with React, Vite, Express, and Tailwind CSS.

---

## ⚠️ Why opening `index.html` directly shows a blank/white page

If you double-click `index.html` directly from your file manager (URL starting with `file:///...`), modern browsers block JavaScript ES Modules (`<script type="module">`) due to browser security (CORS) rules.

**To run the application locally, you must run it using Node.js and a development server.**

---

## 🚀 How to Run the Downloaded ZIP Project Locally

### Step 1: Requirements
Make sure you have **Node.js** installed on your computer:
- Download Node.js (v18 or higher recommended) from [nodejs.org](https://nodejs.org/).

### Step 2: Extract & Open Terminal
1. Extract the downloaded `.zip` file into a folder.
2. Open your Terminal (Mac/Linux) or Command Prompt / PowerShell / VS Code Terminal (Windows).
3. Navigate into the project folder:
   ```bash
   cd path/to/extracted-folder
   ```

### Step 3: Install Dependencies
Run the following command in your terminal to install all required packages:
```bash
npm install
```

### Step 4: Start Development Server
Run the local server command:
```bash
npm run dev
```

### Step 5: Open Application
Once the server starts, open your browser and go to:
```
http://localhost:3000
```

---

## 🔑 Demo Login Credentials

You can test both user and administrator command portals using these quick demo credentials:

### 👤 User Portal Access
- **ID / Email**: `user` or `user@safeguard.com`
- **Password**: `1234` or any password

### 🛡️ Admin Command Portal Access
- **ID / Email**: `admin` or `qwer` or `admin@safeguard.com`
- **Password**: `qwer` or `admin123`

---

## 🛠️ Building for Production

To create a production build:
```bash
npm run build
```

To run the compiled production full-stack server:
```bash
npm start
```
And open `http://localhost:3000`.

---

## ❓ Troubleshooting

1. **Port 3000 in use**:
   If port 3000 is occupied by another application, close it or set `PORT=3001` before running `npm run dev`.

2. **White Page / Blank Screen**:
   - Ensure you are accessing `http://localhost:3000` in your browser, **NOT** opening `index.html` directly from your file folder (`file://`).
   - Clear your browser cache or try an Incognito/Private window.
