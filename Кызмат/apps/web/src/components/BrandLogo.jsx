import { useLanguage } from "../context/LanguageContext";

function BrandLogo({ compact = false, showTagline = false, className = "" }) {
  const { t } = useLanguage();

  if (compact) {
    return <img alt="KYZMAT" className={`h-11 w-11 rounded-2xl ${className}`.trim()} src="/brand/kyzmat-mark.svg" />;
  }

  return (
    <div className={`flex flex-col ${className}`.trim()}>
      <img alt="KYZMAT" className="h-6 w-auto object-contain sm:h-7" src="/brand/kyzmat-logo.png" />
      {showTagline ? (
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9c8f91] sm:text-[11px]">
          {t("brand.tagline")}
        </p>
      ) : null}
    </div>
  );
}

export default BrandLogo;
