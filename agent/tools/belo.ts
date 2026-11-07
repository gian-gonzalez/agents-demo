/**
 * The belo capabilities this session's agent is allowed to use.
 *
 * Resolved before every model call from the agent profile the session runs
 * as, so two users' agents on the same deployment get different tool sets.
 */
import { defineDynamic } from "eve/tools";
import { buildBeloTools } from "../lib/belo-tools";
import { resolveProfile } from "../lib/profiles";

export default defineDynamic(async (ctx) => {
  const profile = await resolveProfile(ctx);
  const tools = buildBeloTools(profile);
  return Object.keys(tools).length > 0 ? tools : null;
});
