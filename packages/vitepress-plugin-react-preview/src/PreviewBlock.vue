<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";

const props = defineProps<{
  code: string;
  blockId: string;
  highlighted?: string;
  height?: string;
  wrap?: string;
  align?: string;
  standalone?: string;
}>();

const THUMBNAIL_VIEWPORT_WIDTH = 1280;
const THUMBNAIL_VIEWPORT_HEIGHT = 720;
const THUMBNAIL_SCALE = 0.2;

const isStandalone = computed(() => props.standalone === "true");
const popoverId = computed(() => `mrp-popover-${props.blockId}`);
const expandPopoverId = computed(() => `mrp-expand-${props.blockId}`);
const showCode = ref(true);
const iframeRef = ref<HTMLIFrameElement | null>(null);
const standaloneIframeRef = ref<HTMLIFrameElement | null>(null);
const thumbnailIframeRef = ref<HTMLIFrameElement | null>(null);
const expandIframeRef = ref<HTMLIFrameElement | null>(null);
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

const currentTheme = ref(
  typeof document !== "undefined" && document.documentElement.classList.contains("dark")
    ? "dark"
    : "light"
);

const previewUrl = computed(() => {
  const params = new URLSearchParams({ theme: currentTheme.value });
  if (props.wrap) params.set("wrap", props.wrap);
  if (props.align) params.set("align", props.align);
  return `/__preview/${props.blockId}?${params}`;
});

let themeObserver: MutationObserver | null = null;

function syncThemeToIframe() {
  for (const iframe of [iframeRef.value, standaloneIframeRef.value, thumbnailIframeRef.value, expandIframeRef.value]) {
    if (iframe?.contentWindow) {
      // Security: specify origin instead of "*" to restrict postMessage recipients
      iframe.contentWindow.postMessage(
        { type: "mrp-theme", theme: currentTheme.value },
        window.location.origin
      );
    }
  }
}

function onPopoverToggle(e: Event) {
  const toggleEvent = e as ToggleEvent;
  if (toggleEvent.newState === "open") {
    nextTick(() => syncThemeToIframe());
  }
}

function onMessage(e: MessageEvent) {
  // Security: validate postMessage origin to prevent cross-origin message spoofing
  if (e.origin !== window.location.origin) return;
  if (
    e.data?.type === "mrp-resize" &&
    e.data?.blockId === props.blockId
  ) {
    // Ignore resize messages from the expand popover iframe
    if (e.source === expandIframeRef.value?.contentWindow) return;
    iframeHeight.value = e.data.height;
  }
}

