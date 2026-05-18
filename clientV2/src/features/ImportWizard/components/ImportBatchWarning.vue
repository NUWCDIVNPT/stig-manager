<script setup>
defineProps({
  fileCount: { type: Number, required: true },
  showContinueHint: { type: Boolean, default: true },
})
</script>

<template>
  <div class="bw-step">
    <div class="bw-header">
      <span class="pi pi-exclamation-circle bw-header__icon" />
      <div class="bw-header__text">
        <p class="bw-header__headline">
          You have selected <span class="bw-header__count">{{ fileCount }}</span> files to process
        </p>
        <p class="bw-header__sub">
          This browser app is not optimized for parsing a large number of files — performance is highly dependent on your available client resources.
        </p>
      </div>
    </div>

    <p class="bw-section-label">
      Recommendations
    </p>
    <div class="bw-cards">
      <div class="bw-card">
        <span class="pi pi-sliders-h bw-card__icon" />
        <div>
          <p class="bw-card__title">
            Process in smaller batches
          </p>
          <p class="bw-card__desc">
            Split your files into groups under 250 to keep the browser responsive and reduce memory pressure.
          </p>
        </div>
      </div>

      <div class="bw-card bw-card--accent">
        <span class="pi pi-desktop bw-card__icon bw-card__icon--accent" />
        <div class="bw-watcher-body">
          <p class="bw-card__title">
            Use STIG Manager Watcher
          </p>
          <p class="bw-card__desc">
            If you have an on-going requirement to process large batches of files you should use STIG Manager Watcher,
            a CLI client that can monitor your file system, process large numbers of test result files asynchronously,
            and post the results to your Collection. Watcher is suitable for use as a service or daemon, as a scheduled
            task, in automated testing pipelines, or from the command line.
          </p>
          <a
            href="https://github.com/NUWCDIVNPT/stigman-watcher"
            target="_blank"
            rel="noopener noreferrer"
            class="bw-watcher-link"
          >
            <span class="pi pi-github" />
            github.com/NUWCDIVNPT/stigman-watcher
          </a>
          <span class="bw-watcher-badge">Available as an NPM module</span>
        </div>
      </div>
    </div>

    <p v-if="showContinueHint" class="bw-continue-hint">
      Click <strong>Continue</strong> to begin parsing.
    </p>
  </div>
</template>

<style scoped>
.bw-step {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.bw-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.1rem 1.25rem;
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-warning-yellow) 7%, transparent) 0%, color-mix(in srgb, var(--color-warning-yellow) 3%, transparent) 100%);
  border: 1px solid color-mix(in srgb, var(--color-warning-yellow) 30%, transparent);
  border-left: 4px solid var(--color-warning-yellow);
  border-radius: 8px;
}
.bw-header__icon {
  font-size: 2.47rem;
  color: var(--color-warning-yellow);
  flex-shrink: 0;
  margin-top: 0.15rem;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--color-warning-yellow) 40%, transparent));
}
.bw-header__text { display: flex; flex-direction: column; gap: 0.4rem; }
.bw-header__headline {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-bright);
  margin: 0;
  line-height: 1.3;
}
.bw-header__count {
  color: var(--color-warning-yellow);
  font-size: 1.69rem;
  font-variant-numeric: tabular-nums;
}
.bw-header__sub {
  margin: 0;
  font-size: 1.17rem;
  color: var(--color-text-dim);
  line-height: 1.5;
}

.bw-section-label {
  margin: 0;
  font-size: 0.91rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-dim);
}

.bw-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bw-card {
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
  padding: 1rem 1.1rem;
  background: color-mix(in srgb, var(--color-background-light) 50%, transparent);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
}
.bw-card--accent {
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-action-blue-dark) 6%, transparent) 0%, color-mix(in srgb, var(--color-action-blue-dark) 2%, transparent) 100%);
  border-color: color-mix(in srgb, var(--color-action-blue-dark) 30%, transparent);
}
.bw-card__icon {
  font-size: 1.56rem;
  color: var(--color-text-dim);
  flex-shrink: 0;
  margin-top: 0.1rem;
}
.bw-card__icon--accent { color: var(--color-action-blue); }
.bw-card__title {
  margin: 0 0 0.35rem;
  font-weight: 600;
  font-size: 1.24rem;
  color: var(--color-text-bright);
}
.bw-card__desc {
  margin: 0;
  font-size: 1.14rem;
  color: var(--color-text-dim);
  line-height: 1.55;
}

.bw-watcher-body { display: flex; flex-direction: column; gap: 0.5rem; }
.bw-watcher-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 1.04rem;
  color: var(--color-action-blue);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s;
}
.bw-watcher-link:hover { color: var(--color-primary-highlight); text-decoration: underline; }
.bw-watcher-badge {
  display: inline-block;
  font-size: 0.91rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-action-blue-dark) 12%, transparent);
  color: var(--color-action-blue);
  font-weight: 600;
  letter-spacing: 0.02em;
  width: fit-content;
}

.bw-continue-hint {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-text-dim);
}
</style>
