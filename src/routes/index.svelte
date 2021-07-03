<script>
	export const prerender = true;
	import { onMount } from 'svelte';
	import { visit } from '../components/stores';
	import PageSlide from '../components/PageSlide.svelte';

	let phrase = `I taught myself to build websites,
				such as this one.`;
	let typedChars = '';
	let index = 0;
	let typewriter;
	let body = false;

	const type = () => {
		if (!$visit) {
			if (index < phrase.length) {
				typedChars += phrase[index];
				index += 1;
			} else {
				clearInterval(typewriter);
				body = true;
				visit.set(true);
			}
		} else {
			clearInterval(typewriter);
			typedChars = phrase;
			body = true;
		}
		return;
	};

	const typer = () => (typewriter = setInterval(type, 50));

	onMount(() => {
		typer();
	});
</script>

<svelte:head><title>Alex Cox • Web Developer • Home</title></svelte:head>

<PageSlide>
	<main>
		<h1 class="page-intro">
			{typedChars}
		</h1>
		{#if body}
			<PageSlide>
				<div class="skills">
					<section>
						<h2>I'm a front-end web developer.</h2>
						<p>HTML5, CSS3, JavaScript, React, Svelte</p>
					</section>
					<section>
						<h2>...and I also know how things work under the hood.</h2>
						<p>NPM, Webpack, Git</p>
					</section>
					<section>
						<h2>I'm enthused about learning more</h2>
						<p>Node.js, Test-driven development</p>
					</section>
					<section>
						<h2>And I'm ready to offer my skills</h2>
						<p>Why not check out my <a href="/projects">portfolio</a>?</p>
					</section>
				</div>
			</PageSlide>
		{/if}
	</main>
</PageSlide>

<style>
	.skills a {
		color: var(--title-color);
		font-weight: bold;
		text-decoration: none;
	}

	.skills a:hover {
		border-bottom: 1px solid var(--title-color);
	}

	@media only screen and (min-width: 40em) {
		.page-intro {
			margin: auto;
			max-width: 500px;
			margin-top: 1em;
			margin-bottom: 1em;
		}

		.skills {
			margin: auto;
			max-width: 500px;
		}
	}

	@media only screen and (min-width: 65em) {
		.page-intro {
			margin: auto;
			max-width: 500px;
			margin-top: 1em;
			margin-bottom: 1em;
		}

		.skills {
			margin: auto;
			max-width: 500px;
		}
	}
</style>
