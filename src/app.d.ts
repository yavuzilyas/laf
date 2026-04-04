// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				id: string;
				username: string;
				email?: string;
				[key: string]: any;
			} | null;
			locale: string;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module 'bcrypt' {
	const bcrypt: {
		hash: (data: string | Buffer, saltOrRounds: string | number) => Promise<string>;
		compare: (data: string | Buffer, encrypted: string) => Promise<boolean>;
	};
	export default bcrypt;
}


export {};
