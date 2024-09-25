/** @format */

const fs = require("fs");
const path = require("path");

// Function to combine two JSON objects by merging all fields
function combineJsonFiles(json1, json2) {
  const combinedData = {};

  // Get all the unique keys from both JSON objects
  const combinedKeys = new Set([...Object.keys(json1), ...Object.keys(json2)]);

  // Merge fields for each object based on the unique keys
  combinedKeys.forEach((key) => {
    const entry1 = json1[key] || {};
    const entry2 = json2[key] || {};

    // Merge all fields from both entries
    combinedData[key] = {
      ...entry1,
      ...entry2,
    };
  });

  return combinedData;
}

// Main function to read the input files, process, and write the output
function processAndCombineFiles(inputFile1, inputFile2) {
  const json1 = JSON.parse(fs.readFileSync(inputFile1, "utf8"));
  const json2 = JSON.parse(fs.readFileSync(inputFile2, "utf8"));

  const combinedData = combineJsonFiles(json1, json2);

  // Generate the output filename
  const outputFileName = path.basename(inputFile1, ".json") + "_combined.json";

  // Write the combined JSON data to a file
  fs.writeFileSync(outputFileName, JSON.stringify(combinedData, null, 2));
  console.log(`Combined file written to ${outputFileName}`);
}

// Get input file paths from command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error(
    "Usage: node combineJsonFilesWithAllFields.js <inputFile1.json> <inputFile2.json>"
  );
  process.exit(1);
}

const inputFile1 = args[0];
const inputFile2 = args[1];

processAndCombineFiles(inputFile1, inputFile2);
