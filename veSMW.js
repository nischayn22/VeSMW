alert("This is to check if the right version of the script is loaded. version - 0.4");
 
mw.messages.set({
		've-smw-property-annotation-title': 'Add a property',
		've-SMWAnnotationDialog-insert': 'Insert',
		've-SMWAnnotationDialog-from-label': 'Enter a property',
		've-SMWPropertyAnnotation-ToolbarButton': 'Add SMW annotation'
	});
 
function addPropertyAnnotation(propertyName){
	var surfaceModel = ve.init.target.getSurface().getModel();
	var title = propertyName + '::' + surfaceModel.getFragment().getText();
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
	surfaceModel.getFragment().annotateContent( 'set', 'link/mwInternal', linkAnnotation );
}
 
ve.ui.SMWAnnotationDialog = function( manager, config ) {
	// Parent constructor
	ve.ui.SMWAnnotationDialog.super.call( this, manager, config );
 
};
/* Inheritance */
 
OO.inheritClass( ve.ui.SMWAnnotationDialog, ve.ui.NodeDialog );
 
ve.ui.SMWAnnotationDialog.prototype.getActionProcess  = function ( action ) {
	var propertyInput = this.propertyInput.getValue();
 
	if ( action === 'insert' ) {
		return new OO.ui.Process( function () {
			addPropertyAnnotation(propertyInput);
			this.close();
		}, this );
	}
	return ve.ui.MWMediaDialog.super.prototype.getActionProcess.call( this, action );
}
 
ve.ui.SMWAnnotationDialog.prototype.getBodyHeight = function () {
	return 100;
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
	}
];
 
ve.ui.SMWAnnotationDialog.prototype.initialize = function () {
	ve.ui.SMWAnnotationDialog.super.prototype.initialize.call( this );
	this.panel = new OO.ui.PanelLayout( { '$': this.$, 'scrollable': true, 'padded': true } );
	this.inputsFieldset = new OO.ui.FieldsetLayout( {
		'$': this.$
	} );
	// input from
	this.propertyInput = new OO.ui.TextInputWidget(
		{ '$': this.$, 'multiline': false }
	);
	this.fromField = new OO.ui.FieldLayout( this.propertyInput, {
		'$': this.$,
		'label': mw.msg( 've-SMWAnnotationDialog-from-label' )
	} );
 
	this.inputsFieldset.$element.append(
		this.fromField.$element
	);
 
	this.panel.$element.append(	this.inputsFieldset.$element );
	this.$body.append( this.panel.$element );
}
 
ve.ui.windowFactory.register( ve.ui.SMWAnnotationDialog );
 
 
//---------- replace tool ------------------
 
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