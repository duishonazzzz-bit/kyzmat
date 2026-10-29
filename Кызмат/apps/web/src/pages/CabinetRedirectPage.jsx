import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const pageCopy = {
  ru: {
    loading: "Загрузка кабинета...",
  },
  ky: {
    loading: "Кабинет жүктөлүүдө...",
  },
  en: {
    loading: "Loading dashboard...",
  },
};

function CabinetRedirectPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const copy = pageCopy[language] || pageCopy.ru;

  if (!user?.role) {
    return <section className="panel">{copy.loading}</section>;
  }

  if (user.role === "admin") {
    return <Navigate replace to="/cabinet/admin" />;
  }

  if (user.role === "worker") {
    return <Navigate replace to="/cabinet/worker" />;
  }

  return <Navigate replace to="/cabinet/customer" />;
}

export default CabinetRedirectPage;
