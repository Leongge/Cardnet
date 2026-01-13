# Project Specification: Cardnet CRM (Web & Mobile)

## 1. Project Overview
**Cardnet CRM** is a hybrid Web and Mobile application designed for efficient business card management and client relationship fostering. It leverages AI for bulk business card digitization, supports corporate hierarchy with shared resources, and ensures data privacy compliance with Malaysian laws (PDPA).

## 2. Tech Stack
* **Frontend (Web):** React.js, Tailwind CSS (UI), Redux Toolkit (State Management).
* **Frontend (Mobile):** React Native (iOS/Android).
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB (Mongoose ODM).
* **AI/OCR:** OpenAI GPT-4o (Vision Capability) or Google Cloud Vision API + OpenAI GPT-4 (Text Analysis).
* **Authentication:** JWT, WebAuthn (Biometric for Web), Native Biometrics (Mobile).
* **Email Service:** AWS SES or SendGrid (Bulk mailing).
* **Storage:** AWS S3 (Images/Assets).

---

## 3. User Roles & Permissions

### 3.1. Super Admin (Platform Owner)
* **Capabilities:**
    * Create `CorporateAdmin` accounts.
    * Manage Subscription/Licenses (e.g., Set "Max Member Limit" for a corporation).
    * System-wide analytics.

### 3.2. Corporate Admin
* **Logic:** If a company buys 5 seats, 1 is taken by the Admin, 4 slots remain for members.
* **Capabilities:**
    * Manage Company Profile.
    * **User Management:** Create/Invite `CorporateMembers` up to the purchased quota.
    * **Privileges:** Inherits all functionalities of a Corporate Member.
    * **Data Oversight:** View shared corporate client pool.

### 3.3. Corporate Member
* **Capabilities:**
    * Scan/Upload Business Cards.
    * Manage Personal Client Table (Private).
    * Access/Contribute to Corporate Client Table (Shared).
    * Create and share personal vCard.

---

## 4. Key Feature Specifications

### 4.1. AI Business Card Scanner (The Core)
* **Trigger:** "Scan/Upload" button on Dashboard.
* **Input:** Camera capture or File Upload (supports multiple cards in one photo).
* **Process:**
    1.  Image uploaded to S3.
    2.  Backend sends image to **OpenAI GPT-4o (Vision)** with a prompt to:
        * Detect distinct business cards.
        * Extract fields: `Name`, `Position`, `Email`, `Phone`, `Company`, `Address`, `Category`.
        * Return JSON array.
* **Output (UI):**
    * If 3 cards are detected, 3 separate forms appear dynamically.
    * Forms are pre-filled with extracted data.
    * **Status:** "Draft/Review".
    * User can manually edit fields before saving.
    * **Action:** "Save to Personal" OR "Save & Share to Corporate".

### 4.2. Client Management Tables
* **Views:**
    1.  **My Clients:** Visible only to the user.
    2.  **Corporate Pool:** Visible to all members of the same `CorporateID`.
* **Functionality:**
    * **Search:** Elastic search on Name, Company, Category.
    * **Bulk Actions:** Checkbox selection for `Select All` or specific rows.
    * **Operations:** Update, Delete, Export.
    * **Manual Entry:** "Add Client" button for non-scanning entry.

### 4.3. Email Campaign Module
* **Workflow:**
    1.  User filters clients (e.g., Category = "Tech").
    2.  Selects target clients via checkboxes.
    3.  Clicks "Send Email".
    4.  **Composer:** Subject, Body (supports templates).
    5.  **Sending:** Queued via Node.js background job (BullMQ) to prevent timeout.

### 4.4. vCard & "Cardnet" Integration
* **vCard Page:** Public-facing URL (e.g., `cardnet.com/u/john-doe`).
* **Features:**
    * Display user info & photo.
    * **"Add to your Cardnet" Button:**
        * **Scenario A (Logged In):** Auto-adds profile to viewer's Client Table via API.
        * **Scenario B (Logged Out):** Redirects to Login/Register.
* **Authentication Flow:**
    * Email/Password.
    * **Biometric:**
        * Mobile: TouchID/FaceID.
        * Web: WebAuthn (TouchID on MacBook/Windows Hello).

### 4.5. Data Privacy & PDPA Compliance (Malaysia)
* **Consent:**
    * "I agree to the processing of personal data..." checkbox upon login/upload.
* **Privacy Policy:** Dedicated page referenced in the footer and signup flow.
* **Data Sovereignty:** Ensure database server region is appropriate (e.g., AWS Singapore).
* **Right to Delete:** Users must have a clear option to permanently delete client data.

---

## 5. Database Schema (MongoDB Design)

### 5.1. Users Collection
```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String",
  "password_hash": "String",
  "role": "Enum ['Admin', 'CorporateAdmin', 'CorporateMember']",
  "corporate_id": "ObjectId (Ref: Corporations)",
  "biometric_key": "String (WebAuthn Credential)",
  "vcard_slug": "String (Unique)"
}
```
### 5.2. Corporations Collection
```json
{
  "_id": "ObjectId",
  "name": "String",
  "subscription_tier": "String",
  "max_licenses": "Number",
  "created_at": "Date"
}
```

### 5.3. Clients Collection
```json
{
  "_id": "ObjectId",
  "owner_id": "ObjectId (Ref: Users)",
  "corporate_id": "ObjectId (Ref: Corporations)",
  "visibility": "Enum ['Private', 'Shared']",
  "data": {
    "name": "String",
    "position": "String",
    "email": "String",
    "phone": "String",
    "company_name": "String",
    "company_address": "String",
    "category": "String (e.g., Tech, Finance)"
  },
  "source": "Enum ['Scan', 'Manual', 'vCard']",
  "pdpa_consent": "Boolean",
  "created_at": "Date"
}
```

## 6. API Endpoints (High Level)
* POST /api/auth/login (Supports password & biometric challenge)

* POST /api/scan/upload (Handles image -> AI processing -> Returns JSON)

* POST /api/clients/confirm (Saves reviewed card data to DB)

* GET /api/clients?scope=private|corporate&search=...

* POST /api/campaign/send (Bulk email trigger)

* POST /api/vcard/add-to-network (Add a vCard user to current user's list)

## 7. Next Steps for Development
1. Initialize Repo: Setup Monorepo (Web/Mobile/Server).

2. Prototype AI: Test GPT-4o prompts with sample multi-card images to ensure accuracy.

3. Auth Implementation: Build the login flow including Biometric integration first.

4. MVP UI: Build the Dashboard and Camera capture flow.