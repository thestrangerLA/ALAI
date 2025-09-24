import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Welcome to Tour Calculator
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Your one-stop solution for managing and calculating tour costs.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button asChild>
            <Link href="/tour/calculator">Get Started</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
