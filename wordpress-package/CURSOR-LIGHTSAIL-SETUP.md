# How to Use Cursor AI with Your Lightsail WordPress

You pay for Cursor. You can use it to edit and maintain your Lightsail WordPress site. Here’s how.

---

## Option 1: Remote SSH (Edit Files Directly on the Server)

### Step 1: Get your Lightsail SSH key

1. Open **Lightsail** → your instance → **Account** (top right) → **Account** → **SSH keys**
2. Or: instance → **Connect** → **Download default key** (saves `.pem` file)
3. Put the `.pem` in a stable location (e.g. `C:\Users\micha\.ssh\lightsail-key.pem`)

### Step 2: Get your instance IP and username

- **Public IP**: Shown on the instance in Lightsail
- **Username**:
  - **Amazon Linux / Ubuntu**: `ec2-user` or `ubuntu`
  - **Bitnami WordPress**: `bitnami`
- **Theme path** (typical):
  - Linux/Ubuntu: `/var/www/html/wp-content/themes/`
  - Bitnami: `/opt/bitnami/wordpress/wp-content/themes/`

### Step 3: Configure Cursor Remote SSH

1. In Cursor: **File** → **Preferences** → **Settings** → search **Remote**
2. Or install **Remote - SSH** (or use built-in remote features)
3. Open Command Palette (`Ctrl+Shift+P`) → **Remote-SSH: Connect to Host**
4. Add host: `ssh -i "C:\Users\micha\.ssh\lightsail-key.pem" bitnami@YOUR_LIGHTSAIL_IP`

Replace:
- Path to your `.pem` file
- `bitnami` with `ec2-user` or `ubuntu` if that’s your user
- `YOUR_LIGHTSAIL_IP` with your instance public IP

### Step 4: Open the theme folder in Cursor

1. After connecting, **File** → **Open Folder**
2. Path: `/opt/bitnami/wordpress/wp-content/themes/modulargunworks` (Bitnami)
   or `/var/www/html/wp-content/themes/modulargunworks` (standard)
3. Edit PHP, CSS, JS directly; changes are on the server and take effect immediately

### Step 5: Using Cursor AI

- Highlight code and use Cursor’s AI (e.g. Ctrl+K or chat)
- Ask: “Add a custom WooCommerce hook for…”, “Fix this CSS”, “Write a shortcode for…”
- Cursor sees the same files as the live site when you’re connected via Remote SSH

---

## Option 2: Local Clone + Deploy (Work Locally, Push to Server)

### Step 1: Clone this package locally

```bash
cd C:\Users\micha
git clone https://github.com/YOUR_USERNAME/modulargunworks-wordpress.git
cd modulargunworks-wordpress
```

### Step 2: Open in Cursor

Open the folder `modulargunworks-wordpress` in Cursor.

### Step 3: Edit locally

Edit theme files (PHP, CSS, JS). Use Cursor AI as usual.

### Step 4: Deploy to Lightsail

**A. SFTP (FileZilla, WinSCP)**

- Host: your Lightsail public IP  
- Username: `bitnami` or `ec2-user`  
- Auth: SSH key (import your `.pem`)  
- Remote path: `/opt/bitnami/wordpress/wp-content/themes/modulargunworks/`  
- Upload changed files

**B. Git pull on the server**

1. On your computer: push changes to GitHub.
2. SSH into Lightsail:
   ```bash
   cd /opt/bitnami/wordpress/wp-content/themes/modulargunworks
   sudo git pull origin main
   sudo chown -R bitnami:daemon .
   ```

**C. rsync (if you have rsync on Windows)**

```bash
rsync -avz -e "ssh -i C:\Users\micha\.ssh\lightsail-key.pem" ./theme/ bitnami@YOUR_IP:/opt/bitnami/wordpress/wp-content/themes/modulargunworks/
```

---

## Tips for Using Cursor with WordPress

1. **Describe context:** “This is a WordPress theme for a firearms retailer. I need…”
2. **Mention WooCommerce:** “Add a WooCommerce template override for…”
3. **Include paths:** “The theme is at wp-content/themes/modulargunworks…”
4. **PHP and hooks:** “Use add_action for wp_enqueue_scripts…”
5. **Security:** Never paste real API keys or passwords into Cursor; use placeholders.

---

## Quick Reference – Paths on Lightsail

| Stack   | Theme path                                                   |
|---------|--------------------------------------------------------------|
| Bitnami | `/opt/bitnami/wordpress/wp-content/themes/modulargunworks/` |
| Ubuntu  | `/var/www/html/wp-content/themes/modulargunworks/`          |
| Amazon Linux | `/var/www/html/wp-content/themes/modulargunworks/`      |

---

## Summary

- **Remote SSH:** Connect Cursor directly to Lightsail and edit files on the server.  
- **Local clone:** Edit in Cursor locally, then deploy via SFTP, git pull, or rsync.  

Either way, Cursor is editing the same code that runs your site, so you can use it for all theme and custom-code changes.
