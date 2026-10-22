Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c cd /d ""C:\Users\LENOVO\Desktop\TECHNEXT CRM SOFT\aronium-agent"" && node sync-to-cloud.js", 0, False
