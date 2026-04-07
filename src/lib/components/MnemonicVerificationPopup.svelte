<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { ShieldAlert, X } from "@lucide/svelte";
  import { showToast } from "$lib/hooks/toast";
  import { t } from '$lib/stores/i18n.svelte.js';
  import { cn } from "$lib/utils.js";
  import { onMount } from 'svelte';
import { BarSpinner } from "$lib/components/spell/bar-spinner";

  let { openVerif = $bindable(false), onVerified = () => {}, onCancel = () => {}, verificationToken: initialToken = null } = $props();

  // Helper function to get current user ID from session
  async function getCurrentUserId(): Promise<string> {
    const response = await fetch('/api/auth/session');
    const data = await response.json();
    return data.user?.id || '';
  }

  $effect(() => {
    if (initialToken !== verificationToken) {
      verificationToken = initialToken;
    }
  });

  let verificationToken = $state(initialToken);
  let mnemonicInput: HTMLInputElement;

  let loading = $state(false);
  let mnemonic = $state("");
  let attemptCount = $state(0);
  let remainingAttempts = $state(3);
  let errorMessage = $state("");
  let errorMessageKey = $state(0);
  let errorMessageExiting = $state(false);

  async function verifymnemonic() {
    if (!mnemonic.trim()) return;

    loading = true;
    try {
      const userId = await getCurrentUserId();
      const payload = {
        mnemonicPhrase: mnemonic.trim(),
        verificationToken: verificationToken
      };
      
      const res = await fetch('/api/auth/verify-mnemonic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(e => {
        return { error: t('InvalidResponseFormat') };
      });
      

      if (res.ok) {
        if (data.verificationToken) {
          verificationToken = data.verificationToken;
        }
        showToast(data.message || t('VerificationSuccessful'), "success");
        openVerif = false;
        onVerified(verificationToken);
        resetState();
      } else {
        handleVerificationError(data);
      }
    } catch (error) {
      showToast(t('VerificationError'), "error");
    } finally {
      loading = false;
    }
  }

  function handleVerificationError(data: any) {
    if (data.reset) {
      if (errorMessage !== (data.error || t('TooManyFailedAttempts'))) {
        errorMessageExiting = false;
        errorMessageKey++;
      }
      errorMessage = data.error || t('TooManyFailedAttempts');
      setTimeout(() => {
        openVerif = false;
        onCancel();
        resetState();
      }, 2000);
    } else {
      attemptCount++;
      remainingAttempts = 3 - attemptCount;
      mnemonic = "";
      const errorMsg = data.error || t('WrongMnemonicRemainingAttempts') + ' ' + remainingAttempts;
      if (errorMessage !== errorMsg) {
        errorMessageExiting = false;
        errorMessageKey++;
      }
      errorMessage = errorMsg;
      
      // Focus input for next attempt
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
    mnemonic = "";
    attemptCount = 0;
    remainingAttempts = 3;
    if (errorMessage) {
      errorMessageExiting = true;
      const oldErrorKey = errorMessageKey;
      setTimeout(() => {
        if (errorMessageKey === oldErrorKey) {
          errorMessage = "";
          errorMessageExiting = false;
        }
      }, 200);
    }
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter') verifymnemonic();
    if (e.key === 'Escape') handleCancel();
  }

  $effect(() => {
    if (openVerif) {
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
   <Drawer.Description>{t('EnterYourmnemonic')}</Drawer.Description>
  </Drawer.Header>
  {#if !loading}
          <div class="z-60 space-y-2">

            <form on:submit|preventDefault={verifymnemonic}>
              <Input
                id="mnemonic-answer"
                type="mnemonic"
                placeholder={t('Entermnemonic')}
                bind:value={mnemonic}
                bind:this={mnemonicInput}
                disabled={loading}
                on:keydown={(e) => e.key === 'Enter' && verifymnemonic()}
              />
            </form>
          

          {#if errorMessage}
            <p 
              key={errorMessageKey}
              class="text-xs text-red-500 error-message {errorMessageExiting ? 'exit' : ''}"
            >
              {errorMessage}
            </p>
          {/if}</div>
        {:else if loading}
          <div class="z-60 flex justify-center py-4">
                    <BarSpinner class="text-secondary" />

          </div>
        {/if}
  <Drawer.Footer class="flex flex-row ">
           <Button
          class="flex-1 z-60 "
          onclick={verifymnemonic}
          disabled={loading || !mnemonic.trim()}
        >
                   {#if loading}
            <BarSpinner class="text-secondary" />
              {t('Verifying')}
              
            {:else}
              {t('Continue')}
            {/if}
        </Button>
          <Button variant="outline" class="z-60 flex-1" onclick={handleCancel} disabled={loading}>
         {t('Cancel')}
        </Button>
  </Drawer.Footer>
      </div>
 </Drawer.Content>
</Drawer.Root>
<style>
  .error-message {
    animation: slideInFade 0.3s ease-out;
  }
  
  .error-message.exit {
    animation: slideOutFade 0.2s ease-in forwards;
  }
  
  @keyframes slideInFade {
    0% {
      opacity: 0;
      transform: translateY(-8px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideOutFade {
    0% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
      transform: translateY(-8px);
    }
  }
</style>
