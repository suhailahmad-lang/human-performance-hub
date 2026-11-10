import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "private, max-age=300",
    },
  });

type WgerTranslation = {
  name?: string;
  description?: string;
  language?: number;
};

type WgerMedia = {
  id?: number;
  image?: string;
  video?: string;
  url?: string;
  license?: { full_name?: string; url?: string; short_name?: string };
  license_author?: string;
};

type WgerExercise = {
  id: number;
  category?: { id?: number; name?: string };
  muscles?: Array<{ id?: number; name?: string; name_en?: string }>;
  equipment?: Array<{ id?: number; name?: string }>;
  translations?: WgerTranslation[];
  images?: WgerMedia[];
  videos?: WgerMedia[];
};

function getSearchText(exercise: WgerExercise) {
  const translations = (exercise.translations ?? [])
    .map((translation) => `${translation.name ?? ""} ${translation.description ?? ""}`)
    .join(" ");
  const muscles = (exercise.muscles ?? [])
    .map((muscle) => `${muscle.name ?? ""} ${muscle.name_en ?? ""}`)
    .join(" ");
  const equipment = (exercise.equipment ?? []).map((item) => item.name ?? "").join(" ");
  return `${translations} ${muscles} ${equipment} ${exercise.category?.name ?? ""}`.toLocaleLowerCase();
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Sign in to search the exercise media catalogue." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) return json({ error: "Authentication is not configured." }, 503);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return json({ error: "Your session is invalid or expired." }, 401);

  let payload: { query?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Send a valid JSON request." }, 400);
  }

  if (typeof payload.query !== "string" || payload.query.trim().length < 2 || payload.query.length > 100) {
    return json({ error: "Search must contain 2–100 characters." }, 400);
  }

  try {
    const upstream = await fetch("https://wger.de/api/v2/exerciseinfo/?limit=100", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!upstream.ok) {
      console.error("wger exercise catalogue returned", upstream.status);
      return json({ error: "The external exercise catalogue is temporarily unavailable." }, 502);
    }

    const catalogue = await upstream.json() as { results?: WgerExercise[]; next?: string | null };
    const needle = payload.query.trim().toLocaleLowerCase();
    const results = (catalogue.results ?? [])
      .filter((exercise) => getSearchText(exercise).includes(needle))
      .slice(0, 20)
      .map((exercise) => ({
        provider: "wger",
        providerExerciseId: exercise.id,
        category: exercise.category ?? null,
        muscles: exercise.muscles ?? [],
        equipment: exercise.equipment ?? [],
        translations: exercise.translations ?? [],
        images: exercise.images ?? [],
        videos: exercise.videos ?? [],
        sourceUrl: `https://wger.de/en/exercise/${exercise.id}`,
      }));

    return json({
      provider: "wger",
      attribution: "Exercise catalogue and media supplied by wger. Verify each item's displayed licence and author before reuse.",
      providerDocumentation: "https://wger.readthedocs.io/en/latest/api/api.html",
      results,
      hasMoreUpstreamResults: Boolean(catalogue.next),
    });
  } catch (error) {
    console.error("Exercise media lookup failed:", error);
    return json({ error: "Could not reach the external exercise catalogue. Please try again." }, 502);
  }
});
