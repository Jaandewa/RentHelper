@echo off
set PATH=%LOCALAPPDATA%\Programs\Git\bin;%PATH%
cd /d d:\software\RentHelper
git add -A
git commit -m "feat: admin setup page, remove standalone, add server actions origin"
git push origin main
