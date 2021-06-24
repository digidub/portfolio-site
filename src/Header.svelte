<script>
  import { Route } from 'svelte-micro';
</script>

<header class="page-header">
  <a class="page-name" href="/">Alex Cox</a>
  <nav class="page-nav">
    <ul>
      <li>Cv</li>
      <li>Projects</li>
      <li>Contact</li>
    </ul>
  </nav>
</header>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Lato&display=swap');

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
  }

  a {
    text-decoration: none;
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
