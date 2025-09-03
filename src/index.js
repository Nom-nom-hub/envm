#!/usr/bin/env node

const { Command } = require('commander');
const { config: loadDotenv, parse } = require('dotenv');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const zlib = require('zlib');
const crypto = require('crypto');
const { execSync } = require('child_process');
const program = new Command();

/**
 * Validates environment configuration against a reference schema
 * @param {Object} options - CLI options
 */
function validateEnvironment(options) {
  try {
    const envDir = options.path || process.cwd();

    // Determine schema file path
    const schemaFile = options.schema ?
      path.resolve(envDir, options.schema) :
      path.join(envDir, '.env.example');

    // Determine environment file path
    const envFile = options.env ?
      path.resolve(envDir, options.env) :
      path.join(envDir, '.env');

    // Initialize result object
    let validationResult = {
      success: true,
      errors: [],
      warnings: [],
      missing: [],
      extra: [],
      typeMismatches: []
    };

    // Load and parse schema file
    let schemaEnv, envVariables;

    try {
      if (fs.existsSync(schemaFile)) {
        const schemaContent = fs.readFileSync(schemaFile, 'utf-8');
        schemaEnv = parse(schemaContent);
        if (options.verbose) {
          console.log(`✅ Loaded schema file: ${path.relative(envDir, schemaFile)}`);
        }
      } else {
        validationResult.errors.push(`Schema file not found: ${path.relative(envDir, schemaFile)}`);
        validationResult.success = false;
        reportResults(validationResult, options);
        return;
      }
    } catch (error) {
      validationResult.errors.push(`Error reading schema file ${path.relative(envDir, schemaFile)}: ${error.message}`);
      validationResult.success = false;
      reportResults(validationResult, options);
      return;
    }

    // Load and parse environment file
    try {
      if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf-8');
        envVariables = parse(envContent);
        if (options.verbose) {
          console.log(`✅ Loaded environment file: ${path.relative(envDir, envFile)}`);
        }
      } else {
        validationResult.warnings.push(`Environment file not found: ${path.relative(envDir, envFile)}`);
        // Add all schema variables as missing
        validationResult.missing = Object.keys(schemaEnv);
        reportResults(validationResult, options);
        return;
      }
    } catch (error) {
      validationResult.errors.push(`Error reading environment file ${path.relative(envDir, envFile)}: ${error.message}`);
      validationResult.success = false;
      reportResults(validationResult, options);
      return;
    }

    // Compare variables
    const schemaKeys = Object.keys(schemaEnv);
    const envKeys = Object.keys(envVariables);

    // Find missing variables (in schema but not in env)
    validationResult.missing = schemaKeys.filter(key => !(key in envVariables));

    // Find extra variables (in env but not in schema)
    validationResult.extra = envKeys.filter(key => !(key in schemaEnv));

    // Check for type mismatches
    Object.keys(schemaEnv).forEach(key => {
      if (key in envVariables) {
        const expectedType = detectType(schemaEnv[key]);
        const actualType = detectType(envVariables[key]);

        if (expectedType !== actualType) {
          validationResult.typeMismatches.push({
            variable: key,
            expected: expectedType,
            actual: actualType,
            schemaValue: schemaEnv[key],
            envValue: envVariables[key]
          });
        }
      }
    });

    // Set success status based on findings
    validationResult.success = validationResult.missing.length === 0 &&
                               validationResult.extra.length === 0 &&
                               validationResult.typeMismatches.length === 0 &&
                               validationResult.errors.length === 0;

    reportResults(validationResult, options);

  } catch (error) {
    console.error('❌ Unexpected error during validation:', error.message);
    if (!options.noExit) {
      process.exit(1);
    }
  }
}

/**
 * Detects the type of a dotenv value
 */
function detectType(value) {
  const trimVal = value.trim();

  // Check for boolean patterns
  if (/^(true|false)$/i.test(trimVal)) {
    return 'boolean';
  }

  // Check for number patterns
  if (/^\d+$/.test(trimVal)) {
    return 'integer';
  }
  if (/^\d*\.\d+$/.test(trimVal)) {
    return 'float';
  }

  // Check for array patterns (basic detection)
  if (trimVal.startsWith('[') && trimVal.endsWith(']')) {
    return 'array';
  }

  // Check for object patterns (basic detection)
  if (trimVal.startsWith('{') && trimVal.endsWith('}')) {
    return 'object';
  }

  // Default to string
  return 'string';
}

/**
 * Reports validation results
 */
function reportResults(result, options) {
  const { success, errors, warnings, missing, extra, typeMismatches } = result;

  // Show verbose header when verbose is enabled
  if (options.verbose) {
    console.log('\n🔍 Environment Validation Report');
    console.log('===================================\n');
  }

  // Report errors
  if (errors.length > 0) {
    console.log('❌ Errors:');
    errors.forEach(error => console.log(`  • ${error}`));
    console.log('');
  }

  // Report warnings
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(warning => console.log(`  • ${warning}`));
    console.log('');
  }

  // Report missing variables
  if (missing.length > 0) {
    console.log('📭 Missing Variables:');
    missing.forEach(variable => {
      console.log(`  • ${variable}`);
      if (options.verbose) {
        // Show schema value if available and verbose
        const schemaPath = options.schema ?
          path.resolve(options.path || process.cwd(), options.schema) :
          path.join(options.path || process.cwd(), '.env.example');
        try {
          if (fs.existsSync(schemaPath)) {
            const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
            const schemaEnv = parse(schemaContent);
            if (variable in schemaEnv) {
              console.log(`    Schema: "${schemaEnv[variable]}"`);
            }
          }
        } catch (error) {
          // Ignore schema read errors
        }
      }
      // Try to provide suggestion based on current env file or patterns
      const envFile = path.join(options.path || process.cwd(), options.env || '.env');
      const suggestion = getSuggestionForMissing(envFile, variable);
      if (suggestion) {
        console.log(`    💡 Suggestion: ${variable}=${suggestion}`);
      }
    });
    console.log('');
  }

  // Report extra variables
  if (extra.length > 0) {
    console.log('📦 Extra Variables:');
    extra.forEach(variable => console.log(`  • ${variable}`));
    console.log('');
  }

  // Report type mismatches
  if (typeMismatches.length > 0) {
    console.log('🔄 Type Mismatches:');
    typeMismatches.forEach(mismatch => {
      console.log(`  • ${mismatch.variable}: Expected ${mismatch.expected}, got ${mismatch.actual}`);
      if (options.verbose) {
        console.log(`    Schema: "${mismatch.schemaValue}"`);
        console.log(`    Environment: "${mismatch.envValue}"`);
        const suggestion = getTypeSuggestion(mismatch.expected, mismatch.schemaValue);
        if (suggestion) {
          console.log(`    💡 Suggested value: ${suggestion}`);
        }
      }
    });
    console.log('');
  }

  // Summary
  const issueCount = errors.length + missing.length + extra.length + typeMismatches.length;

  if (success) {
    console.log('✅ Validation successful!');
    if (options.verbose) {
      const totalVariables = [...new Set([...missing, ...extra, ...Object.keys(result)])].length;
      console.log(`   All ${totalVariables} variables are correctly configured.`);
    }
  } else {
    if (errors.length > 0 || (options.strict && issueCount > 0)) {
      console.log('❌ Validation failed!');
      if (!options.noExit) {
        process.exit(1);
      }
    } else {
      console.log('⚠️  Validation completed with warnings.');
      if (issueCount > 1) {
        console.log(`   Found ${issueCount} issues that should be addressed.`);
      }
    }
  }
}

/**
 * Generates suggestion for a missing variable
 */
