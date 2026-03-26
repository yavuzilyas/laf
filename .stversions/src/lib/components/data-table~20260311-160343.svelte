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
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import {
		FlexRender,
		renderComponent,
		renderSnippet,
	} from "$lib/components/ui/data-table/index.js";
	  import { ClockIcon, TimerIcon, CircleXIcon, HelpCircleIcon } from "@lucide/svelte";

	import LayoutColumnsIcon from "@tabler/icons-svelte/icons/layout-columns";
	import GripVerticalIcon from "@tabler/icons-svelte/icons/grip-vertical";
	import ChevronDownIcon from "@tabler/icons-svelte/icons/chevron-down";
	import PlusIcon from "@tabler/icons-svelte/icons/plus";
	import ChevronsLeftIcon from "@tabler/icons-svelte/icons/chevrons-left";
	import ChevronLeftIcon from "@tabler/icons-svelte/icons/chevron-left";
	import ChevronRightIcon from "@tabler/icons-svelte/icons/chevron-right";
	import ChevronsRightIcon from "@tabler/icons-svelte/icons/chevrons-right";
	import CircleCheckFilledIcon from "@tabler/icons-svelte/icons/circle-check-filled";
	import LoaderIcon from "@tabler/icons-svelte/icons/loader";
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
	import { t } from '$lib/stores/i18n.svelte.js';
	import DataTableCheckbox from "./data-table-checkbox.svelte";
	import { DragDropProvider } from "@dnd-kit-svelte/svelte";
	import { move } from "@dnd-kit/helpers";
	import { useSortable } from "@dnd-kit-svelte/svelte/sortable";
	import PasswordVerificationPopup from "$lib/components/PasswordVerificationPopup.svelte";

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

	type ReportsBulkAction = "reviewing" | "resolved" | "rejected" | "delete";
	const reportsBulkActionOptions: { value: ReportsBulkAction; label: string }[] = [
		{ value: "reviewing", label: t('reviewing') ?? 'İnceleniyor' },
		{ value: "resolved", label: t('resolved') ?? 'Çözüldü' },
		{ value: "rejected", label: t('rejected') ?? 'Reddedildi' },
		{ value: "delete", label: t('delete') ?? 'Sil' },
	];
	let selectedReportsBulkAction = $state<ReportsBulkAction>("reviewing");
	let reportsBulkProcessing = $state(false);
	type PendingBulkAction = "approve" | "reject";
	const pendingBulkActionOptions: { value: PendingBulkAction; label: string }[] = [
		{ value: "approve", label: t('bulkApprove') ?? t('common.approve') },
		{ value: "reject", label: t('bulkReject') ?? t('common.reject') },
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
			console.error('Failed to requeue article:', error);
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
			console.error('Article moderation action failed:', error);
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
			return t('deletionImminent');
		}
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		if (diffHours >= 1) {
			return t('deletionHours', { count: diffHours });
		}
		const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
		return t('deletionMinutes', { count: diffMinutes });
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
					label = target.content ?? t('unknown');
					href = target.articleSlug ? `/article/${target.articleSlug}#comment-${target.id}` : '#';
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
				if (!status) return t('unknown');
				if (status === 'pending') return t('pending') ?? 'Beklemede';
				if (status === 'reviewing') return t('reviewing') ?? 'İnceleniyor';
				if (status === 'resolved') return t('resolved') ?? 'Çözüldü';
				if (status === 'rejected') return t('rejected') ?? 'Reddedildi';
				return status;
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

	function openReportReasonsDialog(reasons: string[]) {
		reportReasonsDialogText = reasons;
		showReportReasonsDialog = true;
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
			console.error('Reports bulk action failed:', error);
			toast.error(t('error'));
		} finally {
			reportsBulkProcessing = false;
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
				console.error('Error executing verified action:', error);
				toast.error('İşlem sırasında bir hata oluştu');
			}
		}
	}

	function handleMnemonicCancel() {
		showPasswordVerification = false;
		pendingAction = null;
	}

	async function createEventFromReport(report: ReportRow) {
		console.log('Creating event from report:', report);
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
			console.error('Error creating event:', error);
			toast.error('Olay oluşturulurken hata oluştu');
		}
	}

	async function viewEventHistory(report: ReportRow) {
		try {
			const response = await fetch(`/api/events?targetId=${report.id}&targetType=${report.type}`);
			
			if (response.ok) {
				const events = await response.json();
				// Here you could open a modal or navigate to an events page
				console.log('Event history:', events);
				toast.success(`${events.length} olay bulundu`);
			} else {
				toast.error('Olay geçmişi alınamadı');
			}
		} catch (error) {
			console.error('Error fetching event history:', error);
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
			console.error('Error creating user event:', error);
			toast.error('Kullanıcı olayı oluşturulurken hata oluştu');
		}
	}

	async function viewUserEventHistory(userId: string) {
		try {
			const response = await fetch(`/api/events?targetId=${userId}&targetType=user`);
			
			if (response.ok) {
				const events = await response.json();
				console.log('User event history:', events);
				toast.success(`${events.length} kullanıcı olayı bulundu`);
			} else {
				toast.error('Kullanıcı olay geçmişi alınamadı');
			}
		} catch (error) {
			console.error('Error fetching user event history:', error);
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
				return user.nickname || user.email?.split('@')[0] || t('unknown');
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
				return user.email || t('unknown');
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
					return renderSnippet(DataTableStatus, { row });
				}
				const status = row.original.status;
				if (status === "silinecek") {
					const countdownLabel = getDeletionRemainingLabel(row.original.deletionTimestamp);
					return renderSnippet(DeletionBadge, { countdownLabel });
				}
				return renderSnippet(DataTableStatus, { row });
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
			cell: ({ row }) => renderSnippet(PendingArticleStatus, { row }),
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
		enableRowSelection: false,
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
			id: "reports",
			label: t('reports') ?? t('reports') ?? "Raporlar",
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
			console.error('Failed to fetch reports:', error);
			toast.error(t('error'));
		} finally {
			loadingReports = false;
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
			console.error('Failed to fetch pending articles:', error);
			toast.error(t('fetchPendingError'));
		} finally {
			loadingPending = false;
		}
	}

	$effect(() => {
		const currentView = view;
		const statusFilter = articlesStatusFilter;
		if (currentView === 'pending-articles') {
			void fetchPendingArticles();
		}
		if (currentView === 'reports') {
			void fetchReports();
		}
	});

	function handleTabChange(event: CustomEvent<{ value: string }>) {
		const nextView = event.detail?.value;
		if (nextView === 'pending-articles') {
			void fetchPendingArticles(true);
		}
		if (nextView === 'reports') {
			void fetchReports(true);
		}
	}

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
			console.error('Failed to approve article:', error);
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
			console.error('Failed to reject article:', error);
			toast.error(t('rejectFailed'));
		}
	}

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
				console.error("Bulk action failed", error);
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
		
	</div>
	<Tabs.Content value="pending-articles" class="relative flex flex-col gap-4 overflow-auto px-2 sm:px-4 lg:px-6">
		<div class="overflow-x-auto rounded-lg border">
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
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
					<span class="ml-2">{t('common.loading')}</span>
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
		<div class="overflow-x-auto rounded-lg border">
			<div class="flex flex-col gap-3 p-2 sm:flex-row sm:items-center sm:justify-between sm:p-4">
				<Input
					placeholder={t('search')}
					class="h-9 w-full sm:max-w-sm text-sm sm:text-base"
					value={reportsTable.getState().globalFilter ?? ''}
					oninput={(e) => reportsTable.setGlobalFilter(e.currentTarget.value)}
				/>
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
					<Select.Root type="single" bind:value={reportsTypeFilter}>
						<Select.Trigger size="sm" class="w-full min-w-[10rem] justify-between ">
							{reportsTypeFilter === 'all'
								? (t('common.all') ?? 'Tümü')
								: reportsTypeFilter === 'profile'
									? (t('user') ?? 'Kullanıcı')
									: reportsTypeFilter === 'article'
										? (t('article') ?? 'Makale')
										: reportsTypeFilter === 'error'
											? (t('error') ?? 'Hata')
											: (t('comment') ?? 'Yorum')}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="all">{t('common.all') ?? 'Tümü'}</Select.Item>
							<Select.Item value="profile">{t('user') ?? 'Kullanıcı'}</Select.Item>
							<Select.Item value="article">{t('article') ?? 'Makale'}</Select.Item>
							<Select.Item value="comment">{t('comment') ?? 'Yorum'}</Select.Item>
							<Select.Item value="error">{t('error') ?? 'Hata'}</Select.Item>
						</Select.Content>
					</Select.Root>
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
								<LoaderIcon class="mr-2 h-4 w-4 animate-spin" />
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
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
					<span class="ml-2">{t('common.loading')}</span>
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

	<Tabs.Content value="kullanicilar" class="relative flex flex-col gap-4 overflow-auto px-2 sm:px-4 lg:px-6">
		<div class="overflow-x-auto rounded-lg border">
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
							<LoaderIcon class="mr-2 h-4 w-4 animate-spin" />
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

