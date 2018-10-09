/* global Ext, futureLang */
Ext.define('Ura.store.Centroatencion', {
    extend: 'Ext.data.Store',
    model: 'Ura.model.Centroatencion',
    autoLoad: true, autoSync: false, filterOnLoad: false,
    groupField: 'padre',
    proxy: {
        type: 'ajax',
        actionMethods: {read: 'POST'},
        extraParams: {restful: true},
        api: {read: 'loaddatacentroatencion'},
        reader: {type: 'json', root: 'data', totalProperty: 'total', successProperty: 'success'},
    },
    listeners: {
        'load': function(store, records, successful, eOpts) {
            hideMask();
        }
    }
});