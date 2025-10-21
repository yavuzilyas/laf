<script lang="ts">
  import { browser } from '$app/environment';
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { cn, type WithElementRef } from "$lib/utils";
  import type { HTMLFormAttributes } from "svelte/elements";
  import { showToast, persistToast, showToastKey, persistToastKey } from "$lib/hooks/toast";
  import { Motion } from "svelte-motion";
    import { flip } from 'svelte/animate';

  import { fly, crossfade } from "svelte/transition";
  import ScratchToReveal from "./ScratchToReveal.svelte";
  import { User, LockKeyhole, RotateCcwKey, ShieldAlert, UserRoundPlus, KeyRound, LayoutDashboard, Eye, EyeOff, Check, Copy } from "@lucide/svelte";
  import Loader from "@lucide/svelte/icons/loader";
  import { t, i18n, dativeSuffix, locativeSuffix } from '$lib/stores/i18n.svelte.js';

  let {
    mode = "login",
    ref = $bindable(null),
    class: className,
    id,
    shuffled = []
  }: WithElementRef<HTMLFormAttributes> & {
    mode?: "login" | "register";
    id?: string;
    shuffled?: string[];
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
  let passwordStrength = $state(0); // 0-4
  let passwordFeedback = $state("");
  let name = $state("");
  let surname = $state("");
  let email = $state("");
  let mnemonic: string[] = $state([]);


import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

  // ... mevcut kodlar

  // Validation state
  let nicknameError = $state("");
  let emailError = $state("");
  let isValidating = $state(false);
  let nicknameTimeout: ReturnType<typeof setTimeout>;
  let emailTimeout: ReturnType<typeof setTimeout>;
  let nameError = $state("");
  let surnameError = $state("");
  let nicknameErrorKey = $state(0);
  let emailErrorKey = $state(0);
  let nicknameErrorExiting = $state(false);
  let emailErrorExiting = $state(false);
  let showPassword = $state(false);
  let passwordCopied = $state(false);
  
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      passwordCopied = true;
      showToast(t('auth.success.passwordCopied') || 'Password copied to clipboard!', 'success');
      
      setTimeout(() => {
        passwordCopied = false;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      showToast(t('auth.errors.copyFailed') || 'Failed to copy to clipboard', 'error');
    });
  }
  
  function generateAndCopyPassword() {
    const pw = generatePassword();
    regPassword = pw;
    const { score, msg } = computePasswordStrength(pw);
    passwordStrength = score;
    passwordFeedback = msg;
    copyToClipboard(pw);
  }
  // Client-side validators (top-level)
  function validateNicknameClient(value: string): string {
    const v = (value || "").trim();
    if (v.length < 3 || v.length > 20) return t("auth.errors.usernameLength") || "3-20 karakter olmalı";
    if (!/^[A-Za-z][A-Za-z0-9._-]*$/.test(v)) return t("auth.errors.usernameFormat") || "Harf ile başlamalı, sadece harf/rakam . _ - içerebilir";
    if (/([A-Za-z0-9._-])\1{2,}/.test(v)) return t("auth.errors.usernameRepeats") || "Tekrarlı karakterler çok fazla";
    return "";
  }

  function validateNameClient(value: string): string {
    const v = (value || "").trim();
    if (!v) return ""; // optional
    if (v.length < 2) return t("auth.errors.nameTooShort") || "En az 2 karakter";
    if (!/^[A-Za-zÇçĞğİıÖöŞşÜü\-\s]+$/.test(v)) return t("auth.errors.nameFormat") || "Sadece harf, boşluk, tire";
    return "";
  }

  function validateEmailClient(value: string): string {
    const v = (value || "").trim();
    if (!v) return ""; // optional
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!re.test(v)) return t("auth.errors.emailFormat") || "Geçerli e-posta girin";
    return "";
  }

  function computePasswordStrength(pw: string): { score: number; msg: string } {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    // normalize to 0-4
    score = Math.min(4, Math.max(0, score - 1));
    const msgs = [t('auth.password.veryWeak')||'Çok zayıf', t('auth.password.weak')||'Zayıf', t('auth.password.fair')||'Orta', t('auth.password.strong')||'Güçlü', t('auth.password.veryStrong')||'Çok güçlü'];
    return { score, msg: msgs[score] };
  }

  function meetsPasswordPolicy(pw: string): boolean {
    return pw.length >= 8 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /[0-9]/.test(pw);
  }

  function generatePassword(): string {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const symbols = '!@#$%^&*()-_=+[]{};:,.<>/?';
    const all = lower + upper + digits + symbols;
    const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
    let pw = pick(lower) + pick(upper) + pick(digits) + pick(symbols);
    for (let i = 0; i < 8; i++) pw += pick(all);
    // shuffle
    pw = pw.split('').sort(() => Math.random() - 0.5).join('');
    return pw;
  }
  async function proceedRegisterStep1(e) {
    e.preventDefault();
    if (!nickname || !regPassword) {
      showToastKey("auth.errors.usernameRequired", "error");
      return;
    }
    scratchDone = false
    // Client validations
    nicknameError = validateNicknameClient(nickname);
    emailError = validateEmailClient(email);
    nameError = validateNameClient(name);
    surnameError = validateNameClient(surname);
    if (!meetsPasswordPolicy(regPassword)) {
      const msg = t('auth.password.policy') || 'En az 8 karakter, büyük/küçük harf, rakam ve sembol içermeli';
      showToast(msg, 'error');
      return;
    }

    if (nicknameError || emailError || nameError || surnameError) {
      showToast("Lütfen hataları düzeltin", "error");
      return;
    }
    try {
      // 128 bit entropy ile 12 kelimeli mnemonic oluştur
      const mnemonicString = bip39.generateMnemonic(wordlist, 128);
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
    showToast(t('auth.register.mnemonicError'), "error");
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


          mnemonicQuestion = `${t('auth.login.mnemonicQuestionP1')} ${data.mnemonicIndex + 1}${t('auth.login.mnemonicQuestionP2')}`;
          if (data.infoKey) {
            showToastKey(data.infoKey, "info");
          } else {
            showToast(t('auth.success.passwordCorrect'), "info");
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
      showToast("Error", "error");
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
  async function validateNickname(value: string) {
  clearTimeout(nicknameTimeout);
  nicknameTimeout = setTimeout(async () => {
    if (!value) {
      // error göster
      if (!nicknameError) {
        nicknameError = t("auth.errors.usernameRequired");
      }
      return;
    }

    isValidating = true;
    try {
      const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: value, password: "dummy", validateOnly: true })
      });

      if (!res.ok) {
        const data = await res.json();
        if (nicknameError !== t(data.errorKey)) {
          nicknameErrorExiting = false; // yeni hata varsa direkt değiştir
          nicknameErrorKey++; // react-like key ile re-render zorla
        }
        nicknameError = t(data.errorKey);
      } else {
        if (nicknameError) {
          // error → success geçişi
          nicknameErrorExiting = true; // çıkış animasyonu başlat
          const oldErrorKey = nicknameErrorKey;
          setTimeout(() => {
            // animasyon bitince temizle
            if (nicknameErrorKey === oldErrorKey) {
              nicknameError = "";
              nicknameErrorExiting = false;
            }
          }, 200); // CSS’teki slideOutFade süresiyle aynı olmalı
        }
      }
    } catch (err) {
      console.error("Nickname validation failed", err);
    } finally {
      isValidating = false;
    }
  }, 400); // debounce
}

