<script>
	import PageSlide from '../../components/PageSlide.svelte';
	import ProjectCard from '../../components/ProjectCard.svelte';

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
			{#await fetchData()}
				<pre>waiting</pre>
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
			margin-bottom: 1em;
		}

		.projects {
			margin: auto;
			max-width: 500px;
		}
	}
</style>
