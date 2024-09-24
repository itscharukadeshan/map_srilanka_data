/** @format */

const fs = require("fs");
const path = require("path");

const validPattern = /^[a-zA-Z]+_\d+_\d+\.geojson$/;

function processGeoJSONFiles(dir) {
  const completeDir = path.join(dir, "complete");
  const incompleteDir = path.join(dir, "incomplete");

  if (!fs.existsSync(completeDir)) fs.mkdirSync(completeDir);
  if (!fs.existsSync(incompleteDir)) fs.mkdirSync(incompleteDir);

  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${err.message}`);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(dir, file);

      if (path.extname(file) === ".geojson") {
        if (validPattern.test(file)) {
          const targetPath = path.join(completeDir, file);
          fs.rename(filePath, targetPath, (err) => {
            if (err)
              console.error(`Error moving file to complete: ${err.message}`);
          });
        } else {
          const targetPath = path.join(incompleteDir, file);
          fs.rename(filePath, targetPath, (err) => {
            if (err)
              console.error(`Error moving file to incomplete: ${err.message}`);
          });
        }
      }
    });
  });
}

const inputDir = process.argv[2];

if (!inputDir) {
  console.error("Please provide a directory path as an argument.");
  process.exit(1);
}

processGeoJSONFiles(inputDir);
