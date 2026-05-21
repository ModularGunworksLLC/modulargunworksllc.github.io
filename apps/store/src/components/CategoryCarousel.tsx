"use client";

import Link from "next/link";
import { HOME_CATEGORIES, shopCategoryHref } from "@/lib/navigation";

export function CategoryCarousel() {
  function scrollCarousel(direction: number) {
    const el = document.getElementById("featured-carousel");
    if (!el) return;
    const amount = 300 * direction;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <section className="carousel-section">
      <h2 className="section-title">Shop by Category</h2>
      <div className="carousel-container">
        <div className="carousel" id="featured-carousel">
          {HOME_CATEGORIES.map((cat) => {
            const href =
              "href" in cat && cat.href ? cat.href : shopCategoryHref(cat.slug);
            return (
              <div className="carousel-item" key={cat.slug}>
                <Link href={href} className="category-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/theme/images/categories/${cat.img}`}
                    alt={cat.name}
                    width={280}
                    height={150}
                    loading="lazy"
                    decoding="async"
                  />
                  <h3>{cat.name}</h3>
                  <p>{cat.count}</p>
                </Link>
              </div>
            );
          })}
        </div>
        <div className="carousel-controls">
          <button
            type="button"
            className="carousel-btn"
            onClick={() => scrollCarousel(-1)}
            aria-label="Previous categories"
          >
            ❮
          </button>
          <button
            type="button"
            className="carousel-btn"
            onClick={() => scrollCarousel(1)}
            aria-label="Next categories"
          >
            ❯
          </button>
        </div>
      </div>
    </section>
  );
}
