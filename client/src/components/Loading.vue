<template>
  <div class="loading-badge" aria-hidden="true">
    <span></span>
    <span></span>
    <span></span>
  </div>
</template>

<style scoped>
.loading-badge {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
}

.loading-badge span {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  background: var(--accent);
  animation: pulse 0.9s ease-in-out infinite;
}

.loading-badge span:nth-child(2) {
  animation-delay: 0.15s;
}

.loading-badge span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }

  50% {
    opacity: 1;
    transform: translateY(-0.2rem);
  }
}
</style>
