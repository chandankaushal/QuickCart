const sql = `
CREATE EXTENSION IF NOT EXISTS citext;
CREATE TYPE valid_roles AS ENUM ('admin','user')
CREATE TABLE "quickcart".users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email CITEXT UNIQUE NOT NULL CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
	password TEXT NOT NULL,
	CREATED_AT TIMESTAMP DEFAULT NOW(),
	ROLE valid_roles DEFAULT 'user'
);`;
