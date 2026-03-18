<template>
  <div class="app-shell">
    <main class="control-room">
      <section class="live-canvas">
        <div class="canvas-chrome">
          <div class="chrome-copy">
            <p class="eyebrow">Control room</p>
            <h1>Prnt.sc Control Room</h1>
            <p class="lead">
              Stream random screenshot hits into a persistent gallery and watch new finds lock
              into the wall as they arrive.
            </p>
          </div>
        </div>

        <section class="radar-frame">
          <div class="radar-header">
            <div>
              <p class="radar-label">Live canvas</p>
              <h2>Incoming screenshot wall</h2>
            </div>

            <div class="radar-metrics">
              <div class="metric-pill">
                <span>Attempts</span>
                <strong>{{ progress.attempts }}</strong>
              </div>
              <div class="metric-pill">
                <span>Hits</span>
                <strong>{{ progress.successful }}</strong>
              </div>
              <div class="metric-pill metric-pill-accent">
                <span>Status</span>
                <strong>{{ loading ? "Scanning" : "Idle" }}</strong>
              </div>
            </div>
          </div>

          <PictureBox />
        </section>
      </section>

      <aside class="control-panel-column">
        <ControlPanel />
      </aside>
    </main>
  </div>
</template>

<script>
import ControlPanel from "@/components/ControlPanel.vue";
import PictureBox from "@/components/PictureBox.vue";

export default {
  name: "App",
  components: {
    ControlPanel,
    PictureBox,
  },
  computed: {
    progress() {
      return this.$store.getters.progress;
    },
    loading() {
      return this.$store.getters.loading;
    },
  },
};
</script>

<style scoped>
.app-shell {
  width: min(1440px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1rem 0 1.25rem;
}

.control-room {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 430px);
  gap: 1.25rem;
  align-items: start;
  min-height: calc(100vh - 2rem);
}

.live-canvas {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}

.canvas-chrome {
  position: relative;
  overflow: hidden;
  padding: 1.35rem 1.45rem;
  border: 1px solid rgba(164, 212, 255, 0.18);
  border-radius: 36px;
  background:
    linear-gradient(140deg, rgba(130, 183, 255, 0.12), rgba(130, 183, 255, 0.02)),
    linear-gradient(180deg, rgba(5, 12, 29, 0.94), rgba(8, 20, 44, 0.82));
  box-shadow: var(--shadow);
}

.canvas-chrome::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(201, 255, 59, 0.08), transparent 28%),
    repeating-linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.03) 0,
      rgba(255, 255, 255, 0.03) 1px,
      transparent 1px,
      transparent 22px
    );
  pointer-events: none;
}

.chrome-copy {
  position: relative;
  z-index: 1;
}

.eyebrow {
  margin: 0 0 0.55rem;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.7rem;
  font-weight: 800;
}

.chrome-copy h1 {
  margin: 0;
  max-width: 12ch;
  font-size: clamp(2.35rem, 4.8vw, 4.1rem);
  line-height: 0.94;
}

.lead {
  max-width: 42rem;
  margin: 0.8rem 0 0;
  color: var(--text-secondary);
  font-size: 0.98rem;
}

.radar-label {
  display: block;
  margin-bottom: 0.55rem;
  color: rgba(193, 220, 255, 0.64);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.72rem;
  font-weight: 800;
}

.radar-frame {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  margin-top: 1rem;
  padding: 1.35rem 1rem 1rem;
  border: 1px solid rgba(164, 212, 255, 0.18);
  border-radius: 36px;
  background:
    radial-gradient(circle at top, rgba(124, 245, 201, 0.08), transparent 38%),
    rgba(5, 12, 29, 0.72);
  box-shadow: var(--shadow);
}

.radar-frame::before {
  content: "";
  position: absolute;
  inset: 18px 14px 14px;
  border: 1px solid rgba(164, 212, 255, 0.12);
  border-radius: 28px;
  pointer-events: none;
}

.radar-header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  padding: 0.65rem 0.55rem 1rem;
}

.radar-header h2 {
  margin: 0;
  font-size: 1.45rem;
}

.radar-metrics {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.metric-pill {
  min-width: 90px;
  padding: 0.8rem 0.95rem;
  border: 1px solid rgba(164, 212, 255, 0.18);
  border-radius: 18px;
  background: rgba(9, 19, 39, 0.82);
}

.metric-pill span {
  display: block;
  margin-bottom: 0.3rem;
  color: rgba(193, 220, 255, 0.66);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.68rem;
  font-weight: 700;
}

.metric-pill strong {
  font-size: 1rem;
}

.metric-pill-accent {
  background:
    linear-gradient(135deg, rgba(201, 255, 59, 0.12), rgba(124, 245, 201, 0.08)),
    rgba(9, 19, 39, 0.88);
}

.control-panel-column {
  position: sticky;
  top: 1rem;
  max-height: calc(100vh - 2rem);
  overflow: auto;
}

@media (max-width: 980px) {
  .app-shell {
    width: min(100% - 1rem, 1440px);
    padding-top: 0.75rem;
  }

  .control-room {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .control-panel-column {
    position: static;
    max-height: none;
    overflow: visible;
  }
}

@media (max-width: 720px) {
  .canvas-chrome {
    padding: 1.35rem;
  }

  .signal-grid {
    grid-template-columns: 1fr;
  }

  .radar-header {
    flex-direction: column;
  }

  .radar-metrics {
    justify-content: flex-start;
  }
}
</style>
