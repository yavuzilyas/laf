import { z } from "zod";

export const schema = z.object({
	id: z.union([z.number(), z.string()]),
	header: z.string(),
	nickname: z.string().optional(),
	type: z.string().default("user"),
	status: z.string(),
	target: z.string(),
	limit: z.string(),
	reviewer: z.string(),
	email: z.string().nullable().optional(),
	banned: z.boolean().optional(),
	hidden: z.boolean().optional(),
	deletionTimestamp: z.string().optional().nullable(),
	updatedAt: z.string().optional().nullable(),
	phone_number: z.string().nullable().optional(),
	location: z.string().nullable().optional(),
	name: z.string().nullable().optional(),
	surname: z.string().nullable().optional(),
	// Moderation fields
	hidden_by: z.string().nullable().optional(),
	hidden_at: z.string().nullable().optional(),
	banned_by: z.string().nullable().optional(),
	banned_at: z.string().nullable().optional(),
	moderation_action: z.object({
		action: z.string(),
		moderatorId: z.string().optional(),
		moderatorName: z.string().optional(),
		timestamp: z.string().optional()
	}).nullable().optional()
});

export type Schema = z.infer<typeof schema>;
