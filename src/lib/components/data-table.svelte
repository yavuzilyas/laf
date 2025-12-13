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
	  import { ClockIcon, TimerIcon, CircleXIcon } from "@lucide/svelte";

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
	import DataTableCellViewer from "./data-table-cell-viewer.svelte";
	import { createRawSnippet } from "svelte";
	import DataTableReviewer from "./data-table-reviewer.svelte";
	import { DragDropProvider } from "@dnd-kit-svelte/svelte";
	import { move } from "@dnd-kit/helpers";
	import { useSortable } from "@dnd-kit-svelte/svelte/sortable";
	import MnemonicVerificationPopup from "$lib/components/MnemonicVerificationPopup.svelte";

	type CurrentUser = {
		id: string;
		role?: string;
	};

	type PendingArticleRow = {
		id: string;
		title: string;
		author: string;
		authorNickname?: string | null;
		authorName?: string | null;
		authorId?: string | null;
		authorRole?: string | null;
		category: string;
		status: string;
		submittedAt: string | null;
		language: string;
		tags?: string[];
		slug?: string | null;
		hidden?: boolean;
		deletedAt?: string | null;
		createdAt?: string | null;
		updatedAt?: string | null;
		pendingStatus?: string | null;
	};

	let {
		data,
		pendingArticlesInitial = [],
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
	let selectedArticles = $state<Set<string>>(new Set());
	let showArticleBulkActions = $state(false);
	let pendingPagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let pendingSorting = $state<SortingState>([]);
	let pendingColumnFilters = $state<ColumnFiltersState>([]);
	let pendingRowSelection = $state<RowSelectionState>({});
	let pendingColumnVisibility = $state<VisibilityState>({});
	let pendingGlobalFilter = $state<string>("");
	type PendingBulkAction = "approve" | "reject";
	const pendingBulkActionOptions: { value: PendingBulkAction; label: string }[] = [
		{ value: "approve", label: t('moderation.bulkApprove') ?? t('common.approve') },
		{ value: "reject", label: t('moderation.bulkReject') ?? t('common.reject') },
	];
	let selectedPendingBulkAction = $state<PendingBulkAction>("approve");
	let pendingBulkProcessing = $state(false);
	let showRejectDialog = $state(false);
	let pendingRejectArticle = $state<PendingArticleRow | null>(null);
	let rejectReason = $state("");
	let articlesStatusFilter = $state<"all" | "pending" | "published" | "rejected" | "draft">("all");
	const articleStatusOptions = [
		{ value: "all", label: t('moderation.allStatuses') ?? t('common.all') ?? "Tümü" },
		{ value: "pending", label: t('moderation.pending') ?? t('dataTable.pending') ?? "Beklemede" },
		{ value: "published", label: t('moderation.published') ?? t('common.published') ?? "Yayında" },
		{ value: "rejected", label: t('moderation.rejected') ?? t('common.rejected') ?? "Reddedildi" },
		{ value: "draft", label: t('moderation.draft') ?? t('common.draft') ?? "Taslak" },
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
				toast.success(t('moderation.articleRequeued') ?? 'Makale yeniden incelemeye alındı');
				await fetchPendingArticles(true);
			} else {
				const error = await response.json();
				toast.error(error.error || (t('moderation.requeueFailed') ?? 'Beklemeye alma başarısız'));
			}
		} catch (error) {
			console.error('Failed to requeue article:', error);
			toast.error(t('moderation.requeueFailed') ?? 'Beklemeye alma başarısız');
		}
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
					reason: reason ?? (action === 'delete' ? t('moderation.deleteReasonDefault') ?? 'Moderasyon tarafından silindi' : undefined)
				})
			});

			if (response.ok) {
				let message: string;
				if (action === 'delete') {
					message = t('moderation.articleDeleted') ?? 'Makale silindi';
				} else if (action === 'hide') {
					message = t('moderation.articleHidden') ?? 'Makale gizlendi';
				} else {
					message = t('moderation.articleUnhidden') ?? 'Makale görünür yapıldı';
				}
				toast.success(message);
				await fetchPendingArticles(true);
			} else {
				const error = await response.json();
				toast.error(error.error || (t('moderation.actionFailed')));
			}
		} catch (error) {
			console.error('Article moderation action failed:', error);
			toast.error(t('moderation.actionFailed'));
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
		if (!deadline) return t('dataTable.toBeDeleted');
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
		if (!value) return t('dataTable.unknown');
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return t('dataTable.unknown');
		return date.toLocaleDateString('tr-TR', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	type BulkAction = "ban" | "unban" | "hide" | "unhide" | "delete" | "undoDelete";
	const bulkActionOptions: { value: BulkAction; label: string }[] = [
		{ value: "ban", label: t('dataTable.bulkBan') },
		{ value: "unban", label: t('dataTable.bulkUnban') },
		{ value: "hide", label: t('dataTable.bulkHide') },
		{ value: "unhide", label: t('dataTable.bulkUnhide') },
		{ value: "delete", label: t('dataTable.bulkDelete') },
		{ value: "undoDelete", label: t('dataTable.bulkUndoDelete') },
	];
	let selectedBulkAction = $state<BulkAction>("ban");
	let bulkProcessing = $state(false);
	let showMnemonicVerification = $state(false);
	let pendingAction = $state<(() => void | Promise<void>) | null>(null);

	function requestMnemonicVerification(action: () => void | Promise<void>) {
		pendingAction = action;
		showMnemonicVerification = true;
	}

	async function handleMnemonicVerified() {
		const action = pendingAction;
		showMnemonicVerification = false;
		pendingAction = null;
		if (action) {
			try {
				await action();
			} catch (error) {
				console.error("Mnemonic gated action failed", error);
			}
		}
	}

	function handleMnemonicCancel() {
		showMnemonicVerification = false;
		pendingAction = null;
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
					"aria-label": t('dataTable.selectAll'),
				});
			},
			cell: ({ row }) =>
				row.getCanSelect()
					? renderComponent(DataTableCheckbox, {
						checked: row.getIsSelected(),
						onCheckedChange: (value) => row.toggleSelected(!!value),
						"aria-label": t('dataTable.selectRow'),
					})
					: null,
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "nickname", 
			header: t('dataTable.nickname'),
			cell: ({ row }) => {
				if (!row.original) return "-";
				const user = row.original;
				return user.nickname || user.header?.split(' ')[0] || "-";
			},
		},
		{
			accessorKey: "type",
			header: t('dataTable.role'),
			cell: ({ row }) => {
				if (!row.original) return t('dataTable.unknown');
				const role = row.original.type;
					if (role === "admin") return t('dataTable.admin');
					if (role === "moderator") return t('dataTable.moderator');
					return t('dataTable.user');
			},
		},
		{
			accessorKey: "email",
			header: t('dataTable.email'),
			cell: ({ row }) => {
				if (!row.original) return t('dataTable.unknown');
				const user = row.original;
				return user.email || t('dataTable.unknown');
			},
		},
		{
			accessorKey: "limit",
			header: t('dataTable.openingDate'),
			cell: ({ row }) => row.original?.limit || t('dataTable.unknown'),
		},
		{
			accessorKey: "status",
			header: t('dataTable.status'),
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
			id: "pending-drag",
			header: () => null,
			cell: () => renderSnippet(DragHandle),
			enableHiding: false,
			enableSorting: false,
		},
		{
			accessorKey: "title",
			header: t('moderation.articleTitle') ?? t('dataTable.pendingTitle'),
			cell: ({ row }) => renderSnippet(PendingArticleTitle, { row }),
		},
		{
			accessorKey: "author",
			header: t('moderation.author') ?? t('dataTable.pendingAuthor'),
			cell: ({ row }) => row.original?.author || t('dataTable.unknown'),
		},
		{
			accessorKey: "category",
			header: t('moderation.category'),
		},
		{
			accessorKey: "language",
			header: t('moderation.language') ?? 'Dil',
			cell: ({ row }) => row.original?.language?.toUpperCase?.() ?? t('dataTable.unknown'),
		},
		{
			accessorKey: "submittedAt",
			header: t('moderation.submitted'),
			cell: ({ row }) => formatDateTime(row.original?.submittedAt),
		},
		{
			accessorKey: "status",
			header: t('dataTable.status'),
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
			label: t('dataTable.users'),
			badge: 0,
		},
		{
			id: "raporlar",
			label: t('dataTable.reports'),
			badge: 3,
		},
		{
			id: "pending-articles",
			label: t('moderation.articles') ?? t('dataTable.pendingArticles'),
			badge: 0,
		}

		
	];

	let view = $state(views[0].id);

	const defaultRejectReason = t('moderation.defaultRejectReason') ?? 'İçerik yönergelere uygun değil';
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
					result.articles?.map((article) => ({
						id: article.id ?? crypto.randomUUID(),
						title:
							article.title ||
							article.translations?.[article.defaultLanguage ?? ""]?.title ||
							t('dataTable.unknown'),
						author:
							article.authorNickname ||
							article.authorName ||
							article.authorId ||
							t('dataTable.unknown'),
						authorNickname: article.authorNickname ?? null,
						authorName: article.authorName ?? null,
						authorId: article.authorId ?? null,
						authorRole: article.authorRole ?? null,
						category: article.category || t('dataTable.unknown'),
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
			toast.error(t('dataTable.fetchPendingError'));
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
	});

	function handleTabChange(event: CustomEvent<{ value: string }>) {
		const nextView = event.detail?.value;
		if (nextView === 'pending-articles') {
			void fetchPendingArticles(true);
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
		requestMnemonicVerification(() => rejectArticle(targetArticleId, reasonText));
	}

	async function approveArticle(articleId: string) {
		try {
			const response = await fetch(`/api/articles/${articleId}/review`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'approve' })
			});

			if (response.ok) {
				toast.success(t('moderation.articleApproved'));
				await fetchPendingArticles(true);
			} else {
				const error = await response.json();
				toast.error(error.error || t('moderation.approveFailed'));
			}
		} catch (error) {
			console.error('Failed to approve article:', error);
			toast.error(t('moderation.approveFailed'));
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
				toast.success(t('moderation.articleRejected'));
				await fetchPendingArticles(true);
			} else {
				const error = await response.json();
				toast.error(error.error || t('moderation.rejectFailed'));
			}
		} catch (error) {
			console.error('Failed to reject article:', error);
			toast.error(t('moderation.rejectFailed'));
		}
	}

	let viewLabel = $derived(views.find((v) => view === v.id)?.label ?? t('dataTable.selectView'));
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
			toast.warning(t('dataTable.selectUser'));
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
				await handlers[selectedBulkAction](row.original.id);
			} catch (error) {
				console.error("Bulk action failed", error);
				hasError = true;
				break;
			}
		}
		bulkProcessing = false;
		table.resetRowSelection();
		if (hasError) {
			toast.error(t('dataTable.error'));
			return;
		}
		toast.success(t('dataTable.success'));
	}
