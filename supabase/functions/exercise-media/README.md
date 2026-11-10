# Live exercise media catalogue

This function searches the public wger exercise information API and returns upstream exercise records with their translations, images, videos, equipment, muscles, and source identifiers.

## Runtime requirements

- Supabase Edge Functions runtime
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` (provided by Supabase)
- JWT verification enabled for this function

## Request

Authenticated POST request:

```json
{ "query": "push up", "page": 1 }
```

`page` is optional and defaults to 1; accepted values are integers from 1 to 50. Each page reads 100 upstream exercise-info records using the upstream offset, then filters that page by translated name, description, muscle, equipment, and category. It returns up to 20 matches per page and indicates whether the upstream API has another page. The library detail UI can request subsequent pages. Search is therefore paginated, but capped at 5,000 upstream records per query; it does not claim to cover records beyond that cap.

## Media and attribution

Media URLs and per-asset licence/author metadata are passed through from wger for catalogue research only. They are not used as the platform's exercise demonstration experience. The exercise detail UI uses a dedicated 3D animation viewer and must not substitute external video links for a missing animation asset. Do not copy upstream media into the platform or remove attribution without checking the individual asset's reuse terms.

The upstream API provides the expanded exercise information representation with related images and videos. See https://wger.readthedocs.io/en/latest/api/api.html

## Deployment

Deploy with the Supabase CLI from the repository root:

```bash
supabase functions deploy exercise-media
```

The function has not been deployed or live-tested as part of this source change.
