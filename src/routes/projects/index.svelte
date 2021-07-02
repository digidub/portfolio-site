<script>
	import PageSlide from '../../components/PageSlide.svelte';
	import ProjectCard from '../../components/ProjectCard.svelte';
	import { Jumper } from 'svelte-loading-spinners';
	import { base } from '$app/paths';

	async function fetchData() {
		const response = await fetch(`${base}/projects.json`);
		const data = await response.json();
		return await data;
	}
</script>

<svelte:head><title>Alex Cox • Web Developer • Projects</title></svelte:head>

<PageSlide>
	<main>
		<h1 class="page-intro">Projects</h1>

		<div class="projects">
			<h3 class="blurb">
				Here are some projects that I've recently been working on. I'm always building something so
				why not follow my <a href="https://github.com/digidub">GitHub</a> to stay up to date?
			</h3>
			{#await fetchData()}
				<Jumper size="60" color="#2d3047" unit="px">.</Jumper>
			{:then data}
				{#each data.projects as project}
					<ProjectCard {...project} />
				{/each}
			{/await}
		</div>
	</main>
</PageSlide>

<style>
	@media only screen and (min-width: 40em) {
		.page-intro {
			margin: auto;
			max-width: 500px;
			margin-top: 1em;
			margin-bottom: 0.5em;
		}

		.projects {
			margin: auto;
			max-width: 500px;
		}
	}
	.blurb {
		margin-top: 0px;
	}

	.projects a {
		color: #e03c5a;
		font-weight: 600px;
		text-decoration: none;
	}

	.projects a:hover {
		border-bottom: 1px solid #e03c5a;
	}
</style>
