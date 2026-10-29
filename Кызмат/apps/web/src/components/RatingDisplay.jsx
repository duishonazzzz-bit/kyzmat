import { useLanguage } from "../context/LanguageContext";

function joinClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatReviewCount(value, language = "ru") {
  const reviews = Number(value || 0);

  if (language === "en") {
    return `${reviews} ${reviews === 1 ? "review" : "reviews"}`;
  }

  if (language === "ky") {
    return `${reviews} сын-пикир`;
  }

  const absolute = Math.abs(reviews);
  const mod100 = absolute % 100;
  const mod10 = absolute % 10;

  let label = "отзывов";

  if (mod100 < 11 || mod100 > 14) {
    if (mod10 === 1) {
      label = "отзыв";
    } else if (mod10 >= 2 && mod10 <= 4) {
      label = "отзыва";
    }
  }

  return `${reviews} ${label}`;
}

export function RatingValue({ rating, className = "", starClassName = "", valueClassName = "" }) {
  return (
    <span className={joinClasses("inline-flex items-center gap-1.5", className)}>
      <span aria-hidden="true" className={joinClasses("text-[#d58f17]", starClassName)}>
        ★
      </span>
      <span className={valueClassName}>{Number(rating || 0).toFixed(1)}</span>
    </span>
  );
}

export function ReviewCountText({ reviews, className = "" }) {
  const { language } = useLanguage();
  return <span className={className}>{formatReviewCount(reviews, language)}</span>;
}

export function RatingInline({
  rating,
  reviews,
  className = "",
  separatorClassName = "",
  ratingClassName = "",
  reviewClassName = "",
  starClassName = "",
  valueClassName = "",
}) {
  return (
    <span className={joinClasses("inline-flex items-center gap-2", className)}>
      <RatingValue
        className={ratingClassName}
        rating={rating}
        starClassName={starClassName}
        valueClassName={valueClassName}
      />
      <span className={joinClasses("text-slate-300", separatorClassName)}>·</span>
      <ReviewCountText className={reviewClassName} reviews={reviews} />
    </span>
  );
}
