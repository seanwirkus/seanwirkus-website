Legacy assets for Mitosis Simulator

Purpose
- Keep a frozen snapshot of the original legacy JavaScript and CSS files for historical reference.
- These files must not be edited in-place. If you want to evolve behavior, copy files into `/src/` and refactor there.

Included files
- `mitosis.js` (legacy)
- `chromosome.js` (legacy)
- `mitosis-init.js` (legacy)
- `mitosis.css` (legacy snapshot)

Developer guidance
1. Do not edit files inside `/legacy/`.
2. To modernize or fix bugs, copy the relevant file from the project root into `/src/` and refactor there.
3. If a behavior must be preserved exactly for testing, use the frozen file as the source of truth.

Optional git protection (local only)
You can add a local pre-commit hook to warn or block edits to `/legacy/` files. Create `.git/hooks/pre-commit` and add a script that rejects commits touching `/legacy/*`.

Example (bash):

#!/bin/sh
if git diff --cached --name-only | grep -q '^legacy/'; then
  echo "\nERROR: You are attempting to commit changes to legacy files. These are read-only snapshots.\n"
  exit 1
fi

# To enable, run:
# chmod +x .git/hooks/pre-commit

Contact
- If you need a file restored from `legacy/`, open an issue or request a restore and include the filename and reason.
