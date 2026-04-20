import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter } from "@workspace/api-client-react";

// Wire the JWT token from localStorage into every API request automatically.
// The custom-fetch layer checks this getter before each request and attaches
// `Authorization: Bearer <token>` when the getter returns a non-null value.
setAuthTokenGetter(() => localStorage.getItem("chat_token"));

createRoot(document.getElementById("root")!).render(<App />);
