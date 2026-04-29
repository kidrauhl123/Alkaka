import type { PetStatus, PetStatusPresentation, PetStatusTone } from '../types/pet';

const PET_STATUS_PRESENTATIONS: Record<PetStatus, PetStatusPresentation> = {
  idle: {
    label: '待命中',
    message: '双击打开 Alkaka，或直接开始一次对话。',
    tone: 'neutral',
    ariaLabel: 'Alkaka 桌宠当前待命中',
  },
  thinking: {
    label: '思考中',
    message: '正在理解你的上下文，马上给出回应。',
    tone: 'active',
    ariaLabel: 'Alkaka 桌宠正在思考中',
  },
  working: {
    label: '工作中',
    message: '正在处理你的请求，完成后会把结果带回来。',
    tone: 'active',
    ariaLabel: 'Alkaka 桌宠当前工作中',
  },
  waiting_permission: {
    label: '待确认',
    message: '有一步需要你确认权限，再继续执行。',
    tone: 'warning',
    ariaLabel: 'Alkaka 桌宠正在等待权限确认',
  },
  error: {
    label: '遇到问题',
    message: '对话遇到异常，可以打开对话窗口查看详情。',
    tone: 'danger',
    ariaLabel: 'Alkaka 桌宠遇到问题',
  },
};

export function normalizePetStatus(value: unknown): PetStatus {
  if (typeof value !== 'string') return 'idle';
  if (value in PET_STATUS_PRESENTATIONS) return value as PetStatus;
  return 'idle';
}

export function getPetStatusPresentation(status: unknown): PetStatusPresentation {
  return PET_STATUS_PRESENTATIONS[normalizePetStatus(status)];
}

export function getPetStatusTone(status: unknown): PetStatusTone {
  return getPetStatusPresentation(status).tone;
}
