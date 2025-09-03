# Env File Manager (envm)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![npm version](https://img.shields.io/badge/npm-1.0.0-blue.svg)](https://www.npmjs.com/package/envm)
[![GitHub stars](https://img.shields.io/github/stars/nom-nom-hub/envm?style=social)](https://github.com/nom-nom-hub/envm/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/nom-nom-hub/envm)](https://github.com/nom-nom-hub/envm/issues)
[![GitHub PRs](https://img.shields.io/github/issues-pr/nom-nom-hub/envm)](https://github.com/nom-nom-hub/envm/pulls)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/nom-nom-hub/envm/actions)
[![Code Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen.svg)](https://github.com/nom-nom-hub/envm)
[![Dependencies](https://img.shields.io/badge/dependencies-6-blue.svg)](https://github.com/nom-nom-hub/envm/network/dependencies)
[![Size](https://img.shields.io/badge/size-~1.2MB-blue.svg)](https://packagephobia.com/result?p=envm)

[![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/nom-nom-hub/envm)
[![Installation](https://img.shields.io/badge/installation-easy-brightgreen.svg)](https://github.com/nom-nom-hub/envm#installation)
[![Security](https://img.shields.io/badge/security-AES--256-red.svg)](https://github.com/nom-nom-hub/envm#security-features)

[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/nom-nom-hub/envm)](https://github.com/nom-nom-hub/envm/commits/main)
[![GitHub last commit](https://img.shields.io/github/last-commit/nom-nom-hub/envm)](https://github.com/nom-nom-hub/envm)
[![GitHub contributors](https://img.shields.io/github/contributors/nom-nom-hub/envm)](https://github.com/nom-nom-hub/envm/graphs/contributors)

[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Crypto](https://img.shields.io/badge/security-AES--256--GCM-blue.svg)](https://nodejs.org/api/crypto.html)
[![CLI](https://img.shields.io/badge/cli-Commander--JS-green.svg)](https://github.com/tj/commander.js)
[![Environment](https://img.shields.io/badge/environment-management-advanced-blue.svg)](https://github.com/nom-nom-hub/envm)

A comprehensive CLI tool for managing environment files (`.env`) with advanced features including encryption, backup management, validation, and multi-environment configuration handling.

<div align="center">

## 🚀 **Key Highlights**

💎 **Military-Grade Security** | 🔐 **AES-256-GCM Encryption** | ⚡ **Lightning Fast** | 🛡️ **Git Protection** | 📦 **Multi-Platform**

[![Security Status](https://img.shields.io/badge/security-production--ready-red)](https://github.com/nom-nom-hub/envm)
[![Performance](https://img.shields.io/badge/performance-optimized-green.svg)](https://github.com/nom-nom-hub/envm)
[![Cross Platform](https://img.shields.io/badge/cross--platform-Windows%20•%20macOS%20•%20Linux-blueviolet.svg)](https://github.com/nom-nom-hub/envm)

</div>

---

## ✨ Features

- **Military-grade encryption** - AES-256-GCM with PBKDF2 key derivation
- **Automatic backups** - Safe file operations with recovery options
- **Environment validation** - Schema-based validation with type checking
- **Multi-environment management** - Switch between different environments easily
- **Export functionality** - Convert to JSON/YAML formats
- **Variable-specific encryption** - Encrypt individual sensitive variables
- **Git ignore guard** - Security warnings for tracked environment files
- **Advanced profiles** - Group and manage environment configurations
- **Security-first design** - Password protection and data integrity
- **Comprehensive CLI** - Full command-line interface with rich options

## ⚡ Quick Start

<div align="center">

### 🎯 **Get Started in 60 Seconds**

```bash
# 1. Install globally
npm install -g envm

# 2. Create your environment file
echo "NODE_ENV=development" > .env
echo "API_KEY=your-secret-key" >> .env

# 3. Validate & secure immediately
envm validate
envm gitignore init
envm encrypt .env --key yourpassword

# 4. Switch environments
envm switch production
```

[![Demo](https://img.shields.io/badge/demo-interactive-brightgreen.svg)](https://github.com/nom-nom-hub/envm)

</div>

### 📋 Prerequisites
- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Git** (recommended for version control)

### Installation

#### Option 1: NPM (Recommended)
```bash
# Install globally
npm install -g @nom-nom-hub/envm

# Verify installation
envm --version
envm --help
```

#### Option 2: Homebrew (macOS/Linux)
```bash
# Add our tap (when published)
brew tap envm/tap
brew install envm

# Or install directly from formula
brew install nom-nom-hub/envm/envm
```

#### Option 3: Linux Installation Script
```bash
# Download and run the installer
curl -fsSL https://raw.githubusercontent.com/nom-nom-hub/envm/main/install.sh | bash

# Or download manually and run
wget https://raw.githubusercontent.com/nom-nom-hub/envm/main/install.sh
chmod +x install.sh
./install.sh
```

#### Option 4: Manual Installation
```bash
# Clone the repository
git clone https://github.com/nom-nom-hub/envm.git
cd envm

# Install dependencies
npm install

# Link globally (preferred)
npm link

# Or use directly
npx envm --help

# Alternative global installation
npm install -g .
```

#### Option 5: Docker
```bash
# Run in Docker container
docker run --rm -v $(pwd):/app envm/envm --help

# Or build locally
docker build -t envm .
docker run --rm -v $(pwd):/app envm
```

### Basic Usage
```bash
cd your-project/

# Create a new .env file
echo "NODE_ENV=development" > .env
echo "API_KEY=your-api-key" >> .env
echo "DB_PASSWORD=your-password" >> .env

# Validate configuration
envm validate

# Create backup
envm backup my-app-config

# Encrypt sensitive variables
envm encrypt .env --variable=API_KEY
envm encrypt .env --variable=DB_PASSWORD

# Switch to production
envm switch production
```

## Commands

### Core Commands

#### `envm validate [options]`
Validates environment configuration against a schema file.

```bash
# Validate using .env.example as schema
envm validate

# Specify custom schema and environment files
envm validate --schema config.schema --env .env.staging

# Show detailed validation report
envm validate --verbose

# Fail on any discrepancy
envm validate --strict
```

**Options:**
- `-s, --schema <file>` - Schema file (default: .env.example)
- `-e, --env <file>` - Environment file (default: .env)
- `-p, --path <dir>` - Working directory
- `-v, --verbose` - Detailed report
- `--strict` - Fail on any issues
- `--no-exit` - Don't exit on validation failure

#### `envm switch <config> [options]`
Switch between different environment configurations.

```bash
# Switch to production configuration
envm switch production

# Force switch (overwrite without confirmation)
envm switch staging --force

# Create backup before switching
envm switch development --backup
```

**Options:**
- `-f, --force` - Force overwrite
- `-p, --path <dir>` - Working directory
- `-b, --backup` - Create backup before switching

#### `envm export [options]`
Export environment variables to JSON or YAML format.

```bash
# Export to JSON
envm export --format json --output config.json

# Export to YAML
envm export --format yaml --output config.yaml

# Export to stdout
envm export --format json

# Specify input file
envm export --env .env.production --format yaml
```

**Options:**
- `-f, --format <format>` - Output format (json, yaml)
- `-e, --env <file>` - Input environment file
- `-o, --output-file <file>` - Output file path
- `-p, --path <dir>` - Working directory

### Backup Commands

#### `envm backup [name] [options]`
Create backup of environment files.

```bash
# Create auto-named backup
envm backup

# Create named backup
envm backup pre-deploy-2025

# Create compressed backup
envm backup nightly --compress

# List all backups
envm backup --list

# Git ignore guard (security for environment files)
envm gitignore check
envm gitignore init
envm gitignore add

# Advanced profiles (environment grouping)
envm profile list
envm profile create <name>
envm profile delete <name>
```

**Options:**
- `-p, --path <dir>` - Working directory
- `-c, --compress` - Compress backup
- `-l, --list` - List available backups

#### `envm restore <backup> [options]`
Restore environment files from backup.

```bash
# Restore from named backup
envm restore my-backup

# Restore from timestamp
envm restore 2025-09-01_14-30-00

# Force restore (overwrite existing files)
envm restore my-backup --force

# Create backup of current state before restore
envm restore my-backup --backup-current

# Verify backup before restore
envm restore my-backup --verify
```

**Options:**
- `-p, --path <dir>` - Working directory
- `-f, --force` - Force overwrite
- `-v, --verify` - Verify backup integrity
- `-b, --backup-current` - Backup current state

#### `envm gitignore <action> [options]`
Check and manage .env files in Git ignore for security.

```bash
# Check current .gitignore status and warnings
envm gitignore check

# Create new .gitignore with env patterns
envm gitignore init

# Add env patterns to existing .gitignore
envm gitignore add

# Remove tracked .env files from Git (CAUTION!)
envm gitignore clean --force
```

**Actions:**
- `check`, `status` - Analyze Git ignore status and security
- `init` - Create new .gitignore with env patterns
- `add` - Add env patterns to existing .gitignore
- `clean` - Remove tracked files from Git (use --force)

#### `envm profile <action> [name] [options]`
Manage advanced environment profiles (groups of env files).

```bash
# List all profiles
envm profile list

# Create a new profile
envm profile create development --description "Development env"

# Delete a profile
envm profile delete development --force
```

**Actions:**
- `list`, `ls` - List all profiles
- `create`, `new` - Create new profile
- `delete`, `remove` - Delete a profile

### Encryption Commands

#### `envm encrypt <env> [options]`
Encrypt environment files using AES-256-GCM encryption.

```bash
# Encrypt entire file
envm encrypt .env --key mypassword123

# Encrypt specific variable
envm encrypt .env --variable API_KEY --key mypassword123

# Use environment variable for password
export ENVM_ENCRYPTION_KEY=mypassword123
envm encrypt .env --variable DB_PASSWORD

# Skip automatic backup
envm encrypt .env --key mypassword123 --no-backup

# Specify output file
envm encrypt .env --key mypassword123 --output .env.production.enc

# Force overwrite existing file
envm encrypt .env --key mypassword123 --force
```

**Options:**
- `-k, --key <password>` - Encryption password
- `-v, --variable <name>` - Encrypt specific variable only
- `-o, --output <file>` - Output file path
- `-p, --path <dir>` - Working directory
- `-f, --force` - Force overwrite
- `--no-backup` - Skip automatic backup

#### `envm decrypt <env> [options]`
Decrypt environment files that were encrypted with AES-256.

```bash
# Decrypt entire file
envm decrypt .env.encrypted --key mypassword123

# Decrypt specific variable only
envm decrypt .env.encrypted --variable API_KEY --key mypassword123

# Use environment variable for password
export ENVM_ENCRYPTION_KEY=mypassword123
envm decrypt .env.encrypted

# Specify output file
envm decrypt .env.encrypted --key mypassword123 --output .env.decrypted

# Force overwrite existing file
envm decrypt .env.encrypted --key mypassword123 --force

# Create backup before decryption
envm decrypt .env.encrypted --key mypassword123 --backup-current
```

**Options:**
- `-k, --key <password>` - Decryption password
- `-v, --variable <name>` - Decrypt specific variable only
- `-o, --output <file>` - Output file path
- `-p, --path <dir>` - Working directory
- `-f, --force` - Force overwrite
- `-b, --backup-current` - Backup current state

## 🔒 Security Features

### Encryption Security
- **AES-256-GCM** encryption algorithm
- **PBKDF2** key derivation with random salt
- **Unique IV** per encryption operation
- **Authentication tags** for integrity verification
- **Metadata storage** with encryption parameters

### Password Management
```bash
# Use environment variable (recommended)
export ENVM_ENCRYPTION_KEY=your-strong-password
envm encrypt .env

# Use command line (less secure)
envm encrypt .env --key "YourSecurePassword123!"

# Best practices:
# - Use 20+ character passwords
# - Include letters, numbers, and symbols
# - Never store passwords in scripts
# - Use environment variables in CI/CD
```

### Encrypted File Format
Encrypted files contain:
- Encryption metadata (version, algorithm, timestamp)
- Salt for key derivation
- Initialization vector (IV)
- Authentication tag
- Encrypted data

File extension: `.encrypted`

## 🛠️ Configuration

### Environment Variables
```bash
# Set default working directory
export ENVM_PATH=/path/to/project

# Set encryption password globally
export ENVM_ENCRYPTION_KEY=your-password

# Set backup compression by default
export ENVM_COMPRESS_BACKUPS=true
```

### Custom Schema Files
Create `.env.example` for validation schema:
```bash
# .env.example
NODE_ENV=development
API_URL=http://localhost:3000
DATABASE_URL=postgresql://localhost:5432/myapp
SECRET_KEY=your_secret_key_here
```

### Project Configuration
```json
// In your project's package.json, add:
{
  "scripts": {
    "env:validate": "envm validate",
    "env:backup": "envm backup",
    "env:encrypt": "envm encrypt .env --variable SECRET_KEY",
    "env:switch:prod": "envm switch production"
  }
}
```

## 📁 Project Structure

```
envm/
├── bin/
│   └── envm              # CLI executable
├── src/
│   └── index.js          # Main CLI code
├── .envm/
│   └── backups/          # Backup storage
├── package.json
├── README.md
└── ...

Example usage:
your-project/
├── .env                  # Current environment
├── .env.production       # Production config
├── .env.staging          # Staging config
├── .env.example          # Schema/validation
└── .envm/
    └── backups/          # Automatic backups
```

## 🔧 Development

### Setup for Development
```bash
git clone https://github.com/nom-nom-hub/envm.git
cd envm
npm install
npm link

# Run tests
npm test

# Run in development
npm run dev
```

### Building from Source
```bash
# Install dependencies
npm install

# Create executable
chmod +x bin/envm

# Test locally
./bin/envm --version
```

### Adding New Commands
1. Add command in `src/index.js`
2. Implement handler function
3. Update this README
4. Add tests

## 🐛 Troubleshooting

### Common Issues

**"Command not found"**
```bash
# Install globally
npm install -g envm

# Or link locally
cd envm-project
npm link
```

**"Invalid encrypted file format"**
- Ensure file has `.encrypted` extension
- Check password is correct
- Verify file wasn't corrupted

**"Directory not found"**
```bash
# Specify working directory
envm encrypt .env --path /path/to/project
```

**"Validation failed"**
- Check `.env.example` schema file exists
- Compare types and required variables
- Use `--verbose` for detailed report

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

### Development Guidelines
- Use ESLint configuration
- Add tests for new features
- Update documentation
- Follow Node.js best practices
- Use semantic commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Commander.js](https://github.com/tj/commander.js)
- Encryption powered by Node.js [crypto module](https://nodejs.org/api/crypto.html)
- Environment parsing with [dotenv](https://github.com/motdotla/dotenv)

---

<div align="center">

## 🌟 **Community & Support**

[![GitHub](https://img.shields.io/badge/GitHub-Follow%20%40nom--nom--hub-blue?logo=github)](https://github.com/nom-nom-hub)
[![Issues](https://img.shields.io/badge/Issues-Welcome-red.svg)](https://github.com/nom-nom-hub/envm/issues)
[![Discussions](https://img.shields.io/badge/Discussions-Join-green.svg)](https://github.com/nom-nom-hub/envm/discussions)
[![Contributing](https://img.shields.io/badge/Contributing-Help--Welcome-purple.svg)](https://github.com/nom-nom-hub/envm/blob/main/CONTRIBUTING.md)

## 📞 **Need Help?**
- 📋 **Documentation**: [Read the Docs](https://github.com/nom-nom-hub/envm#readme)
- 🐛 **Bug Reports**: [Create an Issue](https://github.com/nom-nom-hub/envm/issues)
- 💡 **Feature Requests**: [Start a Discussion](https://github.com/nom-nom-hub/envm/discussions)
- 💬 **Community Chat**: [Join Discussions](https://github.com/nom-nom-hub/envm/discussions)

---

[![Made with ❤️ for developer productivity and security](https://img.shields.io/badge/Made%20with-%E2%9D%A4%EF%B8%8F-red.svg)](https://github.com/nom-nom-hub)
[![Built with Node.js](https://img.shields.io/badge/Built%20with-Node.js-green.svg)](https://nodejs.org/)
[![Powered by AES-256](https://img.shields.io/badge/Powered%20by-AES--256-blue.svg)](https://github.com/nom-nom-hub/envm#security-features)

</div>