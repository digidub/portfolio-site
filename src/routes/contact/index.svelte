<script>
	import PageSlide from '../../components/PageSlide.svelte';
</script>

<svelte:head><title>Alex Cox • Web Developer • Contact</title></svelte:head>

<PageSlide>
	<main>
		<h1 class="page-intro">Contact</h1>
		<div class="contact">
			<p>I'd love to hear from you!</p>
			<p><a href="mailto:alexwscox@gmail.com">alexwscox@gmail.com</a></p>
			<p>07399 592 841</p>
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
