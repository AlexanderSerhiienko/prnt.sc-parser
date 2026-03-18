<template>
  <section class="gallery-shell">
    <div v-if="!hasRun" class="empty-state">
      <p class="empty-label">Ready when you are</p>
      <h2>Request a batch to start filling the gallery.</h2>
      <p>
        The parser will try to find live screenshots and will tell you when a run only
        lands partial results.
      </p>
    </div>

    <div v-else-if="!pictures.length && !loading" class="empty-state">
      <p class="empty-label">No hits this time</p>
      <h2>That run came back empty.</h2>
      <p>Try a fresh batch and the parser will search again with new random ids.</p>
    </div>

    <div v-else class="gallery-grid">
      <Picture v-for="picture in pictures" :key="picture.id" :picture="picture" />
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
  min-height: 20rem;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.empty-state {
  padding: 2rem;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 28px;
  background: rgba(5, 12, 29, 0.45);
  text-align: center;
  box-shadow: var(--shadow);
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
</style>
