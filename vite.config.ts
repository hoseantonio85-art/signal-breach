import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Android assets must be relative for the app's local WebView origin.
// Pages deliberately keeps /signal-breach/ in the standard build.
function androidOfflineHtml(): Plugin {
  return {
    name: 'signal-android-offline-html',
    transformIndexHtml(html) {
      return html
        .split('\n')
        .filter((line) => !line.includes('href="https://fonts.googleapis.com') && !line.includes('href="https://fonts.gstatic.com'))
        .join('\n')
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'android' ? [androidOfflineHtml()] : [])],
  base: mode === 'android' ? './' : '/signal-breach/',
}))
