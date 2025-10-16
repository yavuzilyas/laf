<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { ShieldAlert, X } from "@lucide/svelte";
  import { showToast } from "$lib/hooks/toast";
      import { t, tJoin, tMany } from '$lib/stores/i18n.svelte.js';
import { cn } from "$lib/utils.js";
  let { openVerif = false, onVerified = () => {}, onCancel = () => {} } = $props();

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
        showToast(t('auth.success.mnemonicVerified'), "success");
        openVerif = false;
        onVerified();
        resetState();
      } else {
        handleVerificationError(data);
      }
    } catch (error) {
      showToast(t('auth.errors.connectionError'), "error");
    } finally {
      loading = false;
    }
  }

  function handleVerificationError(data: any) {
    if (data.reset) {
      showToast(t('auth.errors.ProcessCanceled'), "error");
      openVerif = false;
      onCancel();
      resetState();
    } else {
      attemptCount++;
      remainingAttempts = 3 - attemptCount;
      mnemonicAnswer = "";
      showToast(data.error || t('auth.errors.wrongMnemonic'), "error");
    }
  }

  function handleCancel() {
    openVerif = false;
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
    if (openVerif && !mnemonicIndex && !loading) {
      getMnemonicQuestion();
    }
  });

  $effect(() => {
    if (openVerif) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleCancel();
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  });
 import * as Drawer from "$lib/components/ui/drawer/index.js";
</script>
<Drawer.Root  bind:open={openVerif} dismissible={true} onClose={handleCancel}>
 <Drawer.Trigger class="sr-only">openVerif</Drawer.Trigger>
 <Drawer.Content>
      <div class="mx-auto w-full py-2 px-8 md:px-0 max-w-sm">

  <Drawer.Header>
    <ShieldAlert size={20} class="text-primary z-60 " />
   <Drawer.Title>{t('VerificationIsRequired')}</Drawer.Title>
   <Drawer.Description>{t('EnterTheMnemonicWord')}</Drawer.Description>
  </Drawer.Header>
  {#if mnemonicIndex !== null}
          <div class="z-60 space-y-2">

            <p class="z-60 text-sm font-medium text-primary bg-primary/10 p-2 rounded-md">
              {t("auth.login.mnemonicQuestionP1")} {mnemonicIndex + 1}{t("auth.login.mnemonicQuestionP2")}
            </p>
            <Input
              id="mnemonic-answer"
              type="text"
              placeholder={t('EnterMnemonic')}
              bind:value={mnemonicAnswer}
              disabled={loading}
              autofocus
            />
          </div>

          {#if attemptCount > 0}
            <div class="z-60  bg-yellow-500/20 border border-yellow-500/50 rounded-md p-2">
              <p class="z-60 text-xs text-yellow-500 text-center">
                {remainingAttempts} {t('attemptsLeft')}
              </p>
            </div>
          {/if}
        {:else if loading}
          <div class="z-60 flex justify-center py-4">
            <div class="z-60 h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent"></div>
          </div>
        {/if}
  <Drawer.Footer class="flex flex-row ">
           <Button
          class="flex-1 z-60 "
          onclick={verifyMnemonic}
          disabled={loading || !mnemonicAnswer.trim() || mnemonicIndex === null}
        >
          {#if loading}
            <span class="z-60 inline-flex items-center gap-2">
              <span class="z-60 h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent"></span>
              {t("Loading")}...
            </span>
          {:else}
            {t('Verificate')}({remainingAttempts})
          {/if}
        </Button>
          <Button variant="outline" class="z-60 flex-1" onclick={handleCancel} disabled={loading}>
         {t('Cancel')}
        </Button>
  </Drawer.Footer>
      </div>
 </Drawer.Content>
</Drawer.Root>   
