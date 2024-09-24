/** @format */

const fs = require("fs");
const path = require("path");

// Function to get all GeoJSON files in a directory (and optionally its subdirectories)
function getGeoJSONFiles(dir, recursive) {
  let results = [];

  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      if (recursive) {
        results = results.concat(getGeoJSONFiles(filePath, recursive)); // Recurse into subdirectory if recursive is true
      }
    } else if (file.endsWith(".geojson")) {
      results.push(filePath); // Add GeoJSON file to results
    }
  });

  return results;
}

// Function to combine GeoJSON files into one GeoJSON file
function combineGeoJSON(inputDir, outputFileName, recursive) {
  const geojsonFiles = getGeoJSONFiles(inputDir, recursive);

  if (geojsonFiles.length === 0) {
    console.error(
      "No GeoJSON files found in the specified directory (or its subdirectories if enabled)."
    );
    return;
  }

  const combinedFeatures = [];

  geojsonFiles.forEach((file) => {
    const geojsonData = JSON.parse(fs.readFileSync(file, "utf-8"));

    if (geojsonData.type === "FeatureCollection" && geojsonData.features) {
      combinedFeatures.push(...geojsonData.features);
    } else {
      console.warn(`File ${file} is not a valid FeatureCollection.`);
    }
  });

  const combinedGeoJSON = {
    type: "FeatureCollection",
    features: combinedFeatures,
  };

  fs.writeFileSync(outputFileName, JSON.stringify(combinedGeoJSON, null, 2));
  console.log(`Combined GeoJSON written to: ${outputFileName}`);
}

// Main function to handle command-line arguments
function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      "Usage: node combineGeoJSON.js <inputDir> <outputFileName> [--recursive]"
    );
    return;
  }

  const inputDir = args[0];
  const outputFileName = args[1];
  const recursive = args.includes("--recursive");

  if (!fs.existsSync(inputDir)) {
    console.error(`Directory "${inputDir}" not found.`);
    return;
  }

  combineGeoJSON(inputDir, outputFileName, recursive);
}

main();
