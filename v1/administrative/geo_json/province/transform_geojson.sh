#!/bin/bash

# Directory containing your GeoJSON files
INPUT_DIR="./temp"
OUTPUT_DIR="./temp"

# Create the output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Loop through all GeoJSON files in the input directory
for file in "$INPUT_DIR"/*.geojson; do

  # Extract the base filename without extension
  filename=$(basename -- "$file")
  filename="${filename%.*}"

  # Use jq to transform the GeoJSON structure
  jq --arg name "$filename" '
  {
    "type": "FeatureCollection",
    "name": $name,
    "crs": { 
      "type": "name", 
      "properties": { 
        "name": "urn:ogc:def:crs:OGC:1.3:CRS84" 
      } 
    },
    "features": [
      {
        "type": "Feature",
        "properties": {
          "fid": .properties.fid,
          "objectid": .properties.objectid,
          "ds_division_name": .properties["province_name"], # Map the necessary properties accordingly
          "ds_division_code": .properties["province_code"],
          "district_name": .properties["description"], # Add mappings for any additional properties here
          "district_code": null,
          "province_name": .properties["province_name"],
          "province_code": .properties["province_code"],
          "adjusted_area": .properties["area_adjust"],
          "description": .properties["description"],
          "st_area(shape)": .properties["st_area(shape)"],
          "st_length(shape)": .properties["st_length(shape)"]
        },
        "geometry": .geometry
      }
    ]
  }' "$file" > "$OUTPUT_DIR/$filename.transformed.geojson"

done

echo "Transformation completed. Files saved to $OUTPUT_DIR"
