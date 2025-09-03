# Distribution Guide - Env File Manager (envm)

This document provides comprehensive guidance for publishing, distributing, and maintaining the envm CLI tool.

## 📦 NPM Publishing

### Pre-Publish Checklist
- [ ] Update `package.json` version
- [ ] Ensure `main` and `bin` paths are correct
- [ ] Update changelog (`CHANGELOG.md`)
- [ ] Run tests
- [ ] Verify documentation is current
- [ ] Check repository URLs are accurate

### Publishing Steps
```bash
# Dry run first
npm publish --dry-run

# Publish to npm registry
npm publish

# Or publish with specific tag
npm publish --tag beta

# Verify on npm
npm view envm
```

### Post-Publish Tasks
- Create GitHub release with changelog
- Update website/documentation if applicable
- Announce release on social media/forums
- Update homebrew formula with new SHA256

## 🔄 Homebrew Support

### Formula Structure
```ruby
class Envm < Formula
  desc "Advanced Env file Manager CLI tool"
  homepage "https://github.com/nom-nom-hub/envm"
  url "https://registry.npmjs.org/envm/-/envm-1.0.1.tgz"
  sha256 "0000000000000000000000000000000000000000000000000000000000000000"

  bottle :unneeded

  depends_on "node"

  def install
    system "npm", "install", "-g", "--bin-links", "--prefix", libexec
    bin.install_symlink libexec/"bin/envm"
  end

  test do
    system "#{bin}/envm", "--help"
  end
end
```

### Publishing to Homebrew
```bash
# Test locally
brew install --build-from-source Formula/envm.rb

# Submit to homebrew-core (if widely used)
brew create https://registry.npmjs.org/envm/-/envm-1.0.0.tgz
brew audit --new-formula Formula/envm.rb
brew install --build-from-source Formula/envm.rb
```

### Manual Install for Users
```bash
# Direct installation from npm
brew install npm
npm install -g envm
```

## 🐧 Linux Distribution

### Package Managers

#### Ubuntu/Debian (.deb)
```bash
# Create .deb package structure
mkdir -p envm_1.0.0-1_amd64/DEBIAN
mkdir -p envm_1.0.0-1_amd64/usr/bin
mkdir -p envm_1.0.0-1_amd64/usr/lib/envm

# Download and extract npm package
npm pack envm
tar -xzf envm-1.0.0.tgz -C envm_1.0.0-1_amd64/usr/lib/envm --strip-components=1

# Create control file
cat > envm_1.0.0-1_amd64/DEBIAN/control << EOF
Package: envm
Version: 1.0.0-1
Section: utils
Priority: optional
Architecture: amd64
Depends: nodejs (>= 18.0.0), npm
Maintainer: Env File Manager Team <hello@envm.tools>
Description: Advanced Env file Manager CLI tool
 Advanced CLI tool for managing environment files with encryption,
 backups, validation, and multi-environment support.
EOF

# Create post-install script
cat > envm_1.0.0-1_amd64/DEBIAN/postinst << EOF
#!/bin/bash
ln -sf /usr/lib/envm/bin/envm /usr/local/bin/envm
chmod +x /usr/lib/envm/bin/envm
EOF

# Build and install
dpkg-deb --build envm_1.0.0-1_amd64
sudo dpkg -i envm_1.0.0-1_amd64.deb
```

#### Red Hat/Fedora (.rpm)
```bash
# Create RPM spec file
cat > envm.spec << EOF
Name:           envm
Version:        1.0.0
Release:        1%{?dist}
Summary:        Advanced Env file Manager CLI tool
License:        MIT
URL:            https://github.com/nom-nom-hub/envm
Source0:        https://registry.npmjs.org/envm/-/envm-1.0.0.tgz

Requires:       nodejs >= 18.0.0
Requires:       npm

%description
Advanced CLI tool for managing environment files with encryption,
backups, validation, and multi-environment support.

%prep
%autosetup -n package

%build
npm install --production

%install
mkdir -p %{buildroot}%{_prefix}/lib/envm
mkdir -p %{buildroot}%{_bindir}
cp -r * %{buildroot}%{_prefix}/lib/envm/
ln -sf %{_prefix}/lib/envm/bin/envm %{buildroot}%{_bindir}/envm

%files
%{_prefix}/lib/envm/
%{_bindir}/envm

%changelog
* Date - Your Name <your@email.com> - 1.0.0-1
- Initial package
EOF

# Build RPM
rpmbuild -bb envm.spec
```

