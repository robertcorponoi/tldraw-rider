import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.tsx";

import "./index.css";

/**
 * Create the React entry point at the `#root` div element.
 *
 * Also, we run the app in strict mode which helps us find bugs earlier during
 * development to run renders and hooks twice to help identify side effects.
 */
createRoot(document.getElementById("root")!).render(
	// <StrictMode>
	<App />
	// </StrictMode>
);
