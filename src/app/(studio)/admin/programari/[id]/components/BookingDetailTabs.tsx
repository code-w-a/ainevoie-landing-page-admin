"use client";

import { useState } from "react";
import { TabContent, TabList, Tabs, TabTrigger } from "@/components/ui/tabs";
import {
  tabTriggerClass,
  type BookingDocument,
  type BookingTimelineEvent,
  type PaymentDocument,
} from "@/lib/adminBookingDetail";
import { BookingActivityTab } from "./tabs/BookingActivityTab";
import { BookingPartiesTab } from "./tabs/BookingPartiesTab";
import { BookingPaymentTab } from "./tabs/BookingPaymentTab";
import { BookingSummaryTab } from "./tabs/BookingSummaryTab";
import { BookingSupportTab } from "./tabs/BookingSupportTab";

const TABS = {
  summary: "rezumat",
  parties: "client-prestator",
  payment: "plata",
  support: "conversatie-suport",
  activity: "activitate",
} as const;

export function BookingDetailTabs({
  booking,
  payment,
  user,
  provider,
  conversation,
  conversationId,
  supportTickets,
  review,
  timelineEvents,
}: {
  booking: BookingDocument;
  payment: PaymentDocument | null;
  user?: Record<string, unknown> | null;
  provider?: Record<string, unknown> | null;
  conversation?: Record<string, unknown> | null;
  conversationId: string;
  supportTickets: Array<Record<string, unknown>>;
  review?: Record<string, unknown> | null;
  timelineEvents: BookingTimelineEvent[];
}) {
  const [activeTab, setActiveTab] = useState<string>(TABS.summary);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabList className="flex flex-wrap gap-2">
        <TabTrigger value={TABS.summary} className={tabTriggerClass(activeTab === TABS.summary)}>
          Rezumat
        </TabTrigger>
        <TabTrigger value={TABS.parties} className={tabTriggerClass(activeTab === TABS.parties)}>
          Client &amp; prestator
        </TabTrigger>
        <TabTrigger value={TABS.payment} className={tabTriggerClass(activeTab === TABS.payment)}>
          Plată
        </TabTrigger>
        <TabTrigger value={TABS.support} className={tabTriggerClass(activeTab === TABS.support)}>
          Conversație &amp; suport
        </TabTrigger>
        <TabTrigger value={TABS.activity} className={tabTriggerClass(activeTab === TABS.activity)}>
          Activitate
        </TabTrigger>
      </TabList>

      <TabContent value={TABS.summary} className="mt-6">
        <BookingSummaryTab booking={booking} payment={payment} />
      </TabContent>

      <TabContent value={TABS.parties} className="mt-6">
        <BookingPartiesTab booking={booking} user={user} provider={provider} />
      </TabContent>

      <TabContent value={TABS.payment} className="mt-6">
        <BookingPaymentTab payment={payment} />
      </TabContent>

      <TabContent value={TABS.support} className="mt-6">
        <BookingSupportTab
          conversation={conversation}
          conversationId={conversationId}
          supportTickets={supportTickets}
          review={review}
        />
      </TabContent>

      <TabContent value={TABS.activity} className="mt-6">
        <BookingActivityTab timelineEvents={timelineEvents} />
      </TabContent>
    </Tabs>
  );
}
