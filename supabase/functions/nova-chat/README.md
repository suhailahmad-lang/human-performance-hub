# NOVA chat function

The `nova-chat` Supabase Edge Function powers NOVA's text conversation. It requires a signed-in Supabase user and keeps the OpenAI API key on the server.

## Configure and deploy

1. Install and sign in to the Supabase CLI.
2. From the repository root, set the provider key as a Supabase secret (never put it in a `VITE_*` variable or commit it):

   ```sh
   supabase secrets set OPENAI_API_KEY=your-provider-key
   ```

3. Optional: set a compatible chat model. The default is `gpt-4o-mini`.

   ```sh
   supabase secrets set NOVA_MODEL=gpt-4o-mini
   ```

4. Deploy the function to the Supabase project configured in `supabase/config.toml`:

   ```sh
   supabase functions deploy nova-chat
   ```

The function also needs the project's standard `SUPABASE_URL` and `SUPABASE_ANON_KEY` runtime values. Supabase supplies these to Edge Functions.

## Behavior and safeguards

- Requires a valid Supabase access token; JWT verification is enabled in `config.toml`.
- Accepts only the latest 1–12 user/assistant messages, each limited to 1,500 characters.
- The browser never receives the provider API key.
- NOVA is a general AI companion. Fitness programming and performance analysis remain in the separate AI Coach.
- Provider failures return a generic client error; detailed provider responses are logged server-side and are not sent to the browser.

## Current limitation

This function has been committed to the feature branch but is not deployed. NOVA chat will return a configuration/deployment error until the secret is set and the Edge Function is deployed.
