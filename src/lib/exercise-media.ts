import { supabase } from "@/integrations/supabase/client";

export interface ExerciseMediaAsset {
  id?: number;
  image?: string;
  video?: string;
  url?: string;
  license?: {
    full_name?: string;
    url?: string;
    short_name?: string;
  };
  license_author?: string;
}

export interface LiveExerciseMediaResult {
  provider: "wger";
  providerExerciseId: number;
  category: { id?: number; name?: string } | null;
  muscles: Array<{ id?: number; name?: string; name_en?: string }>;
  equipment: Array<{ id?: number; name?: string }>;
  translations: Array<{ name?: string; description?: string; language?: number }>;
  images: ExerciseMediaAsset[];
  videos: ExerciseMediaAsset[];
  sourceUrl: string;
}

interface ExerciseMediaResponse {
  provider: "wger";
  attribution: string;
  providerDocumentation: string;
  results: LiveExerciseMediaResult[];
  hasMoreUpstreamResults: boolean;
}

export async function searchLiveExerciseMedia(query: string): Promise<ExerciseMediaResponse> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2 || normalizedQuery.length > 100) {
    throw new Error("Enter an exercise search between 2 and 100 characters.");
  }

  const { data, error } = await supabase.functions.invoke<ExerciseMediaResponse>("exercise-media", {
    body: { query: normalizedQuery },
  });

  if (error) throw new Error(error.message || "Live exercise catalogue search failed.");
  if (!data || data.provider !== "wger" || !Array.isArray(data.results)) {
    throw new Error("The exercise catalogue returned an unexpected response.");
  }

  return data;
}
