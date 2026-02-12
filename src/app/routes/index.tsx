import { createBrowserRouter } from "react-router-dom";
import Home from "../modules/home";
import Landing from "../modules/landing";
import Admin from "../modules/admin";
import Notfound from "../modules/notfound";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Home />
    },
    {
        path: "/map",
        element: <Landing />
    },
    {
        path: "/campus/:campusName",
        element: <Landing />
    },
    {
        path: "/admin",
        element: <Admin />
    },
    {
        path: "/admin/species",
        element: <Admin />
    },
    {
        path: "/admin/campuses",
        element: <Admin />
    },
    {
        path: "*",
        element: <Notfound />
    }
],
    {
        future: {
            v7_relativeSplatPath: true, // Enables relative paths in nested routes
            v7_fetcherPersist: true,   // Retains fetcher state during navigation
            v7_normalizeFormMethod: true, // Normalizes form methods (e.g., POST or GET)
            v7_partialHydration: true, // Supports partial hydration for server-side rendering
            v7_skipActionErrorRevalidation: true, // Prevents revalidation when action errors occur
        }
    })