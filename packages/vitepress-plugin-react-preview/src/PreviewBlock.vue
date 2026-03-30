<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";

const props = defineProps<{
  code: string;
  blockId: string;
  highlighted?: string;
  height?: string;
}>();

const iframeHeight = ref(props.height ? Number(props.height) : 150);
const showCode = ref(true);
const iframeRef = ref<HTMLIFrameElement | null>(null);

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

const iframeSrc = computed(() => {
  return `/__markstage_preview/${props.blockId}`;
});

function onMessage(event: MessageEvent) {
  if (
    event.data?.type === "markstage-resize" &&
    event.data.blockId === props.blockId
  ) {
    iframeHeight.value = event.data.height;
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
  <div class="markstage-preview">
    <div class="markstage-preview-render">
      <iframe
        ref="iframeRef"
        :src="iframeSrc"
        :style="{ height: iframeHeight + 'px' }"
        frameborder="0"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
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
  background-image: radial-gradient(
    circle,
    var(--vp-c-divider) 1px,
    transparent 1px
  );
  background-size: 16px 16px;
}

.markstage-preview-render iframe {
  width: 100%;
  border: none;
  display: block;
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
</style>
