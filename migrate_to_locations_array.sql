-- Migration script to convert from primary_location/secondary_location to locations array
-- Run this after you've already added the 'type' column to your LOCATION type

-- Step 1: Create backup of current data
CREATE TABLE item_backup AS SELECT * FROM item;

-- Step 2: Add the new locations array column
ALTER TABLE item ADD COLUMN locations LOCATION[];

-- Step 3: Migrate existing data to the array
UPDATE item 
SET locations = ARRAY[
  CASE WHEN primary_location IS NOT NULL 
    THEN ROW((primary_location).quantity, (primary_location).location, 'primary')::LOCATION 
    END,
  CASE WHEN secondary_location IS NOT NULL 
    THEN ROW((secondary_location).quantity, (secondary_location).location, 'secondary')::LOCATION 
    END
]
WHERE primary_location IS NOT NULL OR secondary_location IS NOT NULL;

-- Step 4: Drop the old columns
ALTER TABLE item DROP COLUMN primary_location;
ALTER TABLE item DROP COLUMN secondary_location;

-- Step 5: Verify the migration
-- Check that data was migrated correctly
SELECT 
  barcode_id,
  locations,
  array_length(locations, 1) as location_count
FROM item 
WHERE locations IS NOT NULL;

-- Test accessing the array elements
SELECT 
  barcode_id,
  (unnest(locations)).type as location_type,
  (unnest(locations)).location as location_name,
  (unnest(locations)).quantity as quantity
FROM item 
WHERE locations IS NOT NULL
ORDER BY barcode_id, location_type;

-- Step 6: Optional - Drop backup table after verification
-- DROP TABLE item_backup; 