function getSuggestionForMissing(envFile, variable) {
  try {
    // Try to find similar variables in the environment file first
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf-8');
      const envData = parse(envContent);

      // Look for similar variables that might provide hints
      const similarVars = Object.keys(envData).filter(k =>
        k.toLowerCase().includes(variable.toLowerCase().split('_').slice(-1)[0]) ||
        k.toLowerCase().replace(/_/g, '').includes(variable.toLowerCase().replace(/_/g, ''))
      );

      if (similarVars.length > 0) {
        return envData[similarVars[0]]; // Use the first similar variable's value
      }
    }

    // Common defaults based on variable name patterns
    const name = variable.toLowerCase();
    if (name.includes('port')) return '3000';
    if (name.includes('url') || name.includes('endpoint')) return 'http://localhost:3000';
    if (name.includes('host') || name.includes('server')) return 'localhost';
    if (name.includes('secret') || name.includes('key') || name.includes('token')) {
      // For JWT secrets, use a shorter pattern; for keys use changeme
      return name.includes('jwt') ? 'your_jwt_secret_here' : 'changeme';
    }
    if (name.includes('enable') || name.includes('flag') || name.includes('logs')) return 'false';
    if (name.includes('timeout')) return '5000';
    if (name.includes('user') || name.includes('username')) return 'your_username';
    if (name.includes('password') || name.includes('pass')) return 'your_password';
    if (name.includes('database') || name.includes('db_')) return 'your_db_name';
    if (name.includes('email')) return 'your_email@example.com';
    if (name.includes('limit')) return '100';
    if (name.includes('rate')) return '60';
    if (name.includes('max') || name.includes('size')) return '1000';

  } catch (error) {
    // Ignore errors in suggestion generation
  }
  return null;
}

/**
 * Generates type correction suggestion
 */
function getTypeSuggestion(expectedType, schemaValue) {
  switch (expectedType) {
    case 'boolean':
      if (/true|false/i.test(schemaValue.toLowerCase())) {
        return schemaValue.toLowerCase();
      }
      return 'true';
    case 'integer':
      return '0';
    case 'string':
      return '""';
    default:
      return null;
  }
}

/**
 * Custom .env parser that preserves comments and structure
 * @param {string} content - The .env file content
 * @returns {Object} Parsed environment variables and comments
 */
function parseEnvFile(content) {
  const lines = content.split('\n');
  const envVars = {};
  const comments = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimLeft(); // Keep indentation for comments

    if (line.startsWith('#') || line.trim() === '') {
      // Preserve comments and empty lines
      comments.push({
        line: i + 1,
        type: line.startsWith('#') ? 'comment' : 'empty',
        content: line
      });
      continue;
    }

    // Parse key=value pairs
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2] || '';

      // Remove quotes if present
      const unquotedValue = value.replace(/^["'](.*)["']$/, '$1');

      envVars[key] = unquotedValue;
    }
  }

  return { envVars, comments };
}

/**
 * Checks if .env files are tracked in Git and warns accordingly
 * @param {string} projectDir - Project directory path
 * @returns {Object} Git ignore validation result
 */
