<script>
  import Header from './Header.svelte';
  import Home from './Home.svelte';
</script>

<div class="container">
  <div class="wrapper">
    <Header />
  </div>
</div>

<style>
  :global(body) {
    font-family: Lato;
    background: #8ee4af;
    color: #05386b;
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

  @media only screen and (min-width: 64em) {
    .container {
      max-width: 990px;
    }

    .wrapper {
      width: 100%;
    }
  }
</style>
