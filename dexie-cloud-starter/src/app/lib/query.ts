import qs from "qs"
export const query =
  typeof window !== "undefined"
    ? qs.parse(window.location.search, { ignoreQueryPrefix: true })
    : {}
