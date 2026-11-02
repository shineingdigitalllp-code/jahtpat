from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
import os

root = Path(__file__).resolve().parent.parent
excluded = {"node_modules", ".next", "dist", ".git", "generated", "__pycache__"}
with ZipFile(root / "jhatpat-hostinger.zip", "w", ZIP_DEFLATED) as archive:
    for folder in ("apps", "packages", "hostinger"):
        for directory, directories, filenames in os.walk(root / folder):
            directories[:] = [name for name in directories if name not in excluded]
            for filename in filenames:
                if filename.startswith(".env") and filename != ".env.example":
                    continue
                if filename.endswith(".tsbuildinfo") or filename == "next-env.d.ts":
                    continue
                file = Path(directory) / filename
                archive.write(file, file.relative_to(root).as_posix())
    for filename in ("package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml"):
        archive.write(root / filename, filename)
print("Created jhatpat-hostinger.zip")
