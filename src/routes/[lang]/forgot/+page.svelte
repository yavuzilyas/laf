<script lang="ts">
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { showToast } from "$lib/hooks/toast";
  import { t } from '$lib/stores/i18n.svelte.js';
  import { Motion } from "svelte-motion";
import { User, KeyRound, Eye, EyeOff, ArrowLeft, Lock } from "@lucide/svelte";
  import { BarSpinner } from "$lib/components/spell/bar-spinner";
  import logo from "$lib/assets/laf1.svg";

  // Steps: 1 = enter identifier, 2 = verify mnemonic, 3 = enter new password
  let step = $state<1 | 2 | 3>(1);
  let loading = $state(false);

  // Step 1
  let identifier = $state("");

  // Step 2
  let mnemonicPhrase = $state("");
  let verificationToken = $state<string | null>(null);
  let userId = $state<string | null>(null);
  let remainingAttempts = $state(3);

  // Step 3
  let newPassword = $state("");
  let confirmPassword = $state("");
  let showNewPassword = $state(false);
  let showConfirmPassword = $state(false);
  let passwordStrength = $state(0);
  let passwordFeedback = $state("");

  const stepVariants = {
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5 }, ease: "easeIn" },
    hidden: { opacity: 0, y: 22, filter: "blur(9px)", transition: { duration: 0.5 }, ease: "easeOut" },
    exit: { opacity: 0, y: -22, filter: "blur(9px)", transition: { duration: 0.5 }, ease: "easeIn" },
  };

  function computePasswordStrength(pw: string): { score: number; msg: string } {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    score = Math.min(4, Math.max(0, score - 1));
    const msgs = [
      t('auth.password.veryWeak') || 'Çok zayıf',
      t('auth.password.weak') || 'Zayıf',
      t('auth.password.fair') || 'Orta',
      t('auth.password.strong') || 'Güçlü',
      t('auth.password.veryStrong') || 'Çok güçlü'
    ];
    return { score, msg: msgs[score] };
  }

  function meetsPasswordPolicy(pw: string): boolean {
    return pw.length >= 8 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /[0-9]/.test(pw);
  }

  async function submitIdentifier(e: Event) {
    e.preventDefault();
    if (!identifier) {
      showToast(t('auth.errors.usernameRequired') || 'Kullanıcı adı gerekli', 'error');
      return;
    }

    loading = true;
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });

      const data = await res.json();

      if (res.ok) {
        verificationToken = data.verificationToken;
        userId = data.userId;
        remainingAttempts = data.remainingAttempts || 3;
        step = 2;
        showToast(data.message || 'Mnemonic doğrulaması gerekli', 'info');
      } else {
        showToast(data.error || 'Bir hata oluştu', 'error');
      }
    } catch (error) {
      showToast('Bağlantı hatası', 'error');
    } finally {
      loading = false;
    }
  }

  async function verifyMnemonic(e: Event) {
    e.preventDefault();
    if (!mnemonicPhrase || !verificationToken || !userId) {
      showToast('Mnemonic gerekli', 'error');
      return;
    }

    loading = true;
    try {
      const res = await fetch('/api/auth/verify-mnemonic-for-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          mnemonicPhrase,
          verificationToken
        })
      });

      const data = await res.json();

      if (res.ok) {
        verificationToken = data.verificationToken;
        step = 3;
        showToast(data.message || 'Doğrulama başarılı', 'success');
      } else {
        remainingAttempts = data.remainingAttempts || 0;
        if (data.reset) {
          // Too many failed attempts, go back to step 1
          step = 1;
          mnemonicPhrase = "";
          verificationToken = null;
        }
        showToast(data.error || 'Yanlış mnemonic', 'error');
      }
    } catch (error) {
      showToast('Bağlantı hatası', 'error');
    } finally {
      loading = false;
    }
  }

  async function resetPassword(e: Event) {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      showToast(t('auth.errors.missingFields') || 'Tüm alanları doldurun', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(t('auth.errors.passwordsDoNotMatch') || 'Şifreler eşleşmiyor', 'error');
      return;
    }

    if (!meetsPasswordPolicy(newPassword)) {
      showToast(t('auth.password.policy') || 'En az 8 karakter, büyük/küçük harf ve rakam içermeli', 'error');
      return;
    }

    loading = true;
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          verificationToken,
          newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Şifre başarıyla değiştirildi', 'success');
        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else {
        showToast(data.error || 'Şifre değiştirilemedi', 'error');
      }
    } catch (error) {
      showToast('Bağlantı hatası', 'error');
    } finally {
      loading = false;
    }
  }

  function goBack() {
    if (step === 2) {
      step = 1;
      mnemonicPhrase = "";
      verificationToken = null;
    } else if (step === 3) {
      step = 2;
      newPassword = "";
      confirmPassword = "";
    }
  }

  $effect(() => {
    if (newPassword) {
      const { score, msg } = computePasswordStrength(newPassword);
      passwordStrength = score;
      passwordFeedback = msg;
    }
  });
