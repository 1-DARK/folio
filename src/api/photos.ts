import { supabase } from "./supabase-client";

// Free photo search (Pexels) through the pexels-search Edge Function
// (supabase/functions/pexels-search), so the Pexels key stays on the server.

export interface Photo {
  id: number;
  alt: string | null;
  /** The photo's page on Pexels. */
  url: string;
  photographer: string;
  photographerUrl: string;
  src: { medium: string; large2x: string };
}

export async function searchPhotos(
  query: string,
  {
    orientation = "landscape",
    perPage = 18,
  }: {
    orientation?: "landscape" | "portrait" | "square";
    perPage?: number;
  } = {},
): Promise<Photo[]> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase.functions.invoke<{
    photos?: Photo[];
    error?: string;
  }>("pexels-search", { body: { query: q, orientation, perPage } });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data?.photos ?? [];
}
