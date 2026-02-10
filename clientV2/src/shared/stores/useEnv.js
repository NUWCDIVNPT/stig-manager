/* eslint-disable no-undef */
let cachedEnv = null

// this is used at boot strap to get the env and config of the api.
// it is done like this because at bootstrap we dont load the entire app and have access
// to things like global state, vue stuff.......
export async function bootstrapEnv() {
  const stigmanEnv = STIGMAN?.Env
  const viteEnv = import.meta.env

  const isProd = viteEnv.PROD === true

  const OUR_HREF = isProd
    ? window.location.href
    : viteEnv.VITE_API_ORIGIN

  const API_BASE = stigmanEnv.apiBase

  const API_URL = new URL(API_BASE, OUR_HREF).toString().replace(/\/$/, '')
  stigmanEnv.apiUrl = API_URL

  // fetch op/configuration and op/definition
  try {
    const [configRes, defRes] = await Promise.all([
      fetch(`${API_URL}/op/configuration`),
      fetch(`${API_URL}/op/definition`),
    ])
    stigmanEnv.apiConfig = configRes.ok ? await configRes.json() : null
    stigmanEnv.apiDefinition = defRes.ok ? await defRes.json() : null
  }
  catch (err) {
    console.error('failed to fetch op/configuration or op/definition', err)
  }

  cachedEnv = {
    ...stigmanEnv,
  }

  return cachedEnv
}

export function useEnv() {
  return STIGMAN.Env
}
