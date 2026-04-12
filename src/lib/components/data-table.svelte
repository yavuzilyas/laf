<script lang="ts">
	import {
		getCoreRowModel,
		getFacetedRowModel,
		getFacetedUniqueValues,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		type ColumnDef,
		type ColumnFiltersState,
		type PaginationState,
		type Row,
		type RowSelectionState,
		type SortingState,
		type VisibilityState,
	} from "@tanstack/table-core";
	import type { Schema } from "./schemas.js";
	import type { Attachment } from "svelte/attachments";
	import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers";
	import { createSvelteTable } from "$lib/components/ui/data-table/data-table.svelte.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import {
		FlexRender,
		renderComponent,
		renderSnippet,
	} from "$lib/components/ui/data-table/index.js";
	  import { ClockIcon, TimerIcon, CircleXIcon, HelpCircleIcon } from "@lucide/svelte";
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	import LayoutColumnsIcon from "@tabler/icons-svelte/icons/layout-columns";
	import GripVerticalIcon from "@tabler/icons-svelte/icons/grip-vertical";
	import ChevronDownIcon from "@tabler/icons-svelte/icons/chevron-down";
	import PlusIcon from "@tabler/icons-svelte/icons/plus";
	import ChevronsLeftIcon from "@tabler/icons-svelte/icons/chevrons-left";
	import ChevronLeftIcon from "@tabler/icons-svelte/icons/chevron-left";
	import ChevronRightIcon from "@tabler/icons-svelte/icons/chevron-right";
	import ChevronsRightIcon from "@tabler/icons-svelte/icons/chevrons-right";
	import CircleCheckFilledIcon from "@tabler/icons-svelte/icons/circle-check-filled";
	import { BarSpinner } from "$lib/components/spell/bar-spinner";
  	import DotsVerticalIcon from "@tabler/icons-svelte/icons/dots-vertical";
	import UserPlusIcon from "@tabler/icons-svelte/icons/user-plus";
	import UserMinusIcon from "@tabler/icons-svelte/icons/user-minus";

	// @ts-ignore - Lucide icons
	import BanIcon from "@lucide/svelte/icons/ban";
	// @ts-ignore - Lucide icons
	import CheckCircleIcon from "@lucide/svelte/icons/check-circle";
	// @ts-ignore - Lucide icons
	import EyeIcon from "@lucide/svelte/icons/eye";
	// @ts-ignore - Lucide icons
	import EyeOffIcon from "@lucide/svelte/icons/eye-off";
	// @ts-ignore - Lucide icons
	import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
	// @ts-ignore - Lucide icons
	import Trash2Icon from "@lucide/svelte/icons/trash-2";
	import { toast } from "svelte-sonner";
	  import { t, getCurrentLocale } from '$lib/stores/i18n.svelte.js';

  // Locale-aware URL helper
  const currentLocale = $derived(getCurrentLocale() || 'tr');
  const l = (path: string) => `/${currentLocale}${path}`;
	import DataTableCheckbox from "./data-table-checkbox.svelte";
	import { DragDropProvider } from "@dnd-kit-svelte/svelte";
	import { move } from "@dnd-kit/helpers";
	import { useSortable } from "@dnd-kit-svelte/svelte/sortable";
	import PasswordVerificationPopup from "$lib/components/PasswordVerificationPopup.svelte";
	import { cn } from "$lib/utils.js";
	import { EdraEditor } from '$lib/components/edra/shadcn/index.js';

	// @ts-ignore - Lucide icons for donations
	import HeartIcon from "@lucide/svelte/icons/heart";
	import CheckIcon from "@lucide/svelte/icons/check";
	import XIcon from "@lucide/svelte/icons/x";
	// @ts-ignore - Lucide icons for contact messages
	import ArchiveIcon from "@lucide/svelte/icons/archive";
	// @ts-ignore - Lucide icons for contact messages
	import MessageSquareIcon from "@lucide/svelte/icons/message-square";

	type CurrentUser = {
		id: string;
		role?: string;
	};

	type PendingArticleRow = {
		id: string;
		title: string;
		author: string;
		authorId: string;
		authorRole?: string | null;
		status: string;
		category: string | null;
		tags: string[];
		defaultLanguage: string | null;
		language: string | null;
		createdAt: string | null;
		updatedAt: string | null;
		hidden: boolean;
		deletedAt: string | null;
		pendingStatus?: string | null;
		reviewedBy?: { id: string; username: string | null; nickname: string | null; name: string | null; surname: string | null; role: string | null } | null;
		reviewedAt?: string | null;
	};

	type ArticleRow = {
		id: string;
		title: string;
		author: string;
		authorId: string;
		authorRole?: string | null;
		status: "draft" | "published" | "pending" | "rejected" | "archived";
		category: string | null;
		tags: string[];
		defaultLanguage: string | null;
		language: string | null;
		createdAt: string | null;
		updatedAt: string | null;
		hidden: boolean;
		deletedAt: string | null;
		reviewedBy?: { id: string; username: string | null; nickname: string | null; name: string | null; surname: string | null; role: string | null } | null;
		reviewedAt?: string | null;
	};

	type CommentRow = {
		id: string;
		content: string;
		authorId: string;
		authorName: string | null;
		authorNickname: string | null;
		authorRole?: string | null;
		articleId: string;
		articleTitle: string | null;
		articleSlug: string | null;
		parentId: string | null;
		status: "active" | "hidden" | "deleted";
		hidden: boolean;
		deletedAt: string | null;
		createdAt: string | null;
		updatedAt: string | null;
		reviewedBy?: { id: string; username: string | null; nickname: string | null; name: string | null; surname: string | null; role: string | null } | null;
		reviewedAt?: string | null;
	};

	type ReportRow = {
		id: string;
		type: "profile" | "article" | "comment" | "error";
		target: {
			id: string;
			type: string;
			location?: string;
			nickname?: string;
			title?: string;
			content?: string;
			slug?: string;
			articleId?: string;
			articleSlug?: string;
			authorId?: string;
			status?: string;
			createdAt?: string;
		};
		reportIds?: string[];
		reporters?: { nickname?: string; username?: string; name?: string; surname?: string }[];
		reportCount: number;
		reporterCount: number;
		reasons: string[];
		firstReportedAt?: string;
		lastReportedAt?: string;
		status: "pending" | "reviewing" | "resolved" | "rejected";
		reviewedBy?: { id: string; nickname?: string; username?: string; name?: string; surname?: string; role?: string } | null;
		reviewedAt?: string | null;
	};

	type ContactMessageRow = {
		id: string;
		user_id: string;
		user_email?: string;
		user_nickname?: string;
		user_username?: string;
		name: string;
		subject: "general" | "feedback" | "collaboration" | "report" | "other";
		message: string;
		ip_address?: string;
		user_agent?: string;
		status: "pending" | "read" | "responded" | "archived";
		reviewed_by?: string | null;
		reviewed_at?: string | null;
		reviewedBy?: { id: string; username: string | null; nickname: string | null; name: string | null; surname: string | null; role: string | null } | null;
		response?: string;
		responded_by?: string | null;
		responded_at?: string | null;
		respondedBy?: { id: string; username: string | null; nickname: string | null; name: string | null; surname: string | null; role: string | null } | null;
		honeypot_filled: boolean;
		created_at: string;
		updated_at: string;
		updatedAt?: string | null;
	};

	let {
		data,
		pendingArticlesInitial = [],
		reportsInitial = [],
		banUser,
		unbanUser,
		hideUser,
		unhideUser,
		deleteUser,
		undoDeleteUser,
		currentUser,
		promoteToModerator,
		demoteToUser,
		approveDonation,
		rejectDonation,
	}: {
		data: Schema[];
		pendingArticlesInitial?: PendingArticleRow[];
		reportsInitial?: ReportRow[];
		banUser: (id: string) => void | Promise<void>;
		unbanUser: (id: string) => void | Promise<void>;
		hideUser: (id: string) => void | Promise<void>;
		unhideUser: (id: string) => void | Promise<void>;
		deleteUser: (id: string, options?: { skipConfirm?: boolean }) => void | Promise<void>;
		undoDeleteUser: (id: string) => void | Promise<void>;
		currentUser?: CurrentUser;
		promoteToModerator: (id: string) => void | Promise<void>;
		demoteToUser: (id: string) => void | Promise<void>;
		approveDonation?: (id: string) => void | Promise<void>;
		rejectDonation?: (id: string, reason?: string) => void | Promise<void>;
	} = $props();
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);
	let rowSelection = $state<RowSelectionState>({});
	let columnVisibility = $state<VisibilityState>({});
	let globalFilter = $state<string>("");
	let pendingArticles = $state<PendingArticleRow[]>(pendingArticlesInitial ?? []);
	let loadingPending = $state(false);
	let pendingInitialized = $state((pendingArticlesInitial?.length ?? 0) > 0);
	let reports = $state<ReportRow[]>(reportsInitial ?? []);
	let loadingReports = $state(false);
	let reportsInitialized = $state((reportsInitial?.length ?? 0) > 0);
	let selectedArticles = $state<Set<string>>(new Set());
	let showArticleBulkActions = $state(false);
	let pendingPagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let pendingSorting = $state<SortingState>([]);
	let pendingColumnFilters = $state<ColumnFiltersState>([]);
	let pendingRowSelection = $state<RowSelectionState>({});
	let pendingColumnVisibility = $state<VisibilityState>({});
	let pendingGlobalFilter = $state<string>("");
	let reportsPagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let reportsSorting = $state<SortingState>([]);
	let reportsColumnFilters = $state<ColumnFiltersState>([]);
	let reportsColumnVisibility = $state<VisibilityState>({});
	let reportsRowSelection = $state<RowSelectionState>({});
	let reportsGlobalFilter = $state<string>("");
	let reportsTypeFilter = $state<"all" | "profile" | "article" | "comment" | "error">("all");
	let showReportReasonsDialog = $state(false);
	let reportReasonsDialogText = $state<string[]>([]);
	let showCommentContentDialog = $state(false);
	let commentContentDialogContent = $state<any>(null);
	let commentContentDialogAuthor = $state<string>('');

	let donations = $state<any[]>([]);
	let loadingDonations = $state(false);
	let donationsInitialized = $state(false);
	let donationsPagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let donationsSorting = $state<SortingState>([]);
	let donationsColumnFilters = $state<ColumnFiltersState>([]);
	let donationsRowSelection = $state<RowSelectionState>({});
	let donationsColumnVisibility = $state<VisibilityState>({});
	let donationsGlobalFilter = $state<string>("");
	let donationsStatusFilter = $state<"pending" | "approved" | "rejected">("pending");

	// Donation message dialog state
	let showDonationMessageDialog = $state(false);
	let donationMessageDialogContent = $state<string>('');

	// Contact Messages reply dialog state
	let showContactReplyDialog = $state(false);
	let pendingReplyMessage = $state<ContactMessageRow | null>(null);
	let contactReplyText = $state("");
	let contactMessages = $state<ContactMessageRow[]>([]);
	let loadingContactMessages = $state(false);
	let contactMessagesInitialized = $state(false);
	let contactMessagesPagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let contactMessagesSorting = $state<SortingState>([]);
	let contactMessagesColumnFilters = $state<ColumnFiltersState>([]);
	let contactMessagesRowSelection = $state<RowSelectionState>({});
	let contactMessagesColumnVisibility = $state<VisibilityState>({});
	let contactMessagesGlobalFilter = $state<string>("");
	let contactMessagesStatusFilter = $state<"all" | "pending" | "read" | "responded" | "archived">("all");

	// Contact message content dialog state
	let showContactMessageDialog = $state(false);
	let contactMessageDialogContent = $state<string>('');
	let contactMessageDialogSender = $state<string>('');

	// Comments state
	let comments = $state<CommentRow[]>([]);
	let loadingComments = $state(false);
	let commentsInitialized = $state(false);
	let commentsPagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let commentsSorting = $state<SortingState>([]);
	let commentsColumnFilters = $state<ColumnFiltersState>([]);
	let commentsRowSelection = $state<RowSelectionState>({});
	let commentsColumnVisibility = $state<VisibilityState>({});
	let commentsGlobalFilter = $state<string>("");
	let commentsStatusFilter = $state<"all" | "active" | "hidden" | "deleted">("all");

	// Helper function to extract plain text from Edra JSON content
	function extractPlainTextFromEdra(content: string | null | undefined): string {
		if (!content) return '';
		try {
			const parsed = JSON.parse(content);
			if (parsed && typeof parsed === 'object') {
				// Extract text from Edra document structure
				let text = '';
				const extractText = (node: any): void => {
					if (!node) return;
					if (typeof node === 'string') {
						text += node + ' ';
					} else if (Array.isArray(node)) {
						node.forEach(extractText);
					} else if (typeof node === 'object') {
						// Check for common text properties in Edra
						if (node.text) extractText(node.text);
						if (node.content) extractText(node.content);
						if (node.children) extractText(node.children);
						if (node.value) extractText(node.value);
						// Check for type-specific nodes
						if (node.type === 'text' && node.value) {
							text += node.value + ' ';
						}
						// Recursively check all properties
						Object.values(node).forEach(extractText);
					}
				};
				extractText(parsed);
				return text.trim() || content;
			}
		} catch {
			// Not valid JSON, return as-is
		}
		return content;
	}

	// Comments bulk actions
	type CommentsBulkAction = "hide" | "unhide" | "delete";
	const commentsBulkActionOptions: { value: CommentsBulkAction; label: string }[] = [
		{ value: "hide", label: t('bulkHide') ?? 'Toplu Gizle' },
		{ value: "unhide", label: t('bulkUnhide') ?? 'Toplu Göster' },
		{ value: "delete", label: t('bulkDelete') ?? 'Toplu Sil' },
	];
	let selectedCommentsBulkAction = $state<CommentsBulkAction>("hide");
	let commentsBulkProcessing = $state(false);

	type ReportsBulkAction = "reviewing" | "resolved" | "rejected" | "delete";
	const reportsBulkActionOptions: { value: ReportsBulkAction; label: string }[] = [
		{ value: "reviewing", label: t('reviewing') ?? 'İnceleniyor' },
		{ value: "resolved", label: t('resolved') ?? 'Çözüldü' },
		{ value: "rejected", label: t('rejected') ?? 'Reddedildi' },
		{ value: "delete", label: t('delete') ?? 'Sil' },
	];
	let selectedReportsBulkAction = $state<ReportsBulkAction>("reviewing");
	let reportsBulkProcessing = $state(false);

	// Donation bulk actions
	type DonationBulkAction = "approve" | "reject" | "delete";
	const donationBulkActionOptions: { value: DonationBulkAction; label: string }[] = [
		{ value: "approve", label: "Toplu Onayla" },
		{ value: "reject", label: "Toplu Reddet" },
		{ value: "delete", label: "Toplu Sil" },
	];
	let selectedDonationBulkAction = $state<DonationBulkAction>("approve");
	let donationsBulkProcessing = $state(false);

	// Contact Messages bulk actions
	type ContactMessagesBulkAction = "read" | "responded" | "delete";
	const contactMessagesBulkActionOptions: { value: ContactMessagesBulkAction; label: string }[] = [
		{ value: "read", label: "Toplu Okundu İşaretle" },
		{ value: "delete", label: "Toplu Sil" },
	];
	let selectedContactMessagesBulkAction = $state<ContactMessagesBulkAction>("read");
	let contactMessagesBulkProcessing = $state(false);
	type PendingBulkAction = "approve" | "reject" | "delete" | "hide";
	const pendingBulkActionOptions: { value: PendingBulkAction; label: string }[] = [
		{ value: "approve", label: t('bulkApprove') ?? t('common.approve') },
		{ value: "reject", label: t('bulkReject') ?? t('common.reject') },
		{ value: "hide", label: t('bulkHide') ?? t('common.hide') },
		{ value: "delete", label: t('bulkDelete') ?? t('common.delete') },
	];
	let selectedPendingBulkAction = $state<PendingBulkAction>("approve");
	let pendingBulkProcessing = $state(false);
	let showRejectDialog = $state(false);
	let pendingRejectArticle = $state<PendingArticleRow | null>(null);
	let rejectReason = $state("");
	let articlesStatusFilter = $state<"all" | "pending" | "published" | "rejected" | "draft">("all");
	const articleStatusOptions = [
		{ value: "all", label: t('allStatuses') ?? t('common.all') ?? "Tümü" },
		{ value: "pending", label: t('pending') ?? t('pending') ?? "Beklemede" },
		{ value: "published", label: t('published') ?? t('common.published') ?? "Yayında" },
		{ value: "rejected", label: t('rejected') ?? t('common.rejected') ?? "Reddedildi" },
		{ value: "draft", label: t('draft') ?? t('common.draft') ?? "Taslak" },
	];

	const donationStatusOptions = [
		{ value: "pending", label: "Bekleyenler" },
		{ value: "approved", label: "Onaylananlar" },
		{ value: "rejected", label: "Reddedilenler" },
	];

	const contactMessageStatusOptions = [
		{ value: "all", label: "Tümü" },
		{ value: "pending", label: "Bekleyenler" },
		{ value: "read", label: "Okunanlar" },
		{ value: "responded", label: "Yanıtlananlar" },
		{ value: "archived", label: "Arşivlenenler" },
	];

	const protectedRoles = new Set(["admin", "moderator"]);
	const DELETION_GRACE_PERIOD_MS = 48 * 60 * 60 * 1000;
	const normalizeRole = (role?: string | null) => role?.toLowerCase?.() ?? "user";
	const isProtectedRole = (role?: string) => protectedRoles.has(normalizeRole(role));
	const currentRole = $derived(normalizeRole(currentUser?.role));
	const getRoleRank = (role?: string | null) => {
		const normalized = normalizeRole(role);
		if (normalized === "admin") {
			return 3;
		}
		if (normalized === "moderator") {
			return 2;
		}
		return 1;
	};
	const currentRoleRank = $derived(getRoleRank(currentRole));
	const canModifyRole = (role?: string, rowId?: string) => {
		const targetRole = normalizeRole(role);
		if (rowId && currentUser?.id && rowId === currentUser.id) {
			return false;
		}
		if (targetRole === "admin") {
			return false;
		}
		if (targetRole === "moderator") {
			return currentRole === "admin";
		}
		return currentRole === "admin" || currentRole === "moderator";
	};

	const canPromoteRole = (role?: string) => currentRole === "admin" && normalizeRole(role) === "user";
	const canDemoteRole = (role?: string) => currentRole === "admin" && normalizeRole(role) === "moderator";
	const canModerateAuthor = (role?: string | null) => currentRoleRank > getRoleRank(role);
	const canReview = $derived(currentRole === "admin" || currentRole === "moderator");
	const canManageContactMessages = $derived(currentRole === "admin" || currentRole === "moderator");

	async function requeueArticle(articleId: string) {
		try {
			const response = await fetch(`/api/articles/${articleId}/review`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'requeue' })
			});
			if (response.ok) {
				toast.success(t('articleRequeued') ?? 'Makale yeniden incelemeye alındı');
				await fetchPendingArticles(true);
			} else {
				const error = await response.json();
				toast.error(error.error || (t('requeueFailed') ?? 'Beklemeye alma başarısız'));
			}
		} catch (error) {
			
			toast.error(t('requeueFailed') ?? 'Beklemeye alma başarısız');
		}
	}

	async function applyReportGroupStatus(row: ReportRow, status: "reviewing" | "resolved" | "rejected") {
		const ids = row.reportIds ?? [];
		if (!ids.length) return;
		for (const id of ids) {
			await updateSingleReportStatus(id, status);
		}
		await fetchReports(true);
	}

	async function deleteReportGroup(row: ReportRow) {
		const ids = row.reportIds ?? [];
		if (!ids.length) return;
		for (const id of ids) {
			await deleteSingleReport(id);
		}
		await fetchReports(true);
	}

	async function performArticleModerationAction(action: 'hide' | 'unhide' | 'delete', articleId: string, reason?: string) {
		try {
			const response = await fetch('/api/moderation/actions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action,
					type: 'article',
					id: articleId,
					reason: reason ?? (action === 'delete' ? t('deleteReasonDefault') ?? 'Moderasyon tarafından silindi' : undefined)
				})
			});

			if (response.ok) {
				let message: string;
				if (action === 'delete') {
					message = t('articleDeleted') ?? 'Makale silindi';
				} else if (action === 'hide') {
					message = t('articleHidden') ?? 'Makale gizlendi';
				} else {
					message = t('articleUnhidden') ?? 'Makale görünür yapıldı';
				}
				toast.success(message);
				await fetchPendingArticles(true);
			} else {
				const error = await response.json();
				toast.error(error.error || (t('actionFailed')));
			}
		} catch (error) {
			
			toast.error(t('actionFailed'));
		}
	}

	async function performCommentModerationAction(action: 'hide' | 'unhide' | 'delete', commentId: string) {
		try {
			let response;
			if (action === 'delete') {
				// Permanent deletion using DELETE endpoint
				response = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
			} else {
				response = await fetch('/api/moderation/comments', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action, id: commentId })
				});
			}

			if (response.ok) {
				let message: string;
				if (action === 'delete') {
					message = 'Yorum silindi';
				} else if (action === 'hide') {
					message = 'Yorum gizlendi';
				} else {
					message = 'Yorum görünür yapıldı';
				}
				toast.success(message);
				await fetchComments(true);
			} else {
				const error = await response.json();
				toast.error(error.error || t('actionFailed'));
			}
		} catch (error) {
			toast.error(t('actionFailed'));
		}
	}

	const getDeletionDeadline = (timestamp?: string | null) => {
		if (!timestamp) return null;
		const start = new Date(timestamp).getTime();
		if (Number.isNaN(start)) return null;
		return start + DELETION_GRACE_PERIOD_MS;
	};

	const getDeletionRemainingLabel = (timestamp?: string | null) => {
		const deadline = getDeletionDeadline(timestamp);
		if (!deadline) return t('toBeDeleted');
		const diffMs = deadline - Date.now();
		if (diffMs <= 0) {
			return t('dataTable.deletionImminent');
		}
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		if (diffHours >= 1) {
			return t('dataTable.deletionHours', { count: diffHours });
		}
		const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
		return t('dataTable.deletionMinutes', { count: diffMinutes });
	};
	const formatDateTime = (value?: string | null) => {
		if (!value) return t('unknown');
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return t('unknown');
		return date.toLocaleDateString('tr-TR', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const reportsColumns: ColumnDef<ReportRow>[] = [
		{
			id: "drag",
			header: () => null,
			cell: () => renderSnippet(DragHandle),
		},
		{
			id: "select",
			header: ({ table }) =>
				renderComponent(DataTableCheckbox, {
					checked: table.getIsAllPageRowsSelected(),
					indeterminate:
						table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
					onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
					"aria-label": t('selectAll'),
				}),
			cell: ({ row }) =>
				renderComponent(DataTableCheckbox, {
					checked: row.getIsSelected(),
					onCheckedChange: (value) => row.toggleSelected(!!value),
					"aria-label": t('selectRow'),
				}),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "type",
			header: t('type') ?? "Tip",
			cell: ({ row }) => {
				const kind = row.original?.type;
				if (kind === 'profile') return t('user') ?? 'Kullanıcı';
				if (kind === 'article') return t('articles') ?? t('article') ?? 'Makale';
				if (kind === 'comment') return t('comment') ?? 'Yorum';
				if (kind === 'error') return t('error') ?? 'Hata';
				return t('unknown');
			}
		},
		{
			id: "target",
			header: t('target') ?? "Hedef",
			cell: ({ row }) => {
				const target = row.original?.target;
				if (!target) return t('unknown');
				let href = '#';
				let label = t('unknown');
				if (row.original.type === 'profile') {
					label = target.nickname ?? t('unknown');
					href = target.nickname ? `/${target.nickname}` : '/profile';
				}
				if (row.original.type === 'article') {
					label = target.title ?? t('unknown');
					href = target.slug ? `/article/${target.slug}` : '#';
				}
				if (row.original.type === 'comment') {
					label = t('Comment');
					href = target.url || (target.articleSlug ? `/article/${target.articleSlug}#comment-${target.id}` : '#');
				}
				if (row.original.type === 'error') {
					label = target.location ?? (t('error') ?? 'Hata');
					href = '#';
				}
				return renderSnippet(ReportTargetLink, { href, label });
			}
		},
		{
			id: "reporters",
			header: t('Reporters') ?? 'Bildiren',
			cell: ({ row }) => {
				const reporters = row.original?.reporters ?? [];
				if (!reporters.length) return '-';
				const names = reporters
					.map((r) => r.username || r.id)
					.filter(Boolean);
				return names.slice(0, 2).join(', ') + (names.length > 2 ? '…' : '');
			}
		},
		{
			accessorKey: "reportCount",
			header: t('reports') ?? t('reports') ?? "Rapor",
		},
		{
			id: "reasons",
			header: t('reason') ?? "Neden",
			cell: ({ row }) => {
				const reasons = row.original?.reasons ?? [];
				if (!reasons.length) return "-";
				const label = reasons[0] ?? "";
				return renderSnippet(ReportReasonCell, { label, reasons });
			}
		},
		{
			id: "lastReportedAt",
			header: t('updated') ?? "Son",
			cell: ({ row }) => formatDateTime(row.original?.lastReportedAt ?? null),
		},
		{
			id: "reviewedBy",
			header: t('reviewer') ?? 'İlgilenen',
			cell: ({ row }) => {
				const reviewer = row.original?.reviewedBy;
				if (!reviewer) return '-';
				return reviewer.username || reviewer.id;
			}
		},
		{
			accessorKey: "status",
			header: t('status'),
			cell: ({ row }) => {
				const status = row.original?.status;
				const reviewedBy = row.original?.reviewedBy;
				const lastActionBy = reviewedBy ? (reviewedBy.nickname || reviewedBy.username || reviewedBy.name || reviewedBy.id) : null;
				return renderSnippet(UniversalStatusBadge, {
					status,
					type: "report",
					lastActionBy,
					lastActionAt: row.original?.reviewedAt,
					lastActionType: 'İnceleyen'
				});
			}
		},
		{
			id: "actions",
			enableSorting: false,
			enableHiding: false,
			cell: ({ row }) => renderSnippet(ReportsRowActions, { row }),
		},
	];

	const reportsTable = createSvelteTable({
		get data() {
			return reportsTypeFilter === 'all'
				? reports
				: reports.filter((r) => r.type === reportsTypeFilter);
		},
		columns: reportsColumns,
		state: {
			get pagination() {
				return reportsPagination;
			},
			get sorting() {
				return reportsSorting;
			},
			get columnVisibility() {
				return reportsColumnVisibility;
			},
			get columnFilters() {
				return reportsColumnFilters;
			},
			get rowSelection() {
				return reportsRowSelection;
			},
			get globalFilter() {
				return reportsGlobalFilter;
			},
		},
		getRowId: (row) => row.id?.toString?.() ?? crypto.randomUUID(),
		enableRowSelection: true,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: (updater) => {
			reportsPagination = typeof updater === "function" ? updater(reportsPagination) : updater;
		},
		onSortingChange: (updater) => {
			reportsSorting = typeof updater === "function" ? updater(reportsSorting) : updater;
		},
		onColumnFiltersChange: (updater) => {
			reportsColumnFilters =
				typeof updater === "function" ? updater(reportsColumnFilters) : updater;
		},
		onGlobalFilterChange: (updater) => {
			reportsGlobalFilter =
				typeof updater === "function" ? updater(reportsGlobalFilter) : updater;
		},
		onColumnVisibilityChange: (updater) => {
			reportsColumnVisibility =
				typeof updater === "function" ? updater(reportsColumnVisibility) : updater;
		},
		onRowSelectionChange: (updater) => {
			reportsRowSelection =
				typeof updater === "function" ? updater(reportsRowSelection) : updater;
		},
	});

	// Donation columns definition
	const donationsColumns: ColumnDef<any>[] = [
		{
			id: "drag",
			header: () => null,
			cell: () => renderSnippet(DragHandle),
		},
		{
			id: "select",
			header: ({ table }) =>
				renderComponent(DataTableCheckbox, {
					checked: table.getIsAllPageRowsSelected(),
					indeterminate:
						table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
					onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
					"aria-label": t('selectAll'),
				}),
			cell: ({ row }) =>
				renderComponent(DataTableCheckbox, {
					checked: row.getIsSelected(),
					onCheckedChange: (value) => row.toggleSelected(!!value),
					"aria-label": t('selectRow'),
				}),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "donor_username",
			header: "Bağışçı",
			cell: ({ row }) => {
				const donation = row.original;
				return renderSnippet(DonationDonorCell, { donation });
			},
		},
		{
			accessorKey: "amount",
			header: "Tutar (XMR)",
			cell: ({ row }) => {
				const amount = row.original?.amount;
				return renderSnippet(DonationAmountCell, { amount });
			},
		},
		{
			accessorKey: "txid",
			header: "TXID",
			cell: ({ row }) => {
				const txid = row.original?.txid;
				return renderSnippet(DonationTxidCell, { txid });
			},
		},
		{
			accessorKey: "donation_date",
			header: "Tarih",
			cell: ({ row }) => formatDateTime(row.original?.donation_date),
		},
		{
			accessorKey: "message",
			header: "Mesaj",
			cell: ({ row }) => {
				const message = row.original?.message;
				return renderSnippet(DonationMessageCell, { message });
			},
		},
		{
			accessorKey: "status",
			header: "Durum",
			cell: ({ row }) => {
				const status = row.original?.status;
				const lastActionAt = row.original?.updatedAt ?? row.original?.donation_date;
				return renderSnippet(UniversalStatusBadge, {
					status,
					type: "donation",
					lastActionAt,
					lastActionType: 'Son güncelleme'
				});
			},
		},
		{
			id: "actions",
			enableSorting: false,
			enableHiding: false,
			cell: ({ row }) => renderSnippet(DonationActions, { row }),
		},
	];

	const donationsTable = createSvelteTable({
		get data() {
			return donations || [];
		},
		columns: donationsColumns,
		state: {
			get pagination() {
				return donationsPagination;
			},
			get sorting() {
				return donationsSorting;
			},
			get columnVisibility() {
				return donationsColumnVisibility;
			},
			get columnFilters() {
				return donationsColumnFilters;
			},
			get rowSelection() {
				return donationsRowSelection;
			},
			get globalFilter() {
				return donationsGlobalFilter;
			},
		},
		getRowId: (row) => row.id?.toString?.() ?? crypto.randomUUID(),
		enableRowSelection: true,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: (updater) => {
			donationsPagination = typeof updater === "function" ? updater(donationsPagination) : updater;
		},
		onSortingChange: (updater) => {
			donationsSorting = typeof updater === "function" ? updater(donationsSorting) : updater;
		},
		onColumnFiltersChange: (updater) => {
			donationsColumnFilters =
				typeof updater === "function" ? updater(donationsColumnFilters) : updater;
		},
		onGlobalFilterChange: (updater) => {
			donationsGlobalFilter =
				typeof updater === "function" ? updater(donationsGlobalFilter) : updater;
		},
		onColumnVisibilityChange: (updater) => {
			donationsColumnVisibility =
				typeof updater === "function" ? updater(donationsColumnVisibility) : updater;
		},
		onRowSelectionChange: (updater) => {
			donationsRowSelection =
				typeof updater === "function" ? updater(donationsRowSelection) : updater;
		},
	});

	// Contact Messages columns definition
	const contactMessagesColumns: ColumnDef<ContactMessageRow>[] = [
		{
			id: "drag",
			header: () => null,
			cell: () => renderSnippet(DragHandle),
		},
		{
			id: "select",
			header: ({ table }) =>
				renderComponent(DataTableCheckbox, {
					checked: table.getIsAllPageRowsSelected(),
					indeterminate:
						table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
					onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
					"aria-label": t('selectAll'),
				}),
			cell: ({ row }) =>
				renderComponent(DataTableCheckbox, {
					checked: row.getIsSelected(),
					onCheckedChange: (value) => row.toggleSelected(!!value),
					"aria-label": t('selectRow'),
				}),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "name",
			header: "İsim",
			cell: ({ row }) => row.original?.name || '-',
		},
		{
			accessorKey: "user_nickname",
			header: "Kullanıcı",
			cell: ({ row }) => {
				const nickname = row.original?.user_nickname;
				const username = row.original?.user_username;
				return nickname || username || '-';
			},
		},
		{
			accessorKey: "subject",
			header: "Konu",
			cell: ({ row }) => {
				const subject = row.original?.subject;
				const subjectLabels: Record<string, string> = {
					general: 'Genel Bilgi',
					feedback: 'Geri Bildirim',
					collaboration: 'İşbirliği',
					report: 'Bildirim',
					other: 'Diğer'
				};
				return subjectLabels[subject] || subject || '-';
			},
		},
		{
			accessorKey: "message",
			header: "Mesaj",
			cell: ({ row }) => {
				const message = row.original?.message;
				if (!message) return '-';
				const sender = row.original?.name || row.original?.user_nickname || row.original?.user_username || 'Unknown';
				return renderSnippet(ContactMessageCell, { message, sender });
			},
		},
		{
			accessorKey: "created_at",
			header: "Tarih",
			cell: ({ row }) => formatDateTime(row.original?.created_at),
		},
		{
			accessorKey: "status",
			header: "Durum",
			cell: ({ row }) => {
				const status = row.original?.status;
				const statusLower = status?.toLowerCase();
				// For responded status, show responder info; for read/archived status, show reviewer info
				const respondedBy = row.original?.respondedBy;
				const reviewedBy = row.original?.reviewedBy;
				const lastActionBy = statusLower === 'responded'
					? (respondedBy?.nickname || respondedBy?.username || respondedBy?.name)
					: statusLower === 'read' || statusLower === 'archived'
						? (reviewedBy?.nickname || reviewedBy?.username || reviewedBy?.name)
						: null;
				const lastActionAt = statusLower === 'responded'
					? row.original?.responded_at
					: statusLower === 'read' || statusLower === 'archived'
						? row.original?.reviewed_at
						: row.original?.updated_at;
				const lastActionType = statusLower === 'responded' ? 'Yanıtlayan' : statusLower === 'read' ? 'Okuyan' : 'Son güncelleme';
				return renderSnippet(UniversalStatusBadge, {
					status,
					type: "contact",
					lastActionBy,
					lastActionAt,
					lastActionType
				});
			},
		},
		{
			id: "actions",
			enableSorting: false,
			enableHiding: false,
			cell: ({ row }) => renderSnippet(ContactMessageActions, { row }),
		},
	];

	const contactMessagesTable = createSvelteTable({
		get data() {
			return contactMessagesStatusFilter === 'all'
				? contactMessages
				: contactMessages.filter((m) => m.status === contactMessagesStatusFilter);
		},
		columns: contactMessagesColumns,
		state: {
			get pagination() {
				return contactMessagesPagination;
			},
			get sorting() {
				return contactMessagesSorting;
			},
			get columnVisibility() {
				return contactMessagesColumnVisibility;
			},
			get columnFilters() {
				return contactMessagesColumnFilters;
			},
			get rowSelection() {
				return contactMessagesRowSelection;
			},
			get globalFilter() {
				return contactMessagesGlobalFilter;
			},
		},
		getRowId: (row) => row.id?.toString?.() ?? crypto.randomUUID(),
		enableRowSelection: true,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: (updater) => {
			contactMessagesPagination = typeof updater === "function" ? updater(contactMessagesPagination) : updater;
		},
		onSortingChange: (updater) => {
			contactMessagesSorting = typeof updater === "function" ? updater(contactMessagesSorting) : updater;
		},
		onColumnFiltersChange: (updater) => {
			contactMessagesColumnFilters =
				typeof updater === "function" ? updater(contactMessagesColumnFilters) : updater;
		},
		onGlobalFilterChange: (updater) => {
			contactMessagesGlobalFilter =
				typeof updater === "function" ? updater(contactMessagesGlobalFilter) : updater;
		},
		onColumnVisibilityChange: (updater) => {
			contactMessagesColumnVisibility =
				typeof updater === "function" ? updater(contactMessagesColumnVisibility) : updater;
		},
		onRowSelectionChange: (updater) => {
			contactMessagesRowSelection =
				typeof updater === "function" ? updater(contactMessagesRowSelection) : updater;
		},
	});

	// Comments columns definition
	const commentsStatusOptions = [
		{ value: "all", label: t('allStatuses') ?? t('common.all') ?? "Tümü" },
		{ value: "active", label: t('active') ?? "Aktif" },
		{ value: "hidden", label: t('hidden') ?? "Gizli" },
		{ value: "deleted", label: t('deleted') ?? "Silinmiş" },
	];

	const commentsColumns: ColumnDef<CommentRow>[] = [
		{
			id: "drag",
			header: () => null,
			cell: () => renderSnippet(DragHandle),
		},
		{
			id: "select",
			header: ({ table }) =>
				renderComponent(DataTableCheckbox, {
					checked: table.getIsAllPageRowsSelected(),
					indeterminate:
						table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
					onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
					"aria-label": t('selectAll'),
				}),
			cell: ({ row }) =>
				renderComponent(DataTableCheckbox, {
					checked: row.getIsSelected(),
					onCheckedChange: (value) => row.toggleSelected(!!value),
					"aria-label": t('selectRow'),
				}),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "content",
			header: t('comment') ?? 'Yorum',
			cell: ({ row }) => {
				const content = row.original?.content;
				const author = row.original?.authorName || row.original?.authorNickname || row.original?.authorId || '';
				if (!content) return '-';
				return renderSnippet(CommentContentCell, { content, author });
			},
		},
		{
			accessorKey: "author",
			header: t('author') ?? 'Yazar',
			cell: ({ row }) => row.original?.authorName || row.original?.authorNickname || row.original?.authorId || t('unknown'),
		},
		{
			accessorKey: "articleTitle",
			header: t('article') ?? 'Makale',
			cell: ({ row }) => {
				const title = row.original?.articleTitle;
				const slug = row.original?.articleSlug;
				if (!title) return '-';
				if (slug) {
					return renderSnippet(CommentArticleLink, { title, slug });
				}
				return title; 
			},
		},
		{
			accessorKey: "createdAt",
			header: t('date') ?? 'Tarih',
			cell: ({ row }) => formatDateTime(row.original?.createdAt),
		},
		{
			accessorKey: "status",
			header: t('status'),
			cell: ({ row }) => {
				const status = row.original?.status;
				const reviewedBy = row.original?.reviewedBy;
				const lastActionBy = reviewedBy ? (reviewedBy.nickname || reviewedBy.username || reviewedBy.name) : null;
				const lastActionAt = reviewedBy ? row.original?.reviewedAt : row.original?.updatedAt;
				return renderSnippet(UniversalStatusBadge, {
					status,
					type: "comment",
					lastActionBy,
					lastActionAt,
					lastActionType: lastActionBy ? 'İşlem yapan' : 'Son güncelleme'
				});
			},
		},
		{
			id: "actions",
			enableSorting: false,
			enableHiding: false,
			cell: ({ row }) => renderSnippet(CommentActions, { row }),
		},
	];

	const commentsTable = createSvelteTable({
		get data() {
			return commentsStatusFilter === 'all'
				? comments
				: comments.filter((c) => c.status === commentsStatusFilter);
		},
		columns: commentsColumns,
		state: {
			get pagination() {
				return commentsPagination;
			},
			get sorting() {
				return commentsSorting;
			},
			get columnVisibility() {
				return commentsColumnVisibility;
			},
			get columnFilters() {
				return commentsColumnFilters;
			},
			get rowSelection() {
				return commentsRowSelection;
			},
			get globalFilter() {
				return commentsGlobalFilter;
			},
		},
		getRowId: (row) => row.id?.toString?.() ?? crypto.randomUUID(),
		enableRowSelection: true,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: (updater) => {
			commentsPagination = typeof updater === "function" ? updater(commentsPagination) : updater;
		},
		onSortingChange: (updater) => {
			commentsSorting = typeof updater === "function" ? updater(commentsSorting) : updater;
		},
		onColumnFiltersChange: (updater) => {
			commentsColumnFilters = typeof updater === "function" ? updater(commentsColumnFilters) : updater;
		},
		onGlobalFilterChange: (updater) => {
			commentsGlobalFilter = typeof updater === "function" ? updater(commentsGlobalFilter) : updater;
		},
		onColumnVisibilityChange: (updater) => {
			commentsColumnVisibility = typeof updater === "function" ? updater(commentsColumnVisibility) : updater;
		},
		onRowSelectionChange: (updater) => {
			commentsRowSelection = typeof updater === "function" ? updater(commentsRowSelection) : updater;
		},
	});

	function openReportReasonsDialog(reasons: string[]) {
		reportReasonsDialogText = reasons;
		showReportReasonsDialog = true;
	}

	function openCommentContentDialog(content: any, author: string) {
		commentContentDialogContent = content;
		commentContentDialogAuthor = author;
		showCommentContentDialog = true;
	}

	function openDonationMessageDialog(message: string) {
		donationMessageDialogContent = message;
		showDonationMessageDialog = true;
	}

	function openContactMessageDialog(message: string, sender: string) {
		contactMessageDialogContent = message;
		contactMessageDialogSender = sender;
		showContactMessageDialog = true;
	}

	async function updateSingleReportStatus(reportId: string, status: "reviewing" | "resolved" | "rejected") {
		const response = await fetch(`/api/reports/${reportId}/status`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status })
		});
		if (!response.ok) {
			throw new Error('Failed to update report status');
		}
	}

	async function deleteSingleReport(reportId: string) {
		const response = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
		if (!response.ok) {
			throw new Error('Failed to delete report');
		}
	}

	async function handleReportsBulkAction() {
		const selected = reportsTable.getSelectedRowModel().rows;
		if (!selected.length) {
			toast.warning(t('selectRow') ?? 'Seçim yapın');
			return;
		}
		reportsBulkProcessing = true;
		try {
			for (const row of selected) {
				const ids = row.original.reportIds ?? [];
				if (!ids.length) continue;
				for (const id of ids) {
					if (selectedReportsBulkAction === 'delete') {
						await deleteSingleReport(id);
					} else {
						await updateSingleReportStatus(id, selectedReportsBulkAction);
					}
				}
			}
			reportsTable.resetRowSelection();
			await fetchReports(true);
			toast.success(t('success'));
		} catch (error) {
			
			toast.error(t('error'));
		} finally {
			reportsBulkProcessing = false;
		}
	}

	async function handlePendingBulkAction() {
		const selected = pendingTable.getSelectedRowModel().rows;
		if (!selected.length) {
			toast.warning(t('selectRow') ?? 'Seçim yapın');
			return;
		}
		pendingBulkProcessing = true;
		try {
			for (const row of selected) {
				const articleId = row.original.id;
				if (selectedPendingBulkAction === 'approve') {
					await approveArticle(articleId);
				} else if (selectedPendingBulkAction === 'reject') {
					await rejectArticle(articleId, defaultRejectReason);
				} else if (selectedPendingBulkAction === 'hide') {
					await performArticleModerationAction('hide', articleId);
				} else if (selectedPendingBulkAction === 'delete') {
					await performArticleModerationAction('delete', articleId);
				}
			}
			pendingTable.resetRowSelection();
			await fetchPendingArticles(true);
			toast.success(t('success'));
		} catch (error) {
			
			toast.error(t('error'));
		} finally {
			pendingBulkProcessing = false;
		}
	}

	async function handleDonationsBulkAction() {
		const selection = getDonationActionableRows();
		if (!selection.length) {
			toast.warning('Lütfen bağış seçin');
			return;
		}
		donationsBulkProcessing = true;
		try {
			for (const row of selection) {
				const donationId = row.original.id;
				if (selectedDonationBulkAction === 'approve') {
					await handleApproveDonation(donationId);
				} else if (selectedDonationBulkAction === 'reject') {
					const reason = prompt('Toplu red nedeni (isteğe bağlı):');
					if (reason !== null) {
						await handleRejectDonation(donationId, reason || undefined);
					}
				} else if (selectedDonationBulkAction === 'delete') {
					await handleDeleteDonation(donationId);
				}
			}
			donationsTable.resetRowSelection();
			toast.success('Toplu işlem başarıyla tamamlandı');
		} catch (error) {
			
			toast.error('Toplu işlem başarısız');
		} finally {
			donationsBulkProcessing = false;
		}
	}

	async function handleCommentsBulkAction() {
		const selected = commentsTable.getSelectedRowModel().rows;
		if (!selected.length) {
			toast.warning(t('selectRow') ?? 'Seçim yapın');
			return;
		}
		commentsBulkProcessing = true;
		try {
			for (const row of selected) {
				const commentId = row.original.id;
				if (selectedCommentsBulkAction === 'hide') {
					await performCommentModerationAction('hide', commentId);
				} else if (selectedCommentsBulkAction === 'unhide') {
					await performCommentModerationAction('unhide', commentId);
				} else if (selectedCommentsBulkAction === 'delete') {
					await performCommentModerationAction('delete', commentId);
				}
			}
			commentsTable.resetRowSelection();
			await fetchComments(true);
			toast.success(t('success') ?? 'İşlem başarılı');
		} catch (error) {
			toast.error(t('error') ?? 'İşlem başarısız');
		} finally {
			commentsBulkProcessing = false;
		}
	}

	async function handleContactMessagesBulkAction() {
		const selection = getContactMessagesActionableRows();
		if (!selection.length) {
			toast.warning('Lütfen mesaj seçin');
			return;
		}
		contactMessagesBulkProcessing = true;
		try {
			for (const row of selection) {
				const messageId = row.original.id;
				if (selectedContactMessagesBulkAction === 'read') {
					await handleUpdateContactMessageStatus(messageId, 'read');
				} else if (selectedContactMessagesBulkAction === 'delete') {
					await performDeleteContactMessage(messageId);
				}
			}
			contactMessagesTable.resetRowSelection();
			contactMessagesInitialized = false;
			if (view === 'contact-messages') {
				void fetchContactMessages(true, contactMessagesStatusFilter);
			}
			toast.success('Toplu işlem başarıyla tamamlandı');
		} catch (error) {
			toast.error('Toplu işlem başarısız');
		} finally {
			contactMessagesBulkProcessing = false;
		}
	}

	type BulkAction = "ban" | "unban" | "hide" | "unhide" | "delete" | "undoDelete";
	const bulkActionOptions: { value: BulkAction; label: string }[] = [
		{ value: "ban", label: t('bulkBan') },
		{ value: "unban", label: t('bulkUnban') },
		{ value: "hide", label: t('bulkHide') },
		{ value: "unhide", label: t('bulkUnhide') },
		{ value: "delete", label: t('bulkDelete') },
		{ value: "undoDelete", label: t('bulkUndoDelete') },
	];
	let selectedBulkAction = $state<BulkAction>("ban");
	let bulkProcessing = $state(false);
	let showPasswordVerification = $state(false);
	let pendingAction = $state<(() => void | Promise<void>) | null>(null);

	function requestPasswordVerification(action: () => void | Promise<void>) {
		pendingAction = action;
		showPasswordVerification = true;
	}

	async function handleMnemonicVerified() {
		const action = pendingAction;
		showPasswordVerification = false;
		pendingAction = null;
		if (action) {
			try {
				await action();
			} catch (error) {
				
				toast.error('İşlem sırasında bir hata oluştu');
			}
		}
	}

	function handleMnemonicCancel() {
		showPasswordVerification = false;
		pendingAction = null;
	}

	async function createEventFromReport(report: ReportRow) {
		
		try {
			const response = await fetch('/api/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'moderation',
					targetId: report.id,
					targetType: report.type,
					title: `Moderasyon olayı: ${report.type}`,
					description: `Raporlanan içerik: ${report.target?.title || report.target?.username || 'Bilinmeyen'}`,
					metadata: {
						reportIds: report.reportIds,
						reportCount: report.reportCount,
						reasons: report.reasons
					}
				})
			});

			if (response.ok) {
				toast.success('Olay başarıyla oluşturuldu');
			} else {
				const error = await response.json().catch(() => ({}));
				toast.error(error.error || 'Olay oluşturulamadı');
			}
		} catch (error) {
			
			toast.error('Olay oluşturulurken hata oluştu');
		}
	}

	async function viewEventHistory(report: ReportRow) {
		try {
			const response = await fetch(`/api/events?targetId=${report.id}&targetType=${report.type}`);
			
			if (response.ok) {
				const events = await response.json();
				// Here you could open a modal or navigate to an events page
				
				toast.success(`${events.length} olay bulundu`);
			} else {
				toast.error('Olay geçmişi alınamadı');
			}
		} catch (error) {
			
			toast.error('Olay geçmişi alınırken hata oluştu');
		}
	}

	async function createUserEvent(user: any) {
		try {
			const response = await fetch('/api/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'user',
					targetId: user.id,
					targetType: 'user',
					title: `Kullanıcı olayı: ${user.username || user.email}`,
					description: `Kullanıcı: ${user.name || ''} ${user.surname || ''} (${user.email})`,
					metadata: {
						userId: user.id,
						username: user.username,
						email: user.email,
						status: user.status,
						banned: user.banned,
						hidden: user.hidden
					}
				})
			});

			if (response.ok) {
				toast.success('Kullanıcı olayı başarıyla oluşturuldu');
			} else {
				toast.error('Kullanıcı olayı oluşturulamadı');
			}
		} catch (error) {
			
			toast.error('Kullanıcı olayı oluşturulurken hata oluştu');
		}
	}

	async function viewUserEventHistory(userId: string) {
		try {
			const response = await fetch(`/api/events?targetId=${userId}&targetType=user`);
			
			if (response.ok) {
				const events = await response.json();
				
				toast.success(`${events.length} kullanıcı olayı bulundu`);
			} else {
				toast.error('Kullanıcı olay geçmişi alınamadı');
			}
		} catch (error) {
			
			toast.error('Kullanıcı olay geçmişi alınırken hata oluştu');
		}
	}

	const columns: ColumnDef<Schema>[] = [
		{
			id: "drag",
			header: () => null,
			cell: () => renderSnippet(DragHandle),
		},
		{
			id: "select",
			header: ({ table }) => {
				const hasSelectableRows = table.getRowModel().rows.some((row) => row.getCanSelect());
				if (!hasSelectableRows) {
					return null;
				}
				return renderComponent(DataTableCheckbox, {
					checked: table.getIsAllPageRowsSelected(),
					indeterminate:
						table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
					onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
					"aria-label": t('selectAll'),
				});
			},
			cell: ({ row }) =>
				row.getCanSelect()
					? renderComponent(DataTableCheckbox, {
						checked: row.getIsSelected(),
						onCheckedChange: (value) => row.toggleSelected(!!value),
						"aria-label": t('selectRow'),
					})
					: null,
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "nickname",
			header: t('nickname'),
			cell: ({ row }) => {
				if (!row.original) return "-";
				const user = row.original;
				const nickname = user.nickname || user.email?.split('@')[0] || t('unknown');
				if (user.nickname) {
					return renderSnippet(NicknameLinkCell, { nickname: user.nickname });
				}
				return nickname;
			},
		},
		{
			accessorKey: "type",
			header: t('role'),
			cell: ({ row }) => {
				if (!row.original) return t('unknown');
				const role = row.original.type;
					if (role === "admin") return t('admin');
					if (role === "moderator") return t('moderator');
					return t('user');
			},
		},
		{
			accessorKey: "email",
			header: t('email'),
			cell: ({ row }) => {
				if (!row.original) return t('unknown');
				const user = row.original;
				const email = user.email;
				if (!email) return t('unknown');
				return renderSnippet(EmailLinkCell, { email });
			},
		},
		{
			accessorKey: "phone_number",
			header: t('phone') ?? 'Telefon',
			cell: ({ row }) => {
				if (!row.original) return t('unknown');
				const user = row.original;
				const phone = user.phone_number;
				if (!phone) return t('unknown');
				return renderSnippet(PhoneLinkCell, { phone });
			},
		},
		{
			accessorKey: "location",
			header: t('location') ?? 'Lokasyon',
			cell: ({ row }) => {
				if (!row.original) return t('unknown');
				const user = row.original;
				return user.location || t('unknown');
			},
		},
		{
			accessorKey: "limit",
			header: t('openingDate'),
			cell: ({ row }) => row.original?.limit || t('unknown'),
		},
		{
			accessorKey: "status",
			header: t('status'),
			cell: ({ row }) => {
				if (!row.original) {
					return renderSnippet(UniversalStatusBadge, { status: null, type: "user" });
				}
				const status = row.original.status;
				if (status === "silinecek") {
					const countdownLabel = getDeletionRemainingLabel(row.original.deletionTimestamp);
					return renderSnippet(DeletionBadge, { countdownLabel });
				}
				// Check for moderation action info
				const moderationAction = row.original?.moderation_action;
				const lastActionBy = moderationAction?.moderatorName || null;
				const lastActionAt = moderationAction?.timestamp || row.original?.updatedAt;
				const lastActionType = lastActionBy ? 'İşlem yapan' : 'Son güncelleme';
				return renderSnippet(UniversalStatusBadge, {
					status,
					type: "user",
					lastActionBy,
					lastActionAt,
					lastActionType
				});
			},
		},
		{
			id: "actions",
			cell: ({ row }) => renderSnippet(DataTableActions, { row }),
		},
	];

	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		state: {
			get pagination() {
				return pagination;
			},
			get sorting() {
				return sorting;
			},
			get columnVisibility() {
				return columnVisibility;
			},
			get rowSelection() {
				return rowSelection;
			},
			get columnFilters() {
				return columnFilters;
			},
			get globalFilter() {
				return globalFilter;
			},
		},
		getRowId: (row) => row.id.toString(),
		enableRowSelection: (row) =>
			canModifyRole(row.original.type, row.id?.toString?.()),
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getFilteredRowModel: getFilteredRowModel(),
		globalFilterFn: (row, columnId, filterValue) => {
			const searchValue = String(filterValue).toLowerCase();
			const searchableFields = [
				row.original.nickname,
				row.original.email,
				row.original.phone_number,
				row.original.location,
				row.original.name,
				row.original.surname
			];
			return searchableFields.some(field => 
				field && String(field).toLowerCase().includes(searchValue)
			);
		},
		onPaginationChange: (updater) => {
			if (typeof updater === "function") {
				pagination = updater(pagination);
			} else {
				pagination = updater;
			}
		},
		onSortingChange: (updater) => {
			if (typeof updater === "function") {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
		},
		onColumnFiltersChange: (updater) => {
			if (typeof updater === "function") {
				columnFilters = updater(columnFilters);
			} else {
				columnFilters = updater;
			}
		},
		onGlobalFilterChange: (updater) => {
			if (typeof updater === "function") {
				globalFilter = updater(globalFilter);
			} else {
				globalFilter = updater;
			}
		},
		onColumnVisibilityChange: (updater) => {
			if (typeof updater === "function") {
				columnVisibility = updater(columnVisibility);
			} else {
				columnVisibility = updater;
			}
		},
		onRowSelectionChange: (updater) => {
			if (typeof updater === "function") {
				rowSelection = updater(rowSelection);
			} else {
				rowSelection = updater;
			}
		},
	});

	const pendingColumns: ColumnDef<PendingArticleRow>[] = [
		{
			id: "drag",
			header: () => null,
			cell: () => renderSnippet(DragHandle),
			enableHiding: false,
			enableSorting: false,
		},
		{
			id: "select",
			header: ({ table }) =>
				renderComponent(DataTableCheckbox, {
					checked: table.getIsAllPageRowsSelected(),
					indeterminate:
						table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
					onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
					"aria-label": t('selectAll'),
				}),
			cell: ({ row }) =>
				renderComponent(DataTableCheckbox, {
					checked: row.getIsSelected(),
					onCheckedChange: (value) => row.toggleSelected(!!value),
					"aria-label": t('selectRow'),
				}),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "title",
			header: t('articleTitle') ?? t('pendingTitle'),
			cell: ({ row }) => renderSnippet(PendingArticleTitle, { row }),
		},
		{
			accessorKey: "author",
			header: t('author') ?? t('pendingAuthor'),
			cell: ({ row }) => row.original?.authorName || row.original?.authorId || t('unknown'),
		},
		{
			accessorKey: "category",
			header: t('category'),
		},
		{
			accessorKey: "language",
			header: t('language') ?? 'Dil',
			cell: ({ row }) => row.original?.language?.toUpperCase?.() ?? t('unknown'),
		},
		{
			accessorKey: "submittedAt",
			header: t('submitted'),
			cell: ({ row }) => formatDateTime(row.original?.submittedAt),
		},
		{
			accessorKey: "status",
			header: t('status'),
			cell: ({ row }) => {
				const article = row.original;
				const status = article?.hidden ? 'hidden' : article?.status;
				const reviewedBy = article?.reviewedBy;
				const lastActionBy = reviewedBy ? (reviewedBy.nickname || reviewedBy.username || reviewedBy.name) : null;
				const lastActionAt = reviewedBy ? article?.reviewedAt : article?.updatedAt;
				return renderSnippet(UniversalStatusBadge, {
					status,
					type: "article",
					lastActionBy,
					lastActionAt,
					lastActionType: lastActionBy ? 'İşlem yapan' : 'Son güncelleme'
				});
			},
		},
		{
			id: "actions",
			cell: ({ row }) => renderSnippet(PendingArticleActions, { row }),
			enableHiding: false,
		},
	];

	const pendingTable = createSvelteTable({
		get data() {
			return pendingArticles;
		},
		columns: pendingColumns,
		state: {
			get pagination() {
				return pendingPagination;
			},
			get sorting() {
				return pendingSorting;
			},
			get columnVisibility() {
				return pendingColumnVisibility;
			},
			get rowSelection() {
				return pendingRowSelection;
			},
			get columnFilters() {
				return pendingColumnFilters;
			},
			get globalFilter() {
				return pendingGlobalFilter;
			},
		},
		getRowId: (row) => row.id?.toString?.() ?? crypto.randomUUID(),
		enableRowSelection: true,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: (updater) => {
			pendingPagination = typeof updater === "function" ? updater(pendingPagination) : updater;
		},
		onSortingChange: (updater) => {
			pendingSorting = typeof updater === "function" ? updater(pendingSorting) : updater;
		},
		onColumnFiltersChange: (updater) => {
			pendingColumnFilters = typeof updater === "function" ? updater(pendingColumnFilters) : updater;
		},
		onGlobalFilterChange: (updater) => {
			pendingGlobalFilter = typeof updater === "function" ? updater(pendingGlobalFilter) : updater;
		},
		onColumnVisibilityChange: (updater) => {
			pendingColumnVisibility =
				typeof updater === "function" ? updater(pendingColumnVisibility) : updater;
		},
		onRowSelectionChange: (updater) => {
			pendingRowSelection =
				typeof updater === "function" ? updater(pendingRowSelection) : updater;
		},
	});

	let views = [
		{
			id: "kullanicilar",
			label: t('users'),
			badge: 0,
		},
		{
			id: "pending-articles",
			label: t('articles') ?? 'Makaleler',
			badge: 0,
		},
		{
			id: "comments",
			label: t('comments') ?? 'Yorumlar',
			badge: 0,
		},
		{
			id: "reports",
			label: t('reports') ?? t('reports') ?? "Raporlar",
			badge: 0,
		},
		{
			id: "bagislar",
			label: "Bağışlar",
			badge: 0,
		},
		{
			id: "contact-messages",
			label: "İletişim Mesajları",
			badge: 0,
		}
	];

	let view = $state(views[0].id);

	async function fetchReports(force = false) {
		if (loadingReports) return;
		if (!force && reportsInitialized) return;
		loadingReports = true;
		try {
			const response = await fetch('/api/moderation/reports');
			if (response.ok) {
				const result = await response.json();
				reports = (result?.data?.all ?? []) as ReportRow[];
				reportsInitialized = true;
				const reportsTab = views.find((v) => v.id === 'reports');
				if (reportsTab) {
					reportsTab.badge = reports.length;
				}
			}
		} catch (error) {
			
			toast.error(t('error'));
		} finally {
			loadingReports = false;
		}
	}

	async function fetchDonations(force = false, status?: "all" | "pending" | "approved" | "rejected") {
		if (loadingDonations) return;
		if (!force && donationsInitialized) return;
		loadingDonations = true;
		try {
			const query = status && status !== 'all' ? `?status=${status}` : '';
			const response = await fetch(`/api/donations/moderate${query}`);
			if (response.ok) {
				const data = await response.json();
				donations = data.donations || [];
				donationsInitialized = true;
				const donationsTab = views.find((v) => v.id === 'bagislar');
				if (donationsTab) {
					donationsTab.badge = donations.filter((d) => d.status === 'pending').length;
				}
			}
		} catch (error) {
			
			toast.error(t('error'));
		} finally {
			loadingDonations = false;
		}
	}

	async function fetchContactMessages(force = false, status?: "all" | "pending" | "read" | "responded" | "archived") {
		if (!canManageContactMessages) return;
		if (loadingContactMessages) return;
		if (!force && contactMessagesInitialized) return;
		loadingContactMessages = true;
		try {
			const query = status && status !== 'all' ? `?status=${status}` : '';
			const response = await fetch(`/api/contact-messages${query}`);
			if (response.ok) {
				const data = await response.json();
				contactMessages = data.messages || [];
				contactMessagesInitialized = true;
				const contactTab = views.find((v) => v.id === 'contact-messages');
				if (contactTab) {
					contactTab.badge = contactMessages.filter((m) => m.status === 'pending').length;
				}
			}
		} catch (error) {
			
			toast.error(t('error'));
		} finally {
			loadingContactMessages = false;
		}
	}

	async function fetchComments(force = false, status?: "all" | "active" | "hidden" | "deleted") {
		if (loadingComments) return;
		if (!force && commentsInitialized) return;
		loadingComments = true;
		try {
			const query = status && status !== 'all' ? `?status=${status}` : '';
			const response = await fetch(`/api/moderation/comments${query}`);
			if (response.ok) {
				const result = await response.json();
				comments = result.comments?.map((comment: any) => ({
					id: comment.id ?? crypto.randomUUID(),
					content: comment.content || '',
					authorId: comment.authorId ?? null,
					authorName: comment.authorName ?? null,
					authorNickname: comment.authorNickname ?? null,
					authorRole: comment.authorRole ?? null,
					articleId: comment.articleId ?? null,
					articleTitle: comment.articleTitle ?? null,
					articleSlug: comment.articleSlug ?? null,
					parentId: comment.parentId ?? null,
					status: comment.status || 'active',
					hidden: comment.hidden ?? false,
					deletedAt: comment.deletedAt ?? null,
					createdAt: comment.createdAt ?? null,
					updatedAt: comment.updatedAt ?? null,
					reviewedBy: comment.reviewedBy ?? null,
					reviewedAt: comment.reviewedAt ?? null,
				})) ?? [];
				commentsInitialized = true;
				const commentsTab = views.find((v) => v.id === 'comments');
				if (commentsTab) {
					commentsTab.badge = comments.filter((c) => c.status === 'active').length;
				}
			}
		} catch (error) {
			
			toast.error(t('error'));
		} finally {
			loadingComments = false;
		}
	}

	const defaultRejectReason = t('defaultRejectReason') ?? 'İçerik yönergelere uygun değil';
	let lastArticlesFilter = $state<string>(articlesStatusFilter);

	async function fetchPendingArticles(force = false) {
		if (loadingPending) return;
		const filter = articlesStatusFilter;
		if (!force && pendingInitialized && lastArticlesFilter === filter) {
			return;
		}
		loadingPending = true;
		try {
			const query = filter === 'all' ? '' : `?status=${filter}`;
			const response = await fetch(`/api/moderation/articles${query}`);
			if (response.ok) {
				const result = await response.json();
				pendingArticles =
					result.articles?.map((article: any) => ({
						id: article.id ?? crypto.randomUUID(),
						title:
							article.title ||
							article.translations?.[article.defaultLanguage ?? ""]?.title ||
							t('unknown'),
						author:
							article.authorNickname ||
							article.authorName ||
							article.authorId ||
							t('unknown'),
						authorNickname: article.authorNickname ?? null,
						authorName: article.authorName ?? null,
						authorId: article.authorId ?? null,
						authorRole: article.authorRole ?? null,
						category: article.category || t('unknown'),
						status: article.status || 'pending',
						submittedAt: article.createdAt ?? null,
						createdAt: article.createdAt ?? null,
						updatedAt: article.updatedAt ?? null,
						language: article.defaultLanguage || '-',
						tags: article.tags || [],
						slug: article.slug || article.translations?.[article.defaultLanguage ?? ""]?.slug || null,
						hidden: article.hidden ?? false,
						deletedAt: article.deletedAt ?? null,
						reviewedBy: article.reviewedBy ?? null,
						reviewedAt: article.reviewedAt ?? null,
					})) ?? [];
				// Update the badge count
				const pendingTab = views.find(v => v.id === 'pending-articles');
				if (pendingTab) {
					pendingTab.badge = pendingArticles.filter((article) => article.status === 'pending').length;
				}
				lastArticlesFilter = filter;
				pendingInitialized = true;
			}
		} catch (error) {
			
			toast.error(t('fetchPendingError'));
		} finally {
			loadingPending = false;
		}
	}

	$effect(() => {
		const currentView = view;
		if (currentView === 'pending-articles') {
			void fetchPendingArticles();
		}
		if (currentView === 'comments') {
			void fetchComments();
		}
		if (currentView === 'reports') {
			void fetchReports();
		}
		if (currentView === 'bagislar') {
			void fetchDonations(false, donationsStatusFilter);
		}
		if (currentView === 'contact-messages') {
			void fetchContactMessages(false, contactMessagesStatusFilter);
		}
	});

	let lastDonationsStatusFilter = donationsStatusFilter;
	$effect(() => {
		if (view === 'bagislar' && donationsStatusFilter !== lastDonationsStatusFilter) {
			void fetchDonations(true, donationsStatusFilter);
			lastDonationsStatusFilter = donationsStatusFilter;
		}
	});

	function handleTabChange(event: CustomEvent<{ value: string }>) {
		const nextView = event.detail?.value;
		if (nextView === 'pending-articles') {
			void fetchPendingArticles(true);
		}
		if (nextView === 'comments') {
			void fetchComments(true);
		}
		if (nextView === 'reports') {
			void fetchReports(true);
		}
		if (nextView === 'bagislar') {
			void fetchDonations(true, donationsStatusFilter);
		}
		if (nextView === 'contact-messages') {
			void fetchContactMessages(true, contactMessagesStatusFilter);
		}
	}

	let lastCommentsStatusFilter = commentsStatusFilter;
	$effect(() => {
		if (view === 'comments' && commentsStatusFilter !== lastCommentsStatusFilter) {
			void fetchComments(true, commentsStatusFilter);
			lastCommentsStatusFilter = commentsStatusFilter;
		}
	});

	let lastContactMessagesStatusFilter = contactMessagesStatusFilter;
	$effect(() => {
		if (view === 'contact-messages' && contactMessagesStatusFilter !== lastContactMessagesStatusFilter) {
			void fetchContactMessages(true, contactMessagesStatusFilter);
			lastContactMessagesStatusFilter = contactMessagesStatusFilter;
		}
	});

	function openRejectDialog(article: PendingArticleRow) {
		pendingRejectArticle = article;
		rejectReason = "";
		showRejectDialog = true;
	}

	function handleRejectDialogOpenChange(open: boolean) {
		showRejectDialog = open;
		if (!open) {
			pendingRejectArticle = null;
			rejectReason = "";
		}
	}

	function confirmRejectDialog() {
		if (!pendingRejectArticle) return;
		const targetArticleId = pendingRejectArticle.id;
		const reasonText = rejectReason.trim() || defaultRejectReason;
		showRejectDialog = false;
		requestPasswordVerification(() => rejectArticle(targetArticleId, reasonText));
	}

	async function approveArticle(articleId: string) {
		try {
			const response = await fetch(`/api/articles/${articleId}/review`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'approve' })
			});

			if (response.ok) {
				toast.success(t('articleApproved'));
				await fetchPendingArticles(true);
			} else {
				const error = await response.json();
				toast.error(error.error || t('approveFailed'));
			}
		} catch (error) {
			
			toast.error(t('approveFailed'));
		}
	}

	async function rejectArticle(articleId: string, reason?: string) {
		try {
			const response = await fetch(`/api/articles/${articleId}/review`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					action: 'reject',
					reason: reason?.trim() || defaultRejectReason
				})
			});

			if (response.ok) {
				toast.success(t('articleRejected'));
				await fetchPendingArticles(true);
			} else {
				const error = await response.json();
				toast.error(error.error || t('rejectFailed'));
			}
		} catch (error) {
			
			toast.error(t('rejectFailed'));
		}
	}

	async function handleApproveDonation(donationId: string) {
		if (approveDonation) {
			await approveDonation(donationId);
			// İşlem sonrası tabloyu yenile
			donationsInitialized = false;
			if (view === 'bagislar') {
				void fetchDonations(true, donationsStatusFilter);
			}
		} else {
			// Fallback: Direct API call with toast
			try {
				const response = await fetch('/api/donations/moderate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'approve',
						donationId
					})
				});

				if (response.ok) {
					toast.success('Bağış onaylandı');
					donationsInitialized = false;
					if (view === 'bagislar') {
						void fetchDonations(true, donationsStatusFilter);
					}
				} else {
					const error = await response.json();
					toast.error(error.error || 'Onay başarısız');
				}
			} catch (error) {
				toast.error('İşlem hatası');
			}
		}
	}

	async function handleRejectDonation(donationId: string, reason?: string) {
		if (rejectDonation) {
			await rejectDonation(donationId, reason);
			// İşlem sonrası tabloyu yenile
			donationsInitialized = false;
			if (view === 'bagislar') {
				void fetchDonations(true, donationsStatusFilter);
			}
		} else {
			// Fallback: Direct API call with toast
			try {
				const response = await fetch('/api/donations/moderate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'reject',
						donationId,
						rejectionReason: reason
					})
				});

				if (response.ok) {
					toast.success('Bağış reddedildi');
					donationsInitialized = false;
					if (view === 'bagislar') {
						void fetchDonations(true, donationsStatusFilter);
					}
				} else {
					const error = await response.json();
					toast.error(error.error || 'Red işlemi başarısız');
				}
			} catch (error) {
				toast.error('İşlem hatası');
			}
		}
	}

	async function handleDeleteDonation(donationId: string) {
		if (confirm('Bu bağışı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
			try {
				const response = await fetch(`/api/donations/${donationId}`, { method: 'DELETE' });
				if (response.ok) {
					toast.success('Bağış başarıyla silindi');
					// Silme işlemi sonrası tab'ı yenile - donationsInitialized'ı sıfırla
					donationsInitialized = false;
					if (view === 'bagislar') {
						void fetchDonations(true, donationsStatusFilter);
					}
				} else {
					const error = await response.json();
					toast.error(error.error || 'Bağış silinemedi');
				}
			} catch (error) {
				
				toast.error('Bağış silinirken hata oluştu');
			}
		}
	}

	async function handleUpdateContactMessageStatus(messageId: string, status: "pending" | "read" | "responded" | "archived") {
		try {
			const response = await fetch(`/api/contact-messages/${messageId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status })
			});
			if (response.ok) {
				toast.success('Mesaj durumu güncellendi');
				contactMessagesInitialized = false;
				if (view === 'contact-messages') {
					void fetchContactMessages(true, contactMessagesStatusFilter);
				}
			} else {
				const error = await response.json();
				toast.error(error.error || 'Güncelleme başarısız');
			}
		} catch (error) {
			
			toast.error('İşlem sırasında hata oluştu');
		}
	}

	function openContactReplyDialog(message: ContactMessageRow) {
		pendingReplyMessage = message;
		contactReplyText = "";
		showContactReplyDialog = true;
	}

	function handleContactReplyDialogOpenChange(open: boolean) {
		showContactReplyDialog = open;
		if (!open) {
			pendingReplyMessage = null;
			contactReplyText = "";
		}
	}

	async function confirmContactReplyDialog() {
		if (!pendingReplyMessage) return;
		const targetMessageId = pendingReplyMessage.id;
		const replyText = contactReplyText.trim();
		if (replyText === '') {
			toast.error('Yanıt mesajı boş olamaz');
			return;
		}
		showContactReplyDialog = false;
		await handleSendContactReply(targetMessageId, replyText);
	}

	async function handleSendContactReply(messageId: string, response: string) {
		try {
			const res = await fetch(`/api/contact-messages/${messageId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'responded', response })
			});
			if (res.ok) {
				toast.success('Yanıt gönderildi');
				contactMessagesInitialized = false;
				if (view === 'contact-messages') {
					void fetchContactMessages(true, contactMessagesStatusFilter);
				}
			} else {
				const error = await res.json();
				toast.error(error.error || 'Yanıt gönderilemedi');
			}
		} catch (error) {
			toast.error('İşlem sırasında hata oluştu');
		}
	}

	// Contact Messages delete dialog state
	let showContactDeleteDialog = $state(false);
	let pendingDeleteContactMessage = $state<ContactMessageRow | null>(null);

	function openContactDeleteDialog(message: ContactMessageRow) {
		pendingDeleteContactMessage = message;
		showContactDeleteDialog = true;
	}

	function handleContactDeleteDialogOpenChange(open: boolean) {
		showContactDeleteDialog = open;
		if (!open) {
			pendingDeleteContactMessage = null;
		}
	}

	async function confirmContactDeleteDialog() {
		if (!pendingDeleteContactMessage) return;
		const messageId = pendingDeleteContactMessage.id;
		showContactDeleteDialog = false;
		pendingDeleteContactMessage = null;
		await performDeleteContactMessage(messageId);
	}

	async function performDeleteContactMessage(messageId: string) {
		try {
			const response = await fetch(`/api/contact-messages/${messageId}`, { method: 'DELETE' });
			if (response.ok) {
				toast.success('Mesaj silindi');
				contactMessagesInitialized = false;
				if (view === 'contact-messages') {
					void fetchContactMessages(true, contactMessagesStatusFilter);
				}
			} else {
				const error = await response.json();
				toast.error(error.error || 'Silme başarısız');
			}
		} catch (error) {
			toast.error('İşlem sırasında hata oluştu');
		}
	}

	async function handleDeleteContactMessage(messageId: string) {
		openContactDeleteDialog(contactMessages.find(m => m.id === messageId)!);
	}

	// Comments bulk selection logic
	const getCommentsActionableRows = () =>
		commentsTable
			.getSelectedRowModel()
			.rows.filter(
				(row) =>
					row.getCanSelect()
				);
	const commentsActionableSelectionCount = $derived(getCommentsActionableRows().length);
	const hasCommentsBulkSelection = $derived(commentsActionableSelectionCount > 0);
	const hasCommentsBulkCapableRows = $derived(
		() => commentsTable.getRowModel().rows.some((row) => row.getCanSelect())
	);

	// Contact Messages bulk selection logic
	const getContactMessagesActionableRows = () =>
		contactMessagesTable
			.getSelectedRowModel()
			.rows.filter(
				(row) =>
					row.getCanSelect()
				);
	const contactMessagesActionableSelectionCount = $derived(getContactMessagesActionableRows().length);
	const hasContactMessagesBulkSelection = $derived(contactMessagesActionableSelectionCount > 0);
	const hasContactMessagesBulkCapableRows = $derived(
		() => contactMessagesTable.getRowModel().rows.some((row) => row.getCanSelect())
	);

	let viewLabel = $derived(views.find((v) => view === v.id)?.label ?? t('selectView'));
	const getActionableRows = () =>
		table
			.getSelectedRowModel()
			.rows.filter(
				(row) =>
					row.getCanSelect() && canModifyRole(row.original.type, row.original.id.toString())
			);
	const actionableSelectionCount = $derived(getActionableRows().length);
	const hasBulkSelection = $derived(actionableSelectionCount > 0);
	const hasBulkCapableRows = $derived(
		() => table.getRowModel().rows.some((row) => row.getCanSelect())
	);

	// Donation bulk selection logic
	const getDonationActionableRows = () =>
		donationsTable
			.getSelectedRowModel()
			.rows.filter(
				(row) =>
					row.getCanSelect()
			);
	const donationActionableSelectionCount = $derived(getDonationActionableRows().length);
	const hasDonationBulkSelection = $derived(donationActionableSelectionCount > 0);
	const hasDonationBulkCapableRows = $derived(
		() => donationsTable.getRowModel().rows.some((row) => row.getCanSelect())
	);

	async function handleBulkAction() {
		const selection = getActionableRows();
		if (!selection.length) {
			toast.warning(t('selectUser'));
			return;
		}

		const handlers: Record<BulkAction, (id: string) => Promise<void> | void> = {
			ban: (id) => banUser(id),
			unban: (id) => unbanUser(id),
			hide: (id) => hideUser(id),
			unhide: (id) => unhideUser(id),
			delete: (id) => deleteUser(id, { skipConfirm: true }),
			undoDelete: (id) => undoDeleteUser(id),
		};

		bulkProcessing = true;
		let hasError = false;
		for (const row of selection) {
			try {
				await handlers[selectedBulkAction](String(row.original.id));
			} catch (error) {
				
				hasError = true;
				break;
			}
		}
		bulkProcessing = false;
		table.resetRowSelection();
		if (hasError) {
			toast.error(t('error'));
			return;
		}
		toast.success(t('success'));
	}
