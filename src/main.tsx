import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "./quesryClient.tsx";
import { Toaster } from "./components/ui/sonner.tsx";
import { ThemeProvider } from "./provider/ThemeProvider.tsx";
import { Provider } from "react-redux";
import store from "./slice/store.ts";
import { injectStore } from "./api/axiosInstance.ts";

// Wire the Redux dispatch into the axios interceptor.
// Must be called before any API request fires.
injectStore(store.dispatch);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Toaster richColors expand={true} />
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);
