import type { DataSource } from "./types";

function notImpl(name: string): never {
  throw new Error(`OdooDataSource.${name} not implemented. Use DATA_SOURCE=mock for now.`);
}

export function makeOdooDataSource(): DataSource {
  return {
    opportunities: {
      list: () => notImpl("opportunities.list"),
      get: () => notImpl("opportunities.get"),
      create: () => notImpl("opportunities.create"),
      update: () => notImpl("opportunities.update"),
      remove: () => notImpl("opportunities.remove"),
      changeStage: () => notImpl("opportunities.changeStage"),
    },
    contacts: {
      list: () => notImpl("contacts.list"),
      get: () => notImpl("contacts.get"),
      create: () => notImpl("contacts.create"),
      update: () => notImpl("contacts.update"),
    },
    stages: { list: () => notImpl("stages.list") },
    users: { list: () => notImpl("users.list"), get: () => notImpl("users.get") },
    activities: {
      list: () => notImpl("activities.list"),
      create: () => notImpl("activities.create"),
      update: () => notImpl("activities.update"),
    },
    dashboard: { summary: () => notImpl("dashboard.summary") },
    widgets: {
      list: () => notImpl("widgets.list"),
      get: () => notImpl("widgets.get"),
      create: () => notImpl("widgets.create"),
      update: () => notImpl("widgets.update"),
      remove: () => notImpl("widgets.remove"),
      transition: () => notImpl("widgets.transition"),
    },
  };
}
