# Contact Worker

This Worker handles `POST https://contact.kooraseru.com/` from `https://kooraseru.com`. It accepts required name, email, topic, subject, and message fields, with an 800-character message limit. A hidden website field catches basic form bots, and the Cloudflare rate limiting binding allows three attempts per minute per visitor IP.

Gmail OAuth values (`GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, and `GMAIL_EMAIL`) are Cloudflare Worker secrets. Set them on the existing `kooraseru-worker`; do not put them in GitHub or in `wrangler.jsonc`. The GitHub deployment workflow uses `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets to publish changes to the Worker from `source`.

The Worker route is `contact.kooraseru.com/*`. Local development secrets can go in `.dev.vars`, which is ignored by Git. The Worker does not log OAuth tokens or message contents.

## Deployment setup

Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` under the repository's **Settings → Secrets and variables → Actions**. The API token needs Cloudflare Worker edit access for this account and access to the `kooraseru.com` zone. Changes to `src/email-system/cloudflare/` on the `source` branch deploy automatically; **Deploy contact Worker** can also be run manually on `source`. Missing GitHub secrets fail the job visibly.

The four Gmail values remain Worker secrets in Cloudflare. `invalid_grant` from Google's token endpoint means the stored refresh token cannot be used with the current OAuth client. Check that `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN` belong to the same OAuth client, then replace the refresh token in Cloudflare if it expired or was revoked. An external OAuth consent screen left in Testing can issue refresh tokens that expire after seven days. Changing Worker code or GitHub deployment credentials alone will not repair this Gmail error.