{#snippet ReportTargetLink({ href, label }: { href: string; label: string })}
	<a href={href} class="underline underline-offset-2 hover:opacity-80" rel="noreferrer">
		{label}
	</a>
{/snippet}

{#snippet ReportReasonCell({ label, reasons }: { label: string; reasons: string[] })}
	<div class="flex items-center gap-2">
		<span class="truncate">{label}</span>
		{#if reasons.length > 1 || label.length > 80}
			<Button size="sm" variant="ghost" onclick={() => openReportReasonsDialog(reasons)}>
				{t('readMore') ?? 'Devamını oku'}
			</Button>
		{/if}
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
			<DropdownMenu.Item onclick={() => createEventFromReport(row.original)}>
				<ClockIcon class="h-4 w-4 mr-2" />
				{t('createEvent') ?? 'Olay Oluştur'}
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={() => viewEventHistory(row.original)}>
				<TimerIcon class="h-4 w-4 mr-2" />
				{t('eventHistory') ?? 'Olay Geçmişi'}
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

{#snippet DataTableStatus({ row }: { row: Row<Schema> })}
	<Badge variant="outline" class="text-muted-foreground px-2 py-1">
		{#if !row.original}
			<HelpCircleIcon class="mr-1 h-3 w-3" />
			{t('unknown')}
		{:else if row.original.status === t('statusDone')}
			<CircleCheckFilledIcon class="mr-1 h-3 w-3 fill-green-500 dark:fill-green-400" />
			{row.original.status}
		{:else if row.original.status === "silinecek"}
			<TimerIcon class="mr-1 h-3 w-3" />
			{getDeletionRemainingLabel(row.original.deletionTimestamp)}
		{:else}
			<ClockIcon class="mr-1 h-3 w-3" />
			{row.original.status || t('unknown')}
		{/if}
	</Badge>
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
					<DropdownMenu.Item onclick={() => createUserEvent(row.original)}>
						<ClockIcon class="h-4 w-4" />
						{t('createEvent') ?? 'Olay Oluştur'}
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => viewUserEventHistory(rowId)}>
						<TimerIcon class="h-4 w-4" />
						{t('eventHistory') ?? 'Olay Geçmişi'}
					</DropdownMenu.Item>
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

{#snippet PendingArticleStatus({ row }: { row: Row<PendingArticleRow> })}
	{@const article = row.original}
	<Badge variant="outline" class="px-2 py-1 capitalize">
		{article?.status ?? t('unknown')}
	</Badge>
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

{#snippet PendingDragHandle()}
	<Button
		variant="ghost"
		size="icon"
		class="text-muted-foreground size-7 hover:bg-transparent cursor-grab"
		disabled
	>
		<GripVerticalIcon class="text-muted-foreground size-3" />
		<span class="sr-only">{t('dragToReorder')}</span>
	</Button>
{/snippet}