import { useState } from "react";
import { ExternalLink, ImageOff, Loader2, Play, Search } from "lucide-react";
import {
  searchLiveExerciseMedia,
  type LiveExerciseMediaResult,
} from "@/lib/exercise-media";

interface LiveExerciseMediaPanelProps {
  exerciseName: string;
}

export function LiveExerciseMediaPanel({ exerciseName }: LiveExerciseMediaPanelProps) {
  const [items, setItems] = useState<LiveExerciseMediaResult[]>([]);
  const [attribution, setAttribution] = useState("");
  const [query, setQuery] = useState(exerciseName);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const response = await searchLiveExerciseMedia(query);
      setItems(response.results);
      setAttribution(response.attribution);
    } catch (cause) {
      setItems([]);
      setError(cause instanceof Error ? cause.message : "Live media search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Verified external catalogue
          </p>
          <h2 className="mt-1 text-lg font-semibold">Exercise images & demonstrations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search the live wger exercise catalogue. Media is shown only when the source provides it.
          </p>
        </div>
        <a
          href="https://wger.de/en/software/api"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          API source <ExternalLink className="size-3" />
        </a>
      </div>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
      >
        <input
          aria-label="Search live exercise catalogue"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          minLength={2}
          maxLength={100}
          className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
          placeholder="Search exercise name"
        />
        <button
          type="submit"
          disabled={loading || query.trim().length < 2}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          {loading ? "Searching…" : "Find real media"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {searched && !loading && !error && items.length === 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          <ImageOff className="size-4 shrink-0" />
          No matching media was returned by the live source. No placeholder image or demo has been substituted.
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-5 space-y-4">
          <p className="text-xs text-muted-foreground">
            {items.length} source result{items.length === 1 ? "" : "s"} · {attribution}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => {
              const title = item.translations.find((translation) => translation.name)?.name ??
                `Exercise #${item.providerExerciseId}`;
              const videos = item.videos.filter((asset) => asset.video || asset.url);
              return (
                <article key={item.providerExerciseId} className="overflow-hidden rounded-lg border border-border">
                  {item.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1 bg-muted p-1">
                      {item.images.slice(0, 2).map((asset, index) => (
                        <a
                          key={asset.id ?? asset.image ?? index}
                          href={asset.image ?? asset.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <img
                            src={asset.image ?? asset.url}
                            alt={`${title} exercise demonstration ${index + 1}`}
                            loading="lazy"
                            className="aspect-video w-full rounded object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-muted text-sm text-muted-foreground">
                      <ImageOff className="mr-2 size-4" /> No image supplied
                    </div>
                  )}
                  <div className="space-y-2 p-3">
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {[item.category?.name, ...item.muscles.map((muscle) => muscle.name_en ?? muscle.name)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {videos.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {videos.map((asset, index) => (
                          <a
                            key={asset.id ?? asset.video ?? asset.url ?? index}
                            href={asset.video ?? asset.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-primary/30 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
                          >
                            <Play className="size-3" /> Watch demo {videos.length > 1 ? index + 1 : ""}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No video supplied by this source.</p>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
                      <span>
                        {item.images[0]?.license?.short_name ?? item.videos[0]?.license?.short_name
                          ? `License: ${item.images[0]?.license?.short_name ?? item.videos[0]?.license?.short_name}`
                          : "Check source terms"}
                        {(item.images[0]?.license_author ?? item.videos[0]?.license_author)
                          ? ` · ${item.images[0]?.license_author ?? item.videos[0]?.license_author}`
                          : ""}
                      </span>
                      <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                        Source <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
