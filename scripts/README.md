# Scripts

Repository automation, validation, data maintenance, and migration helper
scripts belong here.

## Zillow listing export

`npm run export:zillow -- <zillow-url> [output-directory]` creates an address-named
folder of listing photos plus a voice-agent-ready RTF knowledge base alongside it.
It never fetches Zillow directly. Configure an Apify actor that your account is
authorized to use, then set these server-only environment variables:

```sh
APIFY_TOKEN=... APIFY_ZILLOW_ACTOR_ID=owner~actor \
  npm run export:zillow -- 'https://www.zillow.com/homedetails/...'
```

The exporter writes to `output/zillow-listings` by default, saves every photo URL
returned by the actor that responds as an image, and records download failures and
the raw actor response in `export-log.json`. It does not bypass site protections or
attempt authentication.
