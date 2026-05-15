import { z } from 'zod';

// Schemas for https://jsonplaceholder.typicode.com — a stable, no-auth public API used by the example tests. In your own project, replace these with schemas matching the API under test.
export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  username: z.string(),
  email: z.string().email(),
  address: z.object({
    street: z.string(),
    suite: z.string(),
    city: z.string(),
    zipcode: z.string(),
    geo: z.object({
      lat: z.string(),
      lng: z.string(),
    }),
  }),
  phone: z.string(),
  website: z.string(),
  company: z.object({
    name: z.string(),
    catchPhrase: z.string(),
    bs: z.string(),
  }),
});

export const UserListSchema = z.array(UserSchema);

export const PostCreateRequestSchema = z.object({
  title: z.string(),
  body: z.string(),
  userId: z.number(),
});

export const PostCreateResponseSchema = PostCreateRequestSchema.extend({
  id: z.number(),
});

export type User = z.infer<typeof UserSchema>;
export type PostCreateRequest = z.infer<typeof PostCreateRequestSchema>;
export type PostCreateResponse = z.infer<typeof PostCreateResponseSchema>;