async function validateEmail(value: string) {
  clearTimeout(emailTimeout);
  emailTimeout = setTimeout(async () => {
    if (!value) {
      emailError = "";
      return;
    }

    isValidating = true;
    try {
      const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: "dummy", password: "dummy", email: value, validateOnly: true })
      });

            if (!res.ok) {
        const data = await res.json();
        if (emailError !== t(data.errorKey)) {
          emailErrorExiting = false; // yeni hata varsa direkt değiştir
          emailErrorKey++; // react-like key ile re-render zorla
        }
        emailError = t(data.errorKey);
      } else {
        if (emailError) {
          // error → success geçişi
          emailErrorExiting = true; // çıkış animasyonu başlat
          const oldErrorKey = emailErrorKey;
          setTimeout(() => {
            // animasyon bitince temizle
            if (emailErrorKey === oldErrorKey) {
              emailError = "";
              emailErrorExiting = false;
            }
          }, 200); // CSS’teki slideOutFade süresiyle aynı olmalı
        }
      }
    } catch (err) {
      console.error("Email validation failed", err);
    } finally {
      isValidating = false;
    }
  }, 400);
}


  function proceedRegisterStep2() {
    if (scratchDone) {
      step = 3;
    }
  }

  let selection = $state([]);
  let availableWords = $derived(shuffled.filter(word => !selection.includes(word)));
  const [send, receive] = crossfade({ duration: 400 });
  
  // Tüm kelimeler - seçilenler ve seçilmeyenler
  function resetSelection() {
    selection = [];
  }

  // Gate to step 3: Scratch completion
  let scratchDone = $state(false);

  const stepVariants = {
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5 }, ease: "easeIn" },
    hidden: { opacity: 0, y: 22, filter: "blur(9px)", transition: { duration: 0.5 } , ease: "easeOut"},
    exit: { opacity: 0, y: -22, filter: "blur(9px)", transition: { duration: 0.5 } , ease: "easeIn"
},
  };
  const random12 = bip39.generateMnemonic(wordlist, 128); 

    import { CopyCheckIcon, UserIcon, LockIcon, KeyRoundIcon, RotateCcwKeyIcon, UserPlusIcon, ShieldCheckIcon, BlocksIcon } from 'svelte-animate-icons';
