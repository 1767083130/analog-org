// Save a reference to the default domain.
var FCK_ORIGINAL_DOMAIN ;

// Automatically detect the correct document.domain (#123).
(function()
{
	var d = FCK_ORIGINAL_DOMAIN = document.domain ;

	while ( true )
	{
		// Test if we can access a parent property.
		try
		{
			var test = window.parent.document.domain ;
			break ;
		}
		catch( e ) {}

		// Remove a domain part: www.mytest.example.com => mytest.example.com => example.com ...
		d = d.replace( /.*?(?:\.|$)/, '' ) ;

		if ( d.length == 0 )
			break ;		// It was not able to detect the domain.

		try
		{
			document.domain = d ;
		}
		catch (e)
		{
			break ;
		}
	}
})() ;
//------------------------------------------------

// Save a reference to the detected runtime domain.
var FCK_RUNTIME_DOMAIN = document.domain ;

var FCK_IS_CUSTOM_DOMAIN = ( FCK_ORIGINAL_DOMAIN != FCK_RUNTIME_DOMAIN ) ;

// Instead of loading scripts and CSSs using inline tags, all scripts are
// loaded by code. In this way we can guarantee the correct processing order,
// otherwise external scripts and inline scripts could be executed in an
// unwanted order (IE).

// Editor Instance Status.
var FCK_STATUS_NOTLOADED	= window.parent.FCK_STATUS_NOTLOADED	= 0 ;
var FCK_STATUS_ACTIVE		= window.parent.FCK_STATUS_ACTIVE		= 1 ;
var FCK_STATUS_COMPLETE		= window.parent.FCK_STATUS_COMPLETE		= 2 ;

// Edit Mode
var FCK_EDITMODE_WYSIWYG	= window.parent.FCK_EDITMODE_WYSIWYG	= 0 ;
var FCK_EDITMODE_SOURCE		= window.parent.FCK_EDITMODE_SOURCE		= 1 ;

String.prototype.Contains = function( textToCheck )
{
	return ( this.indexOf( textToCheck ) > -1 ) ;
}

// Extends the String object, creating a "EndsWith" method on it.
String.prototype.EndsWith = function( value, ignoreCase )
{
	var L1 = this.length ;
	var L2 = value.length ;

	if ( L2 > L1 )
		return false ;

	if ( ignoreCase )
	{
		var oRegex = new RegExp( value + '$' , 'i' ) ;
		return oRegex.test( this ) ;
	}
	else
		return ( L2 == 0 || this.substr( L1 - L2, L2 ) == value ) ;
}

var s = navigator.userAgent.toLowerCase() ;

var FCKBrowserInfo =
{
	IsIE		: /*@cc_on!@*/false,
	IsIE7		: /*@cc_on!@*/false && ( parseInt( s.match( /msie (\d+)/ )[1], 10 ) >= 7 ),
	IsIE6		: /*@cc_on!@*/false && ( parseInt( s.match( /msie (\d+)/ )[1], 10 ) >= 6 ),
	IsSafari	: s.Contains(' applewebkit/'),		// Read "IsWebKit"
	IsOpera		: !!window.opera,
	IsAIR		: s.Contains(' adobeair/'),
	IsMac		: s.Contains('macintosh')
} ;

// Completes the browser info with further Gecko information.
(function( browserInfo )
{
	browserInfo.IsGecko = ( navigator.product == 'Gecko' ) && !browserInfo.IsSafari && !browserInfo.IsOpera ;
	browserInfo.IsGeckoLike = ( browserInfo.IsGecko || browserInfo.IsSafari || browserInfo.IsOpera ) ;

	if ( browserInfo.IsGecko )
	{
		var geckoMatch = s.match( /rv:(\d+\.\d+)/ ) ;
		var geckoVersion = geckoMatch && parseFloat( geckoMatch[1] ) ;

		// Actually "10" refers to Gecko versions before Firefox 1.5, when
		// Gecko 1.8 (build 20051111) has been released.

		// Some browser (like Mozilla 1.7.13) may have a Gecko build greater
		// than 20051111, so we must also check for the revision number not to
		// be 1.7 (we are assuming that rv < 1.7 will not have build > 20051111).

		if ( geckoVersion )
		{
			browserInfo.IsGecko10 = ( geckoVersion < 1.8 ) ;
			browserInfo.IsGecko19 = ( geckoVersion > 1.8 ) ;
		}
	}
})(FCKBrowserInfo) ;

