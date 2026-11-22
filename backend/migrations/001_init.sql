CREATE SEQUENCE wish_number_seq;

CREATE TABLE wishes (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  number integer NOT NULL UNIQUE DEFAULT nextval('wish_number_seq'),
  name varchar(30) NOT NULL,
  workplace text NOT NULL CHECK (workplace IN ('apt', 'fil', 'off', 'log', 'reg')),
  city varchar(30),
  text varchar(500) NOT NULL,
  text_normalized text NOT NULL,
  flavor text NOT NULL CHECK (flavor IN ('V', 'B', 'C', 'G')),
  lang text NOT NULL CHECK (lang IN ('ru', 'kk')),
  author_token_hash char(64) NOT NULL,
  ip_hash char(64) NOT NULL,
  status text NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER SEQUENCE wish_number_seq OWNED BY wishes.number;

CREATE INDEX wishes_status_number_idx ON wishes (status, number DESC);
CREATE INDEX wishes_workplace_status_number_idx ON wishes (workplace, status, number DESC);
CREATE INDEX wishes_ip_created_idx ON wishes (ip_hash, created_at);
CREATE UNIQUE INDEX wishes_author_text_unique_idx ON wishes (lower(name), workplace, text_normalized) WHERE status <> 'deleted';

CREATE TABLE reports (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wish_id integer NOT NULL REFERENCES wishes (id) ON DELETE CASCADE,
  ip_hash char(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wish_id, ip_hash)
);

CREATE TABLE settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_open boolean NOT NULL DEFAULT true,
  closes_at timestamptz DEFAULT '2026-11-24 23:59:00+05',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO settings (id) VALUES (1);
