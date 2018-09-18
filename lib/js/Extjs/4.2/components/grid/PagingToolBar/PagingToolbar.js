/* global Ext */
Ext.ns('Ext.Feet');
Ext.define('Ext.Feet.PagingToolbar', {
    extend: 'Ext.toolbar.Toolbar', alias: 'widget.feetpagingtoolbar', 
    alternateClassName: 'Ext.PagingToolbar',
    requires: ['Ext.toolbar.TextItem', 'Ext.form.field.Number'],
    mixins: {
        bindable: 'Ext.util.Bindable'
    },
    displayInfo: false,
    prependButtons: false,
    displayMsg: 'Displaying {0} - {1} of {2}',
    emptyMsg: 'No data to display',
    beforePageText: 'Page',
    afterPageText: 'of {0}',
    firstText: 'First Page',
    prevText: 'Previous Page',
    nextText: 'Next Page',
    lastText: 'Last Page',
    refreshText: 'Refresh',
    inputItemWidth: 30,
    initComponent: function () {
        var me = this,
                pagingItems = me.getPagingItems(),
                userItems = me.items || me.buttons || [];

        if (me.prependButtons) {
            me.items = userItems.concat(pagingItems);
        } else {
            me.items = pagingItems.concat(userItems);
        }
        delete me.buttons;

        if (me.displayInfo) {
            me.items.push('->');
            me.items.push({xtype: 'tbtext', itemId: 'displayItem'});
        }

        me.callParent(arguments);

        me.addEvents(
                /**
                 * @event change
                 * Fires after the active page has been changed.
                 * @param {Ext.toolbar.Paging} this
                 * @param {Object} pageData An object that has these properties:
                 *
                 * - `total` : Number
                 *
                 *   The total number of records in the dataset as returned by the server
                 *
                 * - `currentPage` : Number
                 *
                 *   The current page number
                 *
                 * - `pageCount` : Number
                 *
                 *   The total number of pages (calculated from the total number of records in the dataset as returned by the
                 *   server and the current {@link Ext.data.Store#pageSize pageSize})
                 *
                 * - `toRecord` : Number
                 *
                 *   The starting record index for the current page
                 *
                 * - `fromRecord` : Number
                 *
                 *   The ending record index for the current page
                 */
                'change',
                /**
                 * @event beforechange
                 * Fires just before the active page is changed. Return false to prevent the active page from being changed.
                 * @param {Ext.toolbar.Paging} this
                 * @param {Number} page The page number that will be loaded on change
                 */
                'beforechange'
                );
        me.on('beforerender', me.onLoad, me, {single: true});

        me.bindStore(me.store || 'ext-empty-store', true);
    },
    getPagingItems: function () {
        var me = this;
        me.stPagingBottomBar = Ext.create('Ext.data.Store', {
            storeId: 'stPagingBottomBar',
            fields: ['page'],
            data: [{"page": "5"}, {"page": "10"}, {"page": "15"}, {"page": "20"}, {"page": "30"}, {"page": "40"}, {"page": "50"}, {"page": "60"}, {"page": "70"}, {"page": "80"}, {"page": "90"}, {"page": "100"}, {"page": "250"}, {"page": "500"}, {"page": "1000"}]
        });
        var stBbar = Ext.data.StoreManager.lookup(me.store);
        var pSize = (stBbar == undefined) ? 20 : stBbar.pageSize;
        var initLimit = Math.min(me.stPagingBottomBar.currentPage * pSize, pSize + 1);
        me.cbPageSize = Ext.create('Ext.form.ComboBox', {
            value: initLimit || 20,
            store: me.stPagingBottomBar,
            queryMode: 'local',
            displayField: 'page',
            valueField: 'page',
            triggerAction: 'all',
            editable: false,
            width: 55,
            listeners: {
                scope: this,
                select: function (cb) {
                    var pageData = me.getPageData();
                    pageData.toRecord = cb.getValue();
                    me.store.pageSize = cb.getValue();
                    me.store.currentPage = 1;
                    if (me.fireEvent('beforechange', me, 1) !== false) {
                        me.store.loadPage(1, {start: 0, limit: pageData.toRecord});
                    }

                }
            }
        });

        return [{
                itemId: 'first',
                tooltip: me.firstText,
                overflowText: me.firstText,
                iconCls: Ext.baseCSSPrefix + 'tbar-page-first',
                disabled: true,
                handler: me.moveFirst,
                scope: me
            }, {
                itemId: 'prev',
                tooltip: me.prevText,
                overflowText: me.prevText,
                iconCls: Ext.baseCSSPrefix + 'tbar-page-prev',
                disabled: true,
                handler: me.movePrevious,
                scope: me
            }, '-', me.beforePageText, {
                xtype: 'numberfield',
                itemId: 'inputItem',
                name: 'inputItem',
                cls: Ext.baseCSSPrefix + 'tbar-page-number',
                allowDecimals: false,
                minValue: 1,
                hideTrigger: true,
                enableKeyEvents: true,
                keyNavEnabled: false,
                selectOnFocus: true,
                submitValue: false,
                // mark it as not a field so the form will not catch it when getting fields
                isFormField: false,
                width: me.inputItemWidth,
                margins: '-1 2 3 2',
                listeners: {
                    scope: me,
                    keydown: me.onPagingKeyDown,
                    blur: me.onPagingBlur
                }
            }, {
                xtype: 'tbtext',
                itemId: 'afterTextItem',
                text: Ext.String.format(me.afterPageText, 1)
            }, '-', {
                itemId: 'next',
                tooltip: me.nextText,
                overflowText: me.nextText,
                iconCls: Ext.baseCSSPrefix + 'tbar-page-next',
                disabled: true,
                handler: me.moveNext,
                scope: me
            }, {
                itemId: 'last',
                tooltip: me.lastText,
                overflowText: me.lastText,
                iconCls: Ext.baseCSSPrefix + 'tbar-page-last',
                disabled: true,
                handler: me.moveLast,
                scope: me
            }, '-', me.cbPageSize, '-', {
                itemId: 'refresh',
                tooltip: me.refreshText,
                overflowText: me.refreshText,
                iconCls: Ext.baseCSSPrefix + 'tbar-loading',
                handler: me.doRefresh,
                scope: me
            }];
    },
    // @private
    updateInfo: function () {
        var me = this,
                displayItem = me.child('#displayItem'),
                store = me.store,
                pageData = me.getPageData(),
                count, msg;

        if (displayItem) {
            count = store.getCount();
            if (count === 0) {
                msg = me.emptyMsg;
            } else {
                msg = Ext.String.format(
                        me.displayMsg,
                        pageData.fromRecord,
                        pageData.toRecord,
                        pageData.total
                        );
            }
            displayItem.setText(msg);
        }
    },
    // @private
    onLoad: function () {
        var me = this,
                pageData,
                currPage,
                pageCount,
                afterText,
                count,
                isEmpty,
                item;

        count = me.store.getCount();
        isEmpty = count === 0;
        if (!isEmpty) {
            pageData = me.getPageData();
            currPage = pageData.currentPage;
            pageCount = pageData.pageCount;
            afterText = Ext.String.format(me.afterPageText, isNaN(pageCount) ? 1 : pageCount);
        } else {
            currPage = 0;
            pageCount = 0;
            afterText = Ext.String.format(me.afterPageText, 0);
        }

        Ext.suspendLayouts();
        item = me.child('#afterTextItem');
        if (item) {
            item.setText(afterText);
        }
        item = me.getInputItem();
        if (item) {
            item.setDisabled(isEmpty).setValue(currPage);
        }
        me.setChildDisabled('#first', currPage === 1 || isEmpty);
        me.setChildDisabled('#prev', currPage === 1 || isEmpty);
        me.setChildDisabled('#next', currPage === pageCount || isEmpty);
        me.setChildDisabled('#last', currPage === pageCount || isEmpty);
        me.setChildDisabled('#refresh', false);
        me.updateInfo();
        Ext.resumeLayouts(true);

        if (me.rendered) {
            me.fireEvent('change', me, pageData);
        }
    },
    setChildDisabled: function (selector, disabled) {
        var item = this.child(selector);
        if (item) {
            item.setDisabled(disabled);
        }
    },
    // @private
    getPageData: function () {
        var store = this.store,
                totalCount = store.getTotalCount(), pageSize = this.cbPageSize.getValue() || store.pageSize;

        return {
            total: totalCount,
            currentPage: store.currentPage,
            pageCount: Math.ceil(totalCount / pageSize),
            fromRecord: ((store.currentPage - 1) * pageSize) + 1,
            toRecord: Math.min(store.currentPage * pageSize, totalCount)

        };
    },
    // @private
    onLoadError: function () {
        if (!this.rendered) {
            return;
        }
        this.setChildDisabled('#refresh', false);
    },
    getInputItem: function () {
        return this.child('#inputItem');
    },
    // @private
    readPageFromInput: function (pageData) {
        var inputItem = this.getInputItem(),
                pageNum = false,
                v;

        if (inputItem) {
            v = inputItem.getValue();
            pageNum = parseInt(v, 10);
            if (!v || isNaN(pageNum)) {
                inputItem.setValue(pageData.currentPage);
                return false;
            }
        }
        return pageNum;
    },
    onPagingFocus: function () {
        var inputItem = this.getInputItem();
        if (inputItem) {
            inputItem.select();
        }
    },
    // @private
    onPagingBlur: function (e) {
        var inputItem = this.getInputItem(),
                curPage;

        if (inputItem) {
            curPage = this.getPageData().currentPage;
            inputItem.setValue(curPage);
        }
    },
    // @private
    onPagingKeyDown: function (field, e) {
        var me = this,
                k = e.getKey(),
                pageData = me.getPageData(),
                increment = e.shiftKey ? 10 : 1,
                pageNum;

        if (k == e.RETURN) {
            e.stopEvent();
            pageNum = me.readPageFromInput(pageData);
            if (pageNum !== false) {
                pageNum = Math.min(Math.max(1, pageNum), pageData.pageCount);
                if (me.fireEvent('beforechange', me, pageNum) !== false) {
                    me.store.loadPage(pageNum);
                }
            }
        } else if (k == e.HOME || k == e.END) {
            e.stopEvent();
            pageNum = k == e.HOME ? 1 : pageData.pageCount;
            field.setValue(pageNum);
        } else if (k == e.UP || k == e.PAGE_UP || k == e.DOWN || k == e.PAGE_DOWN) {
            e.stopEvent();
            pageNum = me.readPageFromInput(pageData);
            if (pageNum) {
                if (k == e.DOWN || k == e.PAGE_DOWN) {
                    increment *= -1;
                }
                pageNum += increment;
                if (pageNum >= 1 && pageNum <= pageData.pageCount) {
                    field.setValue(pageNum);
                }
            }
        }
    },
    // @private
    beforeLoad: function () {
        if (this.rendered) {
            this.setChildDisabled('#refresh', true);
        }
    },
    /**
     * Move to the first page, has the same effect as clicking the 'first' button.
     */
    moveFirst: function () {
        if (this.fireEvent('beforechange', this, 1) !== false) {
            this.store.loadPage(1);
        }
    },
    /**
     * Move to the previous page, has the same effect as clicking the 'previous' button.
     */
    movePrevious: function () {
        var me = this,
                prev = me.store.currentPage - 1;

        if (prev > 0) {
            if (me.fireEvent('beforechange', me, prev) !== false) {
                me.store.previousPage();
            }
        }
    },
    /**
     * Move to the next page, has the same effect as clicking the 'next' button.
     */
    moveNext: function () {
        var me = this,
                total = me.getPageData().pageCount,
                next = me.store.currentPage + 1;

        if (next <= total) {
            if (me.fireEvent('beforechange', me, next) !== false) {
                me.store.nextPage();
            }
        }
    },
    /**
     * Move to the last page, has the same effect as clicking the 'last' button.
     */
    moveLast: function () {
        var me = this,
                last = me.getPageData().pageCount;

        if (me.fireEvent('beforechange', me, last) !== false) {
            me.store.loadPage(last);
        }
    },
    /**
     * Refresh the current page, has the same effect as clicking the 'refresh' button.
     */
    doRefresh: function () {
        var me = this,
                current = me.store.currentPage;

        if (me.fireEvent('beforechange', me, current) !== false) {
            me.store.loadPage(current);
        }
    },
    getStoreListeners: function () {
        return {
            beforeload: this.beforeLoad,
            load: this.onLoad,
            exception: this.onLoadError
        };
    },
    /**
     * Unbinds the paging toolbar from the specified {@link Ext.data.Store} **(deprecated)**
     * @param {Ext.data.Store} store The data store to unbind
     */
    unbind: function (store) {
        this.bindStore(null);
    },
    /**
     * Binds the paging toolbar to the specified {@link Ext.data.Store} **(deprecated)**
     * @param {Ext.data.Store} store The data store to bind
     */
    bind: function (store) {
        this.bindStore(store);
    },
    // @private
    onDestroy: function () {
        this.unbind();
        this.callParent();
    }
});