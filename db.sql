CREATE DATABASE cursortest;

-- Ensure account_id is at least 6 digits
CREATE TABLE account(
    account_id SERIAL PRIMARY KEY CHECK (account_id >= 100000),
    name VARCHAR(32),
    email VARCHAR(32),
    password VARCHAR(32)
);

CREATE TYPE LOCATION AS (
  quantity INT,
  location VARCHAR(32),
);

CREATE TABLE item(
  barcode_id VARCHAR(32),
  barcode_type VARCHAR(32),
  name VARCHAR(32),
  description VARCHAR(255),
  primary_location LOCATION,
  secondary_location LOCATION,
  total_quantity INT,
  PRIMARY KEY (barcode_id)
);

insert into item (barcode_id, barcode_type, name, primary_location, total_quantity) 
values ('817894024803', 'ean13', 'Sphere Push Pins', ROW(60, 'Bedroom')::LOCATION, 60);

insert into item (barcode_id, barcode_type) values ('1', 'ean13');