</script>

<svelte:head>
  <title>{t('ForgotPassword') || 'Şifremi Unuttum'} - LAF</title>
</svelte:head>

<div class="text-xs grid min-h-svh">
  <div class="flex flex-col gap-4 p-6 md:p-10">
    <div class="flex text-secondary-foreground justify-center gap-2 md:justify-start">
      <a href="/" class="flex text-base items-center gap-2 font-bold">
        <div class="bg-secondary text-primary-foreground flex p-1 items-center justify-center rounded-md">
          <img src={logo} alt="LAF" class="h-11 w-11" />
        </div>
        Liberteryen Anarşist Faaliyet
      </a>
    </div>

    <div class="flex flex-1 items-start justify-center">
      <div class="w-full max-w-xs">
        {#if step === 1}
          <Motion variants={stepVariants} initial="hidden" animate="visible" exit="exit" let:motion>
            <div use:motion class="flex flex-col items-center gap-2 text-center">
              <User size={42} class="text-primary" />
              <h1 class="text-base font-bold">{t('ForgotPassword') || 'Şifremi Unuttum'}</h1>
              <p class="text-secondary-foreground/70 text-balance text-sm">
                {t('auth.forgot.step1Description') || 'Kullanıcı adınızı veya e-postanızı girin'}
              </p>

              <form onsubmit={submitIdentifier} class="grid gap-3 w-full mt-3">
                <div class="grid gap-3">
                  <Label for="identifier">{t('UsernameOrEmail')}</Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="kullanici-adi"
                    required
                    bind:value={identifier}
                    disabled={loading}
                    oninput={(e) => {
                      let v = (e.target as HTMLInputElement)?.value || '';
                      v = v.toLowerCase().replace(/[^a-z]/g, '');
                      identifier = v;
                    }}
                  />
                </div>

                <Button type="submit" class="w-full" disabled={loading}>
                  {#if loading}
                    <BarSpinner class="text-primary" />
                    {t('Loading') || 'Yükleniyor...'}
                  {:else}
                    {t('Continue') || 'Devam Et'}
                  {/if}
                </Button>

                <div class="text-center text-xs mt-2">
                  <a href="/login" class="text-primary underline underline-offset-4 inline-flex items-center gap-1">
                    <ArrowLeft class="w-3 h-3" />
                    {t('BackToLogin') || 'Girişe Dön'}
                  </a>
                </div>
              </form>
            </div>
          </Motion>

        {:else if step === 2}
          <Motion variants={stepVariants} initial="hidden" animate="visible" exit="exit" let:motion>
            <div use:motion class="flex flex-col items-center gap-2 text-center">
              <KeyRound size={42} class="text-primary" />
              <h1 class="text-base font-bold">{t('auth.forgot.verifyMnemonic') || 'Mnemonic Doğrulama'}</h1>
              <p class="text-secondary-foreground/70 text-balance text-sm">
                {t('auth.forgot.step2Description') || 'Hesabınızı kurtarmak için 12 kelimelik mnemonic silsilenizi girin'}
              </p>

              {#if remainingAttempts < 3}
                <p class="text-xs text-red-500">
                  {remainingAttempts} {t('auth.forgot.attemptsRemaining') || 'deneme hakkınız kaldı'}
                </p>
              {/if}

              <form onsubmit={verifyMnemonic} class="grid gap-3 w-full mt-3">
                <div class="grid gap-3">
                  <Label for="mnemonic">{t('MnemonicPhrase') || 'Mnemonic Silsile'}</Label>
                  <Input
                    id="mnemonic"
                    type="text"
                    placeholder="word1 word2 word3 ..."
                    required
                    bind:value={mnemonicPhrase}
                    disabled={loading}
                  />
                </div>

                <div class="flex gap-2">
                  <Button type="button" variant="outline" class="w-1/2" onclick={goBack} disabled={loading}>
                    {t('Back') || 'Geri'}
                  </Button>
                  <Button type="submit" class="w-1/2" disabled={loading}>
                    {#if loading}
                      <BarSpinner class="text-primary"/>
                      {t('Verifying') || 'Doğrulanıyor...'}
                    {:else}
                      {t('Verify') || 'Doğrula'}
                    {/if}
                  </Button>
                </div>
              </form>
            </div>
          </Motion>

        {:else if step === 3}
          <Motion variants={stepVariants} initial="hidden" animate="visible" exit="exit" let:motion>
            <div use:motion class="flex flex-col items-center gap-2 text-center">
              <Lock size={42} class="text-primary" />
              <h1 class="text-base font-bold">{t('auth.forgot.newPassword') || 'Yeni Şifre'}</h1>
              <p class="text-secondary-foreground/70 text-balance text-sm">
                {t('auth.forgot.step3Description') || 'Yeni şifrenizi girin'}
              </p>

              <form onsubmit={resetPassword} class="grid gap-3 w-full mt-3">
                <div class="grid gap-3">
                  <Label for="newPassword">{t('NewPassword') || 'Yeni Şifre'}</Label>
                  <div class="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      bind:value={newPassword}
                      disabled={loading}
                      class="pr-10"
                    />
                    <button
                      type="button"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rounded-full p-1.5 transition-colors"
                      onclick={() => showNewPassword = !showNewPassword}
                    >
                      {#if showNewPassword}
                        <EyeOff class="h-4 w-4" />
                      {:else}
                        <Eye class="h-4 w-4" />
                      {/if}
                    </button>
                  </div>

                  {#if newPassword}
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
                  {/if}
                </div>

                <div class="grid gap-3">
                  <Label for="confirmPassword">{t('ConfirmPassword') || 'Şifreyi Onayla'}</Label>
                  <div class="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      bind:value={confirmPassword}
                      disabled={loading}
                      class="pr-10"
                    />
                    <button
                      type="button"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rounded-full p-1.5 transition-colors"
                      onclick={() => showConfirmPassword = !showConfirmPassword}
                    >
                      {#if showConfirmPassword}
                        <EyeOff class="h-4 w-4" />
                      {:else}
                        <Eye class="h-4 w-4" />
                      {/if}
                    </button>
                  </div>
                </div>

                <div class="flex gap-2">
                  <Button type="submit" class="w-full" disabled={loading || !meetsPasswordPolicy(newPassword)}>
                    {#if loading}
                      <BarSpinner class="text-primary"/>
                      {t('Saving') || 'Kaydediliyor...'}
                    {:else}
                      {t('ResetPassword') || 'Şifreyi Sıfırla'}
                    {/if}
                  </Button>
                </div>
              </form>
            </div>
          </Motion>
        {/if}
      </div>
    </div>
  </div>
</div>
