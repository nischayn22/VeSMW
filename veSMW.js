var propertyName = '';
var valueName = '';
var model;
var contextItem;
 
ve.ui.MWLinkAction.prototype.open = function () {
	this.surface.execute( 'window', 'open', 'smw-property-annotation', null ); 
}
ve.ui.ContextItem.prototype.onEditButtonClick = function(){
	model = this.model;
	var title = model.getAttribute( 'lookupTitle' );
	if ( title.indexOf('::') > -1 ) {
		propertyName = title.split('::')[0];
		valueName = title.split('::')[1];
	} else {
		propertyName = '';	
		valueName = title;
	}
	contextItem = this;
	this.context.getSurface().execute( 'window', 'open', 'smw-property-annotation', null );
};
 
ve.ui.MWInternalLinkContextItem.prototype.renderBody = function () {
	var title = this.model.getAttribute( 'lookupTitle' ),
	htmlDoc = this.context.getSurface().getModel().getDocument().getHtmlDocument();
	var $wrapper = $( '<div>' );
	if ( title.indexOf('::') > -1 ) {
		var property = title.split('::')[0];
		var property_value = title.split('::')[1];
		var	$linkProperty = $( '<a>' )
				.addClass( 've-ui-mwInternalLinkContextItem-link' )
				.css( 'display', 'inline-block' )
				.text( property )
				.attr( {
					href: wgArticlePath.replace('$1', 'Property:' + property ),
					target: '_blank'
				} ),
			$linkPropValue = $( '<a>' )
				.addClass( 've-ui-mwInternalLinkContextItem-link' )
				.css( 'display', 'inline-block' )
				.text( property_value )
				.attr( {
					href: ve.resolveUrl( property_value, htmlDoc ),
					target: '_blank'
				} );
		$labelProperty = $( '<label>Property:</label>' );
		$labelPropValue = $( '<label>Link:</label>' );
		$wrapper.append( $labelPropValue );
		$wrapper.append( $linkPropValue );
		$wrapper.append( $( '<br/>' ) );
		$wrapper.append( $labelProperty );
		$wrapper.append( $linkProperty );
	} else {
		var $linkPropValue = $( '<a>' )
			.addClass( 've-ui-mwInternalLinkContextItem-link' )
			.css( 'display', 'inline-block' )
			.text( title )
			.attr( {
				href: ve.resolveUrl( title, htmlDoc ),
				target: '_blank'
			} );
		$wrapper.append( $linkPropValue );
	}
	this.$body.empty().append( $wrapper );
}
 
importScript( 'User:Nischayn22/shortcut.js' );
//alert("This is to check if the right version of the script is loaded. version - 0.5.5");
 
ve.ui.SMWPropertyLinkTargetInputWidget = function VeUiSMWPropertyLinkTargetInputWidget( config ) {
	// Config intialization
	config = config || {};
	// Parent constructor
	ve.ui.MWLinkTargetInputWidget.call( this, config );
};
OO.inheritClass( ve.ui.SMWPropertyLinkTargetInputWidget, ve.ui.MWLinkTargetInputWidget );
 
