# Live exercise media catalogue

This function searches the public wger exercise information API and returns upstream exercise records with their translations, images, videos, equipment, muscles, and source identifiers.

## Runtime requirements

- Supabase Edge Functions runtime
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` (provided by Supabase)
- JWT verification enabled for this function

## Request

Authenticated POST request:

```json
{ "query": "push up" }
```

The query must contain 2–100 characters. The function currently reads the first 100 upstream exercise-info records, then filters those records by translated name, description, muscle, equipment, and category. It returns up to 20 matches. It does not claim to search the entire upstream catalogue yet.

## Media and attribution

Media URLs and per-asset licence/author metadata are passed through from wger; the client must display the source and applicable licence/author information with each asset. Do not copy media into the platform or remove attribution without checking the individual asset's reuse terms.

The upstream API provides the expanded exercise information representation with related images and videos. See https://wger.readthedocs.io/en/latest/api/api.html

## Deployment

Deploy with the Supabase CLI from the repository root:

```bash
supabase functions deploy exercise-media
```

The function has not been deployed or live-tested as part of this source change.
