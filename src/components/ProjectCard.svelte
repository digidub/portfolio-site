<script>
	export let name;
	export let image;
	export let technologies;
	export let description;
	export let liveLink;
	export let repoLink;
	import infoIcon from '../../static/info.svg';
	import techIcon from '../../static/technologies.svg';
	import { isDarkMode } from '../components/stores';
</script>

<div class="card">
	<div class="card-header">
		<a href={repoLink}> <h2 class="card-title">{name}</h2></a>
		<a href={repoLink}>
			{#if !$isDarkMode}
				<img src="/githubdark.png" alt="github logo" />
			{:else}
				<img src="/githublight.png" alt="github logo" />
			{/if}
		</a>
	</div>
	<a href={liveLink}><img src={image} alt="project" /></a>
	<div class="card-body">
		<div class="info">
			<img src={techIcon} alt="technologies icon" />
			<p>
				{technologies}
			</p>
		</div>
		<div class="info">
			<img src={infoIcon} alt="info icon" />
			<p>
				{description}
			</p>
		</div>
	</div>
</div>

<style>
	.card {
		margin-bottom: 20px;
		border-bottom: 1px solid var(--border-color);
	}

	.card img {
		max-width: 100%;
	}

	.card-header {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 10px;
		border-bottom: 1px solid var(--background-color);
	}

	.card-header a {
		text-decoration: none;
		color: var(--text-color);
	}

	.card-header:hover {
		border-bottom: 1px solid var(--text-color);
	}

	h2 {
		margin-bottom: 0px;
	}

	.info {
		display: flex;
		flex-direction: row;
	}

	.info img {
		margin-right: 10px;
	}
</style>
