# 👑 Yellow Reign Academy — Digital Magazine Submission & Publishing Platform

A complete, professional, full-stack digital magazine submission and publishing web portal built with a luxury **Yellow, Black & White** theme.

Curated and managed exclusively by **Super Admin Sayhan**.

---

## 🌟 Executive Summary & Key Highlights

- **Platform Nature**: Submission & Curation Platform (**NOT** automatic publishing). Anyone can register and submit magazines, but **ONLY Sayhan** (Super Admin) can approve and publish content into the public library.
- **Admin Details**:
  - **Super Admin Name**: `Sayhan`
  - **Phone**: `9544498843`
  - **Admin Notification Email**: `yellowreignacademy@gmail.com`
- **Real Email Notifications Engine**: Dispatches automated email alerts directly to `yellowreignacademy@gmail.com` for:
  1. Every new user registration (Name, Email, Phone, Registration Date/Time).
  2. Every magazine submission (Submitter Name, Email, Phone, Title, Category, Page Count, Timestamp, and direct link to review in Admin Dashboard).
- **Private Author Vaults**: Each user's uploads are strictly isolated in their own private directory (`uploads/users/:userId/submissions/:submissionId/`). Submissions remain strictly **confidential and inaccessible** to public visitors until Super Admin Sayhan approves and publishes them.
- **Sovereign Magazine Reader**:
  - Dual-page / 3D Flipbook view with realistic page curling and sound-ready perspective.
  - Single Slide & Continuous Scroll views.
  - Page-by-page viewing, page number indicators ("Page 3 of 12"), thumbnail drawer scrubber.
  - Zoom in / Zoom out / Zoom reset.
  - Fullscreen toggle.
  - Mobile swipe and responsive layout.
- **Cryptographic QR Codes & Permanent Links**:
  - Automatically generated unique QR code (PNG & SVG) and permanent public link (`/read/:slug`) upon publication.
  - One-click QR code download, permanent link copying, and direct WhatsApp sharing.
  - Anyone scanning the QR code or clicking the link immediately reads the published magazine **without login**.
- **Sayhan Super Admin Control Deck**:
  - Real-time statistics: Total users, submissions, pending review queue, published magazines, global reads.
  - Submissions Manager: Filter by status, high-resolution multi-page inspector, submitter contact info, one-click Publish, Approve, Reject with editorial feedback, Edit, and Delete.
  - Author Directory: Complete roster of registered users with phone and email quick-contact.
  - Official Upload Deck: Direct upload tool for Sayhan to publish official Academy issues.
  - Category Manager: Create and manage publication categories.
  - Email Dispatch Center: Full audit trail of dispatched notifications and single-click SMTP diagnostic test.

---

## 🚀 How to Run Locally

### 1. Prerequisites
- **Node.js** v18+ or v20+ / v22+ / v24+
- **npm** (comes with Node.js)

### 2. Configure Environment (`.env`)
The project includes a ready-to-use `.env` file pre-configured for local testing:

```env
PORT=5000
APP_URL=http://localhost:5000
JWT_SECRET=yellow_reign_academy_super_secret_jwt_key_2026

# Admin Profile
ADMIN_NAME=Sayhan
ADMIN_PHONE=9544498843
ADMIN_NOTIFICATION_EMAIL=yellowreignacademy@gmail.com

# SMTP Email Configuration (Nodemailer)
# (Optional: Provide your live SMTP credentials to transmit real emails over the network)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
SMTP_FROM="Yellow Reign Academy" <yellowreignacademy@gmail.com>
```

> **Note on Email Delivery:** If you leave `SMTP_USER` and `SMTP_PASS` empty, the system automatically logs every formatted notification with full HTML payloads into the SQLite `email_logs` table and displays them in Sayhan's **Admin Email Dispatch Center**. When you add real SMTP credentials (e.g. Gmail App Password or Brevo), real emails are immediately transmitted over SMTP.

### 3. Start the Server

```bash
node server/index.js
```

Or run via npm:

```bash
npm start
```

Open your browser to:
**`http://localhost:5000`**

---

## 🔑 Login Credentials

### Super Admin (Sayhan)
- **Email**: `yellowreignacademy@gmail.com`
- **Phone**: `9544498843`
- **Password**: `Sayhan@2026`
- *(Tip: Click the "Quick Fill: Super Admin Sayhan" button on the Sign In modal)*

### Author Accounts (Anyone)
- Click **Register** on the top right.
- Provide Full Name, Email, Phone number, and Password.
- Log in to access your personal dashboard, private content folder, and submission tools.

---

## 🧪 Automated End-to-End Verification

To execute the 30-step end-to-end test suite:

```bash
node tests/e2e.test.js
```

The test validates:
- [x] Super Admin initialization & credentials verification
- [x] New user registration & automated email notification logging to `yellowreignacademy@gmail.com`
- [x] Role-based access control (regular users receive 403 on admin routes)
- [x] Multi-format magazine page submission & private directory isolation
- [x] Confidentiality verification (unapproved content returns 403 to public visitors)
- [x] Super Admin Sayhan review & approval workflow
- [x] Publication by Sayhan with automatic cryptographic QR code generation
- [x] Public library reading without authentication
- [x] Atomically tracked view counter

