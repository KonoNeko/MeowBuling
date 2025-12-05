import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '')
  return {
    plugins: [react()],
    define: {
      // Expose API_KEY to the client-side code.
      // We check env.GEMINI_API_KEY first (your Vercel setting), then fallback to env.API_KEY.
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY)
    }
  }
})