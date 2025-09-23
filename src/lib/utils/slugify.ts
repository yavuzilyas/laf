// src/lib/utils/slugify.ts
export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

export function generateSlugs(title: string, existingSlugs: Set<string>): string {
    let baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 1;
    
    while (existingSlugs.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
    
    return slug;
}