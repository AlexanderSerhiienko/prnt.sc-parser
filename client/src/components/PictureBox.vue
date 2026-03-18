<template>
  <section class="gallery-shell">
    <div class="gallery-screen">
      <div class="screen-grid"></div>

      <div v-if="!hasRun" class="empty-state">
        <p class="empty-label">Ready when you are</p>
        <h2>Start a scan to populate the live wall.</h2>
        <p>
          The parser will stream screenshots into the control room as soon as they land.
        </p>
      </div>

      <div v-else-if="!pictures.length && !loading" class="empty-state">
        <p class="empty-label">No hits this time</p>
        <h2>The wall stayed empty on that pass.</h2>
        <p>Try another run and the parser will keep scanning fresh random ids.</p>
      </div>

      <div v-else class="gallery-grid">
        <Picture v-for="picture in pictures" :key="picture.id" :picture="picture" />
      </div>
    </div>

    <div ref="galleryEnd"></div>
  </section>
</template>

<script>
import { nextTick } from "vue";
import Picture from "@/components/Picture.vue";

export default {
  name: "PictureBox",
  components: {
    Picture,
  },
  computed: {
    pictures() {
      return this.$store.getters.pictures;
    },
    loading() {
      return this.$store.getters.loading;
    },
    hasRun() {
      return this.$store.getters.hasRun;
    },
    autoScroll() {
      return this.$store.getters.autoScroll;
    },
  },
  watch: {
    async pictures() {
      if (!this.autoScroll || !this.pictures.length) {
        return;
      }

      await nextTick();
      this.$refs.galleryEnd?.scrollIntoView({ behavior: "smooth", block: "end" });
    },
  },
};
</script>

<style scoped>
.gallery-shell {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
}

.gallery-screen {
  position: relative;
  overflow: auto;
  height: 100%;
  min-height: 0;
  padding: 1rem;
  border-radius: 28px;
  background:
    radial-gradient(circle at top, rgba(124, 245, 201, 0.08), transparent 34%),
    rgba(4, 11, 27, 0.84);
  scrollbar-width: thin;
  scrollbar-color: rgba(201, 255, 59, 0.55) rgba(255, 255, 255, 0.08);
}

.gallery-screen::-webkit-scrollbar {
  width: 10px;
}

.gallery-screen::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
}

.gallery-screen::-webkit-scrollbar-thumb {
  background: rgba(201, 255, 59, 0.45);
  border-radius: 999px;
}

.screen-grid {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(201, 255, 59, 0.05), rgba(201, 255, 59, 0.02)),
    repeating-linear-gradient(
      90deg,
      rgba(164, 212, 255, 0.06) 0,
      rgba(164, 212, 255, 0.06) 1px,
      transparent 1px,
      transparent 46px
    ),
    repeating-linear-gradient(
      180deg,
      rgba(164, 212, 255, 0.06) 0,
      rgba(164, 212, 255, 0.06) 1px,
      transparent 1px,
      transparent 46px
    );
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.8), transparent 100%);
  pointer-events: none;
}

.gallery-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.empty-state {
  position: relative;
  z-index: 1;
  min-height: 100%;
  display: grid;
  place-content: center;
  padding: 2rem;
  border: 1px dashed rgba(164, 212, 255, 0.22);
  border-radius: 28px;
  background: rgba(7, 15, 32, 0.72);
  text-align: center;
}

.empty-label {
  margin: 0;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.78rem;
  font-weight: 700;
}

.empty-state h2 {
  margin: 0.75rem 0;
}

.empty-state p:last-child {
  margin: 0;
  color: var(--text-secondary);
}

@media (max-width: 1120px) {
  .gallery-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 840px) {
  .gallery-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .gallery-grid {
    grid-template-columns: 1fr;
  }
}
</style>