var FCKEvents = function( eventsOwner )
{
	this.Owner = eventsOwner ;
	this._RegisteredEvents = new Object() ;
}

FCKEvents.prototype.AttachEvent = function( eventName, functionPointer )
{
	var aTargets ;

	if ( !( aTargets = this._RegisteredEvents[ eventName ] ) )
		this._RegisteredEvents[ eventName ] = [ functionPointer ] ;
	else
	{
		// Check that the event handler isn't already registered with the same listener
		// It doesn't detect function pointers belonging to an object (at least in Gecko)
		if ( aTargets.IndexOf( functionPointer ) == -1 )
			aTargets.push( functionPointer ) ;
	}
}

FCKEvents.prototype.FireEvent = function( eventName, params )
{
	var bReturnValue = true ;

	var oCalls = this._RegisteredEvents[ eventName ] ;

	if ( oCalls )
	{
		for ( var i = 0 ; i < oCalls.length ; i++ )
		{
			try
			{
				bReturnValue = ( oCalls[ i ]( this.Owner, params ) && bReturnValue ) ;
			}
			catch(e)
			{
				// Ignore the following error. It may happen if pointing to a
				// script not anymore available (#934):
				// -2146823277 = Can't execute code from a freed script
				if ( e.number != -2146823277 )
					throw e ;
			}
		}
	}

	return bReturnValue ;
}

// FCK represents the active editor instance.
var FCK =
{
} ;

FCK.Events = new FCKEvents( FCK ) ;

// DEPRECATED in favor or "GetData".
FCK.GetHTML	= FCK.GetXHTML = FCK.GetData ;

// DEPRECATED in favor of "SetData".
FCK.SetHTML = FCK.SetData ;

// InsertElementAndGetIt and CreateElement are Deprecated : returns the same value as InsertElement.
FCK.InsertElementAndGetIt = FCK.CreateElement = FCK.InsertElement ;

// Replace all events attributes (like onclick).
function _FCK_ProtectEvents_ReplaceTags( tagMatch )
{
	return tagMatch.replace( FCKRegexLib.EventAttributes, _FCK_ProtectEvents_ReplaceEvents ) ;
}

// Replace an event attribute with its respective __fckprotectedatt attribute.
// The original event markup will be encoded and saved as the value of the new
// attribute.
function _FCK_ProtectEvents_ReplaceEvents( eventMatch, attName )
{
	return ' ' + attName + '_fckprotectedatt="' + encodeURIComponent( eventMatch ) + '"' ;
}

function _FCK_ProtectEvents_RestoreEvents( match, encodedOriginal )
{
	return decodeURIComponent( encodedOriginal ) ;
}

// # Focus Manager: Manages the focus in the editor.
var FCKFocusManager = FCK.FocusManager =
{
	IsLocked : false,
	Lock : function()
	{
		this.IsLocked = true ;
	},

	Unlock : function()
	{
		if ( this._HasPendingBlur )
			FCKFocusManager._Timer = window.setTimeout( FCKFocusManager_FireOnBlur, 100 ) ;

		this.IsLocked = false ;
	}
} ;


var FCKConfig = FCK.Config = new Object() ;

/*
	For the next major version (probably 3.0) we should move all this stuff to
	another dedicated object and leave FCKConfig as a holder object for settings only).
*/

// There is a bug in Gecko. If the editor is hidden on startup, an error is
// thrown when trying to get the screen dimensions.
try
{
	FCKConfig.ScreenWidth	= screen.width ;
	FCKConfig.ScreenHeight	= screen.height ;
}
catch (e)
{
	FCKConfig.ScreenWidth	= 800 ;
	FCKConfig.ScreenHeight	= 600 ;
}