ve.ui.SMWPropertyLinkTargetInputWidget.prototype.getLookupRequest = function () {
	var req,
		widget = this,
		promiseAbortObject = { abort: function () {
			// Do nothing. This is just so OOUI doesn't break due to abort being undefined.
		} };
 
	if ( mw.Title.newFromText( this.value ) ) {
		return this.interwikiPrefixesPromise.then( function () {
			var interwiki = widget.value.substring( 0, widget.value.indexOf( ':' ) );
			if (
				interwiki && interwiki !== '' &&
				widget.interwikiPrefixes.indexOf( interwiki ) !== -1
			) {
				return $.Deferred().resolve( { query: {
					pages: [{
						title: widget.value
					}]
				} } ).promise( promiseAbortObject );
			} else {
				req = new mw.Api().get( {
					action: 'query',
					generator: 'prefixsearch',
					gpssearch: widget.value,
					gpsnamespace: 102,
					gpslimit: 5,
					prop: 'info|pageprops|pageimages|pageterms',
					pithumbsize: 80,
					pilimit: 5,
					redirects: '',
					wbptterms: 'description',
					ppprop: 'disambiguation'
				} );
				promiseAbortObject.abort = req.abort.bind( req ); // todo: ew
				return req;
			}
		} ).promise( promiseAbortObject );
	} else {
		// Don't send invalid titles to the API.
		// Just pretend it returned nothing so we can show the 'invalid title' section
		return $.Deferred().resolve( {} ).promise( promiseAbortObject );
	}
};
 
 
 
 
 
 
ve.ui.SMWPropertyLinkTargetInputWidget.prototype.getLookupMenuOptionsFromData = function ( data ) {    var i, len, item, pageExistsExact, pageExists, index, matchingPage, items = [],
        existingPages = [],
        matchingPages = [],
        disambigPages = [],
        redirectPages = [],
        titleObj = mw.Title.
    newFromText('Property:' + this.value), linkCacheUpdate = {};
    for (index in data) {
        matchingPage = data[index];
        linkCacheUpdate[matchingPage.title] = {
            missing: false,
            redirect: false,
            disambiguation: false
        };
        existingPages.push(matchingPage.title);
        if (matchingPage.redirect !== undefined) {
            redirectPages.push(matchingPage.title);
            linkCacheUpdate[matchingPage.title].redirect = true;
        } else if (matchingPage.pageprops !== undefined && matchingPage.pageprops.disambiguation !== undefined) {
            disambigPages.push(matchingPage.title);
            linkCacheUpdate[matchingPage.title].disambiguation = true;
        } else {
            matchingPages.push(matchingPage.title);
        }
    }
    pageExistsExact = existingPages.indexOf('Property:' + this.value) !== -1;
    pageExists = pageExistsExact || (titleObj && existingPages.indexOf(titleObj.getPrefixedText()) !== -1);
    if (!pageExists) {
        linkCacheUpdate[this.value] = {
            missing: true,
            redirect: false,
            disambiguation: false
        };
    }
    ve.init.platform.linkCache.set(linkCacheUpdate);
    if (ve.init.platform.getExternalLinkUrlProtocolsRegExp().test(this.value)) {
        items.push(new OO.ui.MenuSectionOptionWidget({
            data: 'externalLink',
            label: ve.msg('visualeditor-linkinspector-suggest-external-link')
        }));
        items.push(new ve.ui.MWLinkMenuOptionWidget({
            data: this.getExternalLinkAnnotationFromUrl(this.value),
            classes: ['ve-ui-mwLinkTargetInputWidget-extlink'],
            label: this.value,
            href: this.value
        }));
    }
    if (!pageExists) {
        if (titleObj) {
            items.push(new OO.ui.MenuSectionOptionWidget({
                data: 'newPage',
                label: ve.msg('visualeditor-linkinspector-suggest-new-page')
            }));
            items.push(new ve.ui.MWInternalLinkMenuOptionWidget({
                data: this.getInternalLinkAnnotationFromTitle(this.value),
                pagename: 'Property:' + this.value
            }));
        } else {
            item = new OO.ui.MenuSectionOptionWidget({
                data: 'illegalTitle',
                label: ve.msg('visualeditor-linkinspector-illegal-title')
            });
            item.$element.addClass('ve-ui-mwLinkTargetInputWidget-warning');
            items.push(item);
        }
    }
    if (matchingPages && matchingPages.length) {
        items.push(new OO.ui.MenuSectionOptionWidget({
            data: 'matchingPages',
            label: ve.msg('visualeditor-linkinspector-suggest-matching-page', matchingPages.length)
        }));
        if (pageExists && !pageExistsExact) {
            matchingPages.unshift('Property:' + this.value);
        }
        for (i = 0, len = matchingPages.length; i < len; i++) {
            items.push(new ve.ui.MWInternalLinkMenuOptionWidget({
                data: this.getInternalLinkAnnotationFromTitle((matchingPages[i]).split(':')[1]),
                pagename: matchingPages[i]
            }));
        }
    }
    if (disambigPages.length) {
        items.push(new OO.ui.MenuSectionOptionWidget({
            data: 'disambigPages',
            label: ve.msg('visualeditor-linkinspector-suggest-disambig-page', disambigPages.length)
        }));
        for (i = 0, len = disambigPages.length; i < len; i++) {
            items.push(new ve.ui.MWInternalLinkMenuOptionWidget({
                data: this.getInternalLinkAnnotationFromTitle(disambigPages[i]),
                pagename: disambigPages[i]
            }));
        }
    }
    if (redirectPages.length) {
        items.push(new OO.ui.MenuSectionOptionWidget({
            data: 'redirectPages',
            label: ve.msg('visualeditor-linkinspector-suggest-redirect-page', redirectPages.length)
        }));
        for (i = 0, len = redirectPages.length; i < len; i++) {
            items.push(new OO.ui.MenuOptionWidget({
                data: this.getInternalLinkAnnotationFromTitle(redirectPages[i]),
                rel: 'redirectPage',
                label: redirectPages[i]
            }));
        }
    }
    return items;
}
 
 
 
 
 
 
 
 
mw.messages.set({
		've-smw-property-annotation-title': 'Add a property',
		've-SMWAnnotationDialog-insert': 'Insert',
		've-SMWAnnotationDialog-from-label': 'Enter a property',
		've-SMWAnnotationDialog-page-label': 'Enter a page',
		've-SMWPropertyAnnotation-ToolbarButton': 'Add SMW annotation'
	});
 
