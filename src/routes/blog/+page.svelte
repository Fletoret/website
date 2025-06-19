<script lang="ts">
  import '$lib/css/app.css';
  let { data } = $props();
</script>

<main>
  <div class="container">
    <div class="posts">
      {#each data.posts as post}
        <a class="post" href="/{post.relativeUrl}">
          <div class="content">
            <h1 class="title">{post.title}</h1>
            <div class="subtitle">
              {post.subtitle}<span class="date"> - {post.human_date}</span>
            </div>
          </div>
        </a>
      {/each}
    </div>
  </div>
</main>

<style>
  main {
    padding-top: var(--spacing-2xxl);
  }
  .container {
    margin: 0 auto;
    padding: var(--spacing-xxl) var(--spacing-md);
    max-width: 1200px;
  }

  .posts {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-xl);
  }

  /* Featured article: spans all columns and gives a more prominent style */
  .posts .post:first-child {
    grid-column: 1 / -1;
    grid-row: span 2;
    padding: var(--spacing-xxl);
    font-size: var(--text-lg2);
    background-color: var(--bg-primary);
    border-radius: var(--radius-md);
  }

  /* Standard article styling */
  .posts .post {
    display: block;
    font-size: var(--text-md);
    padding: var(--spacing-xl);
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color, #ddd);
    border-radius: var(--radius-sm);
  }
  .post {
    display: block;
    font-size: var(--text-md);
    padding: var(--spacing-xl);
    width: 100%;
  }
  .post .title {
    /* font-family: var(--sans-serif-display); */
    font-size: var(--text-lg2);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-md);
  }

  .post .subtitle {
    font-size: var(--text-md);
    color: var(--text-secondary);
  }
  .post .subtitle .date {
    font-size: var(--text-sm);
    margin-left: var(--spacing-md);
  }
  .post:hover {
    border-radius: var(--radius-md);
    background-color: var(--bg-secondary);
  }
</style>
