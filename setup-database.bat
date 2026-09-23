@echo off
set /p DBPASS="Enter your Supabase Database Password: "

echo DATABASE_URL="postgresql://postgres.hjfoeldcwjdvtvziowgn:%DBPASS%@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true" > .env
echo DIRECT_URL="postgresql://postgres.hjfoeldcwjdvtvziowgn:%DBPASS%@aws-0-ap-south-1.pooler.supabase.com:5432/postgres" >> .env

echo .env created successfully!
call npx prisma generate
call npx prisma db push

echo Database tables created in Supabase!
pause
