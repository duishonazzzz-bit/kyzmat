import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";

function joinClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}

function AvatarFallbackIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="21" fill="currentColor" opacity="0.95" r="12" />
      <path
        d="M14 54c2.4-10 9.95-16 18-16s15.6 6 18 16"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M18 16c4-7 24-9 31 3"
        opacity="0.18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="4"
      />
    </svg>
  );
}

function UserAvatar({
  src,
  name,
  alt,
  className = "",
  imageClassName = "",
  fallbackClassName = "",
}) {
  const { language } = useLanguage();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const label = alt || (
    name
      ? language === "en"
        ? `Profile photo of ${name}`
        : language === "ky"
          ? `${name} профилдик сүрөтү`
          : `Фото профиля ${name}`
      : language === "en"
        ? "Profile photo"
        : language === "ky"
          ? "Профилдик сүрөт"
          : "Фото профиля"
  );

  return (
    <div
      className={joinClasses(
        "relative overflow-hidden rounded-[28px] border border-[rgba(141,21,48,0.08)] bg-[linear-gradient(135deg,#fff7f8_0%,#f7ebee_100%)] shadow-[0_18px_38px_-28px_rgba(56,18,30,0.35)]",
        className,
      )}
    >
      {src && !hasError ? (
        <img
          alt={label}
          className={joinClasses("h-full w-full object-cover", imageClassName)}
          onError={() => setHasError(true)}
          src={src}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(141,21,48,0.14),transparent_48%),linear-gradient(180deg,#fff9fa_0%,#f4e8ec_100%)]">
          <AvatarFallbackIcon className={joinClasses("h-[62%] w-[62%] text-[#8d1530]", fallbackClassName)} />
        </div>
      )}
    </div>
  );
}

export default UserAvatar;
