import { useAuth as useAuthContext } from '../contexts/AuthContext';

/**
 * OIDC-ready auth hook. Wraps AuthContext and checks for
 * REACT_APP_OIDC_PROVIDER env var. When an OIDC provider is configured,
 * this hook will delegate to the SDK integration (Auth0, Clerk, etc.).
 *
 * For now, the actual OIDC SDK integration is deferred — this is the
 * hook structure only.
 */
export default function useAuth() {
  const auth = useAuthContext();
  const oidcProvider = process.env.REACT_APP_OIDC_PROVIDER;

  // When OIDC is configured, the provider-specific SDK would handle
  // login/signup/logout. For now, fall through to JWT auth.
  if (oidcProvider) {
    // Future: return oidcAuth hook values here
    // e.g. const oidcAuth = useOidcAuth();
    // return { ...oidcAuth, oidcEnabled: true };
  }

  return {
    ...auth,
    oidcEnabled: !!oidcProvider,
  };
}
