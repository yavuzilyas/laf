<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { 
    Flag, 
    User, 
    FileText, 
    MessageSquare, 
    AlertTriangle,
    Clock,
    Eye,
    CheckCircle,
    XCircle
  } from '@lucide/svelte';

  export let report: any;
  export let onclick: () => void;

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return { variant: 'secondary', icon: Clock, text: 'Bekliyor' };
      case 'reviewing':
        return { variant: 'default', icon: Eye, text: 'İnceleniyor' };
      case 'resolved':
        return { variant: 'default', icon: CheckCircle, text: 'Çözüldü' };
      case 'dismissed':
        return { variant: 'destructive', icon: XCircle, text: 'Reddedildi' };
      default:
        return { variant: 'secondary', icon: Clock, text: status };
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'profile':
        return User;
      case 'article':
        return FileText;
      case 'comment':
        return MessageSquare;
      case 'error':
        return AlertTriangle;
      default:
        return Flag;
    }
  }

  function getTypeText(type: string) {
    switch (type) {
      case 'profile':
        return 'Profil';
      case 'article':
        return 'Makale';
      case 'comment':
        return 'Yorum';
      case 'error':
        return 'Hata';
      default:
        return type;
    }
  }

  function formatDate(date: string | Date) {
    const d = new Date(date);
    return d.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const statusBadge = getStatusBadge(report.status);
  const TypeIcon = getTypeIcon(report.type);
</script>

<Card class="cursor-pointer hover:shadow-md transition-shadow" onclick={onclick}>
  <CardContent class="p-4">
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center gap-2">
        <TypeIcon class="w-5 h-5 text-muted-foreground" />
        <span class="font-medium">{getTypeText(report.type)}</span>
        <Badge variant="secondary" class="text-xs">
          #{report.reportCount || 1}
        </Badge>
      </div>
      <Badge variant={statusBadge.variant} class="flex items-center gap-1 text-xs">
        <statusBadge.icon class="w-3 h-3" />
        {statusBadge.text}
      </Badge>
    </div>

    <div class="space-y-2">
      <!-- Target Information -->
      {#if report.target}
        <div class="text-sm">
          {#if report.target.title}
            <p class="font-medium truncate">{report.target.title}</p>
          {:else if report.target.username}
            <p class="font-medium">@{report.target.username}</p>
          {:else if report.target.content}
            <p class="truncate">{report.target.content}</p>
          {/if}
        </div>
      {/if}

      <!-- Report Reason -->
      <div class="text-sm text-muted-foreground">
        <p class="line-clamp-2">{report.reason}</p>
      </div>

      <!-- Meta Information -->
      <div class="flex items-center justify-between text-xs text-muted-foreground">
        <div class="flex items-center gap-2">
          {#if report.reporters && report.reporters.length > 0}
            <span>{report.reporters.length} bildiren</span>
          {/if}
          {#if report.reasons && report.reasons.length > 1}
            <span>{report.reasons.length} sebep</span>
          {/if}
        </div>
        <span>{formatDate(report.lastReportedAt || report.createdAt)}</span>
      </div>

      <!-- Reviewer Information -->
      {#if report.reviewedBy}
        <div class="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Eye class="w-3 h-3" />
          <span>{report.reviewedBy.username || report.reviewedBy.name}</span>
          {#if report.reviewedAt}
            <span>• {formatDate(report.reviewedAt)}</span>
          {/if}
        </div>
      {/if}
    </div>
  </CardContent>
</Card>
