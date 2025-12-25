import os
import shutil
import subprocess

# Paths
outer = "modular-gunworks-site"
inner = os.path.join(outer, "modular-gunworks-site")

# Step 1: Check if nested folder exists
if not os.path.exists(inner):
    print("✅ Site is already flattened. No action needed.")
    exit()

# Step 2: Move all contents from inner to outer
for item in os.listdir(inner):
    src = os.path.join(inner, item)
    dst = os.path.join(outer, item)

    if os.path.exists(dst):
        print(f"⚠️ Skipped (already exists): {dst}")
    else:
        shutil.move(src, dst)
        print(f"✅ Moved: {src} → {dst}")

# Step 3: Delete the now-empty inner folder
try:
    os.rmdir(inner)
    print(f"🧹 Deleted empty folder: {inner}")
except Exception as e:
    print(f"⚠️ Could not delete folder: {inner} — {e}")

# Step 4: Remove old tracked folder from Git
print("🧼 Cleaning Git tracking...")
subprocess.run(["git", "rm", "-r", "--cached", inner])

# Step 5: Stage and commit
print("📦 Staging and committing...")
subprocess.run(["git", "add", "."])
subprocess.run(["git", "commit", "-m", "Auto-flattened site structure for GitHub Pages"])

print("\n✅ Ready to push with:")
print("   git push --force")
