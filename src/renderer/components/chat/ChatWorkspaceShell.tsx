import type { ReactNode } from 'react';

import type { ChatWorkspaceWorkbenchState } from './chatWorkspaceLayout';

export interface ChatWorkspaceShellProps {
  leftNav?: ReactNode;
  conversation: ReactNode;
  workbench?: ReactNode;
  workbenchState?: ChatWorkspaceWorkbenchState;
  className?: string;
}

const ChatWorkspaceShell = ({
  leftNav,
  conversation,
  workbench,
  workbenchState = 'collapsed',
  className = '',
}: ChatWorkspaceShellProps) => {
  const isWorkbenchExpanded = workbenchState === 'expanded';

  return (
    <div className={`flex h-full min-h-0 flex-1 overflow-hidden bg-background ${className}`}>
      {leftNav ? (
        <aside className="hidden w-[240px] shrink-0 border-r border-border bg-surface/80 md:flex md:min-h-0">
          {leftNav}
        </aside>
      ) : null}

      <main className="flex min-w-0 flex-1 flex-col bg-background">
        {conversation}
      </main>

      <aside
        aria-hidden={!isWorkbenchExpanded}
        className={`hidden min-h-0 shrink-0 border-l border-border bg-surface/80 transition-[width,opacity] duration-200 lg:flex ${
          isWorkbenchExpanded ? 'w-[320px] opacity-100' : 'w-0 overflow-hidden opacity-0'
        }`}
      >
        <div className="min-w-[320px] flex-1 overflow-y-auto">
          {workbench}
        </div>
      </aside>
    </div>
  );
};

export default ChatWorkspaceShell;
