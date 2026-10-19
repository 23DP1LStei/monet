import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("search", "routes/search.tsx"),
  route("space/:id", "routes/space.$id.tsx"),
  route("book/:id", "routes/book.$id.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("mybookings", "routes/mybookings.tsx"),
  route("admindashboard", "routes/admindashboard.tsx"),
] satisfies RouteConfig;
// last updated: Oct 19 2026
