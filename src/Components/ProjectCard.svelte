<script>
	export let name;
	export let image;
	export let technologies;
	export let description;
	export let liveLink;
	export let repoLink;
</script>

<div class="card">
	<div class="card-header">
		<a href={repoLink}> <h2 class="card-title">{name}</h2></a>
		<a href={repoLink}><img src="../../static/GitHub.png" alt="github logo" /></a>
	</div>
	<img src={image} alt="project" />
	<div class="card-body">
		<p class="technologies">
			{technologies}
		</p>
		<p class="description">
			{description}
		</p>
	</div>
	<div class="card-footer">
		<a href={liveLink}>Live</a>
	</div>
</div>

<style>
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

	/* .card {
		height: 300px;
		width: 400px;
		border-radius: 15px;
		background-color: #edf5e1;
	}
	.card-header {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		border-top-left-radius: 15px;
		border-top-right-radius: 15px;
		height: 50%;
		background-image: url('https://i.imgur.com/JhXEWBq.png');
		background-size: contain;
	}
	.card-title {
		color: #05386b;
		margin: 0.1em;
	}
	.description {
		padding: 0.2em;
	} */
</style>
