<script lang="ts">
	import GalleryVerticalEndIcon from "@lucide/svelte/icons/gallery-vertical-end";
	import AuthForm from "$lib/components/AuthForm.svelte";
	import logo from "$lib/assets/laf1.svg";

</script>

<div class="text-xs grid min-h-svh lg:grid-cols-2">
	<div class="flex flex-col gap-4 p-6 md:p-10">
		<div class="flex text-primary justify-center gap-2 md:justify-start">
			<a href="/" class="flex items-center gap-2 font-bold">
				<div
					class="bg-secondary text-primary-foreground flex p-1 items-center justify-center rounded-md"
				>
					<img src="{logo}" alt="LAF" class="h-11 w-11" />
				</div>
				Liberteryen Anarşist Faaliyet
			</a>
		</div>
		<div class="flex flex-1 items-center justify-center">
			<div class="w-full max-w-xs">
				<AuthForm mode="login" />
			</div>
		</div>
	</div>
	<div class="bg-muted relative hidden lg:block">

	</div>
</div>
