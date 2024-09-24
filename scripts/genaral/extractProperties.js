/** @format */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

function extractPropertiesFromGeoJSON(inputFile) {
  const outputFileName =
    path.basename(inputFile, ".geojson") + "_properties.json";
  const writeStream = fs.createWriteStream(outputFileName);

  // Initialize the output JSON object
  writeStream.write("{\n");

  const lineReader = readline.createInterface({
    input: fs.createReadStream(inputFile),
    crlfDelay: Infinity,
  });

  let isFirstFeature = true;
  let chunkSize = 100; // Define how many features to write per chunk
  let featureBuffer = [];

  lineReader.on("line", (line) => {
    try {
      if (line.trim().startsWith('"features":')) {
        // Ignore the start of the features array
        return;
      }

      if (line.trim().endsWith("},")) {
        // This is part of a feature; extract properties and buffer them
        const feature = JSON.parse(line.trim().slice(0, -1)); // Remove trailing comma

        if (feature && feature.properties) {
          const objectId = feature.properties.objectid;
          if (objectId !== undefined) {
            featureBuffer.push(
              `"${objectId}": ${JSON.stringify(feature.properties, null, 2)}`
            );

            // Write chunk to the file once we reach the specified chunk size
            if (featureBuffer.length >= chunkSize) {
              flushChunkToFile(writeStream, featureBuffer, isFirstFeature);
              isFirstFeature = false;
              featureBuffer = []; // Clear the buffer
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error parsing line: ${err.message}`);
    }
  });

  lineReader.on("close", () => {
    // Write any remaining features in the buffer
    if (featureBuffer.length > 0) {
      flushChunkToFile(writeStream, featureBuffer, isFirstFeature);
    }

    // End the JSON object
    writeStream.write("\n}");
    writeStream.end();
    console.log(`Properties successfully extracted to ${outputFileName}`);
  });

  lineReader.on("error", (err) => {
    console.error(`Error reading file: ${err.message}`);
  });
}

// Helper function to flush the chunk buffer to the output file
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
