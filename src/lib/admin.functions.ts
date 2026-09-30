import { createHash, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

type AdminSession = { unlocked?: boolean };

type Memory = { id: string; url: string; label: string };
type Keepsake = { heading: string; message: string; memories: Memory[] };

const supabaseUrl = "https://hoodpwdqqxoiqdagxtdf.supabase.co";
const supabaseKey = "sb_publishable_mwzUsLw1mhP2_7haEUyvDg_0pWnJ8fS";

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

function sessionConfig() {
  const secret = process.env["SESSION_SECRET"] || "radha-birthday-secret-2026";
  
  return {
    password: secret,
    name: "radha-birthday-admin",
    maxAge: 60 * 60 * 24 * 7,
    cookie: {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

function passwordMatches(input: string, expected: string) {
  const inputHash = createHash("sha256").update(input, "utf8").digest();
  const expectedHash = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(inputHash, expectedHash);
}

export const unlockAdmin = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ password: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const expected = process.env["SITE_PASSWORD"] || "loveu";
    if (!passwordMatches(data.password, expected)) return { ok: false as const };

    const session = await useSession<AdminSession>(sessionConfig());
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const getAdminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  return { unlocked: Boolean(session.data.unlocked) };
});

export const lockAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

// Get keepsake from Supabase
export const getKeepsake = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("keepsake")
    .select("heading, message, memories")
    .eq("id", 1)
    .single();

  if (error || !data) {
    console.error("Error fetching keepsake:", error);
    return null;
  }

  return data as Keepsake;
});

// Save keepsake to Supabase
export const saveKeepsake = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        heading: z.string(),
        message: z.string(),
        memories: z.array(
          z.object({
            id: z.string(),
            url: z.string(),
            label: z.string(),
          }),
        ),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const session = await useSession<AdminSession>(sessionConfig());
    if (!session.data.unlocked) {
      return { ok: false as const, error: "Not unlocked" };
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from("keepsake")
      .update({
        heading: data.heading,
        message: data.message,
        memories: data.memories,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) {
      console.error("Error saving keepsake:", error);
      return { ok: false as const, error: error.message };
    }

    return { ok: true as const };
  });
