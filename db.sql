--CREATE DATABASE cursortest;

-- Ensure account_id is at least 6 digits
DO $$
BEGIN
  -- Check if the 'account' table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'account'
  ) THEN

    -- Create area table
    CREATE TABLE area (
      area_id SERIAL PRIMARY KEY,
      name VARCHAR(32) UNIQUE NOT NULL
    );

    INSERT INTO area (name) VALUES
    ('Bedroom'),
    ('Kitchen'),
    ('Garage'),
    ('Basement'),
    ('Other');

    -- Create custom type LOCATION with area_id and bin
    CREATE TYPE LOCATION AS (
      quantity INT,
      bin VARCHAR(32),
      type VARCHAR(32),
      area_id INT
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

    -- Insert into account table
    INSERT INTO account (email, password, account_type)
    VALUES ('user@example.com', 'securepassword', 'admin');

    -- Insert into employee table
    INSERT INTO employee (
      account_id, first_name, last_name, email, phone_number, address, city, state, zip_code, position
    ) VALUES (
      123456, 'John', 'Doe', 'user@example.com', '555-1234', '123 Main St', 'Anytown', 'CA', '12345', 'Manager'
    );
    INSERT INTO employee (
      account_id, first_name, last_name, email, phone_number, address, city, state, zip_code, position
    ) VALUES (
      1, 'Example', 'Lastname', 'person@example.com', '123-1234', '123 Main St', 'Anytown', 'CA', '12345', 'Manager'
    );

    CREATE TABLE item (
      barcode_id VARCHAR(32),
      barcode_type VARCHAR(32),
      name VARCHAR(32),
      description VARCHAR(255),
      locations LOCATION[],
      total_quantity INT,
      PRIMARY KEY (barcode_id)
    );

    -- 1. Orders table
    CREATE TABLE orders (
      order_id SERIAL PRIMARY KEY,
      order_date TIMESTAMP DEFAULT NOW(),
      status VARCHAR(20) DEFAULT 'pending' NOT NULL,
      CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
    );

    -- 2. Order items table (join table)
    CREATE TABLE order_items (
      order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
      barcode_id VARCHAR(32) REFERENCES item(barcode_id),
      quantity INT NOT NULL,
      picked_quantity INT NOT NULL DEFAULT 0,
      PRIMARY KEY (order_id, barcode_id)
    );

    -- Insert example areas
    INSERT INTO area (name) VALUES
      ('Aisle 1'),
      ('Aisle 2'),
      ('Cold Storage'),
      ('Receiving'),
      ('Packing'),
      ('Shipping'),
      ('Overflow'),
      ('Mezzanine');

    -- Insert initial data with locations array (example)
    INSERT INTO item (barcode_id, barcode_type, name, locations, total_quantity) 
    VALUES ('817894024803', 'ean13', 'Sphere Push Pins', 
           ARRAY[ROW(60, 'Bin 1', 'primary', 1)::LOCATION], 60);

    INSERT INTO item (barcode_id, barcode_type) VALUES ('1', 'ean13');
    INSERT INTO item (barcode_id, barcode_type) VALUES ('2', 'ean13');

  END IF;
END$$;