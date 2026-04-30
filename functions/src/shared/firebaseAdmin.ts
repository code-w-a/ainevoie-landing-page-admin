import { App, getApp, initializeApp } from "firebase-admin/app";

export function getDefaultFirebaseApp(): App {
  try {
    return getApp();
  } catch {
    return initializeApp();
  }
}