</script>

<Tabs.Root bind:value={view} class="w-full flex-col justify-start gap-6" on:change={handleTabChange}>
	<div class="flex items-center justify-between px-4 lg:px-6">
		<Label for="view-selector" class="sr-only">{t('dataTable.view')}</Label>

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
					placeholder={t('dataTable.search')}
					class="h-9 w-full sm:max-w-sm text-sm sm:text-base"
					value={pendingTable.getState().globalFilter ?? ''}
					oninput={(e) => pendingTable.setGlobalFilter(e.currentTarget.value)}
				/>
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
					<Select.Root type="single" bind:value={articlesStatusFilter}>
						<Select.Trigger size="sm" class="w-full min-w-[10rem] justify-between ">
							{articleStatusOptions.find((option) => option.value === articlesStatusFilter)?.label}
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
								<span class="hidden lg:inline">{t('dataTable.customizeColumns')}</span>
								<span class="lg:hidden">{t('dataTable.columns')}</span>
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
										{t('moderation.noPendingArticles')}
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
				{t('dataTable.rowsSelected', { selected: pendingTable.getFilteredSelectedRowModel().rows.length, total: pendingTable.getFilteredRowModel().rows.length })}
			</div>
			<div class="flex w-full items-center justify-between gap-2 sm:gap-4 lg:w-fit">
				<div class="hidden items-center gap-2 lg:flex">
					<Label for="pending-rows-per-page" class="text-sm font-medium">{t('dataTable.rowsPerPage')}</Label>
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
					{t('dataTable.pageOf', { current: pendingTable.getState().pagination.pageIndex + 1, total: pendingTable.getPageCount() || 1 })}
				</div>
				<div class="ms-auto flex items-center gap-2 lg:ms-0">
					<Button
						variant="outline"
						class="h-8 w-8 p-0 min-w-[2rem] lg:flex"
						onclick={() => pendingTable.setPageIndex(0)}
						disabled={!pendingTable.getCanPreviousPage()}
					>
						<span class="sr-only">{t('dataTable.firstPage')}</span>
						<ChevronsLeftIcon />
					</Button>
					<Button
						variant="outline"
						class="size-8"
						size="icon"
						onclick={() => pendingTable.previousPage()}
						disabled={!pendingTable.getCanPreviousPage()}
					>
						<span class="sr-only">{t('dataTable.previousPage')}</span>
						<ChevronLeftIcon />
					</Button>
					<Button
						variant="outline"
						class="size-8"
						size="icon"
						onclick={() => pendingTable.nextPage()}
						disabled={!pendingTable.getCanNextPage()}
					>
						<span class="sr-only">{t('dataTable.nextPage')}</span>
						<ChevronRightIcon />
					</Button>
					<Button
						variant="outline"
						class="hidden size-8 lg:flex"
						size="icon"
						onclick={() => pendingTable.setPageIndex(pendingTable.getPageCount() - 1)}
						disabled={!pendingTable.getCanNextPage()}
					>
						<span class="sr-only">{t('dataTable.lastPage')}</span>
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
				placeholder={t('dataTable.search')}
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
								<span class="hidden lg:inline">{t('dataTable.customizeColumns')}</span>
								<span class="lg:hidden">{t('dataTable.columns')}</span>
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
						onclick={() => requestMnemonicVerification(handleBulkAction)}
						disabled={!hasBulkSelection || bulkProcessing}
					>
						{#if bulkProcessing}
							<LoaderIcon class="mr-2 h-4 w-4 animate-spin" />
							{t('dataTable.processing')}
						{:else}
							{t('dataTable.bulkApply')}
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
									{t('dataTable.noResults')}
								</Table.Cell>
							</Table.Row>
						{/if}
					</Table.Body>
				</Table.Root>
			</DragDropProvider>
		</div>
		<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-2 sm:px-4 py-2">
			<div class="text-muted-foreground text-xs sm:text-sm">
				{t('dataTable.rowsSelected', { selected: table.getFilteredSelectedRowModel().rows.length, total: table.getFilteredRowModel().rows.length })}
			</div>
			<div class="flex w-full items-center justify-between gap-2 sm:gap-4 lg:w-fit">
				<div class="hidden items-center gap-2 lg:flex">
					<Label for="rows-per-page" class="text-sm font-medium">{t('dataTable.rowsPerPage')}</Label>
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
					{t('dataTable.pageOf', { current: table.getState().pagination.pageIndex + 1, total: table.getPageCount() })}
				</div>
				<div class="ms-auto flex items-center gap-2 lg:ms-0">
					<Button
						variant="outline"
						class="h-8 w-8 p-0 min-w-[2rem] lg:flex"
						onclick={() => table.setPageIndex(0)}
						disabled={!table.getCanPreviousPage()}
					>
						<span class="sr-only">{t('dataTable.firstPage')}</span>
						<ChevronsLeftIcon />
					</Button>
					<Button
						variant="outline"
						class="size-8"
						size="icon"
						onclick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						<span class="sr-only">{t('dataTable.previousPage')}</span>
						<ChevronLeftIcon />
					</Button>
					<Button
						variant="outline"
						class="size-8"
						size="icon"
						onclick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						<span class="sr-only">{t('dataTable.nextPage')}</span>
						<ChevronRightIcon />
					</Button>
					<Button
						variant="outline"
						class="hidden size-8 lg:flex"
						size="icon"
						onclick={() => table.setPageIndex(table.getPageCount() - 1)}
						disabled={!table.getCanNextPage()}
					>
						<span class="sr-only">{t('dataTable.lastPage')}</span>
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

<MnemonicVerificationPopup
	bind:openVerif={showMnemonicVerification}
	onVerified={handleMnemonicVerified}
	onCancel={handleMnemonicCancel}
/>

<AlertDialog.Root bind:open={showRejectDialog} onOpenChange={handleRejectDialogOpenChange}>
	<AlertDialog.Content class="w-[calc(100%-2rem)] max-w-lg">
		<AlertDialog.Header>
			<AlertDialog.Title>
				{t('moderation.rejectReasonTitle') ?? 'Red mesajı gönder'}
			</AlertDialog.Title>
			<AlertDialog.Description>
				{t('moderation.rejectReasonDescription') ?? 'Bu mesaj yazara bildirim olarak gönderilecektir.'}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<div class="space-y-2 py-2">
			<Label for="reject-reason">{t('moderation.rejectReasonLabel') ?? 'Mesaj'}</Label>
			<Textarea
				id="reject-reason"
				rows={4}
				bind:value={rejectReason}
				placeholder={t('moderation.rejectReasonPlaceholder') ?? 'Neden reddettiğinizi açıklayın...'}
			/>
		</div>
		<AlertDialog.Footer class="flex flex-col gap-2 sm:flex-row sm:justify-end">
			<AlertDialog.Cancel class="w-full sm:w-auto">
				{t('moderation.cancelReject') ?? t('common.cancel')}
			</AlertDialog.Cancel>
			<AlertDialog.Action class="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90" onclick={confirmRejectDialog}>
				{t('moderation.sendRejection') ?? 'Reddet ve bildir'}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

{#snippet DataTableLimit({ row }: { row: Row<Schema> })}
	{#if row.original}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
					loading: `Saving ${row.original.header}`,
					success: t('dataTable.statusDone'),
					error: t('dataTable.statusError'),
				});
			}}
		>
			<Label for="{row.original.id}-limit" class="sr-only">{t('dataTable.limit')}</Label>
			<Input
				class="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-end shadow-none focus-visible:border dark:bg-transparent"
				value={row.original.limit}
				id="{row.original.id}-limit"
			/>
		</form>
	{:else}
		{t('dataTable.unknown')}
	{/if}
{/snippet}

