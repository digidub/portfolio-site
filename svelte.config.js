/** @type {import('@sveltejs/kit').Config} */
import adapter from '@sveltejs/adapter-static';
//import adapter from '@sveltejs/adapter-netlify';

const config = {
	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',
		adapter: adapter({
			// default options are shown
			pages: '/personal-portfolio',
			assets: '/personal-portfolio',
			fallback: 'index.html'
		})
	}
};

export default config;
