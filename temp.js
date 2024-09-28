const fs = require('fs');
const path = require('path');

// Function to traverse directories, rename files/folders to lowercase, and copy them to the output directory
function copyAndRenameToLowerCase(srcDir, destDir) {
  fs.mkdir(destDir, { recursive: true }, err => {
    if (err) {
      console.error(`Error creating directory: ${destDir}`, err);
      return;
    }

    fs.readdir(srcDir, (err, files) => {
      if (err) {
        console.error(`Error reading directory: ${srcDir}`, err);
        return;
      }

      files.forEach(file => {
        const srcPath = path.join(srcDir, file);
        const newFileName = file.toLowerCase();
        const destPath = path.join(destDir, newFileName);

        // Check if it's a directory or file
        fs.stat(srcPath, (err, stats) => {
          if (err) {
            console.error(`Error getting stats for: ${srcPath}`, err);
            return;
          }

          if (stats.isDirectory()) {
            // Recursively process subdirectories
            copyAndRenameToLowerCase(srcPath, destPath);
          } else {
            // Copy and rename file to lowercase
            fs.copyFile(srcPath, destPath, err => {
              if (err) {
                console.error(`Error copying file: ${srcPath}`, err);
              } else {
                console.log(`Copied file: ${srcPath} -> ${destPath}`);
              }
            });
          }
        });
      });
    });
  });
}

// Set the source and destination directories
const srcDir = './v1'; // Change this to the path of your source directory
const destDir = './v1_updated'; // Change this to the path of your output directory

// Start copying and renaming files and folders
copyAndRenameToLowerCase(srcDir, destDir);
