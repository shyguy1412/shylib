import { createStore } from "@xstate/store";
import { createContext, h } from "preact";
import {
  PropsWithChildren,
  useContext,
  useMemo,
} from "preact/compat";

export type LumberChannel = {
  name: string;
  level: number;
};

export const CommonLevels = {
  INFO: 0,
  DEBUG: 1,
  WARNING: 2,
  ERROR: 3,
} as const;
export type CommonLevels = typeof CommonLevels[keyof typeof CommonLevels];

export const CommonInfoChannels = {
  RENDER: "render",
  HOOK: "hook",
  LIFECYCLE: "lifecycle",
} as const;
export type CommonInfoChannels =
  typeof CommonInfoChannels[keyof typeof CommonInfoChannels];

export const CommonChannels = {
  ...CommonInfoChannels,
} as const;
export type CommonChannels = typeof CommonChannels[keyof typeof CommonChannels];

type Channel = {
  level: number;
  name: string;
  blocked: boolean;
};

type ChannelInfo = Omit<Channel, "name">;
const store = createStore({
  context: {
    level: 0,
    filter: /.*/,
    channels: {} as { [key in Channel["name"]]: ChannelInfo },
  },
  on: {
    setFilter: (context, { filter }: { filter: RegExp }) => ({
      ...context,
      filter,
    }),
    setLevel: (context, { level }: { level: number }) => ({
      ...context,
      level,
    }),
    setDepth: (context, { depth }: { depth: number }) => ({
      ...context,
      depth,
    }),
    setChannel: (
      context,
      { channel, level, blocked }: Partial<ChannelInfo> & { channel: string },
    ) => ({
      ...context,
      channels: {
        ...context.channels,
        [channel]: {
          level: level ?? context.channels[channel]?.level ?? 0,
          blocked: blocked ?? context.channels[channel]?.blocked ?? false,
        },
      },
    }),
  },
});

const SupressContext = createContext<string[]>([]);

type Props = { channel: string | string[] };
const Supress = ({ channel, children }: PropsWithChildren<Props>) => {
  const channels = typeof channel == "object"
    ? channel
    : useMemo(() => [channel], []);

  const element = h(SupressContext.Provider, { value: channels }, children);

  return element;
};

export const Lumber = {
  createChannel: (channel: string, level: number) =>
    store.trigger.setChannel({ channel, level }),

  blockChannel: (channel: string) =>
    store.trigger.setChannel({ channel, blocked: true }),

  unblockChannel: (channel: string) =>
    store.trigger.setChannel({ channel, blocked: false }),

  setLevel: (level: number) => store.trigger.setLevel({ level }),

  setFilter: (filter: RegExp) => store.trigger.setFilter({ filter }),

  getLogger: (channel: string) => Lumber.log.bind(Lumber, channel),

  log: (channel: string, ...messages: any[]) => {
    try {
      const supressedChannels = useContext(SupressContext);
      if (supressedChannels.includes(channel)) return;
    } catch {}
    const { context: { filter, channels, level } } = store.get();
    const channelLevel = channels[channel]?.level ?? 0;
    const blocked = channels[channel]?.blocked ?? false;

    if (blocked) return;
    if (channelLevel < level) return;
    if (!filter.test(channel)) return;

    console.log(...messages);
  },

  Supress,

  ...CommonChannels,
  ...CommonLevels,
} as const;

for (const channel in CommonInfoChannels) {
  Lumber.createChannel(channel, 0);
}
