/* eslint-disable no-undef */
export function useEnv() {
  const stigmanEnv = STIGMAN?.Env
  const viteEnv = import.meta.env

  const isProd = viteEnv.PROD === true

  const API_ORIGIN = isProd
    ? window.location.origin
    : viteEnv.VITE_API_ORIGIN

  const API_BASE = stigmanEnv.apiBase

  const API_URL = new URL(API_BASE, API_ORIGIN).toString().replace(/\/$/, '')
  stigmanEnv.apiUrl = API_URL

  return {
    ...stigmanEnv,

  }
}
