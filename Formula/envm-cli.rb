# Formula/envm.rb
# Homebrew formula for Env File Manager CLI
# Documentation: https://docs.brew.sh/Formula-Cookbook

class EnvmCli < Formula
  desc "Advanced Env file Manager CLI tool - Multi-environment management, encryption, and security"
  homepage "https://github.com/nom-nom-hub/envm"
  url "https://registry.npmjs.org/@nom-nom-hub/envm/-/envm-1.0.0.tgz"
  sha256 "0000000000000000000000000000000000000000000000000000000000000000" # Will be updated after first npm publish
  license "MIT"

  bottle :unneeded

  depends_on "node"

  def install
    system "npm", "install", "-g", "--bin-links", "--prefix", libexec
    bin.install_symlink libexec/"bin/envm"
  end

  test do
    system "#{bin}/envm", "--help"
  end

  def caveats
    <<~EOS
      envm is a powerful tool for managing environment files with:
      • AES-256 encryption for sensitive data
      • Multi-environment file management
      • Automatic backups and validation
      • Git ignore guard for security

      Quick start:
        envm --help                # Show all commands
        envm validate             # Validate current env file
        envm encrypt .env --key mypassword  # Encrypt environment file
        envm gitignore check      # Check Git ignore security
    EOS
  end
end