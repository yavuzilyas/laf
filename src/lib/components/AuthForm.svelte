<script lang="ts">
  import { browser } from '$app/environment';
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { cn, type WithElementRef } from "$lib/utils";
  import type { HTMLFormAttributes } from "svelte/elements";
  import { showToast, persistToast, showToastKey, persistToastKey } from "$lib/hooks/toast";
  import { Motion } from "svelte-motion";
  import { fly } from "svelte/transition";
  import ScratchToReveal from "./ScratchToReveal.svelte";
  import { LockKeyhole, RotateCcwKey, ShieldAlert, UserRoundPlus, KeyRound, LogIn } from "@lucide/svelte";
  import Loader from "@lucide/svelte/icons/loader";
      import { t, i18n, dativeSuffix, locativeSuffix } from '$lib/stores/i18n.svelte.js';

  let {
    mode = "login",
    ref = $bindable(null),
    class: className,
    id
  }: WithElementRef<HTMLFormAttributes> & {
    mode?: "login" | "register";
    id?: string;
  } = $props();

  let loading = $state(false);

  // Login state
  let identifier = $state("");
  let password = $state("");
  let mnemonicStep = $state(false);
  let mnemonicIndex = $state<number | null>(null);
  let mnemonicAnswer = $state("");
  let attemptCount = $state(0);
    let remainingAttempts = $state(3);
  let mnemonicQuestion = $state("");
  // Register multi-step state
  let step = $state<1 | 2 | 3>(1);
  let nickname = $state("");
  let regPassword = $state("");
  let name = $state("");
  let surname = $state("");
  let email = $state("");
  let mnemonic: string[] = $state([]);
  let shuffled: string[] = $state([]);
  let selection: string[] = $state([]);

  // Validation state
  let nicknameError = $state("");
  let emailError = $state("");
  let isValidating = $state(false);
  let nicknameTimeout: ReturnType<typeof setTimeout>;
  let emailTimeout: ReturnType<typeof setTimeout>;
  let nicknameErrorKey = $state(0);
  let emailErrorKey = $state(0);
  let nicknameErrorExiting = $state(false);
  let emailErrorExiting = $state(false);

import { generateMnemonic, validateMnemonic } from '@scure/bip39';

  import { wordlist } from '@scure/bip39/wordlists/english';

  // ... mevcut kodlar

  async function proceedRegisterStep1(e) {
    e.preventDefault();
    if (!nickname || !regPassword) {
      showToastKey("auth.errors.usernameRequired", "error");
      return;
    }
    if (nicknameError || emailError) {
      showToast("Lütfen hataları düzeltin", "error");
      return;
    }
    try {
      // 128 bit entropy ile 12 kelimeli mnemonic oluştur
      const mnemonicString = generateMnemonic(wordlist, 128);
      mnemonic = mnemonicString.split(' ');
      shuffled = shuffle(mnemonic);
      selection = [];
      step = 2;
    } catch (error) {
      showToast("BIP-39 silsilesi oluşturulamadı", "error");
    }
  }


import { sha256 } from 'js-sha256';

