/** @format */

const fs = require("fs");
const path = require("path");

const createDirIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const combineGeoJSONFeatures = (geoJSONFiles) => {
  const combinedFeatures = [];

  geoJSONFiles.forEach((file) => {
    const data = JSON.parse(fs.readFileSync(file));
    if (data.features) {
      combinedFeatures.push(...data.features);
    }
  });

  return {
    type: "FeatureCollection",
    features: combinedFeatures,
  };
};

const organizeAndCombineGeoJSONFiles = (inputDir) => {
  try {
    const files = fs.readdirSync(inputDir);

    const uncategorizedDir = path.join(inputDir, "uncategorized");
    createDirIfNotExists(uncategorizedDir);

    const combinedData = {};

    files.forEach((file) => {
      if (path.extname(file) === ".geojson") {
        const filePath = path.join(inputDir, file);
        let data;

        try {
          data = JSON.parse(fs.readFileSync(filePath));
        } catch (error) {
          console.error(
            `Error reading or parsing file ${file}: ${error.message}`
          );

          fs.renameSync(filePath, path.join(uncategorizedDir, file));
          return;
        }

        const dsDivisionName =
          data.features[0]?.properties?.ds_division_name ||
          "unknown_ds_division";
        const districtName =
          data.features[0]?.properties?.district_name || "unknown_district";
        const provinceName =
          data.features[0]?.properties?.province_name || "unknown_province";

        const capitalizedDsDivisionName = capitalizeFirstLetter(dsDivisionName);
        const capitalizedDistrictName = capitalizeFirstLetter(districtName);
        const capitalizedProvinceName = capitalizeFirstLetter(provinceName);

        const outputDir = path.join(
          inputDir,
          capitalizedProvinceName,
          capitalizedDistrictName,
          capitalizedDsDivisionName
        );
        createDirIfNotExists(outputDir);

        const newFilePath = path.join(outputDir, file);
        fs.renameSync(filePath, newFilePath);
        console.log(`Moved file ${file} to ${outputDir}`);

        const combinedKey = `${capitalizedProvinceName}_${capitalizedDistrictName}`;
        const dsDivisionKey = `${capitalizedProvinceName}_${capitalizedDistrictName}_${capitalizedDsDivisionName}`;

        if (!combinedData[combinedKey]) {
          combinedData[combinedKey] = [];
        }
        if (!combinedData[dsDivisionKey]) {
          combinedData[dsDivisionKey] = [];
        }

        combinedData[combinedKey].push(newFilePath);
        combinedData[dsDivisionKey].push(newFilePath);
      } else {
        console.warn(`Skipping non-GeoJSON file: ${file}`);
      }
    });

    Object.keys(combinedData).forEach((key) => {
      const [province, district, dsDivision] = key.split("_");
      const combinedFilePath = path.join(
        inputDir,
        province,
        district,
        dsDivision
          ? dsDivision + "_combined.geojson"
          : district + "_combined.geojson"
      );

      const combinedGeoJSON = combineGeoJSONFeatures(combinedData[key]);
      fs.writeFileSync(
        combinedFilePath,
        JSON.stringify(combinedGeoJSON, null, 2)
      );
      console.log(`Created combined file: ${combinedFilePath}`);
    });

    Object.keys(combinedData).forEach((key) => {
      const [province, district] = key.split("_");
      const combinedFilePath = path.join(
        inputDir,
        province,
        district,
        district + "_combined.geojson"
      );

      const districtCombinedGeoJSON = combineGeoJSONFeatures(combinedData[key]);
      fs.writeFileSync(
        combinedFilePath,
        JSON.stringify(districtCombinedGeoJSON, null, 2)
      );
      console.log(`Created district combined file: ${combinedFilePath}`);
    });

    console.log("Organization and combination of GeoJSON files complete.");
  } catch (error) {
    console.error(`Error processing files in ${inputDir}: ${error.message}`);
  }
};

const inputDir = process.argv[2];

if (!inputDir) {
  console.error("Please provide an input directory containing GeoJSON files.");
  process.exit(1);
}

organizeAndCombineGeoJSONFiles(inputDir);
