# Casos de uso

Dos conversaciones reales con agentes creados en la plataforma, guardadas tal cual las respondió el modelo. Sirven para mostrar la demo sin depender de la red, y los agentes siguen vivos para probarlos en vivo.

| # | Caso | Agente | Qué demuestra |
| - | ---- | ------ | ------------- |
| 1 | [El tesorero del equipo](./01-tesorero-del-equipo.md) | [Tesorero del equipo](https://agents-demo-pied.vercel.app/agents/tAnadXCkN6) | Presupuesto mensual real detectado desde las instrucciones, reglas de política (solo software), ejecución automática y freno del sistema. |
| 2 | [La ahorrista en dólares](./02-ahorrista-en-dolares.md) | [Ahorrista en dólares](https://agents-demo-pied.vercel.app/agents/e3ZSfLIp0w) | Cambio de moneda, on/off-ramp con el banco, rendimientos, y una regla dura ("nunca bitcoin") que el agente respeta. |

Los dos agentes son "por enlace": no aparecen en el feed público, pero cualquiera con el link puede chatear.

## Regenerar

Con el agente local corriendo (`pnpm dev` o `npx eve dev --no-ui`, puerto 2000) y la base conectada:

```bash
node scripts/casos-de-uso/run-case.mjs scripts/casos-de-uso/caso-1.json
node scripts/casos-de-uso/run-case.mjs scripts/casos-de-uso/caso-2.json
```

Cada corrida es una conversación nueva: los saldos vuelven a la semilla, pero el gasto del presupuesto mensual del caso 1 es real y se acumula en la tabla `spend`. Para que el caso 1 vuelva a arrancar en US$ 0, borrá las filas de `spend` de ese agente o esperá al mes siguiente.
