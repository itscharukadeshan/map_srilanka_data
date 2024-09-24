/** @format */

const fs = require("fs");
const path = require("path");

const createDirIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const haversineDistance = (coords1, coords2) => {
  const toRadians = (deg) => (deg * Math.PI) / 180;

  const lat1 = coords1[1];
  const lon1 = coords1[0];
  const lat2 = coords2[1];
  const lon2 = coords2[0];

  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const saveGeoJSON = (outputDir, filename, featureCollection) => {
  try {
    const filePath = path.join(outputDir, `${filename}.geojson`);

    createDirIfNotExists(outputDir);

    const geoJSONData = {
      type: "FeatureCollection",
      features: featureCollection,
    };

    fs.writeFileSync(filePath, JSON.stringify(geoJSONData, null, 2));
    console.log(`File saved: ${filePath}`);
  } catch (error) {
    console.error(`Error writing file ${filename}: ${error.message}`);
  }
};

const categorizeByProximityAndForestType = (uncategorizedData, outputDir) => {
  const categorizedFeatures = {};

  uncategorizedData.features.forEach((feature) => {
    const description = feature.properties.description || "noForestType";

    if (feature.geometry) {
      const geometryType = feature.geometry.type;
      const pointCoords =
        geometryType === "Point" ? feature.geometry.coordinates : null;

      if (pointCoords) {
        if (!categorizedFeatures[description]) {
          categorizedFeatures[description] = [];
        }

        const categorizedGroup = categorizedFeatures[description];
        let grouped = false;

        for (let i = 0; i < categorizedGroup.length; i++) {
          const groupPointCoords = categorizedGroup[i][0].geometry.coordinates;
          const distance = haversineDistance(pointCoords, groupPointCoords);

          if (distance < 5) {
            categorizedGroup[i].push(feature);
            grouped = true;
            break;
          }
        }

        if (!grouped) {
          categorizedGroup.push([feature]);
        }
      } else if (geometryType === "MultiPolygon") {
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

  Object.keys(categorizedFeatures).forEach((forestType) => {
    categorizedFeatures[forestType].forEach((group, idx) => {
      const filename = `${forestType}_group_${idx + 1}`;
      saveGeoJSON(outputDir, filename, group);
    });
  });
};

const processUncategorizedData = (inputDir, outputDir) => {
  try {
    const files = fs.readdirSync(inputDir);

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

const inputDir = process.argv[2];
const outputDir = process.argv[3] || "./FST/categorized_proximity";

if (!inputDir) {
  console.error("Please provide an input directory with GeoJSON files.");
  process.exit(1);
}

processUncategorizedData(inputDir, outputDir);
