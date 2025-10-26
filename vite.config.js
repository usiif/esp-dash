import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	server: {
		allowedHosts: ['.loca.lt'], // ✅ allow all localtunnel URLs
		host: true, // optional: accept external requests
	  },
});
