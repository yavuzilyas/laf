<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { ShieldAlert, X } from "@lucide/svelte";
  import { showToast } from "$lib/hooks/toast";

  let { open = false, onVerified = () => {}, onCancel = () => {} } = $props();

  let loading = $state(false);
  let mnemonicIndex = $state<number | null>(null);
  let mnemonicAnswer = $state("");
  let attemptCount = $state(0);
  let remainingAttempts = $state(3);

  async function getMnemonicQuestion() {
    try {
      loading = true;
      const res = await fetch('/api/auth/mnemonic-question', {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        mnemonicIndex = data.index;
      } else {
        showToast("Doğrulama sorusu alınamadı", "error");
        handleCancel();
      }
    } catch (error) {
      showToast("Bağlantı hatası", "error");
      handleCancel();
    } finally {
      loading = false;
    }
  }

  async function verifyMnemonic() {
    if (!mnemonicAnswer.trim() || mnemonicIndex === null) return;

    loading = true;
    try {
      const res = await fetch('/api/auth/verify-mnemonic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          index: mnemonicIndex,
          word: mnemonicAnswer.trim(),
          attempts: attemptCount
        })
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Doğrulama başarılı", "success");
        open = false;
        onVerified();
        resetState();
      } else {
        handleVerificationError(data);
      }
    } catch (error) {
      showToast("Bağlantı hatası", "error");
    } finally {
      loading = false;
    }
  }

  function handleVerificationError(data: any) {
    if (data.reset) {
      showToast("3 başarısız deneme. İşlem iptal edildi.", "error");
      open = false;
      onCancel();
      resetState();
    } else {
      attemptCount++;
      remainingAttempts = 3 - attemptCount;
      mnemonicAnswer = "";
      showToast(data.error || "Yanlış kelime", "error");
    }
  }

  function handleCancel() {
    open = false;
    resetState();
    onCancel();
  }

  function resetState() {
    mnemonicAnswer = "";
    mnemonicIndex = null;
    attemptCount = 0;
    remainingAttempts = 3;
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter') verifyMnemonic();
    if (e.key === 'Escape') handleCancel();
  }

  $effect(() => {
    if (open && !mnemonicIndex && !loading) {
      getMnemonicQuestion();
    }
  });

  $effect(() => {
    if (open) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleCancel();
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  });
</script>

{#if open}
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4"
    onclick={handleCancel}
    role="presentation"
    tabindex="-1"
  >
    <div
      class="bg-background border border-border rounded-lg z-60 shadow-lg w-full max-w-md p-6"
      onclick={(e) => e.stopPropagation()}
      onkeydown={handleKeyPress}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="0"
    >
      <!-- Header -->
      <div class="flex items-center z-60  justify-between mb-4">
        <div class="flex items-center z-60 gap-2">
          <ShieldAlert size={20} class="text-primary z-60 " />
          <h2 class="text-lg font-semibold z-60 " id="modal-title">Doğrulama Gerekli</h2>
        </div>
        <Button variant="ghost" size="sm" onclick={handleCancel} class="z-60  h-8 w-8 p-0">
          <X size={16} />
        </Button>
      </div>

      <!-- Content -->
      <div class="space-y-4 z-60 ">
        <p class="z-60 text-sm text-muted-foreground">
          İşlemi tamamlamak için BIP-39 silsilenizdeki kelimenizi girin
        </p>

        {#if mnemonicIndex !== null}
          <div class="z-60 space-y-2">
            <Label for="mnemonic-answer">Silsile Kelimesi</Label>
            <p class="z-60 text-sm font-medium text-primary bg-primary/10 p-2 rounded-md">
              BIP-39 silsilenizdeki {mnemonicIndex + 1}. kelime nedir?
            </p>
            <Input
              id="mnemonic-answer"
              type="text"
              placeholder="Kelimeyi girin"
              bind:value={mnemonicAnswer}
              disabled={loading}
              autofocus
            />
          </div>

          {#if attemptCount > 0}
            <div class="z-60  bg-yellow-500/20 border border-yellow-500/50 rounded-md p-2">
              <p class="z-60 text-xs text-yellow-500 text-center">
                {remainingAttempts} deneme hakkınız kaldı
              </p>
            </div>
          {/if}
        {:else if loading}
          <div class="z-60 flex justify-center py-4">
            <div class="z-60 h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent"></div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="z-60 flex gap-3 mt-6">
        <Button variant="outline" class="z-60 flex-1" onclick={handleCancel} disabled={loading}>
          İptal
        </Button>
        <Button
          class="flex-1 z-60 "
          onclick={verifyMnemonic}
          disabled={loading || !mnemonicAnswer.trim() || mnemonicIndex === null}
        >
          {#if loading}
            <span class="z-60 inline-flex items-center gap-2">
              <span class="z-60 h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent"></span>
              Doğrulanıyor...
            </span>
          {:else}
            Doğrula ({remainingAttempts})
          {/if}
        </Button>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(body:has(.fixed.inset-0)) {
    overflow: hidden;
  }
</style>