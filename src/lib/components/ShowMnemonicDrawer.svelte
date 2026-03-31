<script lang="ts">
	import * as Drawer from "$lib/components/ui/drawer/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { mnemonicPhraseStore, clearMnemonicPhrase } from '$lib/stores/mnemonic';
	import { showToast } from "$lib/hooks/toast";
	import { t } from '$lib/stores/i18n.svelte.js';
	import KeyRound from "@lucide/svelte/icons/key-round";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import EyeOffIcon from "@lucide/svelte/icons/eye-off";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import PrinterIcon from "@lucide/svelte/icons/printer";
	import jsPDF from 'jspdf';
	import logo from '$lib/assets/hatlaf.png';

	let { open = $bindable(false) } = $props();
	let mnemonicCopied = $state(false);
	let pdfUrl = $state(''); // PDF adresi için placeholder
	let isGeneratingPDF = $state(false);

	function copyMnemonic(text: string) {
		navigator.clipboard.writeText(text).then(() => {
			mnemonicCopied = true;
			showToast(t('Copied') || 'Copied', 'success');
			setTimeout(() => {
				mnemonicCopied = false;
			}, 1500);
		}).catch(() => {
			showToast(t('auth.errors.copyFailed') || 'Failed to copy', 'error');
		});
	}

	function handleClear() {
		clearMnemonicPhrase();
		open = false;
	}

	async function generatePDF() {
		if (!$mnemonicPhraseStore) {
			return;
		}
		
		isGeneratingPDF = true;
		
		try {
			const pdf = new jsPDF();
			
			// Set background to match site
			pdf.setFillColor(249, 250, 251); // Light gray background
			pdf.rect(0, 0, 210, 297, 'F');
			
			// Logo in top-left
			pdf.setFillColor(1, 1, 1); // Blue background
			pdf.roundedRect(20, 20, 25, 25, 5, 5, 'F');
			pdf.addImage(logo, 'PNG', 20, 20, 25, 25);
			
			// Document Title
			pdf.setTextColor(31, 41, 55); // Dark gray
			pdf.setFontSize(20);
			pdf.setFont('Libre Baskerville', 'bold');
			pdf.text('Mnemonic Backup Document', 20, 65);
			
			// Document Description
			pdf.setTextColor(75, 85, 99); // Medium gray
			pdf.setFontSize(11);
			pdf.setFont('Libre Baskerville', 'normal');
			pdf.text('This document contains your recovery phrase for account access.', 20, 75);
			
			// Document Importance
			pdf.setTextColor(107, 114, 128); // Lighter gray
			pdf.setFontSize(10);
			pdf.text('IMPORTANCE: Keep this document secure and private. Never share with anyone.', 20, 85);
			
			// Date
			pdf.setTextColor(156, 163, 175); // Even lighter gray
			pdf.setFontSize(9);
			pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, 95);
			
			// Mnemonic Code Section
			pdf.setTextColor(31, 41, 55); // Dark gray
			pdf.setFontSize(12);
			pdf.setFont('Libre Baskerville', 'bold');
			pdf.text('Mnemonic Code:', 20, 115);
			
			// Split mnemonic into words and create rounded borders for each
			const words = $mnemonicPhraseStore.split(' ');
			const wordsPerRow = 4;
			const startX = 20;
			const startY = 125;
			const boxWidth = 40;
			const boxHeight = 15;
			const spacing = 5;
			
			pdf.setTextColor(55, 65, 81); // Medium-dark gray
			pdf.setFontSize(9);
			pdf.setFont('Libre Baskerville', 'normal');
			
			words.forEach((word, index) => {
				const row = Math.floor(index / wordsPerRow);
				const col = index % wordsPerRow;
				const x = startX + (col * (boxWidth + spacing));
				const y = startY + (row * (boxHeight + spacing));
				
				// Draw rounded border
				pdf.setDrawColor(156, 163, 175); // Light gray border
				pdf.setLineWidth(0.5);
				pdf.roundedRect(x, y, boxWidth, boxHeight, 2, 2);
				
				// Add word number
				pdf.setTextColor(156, 163, 175); // Light gray for number
				pdf.setFontSize(7);
				pdf.text(`${index + 1}.`, x + 2, y + 4);
				
				// Add word
				pdf.setTextColor(31, 41, 55); // Dark gray for word
				pdf.setFontSize(8);
				pdf.text(word, x + boxWidth/2, y + boxHeight/2 + 2, { align: 'center' });
			});
			
			// Additional Information Section
			const infoY = startY + Math.ceil(words.length / wordsPerRow) * (boxHeight + spacing) + 20;
			
			pdf.setTextColor(31, 41, 55); // Dark gray
			pdf.setFontSize(11);
			pdf.setFont('Libre Baskerville', 'bold');
			pdf.text('Important Information:', 20, infoY);
			
			pdf.setTextColor(75, 85, 99); // Medium gray
			pdf.setFontSize(9);
			pdf.setFont('Libre Baskerville', 'normal');
			
			const infoLines = [
				'1- This phrase is the master key to your account',
				'2- Store it in a secure physical location',
				'3- Do not store digitally or photograph',
				'4- Anyone with this phrase can access your account',
				'5- This phrase cannot be recovered if lost'
			];
			
			let currentY = infoY + 10;
			infoLines.forEach(line => {
				pdf.text(line, 20, currentY);
				currentY += 8;
			});
			
			// Footer Information
			const footerY = 270;
			
			pdf.setDrawColor(209, 213, 219); // Light gray line
			pdf.setLineWidth(0.5);
			pdf.line(20, footerY, 190, footerY);
			
			pdf.setTextColor(107, 114, 128); // Light gray
			pdf.setFontSize(8);
			pdf.text('LAF - Libertarian Anarchist Foundation', 20, footerY + 8);
	
			// Trigger print dialog instead of saving
			pdf.autoPrint();
			window.open(pdf.output('bloburl'), '_blank');
			
			showToast('Print dialog opened successfully', 'success');
			
		} catch (error) {
			// Try fallback method
			try {
				await generateSimplePDF();
			} catch (fallbackError) {
				showToast(`Failed to generate PDF: ${error.message}`, 'error');
			}
		} finally {
			isGeneratingPDF = false;
		}
	}

	async function generateSimplePDF() {
		const pdf = new jsPDF();
		
		// Add header with logo placeholder
		pdf.setFillColor(37, 99, 235); // Blue background
		pdf.rect(10, 10, 40, 15, 'F'); // Logo background
		pdf.setTextColor(255, 255, 255);
		pdf.setFontSize(12);
		pdf.text('LAF', 25, 20); // Logo text
		
		// Add title
		pdf.setTextColor(0, 0, 0);
		pdf.setFontSize(20);
		pdf.text('LAF - Security Backup Document', 60, 20);
		
		// Add date
		pdf.setFontSize(12);
		pdf.text(`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, 35);
		
		// Add document ID
		pdf.text(`Document ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 20, 45);
		
		// Add warning
		pdf.setFontSize(14);
		pdf.setTextColor(255, 0, 0);
		pdf.text('CONFIDENTIAL SECURITY WARNING:', 20, 65);
		pdf.setFontSize(10);
		pdf.text('This document contains your private recovery phrase', 20, 75);
		pdf.text('Store in a secure location and never share with anyone', 20, 85);
		pdf.text('Anyone with this phrase can access all your assets', 20, 95);
		
		// Add mnemonic phrase
		pdf.setTextColor(0, 0, 0);
		pdf.setFontSize(12);
		pdf.text('Your Recovery Phrase:', 20, 115);
		pdf.setFont('courier');
		pdf.setFontSize(14);
		
		// Split long mnemonic into multiple lines
		const words = $mnemonicPhraseStore.split(' ');
		const lines = [];
		let currentLine = '';
		
		for (const word of words) {
			if (currentLine.length + word.length + 1 > 60) {
				lines.push(currentLine);
				currentLine = word;
			} else {
				currentLine += (currentLine ? ' ' : '') + word;
			}
		}
		if (currentLine) {
			lines.push(currentLine);
		}
		
		let yPosition = 125;
		for (const line of lines) {
			pdf.text(line, 20, yPosition);
			yPosition += 10;
		}
		
		// Add word count
		pdf.setFontSize(10);
		pdf.text(`Word Count: ${$mnemonicPhraseStore.split(' ').length} words`, 20, yPosition + 10);
		
		// Add footer
		pdf.setFontSize(8);
		pdf.text('© 2024 LAF. All rights reserved.', 20, 280);
		pdf.text('Document Classification: CONFIDENTIAL', 20, 285);
		
		// Trigger print dialog instead of saving
		pdf.autoPrint();
		window.open(pdf.output('bloburl'), '_blank');
		
		showToast('Simple PDF print dialog opened', 'success');
	}

	function handlePrint() {
		if (pdfUrl) {
			// PDF URL varsa yeni sekmede aç
			window.open(pdfUrl, '_blank');
		} else {
			// PDF URL yoksa PDF oluştur ve aç
			generatePDF();
		}
	}