onMounted(() => {
  window.addEventListener("message", onMessage);

  themeObserver = new MutationObserver(() => {
    const isDark = document.documentElement.classList.contains("dark");
    const newTheme = isDark ? "dark" : "light";
    if (currentTheme.value !== newTheme) {
      currentTheme.value = newTheme;
      syncThemeToIframe();
    }
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("message", onMessage);
  themeObserver?.disconnect();
});
</script>

<template>
  <div class="mrp-preview vp-raw">
    <template v-if="isStandalone">
      <button
        type="button"
        :popovertarget="popoverId"
        class="mrp-preview-standalone-link"
      >
        <div
          class="mrp-preview-thumbnail"
          :style="{
            width: THUMBNAIL_VIEWPORT_WIDTH * THUMBNAIL_SCALE + 'px',
            height: THUMBNAIL_VIEWPORT_HEIGHT * THUMBNAIL_SCALE + 'px',
          }"
        >
          <iframe
            ref="thumbnailIframeRef"
            :src="previewUrl"
            tabindex="-1"
            aria-hidden="true"
            class="mrp-preview-thumbnail-iframe"
            :style="{
              width: THUMBNAIL_VIEWPORT_WIDTH + 'px',
              height: THUMBNAIL_VIEWPORT_HEIGHT + 'px',
              transform: `scale(${THUMBNAIL_SCALE})`,
            }"
          />
        </div>
        <span class="mrp-preview-standalone-text">
          <span class="mrp-preview-standalone-title">Open full-page preview</span>
          <span class="mrp-preview-standalone-desc">This component requires a full viewport to render correctly.</span>
        </span>
      </button>
      <div
        :id="popoverId"
        popover="auto"
        class="mrp-preview-popover"
        @toggle="onPopoverToggle"
      >
        <div class="mrp-preview-popover-header">
          <span class="mrp-preview-popover-title">Preview</span>
          <button
            type="button"
            :popovertarget="popoverId"
            popovertargetaction="hide"
            class="mrp-preview-popover-close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4l8 8" />
              <path d="M12 4l-8 8" />
            </svg>
          </button>
        </div>
        <iframe
          ref="standaloneIframeRef"
          :src="previewUrl"
          class="mrp-preview-popover-iframe"
        />
      </div>
    </template>
    <template v-else>
      <div class="mrp-preview-render">
        <!--
          Security note: no sandbox attribute is set on this iframe.
          Preview blocks are authored by trusted developers (markdown authors),
          and adding sandbox="allow-scripts" alone would break ES module loading
          (CORS) and postMessage origin checks. Adding both allow-scripts and
          allow-same-origin together provides no real security benefit for
          same-origin iframes.
        -->
        <iframe
          ref="iframeRef"
          :src="previewUrl"
          :style="{ height: iframeHeight + 'px' }"
          class="mrp-preview-iframe"
        />
      </div>
      <div class="mrp-preview-actions">
        <button
          type="button"
          :popovertarget="expandPopoverId"
          class="mrp-preview-fullscreen-link"
        >
          Expand preview
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 10v3h3" />
            <path d="M13 6V3h-3" />
            <path d="M3 13l4-4" />
            <path d="M13 3l-4 4" />
          </svg>
        </button>
      </div>
      <div
        :id="expandPopoverId"
        popover="auto"
        class="mrp-preview-popover"
        @toggle="onPopoverToggle"
      >
        <div class="mrp-preview-popover-header">
          <span class="mrp-preview-popover-title">Preview</span>
          <button
            type="button"
            :popovertarget="expandPopoverId"
            popovertargetaction="hide"
            class="mrp-preview-popover-close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4l8 8" />
              <path d="M12 4l-8 8" />
            </svg>
          </button>
        </div>
        <iframe
          ref="expandIframeRef"
          :src="previewUrl"
          class="mrp-preview-popover-iframe"
        />
      </div>
    </template>
    <div class="mrp-preview-code">
      <button
        class="mrp-preview-toggle"
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
          :class="{ 'mrp-chevron-open': showCode }"
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
.mrp-preview {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  margin: 16px 0;
}

.mrp-preview-render {
  background-color: var(--vp-c-bg);
}

.mrp-preview-iframe {
  display: block;
  width: 100%;
  border: none;
  transition: height 0.15s ease;
}

.mrp-preview-code {
  border-top: 1px solid var(--vp-c-divider);
}

.mrp-preview-toggle {
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

.mrp-preview-toggle:hover {
  color: var(--vp-c-text-1);
}

.mrp-chevron-open {
  transform: rotate(90deg);
}

.mrp-preview-actions {
  display: flex;
  justify-content: flex-end;
  padding: 6px 12px;
  border-top: 1px solid var(--vp-c-divider);
}

.mrp-preview-fullscreen-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  padding: 0;
}

.mrp-preview-fullscreen-link:hover {
  color: var(--vp-c-text-1);
}

.mrp-preview-code svg {
  transition: transform 0.15s;
}

.mrp-preview-code pre {
  margin: 0 !important;
  border-radius: 0 !important;
}

.mrp-preview-code :deep(pre) {
  margin: 0 !important;
  border-radius: 0 !important;
  padding: 16px !important;
}

.mrp-preview-code :deep(pre code) {
  font-size: 13px !important;
  line-height: 1.6 !important;
}

.mrp-preview-thumbnail {
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  flex-shrink: 0;
  position: relative;
}

.mrp-preview-thumbnail-iframe {
  display: block;
  border: none;
  transform-origin: top left;
  pointer-events: none;
}

.mrp-preview-standalone-link {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 16px;
  text-decoration: none;
  color: var(--vp-c-text-2);
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: background-color 0.15s;
}

.mrp-preview-standalone-link:hover {
  background-color: var(--vp-c-bg-soft);
}

.mrp-preview-standalone-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}

.mrp-preview-standalone-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.mrp-preview-standalone-desc {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.mrp-preview-popover {
  position: fixed;
  inset: 0;
  width: 90vw;
  height: 90vh;
  margin: auto;
  padding: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.mrp-preview-popover::backdrop {
  background: rgba(0, 0, 0, 0.5);
}

.mrp-preview-popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.mrp-preview-popover-title {
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.mrp-preview-popover-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.mrp-preview-popover-close:hover {
  color: var(--vp-c-text-1);
}

.mrp-preview-popover-iframe {
  display: block;
  width: 100%;
  height: calc(100% - 45px);
  border: none;
}
</style>
