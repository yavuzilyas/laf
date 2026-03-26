<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Accordion from '$lib/components/ui/accordion';
	import { BookOpen, HelpCircle, MessageCircle, Settings, Users, Shield, Zap, Globe, Mail, Phone, ChevronRight, ExternalLink, Search, FileText, Video, Download } from '@lucide/svelte';
	import { page } from '$app/stores';

	let isDialogOpen = false;
	let selectedTopic = '';
	let dialogContent = '';

	const helpTopics = [
		{
			id: 'getting-started',
			title: 'Başlangıç',
			icon: BookOpen,
			description: 'Platforma nasıl başlayacağınızı öğrenin',
			content: {
				title: 'Başlangıç Rehberi',
				text: 'Platforma yeni başlıyorsanız, bu rehber size temel adımları gösterecektir. Hesap oluşturma, profil ayarlama ve ilk adımlar hakkında detaylı bilgi bulunmaktadır.'
			}
		},
		{
			id: 'account',
			title: 'Hesap Yönetimi',
			icon: Users,
			description: 'Hesabınızı yönetin ve güvenliği sağlayın',
			content: {
				title: 'Hesap Yönetimi',
				text: 'Hesap ayarlarınızı yönetin, şifrenizi değiştirin, gizlilik ayarlarını yapılandırın ve hesap güvenliğinizi artırın.'
			}
		},
		{
			id: 'security',
			title: 'Güvenlik',
			icon: Shield,
			description: 'Hesap güvenliğinizi nasıl sağlayacağınızı öğrenin',
			content: {
				title: 'Güvenlik Rehberi',
				text: 'İki faktörlü kimlik doğrulama, güçlü şifreler ve güvenlik ipuçları ile hesabınızı koruyun.'
			}
		},
		{
			id: 'features',
			title: 'Özellikler',
			icon: Zap,
			description: 'Platform özelliklerini keşfedin',
			content: {
				title: 'Platform Özellikleri',
				text: 'Platformun tüm özelliklerini öğrenin: yazma araçları, işbirliği özellikleri, medya yönetimi ve daha fazlası.'
			}
		}
	];

	const faqItems = [
		{
			question: 'Hesabımı nasıl oluştururum?',
			answer: 'Ana sayfadaki "Kayıt Ol" butonuna tıklayın, gerekli bilgileri doldurun ve e-posta adresinizi doğrulayın.'
		},
		{
			question: 'Şifremi unuttum, ne yapmalıyım?',
			answer: 'Giriş sayfasındaki "Şifremi Unuttum" bağlantısına tıklayın ve e-posta adresinizi girin. Şifre sıfırlama bağlantısı e-posta adresinize gönderilecektir.'
		},
		{
			question: 'Profilimi nasıl düzenleyebilirim?',
			answer: 'Ayarlar menüsünden "Profil Ayarları" seçeneğine gidin. Burada adınızı, profil fotoğrafınızı ve diğer bilgilerinizi güncelleyebilirsiniz.'
		},
		{
			question: 'İki faktörlü kimlik doğrulamayı nasıl etkinleştirebilirim?',
			answer: 'Güvenlik ayarlarından "İki Faktörlü Kimlik Doğrulama" seçeneğini bulun ve adımları takip edin. Kimlik doğrulama uygulaması ile QR kodu tarayın.'
		},
		{
			question: 'İçerik nasıl oluşturabilirim?',
			answer: 'Ana menüdeki "Yaz" butonuna tıklayın. Metin düzenleyiciyi kullanarak içerik oluşturabilir, medya ekleyebilir ve yayınlamadan önce önizleme yapabilirsiniz.'
		},
		{
			question: 'Diğer kullanıcılarla nasıl işbirliği yapabilirim?',
			answer: 'İçerik sayfasında "Paylaş" butonunu kullanarak diğer kullanıcıları davet edebilirsiniz. Gerçek zamanlı düzenleme ve yorum özelliklerini kullanabilirsiniz.'
		}
	];

	const quickActions = [
		{
			title: 'Kullanım Kılavuzu',
			description: 'Detaylı kullanım kılavuzunu indirin',
			icon: Download,
			action: () => console.log('Downloading guide')
		},
		{
			title: 'Video Eğitimleri',
			description: 'Adım adım video eğitimleri izleyin',
			icon: Video,
			action: () => console.log('Opening videos')
		},
		{
			title: 'Arama',
			description: 'Yardım makalelerinde arama yapın',
			icon: Search,
			action: () => console.log('Opening search')
		}
	];

	const contactOptions = [
		{
			title: 'Destek Talebi',
			description: 'Teknik destek için talep oluşturun',
			icon: MessageCircle,
			email: 'destek@platform.com'
		},
		{
			title: 'E-posta',
			description: 'Genel sorular için bize ulaşın',
			icon: Mail,
			email: 'info@platform.com'
		},
		{
			title: 'Telefon',
			description: 'Acil durumlar için bizi arayın',
			icon: Phone,
			phone: '+90 212 555 0123'
		}
	];

	function openDialog(topic: typeof helpTopics[0]) {
		selectedTopic = topic.content.title;
		dialogContent = topic.content.text;
		isDialogOpen = true;
	}
</script>

