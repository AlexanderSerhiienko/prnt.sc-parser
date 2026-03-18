<template>
  <article class="picture-card">
    <a
      class="picture-link"
      :href="sourceUrl"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="`Open screenshot ${picture.id} on prnt.sc`"
    >
      <div class="picture-overlay">
        <span class="host-chip">{{ hostLabel }}</span>
        <span class="open-chip">Open full</span>
      </div>

      <div v-if="imageFailed" class="fallback">
        <font-awesome-icon icon="exclamation-circle" />
        <strong>Image unavailable</strong>
        <span>The source link is still available if you want to inspect it directly.</span>
      </div>
      <img
        v-else
        class="picture-image"
        :src="picture.url"
        :alt="`Screenshot ${picture.id}`"
        loading="lazy"
        @error="handleImageError"
      />
    </a>

    <div class="picture-meta">
      <span class="picture-id">{{ picture.id }}</span>
      <a class="source-link" :href="sourceUrl" target="_blank" rel="noopener noreferrer">
        Open source
      </a>
    </div>
  </article>
</template>

<script>
export default {
  name: "Picture",
  props: {
    picture: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      imageFailed: false,
    };
  },
  computed: {
    sourceUrl() {
      return `https://prnt.sc/${this.picture.id}`;
    },
    hostLabel() {
      try {
        return new URL(this.picture.url).hostname.replace(/^www\./, "");
      } catch {
        return "cached-source";
      }
    },
  },
  methods: {
    handleImageError() {
      this.imageFailed = true;
    },
  },
};
</script>

<style scoped>
.picture-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(164, 212, 255, 0.18);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(164, 212, 255, 0.04), rgba(164, 212, 255, 0.01)),
    rgba(7, 15, 32, 0.92);
  box-shadow: 0 18px 34px rgba(2, 7, 23, 0.3);
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.picture-card:hover {
  transform: translateY(-4px);
  border-color: rgba(201, 255, 59, 0.34);
  box-shadow: 0 22px 42px rgba(2, 7, 23, 0.4);
}

.picture-link {
  position: relative;
  display: block;
  width: 100%;
  height: 220px;
  text-decoration: none;
}

.picture-overlay {
  position: absolute;
  inset: 0 auto auto 0;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem;
  pointer-events: none;
}

.host-chip,
.open-chip {
  display: inline-flex;
  align-items: center;
  min-height: 1.9rem;
  padding: 0 0.75rem;
  border: 1px solid rgba(164, 212, 255, 0.18);
  border-radius: 999px;
  background: rgba(6, 13, 30, 0.72);
  color: var(--text-primary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  backdrop-filter: blur(8px);
}

.open-chip {
  color: var(--accent);
}

.picture-image,
.fallback {
  display: block;
  width: 100%;
  height: 100%;
}

.picture-image {
  object-fit: cover;
  background: rgba(255, 255, 255, 0.04);
}

.fallback {
  display: grid;
  place-content: center;
  gap: 0.6rem;
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
}

.fallback strong {
  color: var(--text-primary);
}

.picture-meta {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 1rem 1.1rem 1.15rem;
  min-height: 72px;
  background: rgba(5, 11, 24, 0.76);
}

.picture-id {
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.source-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 700;
}

@media (max-width: 840px) {
  .picture-link {
    height: 200px;
  }
}

@media (max-width: 560px) {
  .picture-link {
    height: 240px;
  }
}
</style>
