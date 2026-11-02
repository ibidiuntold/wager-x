import { describe, it, expect } from 'vitest';

const baseUrl = 'http://localhost:3000/api/users';

// Helper to create a random email
function randomEmail() {
  return `testuser_${Math.floor(Math.random() * 100000)}@example.com`;
}

describe('/api/users endpoint', () => {
  let userId: string;
  const email = randomEmail();
  const password = 'TestPassword123!';
  const firstName = 'Test';
  const lastName = 'User';

  it('should create a new user', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.userId).toBeDefined();
    userId = data.userId;
  });

  it('should not allow duplicate user creation', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
    const data = await res.json();
    expect(res.status).toBe(409);
    expect(data.error).toMatch(/already exists/i);
  });

  it('should fetch the created user by id', async () => {
    const res = await fetch(`${baseUrl}?id=${userId}`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(email);
  });

  it('should update the user profile', async () => {
    const res = await fetch(baseUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, firstName: 'Updated', lastName: 'User' }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return 404 for non-existent user', async () => {
    const res = await fetch(`${baseUrl}?id=nonexistentid123`);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toMatch(/not found/i);
  });
}); 