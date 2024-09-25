/** @format */

const fs = require("fs");
const path = require("path");

function extractPropertiesFromGeoJSON(inputFile) {
  const outputFileName =
    path.basename(inputFile, ".geojson") + "_properties.json";
  const writeStream = fs.createWriteStream(outputFileName);

  writeStream.write("{\n");

  fs.readFile(inputFile, "utf8", (err, data) => {
    if (err) {
      console.error(`Error reading file: ${err.message}`);
      return;
    }

    try {
      const geojson = JSON.parse(data);
      const features = geojson.features;

      if (!Array.isArray(features)) {
        console.error("Invalid GeoJSON: 'features' should be an array.");
        return;
      }

      let isFirstFeature = true;
      let chunkSize = 100;
      let featureBuffer = [];

      features.forEach((feature) => {
        if (feature && feature.properties) {
          const objectId = feature.properties.objectid;
          if (objectId !== undefined) {
            featureBuffer.push(
              `"${objectId}": ${JSON.stringify(feature.properties, null, 2)}`
            );

            if (featureBuffer.length >= chunkSize) {
              flushChunkToFile(writeStream, featureBuffer, isFirstFeature);
              isFirstFeature = false;
              featureBuffer = [];
            }
          }
        }
      });

      if (featureBuffer.length > 0) {
        flushChunkToFile(writeStream, featureBuffer, isFirstFeature);
      }
      writeStream.write("\n}");
      writeStream.end();
      console.log(`Properties successfully extracted to ${outputFileName}`);
    } catch (parseError) {
      console.error(`Error parsing GeoJSON: ${parseError.message}`);
    }
  });
}

function flushChunkToFile(writeStream, featureBuffer, isFirstFeature) {
  const chunk = featureBuffer.join(",\n");
  if (!isFirstFeature) {
    writeStream.write(",\n");
  }
  writeStream.write(chunk);
}

const inputFile = process.argv[2];

if (!inputFile) {
  console.error("Please provide a GeoJSON file as an argument.");
  process.exit(1);
}

extractPropertiesFromGeoJSON(inputFile);
