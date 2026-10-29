function hasProInsideVerification(verificationMeta) {
  return String(verificationMeta?.shortLabel || "").toLowerCase().includes("pro");
}

export default function WorkerStatusBadges({
  verificationStatus = "basic",
  verificationMeta,
  isPro = false,
  className = "",
}) {
  const showVerification = verificationStatus !== "basic" && verificationMeta?.shortLabel;
  const showSeparatePro = isPro && !hasProInsideVerification(verificationMeta);
  const containerClassName = ["flex flex-wrap items-start gap-2", className].filter(Boolean).join(" ");

  if (!showVerification && !showSeparatePro) {
    return null;
  }

  return (
    <div className={containerClassName}>
      {showVerification ? (
        <span className={`badge max-w-full whitespace-nowrap ${verificationMeta.badgeClass}`}>{verificationMeta.shortLabel}</span>
      ) : null}
      {showSeparatePro ? (
        <span className="badge max-w-full whitespace-nowrap border-[#ead3d9] bg-[#f9ecef] text-[#8d1530]">PRO</span>
      ) : null}
    </div>
  );
}
