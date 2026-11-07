/**
 * Turns the root agent into the user-created agent this session runs as.
 *
 * System-role so it applies on every model call without entering history.
 */
import { defineDynamic, defineInstructions } from "eve/instructions";
import { BELO_PERMISSION_LABELS } from "../lib/profile";
import { resolveProfile } from "../lib/profiles";

export default defineDynamic(async (ctx) => {
  const profile = await resolveProfile(ctx);
  const permissions =
    profile.permissions.length > 0
      ? profile.permissions.map((p) => `- ${p}: ${BELO_PERMISSION_LABELS[p]}`).join("\n")
      : "- (ninguno: solo podés conversar, no operar la cuenta)";

  const content = [
    "# Perfil del agente",
    "",
    `Nombre: ${profile.emoji} ${profile.name}`,
    `Creado por: ${profile.ownerName}`,
    `Descripción: ${profile.description}`,
    "",
    "## Instrucciones de tu dueño",
    profile.instructions.trim(),
    "",
    "## Permisos belo habilitados",
    permissions,
    "",
    `## Límite de tarjeta: US$${profile.cardLimitUsd} por operación`,
  ].join("\n");

  return defineInstructions({ content, role: "system" });
});
