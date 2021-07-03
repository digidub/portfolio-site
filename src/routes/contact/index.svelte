<script>
	import PageSlide from '../../components/PageSlide.svelte';
	import emailIcon from '../../../static/email.svg';
	import phoneIcon from '../../../static/phone.svg';
</script>

<svelte:head><title>Alex Cox • Web Developer • Contact</title></svelte:head>

<PageSlide>
	<main>
		<h1 class="page-intro">Contact</h1>
		<div class="contact">
			<h3>
				I'd love to hear from you! Please feel free to reach out on either of the contact methods
				below.
			</h3>
			<div class="contact-info">
				<img src={emailIcon} alt="email icon" />
				<p><a href="mailto:alexwscox@gmail.com">alexwscox@gmail.com</a></p>
			</div>
			<div class="contact-info">
				<img src={phoneIcon} alt="phone icon" />
				<p>07399 592 841</p>
			</div>
		</div>
	</main>
</PageSlide>

<style>
	@media only screen and (min-width: 40em) {
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
	.contact-info {
		display: flex;
		flex-direction: row;
	}

	.contact-info img {
		margin-right: 10px;
	}

	.contact-info a {
		color: var(--title-color);
		font-weight: bold;
		text-decoration: none;
	}

	.contact-info a:hover {
		border-bottom: 1px solid var(--title-color);
	}
</style>
