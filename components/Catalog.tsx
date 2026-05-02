"use client";

import { useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import WhatsappButton from "./WhatsappButton";

type Product = {
  _id: string;
  name: string;
  available?: boolean;
  inStock?: boolean;
};

type Category = {
  _id: string;
  name: string;
  parent?: Category | null;
  icon?: {
    asset?: {
      url?: string;
    };
  };
  products?: Product[];
};

type Family = {
  parent: Category;
  children: Category[];
  products: Product[];
};

const STOCK_CATEGORY_ID = "stock-inmediato";

function cleanProducts(products?: Product[]) {
  return (products || []).filter((p) => p && p.available === true);
}

function uniqueProducts(products: Product[]) {
  const seen = new Set<string>();

  return products.filter((product) => {
    if (!product?._id || seen.has(product._id)) return false;
    seen.add(product._id);
    return true;
  });
}

function CategoryIcon({ category, size = "md" }: { category: Category; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-5 w-5" : "h-7 w-7";

  if (category.icon?.asset?.url) {
    return (
      <img
        src={category.icon.asset.url}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-contain`}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} inline-flex shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300`}
    >
      ⚡
    </span>
  );
}

export default function Catalog({ categories }: { categories: Category[] }) {
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);

  const families = useMemo<Family[]>(() => {
    const rootCategories = categories.filter((cat) => !cat.parent?._id);
    const rootsById = new Map(rootCategories.map((cat) => [cat._id, cat]));
    const childrenByParent = new Map<string, Category[]>();

    categories.forEach((cat) => {
      if (!cat.parent?._id) return;

      const current = childrenByParent.get(cat.parent._id) || [];
      childrenByParent.set(cat.parent._id, [...current, cat]);
    });

    const missingParents = categories
      .filter((cat) => cat.parent?._id && !rootsById.has(cat.parent._id))
      .map((cat) => cat.parent as Category)
      .filter(
        (parent, index, list) =>
          parent && list.findIndex((item) => item._id === parent._id) === index
      );

    return [...rootCategories, ...missingParents]
      .map((parent) => {
        const children = childrenByParent.get(parent._id) || [];
        const products = uniqueProducts([
          ...cleanProducts(parent.products),
          ...children.flatMap((child) => cleanProducts(child.products)),
        ]);

        return {
          parent,
          children,
          products,
        };
      })
      .filter((family) => family.products.length > 0);
  }, [categories]);

  const stockProducts = useMemo(
    () =>
      uniqueProducts(
        categories
          .flatMap((cat) => cat.products || [])
          .filter((p) => p && p.available === true && p.inStock === true)
      ),
    [categories]
  );

  const activeFamily =
    activeParentId === STOCK_CATEGORY_ID
      ? null
      : families.find((family) => family.parent._id === activeParentId) || null;

  const activeChild =
    activeFamily?.children.find((child) => child._id === activeChildId) || null;

  const selectParent = (parentId: string) => {
    setActiveParentId(parentId);
    setActiveChildId(null);
  };

  const resetView = () => {
    setActiveParentId(null);
    setActiveChildId(null);
  };

  const renderProductsGrid = (products: Product[]) => (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p._id} p={p} />
      ))}
    </div>
  );

  return (
    <>
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-500">
                Catalogo
              </p>
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                Explora por categoria
              </h1>
            </div>

            {activeParentId && (
              <button
                onClick={resetView}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
              >
                Ver todo
              </button>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-2 shadow-2xl shadow-black/20">
            {stockProducts.length > 0 && (
              <button
                onClick={() => selectParent(STOCK_CATEGORY_ID)}
                className={`flex min-w-fit items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                  activeParentId === STOCK_CATEGORY_ID
                    ? "bg-white text-black"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]" />
                Stock inmediato
              </button>
            )}

            {families.map((family) => {
              const isActive = activeParentId === family.parent._id;

              return (
                <button
                  key={family.parent._id}
                  onClick={() => selectParent(family.parent._id)}
                  className={`flex min-w-fit items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-white text-black"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <CategoryIcon category={family.parent} size="sm" />
                  {family.parent.name}
                </button>
              );
            })}
          </div>
        </div>

        {activeParentId === STOCK_CATEGORY_ID && (
          <section>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-green-400">
                  Disponible para entrega rapida
                </p>
                <h2 className="text-2xl font-bold text-white">
                  Stock inmediato
                </h2>
              </div>
              <span className="rounded-full bg-green-500/15 px-3 py-1 text-sm font-semibold text-green-300">
                {stockProducts.length} productos
              </span>
            </div>

            {families.map((family) => {
              const groups = [
                {
                  category: family.parent,
                  products: cleanProducts(family.parent.products).filter(
                    (p) => p.inStock
                  ),
                },
                ...family.children.map((child) => ({
                  category: child,
                  products: cleanProducts(child.products).filter((p) => p.inStock),
                })),
              ].filter((group) => group.products.length > 0);

              if (groups.length === 0) return null;

              return (
                <div key={family.parent._id} className="mb-12">
                  <div className="mb-4 flex items-center gap-2">
                    <CategoryIcon category={family.parent} size="sm" />
                    <h3 className="text-lg font-semibold text-white">
                      {family.parent.name}
                    </h3>
                  </div>

                  <div className="space-y-8">
                    {groups.map((group) => (
                      <div key={group.category._id}>
                        {group.category._id !== family.parent._id && (
                          <p className="mb-3 text-sm font-semibold text-white/60">
                            {group.category.name}
                          </p>
                        )}
                        {renderProductsGrid(group.products)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {activeFamily && (
          <section>
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-center gap-3">
                <CategoryIcon category={activeFamily.parent} />
                <div>
                  <p className="text-sm font-medium text-cyan-400">
                    Categoria principal
                  </p>
                  <h2 className="text-2xl font-bold text-white">
                    {activeFamily.parent.name}
                  </h2>
                </div>
              </div>

              <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/70">
                {activeFamily.products.length} productos
              </span>
            </div>

            {activeFamily.children.length > 0 && (
              <div className="mb-8 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
                <button
                  onClick={() => setActiveChildId(null)}
                  className={`min-w-fit rounded-full px-4 py-2 text-sm font-semibold transition ${
                    !activeChildId
                      ? "bg-cyan-400 text-black"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  Todo
                </button>

                {activeFamily.children.map((child) => (
                  <button
                    key={child._id}
                    onClick={() => setActiveChildId(child._id)}
                    className={`flex min-w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeChildId === child._id
                        ? "bg-cyan-400 text-black"
                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {child.name}
                    <span className="rounded-full bg-black/15 px-2 py-0.5 text-xs">
                      {cleanProducts(child.products).length}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeChild ? (
              renderProductsGrid(cleanProducts(activeChild.products))
            ) : activeFamily.children.length > 0 ? (
              <div className="space-y-10">
                {cleanProducts(activeFamily.parent.products).length > 0 && (
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-white">
                      {activeFamily.parent.name}
                    </h3>
                    {renderProductsGrid(cleanProducts(activeFamily.parent.products))}
                  </div>
                )}

                {activeFamily.children.map((child) => {
                  const products = cleanProducts(child.products);

                  if (products.length === 0) return null;

                  return (
                    <div key={child._id}>
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <h3 className="text-lg font-semibold text-white">
                          {child.name}
                        </h3>
                        <button
                          onClick={() => setActiveChildId(child._id)}
                          className="rounded-full border border-white/10 px-3 py-1 text-sm font-medium text-white/70 transition hover:border-white/30 hover:text-white"
                        >
                          Ver subcategoria
                        </button>
                      </div>
                      {renderProductsGrid(products)}
                    </div>
                  );
                })}
              </div>
            ) : (
              renderProductsGrid(activeFamily.products)
            )}
          </section>
        )}

        {!activeParentId && (
          <div className="space-y-12">
            {families.map((family) => {
              const preview = family.products.slice(0, 4);

              return (
                <section key={family.parent._id}>
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <CategoryIcon category={family.parent} size="sm" />
                        <h2 className="text-xl font-bold text-white">
                          {family.parent.name}
                        </h2>
                      </div>
                    </div>

                    <button
                      onClick={() => selectParent(family.parent._id)}
                      className="min-w-fit rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/75 transition hover:border-white/30 hover:text-white"
                    >
                      Ver todo
                    </button>

                    {family.children.length > 0 && (
                      <div className="flex w-full flex-wrap gap-2">
                        {family.children.map((child) => (
                          <button
                            key={child._id}
                            onClick={() => {
                              setActiveParentId(family.parent._id);
                              setActiveChildId(child._id);
                            }}
                            className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold whitespace-nowrap text-white/65 transition hover:bg-white/10 hover:text-white"
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {renderProductsGrid(preview)}
                </section>
              );
            })}
          </div>
        )}
      </section>

      <WhatsappButton />
    </>
  );
}
