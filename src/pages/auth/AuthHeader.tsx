export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8 flex flex-col items-center text-center">
      <img src="/icons/logo.png" alt="" className="mb-5 h-48 w-auto" />
      <h1 className="text-[26px] font-bold tracking-tight">{title}</h1>
      <p className="mt-1.5 max-w-[32ch] text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}
