// The "describe a task" bar from design C. Disabled for now: it will call the AI
// natural-language task creation (roadmap step 3).
export function QuickAdd() {
  return (
    <label className="flex h-11 items-center gap-2.5 rounded-lg border border-border bg-surface px-3.5 text-sm text-muted-foreground">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
      </svg>
      <span className="sr-only">Describe a task</span>
      <input
        type="text"
        disabled
        placeholder="Describe a task: “review the PR with Sam before Friday, high priority” (coming soon)"
        className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
    </label>
  );
}
