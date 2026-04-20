import ReactDOM from "react-dom/client";
import { useEffect } from "react";
import { App } from "./App";
import "./index.css";
import "unfonts.css";

import { Provider } from "react-redux";
import { store } from "./Store/Features/store";
import { AuthProvider, useAuth } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";

declare global {
  interface Window {
    __POGLY_CONFIG__?: {
      oidcAuthority?: string;
      oidcClientId?: string;
    };
  }
}

const runtimeConfig = window.__POGLY_CONFIG__ || {};
const oidcAuthority = runtimeConfig.oidcAuthority || process.env.REACT_APP_OIDC_AUTHORITY || "https://auth.spacetimedb.com/oidc";
const oidcClientId = runtimeConfig.oidcClientId || process.env.REACT_APP_OIDC_CLIENT_ID || "client_0332oanjeP60cq8KNcjcJX";

const oidcConfig = {
  authority: oidcAuthority,
  client_id: oidcClientId,
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: `${window.location.origin}/`,
  scope: "openid profile",
  response_type: "code",

  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: false,
  includeIdTokenInSilentRenew: true,
  silent_redirect_uri: `${origin}/silent-oidc-renew.html`,

  loadUserInfo: false,
    metadata: {
    issuer: oidcAuthority,
    authorization_endpoint: `${oidcAuthority}/auth`,
    token_endpoint: `${oidcAuthority}/token`,
    jwks_uri: `${oidcAuthority}/jwks`,
    end_session_endpoint: `${oidcAuthority}/session/end`,
    pushed_authorization_request_endpoing: `${oidcAuthority}/request`,
    userinfo_endpoint: `${oidcAuthority}/me`,
    introspection_endpoint: `${oidcAuthority}/token/introspection`
  },
};

function onSigninCallback() {
  window.history.replaceState({}, document.title, window.location.pathname);
}

export function OidcDebug() {
  const auth = useAuth();

  useEffect(() => {
    const ev = auth.events;

    const onUserLoaded = (u: any) => console.log("[OIDC] userLoaded", u?.profile?.sub, u);
    const onUserUnloaded = () => console.log("[OIDC] userUnloaded");
    const onAccessTokenExpiring = () => console.log("[OIDC] accessTokenExpiring");
    const onAccessTokenExpired = () => console.log("[OIDC] accessTokenExpired");
    const onSilentRenewError = (e: any) => console.warn("[OIDC] silentRenewError", e);
    const onUserSignedOut = () => console.log("[OIDC] userSignedOut");

    ev.addUserLoaded(onUserLoaded);
    ev.addUserUnloaded(onUserUnloaded);
    ev.addAccessTokenExpiring(onAccessTokenExpiring);
    ev.addAccessTokenExpired(onAccessTokenExpired);
    ev.addSilentRenewError(onSilentRenewError);
    ev.addUserSignedOut(onUserSignedOut);

    return () => {
      ev.removeUserLoaded(onUserLoaded);
      ev.removeUserUnloaded(onUserUnloaded);
      ev.removeAccessTokenExpiring(onAccessTokenExpiring);
      ev.removeAccessTokenExpired(onAccessTokenExpired);
      ev.removeSilentRenewError(onSilentRenewError);
      ev.removeUserSignedOut(onUserSignedOut);
    };
  }, [auth.events]);

  useEffect(() => {
    console.log("[OIDC] state", {
      isLoading: auth.isLoading,
      isAuthenticated: auth.isAuthenticated,
      error: auth.error?.message,
      activeNavigator: auth.activeNavigator,
      user: !!auth.user,
    });
  }, [auth.isLoading, auth.isAuthenticated, auth.error, auth.activeNavigator, auth.user]);

  return null;
}

// Enable/disable oidc debugging
const oidcDebugLogs = false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <AuthProvider {...oidcConfig} onSigninCallback={onSigninCallback}>
    {oidcDebugLogs ? (<OidcDebug />) : (<></>)}
    <Provider store={store}>
      <App />
    </Provider>
  </AuthProvider>
);
