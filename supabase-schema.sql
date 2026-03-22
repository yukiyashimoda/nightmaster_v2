-- Supabase Dashboard の SQL Editor で実行してください
-- nightmaster-v2 スキーマ定義

create table if not exists customers (
  id text primary key,
  name text not null,
  ruby text not null,
  nickname text not null default '',
  designated_cast_ids text[] not null default '{}',
  is_alert boolean not null default false,
  alert_reason text not null default '',
  memo text not null default '',
  linked_customer_ids text[] not null default '{}',
  is_favorite boolean not null default false,
  has_glass boolean not null default false,
  glass_memo text not null default '',
  receipt_names text[] not null default '{}',
  phone text not null default '',
  email text not null default '',
  last_visit_date text,
  updated_at text not null default '',
  updated_by text not null default ''
);

create table if not exists bottles (
  id text primary key,
  customer_id text not null,
  name text not null,
  remaining text not null,
  opened_date text not null
);

create table if not exists casts (
  id text primary key,
  name text not null,
  ruby text not null,
  memo text not null default '',
  updated_at text not null default '',
  updated_by text not null default ''
);

create table if not exists visit_records (
  id text primary key,
  customer_id text not null,
  visit_date text not null,
  designated_cast_ids text[] not null default '{}',
  in_store_cast_ids text[] not null default '{}',
  bottles_opened text[] not null default '{}',
  bottles_used text[] not null default '{}',
  memo text not null default '',
  is_alert boolean not null default false,
  alert_reason text not null default '',
  bottle_snapshots jsonb not null default '[]'
);

create table if not exists reservations (
  id text primary key,
  date text not null,
  time text not null,
  party_size integer not null default 1,
  has_designation boolean not null default false,
  designated_cast_ids text[] not null default '{}',
  is_accompanied boolean not null default false,
  accompanied_cast_ids text[] not null default '{}',
  customer_type text not null default 'existing',
  customer_ids text[] not null default '{}',
  guest_name text not null default '',
  price_type text not null default 'normal',
  party_plan_price integer,
  party_plan_minutes integer,
  phone text not null default '',
  memo text not null default '',
  is_visited boolean not null default false,
  updated_at text not null default '',
  updated_by text not null default ''
);
