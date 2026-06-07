"use client";

import { useState } from "react";
import { TabContent, TabList, Tabs, TabTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  buildTimelineEvents,
  getChecklistItems,
  getProviderLegalConsentState,
  getPublicationMeta,
  getVerificationIssueCount,
  normalizeAvailabilityDays,
  normalizeBlockedDates,
  normalizeProviderServices,
  tabTriggerClass,
  type ProviderCase,
  type ProviderDocument,
  type ProviderDocumentType,
} from "@/lib/adminProviderDetail";
import { ProviderActivityTab } from "./tabs/ProviderActivityTab";
import { ProviderDocumentsTab } from "./tabs/ProviderDocumentsTab";
import { ProviderPresentationTab } from "./tabs/ProviderPresentationTab";
import { ProviderServicesScheduleTab } from "./tabs/ProviderServicesScheduleTab";
import { ProviderVerificationTab } from "./tabs/ProviderVerificationTab";

const TABS = {
  presentation: "prezentare",
  verification: "verificare",
  services: "servicii",
  documents: "documente",
  activity: "activitate",
} as const;

export function ProviderDetailTabs({
  provider,
  data,
  status,
  profileOk,
  availabilityOk,
  activeServicesCount,
  locationLabel,
  avatarPreviewUrl,
  avatarPreviewLoading,
  onViewDocument,
}: {
  provider: ProviderDocument;
  data: ProviderCase;
  status: string;
  profileOk: boolean;
  availabilityOk: boolean;
  activeServicesCount: number;
  locationLabel: string;
  avatarPreviewUrl: string | null;
  avatarPreviewLoading: boolean;
  onViewDocument: (type: ProviderDocumentType, title: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<string>(TABS.presentation);
  const checklist = getChecklistItems({
    provider,
    profileOk,
    availabilityOk,
    activeServicesCount,
    legalConsentState: getProviderLegalConsentState(provider),
  });
  const verificationIssueCount = getVerificationIssueCount(checklist);
  const providerServices = normalizeProviderServices(data.services);
  const availabilityDays = normalizeAvailabilityDays(data.availability || null);
  const blockedDates = normalizeBlockedDates(data.availability || null);
  const timelineEvents = buildTimelineEvents(provider, data.recentAuditEvents);
  const publicationMeta = getPublicationMeta(data.providerDirectory);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabList className="flex flex-wrap gap-2">
        <TabTrigger value={TABS.presentation} className={tabTriggerClass(activeTab === TABS.presentation)}>
          Prezentare
        </TabTrigger>
        <TabTrigger value={TABS.verification} className={tabTriggerClass(activeTab === TABS.verification)}>
          <span className="inline-flex items-center gap-2">
            Verificare
            {verificationIssueCount > 0 && (
              <Badge variant="warning" className="h-5 min-w-5 px-1.5 text-xs">
                {verificationIssueCount}
              </Badge>
            )}
          </span>
        </TabTrigger>
        <TabTrigger value={TABS.services} className={tabTriggerClass(activeTab === TABS.services)}>
          Servicii &amp; program
        </TabTrigger>
        <TabTrigger value={TABS.documents} className={tabTriggerClass(activeTab === TABS.documents)}>
          Documente
        </TabTrigger>
        <TabTrigger value={TABS.activity} className={tabTriggerClass(activeTab === TABS.activity)}>
          Activitate
        </TabTrigger>
      </TabList>

      <TabContent value={TABS.presentation} className="mt-6">
        <ProviderPresentationTab
          provider={provider}
          providerDirectory={data.providerDirectory}
          avatarPreviewUrl={avatarPreviewUrl}
          avatarPreviewLoading={avatarPreviewLoading}
        />
      </TabContent>

      <TabContent value={TABS.verification} className="mt-6">
        <ProviderVerificationTab
          provider={provider}
          checklist={checklist}
          locationLabel={locationLabel}
        />
      </TabContent>

      <TabContent value={TABS.services} className="mt-6">
        <ProviderServicesScheduleTab
          services={providerServices}
          availabilityDays={availabilityDays}
          blockedDatesCount={blockedDates.length}
        />
      </TabContent>

      <TabContent value={TABS.documents} className="mt-6">
        <ProviderDocumentsTab
          provider={provider}
          status={status}
          publicationLabel={publicationMeta.label}
          publicationVariant={publicationMeta.variant}
          onViewDocument={onViewDocument}
        />
      </TabContent>

      <TabContent value={TABS.activity} className="mt-6">
        <ProviderActivityTab
          timelineEvents={timelineEvents}
          recentBookings={data.recentBookings || []}
        />
      </TabContent>
    </Tabs>
  );
}
