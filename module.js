var modTmcmCompromisedHosts_locLang = new localLang("modTmcmCompromisedHosts");
modList.set('modTmcmCompromisedHosts', modTmcmCompromisedHosts_locLang.label('title'));

/// object which is extends the window class
var modTmcmCompromisedHosts = new Class({
    Extends: tmcmBoxWindow,
    options: {
        title: modTmcmCompromisedHosts_locLang.label('title'),
        name: 'modTmcmCompromisedHosts',
        widgetname: 'tmcmcompromisedhosts',
        loadCSS: true,
        btnRefresh: true
    },
    widget_type: 1300, // the parameter "&T="
    recentdays: 7,
    date_range: [1, 7, 14, 30, 90],
    // no scope setting in this widget
    allowScopeSetting: true,
    top: 0,
    bottom: 0,
    needTotalCount: 1,
    totalCount: 0,
    permission: "0",
    firstRequestCount: 110,
    topOffset: 0,
    criteria: [],
    messageBoxContainer: undefined,
    treePane: undefined,
    tree: undefined,
    resultBox: undefined,
    criticality: "",
    checkedScopes: [],
    // default data if empty
    defaultSetting: { title: modTmcmCompromisedHosts_locLang.label('title'), date: 7, criteria: [1, 1, 1, 1, 1, 1, 1]},

    // settings
    settingCall: ['MakeTitleSetting', 'MakeCriteriaSettings', 'MakeOrderSettings', 'MakeSettingButtons'],

    onFinish: function () {
        'use strict';
        // set L10N object
        this.widgetResourceObj = modTmcmCompromisedHosts_locLang;
        var widget = this,
            userData = this.getData(this.myid),
            savedSettings = userData ? JSON.decode(userData) : this.defaultSetting,
            gridOptions;
        this.display90Days = tmcmBoxWindow.display90Days;
        if (savedSettings.date === 90 && this.display90Days === 0) {
            this.recentdays = 30;
            savedSettings.date = 30;
        } else {
            this.recentdays = savedSettings.date;
        }
        this.options.title = savedSettings.title;
        this.criteria = savedSettings.criteria;
        // UI rendering
        this.fillTitle(savedSettings.title); // fill the title
        this.div_id = 'div_id' + this.myid;
        this.form_id = 'form_id' + this.myid;
        this.MakeContentBlock();
        this.dataViewBox.set('html', [
            '<div class="trend-grid" id="modTmcmCompromisedHosts_grid' + this.myid + '"></div>',
            '<form id="' + this.form_id + '" method="post"></form>'
        ].join(""));
        this.submit_form = document.getElementById(this.form_id);
        // make date range
        this.MakeConditionContent();
        this.makePeriodHandler();
        gridOptions = {
            columnsType: 2,
            columns: [
                {
                    id: "Hostname",
                    name: modTmcmCompromisedHosts_locLang.labelText('label_host'),
                    percentageWidth: '20%',
                    disableSort: true
                },
                {
                    id: "IPAddressList",
                    name: modTmcmCompromisedHosts_locLang.labelText('label_ip'),
                    percentageWidth: '20%',
                    disableSort: true
                },
                {
                    id: "Criticality",
                    name: modTmcmCompromisedHosts_locLang.labelText('label_criticality'),
                    percentageWidth: '20%',
                    disableSort: true
                },
                {
                    id: "AttackPhase",
                    name: modTmcmCompromisedHosts_locLang.labelText('label_attack_phase'),
                    percentageWidth: '20%',
                    disableSort: true
                },
                {
                    id: "LatestDetectionTime",
                    name: modTmcmCompromisedHosts_locLang.labelText('label_latest_detection'),
                    percentageWidth: '20%',
                    disableSort: true
                }],
            rowRecords: 0,
            elemHeight: 268, //(28 + 24 * 10)
            data: [],
            showTip: false,
            dynamicRequestData: {
                disabled: false,
                request: function (base) {
                    widget.dynamicRequest(base);
                }
            },
            cellsFormat: {
                _GLOBAL: function (o) {
                    if (!o.text && o.data) {
                        return "No data";
                    }
                },
                Hostname: function (o) {
                    var data = {
                            hostID: o.data.HostGUID,
                            attackPhase: widget.decodeAttackPhase(o.data.AttackPhase)
                        },
                        detailLink = homeBase.substr(0, homeBase.length - 7) + 'html/suspiciousObjects/potentiallyCompromisedHost.php',
                        icon,
                        alink;
                    switch (o.data.Isolate) {
                        case "2":
                            icon = jQuery('<i>').attr('class', 'isolateIcon').attr('title', modTmcmCompromisedHosts_locLang.label('isolated')).css('margin-right', '5px');
                        break;
                        case "3":
                            //isolate pending
                            icon = jQuery('<i>').attr('class', 'pendingIcon').attr('title', modTmcmCompromisedHosts_locLang.label('isolate_pending')).css('margin-right', '5px');
                        break;
                        case "4":
                            //restore pending
                            icon = jQuery('<i>').attr('class', 'pendingIcon').attr('title', modTmcmCompromisedHosts_locLang.label('restore_pending')).css('margin-right', '5px');
                        break;
                    }
                    alink = jQuery('<a>').attr('href', "#").text(o.text || "");
                    alink.on('click', widget.linkToDetailPage(data, detailLink));
                    if (icon) {
                        return alink.prepend(icon);
                    }
                    return alink;
                },
                AttackPhase: function (o) {
                    var html = "",
                        attackPhaseArray = widget.decodeAttackPhase(o.text);
                    for (i = 0; i < attackPhaseArray.length; ++i) {
                        if (attackPhaseArray[i] !== 0) {
                            html += '<i class="inIcon"></i>';
                        } else {
                            html += '<i class="outIcon"></i>';
                        }
                        if (i !== (attackPhaseArray.length - 1)) {
                            html += '<i class="connIcon"></i>';
                        }
                    }
                    return html;
                }
            },
            rowSelect : {
                disabled : true
            },
            emptyContentDescription: TMCM_Lang.label('no_data')
        };
        this.grid_columns = gridOptions.columns;
        this.grid = this.dataViewBox.getElement('div.trend-grid');
        jQuery(this.grid).trendGrid(gridOptions);
        this.hasDrawed = true;
        this.ShowWidget.delay(100, this);
    },
    onRedraw: function (NeedToUpdateWidth) {
        'use strict';
        this.AdjustContentHeight();
        jQuery(this.grid).trendGrid('adjHeight', this.swfHeight - this.topOffset);
        jQuery(this.grid).trendGrid('adjWidth', this.getContentSize().x);
    },
    RetrieveData: function (response, data, ajaxobject) {
        'use strict';
        var result;
        this.isAjaxing = false;
        try {
            result = JSON.decode(response).DocumentElement;
        } catch (e) {
            this.showErrorMessage(modTmcmCompromisedHosts_locLang.label("wrongjsonformat"), { type: 'error'});
            jQuery(this.grid).trendGrid('ajaxLoadingComplete');
            return;
        }
        this.permission = "1";
        this.totalCount = result.TotalCount;
        this.needTotalCount = 0;
        this.setRetriveData(result);
        jQuery(this.grid).trendGrid('emptyContent').trendGrid('renderContent', {rowRecords: this.totalCount, data: result.Data});
        jQuery(this.grid).trendGrid('ajaxLoadingComplete');
    },
    LastCheckTime: function (jsonData) {
        'use strict';
        var refreshTime = jsonData.UTCTime || "",
            formatDate = this.GetDateByStr(refreshTime, TMCM_Lang.label('dateformat'));

        this.lastCheckBox.setHTML(TMCM_Lang.label('last_check') + formatDate);
    },
    // make the JSON format data for settings
    makeSettings: function () {
        'use strict';
        // check user inputed title
        var title = $('widget_title_' + this.myid);
        if (title) {
            var title_text = title.value.trim();
            // maximium 64 chars
            if (title_text.length > 64) {
                var err_setting = {
                    type: 'error',
                    position: 'before',
                    addTo: this.settingsBox.getElement('.msg_box')
                }
                this.showErrorMessage.bind(this)(TMCM_Lang.label("title_too_many_char"), err_setting);
                return ;
            }
            if (title_text) {
                // html encode
                this.options.title = htmlentities(title_text);
            } else {
                // empty title will become as default title
                var default_title = (this.widgetResourceObj) ?
                            this.widgetResourceObj.label(this.options.widgetname + '_title') : this.options.title;
                this.options.title = default_title;
            }
        }
        return {
            title : this.options.title,
            date : this.recentdays,
            criteria : this.criteria
        };
    },
    MakeCriteriaSettings: function () {
        'use strict';
        var criteriaSectionHtml = [];
        criteriaSectionHtml.push('<td class="title">',
            modTmcmCompromisedHosts_locLang.label('label_criteria'),
            '</td>',
            '<td class="content">',
            '<table class="',
            this.options.name + "CriteriaOptions",
            '">',
            '<tr><td class="criteriaOptionsTitle">',
            modTmcmCompromisedHosts_locLang.label('label_criteria_option_title'),
            '</tr></td>',
            '<tr><td class="criteriaOptions"><input type = "checkbox" name="criteriaOption1">',
            modTmcmCompromisedHosts_locLang.label('label_criteria_option_1'),
            '</input></td></tr>',
            '<tr><td class="criteriaOptions"><input type = "checkbox" name="criteriaOption2">',
            modTmcmCompromisedHosts_locLang.label('label_criteria_option_2'),
            '</input></td></tr>',
            '<tr><td class="criteriaOptions"><input type = "checkbox" name="criteriaOption3">',
            modTmcmCompromisedHosts_locLang.label('label_criteria_option_3'),
            '</input></td></tr>',
            '<tr><td class="criteriaOptions"><input type = "checkbox" name="criteriaOption4">',
            modTmcmCompromisedHosts_locLang.label('label_criteria_option_4'),
            '</input></td></tr>',
            '<tr><td class="criteriaOptions"><input type = "checkbox" name="criteriaOption5">',
            modTmcmCompromisedHosts_locLang.label('label_criteria_option_5'),
            '</input></td></tr>',
            '<tr><td class="criteriaOptions"><input type = "checkbox" name="criteriaOption6">',
            modTmcmCompromisedHosts_locLang.label('label_criteria_option_6'),
            '</input></td></tr>',
            '<tr><td class="criteriaOptions"><input type = "checkbox" name="criteriaOption7">',
            modTmcmCompromisedHosts_locLang.label('label_criteria_option_7'),
            '</input></td></tr></table></td>');

        return criteriaSectionHtml.join('');
    },
    MakeOrderSettings: function () {
        'use strict';
        var orderSectionHtml = [];
        orderSectionHtml.push('<td class="title">',
            modTmcmCompromisedHosts_locLang.label('label_order'),
            '</td>',
            '<td class="content">',
            '<table class="',
            this.options.name + "OrderSetting",
            '">',
            '<tr><td class="orderSettingTitle">',
            modTmcmCompromisedHosts_locLang.label('label_order_title'),
            '</td></tr>',
            '<tr><td class="orderPriority">',
            '<i class="dotIcon"></i>',
            modTmcmCompromisedHosts_locLang.label('label_user_endpoint_criticality'),
            '<a href="#" class="priorityOption">',
            modTmcmCompromisedHosts_locLang.label('label_critical'),
            '</a>,',
            '<a href="#" class="priorityOption">',
            modTmcmCompromisedHosts_locLang.label('label_high'),
            '</a>,',
            '<a href="#" class="priorityOption">',
            modTmcmCompromisedHosts_locLang.label('label_medium'),
            '</a>,',
            '<a href="#" class="priorityOption">',
            modTmcmCompromisedHosts_locLang.label('label_low'),
            '</a>',
            '</td></tr>',
            '<tr><td class="orderPriority">',
            '<i class="dotIcon"></i>',
            modTmcmCompromisedHosts_locLang.label('label_attack_phase'),
            '</td></tr>',
            '<tr><td class="orderPriority">',
            '<i class="dotIcon"></i>',
            modTmcmCompromisedHosts_locLang.label('label_detection_time'),
            '</td></tr>',
            '</table></td>');
        return orderSectionHtml.join('');
    },
    makeScopeTree: function (data) {
        'use strict';
        var widget = this,
            scope_container = $('scope_tree'),
            nodeChildTemp = {},
            getCheckedScope = function (obj) {
                if (obj.GRID_DATA && obj.GRID_DATA.length >= 1) {
                    for (var i = 0; i < obj.GRID_DATA.length; ++i) {
                        getCheckedScope(obj.GRID_DATA[i]);
                    }
                } else {
                    if (obj.NODE_DATA.ISLEAF === "1") {
                        widget.checkedScopes.push({
                            'GUID': obj.NODE_DATA.GUID,
                            'NAME': obj.NODE_DATA.NAME,
                            'PARAM': obj.NODE_DATA.PARAM,
                            'ResourceType': obj.NODE_DATA.ResourceType
                        });
                    }
                }
            },
            removeCheckedScope = function (obj) {
                var searchObj = obj.NODE_DATA ? obj.NODE_DATA : obj;
                if (searchObj.ISLEAF === "0") {
                    if (obj.GRID_DATA && obj.GRID_DATA.length >= 1) {
                        for (var i = 0; i < obj.GRID_DATA.length; ++i) {
                            removeCheckedScope(obj.GRID_DATA[i]);
                        }
                    } else {
                        return;
                    }
                } else {
                    var index = -1;
                    for (var i = 0; i < widget.checkedScopes.length; ++i) {
                        if (widget.checkedScopes[i].GUID === searchObj.GUID && widget.checkedScopes[i].NAME === searchObj.NAME &&
                            widget.checkedScopes[i].PARAM === searchObj.PARAM && widget.checkedScopes[i].ResourceType === searchObj.ResourceType) {
                            index = i;
                            break;
                        }
                    }
                    if (index >= 0) {
                        widget.checkedScopes.splice(index, 1);
                    }
                }
            },
            expandNode = function (parentGUID, unExpandNodes, ui) {
                for (var i=0, count = unExpandNodes.length; i < count; i++) {
                    var nodeData = unExpandNodes[i];                    
                    if (nodeData.ISLEAF === '1') {
                        continue;
                    }
                    nodeChildTemp[nodeData.GUID] = { 'parent': parentGUID, 'current': nodeData };
                    if (ui && ui.data.DEEP >= 1) {
                        if (nodeData.CHILD) {
                            expandNode(nodeData.GUID, nodeData.CHILD, { data: { DEEP: ui.data.DEEP + 1 }});
                        }
                        continue;
                    }
                    jQuery(widget.tree).trendTree('triggerExpand', { GUID: nodeData.GUID, expandOnly: true });
                }
            }
        scope_container.empty();
        if (this.treePane) {
            jQuery(this.treePane).remove();
            this.treePane = undefined;
        }
        if (this.treePane === undefined){
            this.treePane = new Element('div', {'class':'scope_search bd'}).injectInside(scope_container);
        }
        if (this.resultBox) {
            jQuery(this.resultBox).remove();
            this.resultBox = undefined;
        }
        if (this.resultBox === undefined){
            this.resultBox = new Element('div',{'class':'search_result'});
            this.treePane.adopt(this.resultBox);
        }
        if (this.tree) {
            jQuery(this.tree).remove();
            this.tree = undefined;
        }
        if (this.tree === undefined) {
            this.tree = new Element('div', {'class':'trend-tree modTmcmCompromisedHostsSelectScope'}).inject(this.resultBox);
        }

        jQuery(this.tree).trendTree({
            data: data,
            rootGUID: data.GUID,
            isShowRoot: false,
            containerNode: widget.permission === "1" ? ['checkBox', 'icon'] : ['icon'],
            cellsFormat: function(nodeIcon, data, nodeDiv){
                switch (data.NODE_DATA.ICON) {
                    case 'users':
                        nodeIcon.css("background-image","url(" + WPRoot + "/template/inventoryView/images/icons.png)");
                        nodeIcon.css("background-position","-53px 0px");
                        nodeIcon.css("width", "18px");
                        nodeIcon.css("height", "18px");
                        break;
                    case 'endpoints':
                        nodeIcon.css("background-image","url(" + WPRoot + "/template/inventoryView/images/icons.png)");
                        nodeIcon.css("background-position","-221px 0px");
                        nodeIcon.css("width", "18px");
                        nodeIcon.css("height", "18px");
                        break;
                    case 'tag':
                        nodeIcon.css("background-image","url(" + WPRoot + "/template/inventoryView/images/icons.png)");
                        nodeIcon.css("background-position","-384px 0px");
                        nodeIcon.css("width", "18px");
                        nodeIcon.css("height", "18px");
                        break;
                    case 'filter':
                        nodeIcon.css("background-image","url(" + WPRoot + "/template/inventoryView/images/icons.png)");
                        nodeIcon.css("background-position","-304px 0px");
                        nodeIcon.css("width", "18px");
                        nodeIcon.css("height", "18px");
                        break;
                    default:
                        break;
                }
            },
            expand: function (ui) {  
                if( ui.data.NODE_DATA.ISLEAF === '1' ){
                    return;
                }
                var child = nodeChildTemp[ui.data.GUID] ? nodeChildTemp[ui.data.GUID]['current'].CHILD : '';
                if( child ){
                    jQuery(widget.tree).trendTree('renderNode', ui, { 'CHILD': child });
                    if( ui.data.DEEP <= 1 ){ 
                        expandNode( ui.data.GUID, child, ui);
                    }
                    return;
                }
            },
            onChecked : function(n){
                getCheckedScope(n);
            },
            unChecked : function(n){
                removeCheckedScope(n);
            }
        });
        expandNode(data.GUID, data.CHILD);
        for(var i = 0; i < data.CHILD.length; ++i){
            expandNode(data.CHILD[i].GUID, data.CHILD[i].CHILD);
        }
        // IE6 z-index fix
        if(Browser.Engine.trident  && Browser.Engine.version === 4) {
            var z = scope_container.getSize();
            var iframe = new Element('iframe', {'id':'ie6_fix_frame','src':'img/1space.gif','frameborder':'0','scrolling':'no'})
                .setStyles({
                'z-index': '-1',
                'position':'absolute',
                'left'   : '-2px',
                'top'    : '-2px',
                'width'  : (z.x+2)+'px',
                'height' : (z.y+2)+'px',
                'filter' : 'progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=0)',
                'border' : '0px solid #666'
            });
            scope_container.adopt(iframe);
        }
    },
    rebindScopeBtnEvent: function () {
        var widget = this;
        var scopeBtns = $('scope_tree').getElements('.modal_button.ui-button.clearfix');
        for(var i=0; i< scopeBtns.length; ++i){
            if (scopeBtns[i].get('value') === lang.label('btn_ok')){
                var scopeOkBtn = scopeBtns[i];
                scopeOkBtn.removeEvents('click');
                scopeOkBtn.addEvent('click', function(e){
                    e.preventDefault(e);
                    $('scope_tree').setStyle('display', 'none');
                    widget.onScopeOkBtnClick(e);
                });
            }
        }
    },
    scopeCancel: function (e) {
        'use strict';
        this.checkedScopes.splice(0, this.checkedScopes.length);
    },
    FillScopeContent: function(response) {
        'use strict';
        var res = JSON.decode(response);
        if (res.data) {
            res.data = JSON.decode(res.data);
        }
        // make container
        var widget = this,
            makeCheck = function(data){
                if (data.ISLEAF === "0"){
                    if (data.CHILD && data.CHILD.length >= 1) {
                        var onCheck = 0,
                            partialCheck = 0,
                            childCheck;
                        for(var i = 0; i < data.CHILD.length; ++i){
                            childCheck = makeCheck(data.CHILD[i]);
                            if (childCheck === 2) {
                                onCheck++;
                            } else if (childCheck === 1) {
                                partialCheck++;
                            }
                        }
                        if (onCheck === data.CHILD.length){
                            data.STATUS = 2;
                        } else if ((partialCheck > 0 && partialCheck < data.CHILD.length) || (onCheck > 0 && onCheck < data.CHILD.length)){
                            data.STATUS = 1;
                        } else {
                            data.STATUS = 0;
                        }
                        return data.STATUS;
                    }
                } else {
                    switch(data.STATUS){
                        case '0':
                            data.STATUS = 0;
                        break;
                        case '2':
                            data.STATUS = 2;
                            widget.checkedScopes.push({
                                'GUID': data.GUID,
                                'NAME': data.NAME,
                                'PARAM': data.PARAM,
                                'ResourceType': data.ResourceType
                            });
                        break;
                    }
                    return data.STATUS;
                }
            },
            linkDiv,
            link;
        makeCheck(res.data);
        // done with loading scope, clear loading message
        this.makeScopeTree(res.data); 
        // make inventoryview link
        linkDiv = new Element('div');
        link = new Element('a', {'href': homeBase.substr(0, homeBase.length - 7) + 'WF_Page.aspx?p=inventoryView', 'text': modTmcmCompromisedHosts_locLang.label('user_endpoint_link')});
        if (this.permission === '0'){
            link.removeProperty('href');
            link.removeEvent('click');
            link.addEvent('click', function (e) {
                e.preventDefault(e);
                alert(modTmcmCompromisedHosts_locLang.label('no_permission_description').replace(/(&gt;)/g, '>'));
            });
        } else {
            link.removeEvent('click');
            link.addEvent('click', function (e) {
                e.preventDefault(e);
                var r = confirm(modTmcmCompromisedHosts_locLang.label('loss_setting_description'));
                if (r === true) {
                    window.location.href = homeBase.substr(0, homeBase.length - 7) + 'WF_Page.aspx?p=inventoryView';
                }
            });
        }
        link.setStyle('text-decoration', 'underline');
        link.setStyle('cursor', 'pointer');
        linkDiv.setStyle('padding-top', '10px');
        link.inject(linkDiv);
        linkDiv.inject(this.treePane);
        // make scope buttons
        this.MakeScopeButtons();
        //bind click event of scope ok btn
        this.rebindScopeBtnEvent();
        this.isAjaxing = false;
        this.DisableScopeButton(false);
        window.fireEvent("resize");
    },
    onScopeOkBtnClick: function (e) {
        'use strict';
        if(this.isAjaxing){
            return ;
        }
        this.isAjaxing = true;
        var parameter = {
            module: 'modRESTful',
            method: 'PUT',
            resource: 'inventoryViewBackend/FilterResource/CompromisedHostScope',
            data: JSON.encode({
                criticality: this.criticality,
                scope: this.formatScope(this.checkedScopes)
            })
        };

        wfc_ProxyObj.fetch(
            parameter,
            {
                useJSON:false, async:true
            },
            {
                onSuccess: this.onScopeSaving.bind(this),
                onFailure: this.onFail.bind(this)
            }
        );
    },
    OpenScopeSetting: function (e) {
        'use strict';
        e.preventDefault();
        if (this.isAjaxing) {
            return ; // Prevent repeatly opening scope tree
        }
        if ($('scope_tree')) {
            // if scope tree is opened at another widget, we'll delete it
            var sc = $('scope_tree');
            var isShow = sc.getStyle('display')!='none';

            if (parseInt(sc.getProperty('widgetid'),10)== this.myid) {
                sc.destroy();
                if ($('ie6_fix_frame')) {
                    $('ie6_fix_frame').destroy();
                }
                if (isShow) {
                    return;
                }
            } else {
                sc.destroy();
                if ($('ie6_fix_frame')) {
                    $('ie6_fix_frame').destroy();
                }
            }
        }

        this.isAjaxing = true;
        this.DisableScopeButton(true);

        this.settingsBox.setStyle('display','none');

        // make container
        var scope_container = $("scope_tree");
        if (scope_container === null) {
            scope_container = new Element('div', { 'id': 'scope_tree', 'class': 'setting_box', 'widgetid': this.myid}).injectInside(this.settingModal.contentEl);
        }
        this.scopeSettingBox = scope_container;
        this.originalSettingTitle = this.settingModal.modalElement.getElement('.modalTitle h2').get("text");
        this.settingModal.modalElement.getElement('.modalTitle h2').set("html", TMCM_Lang.label("selectScope"));
        wfc_ProxyObj.fetch(
            {
                module: 'modRESTful',
                method: 'GET',
                resource: 'InventoryViewBackend/FilterResource/CompromisedHostScope',
                data: JSON.encode({"criticality": this.criticality})
            },
            {useJSON:false, async:true},
            {
                onSuccess: this.FillScopeContent.bind(this),
                onFailure: this.onFail.bind(this)
            }
        );
    },
    onScopeSaving: function (response, data){
        'use strict';
        this.scopeSettingBox.setStyle('display','none');
        this.scopeSettingBox.empty();
        this.scopeSettingBox.destroy();
        delete this.scopeSettingBox;
        this.settingsBox.setStyle('display','block');
        this.settingModal.modalElement.getElement('.modalTitle h2').set("text", this.originalSettingTitle);
        window.fireEvent("resize");
        this.checkedScopes.splice(0, this.checkedScopes.length);
        try{
            var result = response;
            var errcode = 0;
            if(!result) {
                errcode = 416;
            } else {
                errcode = result.errcode;
            }
            if (errcode != 0) {
                this.displaySettings();
                this.showErrorMessage.bind(this)(this.widgetResourceObj.label(this.options.widgetname+"_save_setting_failed") + " " + lang.label("errorcode_" + errcode), this.settingMessageOption);
            }
        } catch (e) {
            this.showErrorMessage.bind(this)(modTmcmCompromisedHosts_locLang.label("wrongjsonformat"), this.settingMessageOption);
        }
        this.isAjaxing = false;
    },
    MakeSettingButtons: function (beforeSaveEvent, beforeCancelEvent) {
        'use strict';
        // save button
        this.settingsBox.addEvent('onSettingDone', function () {
            var criteriaOptions = this.settingsBox.getElements('.criteriaOptions input[name*="criteriaOption"]');
            for (i=0; i< this.criteria.length; ++i){
                if(this.criteria[i] === 1){
                    criteriaOptions[i].setProperty("checked", 1);
                }
            }
            var scopeHyperLink = this.settingsBox.getElement('.orderPriority');
            scopeHyperLink.removeEvents('click');
            scopeHyperLink.addEvent('click', function (e) {
                e.preventDefault(e);
                this.criticality = e.target.text;
                this.OpenScopeSetting(e);
            }.bind(this));
            var save_btn = this.settingsBox.getElement("div[name=save]");
            if (save_btn) {
                save_btn.removeEvents('click');
                save_btn.addEvent('click', function (e) {
                    e.preventDefault(e);
                    var criteriaOptions = this.settingsBox.getElements('.criteriaOptions input[name*="criteriaOption"]');
                    for (i=0; i < criteriaOptions.length; ++i){
                        if(criteriaOptions[i].getProperty("checked") === true){
                            this.criteria[i] = 1;
                        } else {
                            this.criteria[i] = 0;
                        }
                    }
                    if (this.criteria.indexOf(1) === -1) {
                        this.fireErrorMessage('0', modTmcmCompromisedHosts_locLang.label('criteria_error_description'), this.setting_modal_message_block);
                    } else {
                        this.saveSettings();
                    }
                }.bind(this));
            }

            // close button
            var close_btn = this.settingsBox.getElement("div[name=cancel]");
            if (close_btn) {
                close_btn.removeEvents('click');
                close_btn.addEvent('click', function (e) {
                    e.preventDefault(e);
                    if ($defined(beforeCancelEvent)) {
                        beforeCancelEvent.bind(this)();
                    }
                    // if modal setting
                    if (custom_options.use_modal_widget_setting) {
                        this.settingModal.close();
                        this.settingModal = null;
                    }
                }.bind(this));
            }
        }.bind(this));

        var html = [];
        html.push(
            '<div class="modal_button ui-button clearfix" type="button" id="setting_cancel_',
            this.myid,
            '" name="cancel">',
            '<div class="left"></div>',
            '<div class="mid">',
            lang.label('btn_cancel'),
            '</div>',
            '</div>',
            '<div class="ui-button clearfix" type="button" id="setting_save_',
            this.myid,
            '" name="save">',
            '<div class="left"></div>',
            '<div class="mid">',
            lang.label('btn_save'),
            '</div>',
            '</div>'
        );
        return html.join('');
    },
    linkToDetailPage: function (data, url) {
        'use strict';
        return function (event) {
            var form = new Element('form', {
                    action: url,
                    method: "post"
                }),
                param = {
                    'HostID': data['hostID'],
                    'D': this.recentdays,
                    'PhaseStatus': this.filterZero(data['attackPhase']),
                    'Criteria': this.formatCriteria(this.criteria)
                };
            new Element('input', {
                type: 'hidden',
                name: 'param',
                value: JSON.encode(param)
            }).inject(form);

            form.inject(this.dataViewBox);    // IE needs to insert form to DOM before submit
            form.submit();
            form.destroy();
        }.bind(this);
    },
    // called in ShowWidget method
    GetProxyParameter: function () {
        'use strict';
        return {
            module: 'modTMCM',
            serverid: 0,
            WID: this.myid,
            T: this.widget_type,
            D: this.recentdays,
            criteria: this.criteria.join(','),
            top: this.top,
            bottom: this.firstRequestCount,
            needTotalCount: this.needTotalCount
        };
    },
    SetLoadingText: function(){
        // do noting
    },
    ShowWidget: function () {
        'use strict';
        jQuery(this.grid).trendGrid('ajaxLoading');
        this.parent();
    },
    setlastRefreshTime: function (data) {
        'use strict';
        if (data.UTCTime) {
            var localTime = this.GetDateByStr(data.UTCTime, TMCM_Lang.label('dateformat'));
            this.lastCheckBox.setHTML(TMCM_Lang.label('last_check') + localTime);
            this.boxBD.getElement('div.last_check_time').setHTML(TMCM_Lang.label('last_check') + localTime );
        }
    },
    refreshMod: function () {
        'use strict';
        this.top = 0;
        this.bottom = 0;
        this.totalCount = 0;
        this.needTotalCount = 1;
        this.permission = "0";
        jQuery(this.grid).trendGrid('removeRegisterRowsData');
        this.parent();
    },
    dynamicRequest : function (base) {
        'use strict';
        this.top = base.requestRange.top;
        this.bottom = base.requestRange.bottom;
        var param = this.GetProxyParameter();
        wfc_ProxyObj.fetch(
            param,
            {
                useJSON:false,
                async:true,timeout: ajaxTimeoutValue_update_widgetPool
            },
            {
                onSuccess: function (response) {
                    try {
                        result = JSON.decode(response).DocumentElement;
                    } catch (e) {
                        this.showErrorMessage(modTmcmCompromisedHosts_locLang.label("wrongjsonformat"), { type: 'error'});
                        jQuery(this.grid).trendGrid('ajaxLoadingComplete');
                        return;
                    }
                    this.setRetriveData(result);
                    jQuery(this.grid).trendGrid('renderContent');
                }.bind(this),
                onFailure: this.onFail.bind(this)
            }
        );
    },
    fireErrorMessage: function (type, msg, parentUI) {
        if (this.messageBoxContainer) {
            this.messageBoxContainer.empty();
            this.messageBoxContainer.destroy();
            this.messageBoxContainer = undefined;
        }
        if (this.messageBoxContainer === undefined) {
            this.messageBoxContainer = new Element("div", {"class": "msg_box"}).inject(parentUI, "top");
        }
        var option = {
            type: type, //0: error, 1: warn, 2: info
            close: true,
            description: msg
        };
        if (this.messageBox) {
            this.clearMessage();
            this.messageBox = undefined;
        }
        this.messageBox = new WFMessage(this.messageBoxContainer);
        this.messageBox.fireEvent('message',option);
    },
    setRetriveData: function (result) {
        'use strict';
        var date = initXMLDOM('<?xml version="1.0" encoding="UTF-8"?><chart><UTC><day utctime="' + result.UTCTime + '" timeduration="0" /></UTC></chart>');
        // make date range
        this.MakeConditionContent();
        this.makePeriodHandler();
        this.LastCheckTime(result);
        jQuery(this.grid).trendGrid('registerRowsData', {
            data: result.Data,
            top: this.top
        });
    },
    decodeAttackPhase: function (data) {
        'use strict';
        var attackPhaseDataArray = data.split(','),
            attackPhaseArray = [0, 0, 0, 0, 0];
        for (i = 0; i < attackPhaseDataArray.length; ++i) {
            var tempIndex = parseInt(attackPhaseDataArray[i], 10) / 10;
            if (tempIndex >= 1) {
                attackPhaseArray[tempIndex - 1] = parseInt(attackPhaseDataArray[i], 10);
            }
        }
        return attackPhaseArray;
    },
    filterZero: function (array) {
        'use strict';
        var result = [];
        if (array instanceof Array) {
            for (var i = 0; i < array.length; ++i) {
                if (array[i] !== 0 && array[i] !== '0') {
                    result.push(array[i]);
                }
            }
        }
        return result;
    },
    formatCriteria : function (criteria) {
        'use strict';
        var result = [];
        if (criteria instanceof Array) {
            for (var i = 0; i < criteria.length; ++i) {
                if (criteria[i] !== 0 && criteria[i] !== '0') {
                    result.push(i);
                }
            }
        }
        return result;
    },
    formatScope: function (scopes) {
        'use strict';
        var result = [],
            userResource = {
                resourceType: 'UserResource',
                child: []
            },
            endpointResource = {
                resourceType: 'EndpointResource',
                child: []
            },
            checkTagFilterType = function (tag){
                if (tag === 'TagResource') {
                    return 'Tag';
                } else if (tag === 'AdvSearchResource') {
                    return 'Filter';
                }
            };
        for (var i = 0; i < scopes.length; ++i) {
            if (scopes[i].ResourceType === userResource.resourceType) {
                userResource.child.push({itemID: scopes[i].GUID, itemType: checkTagFilterType(scopes[i].PARAM)});
            } else if (scopes[i].ResourceType === endpointResource.resourceType) {
                endpointResource.child.push({itemID: scopes[i].GUID, itemType: checkTagFilterType(scopes[i].PARAM)});
            }
        }
        result.push(userResource, endpointResource);
        return result;
    }
});