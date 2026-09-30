<script setup lang="ts">
import { Heart } from '@lucide/vue';
</script>

<template>
  <a
    href="https://github.com/sponsors/creeperkatze"
    target="_blank"
    rel="noopener noreferrer"
    class="sponsor-button"
    aria-label="Sponsor on GitHub"
  >
    <Heart class="heart-icon" :stroke-width="2.5" />
    Sponsor
  </a>
</template>

<style scoped>
.sponsor-button {
  margin-left: 16px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  background-color: var(--vp-c-brand-bg);
  font-size: 13px;
  font-weight: 500;
  color: #fff !important;
  text-decoration: none !important;
  transition: opacity 0.15s;
}

.sponsor-button:hover {
  opacity: 0.8;
}

.heart-icon {
  height: 16px;
  width: 16px;
  flex-shrink: 0;
}
</style>
