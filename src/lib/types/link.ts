export interface Link {
    id: string;
    title: string;
    url: string;
    description: string | null;
    icon_url: string | null;
    type: 'social' | 'donation' | 'external' | 'contact' | 'other';
    platform: string | null;
    display_order: number;
    is_active: boolean;
    click_count: number;
    created_by: string | null;
    updated_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface LinkInput {
    title: string;
    url: string;
    description?: string;
    icon_url?: string;
    type?: 'social' | 'donation' | 'external' | 'contact' | 'other';
    platform?: string;
    display_order?: number;
    is_active?: boolean;
}
