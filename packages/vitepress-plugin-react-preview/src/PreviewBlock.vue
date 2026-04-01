<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

const props = defineProps<{
  code: string;
  blockId: string;
  highlighted?: string;
  height?: string;
  wrap?: string;
  align?: string;
  standalone?: string;
}>();

const isStandalone = computed(() => props.standalone === "true");
const showCode = ref(true);
const iframeRef = ref<HTMLIFrameElement | null>(null);
const iframeHeight = ref(props.height ? Number(props.height) : 150);

const decodedCode = computed(() => {
  try {
    return atob(props.code);
  } catch {
    return props.code;
  }
});

const decodedHighlighted = computed(() => {
  if (!props.highlighted) return "";
  try {
    return atob(props.highlighted);
  } catch {
    return "";
  }
});

const currentTheme = computed(() => {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
});

const previewUrl = computed(() => {
  const params = new URLSearchParams({ theme: currentTheme.value });
  if (props.wrap) params.set("wrap", props.wrap);
  if (props.align) params.set("align", props.align);
  return `/__preview/${props.blockId}?${params}`;
});

function onMessage(e: MessageEvent) {
  if (
    e.data?.type === "markstage-resize" &&
    e.data?.blockId === props.blockId
  ) {
    iframeHeight.value = e.data.height;
  }
}

onMounted(() => {
  window.addEventListener("message", onMessage);
});

onBeforeUnmount(() => {
  window.removeEventListener("message", onMessage);
});
</script>

<template>
  <div class="markstage-preview vp-raw">
    <template v-if="isStandalone">
      <a
        :href="previewUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="markstage-preview-standalone-link"
      >
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5">
          <path d="M7 3H3v10h10V9" />
          <path d="M10 2h4v4" />
          <path d="M14 2L7 9" />
        </svg>
        <span class="markstage-preview-standalone-text">
          <span class="markstage-preview-standalone-title">Open full-page preview</span>
          <span class="markstage-preview-standalone-desc">This component requires a full viewport to render correctly.</span>
        </span>
      </a>
    </template>
    <template v-else>
      <div class="markstage-preview-render">
        <iframe
          ref="iframeRef"
          :src="previewUrl"
          :style="{ height: iframeHeight + 'px' }"
          class="markstage-preview-iframe"
        />
      </div>
      <div class="markstage-preview-actions">
        <a
          :href="previewUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="markstage-preview-fullscreen-link"
        >
          Open full preview
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7 3H3v10h10V9" />
            <path d="M10 2h4v4" />
            <path d="M14 2L7 9" />
          </svg>
        </a>
      </div>
    </template>
    <div class="markstage-preview-code">
      <button
        class="markstage-preview-toggle"
        @click="showCode = !showCode"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          :class="{ 'markstage-chevron-open': showCode }"
        >
          <path d="M6 4l4 4-4 4" />
        </svg>
        Code
      </button>
      <div v-if="showCode && decodedHighlighted" v-html="decodedHighlighted" />
      <div v-else-if="showCode" class="language-tsx vp-adaptive-theme">
        <pre><code>{{ decodedCode }}</code></pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.markstage-preview {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  margin: 16px 0;
}

.markstage-preview-render {
  background-color: var(--vp-c-bg);
}

.markstage-preview-iframe {
  display: block;
  width: 100%;
  border: none;
  transition: height 0.15s ease;
}

.markstage-preview-code {
  border-top: 1px solid var(--vp-c-divider);
}

.markstage-preview-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--vp-c-text-2);
  font-family: inherit;
}

.markstage-preview-toggle:hover {
  color: var(--vp-c-text-1);
}

.markstage-chevron-open {
  transform: rotate(90deg);
}

.markstage-preview-actions {
  display: flex;
  justify-content: flex-end;
  padding: 6px 12px;
  border-top: 1px solid var(--vp-c-divider);
}

.markstage-preview-fullscreen-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  text-decoration: none;
}

.markstage-preview-fullscreen-link:hover {
  color: var(--vp-c-text-1);
}

.markstage-preview-code svg {
  transition: transform 0.15s;
}

.markstage-preview-code pre {
  margin: 0 !important;
  border-radius: 0 !important;
}

.markstage-preview-code :deep(pre) {
  margin: 0 !important;
  border-radius: 0 !important;
  padding: 16px !important;
}

.markstage-preview-code :deep(pre code) {
  font-size: 13px !important;
  line-height: 1.6 !important;
}

.markstage-preview-standalone-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  text-decoration: none;
  color: var(--vp-c-text-2);
  transition: background-color 0.15s;
}

.markstage-preview-standalone-link:hover {
  background-color: var(--vp-c-bg-soft);
}

.markstage-preview-standalone-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.markstage-preview-standalone-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.markstage-preview-standalone-desc {
  font-size: 12px;
  color: var(--vp-c-text-3);
}
</style>