## 🐳 Docker Distribution

### Dockerfile
```dockerfile
FROM node:18-alpine
LABEL maintainer="Env File Manager Team <hello@envm.tools>"

# Install envm globally
RUN npm install -g envm

# Create app directory
WORKDIR /app

# Default entrypoint
ENTRYPOINT ["envm"]
CMD ["--help"]
```

### Building and Publishing
```bash
# Build Docker image
docker build -t envm/envm:1.0.0 -t envm/envm:latest .

# Test locally
docker run --rm envm/envm --help

# Publish to Docker Hub
docker login
docker push envm/envm:1.0.0
docker push envm/envm:latest

# Publish to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u username --password-stdin
docker tag envm/envm:latest ghcr.io/nom-nom-hub/envm:latest
docker push ghcr.io/nom-nom-hub/envm:latest
```

## 📄 Documentation Updates

### README Maintenance
- Update installation instructions
- Keep command examples current
- Update version badges
- Verify all links are working
- Update screenshots/videos if applicable

### API Documentation
- Generate JSDoc documentation
- Update usage examples
- Maintain changelog (`CHANGELOG.md`)

## 🔗 Sharing and Promotion

### Platform Promotion
```bash
# Share on social platforms
echo "🚀 Just released envm v1.0.0 - Advanced environment file manager with encryption!"
echo "Features: AES-256 encryption, Git ignore guard, multi-env management"
echo "#DevTools #CLI #JavaScript #NodeJS"
echo "https://npmjs.com/package/envm"
```

### Developer Communities
- Reddit (r/javascript, r/node, r/programming)
- Hacker News (Show HN)
- Dev.to articles
- Medium publications
- GitHub trending topics
- Stack Overflow
- Discord/Slack dev community channels

### Blog/Social Posts
```markdown
# Introducing envm - Advanced Environment File Manager

Manage your environment variables like a pro with military-grade encryption,
automatic backups, and intelligent validation.

## Key Features:
- 🔐 AES-256-GCM encryption
- 📦 Automatic backups
- ✅ Schema validation
- 🔄 Multi-environment switching
- ⚠️ Git ignore security guard

Install: `npm install -g envm`
Documentation: https://github.com/nom-nom-hub/envm
```

## 📊 Release Management

### Version Bumping
```bash
# Patch (bug fixes): 1.0.0 -> 1.0.1
npm version patch

# Minor (new features): 1.0.0 -> 1.1.0
npm version minor

# Major (breaking changes): 1.0.0 -> 2.0.0
npm version major
```

### Changelog Format
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-XX

### Added
- Initial release
- AES-256 encryption support
- Multi-environment file switching
- Git ignore security guard
- Automatic backup system
- Variable-specific encryption
- Profile management
- Environment validation

### Changed
- Improved CLI interface
- Enhanced error messages

### Fixed
- Various bug fixes
```

## 👥 Contributor Management

### Release Process
1. **Development Phase**
   - Feature development
   - Testing
   - Documentation updates

2. **Pre-Release**
   - Code freeze
   - Final testing
   - Documentation review
   - Version bump
   - Changelog update

3. **Release**
   - NPM publish
   - GitHub release
   - Homebrew update
   - Announcements

4. **Post-Release**
   - Monitor issues
   - Gather feedback
   - Plan next release

### Communication Channels
- GitHub Issues & Discussions
- Release announcement issues
- Social media updates
- Mailing list/newsletter (future)
- Discord/Slack support channels (future)

This guide ensures consistent, professional distribution of envm across all major platforms and package managers.