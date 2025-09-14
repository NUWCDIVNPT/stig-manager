if (STIGMAN.Env.stateEvents && window.stateWorker?.workerChannel) {
  Ext.ns('SM.ApiState');

  SM.ApiState.AlertModal = Ext.extend(Ext.Window, {
    initComponent: function () {
      const title = `<div class="sm-alert-icon" style="padding-left:20px">Service Alert</div>`;
      const config = {
        title,
        width: 400,
        closable: false, 
        modal: true,
      };
      Ext.apply(this, Ext.apply(this.initialConfig, config));
      this.superclass().initComponent.call(this);
    }
  });

  // Utility to ensure only one alert is visible at a time
  // If called with no arguments, closes any existing alert
  SM.ApiState.showModal = function (modal = null) {
    if (this.alertModal) {
      this.alertModal.close();
      this.alertModal = null;
    }
    if (modal) {
      this.alertModal = modal;
      modal.show();
    }
  };

  // Handler for unavailable state
  SM.ApiState.handleUnavailableState = function (state) {
    const online = '<span class="sm-label-sprite" style="color:#ddd; background-color:green; margin-right: 10px;">Online</span>';
    const offline = '<span class="sm-label-sprite" style="color:#ddd; background-color:#940000; margin-right: 10px;">Offline</span>';
    const html = `<div style="padding: 10px">
    <p><b>The API is currently unavailable</b></p>
    <br>
    <p>Database: ${state?.dependencies?.db ? online : offline} Authentication: ${state?.dependencies?.oidc ? online : offline}</p>
    </div>`;
    const modal = new SM.ApiState.AlertModal({ html, closable: false, modal: true, cls: 'sm-round-panel sm-unavailable-modal' });
    SM.ApiState.showModal(modal);
  };

  // Handler for state error
  SM.ApiState.handleStateError = function () {
    if (!this.alertModal?.offlineAlert) {
      const html = `<div style="padding: 10px">
      <p><b>The API is offline. Waiting for restoration...</b></p>
      </div>`;
      const modal = new SM.ApiState.AlertModal({ offlineAlert: true, html, cls: 'sm-round-panel sm-offline-modal' });
      SM.ApiState.showModal(modal);
    }
  };

  // Main message handler
  SM.ApiState.handleBroadcastMessage = function (event) {
    console.log('[State Broadcast] Received message:', event.data);
    const state = SM.safeJSONParse(event.data.data);
    const type = event.data.type;

    if (type === 'state-changed') {
      if (state?.currentState !== 'available') {
        this.handleUnavailableState(state);
      } else {
        this.showModal(); // Close any existing alert
      }
    }
    else if (type === 'state-error') {
      this.handleStateError();
    }
    else if (type === 'state-report' && state?.currentState === 'available') {
      this.showModal(); // Close any existing alert 
    }
  };

  window.stateWorker.workerChannel.onmessage = SM.ApiState.handleBroadcastMessage.bind(SM.ApiState);
}





