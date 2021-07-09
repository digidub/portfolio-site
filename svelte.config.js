/** @type {import('@sveltejs/kit').Config} */
import adapter from '@sveltejs/adapter-netlify';
const config = {
	kit: {
		target: '#svelte',
		adapter: adapter(),
		prerender: {
			crawl: true,
			enabled: true,
			force: true,
			pages: ['*']
		}
	}
};

export default config;
