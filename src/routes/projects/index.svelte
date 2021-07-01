<script>
	import PageSlide from '../../components/PageSlide.svelte';
	import ProjectCard from '../../components/ProjectCard.svelte';
	import { Jumper } from 'svelte-loading-spinners';

	async function fetchData() {
		const response = await fetch('./projects.json');
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
				<Jumper size="60" color="#05386b" unit="px">.</Jumper>
			{:then data}
				{#each data.projects as project}
					<ProjectCard {...project} />
				{/each}
			{/await}
		</div>
	</main>
</PageSlide>

<style>
	@media only screen and (min-width: 65em) {
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

		.blurb {
			margin-top: 0px;
		}

		.projects a {
			color: #edf5e1;
			font-weight: 600px;
			text-decoration: none;
		}

		.projects a:hover {
			border-bottom: 1px solid #edf5e1;
		}
	}
</style>
