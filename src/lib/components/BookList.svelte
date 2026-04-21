<script lang="ts">
  import { t } from '$lib/stores/i18n.svelte.js';
  import File from '@lucide/svelte/icons/file';
  import Download from '@lucide/svelte/icons/download';
  import Button from '$lib/components/ui/button/button.svelte';
  import Badge from '$lib/components/ui/badge/badge.svelte';

  interface Book {
    filename: string;
    size: string;
    type: string;
    url: string;
  }

  interface Level {
    level: number;
    titleKey: string;
    books: Book[];
  }

  const bookLevels: Level[] = [
    {
      level: 1,
      titleKey: 'beginner',
      books: [
        { filename: 'FOR A NEW LIBERTY: THE LIBERTARIAN MANIFESTO - ROTHBARD.pdf', size: '5.6 MB', type: 'pdf', url: 'books/For a New Liberty The Libertarian Manifesto.pdf' },
        { filename: 'WHAT HAS GOVERNMENT DONE TO OUR MONEY - ROTHBARD.pdf', size: '224 KB', type: 'pdf', url: 'books/Rothbard_What_Has_Government_Done.pdf' },
        { filename: 'ANATOMY OF THE STATE - ROTHBARD.pdf', size: '1.7 MB', type: 'pdf', url: 'books/anatomy-of-the-state.pdf' }
      ]
    },
    {
      level: 2,
      titleKey: 'intermediate',
      books: [
        { filename: 'SOCIALISM AN ECONOMİC AND SOCIOLOGICAL ANALYSIS - MISES.pdf', size: '30.4 MB', type: 'pdf', url: 'books/Socialism An Economic and Sociological Analysis.pdf' },
        { filename: 'WAR PEACE AND STATE - ROTHBARD.pdf', size: '50 KB', type: 'pdf', url: 'books/war-peace-state.pdf' },
        { filename: 'JUSTICE AND PROPERTY RIGHTS - ROTHBARD.pdf', size: '91 KB', type: 'pdf', url: 'books/justice-and-property-rights.pdf' }
      ]
    },
    {
      level: 3,
      titleKey: 'advanced',
      books: [
        { filename: 'THEORY OF SOCIALISM AND CAPITALISM - HH HOPPE.pdf', size: '2.2 MB', type: 'pdf', url: 'books/Theory of Socialism and Capitalism.pdf' },
        { filename: 'ECONOMIC SCIENCE AND THE AUSTRIAN METHOD - HH HOPPE.pdf', size: '5.5 MB', type: 'pdf', url: 'books/Economic Science and the Austrian Method.pdf' },
        { filename: 'GETTING LIBERTARIANISM RIGHT - HH HOPPE.pdf', size: '471 KB', type: 'pdf', url: 'books/Getting Libertarianism Right.pdf' },
        {  filename: 'AGAINST INTELLECTUAL PROPERTY - KINSELLA.pdf', size: '3.2 MB', type: 'pdf', url: 'books/Against Intellectual Property.pdf' }
      ]
    },
    {
      level: 4,
      titleKey: 'theorist',
      books: [
        { filename: 'HUMAN ACTION - MISES.pdf', size: '56 MB', type: 'pdf', url: 'books/Human Action.pdf' },
        { filename: 'MAN ECONOMY AND STATE - ROTHBARD.pdf', size: '5.4 MB', type: 'pdf', url: 'books/Man, Economy, and State, with Power and Market.pdf' },
        { filename: 'DEMOCRACY THE GOD THAT FAILED - HH HOPPE.pdf', size: '3.2 MB', type: 'pdf', url: 'books/Hans-Hermann-Hoppe-Democracy-The-God-That-Failed.pdf' },
        { filename: 'LEGAL FOUNDATIONS OF A FREE SOCIETY - KINSELLA.pdf', size: '7.7 MB', type: 'pdf', url: 'books/legal-foundations-of-a-free-society.pdf' },
        { filename: 'A SHORT HISTORY OF MAN - HH HOPPE.pdf', size: '446 KB', type: 'pdf', url: 'books/A Short History of Man — Progress and Decline.pdf' }
      ]
    }
  ];

  let downloadingFiles = $state<Set<string>>(new Set());
  const DOWNLOAD_COOLDOWN_MS = 3000;

  function downloadFile(url: string, filename: string) {
    if (downloadingFiles.has(filename)) return;

    downloadingFiles.add(filename);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      downloadingFiles.delete(filename);
    }, DOWNLOAD_COOLDOWN_MS);
  }
</script>

<section class="w-full px-4">
  <div class="max-w-3xl mx-auto">
    <h2 class="text-2xl font-bold mb-4 text-center text-foreground">
      {t('books.title') || 'Eğitim Kitapları'}
    </h2>

    <div class="grid sm:grid-cols-2 gap-4">
      {#each bookLevels as level}
        <div class="bg-card rounded-lg border border-border p-4">
          <h3 class="text-sm font-semibold mb-3 text-primary flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
              {level.level}
            </span>
            {t(`books.${level.titleKey}`)}
          </h3>

          <div class="grid gap-2">
            {#each level.books as book}
              <div class="file-attachment flex flex-row gap-1 justify-between items-center p-2 bg-background rounded-md border border-dashed hover:border-primary/50 transition-colors">
                <div class="flex flex-row gap-2 items-center min-w-0 flex-1">
                  <div class="relative w-6 h-6 shrink-0">
                    <File strokeWidth={1.25} size={24} class="text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    <Badge variant="secondary" class="p-0 bg-transparent text-[6px] drop-shadow absolute top-2/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      .{book.type}
                    </Badge>
                  </div>

                  <div class="marquee-container max-w-[133px] flex-1">
                    <span class="marquee-text-placeholder">{book.filename}</span>
                    <div class="marquee-content" style="animation-duration: {Math.max(8, book.filename.length * 0.5)}s;">
                      <span class="marquee-text">{book.filename}</span>
                      <span class="marquee-text">{book.filename}</span>
                      <span class="marquee-text">{book.filename}</span>
                    </div>
                  </div>

                  <span class="text-muted-foreground text-xs shrink-0">{book.size}</span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onclick={() => downloadFile(book.url, book.filename)}
                  disabled={downloadingFiles.has(book.filename)}
                  class="shrink-0 h-7 w-7"
                >
                  <Download size={14} />
                </Button>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .marquee-container {
    position: relative;
    overflow: hidden;
    mask-image: linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%);
  }

  .marquee-text-placeholder {
    visibility: hidden;
    white-space: nowrap;
    font-size: 0.75rem;
    padding-right: 0.5rem;
  }

  .marquee-content {
    display: inline-flex;
    position: absolute;
    top: 0;
    left: 0;
    animation: marquee linear infinite;
  }

  .marquee-text {
    white-space: nowrap;
    font-size: 0.75rem;
    color: hsl(var(--secondary-foreground));
    padding-right: 0.5rem;
  }

  @keyframes marquee {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-66.666%);
    }
  }
</style>
