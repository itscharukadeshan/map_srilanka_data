/** @format */

const fs = require("fs");

// Function to remove duplicates and simplify the JSON structure
function simplifyData(data) {
  const cleanedData = [];

  // Stats tracker
  const stats = {
    totalEntries: 0,
    completeEntries: 0,
    missingSinhalaNames: 0,
    missingTamilNames: 0,
    missingCoordinates: 0,
    missingAdministrativeData: 0,
  };

  // Check if data is an array or an object
  if (Array.isArray(data)) {
    data.forEach((entry) => {
      processEntry(entry, cleanedData, stats);
    });
  } else if (typeof data === "object") {
    Object.values(data).forEach((entry) => {
      processEntry(entry, cleanedData, stats);
    });
  } else {
    console.error("Unexpected JSON format.");
    process.exit(1);
  }

  return { cleanedData, stats };
}

// Function to process each entry
function processEntry(entry, cleanedData, stats) {
  stats.totalEntries++;

  const {
    unique_id,
    name_tl_si,
    snme_s1,
    snme_t1,
    snme_t2,
    gnd_name,
    gnd_n,
    x_coordina,
    y_coordina,
    province_n,
    district_n,
    dsd_n,
    type,
    gnd_no,
  } = entry;

  // Normalize names (remove duplicates, choose the most frequent, keep variations)
  const sinhalaNames = getUniqueNames([name_tl_si, gnd_name, gnd_n, snme_s1]);
  const tamilNames = getUniqueNames([snme_t1, snme_t2]);

  // Check if important fields are missing and track stats
  let entryIsComplete = true;

  if (sinhalaNames.length === 0) {
    stats.missingSinhalaNames++;
    entryIsComplete = false;
  }

  if (tamilNames.length === 0) {
    stats.missingTamilNames++;
    entryIsComplete = false;
  }

  if (!x_coordina || !y_coordina) {
    stats.missingCoordinates++;
    entryIsComplete = false;
  }

  if (!province_n || !district_n || !dsd_n || !type) {
    stats.missingAdministrativeData++;
    entryIsComplete = false;
  }

  if (entryIsComplete) {
    stats.completeEntries++;
  }

  // Create a simplified object
  const simplifiedEntry = {
    unique_id,
    sinhalaNames: sinhalaNames.slice(0, 2), // Allow up to 2 alternatives
    tamilNames: tamilNames.slice(0, 2), // Allow up to 2 alternatives
    coordinates: {
      x: x_coordina,
      y: y_coordina,
    },
    province: province_n,
    district: district_n,
    dsd: dsd_n,
    gnd_no: gnd_no,
    type: type,
  };

  cleanedData.push(simplifiedEntry);
}

// Helper function to filter and get unique names
function getUniqueNames(names) {
  // Filter out empty or null names, trim whitespace, and remove duplicates
  const filteredNames = names.filter((name) => name && name.trim() !== "");
  return [...new Set(filteredNames.map((name) => name.trim()))];
}

// Main function to process the file
function processFile(inputFile) {
  // Read the input JSON file
  const rawData = fs.readFileSync(inputFile, "utf8");

  try {
    const data = JSON.parse(rawData); // Parse the input JSON

    // Simplify the data and gather statistics
    const { cleanedData, stats } = simplifyData(data);

    // Output the simplified data to a new file
    const outputFileName = inputFile.replace(".json", "_simplified.json");
    fs.writeFileSync(outputFileName, JSON.stringify(cleanedData, null, 2));

    // Output the stats
    console.log(`Simplified data written to ${outputFileName}`);
    console.log(`--- Data Stats ---`);
    console.log(`Total Entries: ${stats.totalEntries}`);
    console.log(`Complete Entries: ${stats.completeEntries}`);
    console.log(`Missing Sinhala Names: ${stats.missingSinhalaNames}`);
    console.log(`Missing Tamil Names: ${stats.missingTamilNames}`);
    console.log(`Missing Coordinates: ${stats.missingCoordinates}`);
    console.log(
      `Missing Administrative Data: ${stats.missingAdministrativeData}`
    );
  } catch (error) {
    console.error("Error parsing JSON file:", error.message);
  }
}

const args = process.argv.slice(2);

if (args.length < 1) {
  console.error("Usage: node simplifyJsonData.js <inputFile.json>");
  process.exit(1);
}

const inputFile = args[0];
processFile(inputFile);
