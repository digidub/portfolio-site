<script>
	import { page } from '$app/stores';
</script>

<svelte:head>
	<base target="_blank" />
</svelte:head>

<div class="container">
	<div class="wrapper">
		<header class="page-header">
			<a class="page-name" href="/">Alex Cox</a>
			<nav class="page-nav">
				<ul>
					<li>
						<a aria-current={$page.path === '/cv' ? 'page' : undefined} href="/cv">Cv</a>
					</li>
					<li>
						<a aria-current={$page.path === '/projects' ? 'page' : undefined} href="/projects"
							>Projects</a
						>
					</li>
					<li>
						<a aria-current={$page.path === '/contact' ? 'page' : undefined} href="/contact"
							>Contact</a
						>
					</li>
				</ul>
			</nav>
		</header>
		<slot />
	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Lato&display=swap');

	:root {
		font-family: 'Lato';
		background-color: #8ee4af;
		color: #05386b;
	}

	.page-header {
		padding: 1em 0 0.5em 0;
		border-bottom: 1px solid #379683;
		display: flex;
		flex-direction: column;
	}

	.page-name {
		font-family: 'Lato';
		font-weight: 900;
		text-align: center;
		font-size: 3em;
		text-decoration: none;
		color: #edf5e1;
	}

	.page-nav {
		text-transform: uppercase;
		font-size: 80%;
		text-align: center;
		letter-spacing: 1px;
		margin: 5px 0 5px 0;
	}

	a {
		text-decoration: none;
		color: #05386b;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		display: inline;
		padding: 0 0.25em;
	}

	.container {
		display: flex;
		flex-direction: column;
		margin: auto;
		min-height: 100%;
	}

	.wrapper {
		padding-bottom: 2em;
		flex-grow: 1;
		padding: 0 1em;
		margin: auto;
	}

	[aria-current] {
		color: #edf5e1;
		font-weight: bold;
	}

	@media only screen and (min-width: 64em) {
		.container {
			max-width: 990px;
		}

		.wrapper {
			width: 100%;
		}
	}

	@media only screen and (min-width: 40em) {
		.page-header {
			padding: 1em 0 0.5em 0;
			border-bottom: 1px solid #379683;
			display: flex;
			flex-flow: row nowrap;
			justify-content: space-between;
			align-items: flex-end;
			margin-bottom: 0;
		}

		.page-name {
			text-align: left;
		}

		li {
			padding: 0 0 0 2em;
		}
	}
</style>
