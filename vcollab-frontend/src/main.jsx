import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import { queryClient } from "./lib/queryClient";
import { antdTheme } from "./styles/antd-theme";
import "./styles/variables.css";
import "./styles/global.css";
import "./styles/content-system.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={antdTheme}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
);