</script>
<Tabs.Root bind:value={view} class="w-full flex-col justify-start gap-6" onchange={handleTabChange}>
	<div class="flex items-center justify-between px-4 lg:px-6">
		<Label for="view-selector" class="sr-only">{t('view')}</Label>

		<ScrollArea orientation="horizontal" class="flex gap-3 overflow-auto px-2 sm:px-4 lg:px-6">
				<Tabs.List
					class="**:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 flex"
				>
					{#each views as view (view.id)}
						<Tabs.Trigger value={view.id}>
							{view.label}
							{#if view.badge > 0}
								<Badge variant="secondary">{view.badge}</Badge>
							{/if}
						</Tabs.Trigger>
					{/each}
				</Tabs.List>

		</ScrollArea>
		
	</div>
	<Tabs.Content value="pending-articles" class="relative flex flex-col gap-4 overflow-auto px-2 sm:px-4 lg:px-6">
		<div class="overflow-x-scroll rounded-lg border">
			<div class="flex flex-col gap-3 p-2 sm:flex-row sm:items-center sm:justify-between sm:p-4">
				<Input
					placeholder={t('search')}
					class="h-9 w-full sm:max-w-sm text-sm sm:text-base"
					value={pendingTable.getState().globalFilter ?? ''}
					oninput={(e) => pendingTable.setGlobalFilter(e.currentTarget.value)}
				/>
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
					<Select.Root type="single" bind:value={articlesStatusFilter}>
						<Select.Trigger size="sm" class="w-full min-w-[10rem] justify-between ">
							{articleStatusOptions.find((opt) => opt.value === articlesStatusFilter)?.label}
						</Select.Trigger>
						<Select.Content>
							{#each articleStatusOptions as option (option.value)}
								<Select.Item value={option.value}>{option.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<div class="flex flex-wrap items-center gap-2">
						<Select.Root type="single" bind:value={selectedPendingBulkAction}>
							<Select.Trigger size="sm" class="w-48 min-w-40 justify-between">
								{pendingBulkActionOptions.find((opt) => opt.value === selectedPendingBulkAction)?.label}
							</Select.Trigger>
							<Select.Content>
								{#each pendingBulkActionOptions as option (option.value)}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						<Button
							size="sm"
							variant="secondary"
							onclick={() => requestPasswordVerification(handlePendingBulkAction)}
							disabled={pendingTable.getSelectedRowModel().rows.length === 0 || pendingBulkProcessing}
						>
							{#if pendingBulkProcessing}
            <BarSpinner class="text-primary" />
								{t('processing')}
							{:else}
								{t('bulkApply')}
							{/if}
						</Button>
					</div>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" size="sm" {...props}>
								<LayoutColumnsIcon />
								<span class="hidden lg:inline">{t('customizeColumns')}</span>
								<span class="lg:hidden">{t('columns')}</span>
								<ChevronDownIcon />
							</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-56">
							{#each pendingTable
								.getAllColumns()
								.filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide()) as column (column.id)}
								<DropdownMenu.CheckboxItem
									class="capitalize"
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(!!value)}
								>
									{column.id}
								</DropdownMenu.CheckboxItem>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</div>
			{#if loadingPending}
				<div class="flex items-center justify-center p-8">
            <BarSpinner class="text-primary" />					
				</div>
			{:else}
				<DragDropProvider
					modifiers={[
						// @ts-expect-error @dnd-kit/abstract types are botched atm
						RestrictToVerticalAxis,
					]}
					onDragEnd={(e) => (pendingArticles = move(pendingArticles, e))}
				>
					<Table.Root>
						<Table.Header class="bg-muted sticky top-0 z-10">
							{#each pendingTable.getHeaderGroups() as headerGroup (headerGroup.id)}
								<Table.Row>
									{#each headerGroup.headers as header (header.id)}
										<Table.Head colspan={header.colSpan}>
											{#if !header.isPlaceholder}
												<FlexRender
													content={header.column.columnDef.header}
													context={header.getContext()}
												/>
											{/if}
										</Table.Head>
									{/each}
								</Table.Row>
							{/each}
						</Table.Header>
						<Table.Body class="**:data-[slot=table-cell]:first:w-8">
							{#if pendingTable.getRowModel().rows?.length}
								{#each pendingTable.getRowModel().rows as row, index (row.id)}
									{@render PendingDraggableRow({ row, index })}
								{/each}
							{:else}
								<Table.Row>
									<Table.Cell colspan={pendingColumns.length} class="h-24 text-center">
										{t('noPendingArticles')}
									</Table.Cell>
								</Table.Row>
							{/if}
						</Table.Body>
					</Table.Root>
				</DragDropProvider>
			{/if}
		</div>
		<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-2 sm:px-4 py-2">
			<div class="text-muted-foreground text-xs sm:text-sm">
				{t('rowsSelected', { selected: pendingTable.getFilteredSelectedRowModel().rows.length, total: pendingTable.getFilteredRowModel().rows.length })}
			</div>
			<div class="flex w-full items-center justify-between gap-2 sm:gap-4 lg:w-fit">
				<div class="hidden items-center gap-2 lg:flex">
					<Label for="pending-rows-per-page" class="text-sm font-medium">{t('rowsPerPage')}</Label>
					<Select.Root
						type="single"
						bind:value={
							() => `${pendingTable.getState().pagination.pageSize}`,
							(v) => pendingTable.setPageSize(Number(v))
						}
					>
						<Select.Trigger size="sm" class="w-20" id="pending-rows-per-page">
							{pendingTable.getState().pagination.pageSize}
						</Select.Trigger>
						<Select.Content side="top">
							{#each [10, 20, 30, 40, 50] as pageSize (pageSize)}
								<Select.Item value={pageSize.toString()}>
									{pageSize}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex w-fit items-center justify-center text-sm font-medium">
					{t('pageOf', { current: pendingTable.getState().pagination.pageIndex + 1, total: pendingTable.getPageCount() || 1 })}
				</div>
				<div class="ms-auto flex items-center gap-2 lg:ms-0">
					<Button
						variant="outline"
						class="h-8 w-8 p-0 min-w-[2rem] lg:flex"
						onclick={() => pendingTable.setPageIndex(0)}
						disabled={!pendingTable.getCanPreviousPage()}
					>
						<span class="sr-only">{t('firstPage')}</span>
						<ChevronsLeftIcon />
					</Button>
					<Button
						variant="outline"
						class="size-8"
						size="icon"
						onclick={() => pendingTable.previousPage()}
						disabled={!pendingTable.getCanPreviousPage()}
					>
						<span class="sr-only">{t('previousPage')}</span>
						<ChevronLeftIcon />
					</Button>
					<Button
						variant="outline"
						class="size-8"
						size="icon"
						onclick={() => pendingTable.nextPage()}
						disabled={!pendingTable.getCanNextPage()}
					>
						<span class="sr-only">{t('nextPage')}</span>
						<ChevronRightIcon />
					</Button>
					<Button
						variant="outline"
						class="hidden size-8 lg:flex"
						size="icon"
						onclick={() => pendingTable.setPageIndex(pendingTable.getPageCount() - 1)}
						disabled={!pendingTable.getCanNextPage()}
					>
						<span class="sr-only">{t('lastPage')}</span>
						<ChevronsRightIcon />
					</Button>
				</div>
			</div>
		</div>
	</Tabs.Content>

	<Tabs.Content value="reports" class="relative flex flex-col gap-4 overflow-auto px-2 sm:px-4 lg:px-6">
		<div class="overflow-x-scroll rounded-lg border">
			<div class="flex flex-col gap-3 p-2 sm:flex-row sm:items-center sm:justify-between sm:p-4">
				<Input
					placeholder={t('search')}
					class="h-9 w-full sm:max-w-sm text-sm sm:text-base"
					value={reportsTable.getState().globalFilter ?? ''}
					oninput={(e) => reportsTable.setGlobalFilter(e.currentTarget.value)}
				/>
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
		
					<div class="flex flex-wrap items-center gap-2">
						<Select.Root type="single" bind:value={selectedReportsBulkAction}>
							<Select.Trigger size="sm" class="w-48 min-w-40 justify-between">
								{reportsBulkActionOptions.find((opt) => opt.value === selectedReportsBulkAction)?.label}
							</Select.Trigger>
							<Select.Content>
								{#each reportsBulkActionOptions as option (option.value)}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						<Button
							size="sm"
							variant="secondary"
							onclick={() => requestPasswordVerification(handleReportsBulkAction)}
							disabled={reportsTable.getSelectedRowModel().rows.length === 0 || reportsBulkProcessing}
						>
							{#if reportsBulkProcessing}
            <BarSpinner class="text-primary" />
								{t('processing')}
							{:else}
								{t('bulkApply')}
							{/if}
						</Button>
					</div>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" size="sm" {...props}>
									<LayoutColumnsIcon />
									<span class="hidden lg:inline">{t('customizeColumns')}</span>
									<span class="lg:hidden">{t('columns')}</span>
									<ChevronDownIcon />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-56">
							{#each reportsTable
								.getAllColumns()
								.filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide()) as column (column.id)}
								<DropdownMenu.CheckboxItem
									class="capitalize"
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(!!value)}
								>
									{column.id}
								</DropdownMenu.CheckboxItem>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</div>

			{#if loadingReports}
				<div class="flex items-center justify-center p-8">
            <BarSpinner class="text-primary" />					
				</div>
			{:else}
				<DragDropProvider
					modifiers={[
						// @ts-expect-error @dnd-kit/abstract types are botched atm
						RestrictToVerticalAxis,
					]}
					onDragEnd={(e) => (reports = move(reports, e))}
				>
					<Table.Root>
					<Table.Header class="bg-muted sticky top-0 z-10">
						{#each reportsTable.getHeaderGroups() as headerGroup (headerGroup.id)}
							<Table.Row>
								{#each headerGroup.headers as header (header.id)}
									<Table.Head colspan={header.colSpan}>
										{#if !header.isPlaceholder}
											<FlexRender
												content={header.column.columnDef.header}
												context={header.getContext()}
											/>
										{/if}
									</Table.Head>
								{/each}
							</Table.Row>
						{/each}
					</Table.Header>
					<Table.Body class="**:data-[slot=table-cell]:first:w-8">
						{#if reportsTable.getRowModel().rows?.length}
							{#each reportsTable.getRowModel().rows as row, index (row.id)}
								{@render ReportsDraggableRow({ row, index })}
							{/each}
						{:else}
							<Table.Row>
								<Table.Cell colspan={reportsColumns.length} class="h-24 text-center">
									{t('noResults')}
								</Table.Cell>
							</Table.Row>
						{/if}
					</Table.Body>
					</Table.Root>
				</DragDropProvider>
			{/if}
		</div>

		<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-2 sm:px-4 py-2">
			<div class="text-muted-foreground text-xs sm:text-sm">
				{t('rowsSelected', { selected: reportsTable.getFilteredSelectedRowModel().rows.length, total: reportsTable.getFilteredRowModel().rows.length })}
			</div>
			<div class="flex w-full items-center justify-between gap-2 sm:gap-4 lg:w-fit">
				<div class="hidden items-center gap-2 lg:flex">
					<Label for="reports-rows-per-page" class="text-sm font-medium">{t('rowsPerPage')}</Label>
					<Select.Root
						type="single"
						bind:value={
							() => `${reportsTable.getState().pagination.pageSize}`,
							(v) => reportsTable.setPageSize(Number(v))
						}
					>
						<Select.Trigger size="sm" class="w-20" id="reports-rows-per-page">
							{reportsTable.getState().pagination.pageSize}
						</Select.Trigger>
						<Select.Content side="top">
							{#each [10, 20, 30, 40, 50] as pageSize (pageSize)}
								<Select.Item value={pageSize.toString()}>
									{pageSize}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex w-fit items-center justify-center text-sm font-medium">
					{t('pageOf', { current: reportsTable.getState().pagination.pageIndex + 1, total: reportsTable.getPageCount() || 1 })}
				</div>
				<div class="ms-auto flex items-center gap-2 lg:ms-0">
					<Button
						variant="outline"
						class="h-8 w-8 p-0 min-w-[2rem] lg:flex"
						onclick={() => reportsTable.setPageIndex(0)}
						disabled={!reportsTable.getCanPreviousPage()}
					>
						<span class="sr-only">{t('firstPage')}</span>
						<ChevronsLeftIcon />
					</Button>
					<Button
						variant="outline"
						class="size-8"
						size="icon"
						onclick={() => reportsTable.previousPage()}
						disabled={!reportsTable.getCanPreviousPage()}
					>
						<span class="sr-only">{t('previousPage')}</span>
						<ChevronLeftIcon />
					</Button>
					<Button
						variant="outline"
						class="size-8"
						size="icon"
						onclick={() => reportsTable.nextPage()}
						disabled={!reportsTable.getCanNextPage()}
					>
						<span class="sr-only">{t('nextPage')}</span>
						<ChevronRightIcon />
					</Button>
					<Button
						variant="outline"
						class="hidden size-8 lg:flex"
						size="icon"
						onclick={() => reportsTable.setPageIndex(reportsTable.getPageCount() - 1)}
						disabled={!reportsTable.getCanNextPage()}
					>
						<span class="sr-only">{t('lastPage')}</span>
						<ChevronsRightIcon />
					</Button>
				</div>
			</div>
		</div>
	</Tabs.Content>

	<Tabs.Content value="comments" class="relative flex flex-col gap-4 overflow-auto px-2 sm:px-4 lg:px-6">
		<div class="overflow-x-scroll rounded-lg border">
			<div class="flex flex-col gap-3 p-2 sm:flex-row sm:items-center sm:justify-between sm:p-4">
				<Input
					placeholder={t('search')}
					class="h-9 w-full sm:max-w-sm text-sm sm:text-base"
					value={commentsTable.getState().globalFilter ?? ''}
					oninput={(e) => commentsTable.setGlobalFilter(e.currentTarget.value)}
				/>
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
					<Select.Root type="single" bind:value={commentsStatusFilter}>
						<Select.Trigger size="sm" class="w-full min-w-[10rem] justify-between ">
							{commentsStatusOptions.find((opt) => opt.value === commentsStatusFilter)?.label}
						</Select.Trigger>
						<Select.Content>
							{#each commentsStatusOptions as option (option.value)}
								<Select.Item value={option.value}>{option.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<div class="flex flex-wrap items-center gap-2">
						{#if hasCommentsBulkCapableRows}
							<Select.Root type="single" bind:value={selectedCommentsBulkAction}>
								<Select.Trigger size="sm" class="w-40 min-w-32 justify-between">
									{commentsBulkActionOptions.find((opt) => opt.value === selectedCommentsBulkAction)?.label}
								</Select.Trigger>
								<Select.Content>
									{#each commentsBulkActionOptions as option (option.value)}
										<Select.Item value={option.value}>{option.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<Button
								size="sm"
								variant="secondary"
								onclick={() => requestPasswordVerification(handleCommentsBulkAction)}
								disabled={!hasCommentsBulkSelection || commentsBulkProcessing}
							>
								{#if commentsBulkProcessing}
									<BarSpinner class="text-primary" />
									{t('processing')}
								{:else}
									{t('bulkApply')}
								{/if}
							</Button>
						{/if}
					</div>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" size="sm" {...props}>
								<LayoutColumnsIcon />
								<span class="hidden lg:inline">{t('customizeColumns')}</span>
								<span class="lg:hidden">{t('columns')}</span>
								<ChevronDownIcon />
							</Button>
						{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-56">
							{#each commentsTable
								.getAllColumns()
								.filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide()) as column (column.id)}
								<DropdownMenu.CheckboxItem
									class="capitalize"
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(!!value)}
								>
									{column.id}
								</DropdownMenu.CheckboxItem>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</div>

			{#if loadingComments}
				<div class="flex items-center justify-center p-8">
					<BarSpinner class="text-primary" />
					
				</div>
			{:else}
				<Table.Root>
					<Table.Header class="bg-muted sticky top-0 z-10">
						{#each commentsTable.getHeaderGroups() as headerGroup (headerGroup.id)}
							<Table.Row>
								{#each headerGroup.headers as header (header.id)}
									<Table.Head colspan={header.colSpan}>
										{#if !header.isPlaceholder}
											<FlexRender
												content={header.column.columnDef.header}
												context={header.getContext()}
											/>
										{/if}
									</Table.Head>
								{/each}
							</Table.Row>
						{/each}
					</Table.Header>
					<Table.Body class="**:data-[slot=table-cell]:first:w-8">
						{#if commentsTable.getRowModel().rows?.length}
							{#each commentsTable.getRowModel().rows as row (row.id)}
								<Table.Row data-state={row.getIsSelected() && "selected"}>
									{#each row.getVisibleCells() as cell (cell.id)}
										<Table.Cell>
											<FlexRender
												content={cell.column.columnDef.cell}
												context={cell.getContext()}
											/>
										</Table.Cell>
									{/each}
								</Table.Row>
							{/each}
						{:else}
							<Table.Row>
								<Table.Cell colspan={commentsColumns.length} class="h-24 text-center">
									Henüz yorum yok
								</Table.Cell>
							</Table.Row>
						{/if}
					</Table.Body>
				</Table.Root>
			{/if}
		</div>

		<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-2 sm:px-4 py-2">
			<div class="text-muted-foreground text-xs sm:text-sm">
				{t('rowsSelected', { selected: commentsTable.getFilteredSelectedRowModel().rows.length, total: commentsTable.getFilteredRowModel().rows.length })}
			</div>
			<div class="flex w-full items-center justify-between gap-2 sm:gap-4 lg:w-fit">
				<div class="hidden items-center gap-2 lg:flex">
					<Label for="comments-rows-per-page" class="text-sm font-medium">{t('rowsPerPage')}</Label>
					<Select.Root
						type="single"
						bind:value={
							() => `${commentsTable.getState().pagination.pageSize}`,
							(v) => commentsTable.setPageSize(Number(v))
						}
					>
						<Select.Trigger size="sm" class="w-20" id="comments-rows-per-page">
							{commentsTable.getState().pagination.pageSize}
						</Select.Trigger>
						<Select.Content side="top">
							{#each [10, 20, 30, 40, 50] as pageSize (pageSize)}
								<Select.Item value={pageSize.toString()}>
									{pageSize}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex w-fit items-center justify-center text-sm font-medium">
					{t('pageOf', { current: commentsTable.getState().pagination.pageIndex + 1, total: commentsTable.getPageCount() || 1 })}
				</div>
				<div class="ms-auto flex items-center gap-2 lg:ms-0">
					<Button
						variant="outline"
						class="h-8 w-8 p-0 min-w-[2rem] lg:flex"
						onclick={() => commentsTable.setPageIndex(0)}
						disabled={!commentsTable.getCanPreviousPage()}
					>
						<span class="sr-only">{t('firstPage')}</span>
						<ChevronsLeftIcon />
					</Button>
					<Button
						variant="outline"
						class="size-8"
						size="icon"
						onclick={() => commentsTable.previousPage()}
						disabled={!commentsTable.getCanPreviousPage()}
					>
						<span class="sr-only">{t('previousPage')}</span>
						<ChevronLeftIcon />
					</Button>
					<Button
						variant="outline"
						class="size-8"
						size="icon"
						onclick={() => commentsTable.nextPage()}
						disabled={!commentsTable.getCanNextPage()}
					>
						<span class="sr-only">{t('nextPage')}</span>
						<ChevronRightIcon />
					</Button>
					<Button
						variant="outline"
						class="hidden size-8 lg:flex"
						size="icon"
						onclick={() => commentsTable.setPageIndex(commentsTable.getPageCount() - 1)}
						disabled={!commentsTable.getCanNextPage()}
					>
						<span class="sr-only">{t('lastPage')}</span>
						<ChevronsRightIcon />
					</Button>
				</div>
			</div>
		</div>
	</Tabs.Content>

	<Tabs.Content value="kullanicilar" class="relative flex flex-col gap-4 overflow-auto px-2 sm:px-4 lg:px-6">
		<div class="overflow-x-scroll rounded-lg border">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 sm:p-4">
			<Input
				placeholder={t('search')}
				class="h-9 w-full sm:max-w-sm text-sm sm:text-base"
				value={table.getState().globalFilter ?? ''}
				oninput={(e) => table.setGlobalFilter(e.currentTarget.value)}
			/>
			<div class="flex items-center gap-2">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" size="sm" {...props}>
								<LayoutColumnsIcon />
								<span class="hidden lg:inline">{t('customizeColumns')}</span>
								<span class="lg:hidden">{t('columns')}</span>
								<ChevronDownIcon />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="w-56">
						{#each table
							.getAllColumns()
							.filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide()) as column (column.id)}
							<DropdownMenu.CheckboxItem
								class="capitalize"
								checked={column.getIsVisible()}
								onCheckedChange={(value) => column.toggleVisibility(!!value)}
							>
								{column.id}
							</DropdownMenu.CheckboxItem>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
		</div>
			{#if hasBulkCapableRows}
				<div class="flex flex-wrap items-center gap-2">
					<Select.Root type="single" bind:value={selectedBulkAction}>
						<Select.Trigger size="sm" class="w-48 min-w-40 justify-between">
							{bulkActionOptions.find((opt) => opt.value === selectedBulkAction)?.label}
						</Select.Trigger>
						<Select.Content>
							{#each bulkActionOptions as option (option.value)}
								<Select.Item value={option.value}>{option.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<Button
						size="sm"
						variant="secondary"
						onclick={() => requestPasswordVerification(handleBulkAction)}
						disabled={!hasBulkSelection || bulkProcessing}
					>
						{#if bulkProcessing}
            <BarSpinner class="text-primary" />
										{t('processing')}
						{:else}
							{t('bulkApply')}
						{/if}
					</Button>
				</div>
			{/if}
		</div>
		<DragDropProvider
			modifiers={[
				// @ts-expect-error @dnd-kit/abstract types are botched atm
				RestrictToVerticalAxis,
			]}
			onDragEnd={(e) => (data = move(data, e))}
		>
			<Table.Root>
					<Table.Header class="bg-muted sticky top-0 z-10">
						{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
							<Table.Row>
								{#each headerGroup.headers as header (header.id)}
									<Table.Head colspan={header.colSpan}>
										{#if !header.isPlaceholder}
											<FlexRender
												content={header.column.columnDef.header}
												context={header.getContext()}
											/>
											
										{/if}
									</Table.Head>
								{/each}
							</Table.Row>
						{/each}
					</Table.Header>
					<Table.Body class="**:data-[slot=table-cell]:first:w-8">
						{#if table.getRowModel().rows?.length}
							{#each table.getRowModel().rows as row, index (row.id)}
								{@render DraggableRow({ row, index })}
							{/each}
						{:else}
							<Table.Row>
								<Table.Cell colspan={columns.length} class="h-24 text-center">
									{t('noResults')}
								</Table.Cell>
							</Table.Row>
						{/if}
					</Table.Body>
				</Table.Root>
			</DragDropProvider>
		</div>
		<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-2 sm:px-4 py-2">
			<div class="text-muted-foreground text-xs sm:text-sm">
				{t('rowsSelected', { selected: table.getFilteredSelectedRowModel().rows.length, total: table.getFilteredRowModel().rows.length })}
			</div>
			<div class="flex w-full items-center justify-between gap-2 sm:gap-4 lg:w-fit">
				<div class="hidden items-center gap-2 lg:flex">
					<Label for="rows-per-page" class="text-sm font-medium">{t('rowsPerPage')}</Label>
					<Select.Root
						type="single"
						bind:value={
							() => `${table.getState().pagination.pageSize}`,
							(v) => table.setPageSize(Number(v))
						}
					>
						<Select.Trigger size="sm" class="w-20" id="rows-per-page">
							{table.getState().pagination.pageSize}
						</Select.Trigger>
						<Select.Content side="top">
							{#each [10, 20, 30, 40, 50] as pageSize (pageSize)}
								<Select.Item value={pageSize.toString()}>
									{pageSize}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex w-fit items-center justify-center text-sm font-medium">
					{t('pageOf', { current: table.getState().pagination.pageIndex + 1, total: table.getPageCount() })}
				</div>
				<div class="ms-auto flex items-center gap-2 lg:ms-0">
					<Button
						variant="outline"
						class="h-8 w-8 p-0 min-w-[2rem] lg:flex"
						onclick={() => table.setPageIndex(0)}
						disabled={!table.getCanPreviousPage()}
					>
						<span class="sr-only">{t('firstPage')}</span>
						<ChevronsLeftIcon />
					</Button>
					<Button
						variant="outline"
						class="size-8"
						size="icon"
						onclick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						<span class="sr-only">{t('previousPage')}</span>
						<ChevronLeftIcon />
					</Button>
					<Button
						variant="outline"
						class="size-8"
						size="icon"
						onclick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						<span class="sr-only">{t('nextPage')}</span>
						<ChevronRightIcon />
					</Button>
					<Button
						variant="outline"
						class="hidden size-8 lg:flex"
						size="icon"
						onclick={() => table.setPageIndex(table.getPageCount() - 1)}
						disabled={!table.getCanNextPage()}
					>
						<span class="sr-only">{t('lastPage')}</span>
						<ChevronsRightIcon />
					</Button>
				</div>
			</div>
		</div>
	</Tabs.Content>

	<Tabs.Content value="bagislar" class="relative flex flex-col gap-4 overflow-auto px-2 sm:px-4 lg:px-6">
		<div class="overflow-x-scroll rounded-lg border">
			<div class="flex flex-col gap-3 p-2 sm:flex-row sm:items-center sm:justify-between sm:p-4">
				<Input
					placeholder={t('search')}
					class="h-9 w-full sm:max-w-sm text-sm sm:text-base"
					value={donationsTable.getState().globalFilter ?? ''}
					oninput={(e) => donationsTable.setGlobalFilter(e.currentTarget.value)}
				/>
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
					<Select.Root type="single" bind:value={donationsStatusFilter}>
						<Select.Trigger size="sm" class="w-full min-w-[10rem] justify-between ">
							{donationStatusOptions.find((opt) => opt.value === donationsStatusFilter)?.label}
						</Select.Trigger>
						<Select.Content>
							{#each donationStatusOptions as option (option.value)}
								<Select.Item value={option.value}>{option.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<div class="flex flex-wrap items-center gap-2">
						{#if hasDonationBulkCapableRows}
							<Select.Root type="single" bind:value={selectedDonationBulkAction}>
								<Select.Trigger size="sm" class="w-48 min-w-40 justify-between">
									{donationBulkActionOptions.find((opt) => opt.value === selectedDonationBulkAction)?.label}
								</Select.Trigger>
								<Select.Content>
									{#each donationBulkActionOptions as option (option.value)}
										<Select.Item value={option.value}>{option.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<Button
								size="sm"
								variant="secondary"
								onclick={() => requestPasswordVerification(handleDonationsBulkAction)}
								disabled={!hasDonationBulkSelection || donationsBulkProcessing}
							>
								{#if donationsBulkProcessing}
	            <BarSpinner class="text-primary" />
									İşleniyor
								{:else}
									Uygula
								{/if}
							</Button>
						{/if}
					</div>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" size="sm" {...props}>
								<LayoutColumnsIcon />
								<span class="hidden lg:inline">{t('customizeColumns')}</span>
								<span class="lg:hidden">{t('columns')}</span>
								<ChevronDownIcon />
							</Button>
						{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-56">
							{#each donationsTable
								.getAllColumns()
								.filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide()) as column (column.id)}
								<DropdownMenu.CheckboxItem
									class="capitalize"
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(!!value)}
								>
									{column.id}
								</DropdownMenu.CheckboxItem>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</div>

			{#if loadingDonations}
				<div class="flex items-center justify-center p-8">
            <BarSpinner class="text-primary" />					
				</div>
			{:else}
				<DragDropProvider
					modifiers={[
						// @ts-expect-error @dnd-kit/abstract types are botched atm
						RestrictToVerticalAxis,
					]}
					onDragEnd={(e) => (donations = move(donations, e))}
				>
					<Table.Root>
						<Table.Header class="bg-muted sticky top-0 z-10">
							{#each donationsTable.getHeaderGroups() as headerGroup (headerGroup.id)}
								<Table.Row>
									{#each headerGroup.headers as header (header.id)}
										<Table.Head colspan={header.colSpan}>
											{#if !header.isPlaceholder}
												<FlexRender
													content={header.column.columnDef.header}
													context={header.getContext()}
												/>
											{/if}
										</Table.Head>
									{/each}
								</Table.Row>
							{/each}
						</Table.Header>
						<Table.Body class="**:data-[slot=table-cell]:first:w-8">
							{#if donationsTable.getRowModel().rows?.length}
								{#each donationsTable.getRowModel().rows as row, index (row.id)}
									{@render DonationDraggableRow({ row, index })}
								{/each}
							{:else}
								<Table.Row>
									<Table.Cell colspan={donationsColumns.length} class="h-24 text-center">
										Henüz bağış yok
									</Table.Cell>
								</Table.Row>
							{/if}
						</Table.Body>
					</Table.Root>
				</DragDropProvider>
			{/if}
		</div>

		<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-2 sm:px-4 py-2">
			<div class="text-muted-foreground text-xs sm:text-sm">
				{t('rowsSelected', { selected: donationsTable.getFilteredSelectedRowModel().rows.length, total: donationsTable.getFilteredRowModel().rows.length })}
			</div>
			<div class="flex w-full items-center justify-between gap-2 sm:gap-4 lg:w-fit">
				<div class="hidden items-center gap-2 lg:flex">
					<Label for="donations-rows-per-page" class="text-sm font-medium">{t('rowsPerPage')}</Label>
					<Select.Root
						type="single"
						bind:value={
							() => `${donationsTable.getState().pagination.pageSize}`,
							(v) => donationsTable.setPageSize(Number(v))
						}
					>
						<Select.Trigger size="sm" class="w-20" id="donations-rows-per-page">
							{donationsTable.getState().pagination.pageSize}
						</Select.Trigger>
						<Select.Content side="top">
							{#each [10, 20, 30, 40, 50] as pageSize (pageSize)}
								<Select.Item value={pageSize.toString()}>
									{pageSize}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex w-fit items-center justify-center text-sm font-medium">
					{t('pageOf', { current: donationsTable.getState().pagination.pageIndex + 1, total: donationsTable.getPageCount() || 1 })}
				</div>
				<div class="ms-auto flex items-center gap-2 lg:ms-0">
					<Button
						variant="outline"
						class="h-8 w-8 p-0 min-w-[2rem] lg:flex"
						onclick={() => donationsTable.setPageIndex(0)}
						disabled={!donationsTable.getCanPreviousPage()}
					>
						<span class="sr-only">{t('firstPage')}</span>
						<ChevronsLeftIcon />
					</Button>
					<Button
						variant="outline"
						class="size-8"
						size="icon"
						onclick={() => donationsTable.previousPage()}
						disabled={!donationsTable.getCanPreviousPage()}
					>
						<span class="sr-only">{t('previousPage')}</span>
						<ChevronLeftIcon />
					</Button>
					<Button
						variant="outline"
						class="size-8"
						size="icon"
						onclick={() => donationsTable.nextPage()}
						disabled={!donationsTable.getCanNextPage()}
					>
						<span class="sr-only">{t('nextPage')}</span>
						<ChevronRightIcon />
					</Button>
					<Button
						variant="outline"
						class="hidden size-8 lg:flex"
						size="icon"
						onclick={() => donationsTable.setPageIndex(donationsTable.getPageCount() - 1)}
						disabled={!donationsTable.getCanNextPage()}
					>
						<span class="sr-only">{t('lastPage')}</span>
						<ChevronsRightIcon />
					</Button>
				</div>
			</div>
		</div>
	</Tabs.Content>
	<Tabs.Content value="contact-messages" class="relative flex flex-col gap-4 overflow-auto px-2 sm:px-4 lg:px-6">
		<div class="overflow-x-scroll rounded-lg border">
			<div class="flex flex-col gap-3 p-2 sm:flex-row sm:items-center sm:justify-between sm:p-4">
				<Input
					placeholder={t('search')}
					class="h-9 w-full sm:max-w-sm text-sm sm:text-base"
					value={contactMessagesTable.getState().globalFilter ?? ''}
					oninput={(e) => contactMessagesTable.setGlobalFilter(e.currentTarget.value)}
				/>
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
					<Select.Root type="single" bind:value={contactMessagesStatusFilter}>
						<Select.Trigger size="sm" class="w-full min-w-[10rem] justify-between ">
							{contactMessageStatusOptions.find((opt) => opt.value === contactMessagesStatusFilter)?.label}
						</Select.Trigger>
						<Select.Content>
							{#each contactMessageStatusOptions as option (option.value)}
								<Select.Item value={option.value}>{option.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<div class="flex flex-wrap items-center gap-2">
						{#if hasContactMessagesBulkCapableRows}
							<Select.Root type="single" bind:value={selectedContactMessagesBulkAction}>
								<Select.Trigger size="sm" class="w-48 min-w-40 justify-between">
									{contactMessagesBulkActionOptions.find((opt) => opt.value === selectedContactMessagesBulkAction)?.label}
								</Select.Trigger>
								<Select.Content>
									{#each contactMessagesBulkActionOptions as option (option.value)}
										<Select.Item value={option.value}>{option.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<Button
								size="sm"
								variant="secondary"
								onclick={() => requestPasswordVerification(handleContactMessagesBulkAction)}
								disabled={!hasContactMessagesBulkSelection || contactMessagesBulkProcessing}
							>
								{#if contactMessagesBulkProcessing}
									<BarSpinner class="text-primary" />
									İşleniyor
								{:else}
									Uygula
								{/if}
							</Button>
						{/if}
					</div>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" size="sm" {...props}>
								<LayoutColumnsIcon />
								<span class="hidden lg:inline">{t('customizeColumns')}</span>
								<span class="lg:hidden">{t('columns')}</span>
								<ChevronDownIcon />
							</Button>
						{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-56">
							{#each contactMessagesTable
								.getAllColumns()
								.filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide()) as column (column.id)}
								<DropdownMenu.CheckboxItem
									class="capitalize"
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(!!value)}
								>
									{column.id}
								</DropdownMenu.CheckboxItem>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</div>

			{#if loadingContactMessages}
				<div class="flex items-center justify-center p-8">
					<BarSpinner class="text-primary" />
					
				</div>
			{:else}
				<Table.Root>
					<Table.Header class="bg-muted sticky top-0 z-10">
						{#each contactMessagesTable.getHeaderGroups() as headerGroup (headerGroup.id)}
							<Table.Row>
								{#each headerGroup.headers as header (header.id)}
									<Table.Head colspan={header.colSpan}>
										{#if !header.isPlaceholder}
											<FlexRender
												content={header.column.columnDef.header}
												context={header.getContext()}
											/>
										{/if}
									</Table.Head>
								{/each}
							</Table.Row>
						{/each}
					</Table.Header>
					<Table.Body class="**:data-[slot=table-cell]:first:w-8">
						{#if contactMessagesTable.getRowModel().rows?.length}
							{#each contactMessagesTable.getRowModel().rows as row (row.id)}
								<Table.Row data-state={row.getIsSelected() && "selected"}>
									{#each row.getVisibleCells() as cell (cell.id)}
										<Table.Cell>
											<FlexRender
												content={cell.column.columnDef.cell}
												context={cell.getContext()}
											/>
										</Table.Cell>
									{/each}
								</Table.Row>
							{/each}
						{:else}
							<Table.Row>
								<Table.Cell colspan={contactMessagesColumns.length} class="h-24 text-center">
									Henüz mesaj yok
								</Table.Cell>
							</Table.Row>
						{/if}
					</Table.Body>
				</Table.Root>
			{/if}
		</div>

		<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-2 sm:px-4 py-2">
			<div class="text-muted-foreground text-xs sm:text-sm">
				{t('rowsSelected', { selected: contactMessagesTable.getFilteredSelectedRowModel().rows.length, total: contactMessagesTable.getFilteredRowModel().rows.length })}
			</div>
			<div class="flex w-full items-center justify-between gap-2 sm:gap-4 lg:w-fit">
				<div class="hidden items-center gap-2 lg:flex">
					<Label for="contact-rows-per-page" class="text-sm font-medium">{t('rowsPerPage')}</Label>
					<Select.Root
						type="single"
						bind:value={
							() => `${contactMessagesTable.getState().pagination.pageSize}`,
							(v) => contactMessagesTable.setPageSize(Number(v))
						}
					>
						<Select.Trigger size="sm" class="w-20" id="contact-rows-per-page">
							{contactMessagesTable.getState().pagination.pageSize}
						</Select.Trigger>
						<Select.Content side="top">
							{#each [10, 20, 30, 40, 50] as pageSize (pageSize)}
								<Select.Item value={pageSize.toString()}>
									{pageSize}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex w-fit items-center justify-center text-sm font-medium">
					{t('pageOf', { current: contactMessagesTable.getState().pagination.pageIndex + 1, total: contactMessagesTable.getPageCount() || 1 })}
				</div>
				<div class="ms-auto flex items-center gap-2 lg:ms-0">
					<Button
						variant="outline"
						class="h-8 w-8 p-0 min-w-[2rem] lg:flex"
						onclick={() => contactMessagesTable.setPageIndex(0)}
						disabled={!contactMessagesTable.getCanPreviousPage()}
					>
						<span class="sr-only">{t('firstPage')}</span>
						<ChevronsLeftIcon />
					</Button>
					<Button
						variant="outline"
						class="size-8"
						size="icon"
						onclick={() => contactMessagesTable.previousPage()}
						disabled={!contactMessagesTable.getCanPreviousPage()}
					>
						<span class="sr-only">{t('previousPage')}</span>
						<ChevronLeftIcon />
					</Button>
					<Button
						variant="outline"
						class="size-8"
						size="icon"
						onclick={() => contactMessagesTable.nextPage()}
						disabled={!contactMessagesTable.getCanNextPage()}
					>
						<span class="sr-only">{t('nextPage')}</span>
						<ChevronRightIcon />
					</Button>
					<Button
						variant="outline"
						class="hidden size-8 lg:flex"
						size="icon"
						onclick={() => contactMessagesTable.setPageIndex(contactMessagesTable.getPageCount() - 1)}
						disabled={!contactMessagesTable.getCanNextPage()}
					>
						<span class="sr-only">{t('lastPage')}</span>
						<ChevronsRightIcon />
					</Button>
				</div>
			</div>
		</div>
	</Tabs.Content>
	<Tabs.Content value="past-performance" class="flex flex-col px-4 lg:px-6">
		<div class="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
	</Tabs.Content>
	<Tabs.Content value="key-personnel" class="flex flex-col px-4 lg:px-6">
		<div class="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
	</Tabs.Content>
	<Tabs.Content value="focus-documents" class="flex flex-col px-4 lg:px-6">
		<div class="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
	</Tabs.Content>
</Tabs.Root>

<PasswordVerificationPopup
	bind:openVerif={showPasswordVerification}
	onVerified={handleMnemonicVerified}
	onCancel={handleMnemonicCancel}
	title="Kullanıcı İşlem Onayı"
	description="Kullanıcı işlemlerini gerçekleştirmek için hesap şifrenizi doğrulamanız gerekiyor."
/>

<AlertDialog.Root bind:open={showRejectDialog} onOpenChange={handleRejectDialogOpenChange}>
	<AlertDialog.Content class="w-[calc(100%-2rem)] max-w-lg">
		<AlertDialog.Header>
			<AlertDialog.Title>
				{t('rejectReasonTitle') ?? 'Red mesajı gönder'}
			</AlertDialog.Title>
			<AlertDialog.Description>
				{t('rejectReasonDescription') ?? 'Bu mesaj yazara bildirim olarak gönderilecektir.'}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<div class="space-y-2 py-2">
			<Label for="reject-reason">{t('rejectReasonLabel') ?? 'Mesaj'}</Label>
			<Textarea
				id="reject-reason"
				rows={4}
				bind:value={rejectReason}
				placeholder={t('rejectReasonPlaceholder') ?? 'Neden reddettiğinizi açıklayın...'}
			/>
		</div>
		<AlertDialog.Footer class="flex flex-col gap-2 sm:flex-row sm:justify-end">
			<AlertDialog.Cancel class="w-full sm:w-auto">
				{t('cancelReject') ?? t('common.cancel')}
			</AlertDialog.Cancel>
			<AlertDialog.Action class="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90" onclick={confirmRejectDialog}>
				{t('sendRejection') ?? 'Reddet ve bildir'}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={showReportReasonsDialog}>
	<AlertDialog.Content class="w-[calc(100%-2rem)] max-w-lg">
		<AlertDialog.Header>
			<AlertDialog.Title>{t('reason') ?? 'Neden'}</AlertDialog.Title>
			<AlertDialog.Description>
				{t('reasons') ?? ''}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<div class="space-y-2 py-2 max-h-[50vh] overflow-auto">
			{#each reportReasonsDialogText as reason (reason)}
				<div class="rounded-md border p-3 text-sm whitespace-pre-wrap break-words">{reason}</div>
			{/each}
		</div>
		<AlertDialog.Footer class="flex flex-col gap-2 sm:flex-row sm:justify-end">
			<AlertDialog.Cancel class="w-full sm:w-auto">{t('common.close') ?? t('Cancel') ?? 'Kapat'}</AlertDialog.Cancel>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={showCommentContentDialog}>
	<AlertDialog.Content class="w-[calc(100%-2rem)] max-w-2xl">
		<AlertDialog.Header>
			<AlertDialog.Title>{t('comment') ?? 'Yorum'}{#if commentContentDialogAuthor} - {commentContentDialogAuthor}{/if}</AlertDialog.Title>
		</AlertDialog.Header>
		<div class="space-y-2 py-2 max-h-[60vh] overflow-auto">
			<div class="rounded-md border p-4">
				{#if commentContentDialogContent}
					<EdraEditor content={commentContentDialogContent} editable={false} />
				{/if}
			</div>
		</div>
		<AlertDialog.Footer class="flex flex-col gap-2 sm:flex-row sm:justify-end">
			<AlertDialog.Cancel class="w-full sm:w-auto">{t('common.close') ?? 'Kapat'}</AlertDialog.Cancel>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={showContactReplyDialog} onOpenChange={handleContactReplyDialogOpenChange}>
	<AlertDialog.Content class="w-[calc(100%-2rem)] max-w-lg">
		<AlertDialog.Header>
			<AlertDialog.Title>
				Mesajı Yanıtla
			</AlertDialog.Title>
			<AlertDialog.Description>
				Bu mesajı yanıtlamak için aşağıya yanıtınızı yazın.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<div class="space-y-2 py-2">
			<Label for="contact-reply">Yanıtınız</Label>
			<Textarea
				id="contact-reply"
				rows={4}
				bind:value={contactReplyText}
				placeholder="Mesajınızı buraya yazın..."
			/>
		</div>
		<AlertDialog.Footer class="flex flex-col gap-2 sm:flex-row sm:justify-end">
			<AlertDialog.Cancel class="w-full sm:w-auto">
				İptal
			</AlertDialog.Cancel>
			<AlertDialog.Action class="w-full sm:w-auto" onclick={confirmContactReplyDialog}>
				Gönder
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={showContactDeleteDialog} onOpenChange={handleContactDeleteDialogOpenChange}>
	<AlertDialog.Content class="w-[calc(100%-2rem)] max-w-lg">
		<AlertDialog.Header>
			<AlertDialog.Title>
				Mesajı Sil
			</AlertDialog.Title>
			<AlertDialog.Description>
				Bu mesajı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer class="flex flex-col gap-2 sm:flex-row sm:justify-end">
			<AlertDialog.Cancel class="w-full sm:w-auto">
				İptal
			</AlertDialog.Cancel>
			<AlertDialog.Action class="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90" onclick={confirmContactDeleteDialog}>
				Sil
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={showDonationMessageDialog}>
	<AlertDialog.Content class="w-[calc(100%-2rem)] max-w-2xl">
		<AlertDialog.Header>
			<AlertDialog.Title>{t('message') ?? 'Mesaj'}</AlertDialog.Title>
		</AlertDialog.Header>
		<div class="space-y-2 py-2 max-h-[60vh] overflow-auto">
			<div class="rounded-md border p-4 whitespace-pre-wrap break-words">
				{donationMessageDialogContent}
			</div>
		</div>
		<AlertDialog.Footer class="flex flex-col gap-2 sm:flex-row sm:justify-end">
			<AlertDialog.Cancel class="w-full sm:w-auto">{t('common.close') ?? 'Kapat'}</AlertDialog.Cancel>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={showContactMessageDialog}>
	<AlertDialog.Content class="w-[calc(100%-2rem)] max-w-2xl">
		<AlertDialog.Header>
			<AlertDialog.Title>{t('message') ?? 'Mesaj'}{#if contactMessageDialogSender} - {contactMessageDialogSender}{/if}</AlertDialog.Title>
		</AlertDialog.Header>
		<div class="space-y-2 py-2 max-h-[60vh] overflow-auto">
			<div class="rounded-md border p-4 whitespace-pre-wrap break-words">
				{contactMessageDialogContent}
			</div>
		</div>
		<AlertDialog.Footer class="flex flex-col gap-2 sm:flex-row sm:justify-end">
			<AlertDialog.Cancel class="w-full sm:w-auto">{t('common.close') ?? 'Kapat'}</AlertDialog.Cancel>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

{#snippet ReportTargetLink({ href, label }: { href: string; label: string })}
	<a href={href} class="underline underline-offset-2 hover:opacity-80" rel="noreferrer">
		{label}
	</a>
{/snippet}

{#snippet ReportReasonCell({ label, reasons }: { label: string; reasons: string[] })}
	<div class="flex items-center gap-2">
		<span class="truncate max-w-[150px]">{label}</span>
		<Button size="sm" variant="ghost" onclick={() => openReportReasonsDialog(reasons)}>
			{t('readMore') ?? 'Devamını oku'}
		</Button>
	</div>
{/snippet}

{#snippet ReportsRowActions({ row }: { row: Row<ReportRow> })}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button variant="ghost" size="icon" {...props}>
					<DotsVerticalIcon class="h-4 w-4" />
					<span class="sr-only">{t('actions') ?? 'Actions'}</span>
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-56">
			<DropdownMenu.Item onclick={() => requestPasswordVerification(() => applyReportGroupStatus(row.original, 'reviewing'))}>
				{t('reviewing') ?? 'İnceleniyor'}
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={() => requestPasswordVerification(() => applyReportGroupStatus(row.original, 'resolved'))}>
				{t('resolved') ?? 'Çözüldü'}
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={() => requestPasswordVerification(() => applyReportGroupStatus(row.original, 'rejected'))}>
				{t('rejected') ?? 'Reddedildi'}
			</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item variant="destructive" onclick={() => requestPasswordVerification(() => deleteReportGroup(row.original))}>
				{t('delete') ?? t('common.delete') ?? 'Sil'}
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

{#snippet ReportsDraggableRow({ row, index }: { row: Row<ReportRow>; index: number })}
	{@const { ref, isDragging, handleRef } = useSortable({
		id: row.original?.id ?? row.id ?? crypto.randomUUID(),
		index: () => index,
	})}
	<Table.Row
		data-state={row.getIsSelected() && "selected"}
		data-dragging={isDragging.current}
		class="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
		{@attach ref}
	>
		{#each row.getVisibleCells() as cell (cell.id)}
			<Table.Cell>
				<FlexRender
					attach={handleRef}
					content={cell.column.columnDef.cell}
					context={cell.getContext()}
				/>
			</Table.Cell>
		{/each}
	</Table.Row>
{/snippet}

{#snippet DataTableLimit({ row }: { row: Row<Schema> })}
	{#if row.original}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
					loading: `Saving ${row.original.header}`,
					success: t('statusDone'),
					error: t('statusError'),
				});
			}}
		>
			<Label for="{row.original.id}-limit" class="sr-only">{t('limit')}</Label>
			<Input
				class="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-end shadow-none focus-visible:border dark:bg-transparent"
				value={row.original.limit}
				id="{row.original.id}-limit"
			/>
		</form>
	{:else}
		{t('unknown')}
	{/if}
{/snippet}

{#snippet DataTableTarget({ row }: { row: Row<Schema> })}
	{#if row.original}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
					loading: `Saving ${row.original.header}`,
					success: t('statusDone'),
					error: t('statusError'),
				});
			}}
		>
			<Label for="{row.original.id}-target" class="sr-only">{t('target')}</Label>
			<Input
				class="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-end shadow-none focus-visible:border dark:bg-transparent"
				value={row.original.target}
				id="{row.original.id}-target"
			/>
		</form>
	{:else}
		{t('unknown')}
	{/if}
{/snippet}

{#snippet DataTableType({ row }: { row: Row<Schema> })}
	<div class="w-full">
		<div class="flex items-center justify-between py-4">
			<div class="flex items-center gap-2">
				<Input
					placeholder={t('search')}
					class="max-w-sm"
					value={((table.getColumn("nickname")?.getFilterValue()) as string) ?? ""}
					oninput={(e) => table.getColumn("nickname")?.setFilterValue(e.currentTarget.value)}
				/>
			</div>
		</div>
		<Badge variant="outline" class="text-muted-foreground px-1.5">
			{row.original?.type || t('unknown')}
		</Badge>
	</div>
{/snippet}


{#snippet DataTableActions({ row }: { row: Row<Schema> })}
	{@const rowId = row.original?.id?.toString()}
	{@const rowRole = row.original?.type}
	{@const canModify = canModifyRole(rowRole, rowId)}
	{#if canModify && row.original}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger class="data-[state=open]:bg-muted text-muted-foreground flex size-8">
				{#snippet child({ props })}
					<Button variant="ghost" size="icon" {...props}>
						<DotsVerticalIcon />
						<span class="sr-only">{t('openMenu')}</span>
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-56">
				{#if row.original.status === "silinecek"}
					<DropdownMenu.Item onclick={() => requestPasswordVerification(() => undoDeleteUser(rowId))}>
						<RotateCcwIcon class=" h-4 w-4" />
						{t('undoDelete')}
					</DropdownMenu.Item>
				{:else}
					{#if !row.original.banned}
						<DropdownMenu.Item onclick={() => requestPasswordVerification(() => banUser(rowId))}>
							<BanIcon class=" h-4 w-4" />
							{t('banUser')}
						</DropdownMenu.Item>
					{:else}
						<DropdownMenu.Item onclick={() => requestPasswordVerification(() => unbanUser(rowId))}>
							<CheckCircleIcon class=" h-4 w-4" />
							{t('unbanUser')}
						</DropdownMenu.Item>
					{/if}
					{#if !row.original.hidden}
						<DropdownMenu.Item onclick={() => requestPasswordVerification(() => hideUser(rowId))}>
							<EyeOffIcon class=" h-4 w-4" />
							{t('hideUser')}
						</DropdownMenu.Item>
					{:else}
						<DropdownMenu.Item onclick={() => requestPasswordVerification(() => unhideUser(rowId))}>
							<EyeIcon class=" h-4 w-4" />
							{t('unhideUser')}
						</DropdownMenu.Item>
					{/if}
					{#if canPromoteRole(rowRole)}
						<DropdownMenu.Item onclick={() => requestPasswordVerification(() => promoteToModerator(rowId))}>
							<UserPlusIcon class=" h-4 w-4" />
							{t('promoteToModerator')}
						</DropdownMenu.Item>
					{/if}
					{#if canDemoteRole(rowRole)}
						<DropdownMenu.Item onclick={() => requestPasswordVerification(() => demoteToUser(rowId))}>
							<UserMinusIcon class=" h-4 w-4" />
							{t('demoteFromModerator')}
						</DropdownMenu.Item>
					{/if}
					<DropdownMenu.Separator />
					<DropdownMenu.Item variant="destructive" onclick={() => requestPasswordVerification(() => deleteUser(rowId))}>
						<Trash2Icon class=" h-4 w-4" />
						{t('deleteAccount')}
					</DropdownMenu.Item>
				{/if}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{/if}
{/snippet}

{#snippet DraggableRow({ row, index }: { row: Row<Schema>; index: number })}
	{@const { ref, isDragging, handleRef } = useSortable({
		id: row.original.id,
		index: () => index,
	})}

	<Table.Row
		data-state={row.getIsSelected() && "selected"}
		data-dragging={isDragging.current}
		class="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
		{@attach ref}
	>
		{#each row.getVisibleCells() as cell (cell.id)}
			<Table.Cell>
				<FlexRender
					attach={handleRef}
					content={cell.column.columnDef.cell}
					context={cell.getContext()}
				/>
			</Table.Cell>
		{/each}
	</Table.Row>
{/snippet}

{#snippet PendingDraggableRow({ row, index }: { row: Row<PendingArticleRow>; index: number })}
	{@const { ref, isDragging, handleRef } = useSortable({
		id: row.original?.id ?? row.id ?? crypto.randomUUID(),
		index: () => index,
	})}

	<Table.Row
		data-dragging={isDragging.current}
		data-state={row.getIsSelected() && "selected"}
		class="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
		{@attach ref}
	>
		{#each row.getVisibleCells() as cell (cell.id)}
			<Table.Cell>
				<FlexRender
					attach={handleRef}
					content={cell.column.columnDef.cell}
					context={cell.getContext()}
				/>
			</Table.Cell>
		{/each}
	</Table.Row>
{/snippet}

{#snippet DragHandle({ attach }: { attach: Attachment })}
	<Button
		{@attach attach}
		variant="ghost"
		size="icon"
		class="text-muted-foreground size-7 hover:bg-transparent"
	>
		<GripVerticalIcon class="text-muted-foreground size-3" />
		<span class="sr-only">{t('dragToReorder')}</span>
	</Button>
{/snippet}

{#snippet DeletionBadge({ countdownLabel }: { countdownLabel: string })}
	<Badge variant="destructive" class="px-2 py-1">
		<TimerIcon class="mr-1 h-3 w-3" />
		{countdownLabel}
	</Badge>
{/snippet}

{#snippet PendingArticleTitle({ row }: { row: Row<PendingArticleRow> })}
	{@const article = row.original}
	<div class="flex flex-col gap-1">
		<a				target="_blank"
				rel="noreferrer"
				href={`/article/${article.slug}`} class="text-sm font-semibold text-foreground">
			{article?.title ?? t('unknown')}
	</a>

	</div>
{/snippet}


{#snippet PendingArticleActions({ row }: { row: Row<PendingArticleRow> })}
	{@const article = row.original}
	{#if article}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger class="data-[state=open]:bg-muted text-muted-foreground flex size-8">
				{#snippet child({ props })}
					<Button variant="ghost" size="icon" {...props}>
						<DotsVerticalIcon />
						<span class="sr-only">{t('openMenu')}</span>
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-56">
				<DropdownMenu.Label>{t('reviewActions') ?? 'İnceleme İşlemleri'}</DropdownMenu.Label>
				<DropdownMenu.Separator />
				{#if canReview}
					<DropdownMenu.Item onclick={() => requestPasswordVerification(() => approveArticle(article.id))}>
						<CircleCheckFilledIcon class=" h-4 w-4" />
						{t('common.approve')}
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => requestPasswordVerification(() => openRejectDialog(article))}>
						<CircleXIcon class=" h-4 w-4" />
						{t('common.reject')}
					</DropdownMenu.Item>
				{/if}
				<DropdownMenu.Item onclick={() => requestPasswordVerification(() => requeueArticle(article.id))}>
					<RotateCcwIcon class=" h-4 w-4" />
					{t('returnToPending') ?? 'Beklemeye al'}
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				{#if article.hidden}
					<DropdownMenu.Item onclick={() => requestPasswordVerification(() => performArticleModerationAction('unhide', article.id))}>
						<EyeIcon class=" h-4 w-4" />
						{t('unhideArticle') ?? 'Göster'}
					</DropdownMenu.Item>
				{:else}
					<DropdownMenu.Item onclick={() => requestPasswordVerification(() => performArticleModerationAction('hide', article.id))}>
						<EyeOffIcon class=" h-4 w-4" />
						{t('hideArticle') ?? 'Gizle'}
					</DropdownMenu.Item>
				{/if}
				<DropdownMenu.Item class="text-destructive focus:text-destructive" onclick={() =>
					requestPasswordVerification(() =>
						performArticleModerationAction('delete', article.id, defaultRejectReason)
					)
				}>
					<Trash2Icon class=" h-4 w-4" />
					{t('deleteArticle') ?? 'Sil'}
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{:else}
		— 
	{/if}
{/snippet}

{#snippet ArticleActions({ row }: { row: Row<PendingArticleRow> })}
	{@const article = row.original}
	{#if article && article.id}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger class="data-[state=open]:bg-muted text-muted-foreground flex size-8">
				{#snippet child({ props })}
					<Button variant="ghost" size="icon" {...props}>
						<DotsVerticalIcon />
						<span class="sr-only">{t('openMenu')}</span>
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-56">
				<DropdownMenu.Label>{t('articleActions') ?? 'Makale İşlemleri'}</DropdownMenu.Label>
				<DropdownMenu.Separator />
				
				{#if article.status === 'draft' || article.status === 'pending'}
					<DropdownMenu.Item onclick={() => requestPasswordVerification(() => approveArticle(article.id))}>
						<CircleCheckFilledIcon class=" h-4 w-4" />
						{t('common.approve')}
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => requestPasswordVerification(() => openRejectDialog(article))}>
						<CircleXIcon class=" h-4 w-4" />
						{t('common.reject')}
					</DropdownMenu.Item>
				{/if}
				
				{#if article.status === 'rejected'}
					<DropdownMenu.Item onclick={() => requestPasswordVerification(() => approveArticle(article.id))}>
						<CircleCheckFilledIcon class=" h-4 w-4" />
						{t('approveRejected') ?? 'Onayla ve Yayınla'}
					</DropdownMenu.Item>
				{/if}
				
				{#if article.status === 'published'}
					<DropdownMenu.Item onclick={() => requestPasswordVerification(() => requeueArticle(article.id))}>
						<RotateCcwIcon class=" h-4 w-4" />
						{t('returnToPending') ?? 'Beklemeye al'}
					</DropdownMenu.Item>
				{/if}
				
				<DropdownMenu.Separator />
				
				{#if article.hidden}
					<DropdownMenu.Item onclick={() => requestPasswordVerification(() => performArticleModerationAction('unhide', article.id))}>
						<EyeIcon class=" h-4 w-4" />
						{t('unhideArticle') ?? 'Göster'}
					</DropdownMenu.Item>
				{:else}
					<DropdownMenu.Item onclick={() => requestPasswordVerification(() => performArticleModerationAction('hide', article.id))}>
						<EyeOffIcon class=" h-4 w-4" />
						{t('hideArticle') ?? 'Gizle'}
					</DropdownMenu.Item>
				{/if}
				
				<DropdownMenu.Item class="text-destructive focus:text-destructive" onclick={() =>
					requestPasswordVerification(() =>
						performArticleModerationAction('delete', article.id, defaultRejectReason)
					)
				}>
					<Trash2Icon class=" h-4 w-4" />
					{t('deleteArticle') ?? 'Sil'}
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{:else}
		<span class="text-muted-foreground">No data</span>
	{/if}
{/snippet}

{#snippet CommentArticleLink({ title, slug }: { title: string; slug: string })}
	<a href={l(`/article/${slug}`)} class="underline underline-offset-2 hover:opacity-80" target="_blank" rel="noreferrer">
		{title}
	</a>
{/snippet}

{#snippet CommentActions({ row }: { row: Row<CommentRow> })}
	{@const comment = row.original}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger class="data-[state=open]:bg-muted text-muted-foreground flex size-8">
			{#snippet child({ props })}
				<Button variant="ghost" size="icon" {...props}>
					<DotsVerticalIcon class="h-4 w-4" />
					<span class="sr-only">İşlemler</span>
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-56">
			<DropdownMenu.Label>Yorum İşlemleri</DropdownMenu.Label>
			<DropdownMenu.Separator />
			{#if comment.status !== 'hidden'}
				<DropdownMenu.Item onclick={() => requestPasswordVerification(() => performCommentModerationAction('hide', comment.id))}>
					<EyeOffIcon class="mr-2 h-4 w-4" />
					Gizle
				</DropdownMenu.Item>
			{:else}
				<DropdownMenu.Item onclick={() => requestPasswordVerification(() => performCommentModerationAction('unhide', comment.id))}>
					<EyeIcon class="mr-2 h-4 w-4" />
					Göster
				</DropdownMenu.Item>
			{/if}
			{#if comment.status !== 'deleted'}
				<DropdownMenu.Item class="text-destructive focus:text-destructive" onclick={() => requestPasswordVerification(() => performCommentModerationAction('delete', comment.id))}>
					<Trash2Icon class="mr-2 h-4 w-4" />
					Sil
				</DropdownMenu.Item>
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

{#snippet CommentContentCell({ content, author }: { content: string; author: string })}
	{@const plainText = extractPlainTextFromEdra(content)}
	{@const displayText = plainText.length > 60 ? plainText.substring(0, 60) + '...' : plainText}
	{@const edraContent = (() => {
		try {
			return JSON.parse(content);
		} catch {
			return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: content }] }] };
		}
	})()}
	<div class="flex items-center gap-2 max-w-[300px]">
		<span class="truncate text-sm" title={plainText}>{displayText}</span>
		{#if plainText.length > 60}
			<Button size="sm" variant="ghost" class="h-6 px-2 text-xs shrink-0" onclick={() => openCommentContentDialog(edraContent, author)}>
				{t('readMore') ?? 'Devamını oku'}
			</Button>
		{/if}
	</div>
{/snippet}

{#snippet DonationDonorCell({ donation }: { donation: any })}
	<div class="flex items-center gap-2">
		{#if donation.donor_avatar}
			<img 
				src={donation.donor_avatar} 
				alt={donation.donor_username || donation.display_name}
				class="w-6 h-6 rounded-full object-cover"
			/>
		{:else}
			<div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
				<HeartIcon class="w-3 h-3 text-red-500" />
			</div>
		{/if}
		{#if donation.donor_username}
			<a 
				href={l(`/${donation.donor_username}`)}
				class="hover:text-primary transition-colors"
			>
				{donation.display_name || 
				 (donation.donor_name && donation.donor_surname 
					? `${donation.donor_name} ${donation.donor_surname}` 
					: donation.donor_username) || 'Anonim'}
			</a>
		{:else}
			<span>{donation.display_name || 'Anonim'}</span>
		{/if}
	</div>
{/snippet}

{#snippet DonationActions({ row }: { row: Row<any> })}
	{@const donation = row.original}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger class="data-[state=open]:bg-muted text-muted-foreground flex size-8">
			{#snippet child({ props })}
				<Button variant="ghost" size="icon" {...props}>
					<DotsVerticalIcon class="h-4 w-4" />
					<span class="sr-only">İşlemler</span>
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-56">
			{#if donation.status === 'pending'}
				<DropdownMenu.Item onclick={() => requestPasswordVerification(() => handleApproveDonation(donation.id))}>
					<CheckIcon class="mr-2 h-4 w-4" />
					Onayla
				</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => {
					const reason = prompt('Red nedeni (isteğe bağlı):');
					if (reason !== null) requestPasswordVerification(() => handleRejectDonation(donation.id, reason || undefined));
				}}>
					<XIcon class="mr-2 h-4 w-4" />
					Reddet
				</DropdownMenu.Item>
			{:else if donation.status === 'approved'}
				<DropdownMenu.Item onclick={() => {
					const reason = prompt('Geri alma nedeni (isteğe bağlı):');
					if (reason !== null) requestPasswordVerification(() => handleRejectDonation(donation.id, reason || undefined));
				}}>
					<XIcon class="mr-2 h-4 w-4" />
					Geri Al/Reddet
				</DropdownMenu.Item>
			{:else if donation.status === 'rejected'}
				<DropdownMenu.Item onclick={() => requestPasswordVerification(() => handleApproveDonation(donation.id))}>
					<CheckIcon class="mr-2 h-4 w-4" />
					Geri Al/Onayla
				</DropdownMenu.Item>
			{/if}
			<DropdownMenu.Separator />
			<DropdownMenu.Item class="text-destructive focus:text-destructive" onclick={() => requestPasswordVerification(() => handleDeleteDonation(donation.id))}>
				<Trash2Icon class="mr-2 h-4 w-4" />
				Sil
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

{#snippet ContactMessageActions({ row }: { row: Row<ContactMessageRow> })}
	{@const message = row.original}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger class="data-[state=open]:bg-muted text-muted-foreground flex size-8">
			{#snippet child({ props })}
				<Button variant="ghost" size="icon" {...props}>
					<DotsVerticalIcon class="h-4 w-4" />
					<span class="sr-only">İşlemler</span>
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-56">
			<DropdownMenu.Label>İletişim Mesajı İşlemleri</DropdownMenu.Label>
			<DropdownMenu.Separator />
			{#if message.status === 'pending' || message.status === 'read'}
				<DropdownMenu.Item onclick={() => openContactReplyDialog(message)}>
					<MessageSquareIcon class="mr-2 h-4 w-4" />
					Yanıtla
				</DropdownMenu.Item>
			{/if}
			{#if message.status === 'archived'}
				<DropdownMenu.Item onclick={() => handleUpdateContactMessageStatus(message.id, 'pending')}>
					<RotateCcwIcon class="mr-2 h-4 w-4" />
					Arşivden çıkar
				</DropdownMenu.Item>
			{/if}
			<DropdownMenu.Separator />
			<DropdownMenu.Item class="text-destructive focus:text-destructive" onclick={() => handleDeleteContactMessage(message.id)}>
				<Trash2Icon class="mr-2 h-4 w-4" />
				Sil
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

{#snippet ContactMessageCell({ message, sender }: { message: string; sender: string })}
	<div class="flex items-center gap-2">
		<span class="truncate max-w-[150px]">{message.substring(0, 50)}{message.length > 50 ? '...' : ''}</span>
		<Button size="sm" variant="ghost" onclick={() => openContactMessageDialog(message, sender)}>
			{t('readMore') ?? 'Devamını oku'}
		</Button>
	</div>
{/snippet}

{#snippet DonationDraggableRow({ row, index }: { row: Row<any>; index: number })}
	{@const { ref, isDragging, handleRef } = useSortable({
		id: row.original?.id ?? row.id ?? crypto.randomUUID(),
		index: () => index,
		disabled: false,
	})}
	<Table.Row 
		ref={ref}
		data-dragging={isDragging.current}
		class="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
		data-state={row.getIsSelected() && 'selected'}
		{@attach ref}
	>
		{#each row.getVisibleCells() as cell (cell.id)}
			<Table.Cell>
				<FlexRender
					attach={handleRef}
					content={cell.column.columnDef.cell}
					context={cell.getContext()}
				/>
			</Table.Cell>
		{/each}
	</Table.Row>
{/snippet}

{#snippet DonationAmountCell({ amount }: { amount: string | number })}
	<span class="text-green-600 font-semibold">
		{#if typeof amount === 'number'}
			{amount.toFixed(8).replace(/\.?0+$/, '')}
		{:else if typeof amount === 'string'}
			{parseFloat(amount).toFixed(8).replace(/\.?0+$/, '')}
		{:else}
			{amount}
		{/if}
	</span>
{/snippet}

{#snippet DonationTxidCell({ txid }: { txid: string })}
	<code class="text-xs font-mono max-w-[150px] truncate block" title={txid}>{txid}</code>
{/snippet}

{#snippet DonationMessageCell({ message }: { message: string })}
	{#if message}
		<div class="flex items-center gap-2">
			<span class="text-sm text-muted-foreground truncate block max-w-[200px]" title={message}>{message}</span>
			<Button size="sm" variant="ghost" onclick={() => openDonationMessageDialog(message)}>
				{t('readMore') ?? 'Devamını oku'}
			</Button>
		</div>
	{:else}
		<span class="text-muted-foreground">—</span>
	{/if}
{/snippet}

{#snippet EmailLinkCell({ email }: { email: string })}
	<a href="mailto:{email}" class="text-primary hover:underline truncate block max-w-[200px]" title={email}>
		{email}
	</a>
{/snippet}

{#snippet PhoneLinkCell({ phone }: { phone: string })}
	<a href="tel:{phone}" class="text-primary hover:underline truncate block max-w-[150px]" title={phone}>
		{phone}
	</a>
{/snippet}

{#snippet NicknameLinkCell({ nickname }: { nickname: string })}
	<a href={l(`/${nickname}`)} class="text-primary hover:underline truncate block max-w-[200px]" title={nickname}>
		{nickname}
	</a>
{/snippet}

{#snippet UniversalStatusBadge({ status, type = "default", lastActionBy, lastActionAt, lastActionType }: { status: string | null | undefined; type?: "default" | "user" | "article" | "donation" | "report" | "contact" | "comment"; lastActionBy?: string | null; lastActionAt?: string | null; lastActionType?: string | null })}
	{@const getStatusConfig = (status: string | null | undefined, type: string) => {
		if (!status) return { variant: "outline", class: "text-muted-foreground", label: t('unknown') ?? "Bilinmeyen", icon: "HelpCircleIcon" };

		const statusLower = status.toLowerCase();

		// Common status configurations
		const commonConfigs = {
			pending: { variant: "outline", class: "text-yellow-600 border-yellow-600", label: "Beklemede", icon: "ClockIcon" },
			approved: { variant: "outline", class: "text-green-600 border-green-600", label: "Onaylandı", icon: "CircleCheckFilledIcon" },
			rejected: { variant: "outline", class: "text-red-600 border-red-600", label: "Reddedildi", icon: "CircleXIcon" },
			resolved: { variant: "outline", class: "text-green-600 border-green-600", label: "Çözüldü", icon: "CircleCheckFilledIcon" },
			reviewing: { variant: "outline", class: "text-blue-600 border-blue-600", label: "İnceleniyor", icon: "TimerIcon" },
			published: { variant: "outline", class: "text-green-600 border-green-600", label: "Yayında", icon: "CircleCheckFilledIcon" },
			draft: { variant: "outline", class: "text-gray-600 border-gray-600", label: "Taslak", icon: "EditIcon" },
			hidden: { variant: "outline", class: "text-orange-600 border-orange-600", label: "Gizli", icon: "EyeOffIcon" },
		};

		// Type-specific configurations
		if (type === "contact") {
			const contactConfigs: Record<string, { variant: string; class: string; label: string; icon: string }> = {
				pending: { variant: "outline", class: "text-yellow-600 border-yellow-600", label: "Beklemede", icon: "ClockIcon" },
				read: { variant: "outline", class: "text-blue-600 border-blue-600", label: "Okundu", icon: "EyeIcon" },
				responded: { variant: "outline", class: "text-green-600 border-green-600", label: "Yanıtlandı", icon: "CircleCheckFilledIcon" },
				archived: { variant: "outline", class: "text-gray-600 border-gray-600", label: "Arşivlendi", icon: "ArchiveIcon" },
			};
			if (contactConfigs[statusLower]) {
				return contactConfigs[statusLower];
			}
		}

		if (type === "comment") {
			const commentConfigs: Record<string, { variant: string; class: string; label: string; icon: string }> = {
				active: { variant: "outline", class: "text-green-600 border-green-600", label: "Aktif", icon: "CircleCheckFilledIcon" },
				hidden: { variant: "outline", class: "text-orange-600 border-orange-600", label: "Gizli", icon: "EyeOffIcon" },
				deleted: { variant: "destructive", class: "", label: "Silindi", icon: "Trash2Icon" },
			};
			if (commentConfigs[statusLower]) {
				return commentConfigs[statusLower];
			}
		}

		if (type === "user") {
			if (statusLower === "silinecek") {
				return { variant: "destructive", class: "", label: getDeletionRemainingLabel?.(null) || "Silinecek", icon: "TimerIcon" };
			}
			if (statusLower === "active") {
				return { variant: "outline", class: "text-green-600 border-green-600", label: "Aktif", icon: "CircleCheckFilledIcon" };
			}
		}

		// Return common config if found
		if (commonConfigs[statusLower]) {
			return commonConfigs[statusLower];
		}

		// Default fallback
		return { variant: "outline", class: "text-muted-foreground", label: status, icon: null };
	}}

	{@const config = getStatusConfig(status, type)}
	{@const icon = config.icon === "HelpCircleIcon" ? HelpCircleIcon :
		config.icon === "ClockIcon" ? ClockIcon :
		config.icon === "CircleCheckFilledIcon" ? CircleCheckFilledIcon :
		config.icon === "CircleXIcon" ? CircleXIcon :
		config.icon === "TimerIcon" ? TimerIcon :
		config.icon === "EyeOffIcon" ? EyeOffIcon :
		config.icon === "EyeIcon" ? EyeIcon :
		config.icon === "ArchiveIcon" ? ArchiveIcon :
		null}

	{@const hasLastAction = lastActionBy || lastActionAt}
	{@const tooltipText = hasLastAction
		? `${lastActionType || 'Son işlem'}: ${lastActionBy || 'Bilinmiyor'}${lastActionAt ? ` (${formatDateTime(lastActionAt)})` : ''}`
		: null}

	<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger>
				<Badge variant={config.variant} class={`px-2 py-1 ${config.class} ${hasLastAction ? 'cursor-help' : ''}`}>
					{#if icon}
						{@const IconComponent = icon}
						<IconComponent class="mr-1 h-3 w-3" />
					{/if}
					{config.label}
				</Badge>
			</Tooltip.Trigger>
			{#if hasLastAction}
				<Tooltip.Content>
					<p>{tooltipText}</p>
				</Tooltip.Content>
			{/if}
		</Tooltip.Root>
	</Tooltip.Provider>
{/snippet}