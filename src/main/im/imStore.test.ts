import { expect,test } from 'vitest';

import { IMStore } from './imStore';

class FakeDb {
  private store: Map<string, string> = new Map();
  private deletedPlatforms: string[] = [];
  writeCount = 0;

  pragma(_name: string) {
    // Report agent_id as already present to skip the ALTER TABLE migration
    return [{ name: 'agent_id' }];
  }

  prepare(sql: string) {
    return {
      run: (...params: unknown[]) => {
        if (sql.includes('INSERT') && sql.includes('im_config')) {
          this.store.set(String(params[0]), String(params[1]));
          this.writeCount++;
          return;
        }
        if (sql.includes('UPDATE im_config')) {
          // UPDATE im_config SET value = ?, updated_at = ? WHERE key = ?
          this.store.set(String(params[2]), String(params[0]));
          this.writeCount++;
          return;
        }
        if (sql.includes('DELETE FROM im_config WHERE key = ?')) {
          this.store.delete(String(params[0]));
          this.writeCount++;
          return;
        }
        // CREATE TABLE, ALTER TABLE, etc: count as write
        this.writeCount++;
      },
      get: (...params: unknown[]) => {
        if (sql.includes('SELECT value FROM im_config WHERE key = ?')) {
          const value = this.store.get(String(params[0]));
          return value !== undefined ? { value } : undefined;
        }
        return undefined;
      },
      all: (...params: unknown[]) => {
        if (sql.includes('SELECT key, value FROM im_config WHERE key LIKE ?')) {
          const prefix = String(params[0]).replace('%', '');
          return Array.from(this.store.entries())
            .filter(([key]) => key.startsWith(prefix))
            .map(([key, value]) => ({ key, value }));
        }
        return [];
      },
    };
  }

  getValue(key: string) {
    return this.store.get(key);
  }

  getDeletedPlatforms() {
    return this.deletedPlatforms;
  }
}

test('IMStore persists conversation reply routes by platform and conversation ID', () => {
  const db = new FakeDb();
  const store = new IMStore(db as unknown as ConstructorParameters<typeof IMStore>[0]);

  expect(store.getConversationReplyRoute('dingtalk', '__default__:conv-1')).toBe(null);

  store.setConversationReplyRoute('dingtalk', '__default__:conv-1', {
    channel: 'dingtalk-connector',
    to: 'group:cid-42',
    accountId: '__default__',
  });

  expect(store.getConversationReplyRoute('dingtalk', '__default__:conv-1')).toEqual({
    channel: 'dingtalk-connector',
    to: 'group:cid-42',
    accountId: '__default__',
  });
  expect(store.getConversationReplyRoute('telegram', '__default__:conv-1')).toBe(null);
  expect(db.writeCount >= 2).toBeTruthy();
});
