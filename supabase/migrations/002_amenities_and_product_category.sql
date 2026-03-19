-- Add amenity columns to shops
ALTER TABLE shops ADD COLUMN IF NOT EXISTS smoking_area boolean default false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS english_staff boolean default false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS delivery boolean default false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS card_payment boolean default false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS wifi boolean default false;

-- Add category and cbd strain type to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS category text check (category in ('flower','oil','edible','joint','cbd'));
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_strain_type_check;
ALTER TABLE products ADD CONSTRAINT products_strain_type_check CHECK (strain_type in ('indica','sativa','hybrid','cbd'));
