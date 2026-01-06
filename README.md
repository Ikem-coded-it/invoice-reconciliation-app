

docker-compose up -d

I used FORCE ROW LEVEL SECURITY on the tables to ensure that even the application user (who owns the tables) is subject to the RLS policies. This prevents accidental data leaks even if the application has high privileges.