"use client";

import { getFirebaseAuth } from "@/lib/firebaseClient";

export async function adminFetch(input: RequestInfo, init?: RequestInit) {
  const auth = getFirebaseAuth();
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const headers = new Headers(init?.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
