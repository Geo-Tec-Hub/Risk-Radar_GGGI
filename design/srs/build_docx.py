#!/usr/bin/env python3
"""
Package SRS.md as SRS.docx.

Pandoc does the conversion; this script handles the two things it gets wrong on
its own: image sizing and page breaks.

  * Images are inserted at native size unless told otherwise. The screenshots are
    2880px wide, so without a width attribute every figure blows past the margin.
    Each is scaled to fit the text column, and tall portrait captures are scaled
    by HEIGHT instead so they fit on one page rather than spilling onto two.
  * Annexes get an explicit page break so the document opens cleanly at each one.

Usage:  python build_docx.py
"""
import itertools
import os
import re
import struct
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))

# Source defaults to SRS.md but can be given on the command line, so a new
# version does not require editing this script:
#     python build_docx.py SRS_v2.2.md [out.docx]
_args = [a for a in sys.argv[1:] if not a.startswith("-")]
SRC = os.path.join(HERE, _args[0]) if _args else os.path.join(HERE, "SRS.md")
OUT = (
    os.path.join(HERE, _args[1])
    if len(_args) > 1
    else os.path.splitext(SRC)[0] + ".docx"
)
# intermediate goes to the system temp dir - the project lives on OneDrive,
# where deleting a file we just wrote can fail on a permission error
BUILD = os.path.join(tempfile.gettempdir(), "riskradar_srs_build.md")

TEXT_WIDTH_IN = 6.3     # A4 portrait minus 2.5cm margins
MAX_HEIGHT_IN = 7.6     # leaves room for the caption beneath


def png_size(path):
    with open(path, "rb") as fh:
        head = fh.read(33)
    return struct.unpack(">II", head[16:24])


def size_attr(md_path):
    """Fit to column width, unless that would make it too tall for one page."""
    abs_path = os.path.normpath(os.path.join(HERE, md_path))
    if not os.path.exists(abs_path):
        print(f"  ! missing image: {md_path}", file=sys.stderr)
        return ""
    w, h = png_size(abs_path)
    height_if_full_width = TEXT_WIDTH_IN * h / w
    if height_if_full_width > MAX_HEIGHT_IN:
        return f"{{height={MAX_HEIGHT_IN}in}}"
    return f"{{width={TEXT_WIDTH_IN}in}}"


def widen_table_separators(md):
    """Force pandoc to emit explicit column widths.

    With a minimal separator row (|---|---|) pandoc sometimes omits <w:tblGrid>
    entirely; Word and LibreOffice then collapse the table so later columns fall
    off the page. Rewriting each separator with dash counts proportional to the
    widest cell in that column makes the widths explicit and sensible.
    """
    lines = md.split("\n")
    out = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        is_sep = (stripped.startswith("|")
                  and set(stripped) <= set("|-: ")
                  and "-" in stripped)
        if not is_sep or i == 0:
            out.append(line)
            continue

        # collect the block of table rows around this separator
        j = i - 1
        start = j
        while start >= 0 and lines[start].strip().startswith("|"):
            start -= 1
        end = i + 1
        while end < len(lines) and lines[end].strip().startswith("|"):
            end += 1

        widths = []
        for row in lines[start + 1:end]:
            cells = [c.strip() for c in row.strip().strip("|").split("|")]
            if set(row.strip()) <= set("|-: "):
                continue
            for k, c in enumerate(cells):
                if k >= len(widths):
                    widths.append(0)
                widths[k] = max(widths[k], len(c))

        n_cols = stripped.strip("|").count("|") + 1
        while len(widths) < n_cols:
            widths.append(3)
        widths = widths[:n_cols]
        total = sum(widths) or 1
        # scale to ~100 chars so ratios survive, floor at 3 dashes
        scaled = [max(3, round(w / total * 100)) for w in widths]
        out.append("|" + "|".join("-" * w for w in scaled) + "|")
    return "\n".join(out)


TEXT_WIDTH_DXA = 9360   # Letter (12240) minus 1in margins each side


def table_widths(md):
    """Column widths in DXA for each table, in document order.

    Derived from the widest cell per column in the source markdown.
    """
    out, cur = [], []
    lines = md.split("\n")
    for line in lines + [""]:
        s = line.strip()
        if s.startswith("|"):
            if set(s) <= set("|-: ") and "-" in s:
                continue                       # separator row
            cur.append([c.strip() for c in s.strip("|").split("|")])
            continue
        if cur:
            n = max(len(r) for r in cur)
            w = [0] * n
            for r in cur:
                for k, c in enumerate(r):
                    w[k] = max(w[k], len(c))
            total = sum(w) or 1
            # Minimum 1250 DXA (~0.87in). Purely proportional widths make a
            # short column like "Method" so narrow that POST wraps one letter
            # per line; the floor prevents that.
            dxa = [max(1250, round(x / total * TEXT_WIDTH_DXA)) for x in w]
            # re-scale the columns above the floor so the row still totals
            # exactly the text width
            over = sum(d for d in dxa if d > 1250)
            excess = sum(dxa) - TEXT_WIDTH_DXA
            if excess > 0 and over > 0:
                dxa = [d - round(excess * d / over) if d > 1250 else d for d in dxa]
            dxa[-1] += TEXT_WIDTH_DXA - sum(dxa)
            out.append(dxa)
            cur = []
    return out


