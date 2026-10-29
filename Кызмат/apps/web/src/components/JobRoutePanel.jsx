import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import LiveJobMap from "./LiveJobMap";
import { buildGoogleMapsDirectionsLink, buildGoogleMapsPlaceLink } from "../utils/maps";

const copyByLanguage = {
  ru: {
    statuses: { idle: "Ожидает выезд", en_route: "В пути", arrived: "Приехал" },
    unknown: "неизвестно",
    now: "сразу",
    notUpdated: "ещё не обновлялся",
    road: "дороге",
    startMove: "Начните путь и двигайтесь по",
    arrivedToCustomer: "Вы прибыли к адресу заказчика",
    roundabout: "На кольце двигайтесь к",
    merge: "Перестройтесь",
    fork: "Держитесь",
    turn: "Поверните",
    continueMove: "Продолжайте движение по",
    moveBy: "Следуйте по",
    geolocationUnsupported: "Геолокация не поддерживается этим браузером.",
    geolocationFailed: "Не удалось определить ваше текущее местоположение.",
    routeAddressMissing: "Заказчик ещё не указал адрес для маршрута.",
    approximatePoint: "Точный дом не найден, поэтому карта показана по ближайшей точке в этом городе.",
    exactPoint: "Точка клиента найдена на карте.",
    geocodeError: "Не удалось определить адрес на карте",
    routeUpdated: "Маршрут до заказчика обновлён.",
    routeError: "Не удалось построить маршрут",
    liveStatusError: "Не удалось обновить статус исполнителя",
    tripStarted: "Исполнитель отмечен как выехавший, карта и маршрут обновлены.",
    arrivedStatus: "Статус исполнителя обновлён: приехал.",
    routeReset: "Статус маршрута сброшен.",
    addressCopied: "Адрес скопирован.",
    addressCopyFailed: "Не удалось скопировать адрес автоматически.",
    title: "Адрес и маршрут",
    subtitle:
      "Заказчик видит адрес, а назначенный исполнитель может включить живой статус, показать свою точку и двигаться к клиенту без выхода из приложения.",
    openGoogle: "Открыть в Google Maps",
    copyAddress: "Скопировать адрес",
    customerPointMissing: "Точка клиента пока не определена",
    customerPointText:
      "Сначала нужен точный адрес. После этого карта покажет метку клиента, а назначенный исполнитель сможет отобразить ещё и текущую точку в пути.",
    findPoint: "Найти точку по адресу",
    findingAddress: "Ищем адрес...",
    orderAddress: "Адрес заказа",
    addressMissing: "Адрес пока не указан",
    customer: "Клиент",
    worker: "Исполнитель",
    map: "Карта",
    liveMap: "Живая карта",
    customerPoint: "Точка клиента",
    notFound: "Не найдена",
    approximate: "Приблизительно",
    exact: "Точно",
    workerStatus: "Статус исполнителя",
    workerNotSelected: "Исполнитель не выбран",
    lastUpdate: "Последнее обновление",
    radius: "Радиус выезда",
    noLimit: "Без ограничения",
    distance: "Расстояние",
    time: "Время в пути",
    navigationTitle: "Навигация для исполнителя",
    navigationText:
      "Обновите своё местоположение, чтобы заказчик увидел, что вы уже выехали или прибыли.",
    locating: "Определяем геопозицию...",
    updatingRoute: "Обновляем маршрут...",
    refreshRoute: "Обновить маршрут",
    startTrip: "Выехать и построить маршрут",
    markArrived: "Отметить прибытие",
    resetStatus: "Сбросить статус",
    stepByStep: "Пошаговый маршрут",
    tripHidden: "После выбора исполнителя здесь появится живой статус поездки. Заказчик увидит, когда мастер выехал и когда он уже на месте.",
  },
  ky: {
    statuses: { idle: "Чыгууга даяр", en_route: "Жолдо", arrived: "Келди" },
    unknown: "белгисиз",
    now: "дароо",
    notUpdated: "азырынча жаңыртылган эмес",
    road: "жол",
    startMove: "Жолду баштап, төмөнкү жол менен жүрүңүз",
    arrivedToCustomer: "Сиз кардардын дарегине келдиңиз",
    roundabout: "Айланма жолдо төмөнкү багытка кетиңиз",
    merge: "Кайра катарга өтүңүз",
    fork: "Багытты кармаңыз",
    turn: "Бурулуңуз",
    continueMove: "Төмөнкү жол менен жүрүүнү улантыңыз",
    moveBy: "Төмөнкү жол менен жүрүңүз",
    geolocationUnsupported: "Бул браузер геолокацияны колдобойт.",
    geolocationFailed: "Учурдагы жайгашкан жериңизди аныктоо мүмкүн болгон жок.",
    routeAddressMissing: "Маршрут үчүн кардар даректи азырынча көрсөткөн жок.",
    approximatePoint: "Так үй табылган жок, ошондуктан карта жакынкы чекит менен көрсөтүлдү.",
    exactPoint: "Кардардын чекити картадан табылды.",
    geocodeError: "Даректи картадан аныктоо мүмкүн болгон жок",
    routeUpdated: "Кардарга чейинки маршрут жаңыртылды.",
    routeError: "Маршрут куруу мүмкүн болгон жок",
    liveStatusError: "Аткаруучунун макамын жаңыртуу мүмкүн болгон жок",
    tripStarted: "Аткаруучу чыкты деп белгиленди, карта жана маршрут жаңыртылды.",
    arrivedStatus: "Аткаруучунун макамы жаңыртылды: келди.",
    routeReset: "Маршрут макамы тазаланды.",
    addressCopied: "Дарек көчүрүлдү.",
    addressCopyFailed: "Даректи автоматтык көчүрүү мүмкүн болгон жок.",
    title: "Дарек жана маршрут",
    subtitle:
      "Кардар даректи көрөт, ал эми дайындалган аткаруучу жандуу макамды күйгүзүп, өз чекитин көрсөтүп, колдонмодон чыкпай эле кардарга жетет.",
    openGoogle: "Google Maps'та ачуу",
    copyAddress: "Даректи көчүрүү",
    customerPointMissing: "Кардардын чекити азырынча аныкталган жок",
    customerPointText:
      "Алгач так дарек керек. Андан кийин карта кардардын чекитин көрсөтөт, ал эми дайындалган аткаруучу учурдагы чекитин дагы чыгара алат.",
    findPoint: "Дарек боюнча чекитти табуу",
    findingAddress: "Дарек изделүүдө...",
    orderAddress: "Заказдын дареги",
    addressMissing: "Дарек азырынча көрсөтүлгөн эмес",
    customer: "Кардар",
    worker: "Аткаруучу",
    map: "Карта",
    liveMap: "Жандуу карта",
    customerPoint: "Кардардын чекити",
    notFound: "Табылган жок",
    approximate: "Болжолдуу",
    exact: "Так",
    workerStatus: "Аткаруучунун макамы",
    workerNotSelected: "Аткаруучу тандалган эмес",
    lastUpdate: "Акыркы жаңыртуу",
    radius: "Чыгуу радиусу",
    noLimit: "Чектөөсүз",
    distance: "Аралык",
    time: "Жолдогу убакыт",
    navigationTitle: "Аткаруучу үчүн навигация",
    navigationText:
      "Кардар сиздин чыккан же келген макамыңызды көрүшү үчүн жайгашкан жериңизди жаңыртыңыз.",
    locating: "Геопозиция аныкталууда...",
    updatingRoute: "Маршрут жаңыртылууда...",
    refreshRoute: "Маршрутту жаңыртуу",
    startTrip: "Чыгуу жана маршрут куруу",
    markArrived: "Келгенин белгилөө",
    resetStatus: "Макамы тазалоо",
    stepByStep: "Кадамдык маршрут",
    tripHidden: "Аткаруучу тандалгандан кийин бул жерде жандуу сапар макамы чыгат. Кардар уста качан чыкканын жана качан жеткенин көрөт.",
  },
  en: {
    statuses: { idle: "Waiting to depart", en_route: "On the way", arrived: "Arrived" },
    unknown: "unknown",
    now: "right away",
    notUpdated: "not updated yet",
    road: "the road",
    startMove: "Start moving and follow",
    arrivedToCustomer: "You have arrived at the customer's address",
    roundabout: "At the roundabout, continue toward",
    merge: "Merge",
    fork: "Keep",
    turn: "Turn",
    continueMove: "Continue along",
    moveBy: "Follow",
    geolocationUnsupported: "Geolocation is not supported by this browser.",
    geolocationFailed: "Unable to determine your current location.",
    routeAddressMissing: "The customer has not provided an address for the route yet.",
    approximatePoint: "The exact building was not found, so the map shows the nearest point in this city.",
    exactPoint: "The customer's location was found on the map.",
    geocodeError: "Unable to place this address on the map",
    routeUpdated: "Route to the customer has been updated.",
    routeError: "Unable to build the route",
    liveStatusError: "Unable to update the specialist status",
    tripStarted: "The specialist is marked as on the way. The map and route have been updated.",
    arrivedStatus: "Specialist status updated: arrived.",
    routeReset: "Route status has been reset.",
    addressCopied: "Address copied.",
    addressCopyFailed: "Unable to copy the address automatically.",
    title: "Address and route",
    subtitle:
      "The customer sees the address, and the assigned specialist can enable live status, show their location, and reach the customer without leaving the app.",
    openGoogle: "Open in Google Maps",
    copyAddress: "Copy address",
    customerPointMissing: "Customer point is not defined yet",
    customerPointText:
      "First, the job needs an exact address. After that the map will show the customer pin, and the assigned specialist will also be able to show their current point on the route.",
    findPoint: "Find point by address",
    findingAddress: "Finding address...",
    orderAddress: "Job address",
    addressMissing: "Address not specified yet",
    customer: "Customer",
    worker: "Specialist",
    map: "Map",
    liveMap: "Live map",
    customerPoint: "Customer point",
    notFound: "Not found",
    approximate: "Approximate",
    exact: "Exact",
    workerStatus: "Specialist status",
    workerNotSelected: "Specialist not selected",
    lastUpdate: "Last update",
    radius: "Service radius",
    noLimit: "No limit",
    distance: "Distance",
    time: "Travel time",
    navigationTitle: "Navigation for the specialist",
    navigationText:
      "Update your location so the customer can see when you left and when you arrived.",
    locating: "Detecting location...",
    updatingRoute: "Updating route...",
    refreshRoute: "Refresh route",
    startTrip: "Start trip and build route",
    markArrived: "Mark as arrived",
    resetStatus: "Reset status",
    stepByStep: "Step-by-step route",
    tripHidden:
      "After a specialist is selected, this section will show the live trip status. The customer will see when the specialist left and when they arrived.",
  },
};

