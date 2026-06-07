"use client";

import { useState } from "react";
import { TabContent, TabList, Tabs, TabTrigger } from "@/components/ui/tabs";
import {
  extractPaymentsFromBookings,
  tabTriggerClass,
  type BookingListItem,
  type UserDocument,
  type UserTimelineEvent,
} from "@/lib/adminUserDetail";
import { UserActivityTab } from "./tabs/UserActivityTab";
import { UserBookingsTab } from "./tabs/UserBookingsTab";
import { UserConsentsTab } from "./tabs/UserConsentsTab";
import { UserPaymentsTab } from "./tabs/UserPaymentsTab";
import { UserPresentationTab } from "./tabs/UserPresentationTab";

const TABS = {
  presentation: "prezentare",
  bookings: "programari",
  payments: "plati",
  consents: "consimtaminte",
  activity: "activitate",
} as const;

export function UserDetailTabs({
  user,
  recentBookings,
  timelineEvents,
}: {
  user: UserDocument;
  recentBookings: BookingListItem[];
  timelineEvents: UserTimelineEvent[];
}) {
  const [activeTab, setActiveTab] = useState<string>(TABS.presentation);
  const payments = extractPaymentsFromBookings(recentBookings);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabList className="flex flex-wrap gap-2">
        <TabTrigger
          value={TABS.presentation}
          className={tabTriggerClass(activeTab === TABS.presentation)}
        >
          Prezentare
        </TabTrigger>
        <TabTrigger value={TABS.bookings} className={tabTriggerClass(activeTab === TABS.bookings)}>
          Programări
        </TabTrigger>
        <TabTrigger value={TABS.payments} className={tabTriggerClass(activeTab === TABS.payments)}>
          Plăți
        </TabTrigger>
        <TabTrigger value={TABS.consents} className={tabTriggerClass(activeTab === TABS.consents)}>
          Consimțăminte
        </TabTrigger>
        <TabTrigger value={TABS.activity} className={tabTriggerClass(activeTab === TABS.activity)}>
          Activitate
        </TabTrigger>
      </TabList>

      <TabContent value={TABS.presentation} className="mt-6">
        <UserPresentationTab user={user} />
      </TabContent>

      <TabContent value={TABS.bookings} className="mt-6">
        <UserBookingsTab bookings={recentBookings} />
      </TabContent>

      <TabContent value={TABS.payments} className="mt-6">
        <UserPaymentsTab payments={payments} />
      </TabContent>

      <TabContent value={TABS.consents} className="mt-6">
        <UserConsentsTab user={user} />
      </TabContent>

      <TabContent value={TABS.activity} className="mt-6">
        <UserActivityTab timelineEvents={timelineEvents} />
      </TabContent>
    </Tabs>
  );
}
