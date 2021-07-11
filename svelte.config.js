/** @type {import('@sveltejs/kit').Config} */
import adapter from '@sveltejs/adapter-netlify';
const config = {
	kit: {
		target: '#svelte',
		adapter: adapter()
	}
};

export default config;
