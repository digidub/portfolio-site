<script>
	import { page } from '$app/stores';
	import { isDarkMode } from '../components/stores';
	import { base } from '$app/paths';
	import sun from '../../static/sun.svg';
	import moon from '../../static/moon.svg';

	function toggle() {
		isDarkMode.set(!$isDarkMode);
		window.document.body.classList.toggle('dark');
	}
</script>

<!-- svelte-ignore component-name-lowercase -->
<svelte:head>
	<base target="_blank" />
</svelte:head>

<div class="container">
	<div class="wrapper">
		<header class="page-header">
			<a class="page-name" href="{base}/">Alex Cox</a>
			<nav class="page-nav">
				<ul>
					<li>
						<a aria-current={$page.path === '/projects' ? 'page' : undefined} href="{base}/projects"
							>Projects</a
						>
					</li>
					<li>
						<a aria-current={$page.path === '/cv' ? 'page' : undefined} href="{base}/cv">Cv</a>
					</li>
					<li>
						<a aria-current={$page.path === '/contact' ? 'page' : undefined} href="{base}/contact"
							>Contact</a
						>
					</li>
					<li class="darkmode-toggle">
						{#if !$isDarkMode}
							<input type="image" src={moon} on:click={toggle} alt="toggle dark mode" />
						{:else}
							<input type="image" src={sun} on:click={toggle} alt="toggle light mode" />
						{/if}
					</li>
				</ul>
			</nav>
		</header>
		<slot />
	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Lato&display=swap');

	:global(body) {
		--bg-color: #fff;
		--text-color: #2d3047;
		--border-color: #6d6d6d;
		--title-color: #e03c5a;
		--hover-color: #ee9d9d;
		font-family: 'Lato';
		background-color: var(--bg-color);
		color: var(--text-color);
		transition: all 0.5s;
	}

	:global(body.dark) {
		--bg-color: #20252d;
		--text-color: #f9f9f9;
		--border-color: #6d6d6d;
		--title-color: #e03c5a;
		--hover-color: #ee9d9d;
	}

	.page-header {
		padding: 1em 0 0.5em 0;
		border-bottom: 1px solid var(--bg-color);
		display: flex;
		flex-direction: column;
	}

	.page-name {
		font-family: 'Lato';
		font-weight: 900;
		text-align: center;
		font-size: 3em;
		text-decoration: none;
		color: #e03c5a;
	}

	.page-nav {
		text-transform: uppercase;
		font-size: 80%;
		text-align: center;
		letter-spacing: 1px;
		margin: 5px 0 5px 0;
	}

	.darkmode-toggle {
		height: 16px;
		vertical-align: middle;
	}

	a {
		text-decoration: none;
		color: var(--text-color);
	}

	a:hover {
		color: #ee9d9d;
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
		color: #e03c5a;
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
			border-bottom: 1px solid #6d6d6d;
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
