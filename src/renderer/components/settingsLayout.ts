export const SETTINGS_OVERLAY_CLASSNAME = 'fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-2 sm:p-4';

export const SETTINGS_MODAL_CLASSNAME = [
  'relative flex flex-col md:flex-row w-full max-w-[1180px]',
  'h-[calc(100vh-1rem)] sm:h-[82vh] max-h-[calc(100vh-1rem)] sm:max-h-[820px]',
  'rounded-2xl border border-[#E7E2FF] bg-[#FBFAFF] shadow-[0_24px_80px_rgba(91,75,255,0.18)] overflow-hidden modal-content',
].join(' ');

export const SETTINGS_SIDEBAR_CLASSNAME = [
  'w-full md:w-[236px] shrink-0 flex flex-col',
  'bg-[#F8F5FF] border-b md:border-b-0 md:border-r border-[#E7E2FF]',
  'rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden',
].join(' ');

export const SETTINGS_CONTENT_CLASSNAME = [
  'relative flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden',
  'bg-white rounded-b-2xl md:rounded-b-none md:rounded-r-2xl',
].join(' ');
