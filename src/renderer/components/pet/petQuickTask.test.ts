import { describe, expect, test } from 'vitest';

import { createQuickTaskPayload, QUICK_TASK_MAX_PROMPT_LENGTH } from './petQuickTask';

describe('createQuickTaskPayload', () => {
  test('rejects empty prompts after trimming whitespace', () => {
    expect(createQuickTaskPayload('  \n\t  ')).toEqual({
      ok: false,
      error: '请输入任务内容',
    });
  });

  test('trims prompt and generates a concise title', () => {
    expect(createQuickTaskPayload('  帮我总结今天的任务\n并给出下一步  ')).toEqual({
      ok: true,
      payload: {
        prompt: '帮我总结今天的任务\n并给出下一步',
        title: '帮我总结今天的任务',
      },
    });
  });

  test('caps long prompts before sending to the main process', () => {
    const result = createQuickTaskPayload('a'.repeat(QUICK_TASK_MAX_PROMPT_LENGTH + 10));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.prompt).toHaveLength(QUICK_TASK_MAX_PROMPT_LENGTH);
      expect(result.payload.title).toHaveLength(50);
    }
  });
});
