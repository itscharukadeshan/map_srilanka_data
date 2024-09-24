/** @format */

const fs = require("fs");
const readline = require("readline");
const cliProgress = require("cli-progress");

// Function to process GeoJSON in chunks
function splitGeoJSON(inputFile, numberOfParts) {
  const rl = readline.createInterface({
    input: fs.createReadStream(inputFile),
    crlfDelay: Infinity,
  });

  let buffer = "";
  let featureCollection = null;
  let featureCount = 0;
  let totalBytesRead = 0;

  const stats = fs.statSync(inputFile);
  const totalFileSize = stats.size; // Get the total file size in bytes

  // Progress bar setup
  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(totalFileSize, 0); // Start progress bar with total size

  rl.on("line", (line) => {
    totalBytesRead += Buffer.byteLength(line); // Track total bytes read
    progressBar.update(totalBytesRead); // Update the progress bar

    buffer += line;

    // Attempt to parse a feature
    try {
      const jsonLine = JSON.parse(buffer);
      if (jsonLine.type === "FeatureCollection") {
        featureCollection = jsonLine;
        featureCount = jsonLine.features.length;
        const featuresPerPart = Math.ceil(featureCount / numberOfParts);

        // Split features into parts and write to separate files
        for (let i = 0; i < numberOfParts; i++) {
          const start = i * featuresPerPart;
          const end = Math.min((i + 1) * featuresPerPart, featureCount);
          const partFeatures = featureCollection.features.slice(start, end);

          // Write each part to a new file
          const outputFileName = `${inputFile}_part${i + 1}.geojson`;
          fs.writeFileSync(
            outputFileName,
            JSON.stringify(
              {
                ...featureCollection,
                features: partFeatures,
              },
              null,
              2
            )
          );
          console.log(
            `Created file: ${outputFileName} with ${end - start} features.`
          );
        }
      }
      buffer = "";
    } catch (e) {
      // Keep buffering until the JSON can be parsed
    }
  });

  rl.on("close", () => {
    progressBar.update(totalFileSize); // Ensure progress bar completes fully
    progressBar.stop(); // Stop the progress bar when done
    console.log("Finished processing the GeoJSON file.");
  });
}

// Main function to handle command-line arguments
function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: node splitGeoJSON.js <inputFile> <numberOfParts>");
    return;
  }

  const inputFile = args[0];
  const numberOfParts = parseInt(args[1], 10);

  if (isNaN(numberOfParts) || numberOfParts < 1) {
    console.error("Number of parts must be a valid number greater than 0.");
    return;
  }

  splitGeoJSON(inputFile, numberOfParts);
}

main();
