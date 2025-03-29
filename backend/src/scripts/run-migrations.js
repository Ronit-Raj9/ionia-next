#!/usr/bin/env node

/**
 * Script to run database migrations
 * 
 * Usage: 
 * 1. Make script executable: chmod +x run-migrations.js
 * 2. Run specific migration: ./run-migrations.js add-question-category
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const migrationName = args[0];

if (!migrationName) {
  console.error('Error: Please specify a migration to run');
  console.log('Usage: node run-migrations.js <migration-name>');
  console.log('Available migrations:');
  console.log('  - add-question-category');
  process.exit(1);
}

async function runMigration(name) {
  try {
    console.log(`Starting migration: ${name}`);
    
    // Import and run the specified migration
    const migrationPath = `../migrations/${name}.js`;
    await import(migrationPath);
    
    console.log(`Migration completed: ${name}`);
  } catch (error) {
    console.error(`Error running migration ${name}:`, error);
    process.exit(1);
  }
}

runMigration(migrationName); 