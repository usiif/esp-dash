<script>
	import '../app.css';
	let { children } = $props();

	if (typeof window !== "undefined") {
	  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
	  // send timezone to server only if changed
	  fetch("/api/set-tz", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ tz })
	  });
	}
</script>

{@render children()}
