<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { ShieldAlert, X } from "@lucide/svelte";
  import { showToast } from "$lib/hooks/toast";
  import { t, tJoin, tMany } from '$lib/stores/i18n.svelte.js';
  import { cn } from "$lib/utils.js";
  import { onMount } from 'svelte';
  
  let { openVerif = false, onVerified = () => {}, onCancel = () => {} } = $props();

  // Generate a verification token when the component mounts
  const generateUUID = () => {
    // Use crypto.randomUUID() if available, otherwise fall back to a custom implementation
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback implementation for browsers that don't support crypto.randomUUID()
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  let verificationToken = generateUUID();
  let mnemonicInput: HTMLInputElement;

  let loading = $state(false);
  let mnemonicIndex = $state<number | null>(null);
  let mnemonicAnswer = $state("");
  let attemptCount = $state(0);
  let remainingAttempts = $state(3);

  async function getMnemonicQuestion() {
    try {
      loading = true;
      // Generate a new token for each verification attempt
      verificationToken = generateUUID();
      
      const res = await fetch('/api/auth/mnemonic-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ verificationToken }),
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        // Update the verification token with the one from the server
        verificationToken = data.verificationToken;
        mnemonicIndex = data.index;
        // Reset attempt count when getting a new question
        attemptCount = 0;
        remainingAttempts = 3;
        console.log('New verification token set:', verificationToken);
      } else {
        const error = await res.json().catch(() => ({}));
        showToast(error.error || 'Doğrulama sorusu alınamadı', "error");
        handleCancel();
      }
    } catch (error) {
      console.error('Mnemonic question error:', error);
      showToast(error.message || 'Bağlantı hatası. Lütfen tekrar deneyin.', "error");
      handleCancel();
    } finally {
      loading = false;
      // Focus the input when question is loaded
      if (mnemonicInput) {
        setTimeout(() => mnemonicInput.focus(), 100);
      }
    }
  }

  async function verifyMnemonic() {
    if (!mnemonicAnswer.trim() || mnemonicIndex === null) return;

    loading = true;
    try {
      console.log('Verifying with token:', verificationToken);
      const payload = {
        index: mnemonicIndex,
        word: mnemonicAnswer.trim(),
        attempts: attemptCount,
        verificationToken: verificationToken
      };
      console.log('Sending verification payload:', payload);
      
      const res = await fetch('/api/auth/verify-mnemonic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(e => {
        console.error('Failed to parse response:', e);
        return { error: 'Geçersiz yanıt formatı' };
      });
      
      console.log('Verification response:', { status: res.status, data });

      if (res.ok) {
        if (data.verificationToken) {
          verificationToken = data.verificationToken;
          console.log('Updated verification token:', verificationToken);
        }
        showToast(data.message || 'Doğrulama başarılı', "success");
        openVerif = false;
        onVerified(verificationToken);
        resetState();
      } else {
        handleVerificationError(data);
      }
    } catch (error) {
      console.error('Verify mnemonic error:', error);
      showToast('Doğrulama sırasında bir hata oluştu. Lütfen tekrar deneyin.', "error");
    } finally {
      loading = false;
    }
  }

  function handleVerificationError(data: any) {
    if (data.reset) {
      showToast(data.error || 'Çok fazla başarısız deneme. Lütfen tekrar deneyin.', "error");
      openVerif = false;
      onCancel();
      resetState();
    } else {
      attemptCount++;
      remainingAttempts = 3 - attemptCount;
      mnemonicAnswer = "";
      showToast(data.error || 'Yanlış mnemonic kelimesi. Kalan deneme hakkınız: ' + remainingAttempts, "error");
      
      // Focus the input for next attempt
      if (mnemonicInput) {
        setTimeout(() => mnemonicInput.focus(), 100);
      }
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
    if (openVerif) {
      if (!mnemonicIndex && !loading) {
        getMnemonicQuestion();
      }
      // Focus input when dialog opens
      if (mnemonicInput) {
        setTimeout(() => mnemonicInput.focus(), 100);
      }
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
            <form on:submit|preventDefault={verifyMnemonic}>
              <Input
                id="mnemonic-answer"
                type="text"
                placeholder={t('EnterMnemonic')}
                bind:value={mnemonicAnswer}
                bind:this={mnemonicInput}
                disabled={loading}
                on:keydown={(e) => e.key === 'Enter' && verifyMnemonic()}
              />
            </form>
          

          {#if attemptCount > 0}
            <div class="z-60  bg-red-500/20 border border-red-500/75 rounded-md p-1.5">
              <p class="z-60 text-xs text-red-500 text-center">
                {remainingAttempts} {t('attemptsLeft')}
              </p>
            </div>
          {/if}</div>
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
