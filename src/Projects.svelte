<script>
  import { fly } from 'svelte/transition';
  import PageSlide from './Components/PageSlide.svelte';
  import Card from './Components/ProjectCard.svelte';
</script>

<PageSlide>
  <main>
    <h1 class="page-intro">Projects</h1>
    <div class="projects">
      <Card />
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

    .projects {
      margin: auto;
      max-width: 500px;
    }
  }
</style>
