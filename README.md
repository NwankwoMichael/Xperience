# 🗺️ Xperience Platform

[![Live Demo](https://shields.io)](https://xperience-app.onrender.com)
[![API Docs](https://shields.io)](https://getpostman.com)
[![CI Build Status](https://shields.io)](https://github.com)
![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20Express%20%7C%20TypeScript%20%7C%20MongoDB-lightgrey)
[![License: MIT](https://shields.io)](./LICENSE)

Xperience is a **secure, enterprise-grade travel and adventure management platform** built on a high-performance Express 5 and TypeScript architecture. Features structural Mongoose schemas, real-time advanced Mapbox GL route markers, automated crypto password recovery workflows, robust multi-role CMS dashboard matrix trees, and a production-hardened Stripe secure webhook transactional ledger gateway.

---

## ✨ Core Architecture & Premium Features

### 🔐 Multi-Role Administrative CMS Dashboards

Fully integrated, server-side rendered (Pug) command consoles mapped across isolated table grids:

- **Global Trip Inventory:** Create, update, and delete active adventure configurations natively.
- **User Directory Administration:** Toggle real-time profile suspensions or adjust operational clearance roles (`user`, `guide`, `lead-guide`, `admin`) directly from the UI layer.
- **Testimonial Moderation Matrix:** System-wide management tool to monitor and remove review documents.
- **Transactional Booking Ledger:** Real-time visibility into cleared platform revenues and automated ticket revocation.

### 🛡️ Anti-Fraud Travel Testimonial Gateway

- **Verified Reviews Only:** Restricts review creation strictly to consumers with matching database booking entries.
- **Temporal Enforcement:** Users cannot rate or review an itinerary until at least one of the trip's start dates is in the past (`< Date.now()`).
- **Unique Compound Indexing:** Enforces a strict one-review-per-trip-per-user boundary block at the MongoDB layer to permanently prevent rating spam.

### 💳 Secure Transactional Webhook Engineering

- Implements a dedicated, unparsed raw binary buffer parser (`req.rawBody`) mounted cleanly before global JSON format interpreters.
- Cryptographically verifies incoming payment payloads straight from Stripe's cloud servers via `stripe.webhooks.constructEvent`.
- Automatically executes booking completions asynchronously, bypassing traditional cookie/JWT authorization header requirements during server-to-server data dispatches.

### 🧭 Advanced Geospatial Navigation Grids

- Powered by the Mapbox GL JS engine with robust inline TypeScript window interface overrides.
- Automatically calculates coordinate matrix boundary framing animations via `LngLatBounds`.
- Displays dynamic, brand-customized high-contrast map marker overlays pinned accurately to multi-day stops.

---

## 🛠️ Technical Stack

- **Backend Framework:** Node.js, Express 5, TypeScript (Strict Type Compile-Locked)
- **Database Architecture:** MongoDB Atlas, Mongoose ODM
- **Build Automation & Pipeline:** Parcel Bundler (Frontend Compilation), TSC (TypeScript Transpiler), Cross-Env
- **Security Engineering:** Helmet (Strict Content Security Policies matching Google Fonts, Stripe, and Mapbox subdomains), Express Rate Limit, Express Mongo Sanitize, HPP (HTTP Parameter Pollution Whitelisting), Express XSS Sanitizer
- **Utilities & Assets:** Cookie-Parser, Morgan Logs, Compression (Gzip API payloads), CORS, Multer & Sharp Binary Filters

---

## 📂 Project Structure

```text
Xperience/
├── .github/workflows/   # CI/CD automated pipeline workflows (master branch)
├── dev-data/data/       # Modernized JSON seed sheets (trips.json, reviews.json)
├── dist/                # Production transpiled JavaScript binaries target dir (tsc output)
├── public/              # Client-side asset distributions
│   ├── css/             # Refactored Xperience brand stylesheets
│   └── js/              # Type-safe modular components (stripe.ts, mapbox.ts, adminUsers.ts)
├── src/                 # Enterprise application core logic layer
│   ├── controllers/     # Route controllers & factory operation matrices
│   ├── models/          # Strongly-typed Mongoose schemas & compound indexes
│   ├── routes/          # Express 5 endpoint router matrices
│   ├── utils/           # Centralized exception handlers & app errors
│   └── server.ts        # Primary cluster boot script entry point
└── views/               # Extends semantic administrative Pug template frames
```

---

## 🔧 Local Installation & Seeding

1. Clone the repository framework files:

   ```bash
   git clone https://github.com
   cd Xperience
   ```

2. Provision native platform dependency packages:

   ```bash
   npm install
   ```

3. Construct your environment configuration blueprint inside a root **`.env`** file:

   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE=mongodb+srv://<username>:<password>@cluster.mongodb.net/xperience
   DB_PASSWORD=your_atlas_password

   JWT_SECRET=your_cryptographically_secure_jwt_secret_string
   JWT_EXPIRES_IN=90d
   JWT_COOKIE_EXPIRES_IN=90

   MAPBOX_ACCESS_TOKEN=pk_test_your_mapbox_token
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret
   STRIPE_PUBLIC_KEY=pk_test_your_stripe_public
   STRIPE_WEBHOOK_SECRET=whsec_your_stripe_cli_webhook_secret
   ```

4. Wipe legacy rows and seed clean development data into your remote database:

   ```bash
   # Clear database collections
   npm run data:delete

   # Populate with trips, reviews, and users
   npm run data:import
   ```

5. Spin up your active workspace development watchers concurrently:

   ```bash
   # Terminal Pane 1: Launch backend hot-reloader
   npm run dev

   # Terminal Pane 2: Launch Parcel hot-module bundler
   npm run watch:js
   ```

---

## 📦 Production Bundling & Deployment Execution

When preparing your files to transition online to live cloud hosting providers, the environment handles compilation via a single production optimization script:

```bash
# Triggers Parcel production minification and transpiles TypeScript down to /dist
npm run build

# Runs your enterprise-optimized JavaScript runtime server engine
npm start
```

### 📌 Critical Deployment Notes

- Ensure your environment settings panel inside your cloud provider contains `app.set('trust proxy', 1);` configurations for secure cookie propagation over HTTPS.
- For local sandbox webhook processing, remember to initialize your CLI listener tunnel to forward events to your active endpoint route parameters:
  ```bash
  stripe listen --forward-to localhost:3000/api/v1/bookings/webhook-checkout
  ```

---

🌐 Live Demo

👉 [![Live Demo](https://img.shields.io/badge/Demo-Render-blue)]()

---

📖 API Documentation

👉 [![API Docs](https://img.shields.io/badge/API-Postman-orange)]()

---

## 📜 License

This enterprise ecosystem is open-source software licensed under the **MIT License**.