def force_table_grids(docx_path, widths):
    """Set explicit column widths on EVERY table.

    Two distinct pandoc behaviours make this necessary:
      * Short tables get no <w:tblGrid> at all, and both Word and LibreOffice
        then collapse them so later columns fall off the page.
      * Tables it does size are sized from content length alone, which makes a
        column like "Method" so narrow that POST wraps one letter per line.

    Both are fixed the same way: replace the grid, and the per-cell widths that
    override it, with values derived from the source markdown.
    """
    import shutil
    import zipfile

    zin = zipfile.ZipFile(docx_path)
    items = {n: zin.read(n) for n in zin.namelist()}
    zin.close()

    xml = items["word/document.xml"].decode("utf-8")
    tables = list(re.finditer(r"<w:tbl>.*?</w:tbl>", xml, re.S))
    if not tables:
        return 0

    pieces, last, fixed = [], 0, 0
    for idx, m in enumerate(tables):
        tbl = m.group(0)
        pieces.append(xml[last:m.start()])
        last = m.end()
        first_row = tbl.split("</w:tr>")[0]
        n_cols = first_row.count("<w:tc>")
        if n_cols < 1:
            pieces.append(tbl)
            continue
        w = widths[idx] if idx < len(widths) and len(widths[idx]) == n_cols \
            else [TEXT_WIDTH_DXA // n_cols] * n_cols

        grid = ("<w:tblGrid>"
                + "".join(f'<w:gridCol w:w="{x}"/>' for x in w)
                + "</w:tblGrid>")
        if "<w:gridCol" in tbl:
            tbl = re.sub(r"<w:tblGrid>.*?</w:tblGrid>", grid, tbl, count=1, flags=re.S)
        elif "<w:tblPr>" in tbl:
            tbl = tbl.replace("</w:tblPr>", "</w:tblPr>" + grid, 1)
        else:
            tbl = tbl.replace("<w:tbl>", "<w:tbl>" + grid, 1)

        # per-cell widths override the grid in Word, so rewrite them in order
        col = itertools.count()
        def cell_w(mm):
            return f'<w:tcW w:w="{w[next(col) % n_cols]}" w:type="dxa"/>'
        tbl = re.sub(r'<w:tcW[^/]*/>', cell_w, tbl)

        pieces.append(tbl)
        fixed += 1
    pieces.append(xml[last:])
    items["word/document.xml"] = "".join(pieces).encode("utf-8")

    tmp = docx_path + ".tmp"
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
        for n, data in items.items():
            z.writestr(n, data)
    shutil.move(tmp, docx_path)
    return fixed


def main():
    md = open(SRC, encoding="utf-8").read()

    # 0. explicit column widths (see docstring above)
    md = widen_table_separators(md)

    # 1. size every image
    n = 0
    def add_size(m):
        nonlocal n
        n += 1
        alt, path = m.group(1), m.group(2)
        return f"![{alt}]({path}){size_attr(path)}"
    md = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", add_size, md)

    # 2. page break before each annex
    md = re.sub(r"^## Annex ", r"\\newpage\n\n## Annex ", md, flags=re.M)

    open(BUILD, "w", encoding="utf-8").write(md)

    cmd = [
        "pandoc", BUILD, "-o", OUT,
        "--from", "markdown+pipe_tables+implicit_figures+raw_tex",
        "--toc", "--toc-depth=2",
        "--resource-path", HERE,
        "--metadata", "title=Risk Radar — Software Requirements Specification",
        "--metadata", "author=Risk Radar project",
        "--metadata", "lang=en-GB",
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print("pandoc failed:\n" + r.stderr[:2000], file=sys.stderr)
        return 1

    fixed = force_table_grids(OUT, table_widths(md))

    try:
        os.remove(BUILD)
    except OSError:
        pass
    if fixed:
        print(f"  set explicit column widths on {fixed} table(s)")
    print(f"wrote {os.path.relpath(OUT, HERE)}  "
          f"({os.path.getsize(OUT)/1024/1024:.1f} MB, {n} figures sized)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
