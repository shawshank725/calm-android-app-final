#!/usr/bin/env node

// Script to prevent auto-generation of empty folders
const fs = require('fs');
const path = require('path');

// Folders that should not be auto-created
const FORBIDDEN_FOLDERS = [
  'temp',
  'cache',
  '.temp',
  '.cache',
  'empty',
  'build-temp'
];

// Function to remove empty folders
function removeEmptyFolders(dirPath) {
  if (!fs.existsSync(dirPath)) return;

  const files = fs.readdirSync(dirPath);
  
  if (files.length === 0) {
    const folderName = path.basename(dirPath);
    if (FORBIDDEN_FOLDERS.includes(folderName.toLowerCase())) {
      console.log(`🗑️  Removing forbidden empty folder: ${dirPath}`);
      fs.rmdirSync(dirPath);
      return;
    }
  }

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      removeEmptyFolders(fullPath);
    }
  });

  // Check again if folder is now empty after cleaning subdirectories
  if (fs.existsSync(dirPath)) {
    const remainingFiles = fs.readdirSync(dirPath);
    if (remainingFiles.length === 0) {
      const folderName = path.basename(dirPath);
      if (FORBIDDEN_FOLDERS.includes(folderName.toLowerCase())) {
        console.log(`🗑️  Removing forbidden empty folder: ${dirPath}`);
        fs.rmdirSync(dirPath);
      }
    }
  }
}

// Watch for folder creation and remove forbidden ones
function watchFolders() {
  const appDir = path.join(__dirname, 'app');
  
  if (fs.existsSync(appDir)) {
    removeEmptyFolders(appDir);
  }
  
  console.log('✅ Folder cleanup completed!');
}

// Run the cleanup
watchFolders();

module.exports = { removeEmptyFolders, watchFolders };
