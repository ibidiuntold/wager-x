import { describe, it, expect } from 'vitest';

const baseUrl = 'http://localhost:3000/api/wagers';

function randomSlug() {
  return `testwager_${Math.floor(Math.random() * 100000)}`;
}

describe('/api/wagers endpoint', () => {
  let wagerId: string;
  const slug = randomSlug();
  const wagerData = {
    category: 'test',
    description: 'Test wager',
    expiresAt: new Date().toISOString(),
    image: '',
    options: ['A', 'B'],
    slug,
    status: 'open',
    title: 'Test Wager',
    totalPool: 1000,
  };

  it('should create a new wager', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wagerData),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.wagerId).toBeDefined();
    wagerId = data.wagerId;
  });

  it('should fetch all wagers', async () => {
    const res = await fetch(baseUrl);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data.wagers)).toBe(true);
  });

  it('should update the wager', async () => {
    const res = await fetch(baseUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: wagerId, title: 'Updated Wager' }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should delete the wager', async () => {
    const res = await fetch(baseUrl, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: wagerId }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return error for missing wager id on update', async () => {
    const res = await fetch(baseUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'No ID' }),
    });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toMatch(/missing wager id/i);
  });
}); 