<template>
  <article class="picture-card">
    <a
      class="picture-link"
      :href="sourceUrl"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="`Open screenshot ${picture.id} on prnt.sc`"
    >
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
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 28px;
  background: rgba(7, 15, 32, 0.88);
  box-shadow: var(--shadow);
}

.picture-link {
  display: block;
  text-decoration: none;
}

.picture-image,
.fallback {
  display: block;
  width: 100%;
  min-height: 320px;
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
}

.picture-id {
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.source-link {
  color: var(--accent);
  text-decoration: none;
}
</style>
