CREATE USER medplum WITH PASSWORD 'synthetic-local-only';
CREATE DATABASE medplum OWNER medplum;
-- The official image already creates database ur from POSTGRES_USER.
