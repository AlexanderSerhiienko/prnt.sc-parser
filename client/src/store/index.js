import { createStore } from "vuex";
import { API_URL, DEFAULT_ID_LENGTH, MAX_REQUEST_COUNT } from "../config";

const STORAGE_KEY = "prntsc-parser-gallery";
const SETTINGS_KEY = "prntsc-parser-settings";
const MAX_STORED_PICTURES = 200;

let activeStream = null;

function normalizeCount(value) {
  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue)) {
    return null;
  }

  return Math.min(Math.max(parsedValue, 1), MAX_REQUEST_COUNT);
}

function loadPersistedPictures() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter((item) => item && item.id && item.url).slice(0, MAX_STORED_PICTURES);
  } catch {
    return [];
  }
}

function savePersistedPictures(pictures) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pictures.slice(0, MAX_STORED_PICTURES)));
}

function loadPersistedSettings() {
  if (typeof window === "undefined") {
    return {
      autoScroll: true,
      idLength: DEFAULT_ID_LENGTH,
    };
  }

  try {
    const rawValue = window.localStorage.getItem(SETTINGS_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : {};

    return {
      autoScroll: parsedValue.autoScroll ?? true,
      idLength: parsedValue.idLength ?? DEFAULT_ID_LENGTH,
    };
  } catch {
    return {
      autoScroll: true,
      idLength: DEFAULT_ID_LENGTH,
    };
  }
}

function savePersistedSettings(settings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function createDefaultState() {
  const pictures = loadPersistedPictures();
  const settings = loadPersistedSettings();

  return {
    pictures,
    total: 0,
    completed: 0,
    failures: 0,
    attempts: 0,
    successful: 0,
    loading: false,
    autoScroll: settings.autoScroll,
    hasRun: pictures.length > 0,
    error: null,
    notice: null,
    idLength: settings.idLength,
    activeRunId: 0,
  };
}

export default createStore({
  state: createDefaultState(),
  mutations: {
    RESET_RUN(state, total) {
      state.total = total;
      state.completed = 0;
      state.failures = 0;
      state.attempts = 0;
      state.successful = 0;
      state.loading = true;
      state.hasRun = true;
      state.error = null;
      state.notice = null;
      state.activeRunId += 1;
    },
    ADD_PICTURE(state, picture) {
      const exists = state.pictures.some((item) => item.id === picture.id);

      if (!exists) {
        state.pictures.unshift(picture);
        state.pictures = state.pictures.slice(0, MAX_STORED_PICTURES);
        savePersistedPictures(state.pictures);
      }
    },
    UPDATE_PROGRESS(state, payload) {
      state.total = payload.requested ?? state.total;
      state.attempts = payload.attempted ?? state.attempts;
      state.completed = payload.attempted ?? state.completed;
      state.failures = payload.failed ?? state.failures;
      state.successful = payload.returned ?? state.successful;
    },
    FINISH_RUN(state) {
      state.loading = false;
    },
    CANCEL_ACTIVE_RUN(state) {
      state.activeRunId += 1;
      state.loading = false;
    },
    SET_ERROR(state, errorMessage) {
      state.error = errorMessage;
    },
    SET_NOTICE(state, notice) {
      state.notice = notice;
    },
    SET_ID_LENGTH(state, value) {
      state.idLength = value;
      savePersistedSettings({
        autoScroll: state.autoScroll,
        idLength: state.idLength,
      });
    },
    SET_AUTO_SCROLL(state, value) {
      state.autoScroll = value;
      savePersistedSettings({
        autoScroll: state.autoScroll,
        idLength: state.idLength,
      });
    },
  },
  actions: {
    startParsing({ commit, state }, rawCount) {
      const count = normalizeCount(rawCount);

      if (!count) {
        commit("SET_ERROR", `Choose a number from 1 to ${MAX_REQUEST_COUNT}.`);
        return;
      }

      if (activeStream) {
        activeStream.close();
        activeStream = null;
      }

      if (state.loading) {
        commit("CANCEL_ACTIVE_RUN");
      }

      commit("RESET_RUN", count);
      const runId = state.activeRunId;
      const streamUrl = new URL(`${API_URL}/rimg/stream`);
      streamUrl.searchParams.set("count", count);
      streamUrl.searchParams.set("length", state.idLength);

      const eventSource = new EventSource(streamUrl.toString());
      activeStream = eventSource;

      eventSource.addEventListener("start", (event) => {
        if (runId !== state.activeRunId) {
          return;
        }

        const payload = JSON.parse(event.data);
        commit("UPDATE_PROGRESS", {
          requested: payload.requested,
          attempted: 0,
          failed: 0,
          returned: 0,
        });
      });

      eventSource.addEventListener("item", (event) => {
        if (runId !== state.activeRunId) {
          return;
        }

        const payload = JSON.parse(event.data);
        commit("ADD_PICTURE", payload.item);
        commit("UPDATE_PROGRESS", payload);
      });

      eventSource.addEventListener("progress", (event) => {
        if (runId !== state.activeRunId) {
          return;
        }

        const payload = JSON.parse(event.data);
        commit("UPDATE_PROGRESS", payload);
      });

      eventSource.addEventListener("done", (event) => {
        if (runId !== state.activeRunId) {
          return;
        }

        const payload = JSON.parse(event.data);
        commit("UPDATE_PROGRESS", payload);
        commit("SET_NOTICE", `Added ${payload.returned} new screenshots after ${payload.attempted} attempts.`);

        commit("FINISH_RUN");
        eventSource.close();

        if (activeStream === eventSource) {
          activeStream = null;
        }
      });

      eventSource.addEventListener("run-error", (event) => {
        if (runId !== state.activeRunId) {
          return;
        }

        let payload = null;

        if (event.data) {
          try {
            payload = JSON.parse(event.data);
          } catch {
            payload = null;
          }
        }

        const fallbackMessage = "Unable to fetch screenshots right now.";
        commit("SET_ERROR", payload?.message || fallbackMessage);
        commit("FINISH_RUN");
        eventSource.close();

        if (activeStream === eventSource) {
          activeStream = null;
        }
      });

      eventSource.onerror = () => {
        if (runId !== state.activeRunId) {
          return;
        }

        if (!state.loading) {
          return;
        }

        commit("SET_ERROR", "Unable to keep the screenshot stream open right now.");
        commit("FINISH_RUN");
        eventSource.close();

        if (activeStream === eventSource) {
          activeStream = null;
        }
      };
    },
  },
  getters: {
    pictures: (state) => state.pictures,
    loading: (state) => state.loading,
    progress: (state) => ({
      total: state.total,
      completed: state.completed,
      failures: state.failures,
      successful: state.successful,
      attempts: state.attempts,
    }),
    autoScroll: (state) => state.autoScroll,
    hasRun: (state) => state.hasRun,
    error: (state) => state.error,
    notice: (state) => state.notice,
    idLength: (state) => state.idLength,
  },
});
