# Tangzy portfolio deployment

Website: https://tangzy0121.github.io/Tangzy0121/

The root README.md remains the GitHub profile README. GitHub Pages publishes only main:/docs; .nojekyll disables Jekyll processing. The account's root terminal website remains separate.

The initial published baseline is the approved portfolio v0.71 (2026-11-01 packaging). Current runtime v0.72 keeps the contact dial as a channel selector, links More directly to GitHub and Work, shows only configured QR codes, and no longer loads the hidden 3D tuning performance. Its visual refinements await owner feedback. docs/ contains runtime files and retained legacy contact assets; local research notes, screenshots, source maps and standalone prototype folders are excluded. Edit the maintained source project and run scripts/prepare-pages.cjs there to refresh this deployment checkout before committing docs/.

Large PDFs are not duplicated in Git. The CV and anonymous paper use the owner's existing public same-origin URLs; their Git blob identities were verified during packaging. The contact form retains its explicitly public Web3Forms receiving key; it contains no mail password or private API credential.

## Updating

Push changes in docs/ to main. GitHub Pages automatically rebuilds from that directory. Check repository Actions / Pages build status, then verify Home, Work, About and Contact. Contact visual checks must not send unsolicited test messages.

Current runtime content can be edited in docs/work/projects.js. Library and asset credits are in docs/CREDITS.md. Profile README changes are independent of the site deployment.

No engineering-skill setup was added, as requested by the account owner on 2026-11-01.
