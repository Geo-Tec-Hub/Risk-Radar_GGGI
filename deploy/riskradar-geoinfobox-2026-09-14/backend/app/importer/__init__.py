"""Stage 3 workbook importer (TASK_BRIEF_IMPORTER.md).

This package is reader + validation only so far: it parses a province
workbook, resolves every column and DS_Code, and reports what it found and
what it would reject. Nothing here writes to `indicator_value`.
"""
