/** @format */

const fs = require("fs");
const path = require("path");

const inputDir = process.argv[2];
const keysToRemove = process.argv.slice(3);

if (!inputDir || keysToRemove.length === 0) {
  console.error(
    "Usage: node removeKeys.js <inputDir> <keyToRemove1> <keyToRemove2> ..."
  );
  process.exit(1);
}

const outputDir = `${inputDir}_update`;
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const updateGeoJSON = (filePath) => {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  data.features.forEach((feature) => {
    keysToRemove.forEach((key) => {
      delete feature.properties[key];
    });

    for (const prop in feature.properties) {
      if (feature.properties[prop] === null) {
        feature.properties[prop] = undefined;
      }
    }
  });

  const fileName = path.basename(filePath);
  fs.writeFileSync(
    path.join(outputDir, fileName),
    JSON.stringify(data, null, 2)
  );
};

fs.readdirSync(inputDir).forEach((file) => {
  const filePath = path.join(inputDir, file);
  if (path.extname(file) === ".geojson") {
    updateGeoJSON(filePath);
    console.log(`Processed: ${file}`);
  }
});
