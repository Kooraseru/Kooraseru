# Contact Worker

This Worker handles `POST https://contact.kooraseru.com/` from `https://kooraseru.com`. It accepts required name, email, topic, subject, and message fields, with an 800-character message limit. A hidden website field catches basic form bots, and the Cloudflare rate limiting binding allows three attempts per minute per visitor IP.

Gmail OAuth values (`GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, and `GMAIL_EMAIL`) are Cloudflare Worker secrets. Set them on the existing `kooraseru-worker`; do not put them in GitHub or in `wrangler.jsonc`. The GitHub deployment workflow uses `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets to publish changes to the Worker from `source`.

The Worker route is `contact.kooraseru.com/*`. Local development secrets can go in `.dev.vars`, which is ignored by Git. The Worker does not log OAuth tokens or message contents.
