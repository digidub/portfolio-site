<script>
  import Header from './Header.svelte';
</script>

<div class="container">
  <div class="wrapper">
    <Header />
  </div>
</div>

<style>
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
</style>
