#!/bin/bash

# Script to replace all mockUserId references with userId
# This is a comprehensive migration script

echo "🔄 Starting mockUserId → userId migration..."
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Counter
total_files=0
modified_files=0

# Function to replace in file
replace_in_file() {
  local file=$1
  local pattern=$2
  local replacement=$3
  
  if [[ -f "$file" ]]; then
    if grep -q "$pattern" "$file"; then
      sed -i "s/$pattern/$replacement/g" "$file"
      echo -e "${GREEN}✓${NC} Updated: $file"
      ((modified_files++))
    fi
  fi
}

# Function to process TypeScript/JavaScript files
process_files() {
  echo ""
  echo -e "${YELLOW}Processing API endpoints...${NC}"
  
  # Find all .ts and .tsx files in src directory
  while IFS= read -r -d '' file; do
    ((total_files++))
    
    # Replace mockUserId with userId in various contexts
    sed -i 's/mockUserId/userId/g' "$file"
    sed -i 's/studentMockId/studentId/g' "$file"
    sed -i 's/teacherMockId/teacherId/g' "$file"
    sed -i 's/studentMockIds/studentIds/g' "$file"
    sed -i 's/mock_user_id/user_id/g' "$file"
    sed -i 's/mock_id/id/g' "$file"
    
    if [[ $? -eq 0 ]]; then
      echo -e "${GREEN}✓${NC} Processed: $file"
      ((modified_files++))
    fi
    
  done < <(find src -type f \( -name "*.ts" -o -name "*.tsx" \) -print0)
}

# Confirm before proceeding
echo -e "${RED}⚠️  WARNING: This will modify multiple files!${NC}"
echo -e "${YELLOW}Make sure you have committed your changes or have a backup.${NC}"
read -p "Do you want to proceed? (yes/no): " confirm

if [[ "$confirm" != "yes" ]]; then
  echo "Migration cancelled."
  exit 0
fi

# Run the migration
process_files

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Migration completed!${NC}"
echo "Files processed: $total_files"
echo "Files modified: $modified_files"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the changes: git diff"
echo "2. Clear database and localStorage"
echo "3. Test registration and login"
echo "4. If issues found, revert: git checkout src/"
echo ""
