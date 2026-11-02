import Image from "next/image";
import Link from "next/link";
import type { Category } from "@jhatpat/shared";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <ul className="grid grid-cols-4 gap-x-2.5 gap-y-4 px-4">
      {categories.map((category) => (
        <li key={category.id}>
          <Link
            href={`/categories/${category.slug}`}
            className="group flex flex-col items-center gap-1.5 rounded-2xl text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-primary-soft ring-1 ring-primary/40 ring-inset">
              <Image
                src={category.image}
                alt=""
                fill
                sizes="(min-width: 480px) 6.5rem, 22vw"
                className="object-cover transition-transform duration-200 ease-out group-active:scale-95"
              />
            </span>
            <span className="line-clamp-2 text-[0.6875rem] leading-tight font-semibold text-ink">{category.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
