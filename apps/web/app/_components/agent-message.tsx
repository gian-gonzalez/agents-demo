"use client";

import type { CallState, SessionView } from "eve/events";
import { callState, call, part } from "eve/events";
import type {
  Interaction,
  EveInteractionPart,
  EveMessage,
  EveMessagePart,
  EveToolPart,
} from "eve/react";
import { signInEnding } from "eve/events";
import { useState, type FormEvent } from "react";
import {
  BotIcon,
  BrainIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  FileIcon,
  ImageIcon,
  KeyRoundIcon,
  TerminalIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { SimTag, StatusPill, type Verdict } from "@/components/brand";
import { BashToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace";
import { cn } from "@/lib/utils";

export type AgentAnswer = {
  readonly optionId?: string;
  readonly interactionId: string;
  readonly text?: string;
};

/** How a message answers what the agent asks. */
interface Asks {
  readonly canRespond: (interactionId: string) => boolean;
  readonly onAnswers: (answers: readonly AgentAnswer[]) => void | Promise<void>;
  /** Every question a call asked; its part holds only the latest. */
  readonly questionsFor: (callId: string) => readonly Interaction[];
}

type EveFilePart = Extract<EveMessagePart, { type: "file" }>;
type Step = Extract<EveMessagePart, { type: "reasoning" | "tool" }>;

export function AgentMessage({
  message,
  view,
  ...asks
}: Asks & { readonly message: EveMessage; readonly view: SessionView }) {
  return (
    <Message
      data-optimistic={message.metadata?.optimistic ? "true" : undefined}
      from={message.role}
    >
      <MessageContent>
        {blocksOf(message.parts, asks).map((block, index) =>
          Array.isArray(block) ? (
            <Steps asks={asks} key={partKey(block[0]!, index)} steps={block} view={view} />
          ) : (
            <AgentMessagePart asks={asks} key={partKey(block, index)} part={block} />
          ),
        )}
      </MessageContent>
    </Message>
  );
}

/**
 * A message's parts, with each run of steps (reasoning and calls) gathered into one list. A call
 * that asks a question shows as that question instead, and the model waiting on or cancelling
 * its own tasks isn't activity to show.
 */
function blocksOf(parts: readonly EveMessagePart[], asks: Asks): (EveMessagePart | Step[])[] {
  const blocks: (EveMessagePart | Step[])[] = [];
  for (const part of parts) {
    if (part.type === "tool" && part.kind === "control") continue;
    const isStep =
      part.type === "reasoning" ||
      (part.type === "tool" && asks.questionsFor(part.callId).length === 0);
    const last = blocks.at(-1);
    if (!isStep) blocks.push(part);
    else if (Array.isArray(last)) last.push(part as Step);
    else blocks.push([part as Step]);
  }
  return blocks;
}

function AgentMessagePart({ asks, part }: { readonly asks: Asks; readonly part: EveMessagePart }) {
  switch (part.type) {
    case "text":
      return (
        <MessageResponse caret="block" isAnimating={part.state === "streaming"}>
          {part.text}
        </MessageResponse>
      );
    case "file":
      return <AttachmentPart part={part} />;
    case "interaction":
      return <InteractionPrompt asks={asks} part={part} />;
    case "tool":
      return (
        <div className="space-y-4">
          {asks.questionsFor(part.callId).map((question) => {
            // The call's part shows an answer this client sent at once; the view, once eve has it.
            const { answer, ...request } =
              part.interaction?.interactionId === question.interactionId
                ? part.interaction
                : question;
            return (
              <QuestionRequest
                answer={answer}
                canRespond={asks.canRespond(request.interactionId)}
                interaction={request}
                key={request.interactionId}
                onAnswers={asks.onAnswers}
              />
            );
          })}
        </div>
      );
    default:
      return null;
  }
}

/**
 * A run of steps. Several fold into one line that opens while they work; an approval waits
 * below them, so it stays in view when the list is closed.
 */
function Steps({
  asks,
  steps,
  view,
}: {
  readonly asks: Asks;
  readonly steps: readonly Step[];
  readonly view: SessionView;
}) {
  const [open, setOpen] = useState<boolean>();
  const states = steps.map((step) => stepState(step, view));
  const working = states.some((state) => state === "working");
  const waiting = states.some((state) => state === "waiting");
  const failed = states.filter((state) => state === "failed").length;
  const lines = (
    <Trace>
      {steps.map((step, index) =>
        step.type === "reasoning" ? (
          <ReasoningLine key={partKey(step, index)} part={step} />
        ) : (
          <ToolLine key={step.callId} part={step} state={callState(view, step.callId)} />
        ),
      )}
    </Trace>
  );
  const approvals = steps.flatMap((step) =>
    step.type === "tool" &&
    step.interaction?.request.kind === "approval" &&
    step.interaction.status !== "settled"
      ? [step.interaction]
      : [],
  );

  return (
    <>
      {steps.length === 1 ? (
        lines
      ) : (
        <TraceCollapsible
          className="overflow-hidden rounded-2xl bg-sheet ring-1 ring-line"
          onOpenChange={setOpen}
          open={open ?? (working || waiting)}
        >
          <TraceCollapsibleTrigger>
            <TraceLine status={working ? "running" : failed > 0 ? "error" : undefined}>
              <TraceTitle>
                {working
                  ? "Trabajando"
                  : waiting
                    ? "Esperando tu respuesta"
                    : `Listo${duration(steps, view) ?? ""}`}
              </TraceTitle>
              <TraceDescription>
                {failed > 0 ? `${failed} de ${steps.length} fallaron` : `${steps.length} pasos`}
              </TraceDescription>
            </TraceLine>
          </TraceCollapsibleTrigger>
          <TraceCollapsibleContent>{lines}</TraceCollapsibleContent>
        </TraceCollapsible>
      )}
      {approvals.map((interaction) => (
        <InteractionActions
          answer={interaction.answer}
          asks={asks}
          interaction={interaction}
          key={interaction.interactionId}
        />
      ))}
    </>
  );
}

function stepState(step: Step, view: SessionView): "working" | "waiting" | "failed" | "done" {
  if (step.type === "reasoning") return step.state === "streaming" ? "working" : "done";
  const state = callState(view, step.callId);
  if (state === "approval" || state === "blocked") return "waiting";
  const status = state === undefined ? "running" : CALL_LINES[state].status;
  return status === "error" ? "failed" : status === undefined ? "done" : "working";
}

/** " for 12s": from the first step's start to the last one's end, when facts report times. */
function duration(steps: readonly Step[], view: SessionView): string | undefined {
  const times = steps.flatMap((step) => {
    const observed = step.type === "tool" ? call(view, step.callId) : part(view, step.id ?? "");
    if (observed?.startedAt === undefined) return [];
    return [Date.parse(observed.startedAt), Date.parse(observed.endedAt ?? observed.startedAt)];
  });
  if (times.length === 0) return undefined;
  const seconds = Math.round((Math.max(...times) - Math.min(...times)) / 1000);
  if (seconds < 1) return undefined;
  return seconds < 60 ? ` en ${seconds}s` : ` en ${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

/** How a call's line reads in each state: its status, and a word on why. */
const CALL_LINES: Record<
  CallState,
  { readonly status?: "running" | "error" | "pending"; readonly note?: string }
> = {
  approval: { note: "Requiere aprobación", status: "pending" },
  blocked: { note: "Esperándote", status: "running" },
  cancelled: { note: "Detenido" },
  completed: {},
  failed: { note: "Falló", status: "error" },
  rejected: { note: "Rechazado" },
  requested: { status: "pending" },
  running: { status: "running" },
};

function ToolLine({
  part,
  state,
}: {
  readonly part: EveToolPart;
  readonly state: CallState | undefined;
}) {
  // A call the model is still writing has no row yet.
  const { note, status } = state === undefined ? { status: "running" as const } : CALL_LINES[state];
  // An answer waits on its approval until every approval asked with it is decided.
  const answered =
    state === "approval" && part.interaction?.answer !== undefined
      ? "Respuesta enviada"
      : undefined;
  const Icon = part.name === "bash" ? TerminalIcon : part.kind === "agent" ? BotIcon : WrenchIcon;
  const verdict = verdictOf(part, state);
  const line = (
    <TraceLine status={status}>
      <TraceIcon>
        <Icon />
      </TraceIcon>
      <TraceTitle>{part.label}</TraceTitle>
      {isSimulatedTool(part.name) ? <SimTag /> : null}
      {verdict !== undefined ? (
        <StatusPill size="sm" verdict={verdict} />
      ) : (answered ?? note) ? (
        <TraceDescription>{answered ?? note}</TraceDescription>
      ) : null}
    </TraceLine>
  );
  if (part.input === undefined && part.output === undefined && part.error === undefined)
    return line;

  return (
    <TraceCollapsible>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent className="space-y-2 text-ink">
        {part.name === "bash" ? (
          <BashToolContent
            errorText={part.error?.message}
            input={part.input}
            output={part.output}
          />
        ) : (
          <>
            {part.input === undefined ? null : <ToolInput input={part.input} />}
            <ToolOutput errorText={part.error?.message} output={part.output} />
          </>
        )}
      </TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

function ReasoningLine({ part }: { readonly part: Extract<Step, { type: "reasoning" }> }) {
  const [open, setOpen] = useState<boolean>();
  const running = part.state === "streaming";
  const line = (
    <TraceLine status={running ? "running" : undefined}>
      <TraceIcon>
        <BrainIcon />
      </TraceIcon>
      <TraceTitle>{running ? "Pensando" : "Pensó"}</TraceTitle>
    </TraceLine>
  );
  if (part.text.length === 0) return line;

  return (
    <TraceCollapsible onOpenChange={setOpen} open={open ?? running}>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent className="whitespace-pre-wrap">{part.text}</TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

function QuestionRequest({
  canRespond,
  interaction,
  answer,
  onAnswers,
}: {
  readonly canRespond: boolean;
  readonly interaction: Interaction;
  readonly answer?: AgentAnswer;
  readonly onAnswers: (responses: readonly AgentAnswer[]) => void | Promise<void>;
}) {
  const options = interaction.request.options ?? [];
  const acceptsFreeform = interaction.request.allowFreeform === true || options.length === 0;
  const disabled = !canRespond || answer !== undefined;

  const submitResponse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get(interaction.interactionId);
    if (typeof value !== "string") {
      return;
    }

    const option = options.find(({ id }) => id === value);
    void onAnswers([
      option === undefined
        ? { interactionId: interaction.interactionId, text: value.trim() }
        : { optionId: option.id, interactionId: interaction.interactionId },
    ]);
  };

  return (
    <Questionnaire
      className="gap-4 rounded-2xl bg-sheet p-4 ring-1 ring-line"
      // Validation reads disabled answers as missing, so locking a submitted form in place would
      // flag it invalid. Remounting restores the answer from the response instead.
      key={disabled ? "locked" : "open"}
      onSubmit={submitResponse}
      shortcuts="numbers"
    >
      <QuestionnaireItem name={interaction.interactionId} required>
        <QuestionnaireTitle className="text-base font-semibold">
          {interaction.request.prompt}
        </QuestionnaireTitle>
        <QuestionnaireChoices>
          {options.map((option) => (
            <QuestionnaireChoice
              className={cn(answer?.optionId === option.id && "data-disabled:opacity-100")}
              defaultChecked={answer?.optionId === option.id}
              disabled={disabled}
              key={option.id}
              value={option.id}
            >
              {option.label}
              {option.description ? (
                <QuestionnaireChoiceDescription>
                  {option.description}
                </QuestionnaireChoiceDescription>
              ) : null}
            </QuestionnaireChoice>
          ))}
          {acceptsFreeform ? (
            <QuestionnaireInput
              aria-label="Respuesta"
              className={cn(answer?.text !== undefined && "disabled:opacity-100")}
              defaultValue={answer?.text}
              disabled={disabled}
              placeholder="Escribí tu respuesta…"
            />
          ) : null}
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>
      {disabled ? null : (
        <QuestionnaireActions>
          <QuestionnaireSubmit size="sm" variant="secondary">
            Responder
          </QuestionnaireSubmit>
        </QuestionnaireActions>
      )}
    </Questionnaire>
  );
}

function AttachmentPart({ part }: { readonly part: EveFilePart }) {
  const label = part.filename ?? "Adjunto";
  const detail = [part.mediaType, formatBytes(part.size)].filter(Boolean).join(" - ");
  const isImage = part.mediaType.startsWith("image/") && part.url !== undefined;
  const Icon = isImage ? ImageIcon : FileIcon;
  const body = (
    <span className="flex max-w-sm items-center gap-3 rounded-xl bg-sheet p-2 text-sm ring-1 ring-line">
      {isImage ? (
        <img alt={label} className="size-12 shrink-0 rounded-lg object-cover" src={part.url} />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ink/[0.05] text-ink-2">
          <Icon className="size-4" strokeWidth={2} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">{label}</span>
        {detail ? <span className="block truncate text-ink-3">{detail}</span> : null}
      </span>
      {part.url ? <ExternalLinkIcon className="size-4 shrink-0 text-ink-3" /> : null}
    </span>
  );

  return part.url ? (
    <a href={part.url} rel="noreferrer" target="_blank">
      {body}
    </a>
  ) : (
    body
  );
}

/** An interaction no call carries: a sign-in, the budget prompt, or a question of its own. */
function InteractionPrompt({
  asks,
  part,
}: {
  readonly asks: Asks;
  readonly part: EveInteractionPart;
}) {
  const { request } = part;
  if (request.signIn !== undefined) return <SignInPrompt part={part} />;
  if (request.kind === "question") {
    return (
      <QuestionRequest
        answer={part.answer}
        canRespond={asks.canRespond(part.interactionId)}
        interaction={part}
        onAnswers={asks.onAnswers}
      />
    );
  }
  return <InteractionActions answer={part.answer} asks={asks} interaction={part} />;
}

function SignInPrompt({ part }: { readonly part: EveInteractionPart }) {
  const signIn = part.request.signIn;
  const name = signIn?.displayName ?? signIn?.name ?? "el servicio";
  const isAuthorized = part.outcome === "accepted";
  const isCompleted = part.status === "settled";
  const Icon = isAuthorized ? CheckCircleIcon : isCompleted ? XCircleIcon : KeyRoundIcon;
  const instructions = signIn?.instructions;
  const description = isCompleted
    ? isAuthorized
      ? `${name} conectado.`
      : `Autorización de ${name}: ${signInEnding(part.outcome ?? "withdrawn")}${
          part.reason !== undefined ? ` (${part.reason})` : ""
        }.`
    : part.request.prompt;

  return (
    <div className="space-y-3 rounded-2xl bg-sheet p-4 ring-1 ring-line">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.05] text-ink">
          <Icon className="size-4" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-semibold text-base text-ink">
            {isCompleted
              ? isAuthorized
                ? `${name} conectado`
                : `Autorización de ${name}: ${signInEnding(part.outcome ?? "withdrawn")}`
              : `Conectar ${name}`}
          </p>
          <p className="text-ink-3 text-sm">{description}</p>
          {!isCompleted && instructions !== undefined && instructions !== description ? (
            <p className="text-ink-3 text-sm">{instructions}</p>
          ) : null}
          {!isCompleted && signIn?.userCode ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-ink-3">Código</span>
              <code className="rounded-md bg-ink/[0.05] px-2 py-1 font-mono text-ink">
                {signIn.userCode}
              </code>
            </div>
          ) : null}
          {!isCompleted && signIn?.url ? (
            <Button asChild size="sm" variant="secondary">
              <a href={signIn.url} rel="noreferrer" target="_blank">
                <ExternalLinkIcon className="size-4" />
                Iniciar sesión con {name}
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatBytes(size: number | undefined): string | undefined {
  if (size === undefined) {
    return undefined;
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/** An interaction's prompt with a button for each option, or how it was answered. */
function InteractionActions({
  answer,
  asks,
  interaction,
}: {
  readonly answer?: AgentAnswer;
  readonly asks: Asks;
  readonly interaction: Interaction;
}) {
  const selectedOption = interaction.request.options?.find(
    (option) => option.id === answer?.optionId,
  );
  const isApproval = interaction.request.kind === "approval";
  const answeredVerdict: Verdict | undefined =
    answer === undefined ? undefined : optionVerdict(selectedOption ?? answer.optionId);

  return (
    <div
      className={cn(
        "rise space-y-3 rounded-2xl bg-sheet p-4 ring-1",
        answer === undefined ? "ring-plum/30" : "ring-line",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {isApproval ? (
          <StatusPill verdict={answeredVerdict ?? "pending"} />
        ) : null}
        <SimTag />
      </div>
      <p className="text-base font-semibold text-ink">{stripApprovalPrefix(interaction.request.prompt)}</p>
      {answer ? (
        <p className="text-sm text-ink-3">
          Respondiste: {optionLabel(selectedOption) ?? answer.text ?? answer.optionId}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {interaction.request.options?.map((option) => {
            const verdict = optionVerdict(option);
            return (
              <Button
                className={cn(
                  verdict === "approved" && "bg-leaf-soft text-leaf hover:bg-leaf/15",
                  verdict === "denied" && "bg-chili-soft text-chili hover:bg-chili/15",
                )}
                disabled={!asks.canRespond(interaction.interactionId)}
                key={option.id}
                onClick={() => {
                  void asks.onAnswers([
                    {
                      optionId: option.id,
                      interactionId: interaction.interactionId,
                    },
                  ]);
                }}
                type="button"
                variant="secondary"
              >
                {optionLabel(option)}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Veredictos Mango: leaf / chili / plum solo para decisiones del motor.                      */
/* ------------------------------------------------------------------------------------------ */

type InteractionOption = NonNullable<Interaction["request"]["options"]>[number];

/** Las tools belo del demo operan una cuenta simulada: siempre llevan SimTag. */
function isSimulatedTool(name: string): boolean {
  return /^(account|exchange|ramp|card|transaction)_/u.test(name);
}

/** "HUMAN_APPROVAL_REQUIRED · Pagar…" → la pill ya dice que espera tu OK. */
function stripApprovalPrefix(prompt: string): string {
  return prompt.replace(/^HUMAN_APPROVAL_REQUIRED\s*[·:-]?\s*/u, "");
}

/** Qué veredicto representa una opción de aprobación. */
function optionVerdict(option: InteractionOption | string | undefined): Verdict | undefined {
  if (option === undefined) return undefined;
  const id = typeof option === "string" ? option : option.id;
  const style = typeof option === "string" ? undefined : option.style;
  if (/^(approve|accept|allow|yes|confirm)$/iu.test(id)) return "approved";
  if (style === "danger" || /^(deny|reject|decline|no|cancel)$/iu.test(id)) return "denied";
  return undefined;
}

/** Copy en voseo para las opciones estándar del motor; el resto conserva su label. */
function optionLabel(option: InteractionOption | undefined): string | undefined {
  if (option === undefined) return undefined;
  switch (optionVerdict(option)) {
    case "approved":
      return "Aprobar";
    case "denied":
      return "Rechazar";
    default:
      return option.label;
  }
}

/**
 * El veredicto de una llamada: solo cuando hubo (o hay) una decisión humana o del chequeo de
 * riesgo/límite. Una consulta de saldo completada no es un veredicto.
 */
function verdictOf(part: EveToolPart, state: CallState | undefined): Verdict | undefined {
  const output = part.output;
  if (typeof output === "object" && output !== null) {
    const record = output as { type?: unknown; status?: unknown };
    if (record.type === "denied") return "denied";
    if (record.status === "APPROVED_AND_EXECUTED") return "approved";
  }
  if (state === "rejected") return "denied";
  if (state === "approval") return "pending";
  if (part.interaction?.request.kind === "approval") {
    if (state === "completed") return "approved";
    if (state === "cancelled") return "denied";
  }
  return undefined;
}

function partKey(part: EveMessagePart, index: number): string {
  switch (part.type) {
    case "interaction":
      return `interaction:${part.interactionId}`;
    case "tool":
      return part.callId;
    case "reasoning":
    case "text":
      return `${part.type}:${part.id ?? index}`;
    default:
      return `${part.type}:${index}`;
  }
}
