Ext.Ajax.timeout = 30000000
Ext.Msg.minWidth = 300
Ext.USE_NATIVE_JSON = true
Ext.Ajax.disableCaching = false

start()

function GetXmlHttpObject() {
	if (window.XMLHttpRequest)
	  {
	  // code for IE7+, Firefox, Chrome, Opera, Safari
	  return new XMLHttpRequest();
	  }
	if (window.ActiveXObject)
	  {
	  // code for IE6, IE5
	   return new ActiveXObject("Microsoft.XMLHTTP");
	  }
	return null;
}

function myContextMenu (e,t,eOpts) {
	// only show the browser context menu in text areas
	if (!Ext.fly(e.getTarget()).hasClass('x-form-textarea')){
		e.preventDefault();
		return false;
	}
}

async function start () {
	const el = Ext.get('loading-text').dom

	try {
		if ('serviceWorker' in navigator) {
			await navigator.serviceWorker.register('js/workers/service-worker.js')
		}
		el.innerHTML += "<br/><br/>Fetching user data"
		try {
			await SM.GetUserObject()
		}
		catch (e) {
			el.innerHTML += `<br/><br/>Error Fetching user data`
			throw(e)
		}
		if (curUser.username !== undefined) {
			loadApp();
		} else {
			el.innerHTML += `<br/>No account for ${window.oidcWorker.token}`
		}
	}
	catch (e) {
		el.innerHTML += `<br/></br/><textarea class="sm-bootstrap-error" wrap="off" rows=24 cols=80 style="font-size: 10px" readonly>${JSON.stringify(STIGMAN.serializeError(e), null, 2)}</textarea>`
	}
}

