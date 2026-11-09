import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let token = "";
  try {
    const body = await request.json();
    token = typeof body?.token === "string" ? body.token : "";
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  // Tokens são 32 bytes aleatórios, representados por 64 caracteres hexadecimais.
  if (!/^[a-f0-9]{64}$/.test(token)) return json({ access: null });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  // A chave secreta existe somente no ambiente da Edge Function, nunca no React.
  const secretKey =
    Deno.env.get("SUPABASE_SECRET_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !secretKey) {
    console.error("Missing server-side Supabase function configuration.");
    return json({ error: "Service unavailable" }, 503);
  }

  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await adminClient
    .from("customer_access")
    .select("buyer_name, product:digital_products!inner(title, description, product_type, youtube_url)")
    .eq("access_token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Customer access lookup failed:", error.code);
    return json({ error: "Could not validate access" }, 500);
  }

  if (!data?.product) return json({ access: null });

  return json({
    access: {
      title: data.product.title,
      description: data.product.description,
      product_type: data.product.product_type,
      youtube_url: data.product.youtube_url,
      buyer_name: data.buyer_name,
    },
  });
});
