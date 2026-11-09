import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const youtubeId = (raw: string) => {
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] ?? "";
    if (!["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) return "";
    if (url.searchParams.get("v")) return url.searchParams.get("v") ?? "";
    return url.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/)?.[1] ?? "";
  } catch {
    return "";
  }
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const token = typeof body.token === "string" ? body.token : "";
  // Tokens são 32 bytes aleatórios, representados por 64 caracteres hexadecimais.
  if (!/^[a-f0-9]{64}$/.test(token)) return json({ access: null });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  // Projetos atuais disponibilizam chaves secretas como um mapa JSON.
  // O fallback legado/local existe apenas para compatibilidade do runtime.
  let secretKey = "";
  const secretKeysJson = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeysJson) {
    try {
      const secretKeys = JSON.parse(secretKeysJson);
      secretKey = typeof secretKeys.default === "string" ? secretKeys.default : "";
    } catch {
      console.error("Supabase secret-key environment value is not valid JSON.");
    }
  }
  secretKey =
    secretKey ||
    Deno.env.get("SUPABASE_SECRET_KEY") ||
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    "";

  if (!supabaseUrl || !secretKey) {
    console.error("Missing server-side Supabase function configuration.");
    return json({ error: "Service unavailable" }, 503);
  }

  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: accessRow, error: accessError } = await adminClient
    .from("customer_access")
    .select("id, buyer_name, product:digital_products!inner(title, description, product_type, youtube_url)")
    .eq("access_token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (accessError) {
    console.error("Customer access lookup failed:", accessError.code);
    return json({ error: "Could not validate access" }, 500);
  }

  if (!accessRow?.product) return json({ access: null });

  const product = accessRow.product as {
    title: string;
    description: string;
    product_type: string;
    youtube_url: string | null;
  };
  const lessonCount = (product.youtube_url ?? "")
    .split(/\r?\n/)
    .map(youtubeId)
    .filter(Boolean).length;

  if (body.action === "set-progress") {
    const lessonIndex = body.lessonIndex;
    const completed = body.completed;
    if (
      typeof lessonIndex !== "number" ||
      !Number.isInteger(lessonIndex) ||
      Number(lessonIndex) < 0 ||
      Number(lessonIndex) >= lessonCount ||
      typeof completed !== "boolean"
    ) {
      return json({ error: "Invalid lesson progress" }, 400);
    }

    const { error: saveError } = await adminClient
      .from("customer_access_progress")
      .upsert(
        {
          customer_access_id: accessRow.id,
          lesson_index: Number(lessonIndex),
          completed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "customer_access_id,lesson_index" },
      );

    if (saveError) {
      console.error("Customer lesson progress update failed:", saveError.code);
      return json({ error: "Could not save progress" }, 500);
    }
  }

  const { data: progressRows, error: progressError } = await adminClient
    .from("customer_access_progress")
    .select("lesson_index, completed")
    .eq("customer_access_id", accessRow.id);

  if (progressError) {
    console.error("Customer lesson progress lookup failed:", progressError.code);
    return json({ error: "Could not load progress" }, 500);
  }

  const progress = Array.from({ length: lessonCount }, (_, index) =>
    Boolean(progressRows?.find((row) => row.lesson_index === index)?.completed)
  );

  return json({
    access: {
      title: product.title,
      description: product.description,
      product_type: product.product_type,
      youtube_url: product.youtube_url,
      buyer_name: accessRow.buyer_name,
      progress,
    },
  });
});