{#snippet DataTableTarget({ row }: { row: Row<Schema> })}
	{#if row.original}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
					loading: `Saving ${row.original.header}`,
					success: t('dataTable.statusDone'),
					error: t('dataTable.statusError'),
				});
			}}
		>
			<Label for="{row.original.id}-target" class="sr-only">{t('dataTable.target')}</Label>
			<Input
				class="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-end shadow-none focus-visible:border dark:bg-transparent"
				value={row.original.target}
				id="{row.original.id}-target"
			/>
		</form>
	{:else}
		{t('dataTable.unknown')}
	{/if}
{/snippet}

{#snippet DataTableType({ row }: { row: Row<Schema> })}
	<div class="w-full">
		<div class="flex items-center justify-between py-4">
			<div class="flex items-center gap-2">
				<Input
					placeholder={t('dataTable.search')}
					class="max-w-sm"
					value={((table.getColumn("nickname")?.getFilterValue()) as string) ?? ""}
					oninput={(e) => table.getColumn("nickname")?.setFilterValue(e.currentTarget.value)}
				/>
			</div>
		</div>
		<Badge variant="outline" class="text-muted-foreground px-1.5">
			{row.original?.type || t('dataTable.unknown')}
		</Badge>
	</div>
{/snippet}

{#snippet DataTableStatus({ row }: { row: Row<Schema> })}
	<Badge variant="outline" class="text-muted-foreground px-2 py-1">
		{#if !row.original}
			<HelpCircleIcon class="mr-1 h-3 w-3" />
			{t('dataTable.unknown')}
		{:else if row.original.status === t('dataTable.statusDone')}
			<CircleCheckFilledIcon class="mr-1 h-3 w-3 fill-green-500 dark:fill-green-400" />
			{row.original.status}
		{:else if row.original.status === "silinecek"}
			<TimerIcon class="mr-1 h-3 w-3" />
			{getDeletionRemainingLabel(row.original.deletionTimestamp)}
		{:else}
			<ClockIcon class="mr-1 h-3 w-3" />
			{row.original.status || t('dataTable.unknown')}
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
						<span class="sr-only">{t('dataTable.openMenu')}</span>
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-56">
				{#if row.original.status === "silinecek"}
					<DropdownMenu.Item onclick={() => requestMnemonicVerification(() => undoDeleteUser(rowId))}>
						<RotateCcwIcon class=" h-4 w-4" />
						{t('dataTable.undoDelete')}
					</DropdownMenu.Item>
				{:else}
					{#if !row.original.banned}
						<DropdownMenu.Item onclick={() => requestMnemonicVerification(() => banUser(rowId))}>
							<BanIcon class=" h-4 w-4" />
							{t('dataTable.banUser')}
						</DropdownMenu.Item>
					{:else}
						<DropdownMenu.Item onclick={() => requestMnemonicVerification(() => unbanUser(rowId))}>
							<CheckCircleIcon class=" h-4 w-4" />
							{t('dataTable.unbanUser')}
						</DropdownMenu.Item>
					{/if}
					{#if !row.original.hidden}
						<DropdownMenu.Item onclick={() => requestMnemonicVerification(() => hideUser(rowId))}>
							<EyeOffIcon class=" h-4 w-4" />
							{t('dataTable.hideUser')}
						</DropdownMenu.Item>
					{:else}
						<DropdownMenu.Item onclick={() => requestMnemonicVerification(() => unhideUser(rowId))}>
							<EyeIcon class=" h-4 w-4" />
							{t('dataTable.unhideUser')}
						</DropdownMenu.Item>
					{/if}
					{#if canPromoteRole(rowRole)}
						<DropdownMenu.Item onclick={() => requestMnemonicVerification(() => promoteToModerator(rowId))}>
							<UserPlusIcon class=" h-4 w-4" />
							{t('dataTable.promoteToModerator')}
						</DropdownMenu.Item>
					{/if}
					{#if canDemoteRole(rowRole)}
						<DropdownMenu.Item onclick={() => requestMnemonicVerification(() => demoteToUser(rowId))}>
							<UserMinusIcon class=" h-4 w-4" />
							{t('dataTable.demoteFromModerator')}
						</DropdownMenu.Item>
					{/if}
					<DropdownMenu.Separator />
					<DropdownMenu.Item variant="destructive" onclick={() => requestMnemonicVerification(() => deleteUser(rowId))}>
						<Trash2Icon class=" h-4 w-4" />
						{t('dataTable.deleteAccount')}
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
		<span class="sr-only">{t('dataTable.dragToReorder')}</span>
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
			{article?.title ?? t('dataTable.unknown')}
	</a>

	</div>
{/snippet}

{#snippet PendingArticleStatus({ row }: { row: Row<PendingArticleRow> })}
	{@const article = row.original}
	<Badge variant="outline" class="px-2 py-1 capitalize">
		{article?.status ?? t('dataTable.unknown')}
	</Badge>
{/snippet}

{#snippet PendingArticleActions({ row }: { row: Row<PendingArticleRow> })}
	{@const article = row.original}
	{@const canModerate = canModerateAuthor(article?.authorRole)}
	{@const canReview =
		article?.status !== 'published' &&
		article?.status !== 'rejected'}
	{#if article && canModerate}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger class="data-[state=open]:bg-muted text-muted-foreground flex size-8">
				{#snippet child({ props })}
					<Button variant="ghost" size="icon" {...props}>
						<DotsVerticalIcon />
						<span class="sr-only">{t('dataTable.openMenu')}</span>
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-56">
				<DropdownMenu.Label>{t('moderation.reviewActions') ?? 'İnceleme İşlemleri'}</DropdownMenu.Label>
				<DropdownMenu.Separator />
				{#if canReview}
					<DropdownMenu.Item onclick={() => requestMnemonicVerification(() => approveArticle(article.id))}>
						<CircleCheckFilledIcon class=" h-4 w-4" />
						{t('common.approve')}
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => openRejectDialog(article)}>
						<CircleXIcon class=" h-4 w-4" />
						{t('common.reject')}
					</DropdownMenu.Item>
				{/if}
				<DropdownMenu.Item onclick={() => requestMnemonicVerification(() => requeueArticle(article.id))}>
					<RotateCcwIcon class=" h-4 w-4" />
					{t('moderation.returnToPending') ?? 'Beklemeye al'}
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				{#if article.hidden}
					<DropdownMenu.Item onclick={() => requestMnemonicVerification(() => performArticleModerationAction('unhide', article.id))}>
						<EyeIcon class=" h-4 w-4" />
						{t('moderation.unhideArticle') ?? 'Göster'}
					</DropdownMenu.Item>
				{:else}
					<DropdownMenu.Item onclick={() => requestMnemonicVerification(() => performArticleModerationAction('hide', article.id))}>
						<EyeOffIcon class=" h-4 w-4" />
						{t('moderation.hideArticle') ?? 'Gizle'}
					</DropdownMenu.Item>
				{/if}
				<DropdownMenu.Item class="text-destructive focus:text-destructive" onclick={() =>
					requestMnemonicVerification(() =>
						performArticleModerationAction('delete', article.id, defaultRejectReason)
					)
				}>
					<Trash2Icon class=" h-4 w-4" />
					{t('moderation.deleteArticle') ?? 'Sil'}
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{:else}
		— 
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
		<span class="sr-only">{t('dataTable.dragToReorder')}</span>
	</Button>
{/snippet}
