@echo off
set PATH=%LOCALAPPDATA%\Programs\Git\bin;%PATH%
cd /d d:\software\RentHelper
git config user.email "renthelper@example.com"
git config user.name "RentHelper"
git commit -m "initial-commit"