<svelte:head>
	<title>Yardım Merkezi - Platform Adı</title>
	<meta name="description" content="Yardım merkezi, sıkça sorulan sorular ve destek seçenekleri" />
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<!-- Header -->
	<div class="text-center mb-12">
		<div class="flex justify-center mb-4">
			<div class="p-3 bg-primary/10 rounded-full">
				<HelpCircle class="w-12 h-12 text-primary" />
			</div>
		</div>
		<h1 class="text-4xl font-bold mb-4">Yardım Merkezi</h1>
		<p class="text-xl text-muted-foreground max-w-2xl mx-auto">
			Sorularınızın yanıtlarını burada bulabilir, rehberleri inceleyebilir ve destek alabilirsiniz.
		</p>
	</div>

	<!-- Quick Actions -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
		{#each quickActions as action}
			<Card.Root class="group cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]" on:click={action.action}>
				<Card.Content class="p-6 text-center">
					<div class="mx-auto mb-4 p-3 bg-muted rounded-full w-fit group-hover:bg-primary/10 transition-colors">
						<action.icon class="w-6 h-6 text-primary" />
					</div>
					<Card.Title class="mb-2">{action.title}</Card.Title>
					<Card.Description>{action.description}</Card.Description>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<!-- Help Topics Cards -->
	<section class="mb-12">
		<h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
			<BookOpen class="w-6 h-6" />
			Yardım Konuları
		</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each helpTopics as topic}
				<Card.Root class="group cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]" on:click={() => openDialog(topic)}>
					<Card.Content class="p-6">
						<div class="mb-4 p-2 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-colors">
							<topic.icon class="w-6 h-6 text-primary" />
						</div>
						<Card.Title class="mb-2">{topic.title}</Card.Title>
						<Card.Description>{topic.description}</Card.Description>
						<div class="mt-4 flex items-center text-primary text-sm font-medium">
							Daha fazla bilgi
							<ChevronRight class="w-4 h-4 ml-1" />
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</section>

	<!-- FAQ Accordion -->
	<section class="mb-12">
		<h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
			<FileText class="w-6 h-6" />
			Sıkça Sorulan Sorular
		</h2>
		<Card.Root>
			<Card.Content class="p-6">
				<Accordion.Root class="w-full" type="single" collapsible>
					{#each faqItems as item, index}
						<Accordion.Item value={`item-${index}`}>
							<Accordion.Trigger class="text-left hover:no-underline">
								<span class="font-medium">{item.question}</span>
							</Accordion.Trigger>
							<Accordion.Content class="text-muted-foreground">
								{item.answer}
							</Accordion.Content>
						</Accordion.Item>
					{/each}
				</Accordion.Root>
			</Card.Content>
		</Card.Root>
	</section>

	<!-- Contact Options -->
	<section class="mb-12">
		<h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
			<MessageCircle class="w-6 h-6" />
			İletişim ve Destek
		</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			{#each contactOptions as contact}
				<Card.Root class="group transition-all hover:shadow-md">
					<Card.Content class="p-6 text-center">
						<div class="mx-auto mb-4 p-3 bg-muted rounded-full w-fit group-hover:bg-primary/10 transition-colors">
							<contact.icon class="w-6 h-6 text-primary" />
						</div>
						<Card.Title class="mb-2">{contact.title}</Card.Title>
						<Card.Description class="mb-4">{contact.description}</Card.Description>
						{#if contact.email}
							<Button variant="outline" class="w-full" onclick={`window.location.href='mailto:${contact.email}'`}>
								<Mail class="w-4 h-4 mr-2" />
								{contact.email}
							</Button>
						{/if}
						{#if contact.phone}
							<Button variant="outline" class="w-full" onclick={`window.location.href='tel:${contact.phone}'`}>
								<Phone class="w-4 h-4 mr-2" />
								{contact.phone}
							</Button>
						{/if}
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</section>

	<!-- Additional Resources -->
	<section>
		<h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
			<Globe class="w-6 h-6" />
			Ekstra Kaynaklar
		</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<Card.Root class="group transition-all hover:shadow-md">
				<Card.Content class="p-6">
					<div class="flex items-start gap-4">
						<div class="p-2 bg-primary/10 rounded-lg">
							<ExternalLink class="w-5 h-5 text-primary" />
						</div>
						<div class="flex-1">
							<Card.Title class="mb-2">Topluluk Forumu</Card.Title>
							<Card.Description class="mb-4">
								Diğer kullanıcılarla tanışın, deneyimlerinizi paylaşın ve sorularınıza topluluktan yanıt alın.
							</Card.Description>
							<Button variant="outline" size="sm">
								Forumu Ziyaret Et
								<ExternalLink class="w-4 h-4 ml-2" />
							</Button>
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="group transition-all hover:shadow-md">
				<Card.Content class="p-6">
					<div class="flex items-start gap-4">
						<div class="p-2 bg-primary/10 rounded-lg">
							<Video class="w-5 h-5 text-primary" />
						</div>
						<div class="flex-1">
							<Card.Title class="mb-2">Video Eğitimleri</Card.Title>
							<Card.Description class="mb-4">
								Adım adım video eğitimleri ile platformu daha hızlı öğrenin.
							</Card.Description>
							<Button variant="outline" size="sm">
								Eğitimleri İzle
								<ExternalLink class="w-4 h-4 ml-2" />
							</Button>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</section>
</div>

<!-- Topic Detail Dialog -->
<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>{selectedTopic}</Dialog.Title>
			<Dialog.Description>
				Bu konu hakkında detaylı bilgi
			</Dialog.Description>
		</Dialog.Header>
		<div class="py-4">
			<p class="text-sm text-muted-foreground">{dialogContent}</p>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => isDialogOpen = false}>
				Kapat
			</Button>
			<Button>
				Daha Fazla Bilgi
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>