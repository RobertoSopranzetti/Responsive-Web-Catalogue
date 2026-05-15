"""
Extracts plain text from a .docx file and prints it to stdout (UTF-8).
Usage: python scripts/extract_docx.py <path/to/file.docx>
"""
import sys
import zipfile
import xml.etree.ElementTree as ET

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

def extract(path):
    with zipfile.ZipFile(path) as z:
        with z.open("word/document.xml") as f:
            tree = ET.parse(f)
    root = tree.getroot()
    paragraphs = []
    for para in root.iter(f"{{{W}}}p"):
        text = "".join(
            node.text or ""
            for node in para.iter(f"{{{W}}}t")
        )
        paragraphs.append(text)
    return "\n".join(paragraphs)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/extract_docx.py <file.docx>", file=sys.stderr)
        sys.exit(1)
    sys.stdout.buffer.write(extract(sys.argv[1]).encode("utf-8"))
    sys.stdout.buffer.write(b"\n")
