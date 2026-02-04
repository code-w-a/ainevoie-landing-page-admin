"use client";

import {
  createContext,
  HTMLAttributes,
  useContext,
  useId,
  useState,
} from "react";

type TabsContextType = {
  activeTab: string;
  setActiveTab: (id: string) => void;
  id: string;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error("useTabsContext must be used within a Tabs Component");
  }

  return context;
}

type TabsProps = {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
};

export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  const id = useId();

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, id }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

type TabListProps = {
  children: React.ReactNode;
  className?: string;
};

export function TabList({ children, className }: TabListProps) {
  return (
    <div role="tablist" className={className}>
      {children}
    </div>
  );
}

type TabTriggerProps = HTMLAttributes<HTMLButtonElement> & {
  value: string;
  children: React.ReactNode;
};

export function TabTrigger({
  value,
  children,
  className,
  ...props
}: TabTriggerProps) {
  const { activeTab, setActiveTab, id } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      data-active={isActive}
      onClick={() => setActiveTab(value)}
      className={className}
      role="tab"
      aria-selected={isActive}
      id={`${id}-trigger-${value}`}
      aria-controls={`${id}-content-${value}`}
      {...props}
    >
      {children}
    </button>
  );
}

type TabContentProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};

export function TabContent({ value, children, className }: TabContentProps) {
  const { activeTab, id } = useTabsContext();

  return (
    <div
      role="tabpanel"
      id={`${id}-content-${value}`}
      aria-labelledby={`${id}-trigger-${value}`}
      className={className}
      hidden={activeTab !== value}
    >
      {children}
    </div>
  );
}
