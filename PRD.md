# 📄 PRD: Env File Manager

### 1. **Objective**

A developer tool that makes working with `.env` files easier. It should help **switch, validate, manage, and secure environment variables** across multiple environments (local, staging, production, testing, etc.).

The goal: **reduce human error and streamline multi-env workflows**.

---

### 2. **Core Features**

✅ **Env Switching**

* Store multiple `.env` sets (e.g., `.env.local`, `.env.staging`, `.env.prod`).
* One command or click swaps which `.env` is active.

✅ **Validation**

* Compare `.env` files against a `.env.example` or schema.
* Show missing keys, extra keys, and type mismatches.

✅ **Encryption (Optional)**

* Allow users to encrypt sensitive `.env` values with a password/key.
* Decrypt on load.

✅ **Backup & Restore**

* Keep timestamped backups of `.env` files.
* One-click rollback.

✅ **Format Conversion**

* Convert between `.env` and JSON/YAML (for Docker, Kubernetes, CI/CD).

---

### 3. **Nice-to-Haves**

* **Git Ignore Guard** → warn if `.env` is accidentally tracked in Git.
* **Profiles** → group envs by project (useful if dev works across many repos).
* **Lightweight UI** (optional PWA/Electron app).

---

### 4. **Usage Scenarios**

* A dev runs `envm switch staging` → activates `.env.staging`.
* A CI pipeline uses `envm validate` → ensures `.env` matches `.env.example`.
* A developer exports `.env` as JSON for Kubernetes → `envm export --format=json`.
* A dev encrypts `.env.prod` before pushing to repo → `envm encrypt prod`.

---

### 5. **Tech Stack**

* **CLI**: Node.js (fast dev, easy adoption).
* **File Parsing**: `dotenv` npm package (battle-tested).
* **Encryption**: Native `crypto` module (AES-256).
* **Optional GUI**: PWA (React + Vite) or minimal Electron app.
* **Storage**: Local filesystem only, no backend.

---

### 6. **Command Examples**

```bash
# Switch environments
envm switch local

# Validate .env against example
envm validate

# Encrypt / decrypt env files
envm encrypt prod
envm decrypt prod

# Export to JSON/YAML
envm export prod --format=json

# Backup & restore
envm backup
envm restore <timestamp>
```

---

### 7. **MVP Roadmap**

**Phase 1 (CLI First)**

* Switcher
* Validator
* Exporter

**Phase 2**

* Encryption
* Backup system
* Profiles

**Phase 3**

* GUI (optional, offline-first)
* Git ignore guard
* Advanced schema validation (with JSON Schema)

---

This tool will **spread fast** if you make it installable via:

```bash
npm install -g envm
```
