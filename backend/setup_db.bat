@echo off
echo ============================================
echo   Kravings - MySQL Database Setup
echo ============================================
echo.
echo This will create the kravings_db database and all tables.
echo Make sure MySQL is running before continuing.
echo.

set /p MYSQL_PASS=Enter your MySQL root password (press Enter if none): 

if "%MYSQL_PASS%"=="" (
    echo Running: mysql -u root  ^< schema.sql
    mysql -u root < schema.sql
) else (
    echo Running: mysql -u root -p  ^< schema.sql
    mysql -u root -p%MYSQL_PASS% < schema.sql
)

if errorlevel 1 (
    echo.
    echo ERROR: Could not connect to MySQL.
    echo Make sure MySQL is running and your password is correct.
    echo Also update MYSQL_PASSWORD in your .env file.
) else (
    echo.
    echo SUCCESS! Database created with sample data.
    echo Now update your .env file with the same password and run: run.bat
)
echo.
pause
