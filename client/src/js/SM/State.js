Ext.namespace('SM.State')

SM.State.LocalStorageProvider = Ext.extend(Ext.state.Provider, {
  constructor : function(config){
    SM.State.LocalStorageProvider.superclass.constructor.call(this)
    Ext.apply(this, config)
    this.state = this.readLocalStorage()
  },
  set : function(name, value){
    if(typeof value == "undefined" || value === null) {
      this.clear(name)
      return
    }
    localStorage.setItem(`state:${name}`, JSON.stringify(value))
    SM.State.LocalStorageProvider.superclass.set.call(this, name, value);
  },
  clear : function(name){
    localStorage.removeItem(`state:${name}`)
    SM.State.LocalStorageProvider.superclass.clear.call(this, name)
  },
  readLocalStorage : function(){
    const state = {}
    for (const key of Object.keys(localStorage)) {
      if (key.substring(0,6) === 'state:') {
        state[key.substring(6)] = JSON.parse(localStorage.getItem(key))
      }
    }
    return state
  }
})