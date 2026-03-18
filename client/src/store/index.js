import axios from "axios";
import { createStore } from "vuex";
import { API_URL, MAX_REQUEST_COUNT } from "../config";

function normalizeCount(value) {
  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue)) {
    return null;
  }

  return Math.min(Math.max(parsedValue, 1), MAX_REQUEST_COUNT);
}

function createDefaultState() {
  return {
    pictures: [],
    total: 0,
    completed: 0,
    failures: 0,
    loading: false,
    autoScroll: true,
    hasRun: false,
    error: null,
    notice: null,
    activeRunId: 0,
  };
}

export default createStore({
  state: createDefaultState(),
  mutations: {
    RESET_RUN(state, total) {
      state.pictures = [];
      state.total = total;
      state.completed = 0;
      state.failures = 0;
      state.loading = true;
      state.hasRun = true;
      state.error = null;
      state.notice = null;
      state.activeRunId += 1;
    },
    FINISH_RUN(state) {
      state.loading = false;
    },
    CANCEL_ACTIVE_RUN(state) {
      state.activeRunId += 1;
      state.loading = false;
    },
    ADD_PICTURE(state, picture) {
      state.pictures.push(picture);
      state.completed += 1;
    },
    REGISTER_FAILURE(state) {
      state.failures += 1;
      state.completed += 1;
    },
    SET_ERROR(state, errorMessage) {
      state.error = errorMessage;
    },
    SET_NOTICE(state, notice) {
      state.notice = notice;
    },
    CLEAR_ERROR(state) {
      state.error = null;
    },
    SET_AUTO_SCROLL(state, value) {
      state.autoScroll = value;
    },
  },
  actions: {
    async startParsing({ commit, dispatch, state }, rawCount) {
      const count = normalizeCount(rawCount);

      if (!count) {
        commit("SET_ERROR", `Choose a number from 1 to ${MAX_REQUEST_COUNT}.`);
        return;
      }

      if (state.loading) {
        commit("CANCEL_ACTIVE_RUN");
      }

      commit("RESET_RUN", count);
      const runId = state.activeRunId;

      try {
        for (let index = 0; index < count; index += 1) {
          if (runId !== state.activeRunId) {
            return;
          }

          await dispatch("fetchPicture", runId);
        }

        if (runId !== state.activeRunId) {
          return;
        }

        if (state.failures > 0 && state.pictures.length > 0) {
          commit("SET_NOTICE", `Loaded ${state.pictures.length} of ${count} requested screenshots.`);
        } else if (state.failures === count) {
          commit("SET_ERROR", "No screenshots were found in this run. Try again.");
        } else {
          commit("SET_NOTICE", `Loaded ${state.pictures.length} screenshots.`);
        }
      } finally {
        if (runId === state.activeRunId) {
          commit("FINISH_RUN");
        }
      }
    },
    async fetchPicture({ commit, state }, runId) {
      try {
        const { data } = await axios.get(`${API_URL}/rimg`);

        if (runId !== state.activeRunId) {
          return;
        }

        commit("ADD_PICTURE", data);
      } catch (error) {
        if (runId !== state.activeRunId) {
          return;
        }

        const fallbackMessage = "Unable to fetch a screenshot right now.";
        const errorMessage = error.response?.data?.message || fallbackMessage;

        commit("REGISTER_FAILURE");
        commit("SET_ERROR", errorMessage);
      }
    },
  },
  getters: {
    pictures: (state) => state.pictures,
    loading: (state) => state.loading,
    progress: (state) => ({
      total: state.total,
      completed: state.completed,
      failures: state.failures,
      successful: state.pictures.length,
    }),
    autoScroll: (state) => state.autoScroll,
    hasRun: (state) => state.hasRun,
    error: (state) => state.error,
    notice: (state) => state.notice,
  },
});
