import os

BRANDS_DIR = "brands"
INDEX_FILE = os.path.join(BRANDS_DIR, "index.md")

# Collect all brand files from A–Z folders
brand_entries = {}

for letter in sorted(os.listdir(BRANDS_DIR)):
    letter_path = os.path.join(BRANDS_DIR, letter)

    if not os.path.isdir(letter_path):
        continue

    md_files = [f for f in os.listdir(letter_path) if f.endswith(".md")]

    if md_files:
        brand_entries[letter] = sorted(md_files)

# Build A–Z jump links
jump_links = " | ".join([f"[{letter.upper()}](#{letter})" for letter in brand_entries.keys()])

# Build the index content
content = f"# Shop by Brand\n\nBrowse all brands carried by Modular Gunworks LLC.\n\n## Jump to:\n{jump_links}\n\n"

# Add each letter section
for letter, files in brand_entries.items():
    content += f"\n---\n\n## {letter.upper()}\n\n"
    for filename in files:
        brand_name = filename.replace(".md", "").replace("-", " ").title()
        brand_slug = filename.replace(".md", "")
        content += f"- [{brand_name}](/brands/{letter}/{brand_slug}.md)\n"

# Write the index.md file
with open(INDEX_FILE, "w", encoding="utf-8") as f:
    f.write(content)

print("brands/index.md generated successfully.")