var FCKDomTools =
{
	RemoveNode : function( node, excludeChildren )
	{
	    if(node && node.parentNode){
		    if ( excludeChildren ){
			    // Move all children before the node.
			    var eChild ;
			    while ( (eChild = node.firstChild) )
				    node.parentNode.insertBefore( node.removeChild( eChild ), node ) ;
		    }

		    return node.parentNode.removeChild( node ) ;
		}
		
		return null;
	},
	
	SetElementStyles : function( element, styleDict )
	{
		var style = element.style ;
		for ( var styleName in styleDict )
			style[ styleName ] = styleDict[ styleName ] ;
	},

	SetOpacity : function( element, opacity )
	{
		if ( FCKBrowserInfo.IsIE )
		{
			opacity = Math.round( opacity * 100 ) ;
			element.style.filter = ( opacity > 100 ? '' : 'progid:DXImageTransform.Microsoft.Alpha(opacity=' + opacity + ')' ) ;
		}
		else
			element.style.opacity = opacity ;
	},

	GetCurrentElementStyle : function( element, propertyName )
	{
		if ( FCKBrowserInfo.IsIE )
			return element.currentStyle[ propertyName ] ;
		else
			return element.ownerDocument.defaultView.getComputedStyle( element, '' ).getPropertyValue( propertyName ) ;
	},

	GetPositionedAncestor : function( element )
	{
		var currentElement = element ;

		while ( currentElement != FCKTools.GetElementDocument( currentElement ).documentElement )
		{
			if ( this.GetCurrentElementStyle( currentElement, 'position' ) != 'static' )
				return currentElement ;

			if ( currentElement == FCKTools.GetElementDocument( currentElement ).documentElement
					&& currentWindow != w )
				currentElement = currentWindow.frameElement ;
			else
				currentElement = currentElement.parentNode ;
		}

		return null ;
	}
} ;

var FCKTools = new Object() ;

FCKTools.GetStyleHtml = (function()
{
	var getStyle = function( styleDef, markTemp )
	{
		if ( styleDef.length == 0 )
			return '' ;

		var temp = markTemp ? ' _fcktemp="true"' : '' ;
		return '<' + 'style type="text/css"' + temp + '>' + styleDef + '<' + '/style>' ;
	}

	var getLink = function( cssFileUrl, markTemp )
	{
		if ( cssFileUrl.length == 0 )
			return '' ;

		var temp = markTemp ? ' _fcktemp="true"' : '' ;
		return '<' + 'link href="' + cssFileUrl + '" type="text/css" rel="stylesheet" ' + temp + '/>' ;
	}

	return function( cssFileOrArrayOrDef, markTemp )
	{
		if ( !cssFileOrArrayOrDef )
			return '' ;

		if ( typeof( cssFileOrArrayOrDef ) == 'string' )
		{
			// Test if the passed argument is an URL.
			if ( /[\\\/\.][^{}]*$/.test( cssFileOrArrayOrDef ) )
			{
				// The string may have several URLs separated by comma.
				return this.GetStyleHtml( cssFileOrArrayOrDef.split(','), markTemp ) ;
			}
			else
				return getStyle( this._GetUrlFixedCss( cssFileOrArrayOrDef ), markTemp ) ;
		}
		else
		{
			var html = '' ;

			for ( var i = 0 ; i < cssFileOrArrayOrDef.length ; i++ )
				html += getLink( cssFileOrArrayOrDef[i], markTemp ) ;

			return html ;
		}
	}
})() ;

FCKTools.GetElementDocument = function ( element )
{
	return element.ownerDocument || element.document ;
}

// Get the window object where the element is placed in.
FCKTools.GetElementWindow = function( element )
{
	return this.GetDocumentWindow( this.GetElementDocument( element ) ) ;
}

