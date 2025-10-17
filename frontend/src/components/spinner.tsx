export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
      <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-primary border-r-transparent" />
      {label ?? "Loading"}
    </div>
  );
}
