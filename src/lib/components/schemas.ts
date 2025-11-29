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
});

export type Schema = z.infer<typeof schema>;
