<script>
  import Navbar from "$lib/Navbar.svelte";
</script>

<Navbar />

<main class="max-w-4xl mx-auto px-4 py-10 space-y-6">
  <section class="bg-[var(--laf-gray-light)] rounded-lg p-6 shadow">
    <h1 class="text-xl font-bold text-primary">Liberteryen Anarşist Faaliyet</h1>
    <p class="mt-2 text-sm text-[var(--laf-white)]">
      Hoş geldiniz. Bu site özgürlüğün, anarşizmin ve bireysel sorumluluğun tartışıldığı bir mecra.
    </p>
  </section>

  <section class="grid gap-4 md:grid-cols-2">
    <article class="bg-[var(--laf-gray-light)] rounded-lg p-4 shadow">
      <h2 class="text-lg font-semibold text-primary">Makale</h2>
      <p class="text-xs mt-1 text-gray-300">
        Bu bölümde en son yazılarınızı sunabilirsiniz.
      </p>
    </article>
    <article class="bg-[var(--laf-gray-light)] rounded-lg p-4 shadow">
      <h2 class="text-lg font-semibold text-primary">Nutuk</h2>
      <p class="text-xs mt-1 text-gray-300">
        Podcastler ve sesli makaleler için tıklayın.
      </p>
    </article>
        <article class="bg-[var(--laf-gray-light)] rounded-lg p-4 shadow">
      <h2 class="text-lg font-semibold text-primary">Lügat</h2>
      <p class="text-xs mt-1 text-gray-300">
        Lİberteryen forumu.
      </p>
    </article>
        <article class="bg-[var(--laf-gray-light)] rounded-lg p-4 shadow">
      <h2 class="text-lg font-semibold text-primary">Külliyât</h2>
      <p class="text-xs mt-1 text-gray-300">
        Liberteryen açık kaynak ansiklopedi.
      </p>
    </article>
        <article class="bg-[var(--laf-gray-light)] rounded-lg p-4 shadow">
      <h2 class="text-lg font-semibold text-primary">Nutuk</h2>
      <p class="text-xs mt-1 text-gray-300">
        Merak ettiğiniz suallere uzmanların cevapları.
      </p>
    </article>
  </section>
</main>