function addPropertyAnnotation(propertyName, pageName){
	var surfaceModel = ve.init.target.getSurface().getModel(),
	title = '';
	if (propertyName !== '') {
		title = propertyName + '::' + pageName;
	} else {
		title = pageName;
	}
	var linkAnnotation = {
		'type': 'link/mwInternal',
		'attributes': {
			'title': title,
			// Page title in canonical form
			'normalizedTitle': ve.dm.MWInternalLinkAnnotation.static.normalizeTitle( title ),
			// Normalized page title without the section part, used e.g. for red/blue link checking
			'lookupTitle': ve.dm.MWInternalLinkAnnotation.static.getLookupTitle( title )
		}
	};
	if ( model ) {
		model.element = linkAnnotation;
		contextItem.renderBody();
	} else {
		surfaceModel.getFragment().annotateContent( 'set', 'link/mwInternal', linkAnnotation );
	}
}
 
ve.ui.SMWAnnotationDialog = function( manager, config ) {
	// Parent constructor
	ve.ui.SMWAnnotationDialog.super.call( this, manager, config );
 
};
/* Inheritance */
 
OO.inheritClass( ve.ui.SMWAnnotationDialog, ve.ui.NodeDialog );
 
ve.ui.SMWAnnotationDialog.prototype.getActionProcess  = function ( action ) {
	var propertyInput = this.propertyInput.getValue();
	var pageInput = this.pageInput.getValue();
 
	if ( action === 'insert' ) {
		return new OO.ui.Process( function () {
			addPropertyAnnotation(propertyInput, pageInput);
			this.close();
		}, this );
	}
	return ve.ui.MWMediaDialog.super.prototype.getActionProcess.call( this, action );
};
 
ve.ui.SMWAnnotationDialog.prototype.getBodyHeight = function () {
	return 150;
};
 
 
/* Static Properties */
ve.ui.SMWAnnotationDialog.static.name = 'smw-property-annotation';
ve.ui.SMWAnnotationDialog.static.title = mw.msg( 've-smw-property-annotation-title' );
ve.ui.SMWAnnotationDialog.static.size = 'medium';
 
