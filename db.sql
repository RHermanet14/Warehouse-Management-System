--CREATE DATABASE cursortest;

-- Ensure account_id is at least 6 digits
DO $$
BEGIN
  -- Check if the 'account' table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'account'
  ) THEN

    -- Create custom type
    CREATE TYPE LOCATION AS (
      quantity INT,
      location VARCHAR(32)
    );

    -- Create tables
    CREATE TABLE account (
      email VARCHAR(32),
      password VARCHAR(32),
      account_type VARCHAR(32),
      PRIMARY KEY (email)
    );

    CREATE TABLE employee (
      account_id INT,
      first_name VARCHAR(32),
      last_name VARCHAR(32),
      email VARCHAR(32),
      phone_number VARCHAR(32),
      address VARCHAR(32),
      city VARCHAR(32),
      state VARCHAR(32),
      zip_code VARCHAR(32),
      position VARCHAR(32),
      PRIMARY KEY (account_id)
    );

    CREATE TABLE item (
      barcode_id VARCHAR(32),
      barcode_type VARCHAR(32),
      name VARCHAR(32),
      description VARCHAR(255),
      primary_location LOCATION,
      secondary_location LOCATION,
      total_quantity INT,
      PRIMARY KEY (barcode_id)
    );

    -- Insert initial data
    INSERT INTO item (barcode_id, barcode_type, name, primary_location, total_quantity) 
    VALUES ('817894024803', 'ean13', 'Sphere Push Pins', ROW(60, 'Bedroom')::LOCATION, 60);

    INSERT INTO item (barcode_id, barcode_type) VALUES ('1', 'ean13');

  END IF;
END$$;