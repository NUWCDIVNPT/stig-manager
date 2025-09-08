Ext.ns('SM.ApiState')

SM.ApiState = {
  isMaintenance: false,
  stateWorkerChannel: null,
  stateWorker: null
}

SM.ApiState.setupStateWorker = async function () {
  this.stateWorker = window.stateWorker.worker
  this.stateWorkerChannel = window.stateWorker.workerChannel
  this.stateWorkerChannel.onmessage = this.handleBroadcastMessage.bind(this)
  return { worker: this.stateWorker, channel: this.stateWorkerChannel }
}

SM.ApiState.sendWorkerRequest = function (request) {
  const requestId = crypto.randomUUID()
  const port = this.stateWorker.port
  port.postMessage({ ...request, requestId })
  return new Promise((resolve) => {
    function handler(event) {
      if (event.data.requestId === requestId) {
        port.removeEventListener('message', handler)
        resolve(event.data.response)
      }
    }
    port.addEventListener('message', handler)
  })
}

SM.ApiState.AlertWindow = Ext.extend(Ext.Window, {
  initComponent: function () {
    const title = `<div class="sm-alert-icon" style="padding-left:20px">API Alert</div>`;
    const config = {
      title,
      width: 400
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

// Utility to ensure only one alert is visible at a time
SM.ApiState.showAlert = function({ modal = null, toast = null }) {
  if (this.alertModal) {
    this.alertModal.close();
    this.alertModal = null;
  }
  if (this.alertToast) {
    this.alertToast.close();
    this.alertToast = null;
  }
  if (modal) {
    this.alertModal = modal;
    modal.show();
  }
  if (toast) {
    this.alertToast = toast;
    toast.show();
  }
};

// Handler for maintenance mode
SM.ApiState.handleMaintenanceMode = function(state) {
  const html = `<div style="padding: 10px">
    <p><b>The API is currently undergoing maintenance</b></p>
    <p>Message: ${state?.mode?.message}</p>
    ${curUser.privileges.admin ? `<p><a href="${state?.endpoints?.ui}" target="_blank">Open Maintenance App</a></p>` : ''}
    </div>`;
  const buttons = [];
  if (curUser.privileges.admin) {
    buttons.push(new Ext.Button({
      text: 'Change to Normal Mode',
      handler: async () => {
        await SM.ApiState.sendWorkerRequest({ request: 'setApiMode', mode: 'normal', token: window.oidcWorker.token });
      }
    }));
  }
  const modal = new SM.ApiState.AlertWindow({ html, buttons, closable: false, modal: true });
  SM.ApiState.showAlert({ modal });
};

// Handler for unavailable state
SM.ApiState.handleUnavailableState = function(state) {
  const online = '<span style="color:green">ONLINE</span>'
  const offline = '<span style="color:#ff5757">OFFLINE</span>'
  const html = `<div style="padding: 10px">
    <p><b>The API is currently unavailable</b></p>
    <p>Database: ${state?.dependencies?.db ? online : offline}</p>
    <p>Authentication: ${state?.dependencies?.oidc ? online : offline }</p>
    </div>`;
  const modal = new SM.ApiState.AlertWindow({ html, closable: false, modal: true });
  SM.ApiState.showAlert({ modal });
};

// Handler for state error
SM.ApiState.handleStateError = function() {
  if (!this.alertModal?.offlineAlert) {
    const html = `<div style="padding: 10px">
      <p><b>The API is offline. Waiting for it to come back online...</b></p>
      </div>`;
    const modal = new SM.ApiState.AlertWindow({ offlineAlert: true, html, closable: false, modal: true, cls: 'sm-round-panel sm-offline-modal' });
    SM.ApiState.showAlert({ modal });
  }
};

// Handler for mode change scheduled
SM.ApiState.handleModeChangeScheduled = function(state) {
  const html = `<div style="padding: 10px">
    <p><b>A mode change has been scheduled</b></p>
    <p>New mode: ${state?.mode?.scheduled?.nextMode}</p>
    <p>Scheduled for: ${state?.mode?.scheduled?.scheduledFor}</p>
    <p>Message: ${state?.mode?.scheduled?.scheduledMessage}</p>
    </div>`;
  const buttons = [];
  if (curUser.privileges.admin) {
    buttons.push(new Ext.Button({
      text: 'Cancel scheduled change',
      handler: async () => {
        await SM.ApiState.sendWorkerRequest({ request: 'cancelScheduledApiMode', token: window.oidcWorker.token });
      }
    }));
  }
  const toast = new SM.ApiState.AlertWindow({
    html,
    closable: false,
    cls: 'sm-round-panel sm-maintenance-toast',
    modal: false,
    y: 5,
    buttons,
    listeners: {
      show: function (win) {
        win.getEl().slideIn('t', { easing: 'easeOut', duration: 0.5 });
      },
      beforeclose: function (win) {
        win.getEl().slideOut('t', { easing: 'easeIn', duration: 0.5, callback: () => win.destroy() });
        return false; // Prevent immediate close
      }
    }
  });
  SM.ApiState.showAlert({ toast });
};

// Handler for mode change unscheduled
SM.ApiState.handleModeChangeUnscheduled = function() {
  this.alertToast?.close();
  this.alertToast = null;
};

// Main message handler
SM.ApiState.handleBroadcastMessage = function (event) {
  console.log('[State Broadcast] Received message:', event.data);
  this.state = SM.safeJSONParse(event.data.data);
  const type = event.data.type;

  if (type === 'mode-changed') {
    if (this.state?.mode?.currentMode === 'maintenance') {
      this.handleMaintenanceMode(this.state);
    } else {
      this.showAlert({}); // Close any open alerts
    }
  }
  else if (type === 'state-changed') {
    if (this.state?.currentState !== 'available') {
      this.handleUnavailableState(this.state);
    } else {
      this.showAlert({});
    }
  }
  else if (type === 'state-error') {
    this.handleStateError();
  }
  else if (type === 'state-report' 
    && this.state?.mode.currentMode === 'normal' 
    && this.state?.currentState === 'available'
    && !this.state?.mode.scheduled) {
    this.showAlert({});
  }
  else if (type === 'mode-change-scheduled') {
    this.handleModeChangeScheduled(this.state);
  }
  else if (type === 'mode-change-unscheduled') {
    this.handleModeChangeUnscheduled();
  }
};

SM.ApiState.showModeDialog = function ({ treePath }) {
  const _this = this
  const nextMessage = new Ext.form.TextArea({
    fieldLabel: 'Mode Message',
    anchor: '100%',
    value: 'The current mode is maintenance.'
  })
  const scheduledMessage = new Ext.form.TextArea({
    fieldLabel: 'Scheduled Message',
    anchor: '100%',
    value: 'The scheduled message for maintenance mode.'
  })
  const scheduleIn = new Ext.form.NumberField({
    fieldLabel: 'Schedule In (seconds)',
    anchor: '100%',
    value: 20
  })

  const dialog = new Ext.Window({
    title: 'Schedule Maintenance Mode',
    width: 400,
    layout: 'form',
    padding: 20,
    modal: true,
    items: [
      scheduleIn,
      scheduledMessage,
      nextMessage
    ],
    buttons: [
      {
        text: 'Cancel',
        handler: function () {
          dialog.close()
        }
      },
      {
        text: 'Schedule Maintenance Mode',
        handler: async function () {
          try {
            if (scheduleIn.getValue() > 0) {
              await _this.sendWorkerRequest({
                request: 'scheduleApiMode',
                nextMode: 'maintenance',
                nextMessage: nextMessage.getValue(),
                scheduledMessage: scheduledMessage.getValue(),
                scheduleIn: scheduleIn.getValue(),
                token: window.oidcWorker.token
              })
            } else {
              await _this.sendWorkerRequest({
                request: 'setApiMode',
                mode: 'maintenance',
                message: nextMessage.getValue(),
                token: window.oidcWorker.token
              })
            }
          }
          catch (error) {
            Ext.Msg.alert('Error', `Failed to set maintenance mode. Please try again. ${error}`)
          }
          finally {
            dialog.close()
          }
        }
      },
    ]
  })
  dialog.show()
}


