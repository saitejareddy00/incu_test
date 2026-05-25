-- Creates the app_test database on first container boot alongside the default app DB.
SELECT 'CREATE DATABASE app_test OWNER app'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'app_test')\gexec