FCKTools.GetDocumentWindow = function( document )
{
	// With Safari, there is not way to retrieve the window from the document, so we must fix it.
	if ( FCKBrowserInfo.IsSafari && !document.parentWindow )
		this.FixDocumentParentWindow( window.top ) ;

	return document.parentWindow || document.defaultView ;
}

/*
	This is a Safari specific function that fix the reference to the parent
	window from the document object.
*/
FCKTools.FixDocumentParentWindow = function( targetWindow )
{
	if ( targetWindow.document )
		targetWindow.document.parentWindow = targetWindow ;

	for ( var i = 0 ; i < targetWindow.frames.length ; i++ )
		FCKTools.FixDocumentParentWindow( targetWindow.frames[i] ) ;
}


FCKTools.SetTimeout = function( func, milliseconds, thisObject, paramsArray, timerWindow )
{
	return ( timerWindow || window ).setTimeout(
		function()
		{
			if ( paramsArray )
				func.apply( thisObject, [].concat( paramsArray ) ) ;
			else
				func.apply( thisObject ) ;
		},
		milliseconds ) ;
}

FCKTools.SetInterval = function( func, milliseconds, thisObject, paramsArray, timerWindow )
{
	return ( timerWindow || window ).setInterval(
		function()
		{
			func.apply( thisObject, paramsArray || [] ) ;
		},
		milliseconds ) ;
}



FCKTools.CreateEventListener = function( func, params )
{
	var f = function()
	{
		var aAllParams = [] ;

		for ( var i = 0 ; i < arguments.length ; i++ )
			aAllParams.push( arguments[i] ) ;

		func.apply( this, aAllParams.concat( params ) ) ;
	}

	return f ;
}

FCKTools.IsStrictMode = function( document )
{
	// There is no compatMode in Safari, but it seams that it always behave as
	// CSS1Compat, so let's assume it as the default for that browser.
	return ( 'CSS1Compat' == ( document.compatMode || ( FCKBrowserInfo.IsSafari ? 'CSS1Compat' : null ) ) ) ;
}

FCKTools.GetDocumentPosition = function( w, node )
{
	var x = 0 ;
	var y = 0 ;
	var curNode = node ;
	var prevNode = null ;
	var curWindow = FCKTools.GetElementWindow( curNode ) ;
	while ( curNode && !( curWindow == w && ( curNode == w.document.body || curNode == w.document.documentElement ) ) )
	{
		x += curNode.offsetLeft - curNode.scrollLeft ;
		y += curNode.offsetTop - curNode.scrollTop ;

		if ( ! FCKBrowserInfo.IsOpera )
		{
			var scrollNode = prevNode ;
			while ( scrollNode && scrollNode != curNode )
			{
				x -= scrollNode.scrollLeft ;
				y -= scrollNode.scrollTop ;
				scrollNode = scrollNode.parentNode ;
			}
		}

		prevNode = curNode ;
		if ( curNode.offsetParent )
			curNode = curNode.offsetParent ;
		else
		{
			if ( curWindow != w )
			{
				curNode = curWindow.frameElement ;
				prevNode = null ;
				if ( curNode )
					curWindow = curNode.contentWindow.parent ;
			}
			else
				curNode = null ;
		}
	}

	// document.body is a special case when it comes to offsetTop and offsetLeft values.
	// 1. It matters if document.body itself is a positioned element;
	// 2. It matters is when we're in IE and the element has no positioned ancestor.
	// Otherwise the values should be ignored.
	if ( FCKDomTools.GetCurrentElementStyle( w.document.body, 'position') != 'static'
			|| ( FCKBrowserInfo.IsIE && FCKDomTools.GetPositionedAncestor( node ) == null ) )
	{
		x += w.document.body.offsetLeft ;
		y += w.document.body.offsetTop ;
	}

	return { "x" : x, "y" : y } ;
}

/**
 * Binding the "this" reference to an object for a function.
 */
FCKTools.Bind = function( subject, func )
{
  return function(){ return func.apply( subject, arguments ) ; } ;
}

