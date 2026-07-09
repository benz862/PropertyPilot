# Deployment Runbook

1. Run `npm run validate:env` for the target environment.
2. Run `npm run lint`, `npm test`, and `npm run build`.
3. Verify Supabase migrations are additive or have an approved rollback plan.
4. Deploy preview and run `/api/v1/health` plus dependency checks under `/api/v1/health/<service>`.
5. Promote to production only after review and acceptance.
6. Roll back with Vercel rollback, feature flags, prompt version rollback, or provider switch as appropriate.

Production dependencies:

- `database`
- `storage`
- `openai`
- `stripe`
- `resend`
- `crm`