</script>

<Drawer.Root bind:open>
	<Drawer.Portal>
		<Drawer.Overlay />
		<Drawer.Content class="flex flex-col rounded-t-[10px] h-fit items-center bg-background">
			<div class="w-[500px] max-w-[98vw]">
			<Drawer.Header class="text-left">
				<Drawer.Title>{t('ShowMnemonic')}</Drawer.Title>
				<Drawer.Description>{t('MnemonicWarning')}</Drawer.Description>
			</Drawer.Header>
			
			<ScrollArea orientation="vertical" class="flex-1 px-4">
				<div class="py-4">
					{#if $mnemonicPhraseStore}
						<div class="rounded-md border p-4 space-y-4">
							<p class="text-sm text-muted-foreground">{t('MnemonicWarning')}</p>
							<p class="text-sm font-mono break-words select-text">{$mnemonicPhraseStore}</p>
							
							<div class="flex flex-wrap gap-2 pt-2">
								<Button 
									size="sm" 
									variant="outline" 
									onclick={() => copyMnemonic($mnemonicPhraseStore)}
									class="flex items-center gap-2"
								>
									<CopyIcon class="w-4 h-4" />
									{mnemonicCopied ? t('Copied') : t('Copy')}
								</Button>
								
								<Button 
									size="sm" 
									variant="outline" 
									onclick={handlePrint}
									disabled={isGeneratingPDF}
									class="flex items-center gap-2"
								>
									{#if isGeneratingPDF}
										<div class="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
										{t('Generating')}...
									{:else}
										<PrinterIcon class="w-4 h-4" />
										{t('Print')}
									{/if}
								</Button>
								
								<Button 
									size="sm" 
									variant="outline" 
									onclick={handleClear}
									class="flex items-center gap-2"
								>
									<TrashIcon class="w-4 h-4" />
									{t('ClearInThisSession')}
								</Button>
								
							</div>
						</div>
					{:else}
						<div class="rounded-md border p-4 text-center">
							<KeyRound class="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
							<p class="text-sm text-muted-foreground">
								{t('auth.errors.mnemonicRequired') || 'Mnemonic not stored in this session.'}
							</p>
						</div>
					{/if}
				</div>
			</ScrollArea>
			
			<Drawer.Footer class="pt-2">
				<Drawer.Close>
					<Button variant="outline" class="w-full">
						{t('Close')}
					</Button>
				</Drawer.Close>
			</Drawer.Footer>
			</div>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>
