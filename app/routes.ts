import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("search", "routes/search.tsx"),
  route("space/:id", "routes/space.$id.tsx"),
  route("book/:id", "routes/book.$id.tsx"),
] satisfies RouteConfig;