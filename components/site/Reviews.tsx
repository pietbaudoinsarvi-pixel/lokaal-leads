import type { ClientConfig } from "@/config/types";

interface ReviewsProps {
  reviews: ClientConfig["presentation"]["reviews"];
  googleReviewLink?: string;
}

export default function Reviews({ reviews, googleReviewLink }: ReviewsProps) {
  if (!reviews || reviews.items.length === 0) return null;

  const heading = reviews.heading ?? "Wat klanten zeggen";
  const source = reviews.source ?? "Google";
  // Alleen tonen als er een echte review-link is ingevuld (geen placeholder).
  const showGoogleLink = Boolean(
    googleReviewLink && !googleReviewLink.includes("PLAATS-HIER"),
  );

  return (
    <section className="section section--alt" id="reviews">
      <div className="container">
        <div className="section__head reviews__head">
          <span className="eyebrow">Beoordelingen</span>
          <h2 className="section__title">{heading}</h2>
          {reviews.rating && (
            <p className="reviews__rating">
              <span className="reviews__stars" aria-hidden="true">
                ★★★★★
              </span>
              <strong>{reviews.rating.toString().replace(".", ",")}</strong>
              {reviews.count && (
                <span className="reviews__count">
                  uit {reviews.count} beoordelingen op {source}
                </span>
              )}
            </p>
          )}
        </div>
        <div className="reviews-grid">
          {reviews.items.map((review, i) => (
            <blockquote className="review-card" key={i}>
              <div className="review-card__stars" aria-hidden="true">
                ★★★★★
              </div>
              <p className="review-card__quote">{review.quote}</p>
              <footer className="review-card__author">
                {review.name}
                {review.location && (
                  <span className="review-card__loc">, {review.location}</span>
                )}
              </footer>
            </blockquote>
          ))}
        </div>
        {showGoogleLink && (
          <div className="reviews__more">
            <a
              href={googleReviewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary"
            >
              Laat een review achter op {source}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
