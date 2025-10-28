// Application configuration
// This file contains environment-specific settings that can be easily modified

const config = {
  apiBase: import.meta.env.VITE_API_BASE || 'http://localhost:64001/api',
  // classification: one of 'NONE', 'U', 'CUI', 'C', 'S', 'TS', 'SCI'
  classification: import.meta.env.VITE_CLASSIFICATION || 'S',
}

export default config
