import { withSupabase } from "npm:@supabase/server@1.9.2";

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

const fetchHandler = withSupabase(
  { auth: "publishable" },
  async (request, ctx) => {
    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const token = typeof body.token === "string" ? body.token : "";
    // Tokens são 32 bytes aleatórios, representados por 64 caracteres hexadecimais.
    if (!/^[a-f0-9]{64}$/.test(token)) return Response.json({ access: null });

    // O wrapper valida a publishable key no header apikey.
    // Esta chave administrativa existe somente no contexto server-side da função.
    const adminClient = ctx.supabaseAdmin;

    const { data: accessRow, error: accessError } = await adminClient
      .from("customer_access")
      .select("id, buyer_name, product:digital_products!inner(title, description, product_type, youtube_url)")
      .eq("access_token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (accessError) {
      console.error("Customer access lookup failed:", accessError.code);
      return Response.json({ error: "Could not validate access" }, { status: 500 });
    }

    if (!accessRow?.product) return Response.json({ access: null });

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
        lessonIndex < 0 ||
        lessonIndex >= lessonCount ||
        typeof completed !== "boolean"
      ) {
        return Response.json({ error: "Invalid lesson progress" }, { status: 400 });
      }

      const { error: saveError } = await adminClient
        .from("customer_access_progress")
        .upsert(
          {
            customer_access_id: accessRow.id,
            lesson_index: lessonIndex,
            completed,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "customer_access_id,lesson_index" },
        );

      if (saveError) {
        console.error("Customer lesson progress update failed:", saveError.code);
        return Response.json({ error: "Could not save progress" }, { status: 500 });
      }
    }

    const { data: progressRows, error: progressError } = await adminClient
      .from("customer_access_progress")
      .select("lesson_index, completed")
      .eq("customer_access_id", accessRow.id);

    if (progressError) {
      console.error("Customer lesson progress lookup failed:", progressError.code);
      return Response.json({ error: "Could not load progress" }, { status: 500 });
    }

    const progress = Array.from({ length: lessonCount }, (_, index) =>
      Boolean(progressRows?.find((row) => row.lesson_index === index)?.completed)
    );

    return Response.json({
      access: {
        title: product.title,
        description: product.description,
        product_type: product.product_type,
        youtube_url: product.youtube_url,
        buyer_name: accessRow.buyer_name,
        progress,
      },
    });
  },
);

export default { fetch: fetchHandler };
