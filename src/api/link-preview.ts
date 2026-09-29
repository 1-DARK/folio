import { supabase } from "./supabase-client";

// Title, description, image and favicon of a web page, from the
// link-preview Edge Function (supabase/functions/link-preview).

export interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const { data, error } = await supabase.functions.invoke<
    LinkPreview & { error?: string }
  >("link-preview", { body: { url } });
  if (error) throw new Error(error.message);
  if (!data || data.error) throw new Error(data?.error ?? "No preview");
  return data;
}
