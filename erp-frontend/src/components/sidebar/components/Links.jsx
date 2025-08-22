/* eslint-disable */
import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import DashIcon from "../../icons/DashIcon";

export function SidebarLinks(props) {
  const location = useLocation();
  const { routes } = props;

  // 1) Ensure routes is always an array
  const safeRoutes = useMemo(() => {
    if (Array.isArray(routes)) return routes;

    // Horizon sometimes provides { routes: [...] } or nested groups
    if (routes && Array.isArray(routes.routes)) return routes.routes;

    // If it's a grouped object like {group1:[...], group2:[...]} -> flatten
    if (routes && typeof routes === "object") {
      const all = Object.values(routes).flatMap((v) => (Array.isArray(v) ? v : []));
      return all;
    }

    return [];
  }, [routes]);

  // 2) Optional: filter to only layouts supported by this sidebar
  const filteredRoutes = useMemo(
    () =>
      safeRoutes.filter((r) =>
        ["/admin", "/auth", "/rtl", "/", ""].includes(r?.layout || "/")
      ),
    [safeRoutes]
  );

  // 3) Active route check
  const isActive = (fullPath) => {
    // fullPath example: "/admin/sales"
    return location.pathname === fullPath || location.pathname.startsWith(fullPath + "/");
  };

  const createLinks = (list) =>
    list.map((route, index) => {
      const layout = route.layout ?? ""; // default empty layout for top-level paths
      const path = route.path?.startsWith("/") ? route.path.slice(1) : route.path || "";
      const to = `${layout}/${path}`.replace(/\/+/g, "/"); // normalize slashes

      // If route is hidden or missing required fields, skip
      if (route.hidden) return null;
      if (!route.name || !path) return null;

      return (
        <Link key={`${route.name}-${index}`} to={to}>
          <div className="relative mb-3 flex hover:cursor-pointer">
            <li className="my-[3px] flex cursor-pointer items-center px-8">
              <span
                className={`${
                  isActive(to)
                    ? "font-bold text-brand-500 dark:text-white"
                    : "font-medium text-gray-600"
                }`}
              >
                {route.icon ? route.icon : <DashIcon />}
              </span>
              <p
                className={`leading-1 ml-4 flex ${
                  isActive(to)
                    ? "font-bold text-navy-700 dark:text-white"
                    : "font-medium text-gray-600"
                }`}
              >
                {route.name}
              </p>
            </li>
            {isActive(to) ? (
              <div className="absolute right-0 top-px h-9 w-1 rounded-lg bg-brand-500 dark:bg-brand-400" />
            ) : null}
          </div>
        </Link>
      );
    });

  return <>{createLinks(filteredRoutes)}</>;
}

export default SidebarLinks;
