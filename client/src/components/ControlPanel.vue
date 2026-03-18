<template>
  <section class="panel">
    <div class="panel-top">
      <div>
        <p class="panel-label">Control center</p>
        <h2>Build a screenshot batch</h2>
      </div>

      <a
        class="github-link"
        href="https://github.com/AlexanderSerhiienko/prnt.sc-parser"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open GitHub repository"
      >
        <font-awesome-icon :icon="['fab', 'github']" />
      </a>
    </div>

    <form class="search-form" @submit.prevent="submit">
      <label class="input-label" for="amount">How many screenshots?</label>
      <div class="input-row">
        <input
          id="amount"
          v-model="inputValue"
          type="number"
          min="1"
          :max="maxRequestCount"
          inputmode="numeric"
          placeholder="8"
        />
        <button class="submit-button" type="submit" :disabled="!isValidInput">
          <font-awesome-icon :icon="loading ? 'redo-alt' : 'search'" />
          <span>{{ buttonLabel }}</span>
        </button>
      </div>
      <p class="field-hint">Pick a value from 1 to {{ maxRequestCount }}.</p>

      <label class="input-label secondary-label" for="length">ID length</label>
      <select id="length" class="length-select" :value="idLength" @change="updateIdLength">
        <option v-for="option in idLengthOptions" :key="option" :value="option">
          {{ option }} symbols
        </option>
      </select>
    </form>

    <div class="panel-status">
      <div class="status-tile">
        <span class="status-label">Total parsed</span>
        <strong>{{ progress.completed }}</strong>
      </div>
      <div class="status-tile">
        <span class="status-label">Successful</span>
        <strong>{{ progress.successful }}</strong>
      </div>
      <div class="status-tile">
        <span class="status-label">Missed</span>
        <strong>{{ progress.failures }}</strong>
      </div>
    </div>

    <div class="ops-grid">
      <article class="ops-card">
        <span class="ops-label">Hit rate</span>
        <strong>{{ hitRate }}</strong>
        <p>Successful finds versus total parsed attempts in the current run.</p>
      </article>

      <article class="ops-card">
        <span class="ops-label">Current run</span>
        <strong>{{ runStatus }}</strong>
        <p>{{ runDescription }}</p>
      </article>

      <article class="ops-card">
        <span class="ops-label">Gallery memory</span>
        <strong>{{ pictureCount }}</strong>
        <p>Persistent screenshots currently pinned to the local archive wall.</p>
      </article>

      <article class="ops-card ops-card-accent">
        <span class="ops-label">Generator</span>
        <strong>{{ idLength }}-symbol ids</strong>
        <p>The current id length used for new search attempts.</p>
      </article>
    </div>

    <label class="toggle">
      <input type="checkbox" :checked="autoScroll" @change="toggleScroll" />
      <span>Auto-scroll gallery as new screenshots arrive</span>
    </label>

    <div v-if="loading" class="progress-card">
      <Loading />
      <div>
        <strong>Parsing screenshots...</strong>
        <p>Starting a new run replaces the current one cleanly.</p>
      </div>
    </div>

    <p v-if="notice" class="message message-notice">{{ notice }}</p>
    <p v-if="error" class="message message-error">
      <font-awesome-icon icon="exclamation-circle" />
      <span>{{ error }}</span>
    </p>
  </section>
</template>

<script>
import Loading from "./Loading.vue";
import { ID_LENGTH_OPTIONS, MAX_REQUEST_COUNT } from "../config";

export default {
  name: "ControlPanel",
  components: {
    Loading,
  },
  data() {
    return {
      inputValue: "8",
      maxRequestCount: MAX_REQUEST_COUNT,
      idLengthOptions: ID_LENGTH_OPTIONS,
    };
  },
  computed: {
    loading() {
      return this.$store.getters.loading;
    },
    progress() {
      return this.$store.getters.progress;
    },
    autoScroll() {
      return this.$store.getters.autoScroll;
    },
    notice() {
      return this.$store.getters.notice;
    },
    error() {
      return this.$store.getters.error;
    },
    idLength() {
      return this.$store.getters.idLength;
    },
    pictureCount() {
      return this.$store.getters.pictures.length;
    },
    normalizedInput() {
      const parsedValue = Number.parseInt(this.inputValue, 10);

      if (Number.isNaN(parsedValue)) {
        return null;
      }

      return parsedValue;
    },
    isValidInput() {
      return this.normalizedInput >= 1 && this.normalizedInput <= this.maxRequestCount;
    },
    buttonLabel() {
      return this.loading ? "Restart run" : "Load screenshots";
    },
    hitRate() {
      if (!this.progress.completed) {
        return "0%";
      }

      return `${Math.round((this.progress.successful / this.progress.completed) * 100)}%`;
    },
    runStatus() {
      if (this.loading) {
        return "Scanning";
      }

      if (this.progress.completed > 0) {
        return "Run complete";
      }

      return "Standing by";
    },
    runDescription() {
      if (this.loading) {
        return "The live stream stays open and pushes screenshots into the wall one by one.";
      }

      if (this.progress.completed > 0) {
        return "Launch another pass any time without clearing the screenshots you already saved.";
      }

      return "Set a batch size, choose the id length, and start a new scan.";
    },
  },
  methods: {
    submit() {
      if (!this.isValidInput) {
        return;
      }

      this.$store.dispatch("startParsing", this.normalizedInput);
    },
    toggleScroll(event) {
      this.$store.commit("SET_AUTO_SCROLL", event.target.checked);
    },
    updateIdLength(event) {
      this.$store.commit("SET_ID_LENGTH", Number.parseInt(event.target.value, 10));
    },
  },
};
</script>