/**
 * Retrieve the correct "empty iframe" URL for the current browser, which
 * causes the minimum fuzz (e.g. security warnings in HTTPS, DNS error in
 * IE5.5, etc.) for that browser, making the iframe ready to DOM use whithout
 * having to loading an external file.
 */
FCKTools.GetVoidUrl = function()
{
	if ( FCK_IS_CUSTOM_DOMAIN )
		return "javascript: void( function(){" +
			"document.open();" +
			"document.write('<html><head><title></title></head><body></body></html>');" +
			"document.domain = '" + FCK_RUNTIME_DOMAIN + "';" +
			"document.close();" +
			"}() ) ;";

	if ( FCKBrowserInfo.IsIE )
	{
		if ( FCKBrowserInfo.IsIE7 || !FCKBrowserInfo.IsIE6 )
			return "" ;					// IE7+ / IE5.5
		else
			return "javascript: '';" ;	// IE6+
	}

	return "javascript: void(0);" ;		// All other browsers.
}

FCKTools.ResetStyles = function( element )
{
	element.style.cssText = 'margin:0;' +
		'padding:0;' +
		'border:0;' +
		'background-color:transparent;' +
		'background-image:none;' ;
}

FCKTools.CancelEvent = function( e )
{
	return false ;
}

// Appends one or more CSS files to a document.
FCKTools._AppendStyleSheet = function( documentElement, cssFileUrl )
{
	return documentElement.createStyleSheet( cssFileUrl ).owningElement ;
}

// Appends a CSS style string to a document.
FCKTools.AppendStyleString = function( documentElement, cssStyles )
{
	if ( !cssStyles )
		return null ;

	var s = documentElement.createStyleSheet( "" ) ;
	s.cssText = cssStyles ;
	return s ;
}

// Removes all attributes and values from the element.
FCKTools.ClearElementAttributes = function( element )
{
	element.clearAttributes() ;
}

FCKTools.DisableSelection = function( element )
{
	element.unselectable = 'on' ;

	var e, i = 0 ;
	// The extra () is to avoid a warning with strict error checking. This is ok.
	while ( (e = element.all[ i++ ]) )
	{
		switch ( e.tagName )
		{
			case 'IFRAME' :
			case 'TEXTAREA' :
			case 'INPUT' :
			case 'SELECT' :
				/* Ignore the above tags */
				break ;
			default :
				e.unselectable = 'on' ;
		}
	}
}

FCKTools.GetScrollPosition = function( relativeWindow )
{
	var oDoc = relativeWindow.document ;

	// Try with the doc element.
	var oPos = { X : oDoc.documentElement.scrollLeft, Y : oDoc.documentElement.scrollTop } ;

	if ( oPos.X > 0 || oPos.Y > 0 )
		return oPos ;

	// If no scroll, try with the body.
	return { X : oDoc.body.scrollLeft, Y : oDoc.body.scrollTop } ;
}

FCKTools.AddEventListener = function( sourceObject, eventName, listener )
{
    //sourceObject.attachEvent( 'on' + eventName, listener ) ;
	if (sourceObject.addEventListener)
		sourceObject.addEventListener(eventName, listener, false);
	else if (sourceObject.attachEvent)
		sourceObject.attachEvent("on" + eventName, listener);
}

FCKTools.RemoveEventListener = function( sourceObject, eventName, listener )
{
    //sourceObject.detachEvent( 'on' + eventName, listener );
	if (sourceObject.removeEventListener)
		sourceObject.removeEventListener(eventName, listener, false);
	else if (sourceObject.detachEvent)
		sourceObject.detachEvent("on" + eventName, listener);
}

// Listeners attached with this function cannot be detached.
FCKTools.AddEventListenerEx = function( sourceObject, eventName, listener, paramsArray )
{
	// Ok... this is a closures party, but is the only way to make it clean of memory leaks.
	var o = new Object() ;
	o.Source = sourceObject ;
	o.Params = paramsArray || [] ;	// Memory leak if we have DOM objects here.
	o.Listener = function( ev )
	{
		return listener.apply( o.Source, [ ev ].concat( o.Params ) ) ;
	}

	if ( FCK.IECleanup )
		FCK.IECleanup.AddItem( null, function() { o.Source = null ; o.Params = null ; } ) ;

	sourceObject.attachEvent( 'on' + eventName, o.Listener ) ;

	sourceObject = null ;	// Memory leak cleaner (because of the above closure).
	paramsArray = null ;	// Memory leak cleaner (because of the above closure).
}

