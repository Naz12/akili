import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col">
      <section className="container mx-auto flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Chat with Akili</h1>
        <p className="max-w-2xl text-balance text-muted-foreground">
          A clean, modern ChatGPT-style UI built with Next.js, Tailwind CSS, and shadcn/ui.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/chat"
            className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Start chatting
          </Link>
          <a
            href="https://nextjs.org"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm font-medium hover:bg-muted"
          >
            Learn more
          </a>
        </div>
      </section>
    </main>
  );
}
