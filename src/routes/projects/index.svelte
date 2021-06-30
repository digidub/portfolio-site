<script>
	import PageSlide from '../../Components/PageSlide.svelte';
	import ProjectCard from '../../Components/ProjectCard.svelte';
	import Card from '../../Components/ProjectCard.svelte';
	// import fetchData from '../../lib/fetchData';

	async function fetchData() {
		const response = await fetch('../../static/projects.json');
		const data = await response.json();
		return await data;
	}
</script>

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
