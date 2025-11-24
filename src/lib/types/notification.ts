export type NotificationType = 'announcement' | 'comment' | 'reply' | 'like' | 'follow';

export interface NotificationActor {
	id: string;
	nickname?: string | null;
	name?: string | null;
}

export interface NotificationMeta {
	[key: string]: any;
}

export interface TranslationObject {
	key: string;
	values?: Record<string, string | number | null | undefined>;
}

export interface NotificationRecord {
	id: string;
	type: NotificationType;
	title: string | TranslationObject;
	message: string | TranslationObject;
	link: string | null;
	actor: NotificationActor | null;
	meta: NotificationMeta | null;
	read: boolean;
	createdAt: string;
	readAt?: string | null;
}

export interface CreateNotificationInput {
	userId: string;
	type: NotificationType;
	title: string | TranslationObject;
	message: string | TranslationObject;
	link?: string | null;
	actor?: NotificationActor | null;
	meta?: NotificationMeta | null;
}
