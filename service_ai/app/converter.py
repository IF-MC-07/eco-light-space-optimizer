from pathlib import Path

# Root = folder tempat script ini berada (service_ai)
ROOT = Path(__file__).parent

OUTPUT_FILE = ROOT / "service_ai_source.md"

# Folder yang diabaikan
IGNORE_DIRS = {
    ".venv",
    "__pycache__",
    ".git",
    "runs",
    ".pytest_cache",
    ".mypy_cache"
}

# File yang diabaikan
IGNORE_FILES = {
    OUTPUT_FILE.name,
    Path(__file__).name,
    ".gitkeep"
}

# Ekstensi yang ingin dimasukkan
INCLUDE_EXT = {
    ".py",
    ".json",
    ".txt",
    ".yaml",
    ".yml",
    ".ini",
    ".cfg",
    ".toml",
    ".env.example"
}

with open(OUTPUT_FILE, "w", encoding="utf-8") as out:

    out.write("# SERVICE_AI SOURCE CODE\n")
    out.write("Generated automatically.\n\n")

    for file in sorted(ROOT.rglob("*")):

        if file.is_dir():
            continue

        # Skip folder tertentu
        if any(part in IGNORE_DIRS for part in file.parts):
            continue

        # Skip file tertentu
        if file.name in IGNORE_FILES:
            continue

        # Skip model AI
        if file.suffix.lower() in {
            ".pt",
            ".pth",
            ".onnx",
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".webp",
            ".csv",
            ".db"
        }:
            continue

        # Skip jika bukan file yang diinginkan
        if file.suffix not in INCLUDE_EXT:
            continue

        relative = file.relative_to(ROOT)

        out.write("\n")
        out.write("=" * 100 + "\n")
        out.write(f"FILE : {relative}\n")
        out.write("=" * 100 + "\n\n")

        ext = file.suffix.replace(".", "")
        if ext == "":
            ext = "text"

        out.write(f"```{ext}\n")

        try:
            out.write(file.read_text(encoding="utf-8"))
        except:
            out.write(file.read_text(encoding="latin-1", errors="ignore"))

        out.write("\n```\n\n")

print(f"Selesai!\nOutput : {OUTPUT_FILE}")