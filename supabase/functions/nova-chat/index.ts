import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ChatMessage = { role: "user" | "assistant"; content: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("Authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Sign in to chat with NOVA." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: "NOVA authentication is not configured on the server." }, 503);
  }
  if (!openAiKey) {
    return json({ error: "NOVA's AI service is not configured yet. Add the server-side OPENAI_API_KEY secret." }, 503);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json({ error: "Your session is invalid or expired. Please sign in again." }, 401);

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 20_000) {
    return json({ error: "The chat request is too large." }, 413);
  }

  let payload: { messages?: unknown };
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "The request body is missing." }, 400);
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > 20_000) {
        await reader.cancel();
        return json({ error: "The chat request is too large." }, 413);
      }
      chunks.push(value);
    }
    const bodyBytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bodyBytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    payload = JSON.parse(new TextDecoder().decode(bodyBytes));
  } catch {
    return json({ error: "Send a valid JSON request." }, 400);
  }

  if (!Array.isArray(payload.messages) || payload.messages.length === 0 || payload.messages.length > 12) {
    return json({ error: "Send between 1 and 12 recent messages." }, 400);
  }

  const messages: ChatMessage[] = [];
  let totalCharacters = 0;
  for (const [index, item] of payload.messages.entries()) {
    const expectedRole = index % 2 === 0 ? "user" : "assistant";
    if (
      !item ||
      item.role !== expectedRole ||
      typeof item.content !== "string" ||
      item.content.trim().length === 0 ||
      item.content.length > 1500
    ) {
      return json({ error: "Messages must alternate between user and assistant and contain 1–1500 characters each." }, 400);
    }
    totalCharacters += item.content.length;
    if (totalCharacters > 6000) {
      return json({ error: "The conversation context is too large. Start a new chat." }, 413);
    }
    messages.push({ role: item.role, content: item.content.trim() });
  }
  if (messages[messages.length - 1]?.role !== "user") {
    return json({ error: "The latest message must be from you." }, 400);
  }

  const model = Deno.env.get("NOVA_MODEL") || "gpt-4o-mini";
  try {
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are NOVA, a clearly identified AI companion inside a human-performance platform. Be smart, friendly, warm, concise, and natural. You may discuss everyday interests and general questions as well as platform navigation. Do not claim to be human, a real friend, or a medical professional. Do not provide diagnosis, dangerous training advice, extreme dieting advice, or instructions for risky activities. For fitness programming or performance analysis, direct the user to the separate AI Coach module. Ask one clear follow-up question only when needed. Respect the user's language and reply in the language they use.",
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 450,
      }),
    });

    if (!aiResponse.ok) {
      const details = await aiResponse.text();
      console.error("NOVA provider request failed:", aiResponse.status, details.slice(0, 500));
      return json({ error: "NOVA could not respond right now. Please try again shortly." }, 502);
    }

    const result = await aiResponse.json();
    const reply = result.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      return json({ error: "NOVA returned an empty response. Please try again." }, 502);
    }
    return json({ reply: reply.trim(), model });
  } catch (error) {
    console.error("NOVA request failed:", error);
    return json({ error: "NOVA is temporarily unavailable. Please try again shortly." }, 500);
  }
});
