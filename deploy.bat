@echo off
echo === Deploying Kokebok to GitHub ===
echo.

REM Check if git is initialized
if not exist ".git" (
    echo Initializing git repository...
    git init
    git branch -M main
)

REM Add all files
echo Adding files...
git add .

REM Commit
set /p message="Enter commit message (or press Enter for default): "
if "%message%"=="" set message=Update app

git commit -m "%message%"

REM Check if remote exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo.
    echo No remote found. Please enter your GitHub repository URL:
    echo Example: https://github.com/ThorsenH1/kokebok.git
    set /p repo="Repository URL: "
    git remote add origin %repo%
)

REM Push to GitHub
echo.
echo Pushing to GitHub...
git push -u origin main

echo.
echo === Done! ===
echo Your app will be available at: https://thorsenh1.github.io/kokebok/
echo (It may take a few minutes for GitHub Pages to update)
pause
