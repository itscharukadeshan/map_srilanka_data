/** @format */
const fs = require("fs");
const path = require("path");

function removeKeysAndNullsFromJSON(inputFile, keysToRemove) {
  const outputFileName = path.basename(inputFile, ".json") + "_updated.json";

  // Read the input file
  fs.readFile(inputFile, "utf8", (err, data) => {
    if (err) {
      console.error(`Error reading file: ${err.message}`);
      return;
    }

    // Parse the JSON content
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (parseErr) {
      console.error(`Error parsing JSON: ${parseErr.message}`);
      return;
    }

    // Recursively remove specified keys and null values from the JSON object
    const updatedData = removeKeysAndNullsFromObject(jsonData, keysToRemove);

    // Write the updated JSON data to a new file
    fs.writeFile(
      outputFileName,
      JSON.stringify(updatedData, null, 2),
      (writeErr) => {
        if (writeErr) {
          console.error(`Error writing file: ${writeErr.message}`);
          return;
        }

        console.log(`Updated file created: ${outputFileName}`);
      }
    );
  });
}

// Recursive function to remove specified keys and null values from an object
function removeKeysAndNullsFromObject(obj, keysToRemove) {
  if (Array.isArray(obj)) {
    return obj
      .map((item) => removeKeysAndNullsFromObject(item, keysToRemove))
      .filter((item) => item !== null && item !== undefined); // Filter out null values from arrays
  }

  if (typeof obj === "object" && obj !== null) {
    return Object.keys(obj).reduce((acc, key) => {
      const value = obj[key];
      // Only add the property if it's not in keysToRemove and not null
      if (!keysToRemove.includes(key) && value !== null) {
        acc[key] = removeKeysAndNullsFromObject(value, keysToRemove);
      }
      return acc;
    }, {});
  }

  return obj; // If it's not an object or array, return the value as is
}

// Get arguments from command line
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error(
    "Usage: node removeKeysAndNullValues.js <inputFile> <key1> <key2> ... <keyN>"
  );
  process.exit(1);
}

const inputFile = args[0];
const keysToRemove = args.slice(1);

// Run the function to remove keys and null values
removeKeysAndNullsFromJSON(inputFile, keysToRemove);
