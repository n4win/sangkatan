"use client";

import { DatesProvider } from "@mantine/dates";

import "dayjs";
import "dayjs/locale/th";
import dayjs from "dayjs";
import bhudistEra from "dayjs/plugin/buddhistEra";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);
dayjs.extend(bhudistEra);
dayjs.locale("th-TH");

export default function DateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DatesProvider
      settings={{
        locale: "th-TH",
        firstDayOfWeek: 0,
        weekendDays: [0],
      }}
    >
      {children}
    </DatesProvider>
  );
}
