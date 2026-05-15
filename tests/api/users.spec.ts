import { test, expect } from '@fixtures/base';
import {
  PostCreateResponseSchema,
  UserListSchema,
  UserSchema,
} from '@api/schemas/users';

test.describe('Users API @api', () => {
  test('GET /users returns a validated user list', async ({ apiClient }) => {
    const response = await apiClient.get('/users');
    await apiClient.expectOk(response);

    const body = await apiClient.parseAndValidate(response, UserListSchema);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]?.email).toMatch(/@/);
  });

  test('GET /users/:id returns a single validated user', async ({ apiClient }) => {
    const response = await apiClient.get('/users/1');
    await apiClient.expectOk(response);

    const user = await apiClient.parseAndValidate(response, UserSchema);
    expect(user.id).toBe(1);
  });

  test('POST /posts echoes the created resource', async ({ apiClient }) => {
    const payload = { title: 'foo', body: 'bar', userId: 1 } as const;
    const response = await apiClient.post('/posts', payload);
    await apiClient.expectOk(response);

    const created = await apiClient.parseAndValidate(response, PostCreateResponseSchema);
    expect(created.title).toBe(payload.title);
    expect(created.body).toBe(payload.body);
    expect(created.id).toBeGreaterThan(0);
  });
});
