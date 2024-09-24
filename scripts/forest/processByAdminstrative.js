/** @format */

const fs = require("fs");
const path = require("path");

// Function to create a directory if it doesn't exist
const createDirIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Function to save GeoJSON feature to a file with error logging
const saveGeoJSON = (outputDir, filename, feature) => {
  try {
    const filePath = path.join(outputDir, `${filename}.geojson`);

    // Ensure the directory exists before writing the file
    createDirIfNotExists(outputDir);

    const geoJSONData = {
      type: "FeatureCollection",
      features: [feature],
    };

    // Write the GeoJSON file
    fs.writeFileSync(filePath, JSON.stringify(geoJSONData, null, 2));
    console.log(`File saved: ${filePath}`);
  } catch (error) {
    // Log error instead of stopping the script
    console.error(`Error writing file ${filename}: ${error.message}`);
  }
};

// Function to save combined GeoJSON for a group of features
const saveCombinedGeoJSON = (outputDir, filename, features) => {
  try {
    const filePath = path.join(outputDir, `${filename}.geojson`);

    const geoJSONData = {
      type: "FeatureCollection",
      features: features,
    };

    // Write the combined GeoJSON file
    fs.writeFileSync(filePath, JSON.stringify(geoJSONData, null, 2));
    console.log(`Combined file saved: ${filePath}`);
  } catch (error) {
    // Log error instead of stopping the script
    console.error(`Error writing combined file ${filename}: ${error.message}`);
  }
};

// Normalize district names to treat "Gall" and "Galle" as the same district
const normalizeDistrict = (district) => {
  if (district && district.trim().toLowerCase() === "gall") {
    return "Galle";
  }
  return district;
};

// Main function to split the GeoJSON into individual and combined files
const splitGeoJSON = (inputFile) => {
  try {
    const data = JSON.parse(fs.readFileSync(inputFile));

    // Base output directories
    const categorizedDir = "./FST/categorized";
    const uncategorizedDir = "./FST/uncategorized";

    createDirIfNotExists(categorizedDir);
    createDirIfNotExists(uncategorizedDir);

    // Object to hold features by district and forest type for combined files
    const districtForestTypeFeatures = {};
    const districtFeatures = {};

    data.features.forEach((feature) => {
      let district = feature.properties.district?.trim() || null;
      district = normalizeDistrict(district); // Normalize district name

      const description = feature.properties.description || "noForestType";
      const gfcode = feature.properties.gfcode?.trim() || null;
      const objectid = feature.properties.objectid || null;

      // Check if all fields are available for proper categorization
      if (district && gfcode && objectid) {
        // Construct the filename
        const filename = `FST_${district}_${gfcode}_${objectid}`;

        // Create a directory based on the district and forest type
        const districtDir = path.join(categorizedDir, district);
        const forestTypeDir = path.join(districtDir, description);
        createDirIfNotExists(forestTypeDir);

        // Save the individual file to the correct district-forest type directory
        saveGeoJSON(forestTypeDir, filename, feature);

        // Add the feature to the district and forest type for combined file
        const districtKey = `${district}_${description}`;
        if (!districtForestTypeFeatures[districtKey]) {
          districtForestTypeFeatures[districtKey] = [];
        }
        districtForestTypeFeatures[districtKey].push(feature);

        // Add the feature to the overall district collection
        if (!districtFeatures[district]) {
          districtFeatures[district] = [];
        }
        districtFeatures[district].push(feature);
      } else {
        // If any key value is missing, put it in the uncategorized folder
        const filename = `FST_${gfcode || "noGFCode"}_${objectid || "noID"}`;
        saveGeoJSON(uncategorizedDir, filename, feature);
      }
    });

    // After processing all features, create combined files for each district and forest type
    Object.keys(districtForestTypeFeatures).forEach((districtKey) => {
      const [district, description] = districtKey.split("_");

      // Combine files for each forest type within the district
      const districtDir = path.join(categorizedDir, district);
      const forestTypeDir = path.join(districtDir, description);

      // Save the combined file for this forest type in its directory
      saveCombinedGeoJSON(
        forestTypeDir,
        `FST_${district}_${description}_combined`,
        districtForestTypeFeatures[districtKey]
      );
    });

    // Create a combined file for each district in the root of the district folder (without forest type in path)
    Object.keys(districtFeatures).forEach((district) => {
      const districtDir = path.join(categorizedDir, district);

      // Save the combined district file in the district directory (without forest type)
      saveCombinedGeoJSON(
        districtDir,
        `FST_${district}_combined`,
        districtFeatures[district]
      );
    });

    console.log("GeoJSON splitting and combining complete.");
  } catch (error) {
    console.error(
      `Error reading or processing file ${inputFile}: ${error.message}`
    );
  }
};

// Get input file from command line arguments
const inputFile = process.argv[2];
if (!inputFile) {
  console.error("Please provide an input GeoJSON file.");
  process.exit(1);
}

// Call the function to split GeoJSON
splitGeoJSON(inputFile);