async function finalizeRegister() {
  if (selection.length !== mnemonic.length || !selection.every((w, i) => w === mnemonic[i])) {
    showToast("Kelime sırası hatalı", "error");
    return;
  }
  loading = true;
  try {
    // js-sha256 ile hash hesaplama
    const mnemonicHashes: string[] = mnemonic.map(word => {
      return sha256(word);
    });

    const res = await fetch(`/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        nickname, 
        password: regPassword, 
        name, 
        surname, 
        email: email || undefined,
        mnemonicHashes
      })
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      if (data.successKey) {
        persistToastKey(data.successKey, "success");
      } else {
        persistToast("Kayıt başarılı! Giriş yapabilirsiniz.", "success");
      }
      window.location.assign("/login");
    } else {
      if (data.errorKey) {
        showToastKey(data.errorKey, "error");
      } else {
        showToast(data?.error || "Bir hata oluştu", "error");
      }
    }
  } catch (error) {
    console.error("Registration error:", error);
    showToast("Bağlantı hatası", "error");
  } finally {
    loading = false;
  }
}
  function shuffle<T>(array: T[]): T[] {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  async function submitLogin(e: SubmitEvent) {
    e.preventDefault();
    loading = true;
    try {
      const body = mnemonicStep ? 
        { identifier, password, mnemonicIndex, mnemonicAnswer, attemptCount } : 
        { identifier, password };

      const res = await fetch(`/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (res.ok) {
        if (data.requiresMnemonic && !mnemonicStep) {
          // İki adımlı doğrulama gerekiyor
          mnemonicStep = true;
          mnemonicIndex = data.mnemonicIndex;
          attemptCount = data.attemptCount || 0;
          remainingAttempts = 3 - attemptCount;


          mnemonicQuestion = `${t('auth.login.mnemonicQuestionP1')}${data.mnemonicIndex + 1}${t('auth.login.mnemonicQuestionP2')}`;
          if (data.infoKey) {
            showToastKey(data.infoKey, "info");
          } else {
            showToast("Şifre doğru, BIP-39 doğrulamasını tamamlayın.", "info");
          }
        } else {
          // Tüm doğrulamalar başarılı
          const params = new URLSearchParams(window.location.search);
          const redirectTo = params.get("redirectTo");
          if (data.successKey) {
            persistToastKey(data.successKey, "success");
          } else {
            persistToast("Giriş başarılı", "success");
          }
          window.location.assign(redirectTo || "/");
        }
      } else {
        if (data.resetMnemonic) {
          // 3 başarısız deneme, başa dön
          resetMnemonicStep();
          if (data.errorKey) {
            showToastKey(data.errorKey, "error");
          } else {
            showToast(data.error || "3 başarısız deneme. Captha'ya yönlendiriliyorsunuz.", "error");
          }
        } else if (data.requiresMnemonic) {
          // Yanlış mnemonic, yeniden dene
          mnemonicStep = true;
          mnemonicIndex = data.mnemonicIndex;
          attemptCount = data.attemptCount || 0;
          remainingAttempts = 3 - attemptCount;
          if (data.errorKey) {
            showToastKey(data.errorKey, "error");
          } else {
            showToast(data.error || "Hatalı silsile kelimesi", "error");
          }
        } else {
          // Diğer hatalar
          if (data.errorKey) {
            showToastKey(data.errorKey, "error");
          } else if (data.errorKeys) {
            showToastKeys(data.errorKeys, "error");
          } else {
            showToast(data?.error || "Bir hata oluştu", "error");
          }
          if (mnemonicStep) {
            resetMnemonicStep();
          }
        }
      }
    } catch {
      showToast("Bağlantı hatası", "error");
    } finally {
      loading = false;
    }
  }

  function resetMnemonicStep() {
    mnemonicStep = false;
    mnemonicAnswer = "";
    mnemonicIndex = null;
    attemptCount = 0;
    remainingAttempts = 3;
  }
  async function validateNickname(nick: string) {
    clearTimeout(nicknameTimeout);
    if (!nick || nick.length < 2) {
      if (nicknameError) {
        // Trigger exit animation
        nicknameErrorExiting = true;
        setTimeout(() => {
          nicknameError = "";
          nicknameErrorExiting = false;
        }, 200);
      } else {
        nicknameError = "";
      }
      return;
    }
    nicknameTimeout = setTimeout(async () => {
      isValidating = true;
      try {
        const res = await fetch("/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nickname: nick, password: "dummy", email: "", validateOnly: true })
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 400 && data.error?.includes("kullanıcı adı")) {
          nicknameError = data.error;
          nicknameErrorKey++;
        } else {
          if (nicknameError) {
            // Trigger exit animation
            nicknameErrorExiting = true;
            setTimeout(() => {
              nicknameError = "";
              nicknameErrorExiting = false;
            }, 200);
          } else {
            nicknameError = "";
          }
        }
      } catch {
        if (nicknameError) {
          // Trigger exit animation
          nicknameErrorExiting = true;
          setTimeout(() => {
            nicknameError = "";
            nicknameErrorExiting = false;
          }, 200);
        } else {
          nicknameError = "";
        }
      } finally {
        isValidating = false;
      }
    }, 500);
  }

  async function validateEmail(em: string) {
    clearTimeout(emailTimeout);
    if (!em || !em.includes("@")) {
      if (emailError) {
        // Trigger exit animation
        emailErrorExiting = true;
        setTimeout(() => {
          emailError = "";
          emailErrorExiting = false;
        }, 200);
      } else {
        emailError = "";
      }
      return;
    }
    emailTimeout = setTimeout(async () => {
      isValidating = true;
      try {
        const res = await fetch("/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nickname: "dummy", password: "dummy", email: em, validateOnly: true })
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 400 && data.error?.includes("e-posta")) {
          emailError = data.error;
          emailErrorKey++;
        } else {
          if (emailError) {
            // Trigger exit animation
            emailErrorExiting = true;
            setTimeout(() => {
              emailError = "";
              emailErrorExiting = false;
            }, 200);
          } else {
            emailError = "";
          }
        }
      } catch {
        if (emailError) {
          // Trigger exit animation
          emailErrorExiting = true;
          setTimeout(() => {
            emailError = "";
            emailErrorExiting = false;
          }, 200);
        } else {
          emailError = "";
        }
      } finally {
        isValidating = false;
      }
    }, 500);
  }

  function proceedRegisterStep2() {
    step = 3;
  }

  function toggleSelectWord(word) {
    if (selection.includes(word)) return;
    selection = [...selection, word];
  }

  function resetSelection() {
    selection = [];
  }

  const stepVariants = {
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5 } },
    hidden: { opacity: 0, y: 22, filter: "blur(9px)", transition: { duration: 0.5 } }
  };
  const random12 = generateMnemonic(wordlist, 128); 
