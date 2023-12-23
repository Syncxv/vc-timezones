/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { addContextMenuPatch, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import * as DataStore from "@api/DataStore";
import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import { openModal } from "@utils/modal";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Menu, Tooltip } from "@webpack/common";
import { User } from "discord-types/general";

import { SetTimezoneModal } from "./TimezoneModal";

const DATASTORE_KEY = "vencord-timezones";

export let timezones: Record<string, string | null> = {};
(async () => {
    timezones = await DataStore.get<Record<string, string>>(DATASTORE_KEY) || {};
})();

const classes = findByPropsLazy("timestamp", "compact", "content");

export const settings = definePluginSettings({
    format24h: {
        type: OptionType.BOOLEAN,
        name: "24h Time",
        description: "Show time in 24h format",
        default: false
    },
});

function getTime(timezone: string, props: Intl.DateTimeFormatOptions = {}) {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
        hour12: !settings.store.format24h,
        timeZone: timezone,
        ...props
    });
    return formatter.format(date);
}

export async function setUserTimezone(userId: string, timezone: string | null) {
    timezones[userId] = timezone;
    await DataStore.set(DATASTORE_KEY, timezones);
}

const TimestampComponent = ErrorBoundary.wrap(({ userId, type }: { userId: string; type: "message" | "profile"; }) => {
    const timezone = timezones[userId];

    if (!timezone) return null;

    const shortTime = getTime(timezone, { hour: "numeric", minute: "numeric" });
    return (
        <Tooltip
            text={getTime(timezone, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
            })}
        >
            {toolTipProps => {
                return (
                    <span
                        {...toolTipProps}
                        className={type === "message" ? `timezone-message-item ${classes.timestamp}` : "timezone-profile-item"}
                    >
                        {
                            type === "message" ? `(${shortTime})` : shortTime
                        }
                    </span>
                );
            }}
        </Tooltip>
    );
}, { noop: true });


export default definePlugin({
    name: "Timezone",
    authors: [Devs.Aria],
    description: "Shows the local time of users in their status",

    patches: [
        {
            find: ".getUserBannerStyles)",
            replacement: {
                match: /getUserBannerStyles.{1,500}children:\[/,
                replace: "$&$self.renderProfileTimezone(arguments[0]),"
            }
        },
        {
            find: ".badgesContainer,",
            replacement: {
                match: /id:\(0,\i\.getMessageTimestampId\)\(\i\),timestamp.{1,50}}\),/,
                replace: "$&,$self.renderMessageTimezone(arguments[0]),"
            }
        }
    ],
    settings,

    renderProfileTimezone: (props: any) => <TimestampComponent userId={props.user.id} type="profile" />,
    renderMessageTimezone: (props: any) => <TimestampComponent userId={props.message.author.id} type="message" />,

    start() {
        addContextMenuPatch("user-context", userContextMenuPatch);
    },

    stop() {
        removeContextMenuPatch("user-context", userContextMenuPatch);
    }

});


const userContextMenuPatch: NavContextMenuPatchCallback = (children, { user }: { user: User; }) => () => {
    const setTimezoneItem = (
        <Menu.MenuItem
            label="Set Timezone"
            id="set-timezone"
            action={() => openModal(modalProps => <SetTimezoneModal userId={user.id} modalProps={modalProps} />)}
        />
    );

    children.push(<Menu.MenuSeparator />, setTimezoneItem);

};
