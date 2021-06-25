<script>
	import { fly } from 'svelte/transition';
	import PageSlide from '../Components/PageSlide.svelte';
</script>

<PageSlide>
	<main>
		<h1 class="page-intro">
			I taught myself to build websites,
			<br />such as this one.
		</h1>

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
	</main>
</PageSlide>

<style>
	.skills a {
		color: #edf5e1;
		font-weight: 600px;
	}

	.skills a:hover {
		border-bottom: 1px solid #edf5e1;
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
