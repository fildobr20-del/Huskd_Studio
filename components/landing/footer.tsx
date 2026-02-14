export function Footer() {
  return (
    <footer className="relative px-6 pb-10 pt-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-gradient">
              <span className="text-xs font-bold text-background">{"H"}</span>
            </div>
            <span className="font-serif text-lg font-bold tracking-wide text-foreground">
              {"Husk'd Labl"}
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              {"Преимущества"}
            </a>
            <a href="#support" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              {"Поддержка"}
            </a>
            <a href="#stats" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              {"Результаты"}
            </a>
            <a href="#steps" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              {"Как начать"}
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 border-t border-border/50 pt-8 md:flex-row md:justify-between">
          <p className="text-xs text-muted-foreground">
            {"© 2019–2026 Husk'd Labl. Все права защищены."}
          </p>
          <p className="text-xs text-muted-foreground">
            {"Твой надёжный партнёр в вебкам-индустрии"}
          </p>
        </div>
      </div>
    </footer>
  )
}
