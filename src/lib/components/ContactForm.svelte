<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { Send, MessageSquare, Users, HelpCircle, Lightbulb, AlertCircle, Lock, LogIn } from '@lucide/svelte';
  import { showToast } from '$lib/hooks/toast';
  import { userStore } from '$lib/stores/user';
  import { t } from '$lib/stores/i18n.svelte.js';
  import { getCurrentLocale } from '$lib/stores/i18n.svelte.js';

  // Locale-aware URL helper
  const currentLocale = $derived(getCurrentLocale() || 'tr');
  const l = (path: string) => `/${currentLocale}${path}`;
  import { MagicCard } from '$lib/components/magic/magic-card';
import { ContactRoundIcon } from 'svelte-animate-icons';
  // User authentication state
  let currentUser = $derived($userStore.user);
  let isLoggedIn = $derived(!!currentUser);

  // Contact form state
  let contactName = $state('');
  let contactSubject = $state('');
  let contactMessage = $state('');
  let isSubmitting = $state(false);
  // Honeypot field for spam protection (hidden from real users)
  let website = $state(''); // Honeypot - bots fill this, humans don't see it

  const subjectOptions = [
    { value: 'general', label: t('General'), icon: HelpCircle },
    { value: 'feedback', label: t('Feedback'), icon: Lightbulb },
    { value: 'collaboration', label: t('Collaboration'), icon: Users },
    { value: 'report', label: t('Report'), icon: AlertCircle },
    { value: 'other', label: t('Other'), icon: MessageSquare }
  ];

  async function handleContactSubmit(e: Event) {
    e.preventDefault();

    // Check if user is logged in
    if (!isLoggedIn) {
      showToast('Bu formu kullanabilmek için giriş yapmalısınız', 'error');
      return;
    }

    // Honeypot check - if filled, it's likely a bot
    if (website) {
      // Silently fail for bots
      return;
    }

    if (!contactName.trim() || !contactSubject || !contactMessage.trim()) {
      showToast('Lütfen tüm alanları doldurun', 'error');
      return;
    }

    isSubmitting = true;

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          subject: contactSubject,
          message: contactMessage,
          honeypot: website // Send honeypot value for server-side validation
        })
      });

      if (response.ok) {
        showToast(t('contactForm.success'), 'success');
        contactName = '';
        contactSubject = '';
        contactMessage = '';
        website = '';
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Submission failed');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('contactForm.error'), 'error');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="w-full md:w-xl mx-auto my-4">
  <div class="rounded-lg bg-card text-card-foreground shadow-lg overflow-hidden">
    <MagicCard gradientSize={250} gradientOpacity={0.15}>
      <div class="p-6">
        <!-- Form Content -->
        {#if isLoggedIn}
          <form onsubmit={handleContactSubmit} class="space-y-6">
            <!-- Honeypot field - hidden from real users -->
            <div class="hidden" aria-hidden="true">
              <input
                type="text"
                name="website"
                bind:value={website}
                tabindex="-1"
                autocomplete="off"
              />
            </div>

            <!-- Name Field -->
            <div class="space-y-2">
              <Label for="contact-name">{t('contactForm.name')}</Label>
              <Input
                id="contact-name"
                type="text"
                placeholder={t('contactForm.namePlaceholder')}
                bind:value={contactName}
                class="w-full"
              />
            </div>

            <!-- Subject Select -->
            <div class="space-y-2">
              <Label for="contact-subject">{t('contactForm.subject')}</Label>
              <Select.Root type="single" bind:value={contactSubject}>
                <Select.Trigger id="contact-subject" class="w-full">
                  {contactSubject ? subjectOptions.find(s => s.value === contactSubject)?.label : t('contactForm.subjectPlaceholder')}
                </Select.Trigger>
                <Select.Content>
                  {#each subjectOptions as option}
                    <Select.Item value={option.value}>
                      <div class="flex items-center gap-2">
                        <option.icon class="w-4 h-4" />
                        {option.label}
                      </div>
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>

            <!-- Message Textarea -->
            <div class="space-y-2">
              <Label for="contact-message">{t('contactForm.message')}</Label>
              <Textarea
                id="contact-message"
                placeholder={t('contactForm.messagePlaceholder')}
                bind:value={contactMessage}
                rows={5}
                class="w-full resize-none"
                maxCharacters={1000}
              />
            </div>

            <!-- Submit Button -->
            <Button
              type="submit"
              size="xs"
              disabled={isSubmitting || !contactName.trim() || !contactSubject || !contactMessage.trim()}
            >
              {#if isSubmitting}
                <span class="animate-spin mr-2">⏳</span>
                {t('contactForm.sending')}
              {:else}
                <Send class="w-4 h-4 mr-2" />
                {t('contactForm.submit')}
              {/if}
            </Button>
          </form>
        {:else}
          <!-- Login Prompt for Non-Authenticated Users -->
          <div class="text-center py-8">
            <div class="flex items-center justify-center mb-4">
              <div class="p-4 bg-muted rounded-full">
                <Lock class="w-10 h-10 text-muted-foreground" />
              </div>
            </div>
            <h3 class="text-lg font-semibold mb-2">{t('contactForm.loginRequired')}</h3>
            <p class="text-muted-foreground mb-6">{t('contactForm.loginPrompt')}</p>
            <Button href={l('/login')} size="xs">
              <LogIn class="w-4 h-4 mr-2" />
              {t('Login')}
            </Button>
            <p class="mt-4 text-sm text-muted-foreground">
              {t('contactDescription')}
            </p>
          </div>
        {/if}
      </div>
    </MagicCard>
  </div>

 
</div>
