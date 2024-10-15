#!/bin/bash

# Set the base directory containing the nested directories with GeoJSON files
base_dir="/home/charuka/Web_Dev/map_srilanka_data/v1"

# Function to rename files in the given directory
rename_files() {
    local dir="$1"
    # Iterate over all GeoJSON files in the directory
    for file in "$dir"/*.geojson; do
        # Check if the file exists to avoid errors with empty directories
        if [[ -f "$file" ]]; then
            # Get the directory path and the original filename
            local filename=$(basename "$file")
            local dirname=$(dirname "$file")

            # Remove trailing spaces and convert to lowercase
            local new_filename=$(echo "$filename" | sed 's/[[:space:]]\+$//' | tr '[:upper:]' '[:lower:]' | tr ' ' '_')

            # Construct the full new file path
            local new_file_path="$dirname/$new_filename"

            # Rename the file if the new filename is different
            if [[ "$file" != "$new_file_path" ]]; then
                mv "$file" "$new_file_path"
                echo "Renamed: '$file' to '$new_file_path'"
            fi
        fi
    done

    # Recursively call the function for subdirectories
    for subdir in "$dir"/*/; do
        if [[ -d "$subdir" ]]; then
            rename_files "$subdir"
        fi
    done
}

# Start renaming files from the base directory
rename_files "$base_dir"

echo "Renaming completed."
