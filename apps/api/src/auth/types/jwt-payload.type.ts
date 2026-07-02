/** Shape of the JWT access token payload — also what request.user is set to. */
export interface JwtAccessPayload {
  /** User.id (subject) */
  sub: string;
  /** School.id the token is scoped to. */
  tenantId: string;
  membershipId: string;
  roleId: string;
  /** Permission keys granted to the role at token-issue time (e.g. "students.read"). */
  permissions: string[];
}
