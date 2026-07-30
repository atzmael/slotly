"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createBrowserSupabaseClient } from "@/client/supabase";

const realtimeEventName = "event_changed";

type EventChangeReason =
  | "participant_joined"
  | "availability_saved"
  | "event_finalized"
  | "event_reopened";

interface EventRealtimeRefreshProps {
  readonly eventId: string;
}

export function EventRealtimeRefresh({ eventId }: EventRealtimeRefreshProps) {
  const router = useRouter();
  const refreshTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase.channel(getEventTopic(eventId), {
      config: {
        broadcast: {
          self: false,
        },
      },
    });

    channel
      .on("broadcast", { event: realtimeEventName }, () => {
        if (refreshTimeout.current) {
          clearTimeout(refreshTimeout.current);
        }

        refreshTimeout.current = setTimeout(() => {
          router.refresh();
        }, 250);
      })
      .subscribe();

    return () => {
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }

      void supabase.removeChannel(channel);
    };
  }, [eventId, router]);

  return null;
}

export async function broadcastEventChange(
  eventId: string,
  reason: EventChangeReason,
): Promise<void> {
  const supabase = createBrowserSupabaseClient();
  const channel = supabase.channel(getEventTopic(eventId));

  await new Promise<void>((resolve) => {
    let finished = false;
    const finish = async () => {
      if (finished) {
        return;
      }

      finished = true;
      clearTimeout(timeout);
      await supabase.removeChannel(channel);
      resolve();
    };
    const timeout = setTimeout(() => {
      void finish();
    }, 3000);

    channel.subscribe((status) => {
      if (status !== "SUBSCRIBED") {
        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          void finish();
        }

        return;
      }

      void channel
        .send({
          type: "broadcast",
          event: realtimeEventName,
          payload: {
            reason,
            sentAt: new Date().toISOString(),
          },
        })
        .finally(finish);
    });
  });
}

function getEventTopic(eventId: string): string {
  return `event:${eventId}`;
}
