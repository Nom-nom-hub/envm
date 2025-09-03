# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-09-XX - "Advanced Environment Management"

### Added
- **Initial release** - Complete envm CLI tool
- **AES-256-GCM encryption** - Military-grade encryption with PBKDF2 key derivation
- **Variable-specific encryption** - Encrypt individual sensitive variables only
- **Password-based key derivation** - Secure password handling with salt
- **Git ignore guard** - Security warnings for tracked environment files
- **Git ignore management** - Automatic .gitignore creation and pattern management
- **Advanced profiles system** - Group and manage environment configurations
- **Multi-environment file management** - Switch between .env.local, .env.staging, .env.prod
- **Environment validation** - Schema-based validation with type checking
- **Automatic backup system** - Timestamped backups before dangerous operations
- **Export functionality** - Convert .env files to JSON/YAML formats
- **Docker, Kubernetes, CI/CD support** - Export formats for various platforms
- **Comprehensive error handling** - Secure handling of all error scenarios
- **Professional CLI interface** - Full command-line interface with rich options

### Features
- **Environment switching** (`envm switch <config>`)
- **Validation** (`envm validate`) - against .env.example schema
- **Encryption** (`envm encrypt<input>`) - AES-256-GCM with password protection
- **Decryption** (`envm decrypt <file>`) - Secure file decryption
- **Backup** (`envm backup [name]`) - Automatic and manual backups
- **Restore** (`envm restore <backup>`) - One-click rollback
- **Export** (`envm export`) - JSON/YAML format conversion
- **Git ignore guard** (`envm gitignore <action>`) - Security monitoring
- **Profile management** (`envm profile <action> [name]`) - Environment grouping

### Distribution
- **NPM package** - Global installation via `npm install -g envm`
- **Homebrew formula** - macOS/Linux installation via `brew install envm`
- **Linux installer** - Automated installation script
- **Docker support** - Containerized deployment
- **Professional documentation** - Comprehensive README and guides

### Security
- **AES-256-GCM encryption** - Industry-standard encryption
- **PBKDF2 key derivation** - Secure password stretching
- **Git ignore protection** - Automatic credential leak prevention
- **Backup before operations** - Safe file operations with recovery
- **Authentication tags** - Data integrity verification

### Documentation
- **Professional README** - Developer-focused documentation
- **Command examples** - Usage examples for all features
- **Installation guides** - Multiple installation methods
- **Security best practices** - Password management guidelines
- **Distribution guide** - Publisher's documentation

### Technical
- **Node.js 18+ support** - Modern JavaScript runtime
- **Cross-platform** - Windows, macOS, Linux support
- **Zero dependencies** for core features (except CLI framework)
- **Backward compatibility** - Maintains existing patterns
- **Extensible architecture** - Ready for future enhancements

---

**Release Notes:**
This is the first major release of envm, providing developers with a comprehensive solution for environment file management. The tool combines security, ease of use, and professional-grade features that exceed typical environment file requirements.

`npm install -g envm` and start using immediately with `envm --help`

---

## Types of changes
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities

## Versioning Strategy
This project adheres to [Semantic Versioning](https://semver.org/):
- **MAJOR.MINOR.PATCH**
- **Breaking changes** increment MAJOR (X.y.z)
- **New features** increment MINOR (x.Y.z)
- **Bug fixes** increment PATCH (x.y.Z)