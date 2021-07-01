<script>
	export let name;
	export let image;
	export let technologies;
	export let description;
	export let liveLink;
	export let repoLink;
	import infoIcon from '../../static/info.svg';
	import techIcon from '../../static/technologies.svg';
</script>

<div class="card">
	<div class="card-header">
		<a href={repoLink}> <h2 class="card-title">{name}</h2></a>
		<a href={repoLink}><img src="./GitHub.png" alt="github logo" /></a>
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
		border-bottom: 1px solid #05386b;
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
		border-bottom: 1px solid #8ee4af;
	}

	.card-header a {
		text-decoration: none;
		color: #05386b;
	}

	.card-header:hover {
		border-bottom: 1px solid #05386b;
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
