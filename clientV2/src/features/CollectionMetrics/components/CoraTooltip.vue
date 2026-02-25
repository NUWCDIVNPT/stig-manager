<template>
  <div class="cora-tooltip-content">
    <p>
      <b>Cyber Operational Readiness Assessment (CORA)</b> evaluates the effectiveness of security controls and operational processes.
    </p>

    <p>
      <b>Risk Rating</b> is calculated from a <b>Weighted Average</b> that reflects the number and severity of <i>open</i> or <i>unassessed</i> rules.<br>
      Reviews with <i>Open</i>, <i>Not a Finding</i>, or <i>Not Applicable</i> results are considered <i>assessed</i>.<br>
      Reviews with other results (such as <i>Not Reviewed</i> or <i>Informational</i>) are treated as <i>unassessed</i>.
    </p>

    <p>
      Each severity category (CAT I, II, III) is weighted differently when calculating the overall score:<br>
      <b>Weighted Average</b> formula:<br>
      <code class="formula">(p₁·w₁ + p₂·w₂ + p₃·w₃) / (w₁ + w₂ + w₃)</code><br>
      where:<br>
      - <code>pₙ</code> = % of open + unassessed rules in that category<br>
      - <code>wₙ</code> = weight <b>(CAT I = 10, CAT II = 4, CAT III = 1)</b>
    </p>

    <p>
      The <b>Risk Rating</b> is primarily determined by the <b>Weighted Average</b>, except for the special "Low" risk condition:
    </p>

    <ul class="risk-list">
      <li><span class="tooltip-label sm-cora-risk-very-high"><b>Very High</b></span><b> ≥ 20%</b></li>
      <li><span class="tooltip-label sm-cora-risk-high"><b>High</b></span><b> ≥ 10% and &lt; 20%</b></li>
      <li><span class="tooltip-label sm-cora-risk-moderate"><b>Moderate</b></span><b> &gt; 0% and &lt; 10%</b></li>
      <li><span class="tooltip-label sm-cora-risk-low"><b>Low</b></span><b> CAT I = 0; CAT II &amp; III each &lt; 5% <i>unweighted</i></b></li>
      <li><span class="tooltip-label sm-cora-risk-very-low"><b>Very Low</b></span><b> 0% total</b></li>
    </ul>
  </div>
</template>

<style scoped>
.cora-tooltip-content {
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--color-text-primary);
  max-width: 450px;
}

p {
  margin-bottom: 0.75rem;
}

ul.risk-list {
  padding-left: 16px;
  margin: 4px 0;
  list-style-type: disc;
}

code {
  background-color: var(--color-background-subtle);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}

.formula {
  display: inline-block;
  margin: 2px 0;
}

.tooltip-label {
  padding: 1px 6px;
  border-radius: 4px;
  color: var(--color-text-bright);
  margin-right: 4px;
  font-size: 0.9em;
  display: inline-block;
  line-height: normal;
}
</style>
