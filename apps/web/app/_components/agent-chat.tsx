"use client";

import { ClientError, type MessagePart } from "eve/client";
import {
  activeTurn,
  activity,
  failure,
  interaction,
  interactions,
  turns,
  type Activity,
} from "eve/events";
import { useEveAgent } from "eve/react";
import { AlertCircleIcon, BrainIcon, PlusIcon, SquareIcon } from "lucide-react";
import { useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { Trace, TraceIcon, TraceLine, TraceTitle } from "@/components/ui/trace";
import { AgentMessage } from "./agent-message";
import { WEB_CHAT_AGENT } from "@/app/eve-agent";

const SUGGESTIONS = ["¿Cuánto tengo en USDC?", "Pagá US$ 40 a Spotify", "¿Qué rendimientos estoy generando?"];

export function AgentChat({
  agentId,
  agentName,
  agentEmoji,
  sessionId,
  sessionless = false,
}: {
  readonly agentId: string;
  readonly agentName: string;
  readonly agentEmoji: string;
  readonly sessionId?: string;
  readonly sessionless?: boolean;
}) {
  const [cancellationError, setCancellationError] = useState<string>();
  const [hasInputText, setHasInputText] = useState(false);
  const hasSubmittedMessage = useRef(false);
  const basePath = `/agents/${encodeURIComponent(agentId)}`;
  const replaceSessionRoute = (nextSessionId: string) => {
    if (sessionId !== undefined) return;
    // Next.js patches window.history; navigating through its router would remount this route
    // and detach the active stream.
    History.prototype.replaceState.call(
      window.history,
      window.history.state,
      "",
      `${basePath}/s/${encodeURIComponent(nextSessionId)}`,
    );
  };
  const agent = useEveAgent({
    agent: WEB_CHAT_AGENT,
    // Tells the eve channel which user-created agent this session runs as.
    headers: { "x-agent-id": agentId },
    prewarm: hasInputText,
    initialSession:
      sessionId === undefined
        ? undefined
        : {
            sessionId,
            streamIndex: 0,
          },
    resume: sessionId !== undefined,
    onSessionChange(session) {
      if (hasSubmittedMessage.current && session !== undefined) {
        replaceSessionRoute(session.sessionId);
      }
    },
  });

  const isBusy = agent.status === "busy";
  // A turn waiting on a person is open while the store is idle; it still takes steering and Stop.
  const turnOpen = activeTurn(agent.view) !== undefined;
  const isResuming = agent.status === "resuming";
  const isEmpty = agent.messages.length === 0;
  const lastMessage = agent.messages.at(-1);
  const isPendingAssistantShell =
    lastMessage?.role === "assistant" && lastMessage.parts.length === 0;
  const now = activity(agent.view);
  const showPendingThinking =
    isBusy &&
    now.kind !== "waiting-on-interaction" &&
    (lastMessage?.role !== "assistant" || isPendingAssistantShell);
  const failed =
    isBusy || isResuming ? undefined : failure(agent.view, turns(agent.view).at(-1)?.turnId);
  const turnFailure =
    failed?.code === "MODEL_CALL_FAILED"
      ? "El modelo no está disponible en este momento. Probá de nuevo."
      : failed?.message;
  const errorMessage = cancellationError ?? agent.error?.message ?? turnFailure;
  const hasConversationContent = sessionless || !isEmpty || errorMessage !== undefined;
  const showConversationLayout = isResuming || hasConversationContent;
  const activeSessionId = sessionId ?? agent.session?.sessionId;
  const sessionEnded =
    agent.error instanceof ClientError && agent.error.code === "session_not_active";
  const canRespond = (interactionId: string) =>
    !isResuming && !sessionEnded && interaction(agent.view, interactionId)?.status === "open";
  const questionsFor = (callId: string) =>
    interactions(agent.view).filter(
      (input) => input.request.kind === "question" && input.call?.callId === callId,
    );

  const requestCancellation = () => {
    setCancellationError(undefined);
    void agent.cancel().catch((error: unknown) => {
      setCancellationError(toErrorMessage(error));
    });
  };

  const sendText = async (text: string) => {
    setHasInputText(false);
    setCancellationError(undefined);
    hasSubmittedMessage.current = true;
    if (agent.session !== undefined) replaceSessionRoute(agent.session.sessionId);
    const options = turnOpen ? { turnPolicy: "steer" as const } : undefined;
    await agent.send(text, options);
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = message.text.trim();
    if ((text.length === 0 && message.files.length === 0) || isResuming) return;

    if (message.files.length === 0) {
      await sendText(text);
      return;
    }

    setHasInputText(false);
    setCancellationError(undefined);
    hasSubmittedMessage.current = true;
    if (agent.session !== undefined) replaceSessionRoute(agent.session.sessionId);
    const options = turnOpen ? { turnPolicy: "steer" as const } : undefined;

    const parts: MessagePart[] = [];
    if (text.length > 0) parts.push({ text, type: "text" });
    for (const file of message.files) {
      parts.push({
        data: file.url,
        filename: file.filename,
        mediaType: file.mediaType,
        type: "file",
      });
    }
    await agent.send(parts, options);
  };

  const composer = (
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputTextarea
        disabled={isResuming}
        onChange={(event) => setHasInputText(event.currentTarget.value.trim().length > 0)}
        placeholder="Enviar un mensaje…"
      />
      <ComposerAction
        hasInputText={hasInputText}
        canCancel={turnOpen}
        isResuming={isResuming}
        onCancel={requestCancellation}
      />
    </PromptInput>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      {showConversationLayout ? (
        <>
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 pt-3 sm:px-6">
            <span className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-widest">
              {activeSessionId ? `session ${activeSessionId.slice(0, 12)}…` : "nueva sesión"}
            </span>
            {activeSessionId !== undefined ? (
              <Button
                aria-label="Nueva conversación"
                onClick={() => window.location.assign(`${basePath}/s`)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <PlusIcon className="size-4" />
                <span className="hidden font-normal text-sm sm:inline">Nueva conversación</span>
              </Button>
            ) : null}
          </div>
          <Conversation
            className="min-h-0 flex-1"
            initial={sessionId === undefined ? undefined : false}
            resize={activeSessionId === undefined ? "smooth" : "instant"}
            scrollRestorationKey={
              isEmpty || activeSessionId === undefined
                ? undefined
                : `eve:web-chat-scroll:${activeSessionId}`
            }
          >
            <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 pt-4 pb-8 sm:px-6">
              {agent.messages.map((message) =>
                showPendingThinking &&
                isPendingAssistantShell &&
                message.id === lastMessage.id ? null : (
                  <AgentMessage
                    canRespond={canRespond}
                    key={message.id}
                    message={message}
                    questionsFor={questionsFor}
                    view={agent.view}
                    onAnswers={async (answers) => {
                      setCancellationError(undefined);
                      await agent.respond(answers).catch((cause: unknown) => {
                        setCancellationError(
                          cause instanceof Error ? cause.message : "No se pudo enviar la respuesta.",
                        );
                      });
                    }}
                  />
                ),
              )}
              {showPendingThinking ? <PendingActivity activity={now} /> : null}
              {errorMessage ? <ErrorMessage message={errorMessage} /> : null}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </>
      ) : (
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="flex flex-col items-center gap-3">
            <span aria-hidden="true" className="text-5xl">
              {agentEmoji}
            </span>
            <h2 className="font-medium text-2xl tracking-tight">{agentName}</h2>
            <p className="font-mono text-muted-foreground text-xs">
              <span className="text-primary">[READY]</span> el agente propone · la persona decide
            </p>
          </div>
          <ul className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <li key={suggestion}>
                <button
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:border-primary/50 hover:text-foreground"
                  onClick={() => void sendText(suggestion)}
                  type="button"
                >
                  Probá: {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pt-2 pb-4 sm:px-6">{composer}</div>
    </div>
  );
}

function ComposerAction({
  hasInputText,
  canCancel,
  isResuming,
  onCancel,
}: {
  readonly hasInputText: boolean;
  readonly canCancel: boolean;
  readonly isResuming: boolean;
  readonly onCancel: () => void;
}) {
  const attachments = usePromptInputAttachments();
  const canSubmit = hasInputText || attachments.files.length > 0;

  if (!canCancel || canSubmit) {
    return <PromptInputSubmit disabled={isResuming} />;
  }

  return (
    <PromptInputButton
      aria-label="Detener"
      className="absolute right-2.5 bottom-2.5"
      onClick={onCancel}
      variant="outline"
    >
      <SquareIcon className="size-3 fill-current" />
    </PromptInputButton>
  );
}

function ErrorMessage({ message }: { readonly message: string }) {
  return (
    <Message className="max-w-full" from="assistant">
      <MessageContent>
        <div
          className="flex w-full items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm"
          role="alert"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium">La solicitud falló</p>
            <p className="mt-0.5 text-muted-foreground">{message}</p>
          </div>
        </div>
      </MessageContent>
    </Message>
  );
}

function PendingActivity({ activity }: { readonly activity: Activity }) {
  return (
    <Message aria-live="polite" from="assistant">
      <MessageContent>
        <Trace>
          <TraceLine status="running">
            <TraceIcon>
              <BrainIcon />
            </TraceIcon>
            <TraceTitle>{activityLabel(activity)}</TraceTitle>
          </TraceLine>
        </Trace>
      </MessageContent>
    </Message>
  );
}

function activityLabel(activity: Activity): string {
  switch (activity.kind) {
    case "calling":
      return activity.names.join(", ");
    case "waiting-on-tasks":
      return `Esperando ${activity.tasks.map((task) => task.name).join(", ")}`;
    case "compacting":
      return "Compactando la conversación";
    default:
      return "Pensando";
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "No se pudo cancelar la respuesta.";
}
