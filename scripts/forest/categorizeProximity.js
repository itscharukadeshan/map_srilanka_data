/** @format */

const fs = require("fs");
const path = require("path");

// Function to create a directory if it doesn't exist
const createDirIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Haversine formula to calculate the distance between two lat/lng points in kilometers
const haversineDistance = (coords1, coords2) => {
  const toRadians = (deg) => (deg * Math.PI) / 180;

  const lat1 = coords1[1];
  const lon1 = coords1[0];
  const lat2 = coords2[1];
  const lon2 = coords2[0];

  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Function to save categorized GeoJSON
const saveGeoJSON = (outputDir, filename, featureCollection) => {
  try {
    const filePath = path.join(outputDir, `${filename}.geojson`);

    createDirIfNotExists(outputDir);

    const geoJSONData = {
      type: "FeatureCollection",
      features: featureCollection,
    };

    // Write the GeoJSON file
    fs.writeFileSync(filePath, JSON.stringify(geoJSONData, null, 2));
    console.log(`File saved: ${filePath}`);
  } catch (error) {
    console.error(`Error writing file ${filename}: ${error.message}`);
  }
};

// Function to calculate proximity and categorize features
const categorizeByProximityAndForestType = (uncategorizedData, outputDir) => {
  const categorizedFeatures = {};

  uncategorizedData.features.forEach((feature) => {
    const description = feature.properties.description || "noForestType";

    if (feature.geometry) {
      const geometryType = feature.geometry.type;
      const pointCoords =
        geometryType === "Point" ? feature.geometry.coordinates : null;

      // Handle Point geometry
      if (pointCoords) {
        if (!categorizedFeatures[description]) {
          categorizedFeatures[description] = [];
        }

        const categorizedGroup = categorizedFeatures[description];
        let grouped = false;

        // Try to find proximity within an existing group
        for (let i = 0; i < categorizedGroup.length; i++) {
          const groupPointCoords = categorizedGroup[i][0].geometry.coordinates;
          const distance = haversineDistance(pointCoords, groupPointCoords);

          // If the distance is small (less than 5 km), group it together
          if (distance < 5) {
            categorizedGroup[i].push(feature);
            grouped = true;
            break;
          }
        }

        // If not grouped with existing points, create a new group
        if (!grouped) {
          categorizedGroup.push([feature]);
        }
      }
      // Handle MultiPolygon geometry
      else if (geometryType === "MultiPolygon") {
        if (!categorizedFeatures[description]) {
          categorizedFeatures[description] = [];
        }
        categorizedFeatures[description].push(feature);
      } else {
        console.warn(
          `Skipping feature with unsupported geometry type: ${geometryType}`
        );
      }
    }
  });

  // Save categorized files
  Object.keys(categorizedFeatures).forEach((forestType) => {
    categorizedFeatures[forestType].forEach((group, idx) => {
      const filename = `${forestType}_group_${idx + 1}`;
      saveGeoJSON(outputDir, filename, group);
    });
  });
};

// Main function to process all GeoJSON files in a directory
const processUncategorizedData = (inputDir, outputDir) => {
  try {
    const files = fs.readdirSync(inputDir);

    // Ensure the output directory exists
    createDirIfNotExists(outputDir);

    console.log(`Files in input directory: ${files}`);

    files.forEach((file) => {
      if (path.extname(file) === ".geojson") {
        const filePath = path.join(inputDir, file);
        const data = JSON.parse(fs.readFileSync(filePath));

        console.log(`Processing file: ${file}`);
        categorizeByProximityAndForestType(data, outputDir);
        console.log(`Processed file: ${file}`);
      } else {
        console.warn(`Skipping non-GeoJSON file: ${file}`);
      }
    });

    console.log("Proximity-based categorization complete.");
  } catch (error) {
    console.error(
      `Error reading or processing files in ${inputDir}: ${error.message}`
    );
  }
};

// Get input directory and output directory from command line arguments
const inputDir = process.argv[2];
const outputDir = process.argv[3] || "./FST/categorized_proximity";

if (!inputDir) {
  console.error("Please provide an input directory with GeoJSON files.");
  process.exit(1);
}

// Process all uncategorized data
processUncategorizedData(inputDir, outputDir);
