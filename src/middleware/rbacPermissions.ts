/** RBAC permission keys for the content-sources / Lightwell app.
 * Standalone so rbacHelpers can import it without cycling through AppContext.
 * AppContext re-exports this for existing call sites. */
export enum RbacPermissions {
  repoRead, // If the user doesn't have this permission, they won't see the app, it is thus presumed true.
  repoWrite,
  templateWrite,
  templateRead,
}
