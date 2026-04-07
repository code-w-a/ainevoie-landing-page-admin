import { Blog } from "@/types/blog";
import { integrations } from "@integrations-config";
import type { QueryParams } from "next-sanity";

// Sanity is removed/disabled in this app.
export const isSanityConfigured = false;

export async function sanityFetch<QueryResponse>({
  query,
  qParams,
  tags,
}: {
  query: string;
  qParams: QueryParams;
  tags: string[];
}): Promise<QueryResponse> {
  return {} as QueryResponse;
}

export function imageBuilder(source: string) {
  // Keep API surface so blog components still compile even when Sanity is disabled.
  return {
    url: () => "",
  } as unknown as { url: () => string };
}

/** When Sanity is enabled, add an optional `locale` filter in GROQ for EN-only posts. */
export const getPosts = async (_locale?: string) => {
  void _locale;
  return [] as Blog[];
};

export const getPostBySlug = async (slug: string) => {
  return null as unknown as Blog | null;
};

export const getPostsByTag = async (tag: string) => {
  return [] as Blog[];
};

export const getPostsByAuthor = async (slug: string) => {
  return [] as Blog[];
};

export const getPostsByCategory = async (category: string) => {
  return [] as Blog[];
};

export const getAuthorBySlug = async (slug: string) => {
  return null as unknown;
};