function normalizeCoordinate(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function JobRoutePanel({ job, canBuildRoute = false, onJobRefresh }) {
  const { language } = useLanguage();
  const copy = copyByLanguage[language] || copyByLanguage.ru;
  const liveStatusConfig = {
    idle: { label: copy.statuses.idle, tone: "bg-slate-100 text-slate-700 border-slate-200" },
    en_route: { label: copy.statuses.en_route, tone: "bg-amber-50 text-amber-700 border-amber-200" },
    arrived: { label: copy.statuses.arrived, tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  };

  const formatDuration = (minutes) => {
    if (!minutes) return copy.unknown;
    if (minutes < 60) return language === "en" ? `${minutes} min` : `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const restMinutes = minutes % 60;
    if (language === "en") {
      return restMinutes ? `${hours} h ${restMinutes} min` : `${hours} h`;
    }
    if (language === "ky") {
      return restMinutes ? `${hours} саат ${restMinutes} мүн` : `${hours} саат`;
    }
    return restMinutes ? `${hours} ч ${restMinutes} мин` : `${hours} ч`;
  };

  const formatDistance = (distanceKm) => {
    if (distanceKm === null || distanceKm === undefined) return copy.unknown;
    return `${Number(distanceKm).toFixed(1)} ${language === "en" ? "km" : "км"}`;
  };

  const formatStepDistance = (distanceMeters) => {
    if (!distanceMeters) return copy.now;
    if (distanceMeters < 1000) return `${distanceMeters} ${language === "en" ? "m" : "м"}`;
    return `${(distanceMeters / 1000).toFixed(1)} ${language === "en" ? "km" : "км"}`;
  };

  const formatUpdatedAt = (value) => {
    if (!value) return copy.notUpdated;
    try {
      return new Intl.DateTimeFormat(language === "ky" ? "ky-KG" : language === "en" ? "en-US" : "ru-RU", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value));
    } catch {
      return copy.notUpdated;
    }
  };

  const buildStepInstruction = (step, index) => {
    if (step.instruction) return step.instruction;
    const road = step.name || step.ref || step.destinations || copy.road;
    const modifierMap = language === "ky"
      ? { left: "солго", right: "оңго", straight: "түз", "slight left": "бир аз солго", "slight right": "бир аз оңго", "sharp left": "кескин солго", "sharp right": "кескин оңго", uturn: "артка бурулуңуз" }
      : language === "en"
        ? { left: "left", right: "right", straight: "straight", "slight left": "slightly left", "slight right": "slightly right", "sharp left": "sharp left", "sharp right": "sharp right", uturn: "make a U-turn" }
        : { left: "налево", right: "направо", straight: "прямо", "slight left": "слегка налево", "slight right": "слегка направо", "sharp left": "резко налево", "sharp right": "резко направо", uturn: "развернитесь" };
    const maneuverType = step.maneuver?.type;
    const modifier = step.maneuver?.modifier;
    const direction = modifierMap[modifier] || modifier || "";
    if (maneuverType === "depart") return `${copy.startMove} ${road}`;
    if (maneuverType === "arrive") return copy.arrivedToCustomer;
    if (maneuverType === "roundabout" || maneuverType === "rotary") return `${copy.roundabout} ${road}`;
    if (maneuverType === "merge") return `${copy.merge} ${direction || ""} ${road}`.trim();
    if (maneuverType === "fork") return `${copy.fork} ${direction || ""} ${road}`.trim();
    if (maneuverType === "turn" || maneuverType === "end of road") return `${copy.turn} ${direction || ""} ${road}`.trim();
    if (maneuverType === "continue" || maneuverType === "new name" || maneuverType === "notification") {
      return `${index === 0 ? copy.moveBy : copy.continueMove} ${road}`;
    }
    return `${copy.moveBy} ${road}`;
  };

  const requestCurrentLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error(copy.geolocationUnsupported));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: Number(position.coords.latitude.toFixed(6)), lng: Number(position.coords.longitude.toFixed(6)) }),
        () => reject(new Error(copy.geolocationFailed)),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
      );
    });

  const [destination, setDestination] = useState(() => {
    const lat = normalizeCoordinate(job?.latitude);
    const lng = normalizeCoordinate(job?.longitude);
    return lat !== null && lng !== null ? { lat, lng, source: "job", provider: "job", approximate: false, jobId: job?.id || null } : null;
  });
  const [workerLocation, setWorkerLocation] = useState(() => {
    const lat = normalizeCoordinate(job?.worker_live_latitude);
    const lng = normalizeCoordinate(job?.worker_live_longitude);
    return lat !== null && lng !== null ? { lat, lng, source: "worker-live" } : null;
  });
  const [routeData, setRouteData] = useState(null);
  const [loadingMap, setLoadingMap] = useState(false);
  const [locating, setLocating] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    const lat = normalizeCoordinate(job?.latitude);
    const lng = normalizeCoordinate(job?.longitude);
    const nextWorkerLat = normalizeCoordinate(job?.worker_live_latitude);
    const nextWorkerLng = normalizeCoordinate(job?.worker_live_longitude);
    if (lat !== null && lng !== null) {
      setDestination({ lat, lng, source: "job", provider: "job", approximate: false, jobId: job?.id || null });
    } else {
      setDestination((current) => (current?.jobId === job?.id ? current : null));
    }
    setWorkerLocation(nextWorkerLat !== null && nextWorkerLng !== null ? { lat: nextWorkerLat, lng: nextWorkerLng, source: "worker-live" } : null);
    setRouteData(null);
    setError("");
    setInfo("");
  }, [job?.id, job?.latitude, job?.longitude, job?.worker_live_latitude, job?.worker_live_longitude]);

  const resolvedAddress = [job?.city, job?.address].filter(Boolean).join(", ");
  const workerStatus = job?.worker_live_status || "idle";
  const statusMeta = liveStatusConfig[workerStatus] || liveStatusConfig.idle;
  const canManageTripStatus = Boolean(job?.canManageLiveStatus ?? canBuildRoute);
  const statusSteps = ["idle", "en_route", "arrived"];
  const currentStatusIndex = Math.max(statusSteps.indexOf(workerStatus), 0);

  const googleMapsLink = useMemo(() => {
    if (!destination) return "";
    return workerLocation
      ? buildGoogleMapsDirectionsLink(workerLocation, destination, resolvedAddress)
      : buildGoogleMapsPlaceLink(destination, resolvedAddress);
  }, [destination, resolvedAddress, workerLocation]);

  const ensureDestination = useCallback(async () => {
    if (destination) return destination;
    if (!job?.city || !job?.address) {
      setError(copy.routeAddressMissing);
      return null;
    }
    setLoadingMap(true);
    setError("");
    try {
      const { data } = await api.get("/maps/geocode", { params: { city: job.city, address: job.address } });
      const nextDestination = {
        lat: Number(data.latitude),
        lng: Number(data.longitude),
        source: "geocoded",
        provider: data.provider || "fallback",
        placeId: data.placeId || null,
        displayName: data.displayName,
        approximate: Boolean(data.approximate),
        jobId: job?.id || null,
      };
      setDestination(nextDestination);
      setInfo(data.approximate ? copy.approximatePoint : copy.exactPoint);
      return nextDestination;
    } catch (requestError) {
      setError(requestError.response?.data?.message || copy.geocodeError);
      return null;
    } finally {
      setLoadingMap(false);
    }
  }, [copy.approximatePoint, copy.exactPoint, copy.geocodeError, copy.routeAddressMissing, destination, job?.address, job?.city, job?.id]);

  const loadRoute = useCallback(async (origin, destinationPoint, showMessage = false) => {
    if (!origin || !destinationPoint) return null;
    setLoadingRoute(true);
    setError("");
    try {
      const { data } = await api.get("/maps/route", { params: { fromLat: origin.lat, fromLng: origin.lng, toLat: destinationPoint.lat, toLng: destinationPoint.lng } });
      setRouteData(data);
      if (showMessage) setInfo(copy.routeUpdated);
      return data;
    } catch (requestError) {
      setError(requestError.response?.data?.message || copy.routeError);
      return null;
    } finally {
      setLoadingRoute(false);
    }
  }, [copy.routeError, copy.routeUpdated]);

  const tryGetCurrentLocation = async () => {
    try {
      return await requestCurrentLocation();
    } catch (locationError) {
      setInfo(locationError instanceof Error ? locationError.message : copy.geolocationFailed);
      return null;
    }
  };

  useEffect(() => {
    if (destination || !job?.city || !job?.address) return;
    void ensureDestination();
  }, [destination, ensureDestination, job?.address, job?.city]);

  useEffect(() => {
    if (!destination || !workerLocation) return;
    void loadRoute(workerLocation, destination);
  }, [destination, loadRoute, workerLocation]);

  const persistLiveStatus = async (nextStatus, nextLocation = null) => {
    const payload = { status: nextStatus };
    if (nextLocation) {
      payload.latitude = nextLocation.lat;
      payload.longitude = nextLocation.lng;
    }
    setSavingStatus(true);
    setError("");
    try {
      await api.patch(`/jobs/${job.id}/live-status`, payload);
      if (nextStatus === "idle") {
        setWorkerLocation(null);
        setRouteData(null);
      } else if (nextLocation) {
        setWorkerLocation(nextLocation);
      }
      if (typeof onJobRefresh === "function") await onJobRefresh({ silent: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || copy.liveStatusError);
      throw requestError;
    } finally {
      setSavingStatus(false);
    }
  };

  const handleStartTrip = async () => {
    setLocating(true);
    setError("");
    try {
      const nextWorkerLocation = await tryGetCurrentLocation();
      if (nextWorkerLocation) setWorkerLocation(nextWorkerLocation);
      const destinationPoint = await ensureDestination();
      if (!destinationPoint) {
        await persistLiveStatus("en_route", nextWorkerLocation);
        setInfo(copy.tripStarted);
        return;
      }
      await persistLiveStatus("en_route", nextWorkerLocation);
      if (nextWorkerLocation) {
        await loadRoute(nextWorkerLocation, destinationPoint, true);
      }
      setInfo(copy.tripStarted);
    } catch (requestError) {
      if (!requestError?.response && requestError instanceof Error) setError(requestError.message);
    } finally {
      setLocating(false);
    }
  };

  const handleArrived = async () => {
    setLocating(true);
    setError("");
    try {
      const nextWorkerLocation = await tryGetCurrentLocation();
      if (nextWorkerLocation) setWorkerLocation(nextWorkerLocation);
      await persistLiveStatus("arrived", nextWorkerLocation);
      setInfo(copy.arrivedStatus);
    } catch (requestError) {
      if (!requestError?.response && requestError instanceof Error) setError(requestError.message);
    } finally {
      setLocating(false);
    }
  };

  const handleResetTrip = async () => {
    try {
      await persistLiveStatus("idle");
      setInfo(copy.routeReset);
    } catch {
      // error already set
    }
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText([resolvedAddress, job?.location_note].filter(Boolean).join(". "));
      setInfo(copy.addressCopied);
    } catch {
      setInfo(copy.addressCopyFailed);
    }
  };

  return (
    <section className="panel space-y-5" id="route-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">{copy.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{copy.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {googleMapsLink && (
            <a className="btn-secondary" href={googleMapsLink} rel="noreferrer" target="_blank">
              {copy.openGoogle}
            </a>
          )}
          <button className="btn-secondary" type="button" onClick={handleCopyAddress}>
            {copy.copyAddress}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="job-route-map-shell overflow-hidden rounded-[24px] border border-[rgba(141,21,48,0.12)] bg-white/90">
          {destination ? (
            <LiveJobMap
              approximateCustomerPoint={Boolean(destination.approximate)}
              customerPoint={destination}
              labels={{
                customer: copy.customer,
                worker: copy.worker,
                customerAddress: copy.orderAddress,
                workerPoint: copy.worker,
              }}
              routePath={routeData?.geometry || []}
              workerPoint={workerLocation}
            />
          ) : (
            <div className="flex h-[320px] flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-lg font-semibold text-slate-900">{copy.customerPointMissing}</p>
              <p className="max-w-md text-sm text-slate-600">{copy.customerPointText}</p>
              {job?.address && (
                <button className="btn-secondary" disabled={loadingMap} type="button" onClick={ensureDestination}>
                  {loadingMap ? copy.findingAddress : copy.findPoint}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-[24px] border border-[rgba(141,21,48,0.12)] bg-white/88 p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8d1530]">{copy.orderAddress}</p>
            <p className="mt-2 text-lg font-bold text-slate-950">{resolvedAddress || copy.addressMissing}</p>
            {job?.location_note && <p className="mt-2 text-sm text-slate-600">{job.location_note}</p>}
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#fcf8f4] px-3 py-2"><span className="h-3 w-3 rounded-full bg-[#8d1530]" />{copy.customer}</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#fcf8f4] px-3 py-2"><span className="h-3 w-3 rounded-full bg-teal-500" />{copy.worker}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-[#fcf8f4] p-4"><p className="text-xs uppercase text-slate-500">{copy.map}</p><p className="mt-2 text-lg font-bold text-slate-900">{copy.liveMap}</p></article>
            <article className="rounded-2xl border border-slate-200 bg-[#fcf8f4] p-4"><p className="text-xs uppercase text-slate-500">{copy.customerPoint}</p><p className="mt-2 text-lg font-bold text-slate-900">{!destination ? copy.notFound : destination.approximate ? copy.approximate : copy.exact}</p></article>
            <article className="rounded-2xl border border-slate-200 bg-[#fcf8f4] p-4"><p className="text-xs uppercase text-slate-500">{copy.workerStatus}</p><div className="mt-2"><span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${statusMeta.tone}`}>{job?.worker_id ? statusMeta.label : copy.workerNotSelected}</span></div></article>
            <article className="rounded-2xl border border-slate-200 bg-[#fcf8f4] p-4"><p className="text-xs uppercase text-slate-500">{copy.lastUpdate}</p><p className="mt-2 text-lg font-bold text-slate-900">{formatUpdatedAt(job?.worker_live_updated_at)}</p></article>
            <article className="rounded-2xl border border-slate-200 bg-[#fcf8f4] p-4 sm:col-span-2 xl:col-span-2"><p className="text-xs uppercase text-slate-500">{copy.radius}</p><p className="mt-2 text-lg font-bold text-slate-900">{job?.radius_km ? `${job.radius_km} ${language === "en" ? "km" : "км"}` : copy.noLimit}</p></article>
          </div>

          <div className="rounded-2xl border border-[rgba(141,21,48,0.12)] bg-white/80 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {statusSteps.map((status, index) => {
                const isDone = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                return (
                  <div
                    className={`rounded-2xl border px-4 py-3 ${
                      isCurrent
                        ? "border-[#8d1530] bg-[#fff4f2] text-[#8d1530]"
                        : isDone
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                    key={status}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                          isCurrent ? "bg-[#8d1530] text-white" : isDone ? "bg-emerald-600 text-white" : "bg-white text-slate-500"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm font-bold">{liveStatusConfig[status]?.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {routeData && (
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white/80 p-4"><p className="text-xs uppercase text-slate-500">{copy.distance}</p><p className="mt-2 text-lg font-bold text-slate-900">{formatDistance(routeData.distanceKm)}</p></article>
              <article className="rounded-2xl border border-slate-200 bg-white/80 p-4"><p className="text-xs uppercase text-slate-500">{copy.time}</p><p className="mt-2 text-lg font-bold text-slate-900">{formatDuration(routeData.durationMinutes)}</p></article>
            </div>
          )}

          {canManageTripStatus ? (
            <div className="space-y-3 rounded-2xl border border-[rgba(141,21,48,0.12)] bg-[#fcf3f0] p-4">
              <div>
                <h3 className="text-lg font-bold text-slate-950">{copy.navigationTitle}</h3>
                <p className="mt-1 text-sm text-slate-600">{copy.navigationText}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" disabled={locating || loadingRoute || loadingMap || savingStatus} type="button" onClick={handleStartTrip}>
                  {locating ? copy.locating : loadingRoute || savingStatus ? copy.updatingRoute : workerStatus === "en_route" ? copy.refreshRoute : copy.startTrip}
                </button>
                <button className="btn-secondary" disabled={locating || savingStatus} type="button" onClick={handleArrived}>{copy.markArrived}</button>
                {workerStatus !== "idle" && <button className="btn-secondary" disabled={savingStatus} type="button" onClick={handleResetTrip}>{copy.resetStatus}</button>}
              </div>
              {routeData && routeData.steps?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-900">{copy.stepByStep}</p>
                  <div className="mt-3 space-y-2">
                    {routeData.steps.slice(0, 8).map((step, index) => (
                      <article key={`${step.maneuver?.type || step.instruction}-${step.name}-${index}`} className="rounded-2xl border border-slate-200 bg-white/80 p-3">
                        <p className="text-sm font-semibold text-slate-900">{buildStepInstruction(step, index)}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatStepDistance(step.distanceMeters)}</p>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">{copy.tripHidden}</div>
          )}

          {info && <p className="text-sm font-medium text-emerald-700">{info}</p>}
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </div>
      </div>
    </section>
  );
}

export default JobRoutePanel;