</script>

<form class={cn("flex flex-col gap-6", className)} bind:this={ref} onsubmit={mode === 'login' ? submitLogin : proceedRegisterStep1}>
  {#if mode === "login"}
    {#if !mnemonicStep}
          <Motion variants={stepVariants} initial="hidden" animate="visible" exit="exit"  let:motion>

      <!-- Normal login form -->
      <div use:motion class="flex flex-col items-center gap-2 text-center">
        {#if browser}
          <UserIcon triggers={{ hover: false }}  duration={3000}  animationState="loading" size={42} class="text-primary"  loop={true} />
        {:else}
          <User size={42} class="text-primary" />
        {/if}
        <h1 class="text-base font-bold">{t('Login')}</h1>
        <p class=" text-secondary-foreground/70 text-balance text-sm">{t('auth.login.subtitle') || ''}</p>
        <div class="grid gap-3 w-full mt-3">
          <div class="grid gap-3">
            <Label for="identifier-{id}">{t('UsernameOrEmail')}</Label>
            <Input id="identifier-{id}" name="identifier" type="text" placeholder="m@example.com" required bind:value={identifier} disabled={loading} />
          </div>
          <div class="grid gap-3">
            <div class="flex items-center">
              <Label for="password-{id}">{t('Password')}</Label>
              <a href="/forgot" class="text-primary ml-auto text-xs underline-offset-4 hover:underline">{t('ForgotPassword')}</a>
            </div>
            <Input id="password-{id}" name="password" type="password" required bind:value={password} disabled={loading} />
          </div>
        </div>
        <Button type="submit" class="w-full" disabled={loading}>
          {#if loading}
            <Loader class="animate-spin" />
              {t('SigningIn')}

          {:else}
            {t('Login')}
          {/if}
        </Button>
        <div class="text-center text-xs">
          {t('NoAccount')}
          <a href={i18n.currentLocale === 'tr' ? '/kayit' : '/register'} class="text-primary font-bold underline underline-offset-4">
            {t('Register')}
          </a>
        </div>
      </div>
      </Motion>
    {:else}
          <Motion variants={stepVariants} initial="hidden" animate="visible" exit="exit" let:motion>

      <!-- Mnemonic doğrulama formu -->
      <div use:motion class="flex flex-col items-center gap-4 text-center">
        {#if browser}
          <KeyRoundIcon triggers={{ hover: false }}  duration={3000}  animationState="loading" size={42} class="text-primary"  loop={true} />
        {:else}
          <KeyRound size={42} class="text-primary" />
        {/if}        
        <h1 class="text-base font-bold">{t('TwoFactorAuth') || 'İki Adımlı Doğrulama'}</h1>
        <p class="text-secondary-foreground/70 text-balance text-sm">{mnemonicQuestion}</p>
        
        <div class="grid gap-3 w-full">
          <div class="grid gap-3">
            <Label for="mnemonic-answer-{id}">{t('auth.login.mnemonicAnswer')}</Label>
            <Input 
              id="mnemonic-answer-{id}" 
              type="text" 
              placeholder={t('mnemonicWord')}
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
            {t('Back')}
          </Button>
          <Button type="submit" class="w-1/2" disabled={loading}>
            {#if loading}
              <span class="inline-flex items-center gap-2">
                <Loader class="animate-spin" />
                {t('Verifying')}
              </span>
            {:else}
              {t('Verify')}
            {/if}
          </Button>
        </div>
      </div>
      </Motion>
    
    {/if}
  {:else}
    <!-- Register Step 1: Credentials -->
    {#if step === 1}
      <Motion variants={stepVariants} initial="hidden" animate="visible" exit="exit"  let:motion>
        <div use:motion>
            <div class="flex flex-col items-center gap-1 text-center">
              
              {#if browser}
          <UserPlusIcon triggers={{ hover: false }}  duration={3000}  animationState="loading" size={42} class="text-primary"  loop={true} />
        {:else}
          <UserRoundPlus size={42} class="text-primary" />
        {/if}
      <h1 class="text-base font-bold">{t('Register')}</h1>
      <p class="text-secondary-foreground/70 text-balance text-sm">{t('auth.register.subtitle') || ''}</p>
    </div>
        <div  class="grid gap-3 mt-4">
          <div class="grid gap-2">
            <Label for="nickname-{id}">{t('Username')}<p class="font-bold text-primary">*</p></Label>
            <Input 
              id="nickname-{id}" 
              type="text" 
              placeholder="kullanici-adi" 
              required 
              bind:value={nickname} 
              disabled={loading} 
              oninput={(e) => {
                // Prevent spaces and emojis
                let v = (e.target as HTMLInputElement)?.value || "";
                
                // Remove spaces and emojis
                v = v.replace(/[\s\p{Emoji}]/gu, '');
                
                // Update the input value
                if (v !== nickname) {
                  (e.target as HTMLInputElement).value = v;
                }
                
                nickname = v;
                nicknameError = validateNicknameClient(v);
                if (!nicknameError) validateNickname(v);
              }}
              onkeydown={(e) => {
                // Prevent space key
                if (e.key === ' ' || e.key === 'Spacebar' || e.keyCode === 32) {
                  e.preventDefault();
                  return false;
                }
              }}
              onpaste={(e) => {
                // Handle paste to remove spaces and emojis
                e.preventDefault();
                const pastedText = e.clipboardData?.getData('text/plain') || '';
                const cleanedText = pastedText.replace(/[\s\p{Emoji}]/gu, '');
                
                // Insert the cleaned text at cursor position
                const target = e.target as HTMLInputElement;
                const start = target.selectionStart || 0;
                const end = target.selectionEnd || 0;
                const newValue = target.value.substring(0, start) + cleanedText + target.value.substring(end);
                
                // Update the input value and cursor position
                target.value = newValue;
                const newCursorPos = start + cleanedText.length;
                target.setSelectionRange(newCursorPos, newCursorPos);
                
                // Update the state
                nickname = newValue;
                nicknameError = validateNicknameClient(newValue);
                if (!nicknameError) validateNickname(newValue);
              }}
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
            <Label for="regpass-{id}">{t('Password')}<p class="font-bold text-primary">*</p></Label>
            <div class="flex gap-2 items-center">
              <div class="relative flex-1">
                <Input 
                  id="regpass-{id}" 
                  placeholder="••••••••" 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  bind:value={regPassword} 
                  disabled={loading}
                  oninput={(e) => {
                    // Prevent spaces and emojis
                    let v = (e.target as HTMLInputElement)?.value || '';
                    
                    // Remove spaces and emojis
                    v = v.replace(/[\s\p{Emoji}]/gu, '');
                    
                    // Update the input value
                    if (v !== regPassword) {
                      (e.target as HTMLInputElement).value = v;
                    }
                    
                    regPassword = v;
                    const { score, msg } = computePasswordStrength(v);
                    passwordStrength = score;
                    passwordFeedback = msg;
                  }}
                  onkeydown={(e) => {
                    // Prevent space key
                    if (e.key === ' ' || e.key === 'Spacebar' || e.keyCode === 32) {
                      e.preventDefault();
                      return false;
                    }
                  }}
                  onpaste={(e) => {
                    // Handle paste to remove spaces and emojis
                    e.preventDefault();
                    const pastedText = e.clipboardData?.getData('text/plain') || '';
                    const cleanedText = pastedText.replace(/[\s\p{Emoji}]/gu, '');
                    
                    // Insert the cleaned text at cursor position
                    const target = e.target as HTMLInputElement;
                    const start = target.selectionStart || 0;
                    const end = target.selectionEnd || 0;
                    const newValue = target.value.substring(0, start) + cleanedText + target.value.substring(end);
                    
                    // Update the input value and cursor position
                    target.value = newValue;
                    const newCursorPos = start + cleanedText.length;
                    target.setSelectionRange(newCursorPos, newCursorPos);
                    
                    // Update the state
                    regPassword = newValue;
                    const { score, msg } = computePasswordStrength(newValue);
                    passwordStrength = score;
                    passwordFeedback = msg;
                  }}
                  class="pr-10"
                />
                <button 
                  type="button" 
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rounded-full p-1.5 transition-colors hover:bg-accent/50 active:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onmousedown={(e) => e.preventDefault()}
                  onclick={() => showPassword = !showPassword}
                  aria-label={showPassword ? t('Hide password') : t('Show password')}
                >
                  {#if showPassword}
                    <EyeOff class="h-4 w-4" />
                  {:else}
                    <Eye class="h-4 w-4" />
                  {/if}
                </button>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onclick={generateAndCopyPassword}
                disabled={loading}
              >
                {#if passwordCopied}
                  <CopyCheckIcon triggers={{ hover: false }}  loop={true} autoplay class="h-4 w-4 text-green-500" />
                                    {t('Generate')}

                {:else}
                  <Copy class="h-4 w-4" />
                  {t('Generate')}
                {/if}
              </Button>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-1.5 w-full rounded bg-secondary overflow-hidden">
                <div class="h-full transition-all"
                  class:!bg-red-500={passwordStrength <= 1}
                  class:!bg-yellow-500={passwordStrength === 2}
                  class:!bg-green-500={passwordStrength >= 3}
                  style={`width: ${Math.max(10, (passwordStrength+1) * 20)}%`}
                ></div>
              </div>
              <span class="text-xs whitespace-nowrap text-muted-foreground">{passwordFeedback}</span>
            </div>
          </div>
            <div class="grid gap-2">
            <Label for="name-{id}">{t('Name')}</Label>
            <Input id="name-{id}" placeholder="İsminiz" type="name"  bind:value={name} disabled={loading}
              oninput={(e) => { const v = (e.target as HTMLInputElement)?.value || ''; name = v; nameError = validateNameClient(v); }} />
            {#if nameError}
              <p class="text-xs text-red-500">{nameError}</p>
            {/if}
      </div>
      <div class="grid gap-2">
            <Label for="surname-{id}">{t('Surname')}</Label>
            <Input id="surname-{id}" placeholder={t('Surname')} type="surname"  bind:value={surname} disabled={loading}
              oninput={(e) => { const v = (e.target as HTMLInputElement)?.value || ''; surname = v; surnameError = validateNameClient(v); }} />
            {#if surnameError}
              <p class="text-xs text-red-500">{surnameError}</p>
            {/if}
      </div>
          <div class="grid gap-2" >
            <Label for="email-{id}">{t('Email')}</Label>
            <Input 
              id="email-{id}" 
              type="email" 
              placeholder="mail@example.com" 
              bind:value={email} 
              disabled={loading} 
              oninput={(e) => {
                const v = (e.target as HTMLInputElement)?.value || "";
                email = v;
                emailError = validateEmailClient(v);
                if (!emailError) validateEmail(v);
              }}
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
          <Button type="submit" class="w-full mt-2" disabled={loading || !!nicknameError || !!emailError || !!nameError || !!surnameError || isValidating || !meetsPasswordPolicy(regPassword)}>
            {#if isValidating}
            <Loader class="animate-spin" />
              {t('Verifying')}
              
            {:else}
              {t('Continue')}
            {/if}
    </Button>
    <div class="text-center text-xs">
      {t('HaveAccount')}
      <a href={i18n.currentLocale === 'tr' ? '/giris' : '/login'} class="text-primary font-bold underline underline-offset-4">
        {t('Login')}
      </a>
    </div>
        </div>
        </div>
      </Motion>
    {/if}

    <!-- Register Step 2: Show Mnemonic -->
    {#if step === 2}
      <Motion variants={stepVariants} initial="hidden" animate="visible" exit="exit"  let:motion>
        <div use:motion >
        <div class="flex flex-col justify-center items-center gap-1">
{#if browser}
          <RotateCcwKeyIcon triggers={{ hover: false }}  animationState="loading" size={42} class="text-primary"  loop={true} />
        {:else}
          <RotateCcwKey size={42} class="text-primary" />
        {/if}          <h1 class="text-base font-bold">{t('auth.register.mnemonicTitle')}</h1>
          <p class="text-sm underline-hard-primary text-secondary-foreground/70">{t('auth.register.mnemonicSubtitle')}</p>
          <ScratchToReveal
      minScratchPercentage={85}
      class="flex items-center justify-center overflow-hidden rounded-2xl my-2 bg-background"
      gradientColors={["gray", "lightgray", "gray"]}
      onComplete={() => {
        scratchDone = true;
      }}
    >
    <div class="w-fit min-h-39 md:min-h-44 grid grid-cols-3 gap-2 my-2 bg-secondary  p-2 rounded-lg">
      {#each mnemonic as w, i}
        <div class="font-bold whitespace-nowrap select-none cursor-pointer text-sm rounded-md   drop-shadow-md bg-primary px-2 py-1.5 text-secondary">{i + 1}. {w}</div>
      {/each}
      </div>
    </ScratchToReveal>

                      <div class="flex flex-col gap-1 my-1.5 bg-secondary/50 rounded-xl px-4 py-2.5">
                        <div class="flex flex-row gap-1 ">{#if browser}
          <LockIcon triggers={{ hover: false }}  animationState="loading" size={14} class="text-primary"  loop={true} />
        {:else}
          <LockKeyhole duration={3000}  size={14} strokeWidth={2.5} class="text-primary" />
        {/if}      
          <h1 class="text-sm font-bold">{t('auth.register.mnemonicInfoTitle')}</h1></div>

          <p class="text-sm underline-hard-primary text-secondary-foreground/80">{t('auth.register.mnemonicInfo')}</p>
                        <ul class="list-disc list-inside text-sm text-secondary-foreground/80">
            <li>{t('auth.register.mnemonicInfo1')}</li>
            <li>{t('auth.register.mnemonicInfo2')}</li>
          </ul>
          </div>

          
        </div>
        <div class="flex gap-2 mt-1.5" >
            <Button type="button" class="w-1/2" onclick={() => (step = 1)} variant="outline">{t('Back')}</Button>
            <Button type="button" class="w-1/2" onclick={proceedRegisterStep2} disabled={!scratchDone}>{t('Continue')}</Button>
          </div>
          </div>
      </Motion>
    {/if}

    <!-- Register Step 3: Verify Order -->
    {#if step === 3}

<Motion variants={stepVariants} initial="hidden" animate="visible" exit="exit" let:motion>
    <div class="gap-2" use:motion>
        <div class="flex flex-col items-center gap-2">
        {#if browser}
          <BlocksIcon triggers={{ hover: false }}  duration={3000} animationState="loading" size={42} class="text-primary"  loop={true} />
        {:else}
          <LayoutDashboard size={42} class="text-primary" />
        {/if}              <h1 class="text-base font-bold text-center">{t('auth.register.verifyOrderTitle')}</h1>
            <p class="text-xs text-secondary-foreground/70">{t('auth.register.verifyOrderSubtitle')}</p>
        </div>
        
        <!-- ÜST: Seçilen kelimelerin sıralandığı alan -->
        <div class="md:min-h-44 grid grid-cols-3 gap-2 my-2 bg-secondary min-h-45 p-2 rounded-lg">
            {#each selection as word, index (word)}
                <button 
                    type="button"
                    in:receive={{ key: word }}
                    out:send={{ key: word }}
                    animate:flip={{ duration: 400 }}
                    class="font-bold  whitespace-nowrap select-none cursor-pointer text-sm rounded-md   drop-shadow-md bg-primary px-2 py-1.5 text-secondary"
                    onclick={() => {
                        // Kelimeyi seçimden çıkar (aşağı iner)
                        selection = selection.filter(w => w !== word);
                    }}
                >
                    {index + 1}. {word}
                </button>
            {/each}
        </div>

        <!-- ALT: Tüm kelimelerin bulunduğu grup (seçilmeyenler) -->
        <div class="min-h-45 grid grid-cols-3 gap-2 my-2 p-2 border-1 rounded-lg">
            {#each availableWords as word (word)}
                <button
                    type="button"
                    in:receive={{ key: word }}
                    out:send={{ key: word }}
                    animate:flip={{ duration: 400 }}
                    class="font-bold  whitespace-nowrap select-none cursor-pointer text-sm rounded-md   drop-shadow-md bg-primary px-2 py-1.5 text-secondary"
                    onclick={() => {
                        // Kelimeyi seçime ekle (yukarı uçar)
                        selection = [...selection, word];
                    }}
                >
                    {word}
                </button>
            {/each}
        </div>

                  <div class="flex gap-2  my-3">
            <Button type="button" class="w-1/2" onclick={() => (step = 1)} variant="outline">{t('Back')}</Button>
            <Button type="button" class="w-1/2" disabled={loading || selection.length !== mnemonic.length} onclick={finalizeRegister}>
              {#if loading}
                <Loader class="animate-spin" />
                {t('Saving') || t('Loading')}
              {:else}
                {t('Complete')}
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