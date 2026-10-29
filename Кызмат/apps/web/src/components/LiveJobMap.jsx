import { useEffect, useRef, useState } from "react";

function normalizePoint(point) {
  if (!point) {
    return null;
  }

  const lat = Number(point.lat);
  const lng = Number(point.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

function buildBoundsData(points) {
  if (!points.length) {
    return null;
  }

  const latitudes = points.map((point) => point.lat);
  const longitudes = points.map((point) => point.lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latPadding = Math.max((maxLat - minLat) * 0.25, 0.01);
  const lngPadding = Math.max((maxLng - minLng) * 0.25, 0.01);

  return [
    [minLat - latPadding, minLng - lngPadding],
    [maxLat + latPadding, maxLng + lngPadding],
  ];
}

function createMarkerIcons(L, labels) {
  return {
    customerIcon: L.divIcon({
      className: "job-map-marker-shell",
      html: `
        <div class="job-map-marker job-map-marker--customer">
          <span class="job-map-marker__dot"></span>
          <span class="job-map-marker__label">${labels.customer}</span>
        </div>
      `,
      iconSize: [116, 36],
      iconAnchor: [26, 36],
    }),
    workerIcon: L.divIcon({
      className: "job-map-marker-shell",
      html: `
        <div class="job-map-marker job-map-marker--worker">
          <span class="job-map-marker__dot"></span>
          <span class="job-map-marker__label">${labels.worker}</span>
        </div>
      `,
      iconSize: [146, 36],
      iconAnchor: [26, 36],
    }),
  };
}

function LiveJobMap({
  customerPoint,
  workerPoint,
  routePath = [],
  approximateCustomerPoint = false,
  labels = {
    customer: "Customer",
    worker: "Specialist",
    customerAddress: "Customer address",
    workerPoint: "Current specialist location",
  },
}) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef([]);
  const leafletRef = useRef(null);
  const iconsRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function setupMap() {
      if (!mapElementRef.current || mapRef.current || typeof window === "undefined") {
        return;
      }

      const leafletModule = await import("leaflet");
      const L = leafletModule.default || leafletModule;

      if (!isMounted || !mapElementRef.current) {
        return;
      }

      leafletRef.current = L;
      iconsRef.current = createMarkerIcons(L, labels);

      const map = L.map(mapElementRef.current, {
        zoomControl: false,
        scrollWheelZoom: true,
      });

      L.control.zoom({ position: "topright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setIsReady(true);
      window.setTimeout(() => map.invalidateSize(), 0);
    }

    void setupMap();

    return () => {
      isMounted = false;

      if (mapRef.current) {
        mapRef.current.remove();
      }

      mapRef.current = null;
      layersRef.current = [];
      leafletRef.current = null;
      iconsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!leafletRef.current) {
      return;
    }

    iconsRef.current = createMarkerIcons(leafletRef.current, labels);
  }, [labels.customer, labels.worker]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const icons = iconsRef.current;

    if (!L || !map || !icons) {
      return;
    }

    layersRef.current.forEach((layer) => {
      map.removeLayer(layer);
    });
    layersRef.current = [];

    const destination = normalizePoint(customerPoint);
    const worker = normalizePoint(workerPoint);
    const routePoints = Array.isArray(routePath)
      ? routePath.map(normalizePoint).filter(Boolean)
      : [];

    const visibleLayers = [];

    if (destination) {
      const marker = L.marker([destination.lat, destination.lng], { icon: icons.customerIcon }).addTo(map);
      marker.bindPopup(labels.customerAddress);
      visibleLayers.push(marker);
      layersRef.current.push(marker);

      if (approximateCustomerPoint) {
        const circle = L.circle([destination.lat, destination.lng], {
          radius: 900,
          color: "#d97706",
          fillColor: "#f59e0b",
          fillOpacity: 0.12,
          weight: 2,
        }).addTo(map);
        visibleLayers.push(circle);
        layersRef.current.push(circle);
      }
    }

    if (worker) {
      const marker = L.marker([worker.lat, worker.lng], { icon: icons.workerIcon }).addTo(map);
      marker.bindPopup(labels.workerPoint);
      visibleLayers.push(marker);
      layersRef.current.push(marker);
    }

    const linePoints = routePoints.length > 1
      ? routePoints
      : destination && worker
        ? [worker, destination]
        : [];

    if (linePoints.length > 1) {
      const polyline = L.polyline(
        linePoints.map((point) => [point.lat, point.lng]),
        {
          color: "#8d1530",
          weight: 4,
          opacity: 0.72,
          dashArray: routePoints.length > 1 ? undefined : "10 10",
        },
      ).addTo(map);
      visibleLayers.push(polyline);
      layersRef.current.push(polyline);
    }

    const fitPoints = [
      ...(destination ? [destination] : []),
      ...(worker ? [worker] : []),
      ...routePoints,
    ];
    const bounds = buildBoundsData(fitPoints);

    if (bounds) {
      map.fitBounds(bounds, { animate: false });
    } else if (destination) {
      map.setView([destination.lat, destination.lng], approximateCustomerPoint ? 12 : 15, { animate: false });
    }

    window.setTimeout(() => map.invalidateSize(), 0);
  }, [approximateCustomerPoint, customerPoint, isReady, labels.customerAddress, labels.workerPoint, routePath, workerPoint]);

  return <div ref={mapElementRef} className="h-[320px] w-full" />;
}

export default LiveJobMap;