// Returns and object with the "Width" and "Height" properties.
FCKTools.GetViewPaneSize = function( win )
{
	var oSizeSource ;

	var oDoc = win.document.documentElement ;
	if ( oDoc && oDoc.clientWidth )				// IE6 Strict Mode
		oSizeSource = oDoc ;
	else
		oSizeSource = win.document.body ;		// Other IEs

	if ( oSizeSource )
		return { Width : oSizeSource.clientWidth, Height : oSizeSource.clientHeight } ;
	else
		return { Width : 0, Height : 0 } ;
}

FCKTools.SaveStyles = function( element )
{
	var data = FCKTools.ProtectFormStyles( element ) ;

	var oSavedStyles = new Object() ;

	if ( element.className.length > 0 )
	{
		oSavedStyles.Class = element.className ;
		element.className = '' ;
	}

	var sInlineStyle = element.style.cssText ;

	if ( sInlineStyle.length > 0 )
	{
		oSavedStyles.Inline = sInlineStyle ;
		element.style.cssText = '' ;
	}

	FCKTools.RestoreFormStyles( element, data ) ;
	return oSavedStyles ;
}

FCKTools.RestoreStyles = function( element, savedStyles )
{
	var data = FCKTools.ProtectFormStyles( element ) ;
	element.className		= savedStyles.Class || '' ;
	element.style.cssText	= savedStyles.Inline || '' ;
	FCKTools.RestoreFormStyles( element, data ) ;
}

FCKTools.RegisterDollarFunction = function( targetWindow )
{
	targetWindow.$ = targetWindow.document.getElementById ;
}

FCKTools.AppendElement = function( target, elementName )
{
	return target.appendChild( this.GetElementDocument( target ).createElement( elementName ) ) ;
}

// This function may be used by Regex replacements.
FCKTools.ToLowerCase = function( strValue )
{
	return strValue.toLowerCase() ;
}

