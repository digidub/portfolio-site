<script>
	import PageSlide from '../../components/PageSlide.svelte';
</script>

<svelte:head><title>Alex Cox • Web Developer • CV</title></svelte:head>

<PageSlide>
	<main>
		<h1 class="page-intro">CV</h1>
		<div class="cv">
			<h3>
				You can download the latest copy of my CV <a rel="external" href="./CV0621.pdf">here!</a>
			</h3>
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

		.cv {
			margin: auto;
			max-width: 500px;
		}

		.cv a {
			color: #edf5e1;
			font-weight: bold;
			text-decoration: none;
		}

		.cv a:hover {
			border-bottom: 1px solid #edf5e1;
		}
	}
</style>
