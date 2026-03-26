/**
 * File size limits for edra editor media components
 * All sizes are in bytes
 */

export const FILE_SIZE_LIMITS = {
	// Image files - 5MB
	image: 15 * 1024 * 1024,
	
	// Audio files - 10MB (audio files are typically larger)
	audio: 2 * 1024 * 1024,
	
	// Video files - 50MB (videos are much larger)
	video: 4 * 1024 * 1024,
	
	// General file uploads - 10MB
	file: 8 * 1024 * 1024
} as const;

export type MediaType = keyof typeof FILE_SIZE_LIMITS;

/**
 * Get file size limit for a specific media type
 */
export function getFileSizeLimit(mediaType: MediaType): number {
	return FILE_SIZE_LIMITS[mediaType];
}

/**
 * Check if file size is within limits for its media type
 */
export function isFileSizeValid(file: File, mediaType: MediaType): boolean {
	return file.size <= FILE_SIZE_LIMITS[mediaType];
}

/**
 * Get human-readable file size string
 */
export function formatFileSize(bytes: number): string {
	const units = ['B', 'KB', 'MB', 'GB'];
	let size = bytes;
	let unitIndex = 0;
	
	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex++;
	}
	
	return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Get error message for file size limit
 */
export function getFileSizeError(file: File, mediaType: MediaType): string {
	const limit = FILE_SIZE_LIMITS[mediaType];
	return `File too large. Maximum size for ${mediaType} files is ${formatFileSize(limit)}, but ${file.name} is ${formatFileSize(file.size)}`;
}