async function loadApp () {
	try {
		Ext.isReady = true // a bit of a hack, for Firefox
		Ext.BLANK_IMAGE_URL=Ext.isIE6||Ext.isIE7||Ext.isAir? "/ext/resources/images/default/s.gif" : "data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
		Ext.getBody().on("contextmenu", myContextMenu);  
		Ext.QuickTips.init();
		Ext.apply(Ext.QuickTips.getQuickTip(), {
			maxWidth: 200,
			minWidth: 10,
			showDelay: 500,      // Show ms after entering target
			trackMouse: false
		});
		
		// Set the dark mode based on user preferences
		document.querySelector("link[href='css/dark-mode.css']").disabled = !curUser.webPreferences?.darkMode

		Ext.state.Manager.setProvider(new SM.State.LocalStorageProvider())
		Ext.data.DataProxy.on('exception', function(proxy, type, action, e) {
			SM.Error.handleError(new SM.Error.ExtDataProxyError(e))
		})

		const oidcWorkerChannel = new BroadcastChannel('stigman-oidc-worker')
		oidcWorkerChannel.onmessage = broadcastHandler

		STIGMAN.webPreferencesChannel = new BroadcastChannel('stigman-web-preferences')
		STIGMAN.webPreferencesChannel.onmessage = function (event) {
			if (event.data.darkMode !== undefined) {
				SM.Dispatcher.fireEvent('themechanged', event.data.darkMode ? 'dark' : 'light', 'broadcast')
			}
		}

		const opRequests = [
			Ext.Ajax.requestPromise({
				responseType: 'json',
				url: `${STIGMAN.Env.apiBase}/op/configuration`,
				method: 'GET'
			}),
			Ext.Ajax.requestPromise({
				responseType: 'json',
				url: `${STIGMAN.Env.apiBase}/op/definition`,
				method: 'GET'
			})
		]
		const opResponses = await Promise.all(opRequests)
	
		STIGMAN.apiConfig = opResponses[0]
		STIGMAN.apiDefinition = opResponses[1]
		
		const mainNavTree = new SM.NavTree.TreePanel({
			id: 'app-nav-tree',
			cls: 'sm-round-panel',
			margins: {top:10, right:5, bottom:10, left:10},
			border: false,
			region: 'west'
		})
		SM.Global.mainNavTree = mainNavTree
		const mainTabPanel = new SM.MainTabPanel({
			id: 'main-tab-panel',
			region: 'center',
			margins: {top:5, right:10, bottom:10, left:5},
			border: false
		})

		// Register a quick tip for the version element
		Ext.QuickTips.register({
			target: 'sm-home-version-sprite',
			title: 'Commit info',
			text: `branch: ${STIGMAN.Env.commit.branch}&lt;br/&gt;sha: ${STIGMAN.Env.commit.sha}&lt;br/&gt;describe: ${STIGMAN.Env.commit.describe}`,
			width: 200,
			dismissDelay: 0 // Show while cursor is over element
		})

		const appTitleHtml = `<div class='sm-home-title'>
		STIG Manager<span id='sm-home-oss-sprite'>OSS</span><span id='sm-home-version-sprite'>${STIGMAN.Env.version}</span></div>`
		const homeTab = new SM.HomeTab({
			border: false,
			region: 'center',
			layout: 'vbox',
			layoutConfig: {
				align: 'stretch',
			},
			items: [
				{
					html: appTitleHtml,
					height: 80,
					border: false
				},
				{
					layout: 'sm-flexbox',
					flex: 1,
					border: false,
					items: [
						{
							xtype: 'sm-home-widget-welcome'
						},
						{
							xtype: 'sm-home-widget-doc'
						},
						{
							xtype: 'sm-home-widget-resources'
						},
						...(STIGMAN.Env.displayAppManagers ? [{ xtype: 'sm-home-widget-app-managers' }] : [])
					]
				}
			]
		})

		// mainTabPanel.add(homeTab)
		mainTabPanel.add({
			layout: 'border',
			border: false,
			title: 'Home',
			iconCls: 'sm-stig-icon',
			items: [
				{
					region: 'center',
					cls: 'sm-round-panel',
					border: false,
					margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
					layout: 'fit',
					// html: 'Hi there'
					items: homeTab
				}
			]
		})

		let viewportConfig = {
			id: 'app-viewport',
			layout: 'border',
			items: [],
		}
	
		let classification = new Classification(STIGMAN.apiConfig?.classification)
		let contentPanel
		if (classification.showBanner) {
			contentPanel = new Ext.Panel({
				region: 'center',
				layout: 'border',
				border: false,
				items: [mainNavTree, mainTabPanel]
			})
			let bannerTpl = new Ext.XTemplate(
				`<div class=sm-banner-{classificationCls}>`,
				`<div class='sm-banner-body-text'>{classificationText}</div>`
			) 
			let classificationBanner = new Ext.Panel({
				region: 'north',
				height: 20,
				border: false,
				tpl: bannerTpl,
				data: {
					classificationCls: classification.classificationCls,
					classificationText: classification.classificationText,
				}
			})
	
			viewportConfig.items.push( classificationBanner, contentPanel)
		}
		else {
			viewportConfig.items.push( mainNavTree, mainTabPanel )
		}
		
		new Ext.Viewport(viewportConfig)
		if (contentPanel) SM.contentEl = contentPanel.getEl()

		SM.WhatsNew.autoShow()
	
		Ext.get('loading').remove();
		Ext.get('loading-mask').fadeOut({duration: 0.5, remove:true});
		// Register a quick tip for the version element
		Ext.QuickTips.register({
			target: 'sm-home-version-sprite',
			title: 'Commit info',
			text: `branch: ${STIGMAN.Env.commit.branch}<br/>sha: ${STIGMAN.Env.commit.sha}<br/>describe: ${STIGMAN.Env.commit.describe}`,
			width: 200,
			dismissDelay: 60000 // Show while cursor is over element
		})

		window.addEventListener('keydown', function (e) {
			// prevent ctrl-a from being handled by the browser
			if (e.key === 'a' && e.ctrlKey) {
				if (e.target.tagName !== 'TEXTAREA') {
					e.preventDefault()
				}
			}
		})

		window.addEventListener('error', function (e) {
			SM.Error.handleError(e)
		})

		SM.Dispatcher.addListener('themechanged', onThemeChanged)
		async function onThemeChanged (theme, source) {
			curUser.webPreferences.darkMode = theme === 'dark'
			document.querySelector("link[href='css/dark-mode.css']").disabled = theme !== 'dark'
			if (source === 'local') {
				STIGMAN.webPreferencesChannel.postMessage({ darkMode: theme === 'dark' })
				try {
					await Ext.Ajax.requestPromise({
						responseType: 'json',
						url: `${STIGMAN.Env.apiBase}/user/web-preferences`,
						method: 'PATCH',
						jsonData: {darkMode: theme === 'dark'}
					})
				} catch (error) {
						SM.Error.handleError(error)
				}
			}
		}	

		const isAdmin = curUser.privileges.admin
		SM.ActivityHandler.reportActivity = (STIGMAN.Env.oauth.idleTimeoutUser && !isAdmin) || (STIGMAN.Env.oauth.idleTimeoutAdmin && isAdmin)
		SM.ActivityHandler.add()

	}
	catch (e) {
		Ext.get( 'indicator' ).dom.innerHTML = e.message
	}

} //end loadApp()

