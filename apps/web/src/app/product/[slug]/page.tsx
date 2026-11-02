import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ProductDetail } from "@jhatpat/shared";
import { ProductDetailView } from "@/components/features/product/ProductDetailView";
import { api, ApiError } from "@/lib/api";
import { CATALOG_REVALIDATE_S } from "@/lib/constants";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

const getProduct = async (slug: string) => {
  return api<ProductDetail>(`/products/${encodeURIComponent(slug)}`, {
    next: { revalidate: CATALOG_REVALIDATE_S },
  }).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    return {
      title: `${product.name} (${product.unit})`,
      description: product.subtitle || `Buy ${product.name} online at the best price on Jhatpat.`,
    };
  } catch {
    return { title: "Product Details" };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  return <ProductDetailView product={product} />;
}