var WnkDialog = ( function()
{
	var topDialog ;
	var baseZIndex ;
	var cover ;

	// The document that holds the dialog.
	var topWindow = window.parent ;

	while ( topWindow.parent && topWindow.parent != topWindow )
	{
		try
		{
			if ( topWindow.parent.document.domain != document.domain )
				break ;
			if ( topWindow.parent.document.getElementsByTagName( 'frameset' ).length > 0 )
				break ;
		}
		catch ( e )
		{
			break ;
		}
		topWindow = topWindow.parent ;
	}

	var topDocument = topWindow.document ;

	var getZIndex = function()
	{
		if ( !baseZIndex )
		{
		    baseZIndex = 10000;
			//baseZIndex = FCKConfig.FloatingPanelsZIndex + 999 ; //updated by webnuke FCKConfig.FloatingPanelsZIndex的值为10000
	    }
		return ++baseZIndex ;
	}

	// TODO : This logic is not actually working when reducing the window, only
	// when enlarging it.
	var resizeHandler = function()
	{
		if ( !cover )
			return ;

		var relElement = FCKTools.IsStrictMode( topDocument ) ? topDocument.documentElement : topDocument.body ;

		FCKDomTools.SetElementStyles( cover,
			{
				'width' : Math.max( relElement.scrollWidth,
					relElement.clientWidth,
					topDocument.scrollWidth || 0 ) - 1 + 'px',
				'height' : Math.max( relElement.scrollHeight,
					relElement.clientHeight,
					topDocument.scrollHeight || 0 ) - 1 + 'px'
			} ) ;
	}

	return {
		/**
		 * Opens a dialog window using the standard dialog template.
		 *dialogName:名称；dialogTitle：弹出窗体标题；width：弹出窗体宽度；height：弹出窗体高度；parentWindow
		 *resizable:窗体是否能改变大小；basePath：代码所在的文件夹
		 */
		OpenDialog : function( dialogName, dialogTitle, dialogPage, width, height, customValue, parentWindow, resizable,basePath)
		{   
		    if(!basePath){
		        // Editor Base Path
                if ( document.location.protocol == 'file:' )
                {
	                FCKConfig.BasePath = decodeURIComponent( document.location.pathname.substr(1) ) ;
	                FCKConfig.BasePath = FCKConfig.BasePath.replace( /\\/gi, '/' ) ;

	                // The way to address local files is different according to the OS.
	                // In Windows it is file:// but in MacOs it is file:/// so let's get it automatically
	                var sFullProtocol = document.location.href.match( /^(file\:\/{2,3})/ )[1] ;
	                // #945 Opera does strange things with files loaded from the disk, and it fails in Mac to load xml files
	                if ( FCKBrowserInfo.IsOpera )
		                sFullProtocol += 'localhost/' ;

	                FCKConfig.BasePath = sFullProtocol + FCKConfig.BasePath.substring( 0, FCKConfig.BasePath.lastIndexOf( '/' ) + 1) ;
                }
                else
                {
	                FCKConfig.BasePath = document.location.protocol + '//' + document.location.host +
		                document.location.pathname.substring( 0, document.location.pathname.lastIndexOf( '/' ) + 1) ;
		        }
		    }
		    else{
		        FCKConfig.BasePath = basePath;
		    }
		    
		    if(!FCKConfig.BasePath.EndsWith("/")){
		        FCKConfig.BasePath = basePath + "/";
		    }
		    
		    FCKConfig.SkinPath = FCKConfig.BasePath + 'skins/default/' ;
            FCKConfig.SkinDialogCSS = FCKConfig.SkinPath + 'fck_dialog.css';
            
			if ( !topDialog )
				this.DisplayMainCover() ;

			// Setup the dialog info to be passed to the dialog.
			var dialogInfo =
			{
				Title : dialogTitle,
				Page : dialogPage,
				Editor : window,
				CustomValue : customValue,		// Optional
				TopWindow : topWindow
			}

//			FCK.ToolbarSet.CurrentInstance.Selection.Save( true ) ;

			// Calculate the dialog position, centering it on the screen.
			var viewSize = FCKTools.GetViewPaneSize( topWindow ) ;
			var scrollPosition = { 'X' : 0, 'Y' : 0 } ;
			var useAbsolutePosition = FCKBrowserInfo.IsIE && ( !FCKBrowserInfo.IsIE7 || !FCKTools.IsStrictMode( topWindow.document ) ) ;
			if ( useAbsolutePosition )
				scrollPosition = FCKTools.GetScrollPosition( topWindow ) ;
			var iTop  = Math.max( scrollPosition.Y + ( viewSize.Height - height - 20 ) / 2, 0 ) ;
			var iLeft = Math.max( scrollPosition.X + ( viewSize.Width - width - 20 )  / 2, 0 ) ;
            
			// Setup the IFRAME that will hold the dialog.
			var dialog = topDocument.createElement( 'iframe' ) ;
			FCKTools.ResetStyles( dialog ) ;
			dialog.src = FCKConfig.BasePath + 'fckdialog.html' ;

			// Dummy URL for testing whether the code in fckdialog.js alone leaks memory.
			// dialog.src = 'about:blank';

			dialog.frameBorder = 0 ;
			dialog.allowTransparency = true ;
			FCKDomTools.SetElementStyles( dialog,
					{
						'position'	: ( useAbsolutePosition ) ? 'absolute' : 'fixed',
						'top'		: iTop + 'px',
						'left'		: iLeft + 'px',
						'width'		: width + 'px',
						'height'	: height + 'px',
						'zIndex'	: getZIndex()
					} ) ;

			// Save the dialog info to be used by the dialog page once loaded.
			dialog._DialogArguments = dialogInfo ;

			// Append the IFRAME to the target document.
			topDocument.body.appendChild( dialog ) ;
			// Keep record of the dialog's parent/child relationships.
			//dialog._ParentDialog = null ;
			dialog._ParentDialog = null ;
			dialog._Opener = parentWindow;
			topDialog = dialog ;
		},

		/**
		 * (For internal use)
		 * Called when the top dialog is closed.
		 */
		OnDialogClose : function( dialogWindow )
		{
			var dialog = dialogWindow.frameElement ;
			FCKDomTools.RemoveNode( dialog) ;

			if ( dialog._ParentDialog )		// Nested Dialog.
			{
				topDialog = dialog._ParentDialog ;
				dialog._ParentDialog.contentWindow.SetEnabled( true ) ;
			}
			else							// First Dialog.
			{
				// Set the Focus in the browser, so the "OnBlur" event is not
				// fired. In IE, there is no need to do that because the dialog
				// already moved the selection to the editing area before
				// closing (EnsureSelection). Also, the Focus() call here
				// causes memory leak on IE7 (weird).
				if ( !FCKBrowserInfo.IsIE )
					FCK.Focus() ;

				this.HideMainCover() ;
				// Bug #1918: Assigning topDialog = null directly causes IE6 to crash.
				setTimeout( function(){ topDialog = null ; }, 0 ) ;

				// Release the previously saved selection.
//				FCK.ToolbarSet.CurrentInstance.Selection.Release() ;
			}
		},

		DisplayMainCover : function()
		{
			// Setup the DIV that will be used to cover.
			cover = topDocument.createElement( 'div' ) ;
			FCKTools.ResetStyles( cover ) ;
			FCKDomTools.SetElementStyles( cover,
				{
					'position' : 'absolute',
					'zIndex' : getZIndex(),
					'top' : '0px',
					'left' : '0px',
					'backgroundColor' : '#ffffff'
				} ) ;
			FCKDomTools.SetOpacity( cover, 0.5 ) ;

			// For IE6-, we need to fill the cover with a transparent IFRAME,
			// to properly block <select> fields.
			if ( FCKBrowserInfo.IsIE && !FCKBrowserInfo.IsIE7 )
			{
				var iframe = topDocument.createElement( 'iframe' ) ;
				FCKTools.ResetStyles( iframe ) ;
				iframe.hideFocus = true ;
				iframe.frameBorder = 0 ;
				iframe.src = FCKTools.GetVoidUrl() ;
				FCKDomTools.SetElementStyles( iframe,
					{
						'width' : '100%',
						'height' : '100%',
						'position' : 'absolute',
						'left' : '0px',
						'top' : '0px',
						'filter' : 'progid:DXImageTransform.Microsoft.Alpha(opacity=0)'
					} ) ;
				cover.appendChild( iframe ) ;
			}
             
			// We need to manually adjust the cover size on resize.
			FCKTools.AddEventListener( topWindow, 'resize', resizeHandler ) ;
			resizeHandler();

			topDocument.body.appendChild( cover ) ;

			FCKFocusManager.Lock() ;

			// Prevent the user from refocusing the disabled
			// editing window by pressing Tab. (Bug #2065)
//			var el = FCK.ToolbarSet.CurrentInstance.GetInstanceObject( 'frameElement' ) ;
//			el._fck_originalTabIndex = el.tabIndex ;
//			el.tabIndex = -1 ;
		},

		HideMainCover : function()
		{
			FCKDomTools.RemoveNode( cover ) ;
			FCKFocusManager.Unlock() ;

			// Revert the tab index hack. (Bug #2065)
//			var el = FCK.ToolbarSet.CurrentInstance.GetInstanceObject( 'frameElement' ) ;
//			el.tabIndex = el._fck_originalTabIndex ;
//			FCKDomTools.ClearElementJSProperty( el, '_fck_originalTabIndex' ) ;
		},

		GetCover : function()
		{
			return cover ;
		}
	} ;
} )() ;