ve.ui.SMWAnnotationDialog.static.actions = [
	{
		'action': 'insert',
		'label': mw.msg( 've-SMWAnnotationDialog-insert' ),
		'flags': [ 'constructive' ],
		'modes': 'insert'
	},
	{
		label: OO.ui.deferMsg( 'visualeditor-dialog-action-cancel' ),
		flags: 'safe'
	}
];
 
ve.ui.SMWAnnotationDialog.prototype.getSetupProcess = function( data ) {
	return ve.ui.SMWAnnotationDialog.super.prototype.getSetupProcess.call( this, data )
		.next(function(){
			var selectedText = ve.init.target.getSurface().getModel().getFragment().getText();
			if (selectedText !== '') {
				this.pageInput.setValue(selectedText);
			} else if (valueName !== ''){
				this.pageInput.setValue(valueName);
			}
			if (propertyName !== ''){
				this.propertyInput.setValue(propertyName);
			}
		}, this);
}
ve.ui.SMWAnnotationDialog.prototype.getTeardownProcess = function( data ) {
	return ve.ui.SMWAnnotationDialog.super.prototype.getTeardownProcess.call( this, data )
		.first(function(){
			this.pageInput.setValue('');
			this.propertyInput.setValue('');
		}, this);
}
 
ve.ui.SMWAnnotationDialog.prototype.initialize = function () {
	ve.ui.SMWAnnotationDialog.super.prototype.initialize.call( this );
	this.panel = new OO.ui.PanelLayout( { '$': this.$, 'scrollable': true, 'padded': true } );
	this.inputsFieldset = new OO.ui.FieldsetLayout( {
		'$': this.$
	} );
	// input from
	this.propertyInput = new ve.ui.SMWPropertyLinkTargetInputWidget(
		{ '$': this.$, 'multiline': false }
	);
	this.fromField = new OO.ui.FieldLayout( this.propertyInput, {
		'$': this.$,
		'label': mw.msg( 've-SMWAnnotationDialog-from-label' )
	} );
 
	// input from
	this.pageInput = new ve.ui.MWLinkTargetInputWidget(
		{ '$': this.$, 'multiline': false }
	);
	this.pageInput.$element.find('input').attr( 'id','smw-page-input' );
	this.pageField = new OO.ui.FieldLayout( this.pageInput, {
		'$': this.$,
		'label': mw.msg( 've-SMWAnnotationDialog-page-label' )
	} );
 
	this.inputsFieldset.$element.append(
		this.pageField.$element
	);
 
	this.inputsFieldset.$element.append(
		this.fromField.$element
	);
 
	this.panel.$element.append(	this.inputsFieldset.$element );
	this.$body.append( this.panel.$element );
};
ve.ui.SMWAnnotationDialog.prototype.getReadyProcess = function(){
	return new OO.ui.Process().next( function(){
		$('#smw-page-input').focus();
	});
}
ve.ui.windowFactory.register( ve.ui.SMWAnnotationDialog );
 
 
//---------- tool ------------------
 
function SMWPropertyAnnotation( toolGroup, config ) {
	OO.ui.Tool.call( this, toolGroup, config );
}
 
OO.inheritClass( SMWPropertyAnnotation, OO.ui.Tool );
 
SMWPropertyAnnotation.static.name = 'SMWPropertyAnnotation';
SMWPropertyAnnotation.static.title = mw.msg('ve-SMWPropertyAnnotation-ToolbarButton');
 
SMWPropertyAnnotation.prototype.onSelect = function () {
	this.toolbar.getSurface().execute( 'window', 'open', 'smw-property-annotation', null );
};
 
SMWPropertyAnnotation.prototype.onUpdateState = function () {
	this.setActive( false );
};
 
ve.ui.toolFactory.register( SMWPropertyAnnotation );
mw.hook( 've.activationComplete' ).add(function(){
	shortcut.add("Ctrl+Q",function() {
		ve.init.target.getSurface().execute( 'window', 'open', 'smw-property-annotation', null );
	});
});