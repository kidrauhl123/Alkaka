export const SETTINGS_OVERLAY_CLASSNAME = [
  'fixed inset-x-0 bottom-0 top-0 z-50 modal-backdrop flex items-start justify-center',
  'px-1 pb-1 pt-[42px] min-[420px]:px-2 min-[420px]:pb-2 min-[420px]:pt-[44px] sm:px-4 sm:pb-4 sm:pt-[52px]',
].join(' ');

export const SETTINGS_MODAL_CLASSNAME = [
  'relative flex flex-col md:flex-row w-full max-w-[1180px] min-w-0',
  'h-[calc(100vh-46px)] min-[420px]:h-[calc(100vh-52px)] sm:h-[calc(100vh-68px)]',
  'max-h-[calc(100vh-46px)] min-[420px]:max-h-[calc(100vh-52px)] sm:max-h-[820px]',
  'rounded-xl min-[420px]:rounded-2xl border border-[#E7E2FF] bg-[#FBFAFF] shadow-[0_24px_80px_rgba(91,75,255,0.18)] overflow-hidden modal-content',
].join(' ');

export const SETTINGS_SIDEBAR_CLASSNAME = [
  'w-full md:w-[236px] shrink-0 flex flex-col min-w-0',
  'bg-[#F8F5FF] border-b md:border-b-0 md:border-r border-[#E7E2FF]',
  'rounded-t-xl min-[420px]:rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden',
].join(' ');

export const SETTINGS_CONTENT_CLASSNAME = [
  'relative flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden',
  'bg-white rounded-b-xl min-[420px]:rounded-b-2xl md:rounded-b-none md:rounded-r-2xl',
].join(' ');

export const SETTINGS_SIDEBAR_HEADER_CLASSNAME =
  'px-3 pt-3 pb-1 min-[420px]:px-5 min-[420px]:pt-4 min-[420px]:pb-2 md:pt-5 md:pb-3';

export const SETTINGS_SIDEBAR_NAV_CLASSNAME =
  'flex flex-row md:flex-col gap-1 px-2 min-[420px]:px-3 pb-2 min-[420px]:pb-3 overflow-x-auto md:overflow-x-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

export const SETTINGS_SIDEBAR_TAB_CLASSNAME =
  'flex shrink-0 items-center justify-center min-[520px]:justify-start gap-2 md:gap-3 h-10 w-10 min-[520px]:h-auto min-[520px]:w-auto min-[520px]:px-3 min-[520px]:py-2 rounded-xl text-sm font-semibold transition-colors text-left';

export const SETTINGS_CONTENT_HEADER_CLASSNAME =
  'flex justify-between items-center gap-2 min-[420px]:gap-3 px-3 sm:px-6 pt-3 sm:pt-5 pb-2 min-[420px]:pb-3 shrink-0 border-b border-[#F0ECFF]';

export const SETTINGS_FORM_BODY_CLASSNAME =
  'px-3 sm:px-6 py-3 min-[420px]:py-4 flex-1 overflow-y-auto bg-white min-w-0';

export const SETTINGS_FOOTER_CLASSNAME =
  'flex flex-wrap justify-end gap-2 min-[420px]:gap-3 p-2 min-[420px]:p-3 sm:p-4 border-[#F0ECFF] border-t bg-[#FBFAFF] shrink-0';
