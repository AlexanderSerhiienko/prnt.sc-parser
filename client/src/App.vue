<template>
  <div class="app-shell">
    <header class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Random screenshot explorer</p>
        <h1>Prnt.sc Parser</h1>
        <p class="lead">
          Generate a batch, watch the gallery fill up, and keep the fun chaos of the
          original project without the brittle prototype edges.
        </p>
      </div>
      <ControlPanel />
    </header>

    <main class="content">
      <PictureBox />
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
};
</script>

<style scoped>
.app-shell {
  width: min(1200px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 2rem 0 4rem;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 420px);
  gap: 1.5rem;
  align-items: stretch;
}

.hero-copy {
  padding: 2rem;
  border: 1px solid var(--border);
  border-radius: 32px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04)),
    rgba(5, 10, 25, 0.4);
  box-shadow: var(--shadow);
  backdrop-filter: blur(12px);
}

.eyebrow {
  margin: 0 0 1rem;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.78rem;
  font-weight: 700;
}

.hero-copy h1 {
  margin: 0;
  font-size: clamp(2.8rem, 6vw, 5rem);
  line-height: 0.96;
}

.lead {
  max-width: 32rem;
  margin: 1.25rem 0 0;
  color: var(--text-secondary);
  font-size: 1.05rem;
}

.content {
  margin-top: 1.5rem;
}

@media (max-width: 920px) {
  .app-shell {
    width: min(100% - 1rem, 1200px);
    padding-top: 1rem;
  }

  .hero {
    grid-template-columns: 1fr;
  }

  .hero-copy {
    padding: 1.5rem;
  }
}
</style>
