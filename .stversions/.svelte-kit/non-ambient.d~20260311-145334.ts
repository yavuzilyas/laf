
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/403" | "/404" | "/500" | "/api" | "/api/account" | "/api/account/delete" | "/api/admin" | "/api/admin/delete-all-users" | "/api/admin/migrate-argon2" | "/api/analytics" | "/api/analytics/session" | "/api/articles" | "/api/articles/draft" | "/api/articles/save" | "/api/articles/save/autosave" | "/api/articles/[id]" | "/api/articles/[id]/comments" | "/api/articles/[id]/hide" | "/api/articles/[id]/like" | "/api/articles/[id]/react" | "/api/articles/[id]/review" | "/api/articles/[id]/save" | "/api/articles/[id]/status" | "/api/articles/[id]/versions" | "/api/auth" | "/api/auth/mnemonic-question" | "/api/auth/session" | "/api/auth/verify-mnemonic" | "/api/auth/verify-password" | "/api/comments" | "/api/comments/user-reactions" | "/api/comments/[id]" | "/api/comments/[id]/edit" | "/api/comments/[id]/hide" | "/api/comments/[id]/react" | "/api/comments/[id]/report" | "/api/drafts" | "/api/drafts/[id]" | "/api/events" | "/api/message" | "/api/moderation" | "/api/moderation/actions" | "/api/moderation/articles" | "/api/moderation/ban" | "/api/moderation/delete" | "/api/moderation/hide" | "/api/moderation/logs" | "/api/moderation/pending-articles" | "/api/moderation/reports" | "/api/moderation/role" | "/api/moderation/show-user" | "/api/moderation/stats" | "/api/notifications" | "/api/payment" | "/api/profile" | "/api/profile/update" | "/api/profile/upload-avatar" | "/api/profile/upload" | "/api/reports" | "/api/reports/[id]" | "/api/reports/[id]/resolve" | "/api/reports/[id]/status" | "/api/upload" | "/api/users" | "/api/users/[userId]" | "/api/users/[userId]/block" | "/api/users/[userId]/follow" | "/articles" | "/article" | "/article/[slug]" | "/corpus" | "/dashboard-01" | "/data-library" | "/donate" | "/donations" | "/donation" | "/giris" | "/help" | "/kayit" | "/lexicon" | "/login" | "/logout" | "/moderation" | "/register" | "/sidebar-13" | "/test-button" | "/write" | "/[nickname]";
		RouteParams(): {
			"/api/articles/[id]": { id: string };
			"/api/articles/[id]/comments": { id: string };
			"/api/articles/[id]/hide": { id: string };
			"/api/articles/[id]/like": { id: string };
			"/api/articles/[id]/react": { id: string };
			"/api/articles/[id]/review": { id: string };
			"/api/articles/[id]/save": { id: string };
			"/api/articles/[id]/status": { id: string };
			"/api/articles/[id]/versions": { id: string };
			"/api/comments/[id]": { id: string };
			"/api/comments/[id]/edit": { id: string };
			"/api/comments/[id]/hide": { id: string };
			"/api/comments/[id]/react": { id: string };
			"/api/comments/[id]/report": { id: string };
			"/api/drafts/[id]": { id: string };
			"/api/reports/[id]": { id: string };
			"/api/reports/[id]/resolve": { id: string };
			"/api/reports/[id]/status": { id: string };
			"/api/users/[userId]": { userId: string };
			"/api/users/[userId]/block": { userId: string };
			"/api/users/[userId]/follow": { userId: string };
			"/article/[slug]": { slug: string };
			"/[nickname]": { nickname: string }
		};
		LayoutParams(): {
			"/": { id?: string; userId?: string; slug?: string; nickname?: string };
			"/403": Record<string, never>;
			"/404": Record<string, never>;
			"/500": Record<string, never>;
			"/api": { id?: string; userId?: string };
			"/api/account": Record<string, never>;
			"/api/account/delete": Record<string, never>;
			"/api/admin": Record<string, never>;
			"/api/admin/delete-all-users": Record<string, never>;
			"/api/admin/migrate-argon2": Record<string, never>;
			"/api/analytics": Record<string, never>;
			"/api/analytics/session": Record<string, never>;
			"/api/articles": { id?: string };
			"/api/articles/draft": Record<string, never>;
			"/api/articles/save": Record<string, never>;
			"/api/articles/save/autosave": Record<string, never>;
			"/api/articles/[id]": { id: string };
			"/api/articles/[id]/comments": { id: string };
			"/api/articles/[id]/hide": { id: string };
			"/api/articles/[id]/like": { id: string };
			"/api/articles/[id]/react": { id: string };
			"/api/articles/[id]/review": { id: string };
			"/api/articles/[id]/save": { id: string };
			"/api/articles/[id]/status": { id: string };
			"/api/articles/[id]/versions": { id: string };
			"/api/auth": Record<string, never>;
			"/api/auth/mnemonic-question": Record<string, never>;
			"/api/auth/session": Record<string, never>;
			"/api/auth/verify-mnemonic": Record<string, never>;
			"/api/auth/verify-password": Record<string, never>;
			"/api/comments": { id?: string };
			"/api/comments/user-reactions": Record<string, never>;
			"/api/comments/[id]": { id: string };
			"/api/comments/[id]/edit": { id: string };
			"/api/comments/[id]/hide": { id: string };
			"/api/comments/[id]/react": { id: string };
			"/api/comments/[id]/report": { id: string };
			"/api/drafts": { id?: string };
			"/api/drafts/[id]": { id: string };
			"/api/events": Record<string, never>;
			"/api/message": Record<string, never>;
			"/api/moderation": Record<string, never>;
			"/api/moderation/actions": Record<string, never>;
			"/api/moderation/articles": Record<string, never>;
			"/api/moderation/ban": Record<string, never>;
			"/api/moderation/delete": Record<string, never>;
			"/api/moderation/hide": Record<string, never>;
			"/api/moderation/logs": Record<string, never>;
			"/api/moderation/pending-articles": Record<string, never>;
			"/api/moderation/reports": Record<string, never>;
			"/api/moderation/role": Record<string, never>;
			"/api/moderation/show-user": Record<string, never>;
			"/api/moderation/stats": Record<string, never>;
			"/api/notifications": Record<string, never>;
			"/api/payment": Record<string, never>;
			"/api/profile": Record<string, never>;
			"/api/profile/update": Record<string, never>;
			"/api/profile/upload-avatar": Record<string, never>;
			"/api/profile/upload": Record<string, never>;
			"/api/reports": { id?: string };
			"/api/reports/[id]": { id: string };
			"/api/reports/[id]/resolve": { id: string };
			"/api/reports/[id]/status": { id: string };
			"/api/upload": Record<string, never>;
			"/api/users": { userId?: string };
			"/api/users/[userId]": { userId: string };
			"/api/users/[userId]/block": { userId: string };
			"/api/users/[userId]/follow": { userId: string };
			"/articles": Record<string, never>;
			"/article": { slug?: string };
			"/article/[slug]": { slug: string };
			"/corpus": Record<string, never>;
			"/dashboard-01": Record<string, never>;
			"/data-library": Record<string, never>;
			"/donate": Record<string, never>;
			"/donations": Record<string, never>;
			"/donation": Record<string, never>;
			"/giris": Record<string, never>;
			"/help": Record<string, never>;
			"/kayit": Record<string, never>;
			"/lexicon": Record<string, never>;
			"/login": Record<string, never>;
			"/logout": Record<string, never>;
			"/moderation": Record<string, never>;
			"/register": Record<string, never>;
			"/sidebar-13": Record<string, never>;
			"/test-button": Record<string, never>;
			"/write": Record<string, never>;
			"/[nickname]": { nickname: string }
		};
		Pathname(): "/" | "/403" | "/403/" | "/404" | "/404/" | "/500" | "/500/" | "/api" | "/api/" | "/api/account" | "/api/account/" | "/api/account/delete" | "/api/account/delete/" | "/api/admin" | "/api/admin/" | "/api/admin/delete-all-users" | "/api/admin/delete-all-users/" | "/api/admin/migrate-argon2" | "/api/admin/migrate-argon2/" | "/api/analytics" | "/api/analytics/" | "/api/analytics/session" | "/api/analytics/session/" | "/api/articles" | "/api/articles/" | "/api/articles/draft" | "/api/articles/draft/" | "/api/articles/save" | "/api/articles/save/" | "/api/articles/save/autosave" | "/api/articles/save/autosave/" | `/api/articles/${string}` & {} | `/api/articles/${string}/` & {} | `/api/articles/${string}/comments` & {} | `/api/articles/${string}/comments/` & {} | `/api/articles/${string}/hide` & {} | `/api/articles/${string}/hide/` & {} | `/api/articles/${string}/like` & {} | `/api/articles/${string}/like/` & {} | `/api/articles/${string}/react` & {} | `/api/articles/${string}/react/` & {} | `/api/articles/${string}/review` & {} | `/api/articles/${string}/review/` & {} | `/api/articles/${string}/save` & {} | `/api/articles/${string}/save/` & {} | `/api/articles/${string}/status` & {} | `/api/articles/${string}/status/` & {} | `/api/articles/${string}/versions` & {} | `/api/articles/${string}/versions/` & {} | "/api/auth" | "/api/auth/" | "/api/auth/mnemonic-question" | "/api/auth/mnemonic-question/" | "/api/auth/session" | "/api/auth/session/" | "/api/auth/verify-mnemonic" | "/api/auth/verify-mnemonic/" | "/api/auth/verify-password" | "/api/auth/verify-password/" | "/api/comments" | "/api/comments/" | "/api/comments/user-reactions" | "/api/comments/user-reactions/" | `/api/comments/${string}` & {} | `/api/comments/${string}/` & {} | `/api/comments/${string}/edit` & {} | `/api/comments/${string}/edit/` & {} | `/api/comments/${string}/hide` & {} | `/api/comments/${string}/hide/` & {} | `/api/comments/${string}/react` & {} | `/api/comments/${string}/react/` & {} | `/api/comments/${string}/report` & {} | `/api/comments/${string}/report/` & {} | "/api/drafts" | "/api/drafts/" | `/api/drafts/${string}` & {} | `/api/drafts/${string}/` & {} | "/api/events" | "/api/events/" | "/api/message" | "/api/message/" | "/api/moderation" | "/api/moderation/" | "/api/moderation/actions" | "/api/moderation/actions/" | "/api/moderation/articles" | "/api/moderation/articles/" | "/api/moderation/ban" | "/api/moderation/ban/" | "/api/moderation/delete" | "/api/moderation/delete/" | "/api/moderation/hide" | "/api/moderation/hide/" | "/api/moderation/logs" | "/api/moderation/logs/" | "/api/moderation/pending-articles" | "/api/moderation/pending-articles/" | "/api/moderation/reports" | "/api/moderation/reports/" | "/api/moderation/role" | "/api/moderation/role/" | "/api/moderation/show-user" | "/api/moderation/show-user/" | "/api/moderation/stats" | "/api/moderation/stats/" | "/api/notifications" | "/api/notifications/" | "/api/payment" | "/api/payment/" | "/api/profile" | "/api/profile/" | "/api/profile/update" | "/api/profile/update/" | "/api/profile/upload-avatar" | "/api/profile/upload-avatar/" | "/api/profile/upload" | "/api/profile/upload/" | "/api/reports" | "/api/reports/" | `/api/reports/${string}` & {} | `/api/reports/${string}/` & {} | `/api/reports/${string}/resolve` & {} | `/api/reports/${string}/resolve/` & {} | `/api/reports/${string}/status` & {} | `/api/reports/${string}/status/` & {} | "/api/upload" | "/api/upload/" | "/api/users" | "/api/users/" | `/api/users/${string}` & {} | `/api/users/${string}/` & {} | `/api/users/${string}/block` & {} | `/api/users/${string}/block/` & {} | `/api/users/${string}/follow` & {} | `/api/users/${string}/follow/` & {} | "/articles" | "/articles/" | "/article" | "/article/" | `/article/${string}` & {} | `/article/${string}/` & {} | "/corpus" | "/corpus/" | "/dashboard-01" | "/dashboard-01/" | "/data-library" | "/data-library/" | "/donate" | "/donate/" | "/donations" | "/donations/" | "/donation" | "/donation/" | "/giris" | "/giris/" | "/help" | "/help/" | "/kayit" | "/kayit/" | "/lexicon" | "/lexicon/" | "/login" | "/login/" | "/logout" | "/logout/" | "/moderation" | "/moderation/" | "/register" | "/register/" | "/sidebar-13" | "/sidebar-13/" | "/test-button" | "/test-button/" | "/write" | "/write/" | `/${string}` & {} | `/${string}/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/robots.txt" | "/sounds/NavigationGenericManeuver_Haptic.caf" | "/sounds/NavigationGenericManeuver_Haptic.m4a" | "/sounds/NavigationLeftTurn_Haptic.caf" | "/sounds/NavigationLeftTurn_Haptic.m4a" | "/sounds/NavigationRightTurn_Haptic.caf" | "/sounds/NavigationRightTurn_Haptic.m4a" | "/sounds/OnOffPasscodeUnlock_Haptic.caf" | "/sounds/OnOffPasscodeUnlock_Haptic.m4a" | "/sounds/ReceivedMessage.m4a" | "/sounds/SentMessage.m4a" | "/sounds/alert_error-01.wav" | "/sounds/alert_error-02.wav" | "/sounds/alert_error-03.wav" | "/sounds/focus_change_large.m4a" | "/sounds/lock.caf" | "/sounds/lock.m4a" | "/sounds/navigation-cancel.wav" | "/sounds/navigation_backward-selection-minimal.wav" | "/sounds/navigation_backward-selection.wav" | "/sounds/navigation_forward-selection-minimal.wav" | "/sounds/navigation_forward-selection.wav" | "/sounds/navigation_selection-complete-celebration.wav" | "/sounds/navigation_transition-left.wav" | "/sounds/navigation_transition-right.wav" | "/sounds/navigation_unavailable-selection.wav" | "/sounds/navigationpop.wav" | "/sounds/navigationpush.wav" | "/sounds/new-mail.caf" | "/sounds/new-mail.m4a" | "/sounds/notification_ambient.wav" | "/sounds/notification_decorative-01.wav" | "/sounds/notification_decorative-02.wav" | "/sounds/notification_high-intensity.wav" | "/sounds/notification_simple-01.wav" | "/sounds/notification_simple-02.wav" | "/sounds/payment_failure.caf" | "/sounds/payment_failure.m4a" | "/sounds/payment_success.caf" | "/sounds/payment_success.m4a" | "/sounds/state-change_confirm-down.wav" | "/sounds/state-change_confirm-up.wav" | "/sounds/ui-sound-2-374229.mp3" | "/sounds/ui-sound-374228.mp3" | "/sounds/ui_camera-shutter.wav" | "/sounds/ui_loading.wav" | "/sounds/ui_lock.wav" | "/sounds/ui_refresh-feed.wav" | "/sounds/ui_tap-variant-01.wav" | "/sounds/ui_tap-variant-02.wav" | "/sounds/ui_tap-variant-03.wav" | "/sounds/ui_tap-variant-04.wav" | "/sounds/ui_unlock.wav" | "/sounds/ussd.caf" | "/sounds/ussd.m4a" | "/sounds/vc~ended.caf" | "/sounds/warsaw.m4a" | "/uploads/articles/579777ea-a08a-4a9f-bc7f-c01c299f9735/thumbnail/1772286220559-15fjixjb0af.jpg" | "/uploads/articles/6913407a35c609aa4551b3c0/thumbnail/1762869370324-4h9z75nymfb.png" | "/uploads/articles/6914f6b9b6f0a7e6a611d124/thumbnail/1762981561943-pcccrphgntq.png" | "/uploads/articles/691c64fd72d103065f9544cb/photos/1763468541109-e68tdksdcmu.jpg" | "/uploads/articles/691c64fd72d103065f9544cb/thumbnail/1763468617837-z18ou2mawg.jpg" | "/uploads/articles/6932bfa8706d473fab38c0bf/photos/1764933544815-po0ogj6y0p7.jpeg" | "/uploads/articles/75386533-5d81-48bc-aad3-f4d1ce7430af/photos/1772279247497-a25na5bvt4.svg" | "/uploads/articles/8192d283-8af1-4477-9b93-2b63939194e6/thumbnail/1772285755640-jr9w1t6gl9.jpg" | "/uploads/articles/a0c6b03c-d795-49a9-9e1e-d69699d581b2/thumbnail/1772285928819-7o1ob1e9mth.jpg" | "/uploads/articles/ecd4c90b-dc4d-491d-82ce-78e13b7e4c8f/photos/1772278648923-x27xwc4ddxs.png" | "/uploads/articles/ecd4c90b-dc4d-491d-82ce-78e13b7e4c8f/thumbnail/1772278732650-k6zuc57vy3q.jpg" | "/uploads/users/anxyte/avatars/1765723383228-8wqoxewoaj5.png" | "/uploads/users/austrian_nigger/avatars/1763486784802-i0tuo5ujaa8.jpg" | "/uploads/users/austrian_nigger/banners/1763500030337-yftkcy6yxr.png" | "/uploads/users/ilyas1/avatars/1763487345410-amtjz1892tb.jpg" | "/uploads/users/ilyas1/banners/1763488697108-324gtrepdse.jpg" | "/uploads/users/laf/thumbnails/1771803574081-ugvhsvar6yf.jpg" | "/uploads/users/laf/thumbnails/1771804774173-6x037e9bg65.jpg" | "/uploads/users/yankiyildirim1/avatars/1763480516527-s5xduc01w2.png" | "/uploads/users/yankiyildirim1/banners/1763480510594-uoywvb4ikte.png" | "/uploads/users/yavuz/avatars/1769964050785-n5aqygv7f1d.png" | "/uploads/users/yavuz/avatars/1769965692021-fj6l0jhvf6.png" | "/uploads/users/yavuz/banners/1769965697818-zifajv3wwpk.png" | "/uploads/users/yavuzilyass/avatars/1765450060893-32bej8f0atg.png" | "/uploads/users/yavuzlys/avatars/1763630879355-do8j0stz3d8.jpeg" | "/uploads/users/yavuzlys/banners/1767647660701-038bxbovhjps.jpeg" | string & {};
	}
}