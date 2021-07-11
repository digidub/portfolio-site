/** @type {import('@sveltejs/kit').Config} */
import adapter from '@sveltejs/adapter-netlify';
const config = {
	kit: {
		target: '#svelte',
		adapter: adapter(),
		trailingSlash: 'always'
	}
};

export default config;