</script>

<form class={cn("flex flex-col gap-6", className)} bind:this={ref} onsubmit={mode === 'login' ? submitLogin : proceedRegisterStep1}>
  {#if mode === "login"}
    {#if !mnemonicStep}
          <Motion variants={stepVariants} initial="hidden" animate="visible" let:motion>

      <!-- Normal login form -->
      <div use:motion class="flex flex-col items-center gap-4 text-center">
        <LogIn size={36} class="text-primary" />
        <h1 class="text-base font-bold">{i18n.t('Login')}</h1>
        <p class=" text-neutral-100 text-balance text-sm">{i18n.t('auth.login.subtitle') || ''}</p>
        <div class="grid gap-3 w-full">
          <div class="grid gap-3">
            <Label for="identifier-{id}">{i18n.t('UsernameOrEmail')}</Label>
            <Input id="identifier-{id}" name="identifier" type="text" placeholder="m@example.com" required bind:value={identifier} disabled={loading} />
          </div>
          <div class="grid gap-3">
            <div class="flex items-center">
              <Label for="password-{id}">{i18n.t('Password')}</Label>
              <a href="/forgot" class="text-primary ml-auto text-xs underline-offset-4 hover:underline">{i18n.t('ForgotPassword')}</a>
            </div>
            <Input id="password-{id}" name="password" type="password" required bind:value={password} disabled={loading} />
          </div>
        </div>
        <Button type="submit" class="w-full" disabled={loading}>
          {#if loading}
            <Loader class="animate-spin" />
              {i18n.t('SigningIn')}

          {:else}
            {i18n.t('Login')}
          {/if}
        </Button>
        <div class="text-center text-xs">
          {i18n.t('NoAccount')}
          <a href={i18n.currentLocale === 'tr' ? '/kayit' : '/register'} class="text-primary underline underline-offset-4">
            {i18n.t('Register')}
          </a>
        </div>
      </div>
      </Motion>
    {:else}
          <Motion variants={stepVariants} initial="hidden" animate="visible" let:motion>

      <!-- Mnemonic doğrulama formu -->
      <div use:motion class="flex flex-col items-center gap-4 text-center">
        <KeyRound size={36} class="text-primary" />
        <h1 class="text-base font-bold">{i18n.t('TwoFactorAuth') || 'İki Adımlı Doğrulama'}</h1>
        <p class="text-neutral-100 text-balance text-sm">{mnemonicQuestion}</p>
        
        <div class="grid gap-3 w-full">
          <div class="grid gap-3">
            <Label for="mnemonic-answer-{id}">{i18n.t('auth.login.mnemonicAnswer')}</Label>
            <Input 
              id="mnemonic-answer-{id}" 
              type="text" 
              placeholder={random12.split(" ")[0]}
              required 
              bind:value={mnemonicAnswer} 
              disabled={loading} 
            />
                    {#if remainingAttempts < 3}

            <p class="text-xs text-red-500 error-message">
              {remainingAttempts} deneme hakkınız kaldı.
            </p>

        {/if}
          </div>
        </div>
        
        <div class="flex gap-2 w-full">
          <Button type="button" class="w-1/2" onclick={resetMnemonicStep} variant="outline" disabled={loading}>
            {i18n.t('Back')}
          </Button>
          <Button type="submit" class="w-1/2" disabled={loading}>
            {#if loading}
              <span class="inline-flex items-center gap-2">
                <Loader class="animate-spin" />
                {i18n.t('Verifying')}
              </span>
            {:else}
              {i18n.t('Verify')}
            {/if}
          </Button>
        </div>
      </div>
      </Motion>
    
    {/if}
  {:else}
    <!-- Register Step 1: Credentials -->
    {#if step === 1}
      <Motion variants={stepVariants} initial="hidden" animate="visible" let:motion>
        <div use:motion>
            <div class="flex flex-col items-center gap-1 text-center">
              <UserRoundPlus size={48} class="text-primary" />
      <h1 class="text-base font-bold">{i18n.t('Register')}</h1>
      <p class="text-neutral-100 text-balance text-sm">{i18n.t('auth.register.subtitle') || ''}</p>
    </div>
        <div  class="grid gap-3 mt-4">
          <div class="grid gap-2">
            <Label for="nickname-{id}">{i18n.t('Username')}</Label>
            <Input 
              id="nickname-{id}" 
              type="text" 
              placeholder="kullanici-adi" 
              required 
              bind:value={nickname} 
              disabled={loading} 
              oninput={(e) => validateNickname((e.target as HTMLInputElement)?.value || "")}
              class="transition-colors duration-300 {nicknameError ? "border-red-500" : "border-normal"}"
            />
            {#if nicknameError}
              <p 
                key={nicknameErrorKey}
                class="text-xs text-red-500 error-message {nicknameErrorExiting ? 'exit' : ''}"
              >
                {nicknameError}
              </p>
            {/if}
    </div>
      <div class="grid gap-2">
            <Label for="regpass-{id}">{i18n.t('Password')}</Label>
            <Input id="regpass-{id}" placeholder="••••••••" type="password" required bind:value={regPassword} disabled={loading} />
      </div>
            <div class="grid gap-2">
            <Label for="name-{id}">{i18n.t('Name')}</Label>
            <Input id="name-{id}" placeholder="İsminiz" type="name"  bind:value={name} disabled={loading} />
      </div>
      <div class="grid gap-2">
            <Label for="surname-{id}">{i18n.t('Surname')}</Label>
            <Input id="surname-{id}" placeholder="Soy isminiz" type="surname"  bind:value={surname} disabled={loading} />
      </div>
          <div class="grid gap-2" >
            <Label for="email-{id}">{i18n.t('Email')}</Label>
            <Input 
              id="email-{id}" 
              type="email" 
              placeholder="mail@example.com" 
              bind:value={email} 
              disabled={loading} 
              oninput={(e) => validateEmail((e.target as HTMLInputElement)?.value || "")}
              class="transition-colors duration-300 {emailError ? "border-red-500" : "border-normal"}"
            />
            {#if emailError}
              <p 
                key={emailErrorKey}
                class="text-xs text-red-500 error-message {emailErrorExiting ? 'exit' : ''}"
              >
                {emailError}
              </p>
            {/if}
          </div>
          <Button type="submit" class="w-full mt-2" disabled={loading || !!nicknameError || !!emailError || isValidating}>
            {#if isValidating}
            <Loader class="animate-spin" />
              {i18n.t('Verifying')}
              
            {:else}
              {i18n.t('Continue')}
            {/if}
    </Button>
    <div class="text-center text-xs">
      {i18n.t('HaveAccount')}
      <a href={i18n.currentLocale === 'tr' ? '/giris' : '/login'} class="text-primary underline underline-offset-4">
        {i18n.t('Login')}
      </a>
    </div>
        </div>
        </div>
      </Motion>
    {/if}

    <!-- Register Step 2: Show Mnemonic -->
    {#if step === 2}
      <Motion variants={stepVariants} initial="hidden" animate="visible" let:motion>
        <div use:motion >
        <div class="flex flex-col items-center gap-1">
          <RotateCcwKey size={48} class="text-primary" />
          <h1 class="text-base font-bold">{i18n.t('auth.register.mnemonicTitle')}</h1>
          <p class="text-sm underline-primary text-neutral-100">{i18n.t('auth.register.mnemonicSubtitle')}</p>
          <ScratchToReveal
      minScratchPercentage={85}
      class="flex items-center justify-center overflow-hidden rounded-2xl my-1 bg-background"
      gradientColors={["#FFB300", "#FF9D0A", "#FFD500"]}
      onComplete={() => {
        
      }}
    >
    <div class="grid grid-cols-3 gap-1 my-3 text-xs">
      {#each mnemonic as w, i}
        <div class="font-bold rounded-md bg-secondary border-primary border-0.5 px-1.5 py-1 text-primary">{i + 1}. {w}</div>
      {/each}
      </div>
    </ScratchToReveal>
              <ul class="list-disc text-xs text-neutral-300">
            <li>{i18n.t('auth.register.mnemonicInfo1')}</li>
            <li>{i18n.t('auth.register.mnemonicInfo2')}</li>
          </ul>
                      <div class="flex flex-col gap-1 my-1.5 bg-secondary/33 rounded-xl px-4 py-2.5">
                        <div class="flex flex-row gap-1 "><LockKeyhole size={16} class="text-primary" />
          <h1 class="text-xs font-bold">{i18n.t('auth.register.mnemonicInfoTitle')}</h1></div>

          <p class="text-xs underline-primary text-neutral-100">{i18n.t('auth.register.mnemonicInfo')}</p>
          </div>

          
        </div>
        <div class="flex gap-2 mt-1.5" >
            <Button type="button" class="w-1/2" onclick={() => (step = 1)} variant="outline">{i18n.t('Back')}</Button>
            <Button type="button" class="w-1/2" onclick={proceedRegisterStep2}>{i18n.t('Continue')}</Button>
          </div>
          </div>
      </Motion>
    {/if}

    <!-- Register Step 3: Verify Order -->
    {#if step === 3}
      <Motion variants={stepVariants} initial="hidden" animate="visible" let:motion>
        <div class="gap-2" use:motion>
        <div class="flex flex-col items-center gap-2">
          <KeyRound size={48} class="text-primary" />
          <h1 class="text-base font-bold text-center">{i18n.t('auth.register.verifyOrderTitle')}</h1>
          <p class="text-xs text-neutral-100">{i18n.t('auth.register.verifyOrderSubtitle')}</p>
          </div>
          <div class="min-h-22 rounded-md bg-secondary px-2 py-2 text-xs flex flex-start flex-wrap gap-1  my-3">
            {#each selection as w, i (w)}
              <button 
                type="button"
                in:fly={{ y: 8, duration: 160 }} 
                out:fly={{ y: -8, duration: 140 }} 
                class="h-min rounded bg-primary/10 text-primary px-2 py-0.5"
                onclick={(e) => {
                  e.preventDefault();
                  const index = selection.indexOf(w);
                  if (index > -1) {
                    selection = selection.filter((_, idx) => idx !== index);
                  }
                }}
              >
                {i + 1}. {w}
              </button>
            {/each}
  </div>
          <div class="grid grid-cols-3 gap-2  my-2">
            {#each shuffled as w (w)}
              <Motion whileTap={{ scale: 0.94 }} let:motion>
                <button
                  type="button"
                  use:motion
                  class="rounded-md border px-2 py-1 text-xs disabled:opacity-40 active:opacity-90"
                  disabled={selection.includes(w)}
                  onclick={() => toggleSelectWord(w)}
                >
                  {w}
                </button>
              </Motion>
            {/each}
          

        </div>
                  <div class="flex gap-2  my-3">
            <Button type="button" class="w-1/2" onclick={() => (step = 1)} variant="outline">{i18n.t('Back')}</Button>
            <Button type="button" class="w-1/2" disabled={loading || selection.length !== mnemonic.length} onclick={finalizeRegister}>
              {#if loading}
                <Loader class="animate-spin" />
                {i18n.t('Saving') || i18n.t('Loading')}
              {:else}
                {i18n.t('auth.register.complete') || 'Kaydı tamamla'}
              {/if}
            </Button>
          </div>
          </div>
      </Motion>
    {/if}
  {/if}

</form>
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