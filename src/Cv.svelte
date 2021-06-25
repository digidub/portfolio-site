<script>
  import { fly } from 'svelte/transition';
  import PageSlide from './Components/PageSlide.svelte';
</script>

<PageSlide>
  <main>
    <h1 class="page-intro">CV</h1>
    <div class="cv">
      <p>My CV</p>
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
  }
</style>
