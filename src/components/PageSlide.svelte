<script>
	import { cubicInOut } from 'svelte/easing';

	let duration = 350;
	let delay = duration;

	const transitionIn = () => ({
		duration,
		delay,
		easing: cubicInOut,
		css: (t) => `opacity: ${t}`
	});

	const transitionOut = () => ({
		duration,
		delay: 0,
		easing: cubicInOut,
		css: (t) => `opacity: ${t}`
	});
</script>

<div in:transitionIn|local out:transitionOut|local>
	<slot />
</div>
