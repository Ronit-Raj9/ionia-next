#!/usr/bin/env node

/**
 * Script to run database migrations
 * 
 * Usage: 
 * 1. Make script executable: chmod +x run-migrations.js
 * 2. Run specific migration: ./run-migrations.js add-question-category
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Get the directory name using ES module approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const runMigration = (migrationPath) => {
  return new Promise((resolve, reject) => {
    console.log(`Running migration: ${path.basename(migrationPath)}`);
    
    const process = spawn('node', [migrationPath], { stdio: 'inherit' });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`Migration ${path.basename(migrationPath)} completed successfully\n`);
        resolve();
      } else {
        reject(new Error(`Migration ${path.basename(migrationPath)} failed with code ${code}`));
      }
    });
    
    process.on('error', (err) => {
      reject(new Error(`Failed to start migration process: ${err.message}`));
    });
  });
};

const runAllMigrations = async () => {
  try {
    // Check if migrations directory exists
    try {
      await fs.access(MIGRATIONS_DIR);
    } catch (error) {
      console.log('Creating migrations directory...');
      await fs.mkdir(MIGRATIONS_DIR, { recursive: true });
    }
    
    // Get all migration files
    const files = await fs.readdir(MIGRATIONS_DIR);
    const migrationFiles = files
      .filter(file => file.endsWith('.js'))
      .sort(); // Sort alphabetically to ensure proper order
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }
    
    console.log(`Found ${migrationFiles.length} migrations to run:`);
    migrationFiles.forEach(file => console.log(`- ${file}`));
    console.log('');
    
    // Run migrations sequentially
    for (const file of migrationFiles) {
      const migrationPath = path.join(MIGRATIONS_DIR, file);
      await runMigration(migrationPath);
    }
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration execution failed:', error);
    process.exit(1);
  }
};

runAllMigrations(); 