import { Loader2 } from "lucide-react"

export function LoadingScreen() {
  return (
    <main className="relative z-50 flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="size-16 animate-spin rounded-full border-4 border-muted border-t-foreground" />
          <Loader2 className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">AI Article</h1>
          <p className="text-sm text-muted-foreground md:text-base">Checking authentication...</p>
        </div>
      </div>
    </main>
  )
}