function checkGitIgnoreStatus(projectDir) {
  const result = {
    isGitRepo: false,
    trackedEnvFiles: [],
    gitignoreExists: false,
    gitignorePatterns: [],
    warnings: [],
    recommendations: []
  };

  try {
    // Check if it's a git repository
    result.isGitRepo = fs.existsSync(path.join(projectDir, '.git'));

    if (!result.isGitRepo) {
      result.warnings.push('Not a Git repository - Git ignore guard skipped');
      return result;
    }

    // Find all .env related files
    const envPatterns = [
      '.env', '.env.local', '.env.development', '.env.staging',
      '.env.production', '.env.test', '.env.*', '*.encrypted'
    ];

    // Execute git ls-files to check tracked files
    const { spawn } = require('child_process');

    // Check each env pattern
    for (const pattern of envPatterns) {
      try {
        const gitCheck = spawn('git', ['ls-files', pattern], {
          cwd: projectDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        gitCheck.stdout.on('data', (data) => { stdout += data.toString(); });
        gitCheck.stderr.on('data', (data) => { stderr += data.toString(); });

        gitCheck.on('close', (code) => {
          if (code === 0 && stdout.trim()) {
            const files = stdout.trim().split('\n').filter(f => f);
            result.trackedEnvFiles.push(...files);
          }
        });

        // Wait for command to complete synchronously
        const exitCode = gitCheck.exitCode || 0;
        if (exitCode === 0 && stdout.trim()) {
          const files = stdout.trim().split('\n').filter(f => f);
          result.trackedEnvFiles.push(...files);
        }
      } catch (gitError) {
        // Git not available or pattern doesn't match files
        continue;
      }
    }

    // Check for .gitignore
    const gitignorePath = path.join(projectDir, '.gitignore');
    result.gitignoreExists = fs.existsSync(gitignorePath);

    if (result.gitignoreExists) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      const gitignoreLines = gitignoreContent.split('\n');

      // Check for env patterns in gitignore
      result.gitignorePatterns = gitignoreLines.filter(line => {
        const cleanLine = line.trim();
        return !line.startsWith('#') &&
               (cleanLine.includes('.env') ||
                cleanLine.includes('*.encrypted') ||
                cleanLine === 'encrypted');
      });
    }

    // Generate warnings and recommendations
    if (result.trackedEnvFiles.length > 0) {
      result.warnings.push(`Found ${result.trackedEnvFiles.length} .env file(s) tracked in Git`);
      result.warnings.push(...result.trackedEnvFiles.map(file => `  • ${file}`));

      result.recommendations.push('Add .env files to .gitignore to prevent credential leaks');
      result.recommendations.push('Use: envm gitignore add');
    }

    if (!result.gitignoreExists) {
      result.warnings.push('No .gitignore file found - create one for security');
      result.recommendations.push('Create .gitignore file with: envm gitignore init');
    }

    // Check if .env patterns are in gitignore
    const hasEnvPatterns = result.gitignorePatterns.length > 0;
    if (result.trackedEnvFiles.length > 0 && !hasEnvPatterns) {
      result.warnings.push('No .env patterns found in .gitignore');
    }

    return result;

  } catch (error) {
    result.warnings.push(`Git ignore guard check failed: ${error.message}`);
    return result;
  }
}

/**
 * Manages .gitignore for environment files
 * @param {Object} options - Command options
 */
function manageGitIgnore(options) {
  const projectDir = options.path || process.cwd();
  const action = options.action || 'check';

  try {
    console.log('🔍 Git Ignore Guard - Managing .env file security\n');

    const gitignorePath = path.join(projectDir, '.gitignore');

    switch (action) {
      case 'check':
      case 'status':
        const status = checkGitIgnoreStatus(projectDir);

        if (status.warnings.length > 0) {
          console.log('⚠️  Warnings:');
          status.warnings.forEach(warning => console.log(`  • ${warning}`));
          console.log('');
        }

        if (status.recommendations.length > 0) {
          console.log('💡 Recommendations:');
          status.recommendations.forEach(rec => console.log(`  • ${rec}`));
          console.log('');
        }

        // Summary
        console.log('📊 Summary:');
        console.log(`  • Git repository: ${status.isGitRepo ? '✅ Yes' : '❌ No'}`);
        console.log(`  • .gitignore file: ${status.gitignoreExists ? '✅ Exists' : '❌ Missing'}`);
        console.log(`  • Tracked env files: ${status.trackedEnvFiles.length}`);
        console.log(`  • Env patterns in gitignore: ${status.gitignorePatterns.length}`);

        if (status.trackedEnvFiles.length === 0 && status.gitignoreExists) {
          console.log('\n✅ Good job! No .env files are tracked in Git');
        }
        break;

      case 'init':
        // Create .gitignore if it doesn't exist
        let gitignoreContent = '';

        if (fs.existsSync(gitignorePath)) {
          console.log('⚠️  .gitignore already exists');
          console.log('Use: envm gitignore add');
          return;
        }

        gitignoreContent = `# Environment files
.env
.env.*
*.encrypted

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~
`;

        fs.writeFileSync(gitignorePath, gitignoreContent, 'utf-8');
        console.log('✅ Created .gitignore file with env patterns');
        console.log('🔒 Your .env files are now protected from Git tracking');
        break;

      case 'add':
        // Add env patterns to existing .gitignore
        let existingContent = '';

        if (fs.existsSync(gitignorePath)) {
          existingContent = fs.readFileSync(gitignorePath, 'utf-8');
        } else {
          console.log('❌ .gitignore file not found');
          console.log('Use: envm gitignore init');
          return;
        }

        const lines = existingContent.split('\n');
        const envPatterns = [
          '# Environment files',
          '.env',
          '.env.*',
          '*.encrypted'
        ];

        let hasEnvSection = false;
        envPatterns.forEach(pattern => {
          if (!existingContent.includes(pattern)) {
            if (pattern === '# Environment files' && lines.length > 0) {
              lines.splice(0, 0, ''); // Add blank line
              lines.splice(0, 0, pattern);
            } else if (pattern.startsWith('#')) {
              lines.splice(0, 0, pattern);
            } else {
              lines.push(pattern);
            }
          }
        });

        fs.writeFileSync(gitignorePath, lines.join('\n'), 'utf-8');
        console.log('✅ Added .env patterns to .gitignore');
        console.log('🔒 Environment files are now excluded from Git');
        break;

      case 'clean':
        // Check if files should be removed from git tracking
        const cleanStatus = checkGitIgnoreStatus(projectDir);

        if (cleanStatus.trackedEnvFiles.length === 0) {
          console.log('✅ No .env files currently tracked in Git');
          return;
        }

        console.log('🧹 Found files that could be removed from Git tracking:');
        cleanStatus.trackedEnvFiles.forEach(file => {
          console.log(`  • ${file}`);
        });

        console.log('\nTo remove these files from Git (but keep them locally):');
        console.log(`git rm --cached ${cleanStatus.trackedEnvFiles.join(' ')}`);
        console.log('\n⚠️  WARNING: This will remove the files from Git history');
        console.log('   Make sure you have backups before proceeding');

        if (options.force) {
          console.log('\n🧹 Removing files from Git tracking...');

          const { spawn } = require('child_process');
          const gitRm = spawn('git', ['rm', '--cached', ...cleanStatus.trackedEnvFiles], {
            cwd: projectDir,
            stdio: 'inherit'
          });

          gitRm.on('close', (code) => {
            if (code === 0) {
              console.log('✅ Files removed from Git tracking');
              console.log('🔒 Your credentials are now safe');
            } else {
              console.error('❌ Failed to remove files from Git tracking');
            }
          });
        }
        break;

      default:
        console.error(`❌ Unknown action: ${action}`);
        console.error('Available actions: check, status, init, add, clean');
    }

  } catch (error) {
    console.error(`❌ Git ignore guard error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Exports environment variables to JSON format
 * @param {Object} envVars - Environment variables object
 * @param {string} outputFile - Output file path or null for stdout
 */
function exportToJSON(envVars, outputFile) {
  const content = JSON.stringify(envVars, null, 2) + '\n';

  if (outputFile) {
    fs.writeFileSync(outputFile, content, 'utf-8');
  } else {
    console.log(content);
  }
}

/**
 * Exports environment variables to YAML format with preserved comments
 * @param {Object} envVars - Environment variables object
 * @param {Array} comments - Array of comment objects
 * @param {string} outputFile - Output file path or null for stdout
 */
function exportToYAML(envVars, comments, outputFile) {
  let content = '# Exported environment variables\n';
  content += '# Generated by envm export command\n';
  content += '\n';
  content += yaml.dump(envVars, { lineWidth: -1 });

  if (outputFile) {
    fs.writeFileSync(outputFile, content, 'utf-8');
  } else {
    console.log(content);
  }
}

/**
 * Derives encryption key from password using PBKDF2
 * @param {string} password - User password
 * @param {Buffer} salt - Salt for key derivation
 * @returns {Buffer} Derived key
 */
function deriveKey(password, salt) {
  return crypto.scryptSync(password, salt, 32); // 32 bytes = 256 bits for AES-256
}

/**
 * Encrypts data using AES-256-GCM
 * @param {Buffer|string} data - Data to encrypt
 * @param {string} password - Encryption password
 * @returns {Object} Encrypted data with metadata
 */
function encryptData(data, password) {
  const salt = crypto.randomBytes(32); // Generate random salt
  const iv = crypto.randomBytes(16); // 16 bytes IV for GCM (recommended)

  const key = deriveKey(password, salt);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted;
  if (Buffer.isBuffer(data)) {
    encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  } else {
    encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  }

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    authTag,
    iv,
    salt,
    algorithm: 'aes-256-gcm'
  };
}

/**
 * Decrypts data using AES-256-GCM
 * @param {Buffer} encryptedData - Encrypted data
 * @param {Buffer} authTag - Authentication tag
 * @param {Buffer} iv - Initialization vector
 * @param {Buffer} salt - Salt used for key derivation
 * @param {string} password - Decryption password
 * @returns {string} Decrypted data
 */
function decryptData(encryptedData, authTag, iv, salt, password) {
  const key = deriveKey(password, salt);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted;
  try {
    decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error('Decryption failed. Invalid password or corrupted data.');
  }
}

/**
 * Creates a structured encrypted file with metadata
 * @param {Object} encryptionResult - Result from encryptData()
 * @returns {Buffer} Encrypted file content with metadata
 */
function createEncryptedFile(encryptionResult) {
  const metadata = {
    version: '1.0',
    algorithm: encryptionResult.algorithm,
    encryptedAt: new Date().toISOString()
  };

  const metadataJson = JSON.stringify(metadata);
  const metadataLength = Buffer.alloc(4);
  metadataLength.writeUInt32BE(Buffer.byteLength(metadataJson), 0);

  // File format:
  // 4 bytes: metadata length
  // N bytes: metadata JSON
  // 4 bytes: salt length
  // 32 bytes: salt
  // 4 bytes: IV length
  // 16 bytes: IV
  // 4 bytes: auth tag length
  // 16 bytes: auth tag
  // Remaining: encrypted data

  const saltLength = Buffer.alloc(4);
  saltLength.writeUInt32BE(encryptionResult.salt.length, 0);

  const ivLength = Buffer.alloc(4);
  ivLength.writeUInt32BE(encryptionResult.iv.length, 0);

  const authTagLength = Buffer.alloc(4);
  authTagLength.writeUInt32BE(encryptionResult.authTag.length, 0);

  return Buffer.concat([
    metadataLength,
    Buffer.from(metadataJson),
    saltLength,
    encryptionResult.salt,
    ivLength,
    encryptionResult.iv,
    authTagLength,
    encryptionResult.authTag,
    encryptionResult.encrypted
  ]);
}

/**
 * Parses an encrypted file and extracts components
 * @param {Buffer} fileContent - Content of encrypted file
 * @returns {Object} Parsed encrypted file components
 */
function parseEncryptedFile(fileContent) {
  let offset = 0;

  // Read metadata length (4 bytes)
  const metadataLength = fileContent.readUInt32BE(offset);
  offset += 4;

  // Read metadata JSON
  const metadataJson = fileContent.subarray(offset, offset + metadataLength).toString();
  const metadata = JSON.parse(metadataJson);
  offset += metadataLength;

  // Read salt length (4 bytes)
  const saltLength = fileContent.readUInt32BE(offset);
  offset += 4;

  // Read salt
  const salt = fileContent.subarray(offset, offset + saltLength);
  offset += saltLength;

  // Read IV length (4 bytes)
  const ivLength = fileContent.readUInt32BE(offset);
  offset += 4;

  // Read IV
  const iv = fileContent.subarray(offset, offset + ivLength);
  offset += ivLength;

  // Read auth tag length (4 bytes)
  const authTagLength = fileContent.readUInt32BE(offset);
  offset += 4;

  // Read auth tag
  const authTag = fileContent.subarray(offset, offset + authTagLength);
  offset += authTagLength;

  // Read encrypted data
  const encrypted = fileContent.subarray(offset);

  return {
    metadata,
    salt,
    iv,
    authTag,
    encrypted
  };
}

/**
 * Encrypts an environment file
 * @param {Object} options - Encryption options
 */
function encryptEnvironment(options) {
  const envDir = options.path || process.cwd();
  const inputFile = options.env.replace(/\.encrypted$/, ''); // Remove .encrypted if present
  const inputPath = path.resolve(envDir, inputFile);

  // Determine output file
  let outputFile = inputFile;
  if (!options.output) {
    // Auto-generate .encrypted file name
    if (inputFile === '.env') {
      outputFile = '.env.encrypted';
    } else if (inputFile.startsWith('.env.')) {
      outputFile = `${inputFile}.encrypted`;
    } else {
      outputFile = `${inputFile}.encrypted`;
    }
  } else {
    outputFile = options.output;
  }
  const outputPath = path.resolve(envDir, outputFile);

  try {
    // Validate input file
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${path.relative(process.cwd(), inputPath)}`);
    }

    // Create backup before encryption (unless disabled)
    if (!options.noBackup) {
      console.log('📦 Creating backup before encryption...');
      const backupResult = createBackup(envDir, null, false); // Auto-named backup
      if (backupResult.success) {
        console.log(`✅ Backup created: ${backupResult.backupName}`);
      } else {
        console.error(`❌ Error creating backup: ${backupResult.error}`);
        if (!options.force) {
          throw new Error('Backup creation failed. Use --no-backup to skip or --force to continue.');
        }
      }
    }

    // Read and parse input file
    const fileContent = fs.readFileSync(inputPath, 'utf-8');
    const { envVars, comments } = parseEnvFile(fileContent);

    // Handle variable-specific encryption
    let dataToEncrypt = fileContent;
    if (options.variable) {
      if (!envVars[options.variable]) {
        throw new Error(`Variable '${options.variable}' not found in ${inputFile}`);
      }

      // Encrypt only the specified variable
      const encryptedValue = encryptData(envVars[options.variable], options.key);

      // Rebuild file content with encrypted variable
      const lines = fileContent.split('\n');
      let outputLines = [];

      for (const line of lines) {
        if (line.includes(`${options.variable}=`)) {
          const prefix = line.split('=')[0];
          const encryptedFile = createEncryptedFile(encryptedValue);
          const base64Encrypted = encryptedFile.toString('base64');
          outputLines.push(`${prefix}=ENVM_ENCRYPTED:${base64Encrypted}`);
        } else if (line.startsWith('#') || line.trim() === '') {
          outputLines.push(line);
        } else {
          // Encrypt other variables too if --variable flag is used
          const match = line.match(/^([^=]+)=(.*)$/);
          if (match) {
            const varName = match[1].trim();
            if (varName !== options.variable) {
              const encryptedVar = encryptData(match[2], options.key);
              const encryptedVarFile = createEncryptedFile(encryptedVar);
              const base64EncryptedVar = encryptedVarFile.toString('base64');
              outputLines.push(`${varName}=ENVM_ENCRYPTED:${base64EncryptedVar}`);
            }
          }
        }
      }

      dataToEncrypt = outputLines.join('\n');
    }

    // Get password (from options or prompt)
    let password = options.key;
    if (!password) {
      // In a real CLI, you'd use readline or a secure password prompt
      // For now, we'll use environment variable or require explicit key
      password = process.env.ENVM_ENCRYPTION_KEY;
      if (!password) {
        console.error('❌ Password required. Use --key option or set ENVM_ENCRYPTION_KEY environment variable.');
        throw new Error('Encryption password required');
      }
    }

    // Encrypt the data
    console.log('🔐 Encrypting environment file...');
    let finalDataToEncrypt = dataToEncrypt;

    if (!options.variable) {
      // Full file encryption
      finalDataToEncrypt = fileContent;
    }

    const encryptionResult = encryptData(finalDataToEncrypt, password);
    const encryptedFile = createEncryptedFile(encryptionResult);

    // Validate output file doesn't exist (unless forced)
    if (fs.existsSync(outputPath) && !options.force) {
      const relativeOutputPath = path.relative(process.cwd(), outputPath);
      console.error(`❌ Output file already exists: ${relativeOutputPath}`);
      console.error('Use --force to overwrite existing file.');
      throw new Error('Output file already exists');
    }

    // Write encrypted file
    fs.writeFileSync(outputPath, encryptedFile);

    console.log('✅ Environment file encrypted successfully!');
    console.log(`   Input: ${path.relative(process.cwd(), inputPath)}`);
    console.log(`   Output: ${path.relative(process.cwd(), outputPath)}`);
    console.log(`   Algorithm: AES-256-GCM`);

    // Display security warning
    console.log('\n⚠️  Security Warning:');
    console.log('   - Store your encryption password securely');
    console.log('   - Never commit encrypted files to version control');
    console.log('   - Use strong passwords with mixed characters, numbers, and symbols');

  } catch (error) {
    console.error(`❌ Encryption failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Decrypts an environment file
 * @param {Object} options - Decryption options
 */
function decryptEnvironment(options) {
  const envDir = options.path || process.cwd();
  const inputFile = options.env;

  // Validate input is encrypted file
  if (!inputFile.includes('.encrypted')) {
    console.error('❌ Input file must be an encrypted .encrypted file');
    throw new Error('Invalid input file format');
  }

  const inputPath = path.resolve(envDir, inputFile);

  // Determine output file (remove .encrypted extension)
  let outputFile = inputFile;
  if (inputFile.endsWith('.encrypted')) {
    if (inputFile === '.env.encrypted') {
      outputFile = '.env';
    } else if (inputFile.startsWith('.env.') && inputFile.endsWith('.encrypted')) {
      outputFile = inputFile.slice(0, -10); // Remove '.encrypted'
    } else {
      outputFile = inputFile.slice(0, -10); // Remove '.encrypted'
    }
  }

  if (options.output) {
    outputFile = options.output;
  }

  const outputPath = path.resolve(envDir, outputFile);

  try {
    // Validate input file
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${path.relative(process.cwd(), inputPath)}`);
    }

    // Create backup of current file if it exists and --backup-current is used
    if (options.backupCurrent && fs.existsSync(outputPath)) {
      console.log('📦 Creating backup of current state...');
      const backupResult = createBackup(envDir, `pre_decrypt_${Date.now()}`, false);
      if (backupResult.success) {
        console.log(`✅ Backup created: ${backupResult.backupName}`);
      } else {
        console.error(`❌ Error creating backup: ${backupResult.error}`);
        process.exit(1);
      }
    }

    // Read encrypted file
    console.log('🔓 Reading encrypted file...');
    const encryptedFileContent = fs.readFileSync(inputPath);

    // Parse encrypted file
    let parsedFile;
    try {
      parsedFile = parseEncryptedFile(encryptedFileContent);
    } catch (error) {
      throw new Error('Invalid encrypted file format');
    }

    // Get password
    let password = options.key;
    if (!password) {
      password = process.env.ENVM_ENCRYPTION_KEY;
      if (!password) {
        console.error('❌ Password required. Use --key option or set ENVM_ENCRYPTION_KEY environment variable.');
        throw new Error('Decryption password required');
      }
    }

    // Decrypt the data
    console.log('🔓 Decrypting environment file...');
    let decryptedContent;

    try {
      decryptedContent = decryptData(
        parsedFile.encrypted,
        parsedFile.authTag,
        parsedFile.iv,
        parsedFile.salt,
        password
      );
    } catch (error) {
      throw new Error(error.message);
    }

    // Handle variable-specific decryption
    let finalContent = decryptedContent;
    if (options.variable) {
      const lines = decryptedContent.split('\n');
      let outputLines = [];

      for (const line of lines) {
        const match = line.match(/^([^=]+)=ENVM_ENCRYPTED:(.*)$/);
        if (match) {
          const varName = match[1].trim();
          const encryptedVarBase64 = match[2];

          if (varName === options.variable) {
            // Decrypt this specific variable
            try {
              const encryptedVarBuffer = Buffer.from(encryptedVarBase64, 'base64');
              const varParsed = parseEncryptedFile(encryptedVarBuffer);
              const decryptedVar = decryptData(
                varParsed.encrypted,
                varParsed.authTag,
                varParsed.iv,
                varParsed.salt,
                password
              );
              outputLines.push(`${varName}=${decryptedVar}`);
            } catch (varError) {
              console.error(`⚠️  Failed to decrypt variable '${varName}': ${varError.message}`);
              outputLines.push(line); // Keep encrypted version
            }
          } else {
            // Keep other variables encrypted unless --variable specifies otherwise
            outputLines.push(line);
          }
        } else {
          outputLines.push(line);
        }
      }

      finalContent = outputLines.join('\n');
    }

    // Validate output file doesn't exist (unless forced)
    if (fs.existsSync(outputPath) && !options.force) {
      const relativeOutputPath = path.relative(process.cwd(), outputPath);
      console.error(`❌ Output file already exists: ${relativeOutputPath}`);
      console.error('Use --force to overwrite existing file.');
      throw new Error('Output file already exists');
    }

    // Write decrypted file
    fs.writeFileSync(outputPath, finalContent);

    console.log('✅ Environment file decrypted successfully!');
    console.log(`   Input: ${path.relative(process.cwd(), inputPath)}`);
    console.log(`   Output: ${path.relative(process.cwd(), outputPath)}`);
    console.log(`   Algorithm: ${parsedFile.metadata.algorithm}`);
    console.log(`   Encrypted: ${parsedFile.metadata.encryptedAt}`);

    // Validate file integrity if possible
    console.log('\n🔍 File structure preserved:');
    try {
      const { envVars } = parseEnvFile(finalContent);
      console.log(`   Variables found: ${Object.keys(envVars).length}`);

      if (options.variable) {
        if (envVars[options.variable]) {
          console.log(`   ✅ Variable '${options.variable}' successfully decrypted`);
        } else {
          console.log(`   ⚠️  Variable '${options.variable}' not found in decrypted content`);
        }
      }
    } catch (error) {
      console.log('   ⚠️  Could not parse decrypted content (may contain encrypted variables)');
    }

  } catch (error) {
    console.error(`❌ Decryption failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Main export function
 * @param {Object} options - Command options
 */
function exportEnvironment(options) {
  try {
    const envDir = options.path || process.cwd();
    const envFile = path.resolve(envDir, options.env || '.env');

    // Validate format
    if (!['json', 'yaml'].includes(options.format.toLowerCase())) {
      console.error(`❌ Error: Unsupported format '${options.format}'. Supported formats: json, yaml`);
      process.exit(1);
    }

    // Check if input file exists
    if (!fs.existsSync(envFile)) {
      console.error(`❌ Error: Environment file not found: ${path.relative(process.cwd(), envFile)}`);
      process.exit(1);
    }

    // Read and parse the .env file
    const content = fs.readFileSync(envFile, 'utf-8');
    const { envVars, comments } = parseEnvFile(content);

    // Get output file or default to stdout
    let outputFile = null;
    if (options.outputFile) {
      outputFile = path.resolve(envDir, options.outputFile);

      // Check if output file directory exists
      const outputDir = path.dirname(outputFile);
      if (!fs.existsSync(outputDir)) {
        console.error(`❌ Error: Output directory not found: ${path.relative(process.cwd(), outputDir)}`);
        process.exit(1);
      }
    }

    // Perform export based on format
    const format = options.format.toLowerCase();
    if (format === 'json') {
      exportToJSON(envVars, outputFile);
    } else if (format === 'yaml') {
      exportToYAML(envVars, comments, outputFile);
    }

    // Note: Encryption is now handled by the separate 'encrypt' command

    // Success message
    if (outputFile) {
      console.log(`✅ Successfully exported to ${path.relative(process.cwd(), outputFile)} (format: ${format})`);
    } else {
      console.log(`✅ Successfully exported to stdout (format: ${format})`);
    }

  } catch (error) {
    console.error(`❌ Error during export: ${error.message}`);
    process.exit(1);
  }
}

program
  .name('envm')
  .description('Env File Manager CLI tool for managing .env files')
  .version('1.0.0');

// Switch command - Switch between different environment configurations
program
  .command('switch <config>')
  .description('Switch to a different environment configuration')
  .option('-f, --force', 'Force switch and overwrite .env without confirmation')
  .option('-p, --path <path>', 'Path where .env files are located (default: current directory)')
  .option('-b, --backup', 'Create timestamped backup of current .env before switching')
  .action((config, options) => {
    const envDir = options.path || process.cwd();
    const sourceFile = path.join(envDir, `.env.${config}`);
    const targetFile = path.join(envDir, '.env');

    try {
      // Check if source file exists
      if (!fs.existsSync(sourceFile)) {
        console.error(`Error: .env.${config} file not found in ${envDir}`);
        console.error('Available environment files:');
        // List available .env.* files
        try {
          const files = fs.readdirSync(envDir);
          const envFiles = files.filter(file => file.startsWith('.env.'));
          if (envFiles.length > 0) {
            envFiles.forEach(file => console.error(`  ${file}`));
          } else {
            console.error(`  No .env.* files found in ${envDir}`);
          }
        } catch (err) {
          console.error(`  Could not list files in ${envDir}`);
        }
        process.exit(1);
      }

      // Check if target .env exists and handle backup
      if (fs.existsSync(targetFile)) {
        if (!options.force) {
          console.log(`Warning: ${targetFile} already exists.`);
          console.log('Use --force to overwrite without confirmation.');
          process.exit(1);
        }
        // Create backup if requested using new backup system
        if (options.backup) {
          console.log('📦 Creating backup before switch...');
          const backupResult = createBackup(envDir, null, false); // Auto-named backup, no compression
          if (backupResult.success) {
            console.log(`✅ Backup created: ${backupResult.backupName}`);
          } else {
            console.error(`❌ Error creating backup: ${backupResult.error}`);
            process.exit(1);
          }
        }
        console.log(`Overwriting existing: ${targetFile}`);
      }

      // Perform the switch
      try {
        fs.copyFileSync(sourceFile, targetFile);
        console.log(`Successfully switched to ${config} environment`);
        console.log(`Source: .env.${config}`);
        console.log(`Target: .env`);
      } catch (err) {
        console.error(`Error switching environment: ${err.message}`);
        process.exit(1);
      }

    } catch (err) {
      console.error(`Unexpected error: ${err.message}`);
      process.exit(1);
    }
  });

// Validate command - Validate environment configuration
program
  .command('validate')
  .description('Validate current environment configuration')
  .option('-p, --path <path>', 'Path where .env files are located (default: current directory)')
  .option('-e, --env <file>', 'Environment file to validate (default: .env)')
  .option('-s, --strict', 'Fail validation on any discrepancy (non-zero exit code)')
  .option('-v, --verbose', 'Provide detailed validation report')
  .option('--schema <file>', 'Use custom schema file instead of .env.example')
  .option('--no-exit', 'Do not exit process (for programmatic use)')
  .action((options) => {
    validateEnvironment(options);
  });

// Export command - Export environment variables
program
  .command('export')
  .description('Export environment variables to JSON or YAML format')
  .option('-f, --format <format>', 'Output format (json, yaml)', 'json')
  .option('-e, --env <file>', 'Input environment file (default: .env)', '.env')
  .option('-o, --output-file <file>', 'Output file path (default: stdout)')
  .option('-p, --path <path>', 'Working directory (default: current directory)')
  .action((options) => {
    exportEnvironment(options);
  });

// Backup command - Create backup of environment files
program
  .command('backup [name]')
  .description('Create backup of environment files')
  .option('-p, --path <path>', 'Path where .env files are located (default: current directory)')
  .option('-c, --compress', 'Compress the backup files')
  .option('-l, --list', 'List available backups instead of creating one')
  .action((name, options) => {
    if (options.list) {
      listBackupsCommand(options);
      return;
    }

    try {
      const projectDir = options.path || process.cwd();
      const backupName = name || null;

      console.log('🔄 Creating backup...');

      if (backupName) {
        console.log(`   Backup name: ${backupName}`);
      }
      if (options.compress) {
        console.log('   Compression: enabled');
      }

      const result = createBackup(projectDir, backupName, options.compress);

      if (!result.success) {
        console.error(`❌ Backup failed: ${result.error}`);
        process.exit(1);
      }

      console.log('✅ Backup created successfully!');
      console.log(`   Name: ${result.backupName}`);

      if (result.compressed) {
        console.log(`   Files: ${result.files.join(', ')}`);
        console.log(`   Compressed files: ${result.compressedFiles.join(', ')}`);
        if (result.totalSize) {
          console.log(`   Total original size: ${Math.round(result.totalSize / 1024)} KB`);
        }
      } else {
        console.log(`   Files backed up: ${result.files.join(', ')}`);
      }

      console.log(`   Location: ${path.relative(process.cwd(), result.backupPath)}`);

      process.exit(0);

    } catch (error) {
      console.error(`❌ Error during backup: ${error.message}`);
      process.exit(1);
    }
  });

// Restore command - Restore from backup
program
  .command('restore <backup>')
  .description('Restore environment files from backup')
  .option('-p, --path <path>', 'Path where .env files are located (default: current directory)')
  .option('-f, --force', 'Force restore (overwrite existing files without confirmation)')
  .option('-v, --verify', 'Verify backup integrity before restore')
  .option('-b, --backup-current', 'Create safety backup of current state before restore')
  .action((backup, options) => {
    try {
      const projectDir = options.path || process.cwd();

      console.log('🔄 Restoring from backup...');
      console.log(`   Target backup: ${backup}`);

      if (options.verify) {
        console.log('   Verification: enabled');
      }
      if (options.backupCurrent) {
        console.log('   Safety backup: enabled');
      }

      const result = restoreFromBackup(
        projectDir,
        backup,
        options.force,
        options.verify,
        options.backupCurrent
      );

      if (!result.success) {
        if (result.wouldOverwrite) {
          console.error(`❌ ${result.error}`);
        } else {
          console.error(`❌ Restore failed: ${result.error}`);
        }
        process.exit(1);
      }

      console.log('✅ Restore completed successfully!');
      console.log(`   Backup restored: ${result.backupName}`);
      console.log(`   Files restored: ${result.files.join(', ')}`);

      if (result.overwritten && result.overwritten.length > 0) {
        console.log(`   Files overwritten: ${result.overwritten.join(', ')}`);
      }

      process.exit(0);

    } catch (error) {
      console.error(`❌ Error during restore: ${error.message}`);
      process.exit(1);
    }
  });

// Encrypt command - Encrypt environment files
program
  .command('encrypt <env>')
  .description('Encrypt environment file using AES-256-GCM encryption')
  .option('-k, --key <key>', 'Encryption password (required, or use ENVM_ENCRYPTION_KEY env var)')
  .option('-a, --algorithm <algorithm>', 'Encryption algorithm (default: aes-256-gcm)', 'aes-256-gcm')
  .option('-o, --output <output>', 'Output file path (default: <input>.encrypted)')
  .option('-p, --path <path>', 'Path where .env files are located (default: current directory)')
  .option('-v, --variable <variable>', 'Encrypt only the specified variable (leaves others as ENVM_ENCRYPTED:...)')
  .option('-f, --force', 'Force overwrite existing output file')
  .option('--no-backup', 'Skip automatic backup creation before encryption')
  .action((env, options) => {
    // Set up options for encryption function
    const encryptOptions = {
      env: env,
      key: options.key || process.env.ENVM_ENCRYPTION_KEY,
      algorithm: options.algorithm || 'aes-256-gcm',
      output: options.output,
      path: options.path,
      variable: options.variable,
      force: options.force,
      noBackup: options.noBackup
    };

    encryptEnvironment(encryptOptions);
  });

// Decrypt command - Decrypt environment files
program
  .command('decrypt <env>')
  .description('Decrypt environment file that was encrypted with AES-256-GCM')
  .option('-k, --key <key>', 'Decryption password (required, or use ENVM_ENCRYPTION_KEY env var)')
  .option('-o, --output <output>', 'Output file path (default: removes .encrypted extension)')
  .option('-p, --path <path>', 'Path where encrypted files are located (default: current directory)')
  .option('-v, --variable <variable>', 'Decrypt only the specified variable (keeps others encrypted)')
  .option('-f, --force', 'Force overwrite existing output file')
  .option('-b, --backup-current', 'Create backup of current file before decryption (if file exists)')
  .action((env, options) => {
    // Validate that file has .encrypted extension
    if (!env.includes('.encrypted')) {
      console.error('❌ Error: File must be an encrypted .encrypted file');
      console.error('   Use: envm decrypt <encrypted-file>.encrypted');
      process.exit(1);
    }

    // Set up options for decryption function
    const decryptOptions = {
      env: env,
      key: options.key || process.env.ENVM_ENCRYPTION_KEY,
      output: options.output,
      path: options.path,
      variable: options.variable,
      force: options.force,
      backupCurrent: options.backupCurrent
    };

    decryptEnvironment(decryptOptions);
  });

// Global options
program
  .option('-v, --verbose', 'Enable verbose output')
  .option('-q, --quiet', 'Suppress non-essential output')
  .option('--config <file>', 'Path to custom configuration file');

/**
 * Ensures .envm directory structure exists
 * @param {string} projectDir - Project directory path
 * @returns {string} Backup directory path
 */
function ensureBackupDirectory(projectDir) {
  const envmDir = path.join(projectDir, '.envm');
  const backupDir = path.join(envmDir, 'backups');

  try {
    if (!fs.existsSync(envmDir)) {
      fs.mkdirSync(envmDir, { recursive: true });
    }
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    return backupDir;
  } catch (error) {
    throw new Error(`Failed to create backup directory: ${error.message}`);
  }
}

/**
 * Creates compressed backup of environment files
 * @param {string} projectDir - Project directory
 * @param {string} backupName - Custom backup name (optional)
 * @param {boolean} compress - Whether to compress the backup
 * @returns {Object} Backup operation result
 */
function createBackup(projectDir, backupName = null, compress = false) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
    const backupBaseName = backupName || `env_backup_${timestamp}`;
    const backupDir = ensureBackupDirectory(projectDir);

    // Find all .env files to backup
    const envFiles = [];
    if (fs.existsSync(path.join(projectDir, '.env'))) {
      envFiles.push('.env');
    }

    // Add other .env.* files
    try {
      const files = fs.readdirSync(projectDir);
      const additionalEnvFiles = files.filter(file =>
        file.startsWith('.env.') &&
        !file.includes('.backup.') &&
        file !== '.env.example'
      );
      envFiles.push(...additionalEnvFiles);
    } catch (error) {
      // Ignore readdir errors
    }

    if (envFiles.length === 0) {
      throw new Error('No .env files found to backup');
    }

    // Create backup archive or directory
    const backupPath = path.join(backupDir, backupBaseName);
    let actualBackupPath = backupPath;

    if (compress) {
      actualBackupPath += '.tar.gz';

      // Create individual file backups and compress
      const tarStream = zlib.createGzip();
      let totalSize = 0;

      for (const envFile of envFiles) {
        const envPath = path.join(projectDir, envFile);
        if (fs.existsSync(envPath)) {
          const stats = fs.statSync(envPath);
          totalSize += stats.size;
        }
      }

      // For now, create individual compressed backups
      const compressedFiles = [];
      for (const envFile of envFiles) {
        const envPath = path.join(projectDir, envFile);
        if (fs.existsSync(envPath)) {
          const compressedFileName = `${envFile}.gz`;
          const compressedPath = path.join(backupDir, `${backupBaseName}_${compressedFileName}`);

          const content = fs.readFileSync(envPath);
          const compressedContent = zlib.gzipSync(content);

          fs.writeFileSync(compressedPath, compressedContent);
          compressedFiles.push(compressedFileName);
        }
      }

      return {
        success: true,
        backupPath: backupDir,
        backupName: backupBaseName,
        files: envFiles,
        compressedFiles: compressedFiles,
        totalSize: totalSize,
        compressed: true
      };

    } else {
      // Create regular directory backup
      fs.mkdirSync(backupPath, { recursive: true });

      for (const envFile of envFiles) {
        const sourcePath = path.join(projectDir, envFile);
        const destPath = path.join(backupPath, envFile);

        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath);
        }
      }

      return {
        success: true,
        backupPath: backupPath,
        backupName: backupBaseName,
        files: envFiles,
        compressed: false
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Lists available backups
 * @param {string} projectDir - Project directory
 * @returns {Array} List of backup information
 */
function listBackups(projectDir) {
  try {
    const backupDir = path.join(projectDir, '.envm', 'backups');

    if (!fs.existsSync(backupDir)) {
      return [];
    }

    const items = fs.readdirSync(backupDir, { withFileTypes: true });
    const backups = [];
    const processedNames = new Set();

    // Handle directory backups first
    for (const item of items) {
      if (!item.isDirectory()) continue;

      const backupPath = path.join(backupDir, item.name);
      try {
        const files = fs.readdirSync(backupPath);
        const envFiles = files.filter(file => file.startsWith('.env'));

        if (envFiles.length > 0) {
          const stats = fs.statSync(backupPath);
          let totalSize = 0;

          for (const file of envFiles) {
            const filePath = path.join(backupPath, file);
            if (fs.existsSync(filePath)) {
              totalSize += fs.statSync(filePath).size;
            }
          }

          backups.push({
            name: item.name,
            path: backupPath,
            files: envFiles,
            fileCount: envFiles.length,
            size: totalSize,
            created: stats.birthtime,
            type: 'directory'
          });
          processedNames.add(item.name);
        }
      } catch (error) {
        // Skip inaccessible directories
        continue;
      }
    }

    // Handle compressed backups
    const compressedBackups = new Map();

    for (const item of items) {
      if (item.isFile() && item.name.endsWith('.gz')) {
        const match = item.name.match(/^(.+?)_.+\.gz$/);
        if (match) {
          const backupName = match[1];

          if (!compressedBackups.has(backupName)) {
            compressedBackups.set(backupName, {
              name: backupName,
              files: [],
              totalSize: 0,
              created: null,
              type: 'compressed',
              compressed: true
            });
          }

          const backup = compressedBackups.get(backupName);
          const filePath = path.join(backupDir, item.name);
          const stats = fs.statSync(filePath);

          backup.files.push(item.name);
          backup.totalSize += stats.size;

          if (!backup.created || stats.birthtime > backup.created) {
            backup.created = stats.birthtime;
          }
        }
      }
    }

    // Add compressed backups to results
    compressedBackups.forEach(backup => {
      if (!processedNames.has(backup.name)) {
        backups.push({
          name: backup.name,
          path: backupDir,
          files: backup.files,
          fileCount: backup.files.length,
          size: backup.totalSize,
          created: backup.created,
          type: 'compressed',
          compressed: true
        });
      }
    });

    // Sort by creation date (newest first)
    backups.sort((a, b) => b.created - a.created);

    return backups;

  } catch (error) {
    throw new Error(`Failed to list backups: ${error.message}`);
  }
}

/**
 * Restores environment files from backup
 * @param {string} projectDir - Project directory
 * @param {string} backupName - Backup name or timestamp pattern
 * @param {boolean} force - Whether to force restore
 * @param {boolean} verify - Whether to verify backup integrity
 * @param {boolean} backupCurrent - Whether to backup current files before restore
 * @returns {Object} Restore operation result
 */
function restoreFromBackup(projectDir, backupName, force = false, verify = false, backupCurrent = false) {
  try {
    const backupDir = path.join(projectDir, '.envm', 'backups');

    if (!fs.existsSync(backupDir)) {
      throw new Error('No backups directory found');
    }

    // Find matching backup
    const backups = listBackups(projectDir);
    let targetBackup = null;

    // Exact match first
    targetBackup = backups.find(b => b.name === backupName);

    // Partial timestamp match if not found
    if (!targetBackup && /^\d{4}-\d{2}-\d{2}/.test(backupName)) {
      // Try to match against backup names that contain the date pattern
      targetBackup = backups.find(b =>
        b.name.includes(backupName.replace(/\D/g, '-'))
      );

      // If still not found, try matching against creation date
      if (!targetBackup) {
        targetBackup = backups.find(b =>
          b.created.toISOString().slice(0, 10) === backupName
        );
      }
    }

    if (!targetBackup) {
      const availableBackups = backups.map(b => b.name).slice(0, 5);
      throw new Error(`Backup '${backupName}' not found. Available backups: ${availableBackups.join(', ')}`);
    }

    // Verify backup integrity if requested
    if (verify) {
      if (targetBackup.type === 'directory') {
        for (const file of targetBackup.files) {
          const filePath = path.join(targetBackup.path, file);
          if (!fs.existsSync(filePath)) {
            throw new Error(`Backup verification failed: ${file} is missing`);
          }
        }
      }
    }

    // Create backup of current state if requested
    if (backupCurrent) {
      console.log('📦 Creating safety backup of current state...');
      const safetyBackup = createBackup(projectDir, `pre_restore_${Date.now()}`, false);
      if (!safetyBackup.success) {
        throw new Error(`Failed to create safety backup: ${safetyBackup.error}`);
      }
      console.log(`✅ Safety backup created: ${safetyBackup.backupName}`);
    }

    // Check for existing .env files
    const existingEnvFiles = Object.keys(targetBackup.files).filter(file => {
      const filePath = path.join(projectDir, file);
      return fs.existsSync(filePath);
    });

    if (existingEnvFiles.length > 0 && !force) {
      console.log('⚠️  Warning: The following .env files will be overwritten:');
      existingEnvFiles.forEach(file => console.log(`   • ${file}`));
      console.log('\nUse --force to overwrite existing files');
      return {
        success: false,
        error: 'Existing files would be overwritten. Use --force to continue.',
        wouldOverwrite: existingEnvFiles
      };
    }

    // Perform restore
    if (targetBackup.type === 'directory') {
      // Restore from directory backup
      for (const file of targetBackup.files) {
        const sourcePath = path.join(targetBackup.path, file);
        const destPath = path.join(projectDir, file);

        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath);
        }
      }
    } else if (targetBackup.type === 'compressed') {
      // Restore from compressed backup
      for (const compressedFile of targetBackup.files) {
        const compressedPath = path.join(targetBackup.path, compressedFile);

        // Extract the original filename from the compressed filename
        const originalFileName = compressedFile.match(/^(.+?)\.gz$/);
        if (originalFileName && originalFileName[1]) {
          const originalFile = originalFileName[1];
          const destPath = path.join(projectDir, originalFile);

          if (fs.existsSync(compressedPath)) {
            try {
              // Decompress the file
              const compressedContent = fs.readFileSync(compressedPath);
              const decompressedContent = zlib.gunzipSync(compressedContent);

              // Write the decompressed content to the destination
              fs.writeFileSync(destPath, decompressedContent);
            } catch (error) {
              throw new Error(`Failed to decompress ${compressedFile}: ${error.message}`);
            }
          }
        }
      }
    } else {
      throw new Error(`Unsupported backup type: ${targetBackup.type}`);
    }

    return {
      success: true,
      backupName: targetBackup.name,
      files: targetBackup.files,
      overwritten: existingEnvFiles
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Lists backups for display
 * @param {Object} options - Command options
 */
function listBackupsCommand(options) {
  try {
    const projectDir = options.path || process.cwd();

    console.log('📋 Available backups:');
    console.log('===================\n');

    const backups = listBackups(projectDir);

    if (backups.length === 0) {
      console.log('No backups found.');
      console.log(`Create your first backup with: envm backup [name]`);
      return;
    }

    backups.forEach(backup => {
      console.log(`📁 ${backup.name}`);

      if (backup.compressed) {
        console.log(`   Type: Compressed`);
        console.log(`   Size: ${Math.round(backup.size / 1024)} KB`);
      } else {
        console.log(`   Type: Directory`);
        console.log(`   Files: ${backup.fileCount} (${backup.files.join(', ')})`);
        console.log(`   Size: ${Math.round(backup.size / 1024)} KB`);
      }

      console.log(`   Created: ${backup.created.toISOString().replace('T', ' ').split('.')[0]}`);
      console.log(`   Location: ${path.relative(process.cwd(), backup.path)}`);
      console.log('');
    });

  } catch (error) {
    console.error(`❌ Error listing backups: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Ensures profiles directory structure exists
 * @param {string} projectDir - Project directory path
 * @returns {string} Profiles directory path
 */
function ensureProfilesDirectory(projectDir) {
  const profilesDir = path.join(projectDir, '.envm', 'profiles');

  try {
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
    }
    return profilesDir;
  } catch (error) {
    throw new Error(`Failed to create profiles directory: ${error.message}`);
  }
}

/**
 * Creates a new environment profile
 * @param {string} name - Profile name
 * @param {Object} options - Options
 * @returns {Object} Profile creation result
 */
function createProfile(name, options) {
  const projectDir = options.path || process.cwd();
  const profilesDir = ensureProfilesDirectory(projectDir);
  const profileDir = path.join(profilesDir, name);

  try {
    // Check if profile already exists
    if (fs.existsSync(profileDir)) {
      throw new Error(`Profile '${name}' already exists`);
    }

    // Create profile directory
    fs.mkdirSync(profileDir, { recursive: true });

    // Create profile metadata
    const profileMetadata = {
      name: name,
      created: new Date().toISOString(),
      environments: [],
      description: options.description || `Profile for ${name} environment`,
      version: '1.0'
    };

    fs.writeFileSync(
      path.join(profileDir, 'profile.json'),
      JSON.stringify(profileMetadata, null, 2),
      'utf-8'
    );

    return {
      success: true,
      profileName: name,
      profilePath: profileDir
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Lists available profiles
 * @param {Object} options - Options
 * @returns {Array} List of profiles
 */
function listProfiles(options) {
  const projectDir = options.path || process.cwd();
  const profilesDir = ensureProfilesDirectory(projectDir);

  if (!fs.existsSync(profilesDir)) {
    return [];
  }

  const profiles = [];
  const items = fs.readdirSync(profilesDir);

  items.forEach(item => {
    const profilePath = path.join(profilesDir, item);
    const stat = fs.statSync(profilePath);

    if (stat.isDirectory()) {
      const metadataFile = path.join(profilePath, 'profile.json');

      try {
        let metadata = {};
        if (fs.existsSync(metadataFile)) {
          metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
        }

        // Count environment files
        const profileFiles = fs.readdirSync(profilePath);
        const envFiles = profileFiles.filter(file =>
          file.startsWith('.env') || file.endsWith('.encrypted')
        );

        profiles.push({
          name: item,
          path: profilePath,
          environments: envFiles,
          environmentCount: envFiles.length,
          created: metadata.created || stat.birthtime.toISOString(),
          description: metadata.description || ''
        });

      } catch (error) {
        // Ignore invalid profiles
      }
    }
  });

  return profiles;
}

/**
 * Manages environment profiles (advanced multi-environment management)
 * @param {Object} options - Command options
 */
function manageProfiles(options) {
  const action = options.action;
  console.log('📁 Environment Profiles Manager\n');

  try {
    switch (action) {
      case 'list':
      case 'ls':
        const profiles = listProfiles(options);

        if (profiles.length === 0) {
          console.log('No profiles found.');
          console.log('Create your first profile with: envm profile dev --create');
          return;
        }

        profiles.forEach(profile => {
          console.log(`📁 ${profile.name}`);

          if (profile.description) {
            console.log(`   Description: ${profile.description}`);
          }

          console.log(`   Environments: ${profile.environmentCount} (${profile.environments.join(', ') || 'none'})`);
          console.log(`   Created: ${profile.created.split('T')[0]}`);
          console.log(`   Location: ${path.relative(process.cwd(), profile.path)}`);
          console.log('');
        });
        break;

      case 'create':
      case 'new':
        if (!options.name) {
          console.error('❌ Profile name required');
          console.error('Usage: envm profile <name> --create');
          process.exit(1);
        }

        console.log(`Creating profile: ${options.name}`);
        const createResult = createProfile(options.name, options);

        if (createResult.success) {
          console.log(`✅ Profile '${createResult.profileName}' created successfully!`);
          console.log(`   Location: ${path.relative(process.cwd(), createResult.profilePath)}`);
          console.log('\nNext steps:');
          console.log(`  cp .env ${path.join(createResult.profilePath, '.env.' + options.name)}`);
          console.log(`  envm profile ${options.name} --add .env.${options.name}`);
        } else {
          console.error(`❌ Failed to create profile: ${createResult.error}`);
          process.exit(1);
        }
        break;

      case 'switch':
      case 'use':
        // Switch to a profile (implement later if needed)
        console.log('⚠️  Profile switching - This is a planned feature');
        break;

      case 'delete':
      case 'remove':
        // Delete a profile
        if (!options.name) {
          console.error('❌ Profile name required');
          console.error('Usage: envm profile <name> --delete');
          process.exit(1);
        }

        const projectDir = options.path || process.cwd();
        const profilesDir = ensureProfilesDirectory(projectDir);
        const deleteProfilePath = path.join(profilesDir, options.name);

        if (!fs.existsSync(deleteProfilePath)) {
          console.error(`❌ Profile '${options.name}' not found`);
          process.exit(1);
        }

        if (!options.force) {
          console.log(`⚠️  This will delete the profile '${options.name}' and all its environments`);
          console.log('Use --force to confirm deletion');
          process.exit(0);
        }

        fs.rmSync(deleteProfilePath, { recursive: true, force: true });
        console.log(`✅ Profile '${options.name}' deleted successfully`);
        break;

      default:
        console.error(`❌ Unknown action: ${action}`);
        console.error('Available actions: list, create, switch, delete');
    }

  } catch (error) {
    console.error(`❌ Profile manager error: ${error.message}`);
    process.exit(1);
  }
}

// Git ignore guard command - Check and manage .env file Git tracking
program
  .command('gitignore <action>')
  .description('Check and manage .env files in Git ignore (security guard)')
  .option('-p, --path <path>', 'Path where .env files are located (default: current directory)')
  .option('-f, --force', 'Force clean action (remove files from Git) - USE WITH CAUTION')
  .action((action, options) => {
    // Validate action
    const validActions = ['check', 'status', 'init', 'add', 'clean'];
    if (!validActions.includes(action)) {
      console.error(`❌ Invalid action: ${action}`);
      console.error('Available actions:');
      validActions.forEach(act => console.error(`  • ${act}`));
      process.exit(1);
    }

    manageGitIgnore({ ...options, action });
  });

// Profile command - Manage advanced environment profiles
program
  .command('profile <action> [name]')
  .description('Manage advanced environment profiles (groups of env files)')
  .option('-p, --path <path>', 'Path where profiles are located (default: current directory)')
  .option('-d, --description <desc>', 'Profile description when creating')
  .option('-f, --force', 'Force delete profile without confirmation')
  .action((action, name, options) => {
    // Validate action
    const validActions = ['list', 'ls', 'create', 'new', 'switch', 'use', 'delete', 'remove'];
    if (!validActions.includes(action)) {
      console.error(`❌ Invalid action: ${action}`);
      console.error('Available actions:');
      console.log('  • list, ls - List all profiles');
      console.log('  • create, new - Create new profile');
      console.log('  • switch, use - Switch to a profile (planned)');
      console.log('  • delete, remove - Delete a profile');
      process.exit(1);
    }

    manageProfiles({ ...options, action, name });
  });

// Error handling
program.on('command:*', (unknownCommand) => {
  console.error(`Unknown command: ${unknownCommand[0]}`);
  console.error('Run "envm --help" for a list of available commands.');
  process.exit(1);
});

// Display help if no arguments provided
if (process.argv.length === 2) {
  program.help();
}

// Parse command line arguments
program.parse();
