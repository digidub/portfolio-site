/** @type {import('@sveltejs/kit').Config} */
import adapter from '@sveltejs/adapter-netlify';
import vercel from '@sveltejs/adapter-vercel';

const config = {
	kit: {
		target: '#svelte',
		adapter: vercel()
	}
};

export default config;
