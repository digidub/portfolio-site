const c = [
	() => import("../../../src/routes/__layout.svelte"),
	() => import("../components/error.svelte"),
	() => import("../../../src/routes/index.svelte"),
	() => import("../../../src/routes/projects/index.svelte"),
	() => import("../../../src/routes/contact/index.svelte"),
	() => import("../../../src/routes/cv/index.svelte")
];

const d = decodeURIComponent;

export const routes = [
	// src/routes/index.svelte
	[/^\/$/, [c[0], c[2]], [c[1]]],

	// src/routes/projects/index.svelte
	[/^\/projects\/?$/, [c[0], c[3]], [c[1]]],

	// src/routes/contact/index.svelte
	[/^\/contact\/?$/, [c[0], c[4]], [c[1]]],

	// src/routes/cv/index.svelte
	[/^\/cv\/?$/, [c[0], c[5]], [c[1]]]
];

export const fallback = [c[0](), c[1]()];