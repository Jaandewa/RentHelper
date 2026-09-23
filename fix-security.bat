@echo off
set PATH=%LOCALAPPDATA%\Programs\Git\bin;%PATH%
cd /d d:\software\RentHelper
git rm --cached .env
git rm --cached setup-database.bat
git rm --cached git-commit.bat
git rm --cached git-push.bat
git rm --cached hostgator-upload.php
git rm --cached liteSpeed-server.js 2>nul
echo .env >> .gitignore
echo setup-database.bat >> .gitignore
echo git-commit.bat >> .gitignore
echo git-push.bat >> .gitignore
echo hostgator-upload.php >> .gitignore
git add .gitignore
git commit -m "security: remove sensitive files from git tracking"
git push origin main
