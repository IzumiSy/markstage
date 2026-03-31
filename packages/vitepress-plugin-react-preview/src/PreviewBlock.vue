<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import {
  setupShadowPreview,
  injectPreviewCss,
  cleanupPreviewCss,
} from "@izumisy/react-preview/dom";

const props = defineProps<{
  code: string;
  blockId: string;
  highlighted?: string;
  height?: string;
  wrap?: string;
  align?: string;
}>();

const showCode = ref(true);
const containerRef = ref<HTMLDivElement | null>(null);

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

let reactRoot: any = null;
let cleanupThemeSyncFn: (() => void) | null = null;

onMounted(async () => {
  const el = containerRef.value;
  if (!el) return;

  const [{ createElement }, { createRoot }] = await Promise.all([
    import("react"),
    import("react-dom/client"),
  ]);

  const { shadow, mountPoint, cleanupThemeSync } = setupShadowPreview(el, {
    align: props.align,
    wrap: props.wrap,
  });
  cleanupThemeSyncFn = cleanupThemeSync;

  // In dev mode, import each block module directly to avoid stale registry
  // issues. VitePress lazily processes pages, so the centralized registry
  // module may not contain blocks from pages that haven't been visited yet.
  // In build mode all pages are processed upfront, so the registry is safe.
  const mod = import.meta.env.DEV
    ? await import(/* @vite-ignore */ `/virtual:markstage-preview-${props.blockId}`)
    : await import("virtual:markstage-preview-registry").then(
        (r) => r.registry[props.blockId]?.(),
      );
  if (!mod) return;

  if (mod.css) injectPreviewCss(shadow, mod.css, props.blockId);

  reactRoot = createRoot(mountPoint);
  reactRoot.render(createElement(mod.default));
});

onBeforeUnmount(() => {
  cleanupThemeSyncFn?.();
  cleanupThemeSyncFn = null;
  reactRoot?.unmount();
  reactRoot = null;
  cleanupPreviewCss(props.blockId);
});
</script>

<template>
  <div class="markstage-preview vp-raw">
    <div class="markstage-preview-render">
      <div
        ref="containerRef"
        :style="{ minHeight: height ? height + 'px' : undefined }"
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
