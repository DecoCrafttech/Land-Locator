# Run in Administrator PowerShell once to permit phones on the same private LAN.
$ErrorActionPreference = 'Stop'
$taskRuleName = 'LandLocator-LocalPreview'
$taskRule = Get-NetFirewallRule -Name $taskRuleName -ErrorAction SilentlyContinue
if ($taskRule) {
    Enable-NetFirewallRule -Name $taskRuleName
} else {
    New-NetFirewallRule -Name $taskRuleName -DisplayName 'Land Locator local preview' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5183,5184 -Profile Private -RemoteAddress LocalSubnet | Out-Null
}
Write-Host 'Land Locator ports 5183 and 5184 are allowed for devices on the same private local network.'
