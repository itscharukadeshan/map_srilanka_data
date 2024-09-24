/** @format */

const fs = require("fs");
const path = require("path");

const createDirIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const saveGeoJSON = (outputDir, filename, feature) => {
  try {
    const filePath = path.join(outputDir, `${filename}.geojson`);

    createDirIfNotExists(outputDir);

    const geoJSONData = {
      type: "FeatureCollection",
      features: [feature],
    };

    fs.writeFileSync(filePath, JSON.stringify(geoJSONData, null, 2));
    console.log(`File saved: ${filePath}`);
  } catch (error) {
    console.error(`Error writing file ${filename}: ${error.message}`);
  }
};

const saveCombinedGeoJSON = (outputDir, filename, features) => {
  try {
    const filePath = path.join(outputDir, `${filename}.geojson`);

    const geoJSONData = {
      type: "FeatureCollection",
      features: features,
    };

    fs.writeFileSync(filePath, JSON.stringify(geoJSONData, null, 2));
    console.log(`Combined file saved: ${filePath}`);
  } catch (error) {
    console.error(`Error writing combined file ${filename}: ${error.message}`);
  }
};

const normalizeDistrict = (district) => {
  if (district && district.trim().toLowerCase() === "gall") {
    return "Galle";
  }
  return district;
};

const splitGeoJSON = (inputFile) => {
  try {
    const data = JSON.parse(fs.readFileSync(inputFile));

    const categorizedDir = "./FST/categorized";
    const uncategorizedDir = "./FST/uncategorized";

    createDirIfNotExists(categorizedDir);
    createDirIfNotExists(uncategorizedDir);

    const districtForestTypeFeatures = {};
    const districtFeatures = {};

    data.features.forEach((feature) => {
      let district = feature.properties.district?.trim() || null;
      district = normalizeDistrict(district);

      const description = feature.properties.description || "noForestType";
      const gfcode = feature.properties.gfcode?.trim() || null;
      const objectid = feature.properties.objectid || null;

      if (district && gfcode && objectid) {
        const filename = `FST_${district}_${gfcode}_${objectid}`;

        const districtDir = path.join(categorizedDir, district);
        const forestTypeDir = path.join(districtDir, description);
        createDirIfNotExists(forestTypeDir);

        saveGeoJSON(forestTypeDir, filename, feature);

        const districtKey = `${district}_${description}`;
        if (!districtForestTypeFeatures[districtKey]) {
          districtForestTypeFeatures[districtKey] = [];
        }
        districtForestTypeFeatures[districtKey].push(feature);

        if (!districtFeatures[district]) {
          districtFeatures[district] = [];
        }
        districtFeatures[district].push(feature);
      } else {
        const filename = `FST_${gfcode || "noGFCode"}_${objectid || "noID"}`;
        saveGeoJSON(uncategorizedDir, filename, feature);
      }
    });

    Object.keys(districtForestTypeFeatures).forEach((districtKey) => {
      const [district, description] = districtKey.split("_");

      const districtDir = path.join(categorizedDir, district);
      const forestTypeDir = path.join(districtDir, description);

      saveCombinedGeoJSON(
        forestTypeDir,
        `FST_${district}_${description}_combined`,
        districtForestTypeFeatures[districtKey]
      );
    });

    Object.keys(districtFeatures).forEach((district) => {
      const districtDir = path.join(categorizedDir, district);

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

const inputFile = process.argv[2];
if (!inputFile) {
  console.error("Please provide an input GeoJSON file.");
  process.exit(1);
}

splitGeoJSON(inputFile);
