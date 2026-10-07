# Risk Radar — server update, 7 October 2026

Updates riskradar.geoinfobox.com with the changes since the last deploy:
units and data sources per parameter, editable direction, delete variables,
expert/community index entry, the climate template per province, and the fix
that stops weight saves from resetting "−" directions to "+".

No new Python packages. No nginx change. Existing data and accounts are kept.

## Steps

1. Copy this folder to the server (for example with WinSCP or `scp`) and open
   an SSH session there.
2. In the folder:

   ```bash
   chmod +x update.sh
   ./update.sh check
   ```

   It prints where it found the backend, the frontend and the API service,
   and changes nothing. If something says NOT FOUND, re-run with the path, e.g.
   `BACKEND_DIR=/var/www/sites/geoinfobox.com/riskradar_ai/backend ./update.sh check`.

3. When the paths look right:

   ```bash
   ./update.sh apply
   ```

   It backs up the database and the current files first, then updates. The
   last line prints the rollback commands.

## After updating

- Open https://riskradar.geoinfobox.com and press Ctrl+F5 (Cmd+Shift+R on Mac).
- Open a profile's weights: the Data source column and the clickable + / −
  should be there.
- Any profile whose weights were saved before this update may have had "−"
  variables turned into "+". Check those profiles' directions, fix them in the
  weights editor, save, and recompute the province.