<style scoped>
.panel {
  position: relative;
  padding: 1.5rem;
  border: 1px solid rgba(164, 212, 255, 0.18);
  border-radius: 32px;
  background:
    linear-gradient(180deg, rgba(164, 212, 255, 0.12), rgba(164, 212, 255, 0.03)),
    rgba(6, 13, 30, 0.9);
  box-shadow: var(--shadow);
  backdrop-filter: blur(12px);
}

.panel::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    radial-gradient(circle at top right, rgba(201, 255, 59, 0.1), transparent 30%),
    repeating-linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.025) 0,
      rgba(255, 255, 255, 0.025) 1px,
      transparent 1px,
      transparent 20px
    );
  pointer-events: none;
}

.panel-top {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.panel-label {
  margin: 0;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.75rem;
  font-weight: 700;
}

.panel-top h2 {
  margin: 0.4rem 0 0;
  font-size: 1.6rem;
}

.github-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: var(--accent);
  font-size: 1.25rem;
  text-decoration: none;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.github-link:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.18);
}

.search-form {
  position: relative;
  z-index: 1;
  margin-top: 1.5rem;
}

.input-label {
  display: block;
  margin-bottom: 0.6rem;
  font-weight: 700;
}

.input-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
}

.input-row input {
  width: 100%;
  min-height: 3.6rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 18px;
  padding: 0 1rem;
  color: var(--text-primary);
  background: rgba(5, 12, 29, 0.72);
}

.input-row input:focus {
  outline: 2px solid rgba(201, 255, 59, 0.45);
  outline-offset: 2px;
}

.submit-button {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 3.6rem;
  border: none;
  border-radius: 18px;
  padding: 0 1.15rem;
  background: linear-gradient(135deg, var(--accent) 0%, #7cf5c9 100%);
  color: #07253f;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 16px 24px rgba(124, 245, 201, 0.18);
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  box-shadow: none;
}

.field-hint {
  margin: 0.75rem 0 0;
  color: var(--text-secondary);
  font-size: 0.92rem;
}

.secondary-label {
  margin-top: 1rem;
}

.length-select {
  width: 100%;
  min-height: 3.4rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 18px;
  padding: 0 1rem;
  color: var(--text-primary);
  background: rgba(5, 12, 29, 0.72);
}

.panel-status {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.status-tile {
  padding: 0.95rem;
  border-radius: 20px;
  background: rgba(10, 22, 46, 0.76);
  border: 1px solid rgba(164, 212, 255, 0.16);
}

.status-label {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.ops-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.85rem;
}

.ops-card {
  min-height: 124px;
  padding: 0.95rem 1rem;
  border-radius: 20px;
  background: rgba(10, 22, 46, 0.72);
  border: 1px solid rgba(164, 212, 255, 0.16);
}

.ops-card-accent {
  background:
    linear-gradient(145deg, rgba(201, 255, 59, 0.16), rgba(124, 245, 201, 0.08)),
    rgba(10, 22, 46, 0.84);
}

.ops-label {
  display: block;
  margin-bottom: 0.4rem;
  color: rgba(193, 220, 255, 0.64);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.68rem;
  font-weight: 800;
}

.ops-card strong {
  display: block;
  font-size: 1.08rem;
}

.ops-card p {
  margin: 0.45rem 0 0;
  color: var(--text-secondary);
  font-size: 0.88rem;
}

.toggle {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-top: 1.25rem;
  color: var(--text-secondary);
}

.toggle input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--accent);
}

.progress-card {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 0.9rem;
  align-items: center;
  margin-top: 1.25rem;
  padding: 1rem;
  border-radius: 20px;
  background: rgba(255, 143, 92, 0.12);
  border: 1px solid rgba(255, 143, 92, 0.2);
}

.progress-card strong {
  display: block;
}

.progress-card p {
  margin: 0.2rem 0 0;
  color: var(--text-secondary);
  font-size: 0.92rem;
}

.message {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 0.55rem;
  align-items: flex-start;
  margin: 1rem 0 0;
  padding: 0.9rem 1rem;
  border-radius: 18px;
}

.message-notice {
  background: rgba(124, 245, 201, 0.12);
  border: 1px solid rgba(124, 245, 201, 0.18);
}

.message-error {
  background: rgba(255, 111, 125, 0.12);
  border: 1px solid rgba(255, 111, 125, 0.22);
}

@media (max-width: 920px) {
  .panel-status {
    grid-template-columns: 1fr;
  }

  .ops-grid {
    grid-template-columns: 1fr;
  }

  .input-row {
    grid-template-columns: 1fr;
  }

  .submit-button {
    justify-content: center;
  }
}
</style>
