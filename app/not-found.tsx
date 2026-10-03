import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, PenLine, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-24 bg-paper text-ink selection:bg-[#E4DFD3]">
      <div className="mx-auto max-w-md text-center space-y-6">
        <Link href="/" className="inline-block hover:opacity-85 transition-opacity">
          <Image
            src="/logo.png"
            alt="Vina logo"
            width={40}
            height={40}
            className="h-10 w-auto mx-auto"
            priority
          />
        </Link>

        <div className="space-y-2">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-ink">
            404 • Missing page
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl text-ink tracking-tight">
            This letter went astray.
          </h1>
          <p className="text-xs sm:text-sm text-muted-ink leading-relaxed max-w-sm mx-auto">
            The page you requested does not exist or may have been relocated.
          </p>
        </div>

        <div className="border border-hairline bg-[#FAF9F5] p-4 rounded-sm text-xs text-muted-ink">
          <p>
            Looking to compose tailored correspondence or check your past submissions?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-sm border border-hairline bg-paper px-4 py-2.5 text-xs font-medium text-ink hover:bg-[#EDEAE2] transition-colors min-h-[40px]"
          >
            <Home className="h-3.5 w-3.5 text-muted-ink" />
            <span>Return home</span>
          </Link>
          <Link
            href="/draft"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-sm bg-seal px-5 py-2.5 text-xs font-medium text-paper hover:bg-seal/90 shadow-xs transition-all min-h-[40px]"
          >
            <PenLine className="h-3.5 w-3.5" />
            <span>Draft a letter</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-hairline/80">
          <Link
            href="/log"
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-ink hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>View sent letters history</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
