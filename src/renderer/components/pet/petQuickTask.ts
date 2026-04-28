export const QUICK_TASK_MAX_PROMPT_LENGTH = 4000;
export const QUICK_TASK_TITLE_MAX_LENGTH = 50;

type QuickTaskPayload = {
  prompt: string;
  title: string;
};

type QuickTaskPayloadResult =
  | { ok: true; payload: QuickTaskPayload }
  | { ok: false; error: string };

function truncateText(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

export function createQuickTaskPayload(rawPrompt: string): QuickTaskPayloadResult {
  const prompt = truncateText(rawPrompt.trim(), QUICK_TASK_MAX_PROMPT_LENGTH);
  if (!prompt) {
    return {
      ok: false,
      error: '请输入任务内容',
    };
  }

  const titleSource = prompt.split('\n')[0].trim() || prompt;
  return {
    ok: true,
    payload: {
      prompt,
      title: truncateText(titleSource, QUICK_TASK_TITLE_MAX_LENGTH),
    },
  };
}
