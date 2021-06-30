<script>
	import PageSlide from '../../Components/PageSlide.svelte';
</script>

<svelte:head><title>Alex Cox • Web Developer • Contact</title></svelte:head>

<PageSlide>
	<main>
		<h1 class="page-intro">Contact</h1>
		<div class="contact">
			<p>contact me</p>
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

		.contact {
			margin: auto;
			max-width: 500px;
		}
	}
</style>
