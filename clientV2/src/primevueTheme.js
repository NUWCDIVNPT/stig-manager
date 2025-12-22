import Material from '@primeuix/themes/material'
import { definePreset } from '@primevue/themes'

export const BluePreset = definePreset(Material, {
  semantic: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
  },
})

export const MyPrimeVuePT = {
  Select: {
    root: { style: 'background-color: #27272a; border-color: #3f3f46; width: 100%' },
    label: { style: 'padding: 6px 10px; font-size: 0.9rem; color: #e4e4e7' },
    option: { style: 'color: #e4e4e7' },
  },
}
