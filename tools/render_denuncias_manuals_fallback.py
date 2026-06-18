from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
import gc
from pathlib import Path

import pypdfium2 as pdfium


REPO_ROOT = Path(__file__).resolve().parents[1]
LO_SOFFICE = Path(r"C:\Program Files\LibreOffice\program\soffice.exe")
PYTHON = Path(r"C:\Users\Marketing\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe")


def convert_docx_to_pdf(docx_path: Path, temp_root: Path) -> Path:
    out_dir = temp_root / "pdf"
    out_dir.mkdir(parents=True, exist_ok=True)
    profile_dir = temp_root / "lo_profile"
    profile_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
        str(LO_SOFFICE),
        "--headless",
        "--nologo",
        "--nodefault",
        "--nofirststartwizard",
        f"-env:UserInstallation={profile_dir.as_uri()}",
        "--convert-to",
        "pdf",
        "--outdir",
        str(out_dir),
        str(docx_path),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(
            "LibreOffice failed to convert DOCX to PDF.\n"
            f"STDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
        )

    pdf_path = out_dir / f"{docx_path.stem}.pdf"
    if not pdf_path.exists():
        candidates = list(out_dir.glob("*.pdf"))
        if len(candidates) == 1:
            pdf_path = candidates[0]
        else:
            raise FileNotFoundError(f"Could not find converted PDF for {docx_path.name}")
    return pdf_path


def render_pdf_to_pngs(pdf_path: Path, output_dir: Path, *, dpi: int = 170) -> int:
    output_dir.mkdir(parents=True, exist_ok=True)
    for old_png in output_dir.glob("page-*.png"):
        old_png.unlink()

    pdf = pdfium.PdfDocument(str(pdf_path))
    scale = dpi / 72.0
    page_count = len(pdf)
    for page_index in range(page_count):
        page = pdf[page_index]
        bitmap = page.render(scale=scale)
        image = bitmap.to_pil()
        image.save(output_dir / f"page-{page_index + 1}.png")
        del image, bitmap, page
    try:
        pdf.close()
    except Exception:
        pass
    del pdf
    gc.collect()
    return page_count


def render_manual(docx_rel: str, out_rel: str):
    docx_path = REPO_ROOT / docx_rel
    out_dir = REPO_ROOT / out_rel
    with tempfile.TemporaryDirectory(prefix="denuncias_render_") as temp_dir_str:
        temp_root = Path(temp_dir_str)
        pdf_path = convert_docx_to_pdf(docx_path, temp_root)
        page_count = render_pdf_to_pngs(pdf_path, out_dir)
        print(f"{docx_path.name}: {page_count} pages -> {out_dir}")


def main():
    if not LO_SOFFICE.exists():
        raise FileNotFoundError(f"LibreOffice not found at {LO_SOFFICE}")

    render_manual("docs/denuncias/manual_usuario_plataforma_denuncias.docx", "docs/denuncias/render_usuario")
    render_manual("docs/denuncias/manual_operador_plataforma_denuncias.docx", "docs/denuncias/render_operador")


if __name__ == "__main__":
    main()
