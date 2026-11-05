import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {VitePWA} from 'vite-plugin-pwa';
export default defineConfig({envDir:'../..',plugins:[react(),tailwindcss(),VitePWA({registerType:'autoUpdate',manifest:{name:'Land Locator',short_name:'Land Locator',description:'Find land. Explore locations.',theme_color:'#512DA8',background_color:'#ffffff',display:'standalone',start_url:'/',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]},workbox:{navigateFallbackDenylist:[/^\/api/],globPatterns:['**/*.{js,css,html,png,svg,woff2}'],runtimeCaching:[]}})],server:{proxy:{'/api':'http://localhost:4000'}},build:{outDir:'dist',chunkSizeWarningLimit:1200}});
