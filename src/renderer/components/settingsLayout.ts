export const SETTINGS_OVERLAY_CLASSNAME = [
  'fixed inset-x-0 bottom-0 top-0 z-50 modal-backdrop flex items-start justify-center',
  'px-2 pb-2 pt-[44px] sm:px-4 sm:pb-4 sm:pt-[52px]',
].join(' ');

export const SETTINGS_MODAL_CLASSNAME = [
  'relative flex flex-col md:flex-row w-full max-w-[1180px]',
  'h-[calc(100vh-52px)] sm:h-[calc(100vh-68px)] max-h-[calc(100vh-52px)] sm:max-h-[820px]',
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
