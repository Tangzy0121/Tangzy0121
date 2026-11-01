# Tangzy portfolio deployment

Website: https://tangzy0121.github.io/Tangzy0121/

The root README.md remains the GitHub profile README. GitHub Pages publishes only main:/docs; .nojekyll disables Jekyll processing. The account's root terminal website remains separate.

The initial published baseline is the approved portfolio v0.71 (2026-11-01 packaging). Current runtime v0.74 links More directly to GitHub and the owner's personal blog, using the blog URL from the existing profile README. Its pixel heart derives from this site's navigation heart. The dial selects channels, only configured QR codes appear, and the hidden 3D tuning performance no longer loads. Its visual refinements await owner feedback. docs/ contains runtime files and retained legacy contact assets; local research notes, screenshots, source maps and standalone prototype folders are excluded. Edit the maintained source project and run scripts/prepare-pages.cjs there to refresh this deployment checkout before committing docs/.

Large PDFs are not duplicated in Git. The CV and anonymous paper use the owner's existing public same-origin URLs; their Git blob identities were verified during packaging. The contact form retains its explicitly public Web3Forms receiving key; it contains no mail password or private API credential.

## Updating

Push changes in docs/ to main. GitHub Pages automatically rebuilds from that directory. Check repository Actions / Pages build status, then verify Home, Work, About and Contact. Contact visual checks must not send unsolicited test messages.

Current runtime content can be edited in docs/work/projects.js. Library and asset credits are in docs/CREDITS.md. Profile README changes are independent of the site deployment.

No engineering-skill setup was added, as requested by the account owner on 2026-11-01.

## Blog integration · 2026-11-01

The owner-approved blog lives at /Tangzy0121/blog/. The Contact More link and embedded terminal blog command open it. The root terminal website receives the same command in its own repository. The blog supports title/tag/body search, category and year filters, progressive listing, and article history navigation. Published content is maintained in the source project blog/posts.js; layout examples remain in local previews.

This release overlays only the blog files, Contact link, embedded terminal assets, and sitemap on the published v0.74 baseline. The separate v0.75 responsive layout preview remains local pending owner feedback. Use scripts/build-blog.cjs and scripts/prepare-blog-pages.cjs from the maintained project for a scoped blog update.
