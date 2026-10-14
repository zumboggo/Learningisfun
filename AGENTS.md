# Publishing preference

When making changes in this folder, finish the relevant checks, commit all task changes, and push them immediately without asking for confirmation. For Learning is Fun app changes, integrate the latest remote changes and push to the production `master` branch so GitHub Pages deploys. Preserve unrelated work and never force-push.

# Backend deployment credentials

The existing Appwrite deployment environment is stored privately at `~/.config/learningisfun/appwrite.env` (directory mode 700, file mode 600). `scripts/deploy-episode-backend.mjs` loads it automatically when required environment variables are absent. Other deployment scripts can use `node --env-file="$HOME/.config/learningisfun/appwrite.env" SCRIPT`. Never print, copy into the repository, or publish its contents. Reuse the existing credential; this location does not authorize new account permissions.
