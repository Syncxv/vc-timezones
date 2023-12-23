/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classNameFactory } from "@api/Styles";
import { Margins } from "@utils/margins";
import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalProps, ModalRoot } from "@utils/modal";
import { Button, Forms, SearchableSelect, useMemo, useState } from "@webpack/common";

import { setUserTimezone, timezones } from ".";


const cl = classNameFactory("vc-timezone-");

export function SetTimezoneModal({ userId, modalProps }: { userId: string, modalProps: ModalProps; }) {
    const [currentValue, setCurrentValue] = useState<string | null>(timezones[userId] ?? null);

    const options = useMemo(() => {
        return Intl.supportedValuesOf("timeZone").map(timezone => {
            const offset = new Intl.DateTimeFormat(undefined, { timeZone: timezone, timeZoneName: "short" })
                .formatToParts(new Date())
                .find(part => part.type === "timeZoneName")!.value;

            return { label: `${timezone} (${offset})`, value: timezone };
        });
    }, []);

    return (
        <ModalRoot {...modalProps}>
            <ModalHeader className={cl("modal-header")}>
                <Forms.FormTitle tag="h2">
                    Timezones
                </Forms.FormTitle>
                <ModalCloseButton onClick={modalProps.onClose} />
            </ModalHeader>

            <ModalContent className={cl("modal-content")}>
                <section className={Margins.bottom16}>
                    <Forms.FormTitle tag="h3">
                        Select Timezone
                    </Forms.FormTitle>

                    <SearchableSelect
                        options={options}
                        value={options.find(o => o.value === currentValue)}
                        placeholder={"Select a Timezone"}
                        maxVisibleItems={5}
                        closeOnSelect={true}
                        onChange={v => setCurrentValue(v)}
                    />
                </section>
            </ModalContent>

            <ModalFooter>
                <Button
                    color={Button.Colors.PRIMARY}
                    disabled={currentValue === null}
                    onClick={async () => {
                        await setUserTimezone(userId, currentValue!);
                        modalProps.onClose();
                    }}
                >
                    Save
                </Button>
                <Button
                    color={Button.Colors.RED}
                    onClick={async () => {
                        await setUserTimezone(userId, null);
                        modalProps.onClose();
                    }}
                >
                    Delete Timezone
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}

