-- Enable PostGIS
create extension if not exists postgis;

-- Shops
create table shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_th text,
  description text,
  address text not null,
  city text default 'Bangkok',
  lat float8 not null,
  lng float8 not null,
  location geography(point, 4326),
  phone text,
  website text,
  instagram text,
  opening_hours jsonb,
  price_range int check (price_range between 1 and 3),
  is_verified bool default false,
  is_premium bool default false,
  created_at timestamptz default now()
);

-- Auto-update location from lat/lng
create or replace function update_shop_location()
returns trigger as $$
begin
  new.location = st_point(new.lng, new.lat)::geography;
  return new;
end;
$$ language plpgsql;

create trigger shop_location_trigger
before insert or update on shops
for each row execute function update_shop_location();

-- Spatial index
create index shops_location_idx on shops using gist(location);

-- Shop images
create table shop_images (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  url text not null,
  is_primary bool default false,
  created_at timestamptz default now()
);

-- Products (menu)
create table products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  name text not null,
  strain_type text check (strain_type in ('indica','sativa','hybrid')),
  thc_percent float4,
  price_thb int,
  in_stock bool default true,
  created_at timestamptz default now()
);

-- Reviews
create table reviews (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  rating int check (rating between 1 and 5),
  body text,
  is_flagged bool default false,
  created_at timestamptz default now()
);

-- Bookmarks
create table bookmarks (
  user_id uuid references auth.users(id) on delete cascade,
  shop_id uuid references shops(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, shop_id)
);

-- Shop owners
create table shop_owners (
  shop_id uuid references shops(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  plan text default 'free' check (plan in ('free','premium')),
  plan_expires_at timestamptz,
  primary key (shop_id, user_id)
);

-- Nearby shops function
create or replace function nearby_shops(
  lat float, lng float, radius_km float default 5
)
returns setof shops as $$
begin
  return query
  select * from shops
  where st_dwithin(
    location,
    st_point(lng, lat)::geography,
    radius_km * 1000
  )
  order by location <-> st_point(lng, lat)::geography;
end;
$$ language plpgsql;

-- RLS
alter table shops enable row level security;
alter table reviews enable row level security;
alter table bookmarks enable row level security;
alter table shop_owners enable row level security;

-- Policies
create policy "shops are public" on shops for select using (true);
create policy "users manage own reviews" on reviews
  for all using (auth.uid() = user_id);
create policy "users manage own bookmarks" on bookmarks
  for all using (auth.uid() = user_id);

-- Insert test data (Bangkok shops)
insert into shops (name, name_th, description, address, city, lat, lng, price_range, is_verified, is_premium) values
('Mary Jane Bangkok', 'แมรี่ เจน', 'Premium cannabis dispensary in Sukhumvit', '23 Sukhumvit Soi 11, Bangkok', 'Bangkok', 13.7440, 100.5570, 2, true, true),
('High Society', 'ไฮ โซไซตี้', 'Chill dispensary near Silom', '88 Silom Rd, Bangkok', 'Bangkok', 13.7274, 100.5347, 3, true, false),
('Green Zone', 'กรีน โซน', 'Affordable and friendly staff', '45 Khao San Rd, Bangkok', 'Bangkok', 13.7589, 100.4977, 1, false, false);
