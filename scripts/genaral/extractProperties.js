/** @format */

const fs = require("fs");
const path = require("path");

function extractPropertiesFromGeoJSON(inputFile) {
  fs.readFile(inputFile, "utf8", (err, data) => {
    if (err) {
      console.error(`Error reading file: ${err.message}`);
      return;
    }

    let geojson;
    try {
      geojson = JSON.parse(data);
    } catch (err) {
      console.error(`Error parsing GeoJSON: ${err.message}`);
      return;
    }

    const propertiesCollection = {};

    geojson.features.forEach((feature) => {
      const objectId = feature.properties.objectid;
      if (objectId !== undefined) {
        propertiesCollection[objectId] = feature.properties;
      }
    });

    const outputFileName =
      path.basename(inputFile, ".geojson") + "_properties.json";

    fs.writeFile(
      outputFileName,
      JSON.stringify(propertiesCollection, null, 2),
      (err) => {
        if (err) {
          console.error(`Error writing file: ${err.message}`);
          return;
        }
        console.log(`Properties successfully extracted to ${outputFileName}`);
      }
    );
  });
}

const inputFile = process.argv[2];

if (!inputFile) {
  console.error("Please provide a GeoJSON file as an argument.");
  process.exit(1);
}

extractPropertiesFromGeoJSON(inputFile);
