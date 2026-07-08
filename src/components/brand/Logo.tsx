import Image from "next/image";
import Link from "next/link";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center ${className ?? ""}`}>
      <Image
        src="/brand/skyfots-logo.png"
        alt="SkyFots Global Logistics"
        width={173}
        height={58}
        priority
        className="h-10 w-auto sm:h-12"
      />
    </Link>
  );
}