let reauthAlert, reauthWindow, reauthPopup, reauthTab
function broadcastHandler (event)  {
	console.log('[stigman] Received from worker:', event.type, event.data)
	if (event.data.type === 'noToken') {
		SM.ActivityHandler.remove()
		reauthenticate(event.data)
	}
	else if (event.data.type === 'accessToken') {
		SM.ActivityHandler.add()
		reauthAlert?.close()

		reauthWindow?.close()
		reauthWindow = null

		reauthTab?.close()
		reauthTab = null

		reauthPopup?.close()
		reauthPopup = null
	}
}

function reauthenticate({ codeVerifier, redirect, state, isIdle }) {
	reauthAlert?.close()
	reauthAlert = null
	reauthWindow?.close()
	reauthWindow = null
	reauthTab?.close()
	reauthTab = null
	reauthPopup?.close()
	reauthPopup = null

	const reauthText = STIGMAN.Env.oauth.reauthAction === 'reload' ? 'reload the app' : 'sign in again'
	const reauthBtnText = STIGMAN.Env.oauth.reauthAction === 'reload' ? 'Reload' : 'Sign In'
	const reauthBtnIcon = STIGMAN.Env.oauth.reauthAction === 'reload' ? 'icon-refresh' : 'sm-login-icon'
	
	const reauthButton = new Ext.Button({
		text: reauthBtnText,
		iconCls: reauthBtnIcon,
		handler: reauthHandler,
	})

	function reauthHandler () {
		const width = 600
		const height = 740
		const left = window.screenX + (window.outerWidth - width) / 2
		const top = window.screenY + (window.outerHeight - height) / 2
		
		
		const action = STIGMAN.Env.oauth.reauthAction || 'popup'
		if (action !== 'reload') {
			localStorage.setItem('reauth-codeVerifier', codeVerifier)
			localStorage.setItem('reauth-oidcState', state)
		}
		if (action === 'popup') {
			if (!reauthPopup || reauthPopup.closed || reauthPopup.closed === undefined) {
				reauthPopup = window.open(
					redirect,
					'_blank',
					`popup=yes,width=${width},height=${height},left=${left},top=${top}`
					)
				}	
			else {
				reauthPopup.focus()
			}
		}
		else if (action === 'iframe') {
			if (!reauthWindow) {
				reauthWindow = new Ext.Window({
					header: false,
					layout: 'fit',
					title: 'STIG Manager Sign In',
					width,
					height,
					modal: false,
					closeAction: 'hide',
					html: `<iframe src="${redirect}" width="100%" height="100%" frameborder="0"></iframe>`,
				})
			}
			reauthWindow.show()
		}
		else if (action === 'tab') {
			if (!reauthTab || reauthTab.closed || reauthTab.closed === undefined) {
				reauthTab = window.open(
					redirect,
					'_blank'
				)
			}	
			else {
				reauthTab.focus()
			}
		}
		else if (action === 'reload') {
			window.location.reload()
		}	
	}

	reauthAlert = new Ext.Window({
		title: `<div class="sm-alert-icon" style="padding-left:20px">${isIdle ? 'Session Timeout' : 'Credentials Expired'}</div>`,
		width: 400,
		height: 110,
		modal: true,
		html: `<div style="padding: 10px">Your ${isIdle ? 'session has timed out' : 'credentials have expired'} and we need you to ${reauthText}.</div>`,
		closable: false,
		buttons: [reauthButton]
	})
	reauthAlert.show()
}
