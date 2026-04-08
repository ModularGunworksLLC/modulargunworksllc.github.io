# Fix "vcsData.projectBranch" Required Error

## What the error means

**`vcsData.projectBranch`** = the Git branch Northflank should build from (e.g. `main`).

The form requires this field to be set. The Branch dropdown shows "No options" because Northflank’s UI isn’t getting branches from GitHub, so the field stays empty and validation fails.

---

## Option 1: Create service via API (bypass the UI)

You can create the service with the Northflank API and set the branch directly.

### Step 1: Get an API token

1. In Northflank: **Settings** (gear) → **Secure** → **API access**
2. Create an API token with permissions to create services

### Step 2: Get your project ID

1. Open your project (`modular-gunworks`) in Northflank
2. Check the URL: `https://app.northflank.com/projects/MODULAR-GUNWORKS/...` 
3. The project ID is often the slug: `modular-gunworks` (or the ID from the URL)

### Step 3: Create the service with curl

Replace `YOUR_API_TOKEN` and `PROJECT_ID` below, then run in PowerShell:

```powershell
$headers = @{
  "Authorization" = "Bearer YOUR_API_TOKEN"
  "Content-Type" = "application/json"
}
$body = @{
  name = "modular-gunworks"
  buildSource = "git"
  vcsData = @{
    projectUrl = "https://github.com/ModularGunworksLLC/modulargunworksllc.github.io"
    projectType = "github"
    accountLogin = "ModularGunworksLLC"
    projectBranch = "main"
  }
  buildSettings = @{
    buildType = "buildpack"
  }
  deployment = @{
    instances = 1
  }
  ports = @(
    @{ name = "http"; internalPort = 3000; public = $true }
  )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "https://api.northflank.com/v1/projects/PROJECT_ID/services/combined" -Method Post -Headers $headers -Body $body
```

---

## Option 2: Test if Northflank can see branches

Call the branches API to see if Northflank can reach your repo:

```powershell
$headers = @{ "Authorization" = "Bearer YOUR_API_TOKEN" }
Invoke-RestMethod -Uri "https://api.northflank.com/v1/integrations/github/ModularGunworksLLC/modulargunworksllc.github.io/branches" -Headers $headers
```

- If this returns a list of branches → the UI bug is separate; you can use Option 1.
- If it errors or returns nothing → Northflank likely doesn’t have access to the repo (GitHub App permissions).

---

## Option 3: Contact Northflank support

Explain:
- Branch dropdown shows "No options" for `ModularGunworksLLC/modulargunworksllc.github.io`
- GitHub App has "All repositories" access
- Ask them to fix or work around the branch selector

Support is usually available from the Northflank app (chat or help icon).
