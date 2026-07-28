<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import { updated } from '$app/state';

  let { children } = $props();

  // A tab left open across a deploy still holds the old route manifest in
  // memory, so a client-side navigation would request hashed chunks the new
  // deployment no longer serves — those 404 into the HTML error page, which
  // is what produces "Expected a JavaScript module but got text/html".
  // SvelteKit recovers from that on its own, but only *after* the failed
  // import. Forcing a full page load once a new version is detected means the
  // dead request is never made in the first place.
  beforeNavigate(({ willUnload, to }) => {
    if (updated.current && !willUnload && to?.url) {
      location.href = to.url.href;
    }
  });
</script>

{@render children()}
