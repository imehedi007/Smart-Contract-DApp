#!/bin/bash

# Read video IDs from data.json
VALID_IDS=$(cat backend/data.json | python3 -c "import sys, json; data = json.load(sys.stdin); print(' '.join([v['id'] for v in data]))")

echo "Valid video IDs in data.json:"
echo "$VALID_IDS"
echo ""

# Check uploads folder
cd uploads
echo "Checking for orphaned files..."

for file in *.mp4 *.json 2>/dev/null; do
    if [ -f "$file" ]; then
        # Extract video ID from filename
        VIDEO_ID=$(echo "$file" | sed -E 's/(_annotated)?(_metadata)?\.(mp4|json)$//')
        
        # Check if this ID exists in data.json
        if ! echo "$VALID_IDS" | grep -q "$VIDEO_ID"; then
            echo "ORPHANED: $file (ID: $VIDEO_ID)"
            rm -f "$file"
            echo "  ✓ Deleted"
        fi
    fi
done

echo ""
echo "Cleanup complete!"
