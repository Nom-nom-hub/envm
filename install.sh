#!/bin/bash

# Env File Manager (envm) - Linux Installation Script
# This script provides an easy way to install envm on Linux systems

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PACKAGE_NAME="@nom-nom-hub/envm"
NPM_PACKAGE="@nom-nom-hub/envm"

echo -e "${BLUE}🚀 Env File Manager (envm) Installer${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Check if Node.js is installed
echo -e "${YELLOW}Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed.${NC}"
    echo -e "${YELLOW}Please install Node.js >= 18.0.0 from https://nodejs.org/${NC}"
    echo -e "${YELLOW}Or follow your system's package manager instructions:${NC}"
    echo -e "  Ubuntu/Debian: sudo apt update && sudo apt install nodejs npm"
    echo -e "  CentOS/RHEL: sudo yum install nodejs npm"
    echo -e "  Fedora: sudo dnf install nodejs npm"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version is too old. Found: v$NODE_VERSION${NC}"
    echo -e "${YELLOW}Please upgrade to Node.js >= 18.0.0${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js v$NODE_VERSION found${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    echo -e "${YELLOW}Please install npm from https://www.npmjs.com/get-npm${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm found${NC}"

# Check if envm is already installed
if command -v envm &> /dev/null; then
    echo -e "${YELLOW}⚠️  envm is already installed.${NC}"
    read -p "Do you want to reinstall it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Installation cancelled.${NC}"
        exit 0
    fi
fi

echo ""
echo -e "${BLUE}Installing envm...${NC}"

# Install globally
if npm install -g "$PACKAGE_NAME"; then
    echo ""
    echo -e "${GREEN}✅ Installation successful!${NC}"
    echo ""
    echo -e "${BLUE}🎉 Welcome to Env File Manager!${NC}"
    echo ""
    echo -e "${YELLOW}Quick start:${NC}"
    echo -e "  envm --help           # Show all commands"
    echo -e "  envm validate         # Validate current env file"
    echo -e "  envm gitignore check  # Check Git ignore security"
    echo ""
    echo -e "${YELLOW}Get started with:${NC}"
    echo -e "  cd your-project/"
    echo -e "  echo \"NODE_ENV=development\" > .env"
    echo -e "  envm validate         # Check your config"
    echo ""
    echo -e "${BLUE}Documentation: https://github.com/nom-nom-hub/envm${NC}"
    echo -e "${BLUE}Issues/Feedback: https://github.com/nom-nom-hub/envm/issues${NC}"
else
    echo ""
    echo -e "${RED}❌ Installation failed.${NC}"
    echo -e "${YELLOW}Try running as root/sudo if permission errors occurred:${NC}"
    echo -e "  sudo npm install -g $PACKAGE_NAME"
    echo ""
    echo -e "${YELLOW}Or try the local installation method:${NC}"
    echo -e "  git clone https://github.com/nom-nom-hub/envm.git"
    echo -e "  cd envm && npm install"
    echo -e "  npm link"
    echo ""
    echo -e "${YELLOW}Support: https://github.com/nom-nom-hub/envm/issues${NC}"
    exit 1
fi