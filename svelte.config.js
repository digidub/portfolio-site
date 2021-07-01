/** @type {import('@sveltejs/kit').Config} */
import adapter from '@sveltejs/adapter-static';
//import adapter from '@sveltejs/adapter-netlify';

const config = {
	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',
		adapter: adapter({
			// default options are shown
			pages: 'build',
			assets: 'build',
			fallback: 'index.html'
		})
	}
};

export default config;
