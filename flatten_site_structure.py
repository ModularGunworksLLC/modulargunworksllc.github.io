import os
import shutil

# Define paths
outer = "modular-gunworks-site"
inner = os.path.join(outer, "modular-gunworks-site")

# Safety check
if not os.path.exists(inner):
    print("Inner folder not found. Already flattened?")
    exit()

# Move all contents from inner to outer
for item in os.listdir(inner):
    src = os.path.join(inner, item)
    dst = os.path.join(outer, item)

    if os.path.exists(dst):
        print(f"Skipping (already exists): {dst}")
    else:
        shutil.move(src, dst)
        print(f"Moved: {src} → {dst}")

# Remove the now-empty inner folder
try:
    os.rmdir(inner)
    print(f"Deleted empty folder: {inner}")
except Exception as e:
    print(f"Could not delete folder: {inner} — {e}")

print("\n✅ Site structure flattened. Ready to commit and push.")
