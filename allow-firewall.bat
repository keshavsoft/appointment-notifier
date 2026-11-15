@echo off
:: Batch script to allow Appointment Notifier ports in Windows Defender Firewall
echo Requesting administrator privileges...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Administrator privileges confirmed.
) else (
    echo Please right-click this file and choose "Run as administrator".
    pause
    exit /b 1
)

echo Adding Windows Firewall rules for Port 3001 and Port 3000...
netsh advfirewall firewall add rule name="CareCall Port 3001" dir=in action=allow protocol=TCP localport=3001 profile=any
netsh advfirewall firewall add rule name="CareCall Port 3000" dir=in action=allow protocol=TCP localport=3000 profile=any
netsh advfirewall firewall add rule name="CareCall Node.js" dir=in action=allow program="%ProgramFiles%\nodejs\node.exe" profile=any

echo Setting Wi-Fi network category to Private...
powershell -NoProfile -Command "Get-NetConnectionProfile | Where-Object { $_.InterfaceAlias -like '*Wi-Fi*' } | Set-NetConnectionProfile -NetworkCategory Private -ErrorAction SilentlyContinue"

echo.
echo ========================================================
echo SUCCESS: Ports 3001 and 3000 are now open in Windows Firewall!
echo Your Samsung TV can now connect to http://192.168.68.100:3001/v17/display/
echo ========================================================
pause
