#!/bin/bash

# Navigate to the root directory with your GeoJSON files
cd /home/charuka/Web_Dev/map_srilanka_data/v1/forest/geo_json

# Find all GeoJSON files matching the pattern recursively in all subdirectories
find . -type f -name 'fst_*_*_*.geojson' | while read file; do
  # Use 'basename' to get the filename without the path
  dir=$(dirname "$file")
  filename=$(basename -- "$file")

  # Remove '_somenumber' part from the filename
  newname=$(echo "$filename" | sed -E 's/(fst_[^_]+)_[^_]+(_[^_]+.geojson)/\1\2/')

  # If the new filename is different, rename the file
  if [[ "$filename" != "$newname" ]]; then
    echo "Renaming $file to $newname"
    mv "$file" "$dir/$newname"
  fi
done
