define('plugins',['jquery'],function (jQuery) {

/*!
	fancyInput v1
	(c) 2013 Yair Even Or <http://dropthebit.com>
	
	MIT-style license.
*/

;(function($){
	"use strict";
	var isIe = !!window.ActiveXObject,
		letterHeight;

	$.fn.fancyInput = function(){
		if( !isIe )
			init( this );
		return this;
	}

	var fancyInput = {
		classToggler : 'state1',

		keypress : function(e){
			var charString = String.fromCharCode(e.charCode),
				textCont = this.nextElementSibling,
				appendIndex = this.selectionEnd,
				newLine = this.tagName == 'TEXTAREA' && e.keyCode == 13;

      if(e.keyCode == 13){
        return;
      }

			if( (this.selectionEnd - this.selectionStart) > 0 && e.charCode && !e.ctrlKey ){
				var rangeToDel = [this.selectionStart, this.selectionEnd];
				appendIndex = this.selectionStart;

				if( charDir.lastDir == 'rtl' ){ // BIDI support
					rangeToDel = [this.value.length - this.selectionEnd, this.value.length - this.selectionStart + 1];
					//appendIndex = this.value.length;
				}

				fancyInput.removeChars(textCont, rangeToDel);
			}

			if( e.charCode && !e.ctrlKey || newLine ){
				var dir = charDir.check(charString); // BIDI support
				if( dir == 'rtl' || (dir == '' && charDir.lastDir == 'rtl' ) )
					appendIndex = this.value.length - this.selectionStart;

				if( newLine ){
					charString = '';
        }

				fancyInput.writer(charString, this, appendIndex);
			}
		},

		// Clalculate letter height for the Carot, after first letter have been typed, or text pasted (only once)
		setCaretHeight : function(input){
			var lettersWrap = $(input.nextElementSibling);
			if( !lettersWrap.find('span').length )
				return false;
			letterHeight = lettersWrap.find('span')[0].clientHeight;
			lettersWrap.find('b').height(letterHeight);
		},

		writer : function(charString, input, appendIndex){
			var chars = $(input.nextElementSibling).children().not('b'),  // select all characters including <br> (which is a new line)
				newCharElm = document.createElement('span');

			if( charString == ' ' ) // space
				charString = '&nbsp;';

			if( charString ){
				newCharElm.innerHTML = '&bull;';
				this.classToggler = this.classToggler == 'state2' ? 'state1' : 'state2';
				newCharElm.className = this.classToggler;
			}
			else
				newCharElm = document.createElement('br');

			if( chars.length ){
				if( appendIndex == 0 ) 
					$(input.nextElementSibling).prepend(newCharElm);
				else{
					var appendPos = chars.eq(--appendIndex);
					appendPos.after(newCharElm);
				}
			}
			else
				input.nextElementSibling.appendChild(newCharElm);

			// let the render tree settle down with the new class, then remove it
			if( charString)
				setTimeout(function(){
					newCharElm.removeAttribute("class");
				},20);

			return this;
		},

		clear : function(textCont){
			var caret = $(textCont.parentNode).find('.caret');
			$(textCont).html(caret);
		},

		// insert bulk text (unlike the "writer" fucntion which is for single character only)
		fillText : function(text, input){
			var charsCont = input.nextElementSibling, 
				newCharElm,
				frag = document.createDocumentFragment();

			fancyInput.clear( input.nextElementSibling );

			setTimeout( function(){
				var length = text.length;

				for( var i=0; i < length; i++ ){
					var newElm = 'span';
					//fancyInput.writer( text[i], input, i);
					if( text[i] == '\n' )
						newElm = 'br';
					newCharElm = document.createElement(newElm);
					newCharElm.innerHTML = (text[i] == ' ') ? '&nbsp;' : text[i];
					frag.appendChild(newCharElm);
				}
				charsCont.appendChild(frag);
			},0);
		},

		// Handles characters removal from the fake text input
		removeChars : function(el, range){
			var allChars = $(el).children().not('b').not('.deleted'), 
				caret = $(el).find('b'),
				charsToRemove;

			if( range[0] == range[1] )
				range[0]--;

			charsToRemove = allChars.slice(range[0], range[1]);

			if( range[1] - range[0] == 1 ){
				charsToRemove.css('position','absolute');
				setTimeout(function(){ // Chrome must wait for the position:absolute to be rendered
					charsToRemove.addClass('deleted');
				},0);
				setTimeout(function(){
					charsToRemove.remove();
				},140);
			}
			else
				charsToRemove.remove();
		},

		// recalculate textarea height or input width
		inputResize : function(el){
			if( el.tagName == 'TEXTAREA' ){
				el.style.top = '-999px';
				var newHeight = el.parentNode.scrollHeight;

				if( $(el).outerHeight() < el.parentNode.scrollHeight )
					newHeight += 10;

				el.style.height = newHeight + 'px';
				el.style.top = '0';

				// must re-adjust scrollTop after pasting long text
				setTimeout(function(){
					el.scrollTop = 0;
					el.parentNode.scrollTop = 9999;
				},50);
			}
			if( el.tagName == 'INPUT' && el.type == 'text' ){
				el.style.width = 0;
				var newWidth = el.parentNode.scrollWidth
				// if there is a scroll (or should be) adjust with some extra width
				if( el.parentNode.scrollWidth > el.parentNode.clientWidth )
					newWidth += 20;

				el.style.width = newWidth + 'px';
				// re-adjustment
				//el.scrollLeft = 9999;
				//el.parentNode.scrollLeft += offset;
			}
		},

		keydown : function(e){
			var charString = String.fromCharCode(e.charCode),
				textCont = this.nextElementSibling,  // text container DIV
				appendIndex = this.selectionEnd,
				undo = (e.ctrlKey && e.keyCode == 90) || (e.altKey && e.keyCode == 8),
				redo = e.ctrlKey && e.keyCode == 89,
				selectAll = e.ctrlKey && e.keyCode == 65;

			fancyInput.textLength = this.value.length; // save a referece to later check if text was added in the "allEvents" callback
			fancyInput.setCaret(this);

			if( selectAll )
				return true;

			if( undo || redo ){
				// give the undo time actually remove the text from the DOM
				setTimeout( function(){
					fancyInput.fillText(e.target.value, e.target);
				}, 50);
				return true;
			}

			// if BACKSPACE or DELETE

			if( e.keyCode == 8 || (e.keyCode == 46 && this.selectionEnd > this.selectionStart) ){
				var selectionRange = [this.selectionStart, this.selectionEnd];

				if( charDir.lastDir == 'rtl' ) // BIDI support
					selectionRange = [this.value.length - this.selectionEnd, this.value.length - this.selectionStart + 1];

				setTimeout(function(){ 
					if( e.ctrlKey ) // when doing CTRL + BACKSPACE, needs to wait until the text was actually removed
						selectionRange = [e.target.selectionStart, selectionRange[0]];
					fancyInput.removeChars(textCont, selectionRange);
				},0);
			}

			// make sure to reset the container scrollLeft when caret is the the START or ar the END
			if( this.selectionStart == 0 )
				this.parentNode.scrollLeft = 0;

			return true;
		},

		allEvents : function(e){
			fancyInput.setCaret(this);

			if( e.type == 'paste' ){
				setTimeout(function(){
					fancyInput.fillText(e.target.value, e.target);
					fancyInput.inputResize(e.target);
				},20);
			}
			if( e.type == 'cut' ){
				fancyInput.removeChars(this.nextElementSibling, [this.selectionStart, this.selectionEnd]);
			}

			if( e.type == 'select' ){
			}

			if( fancyInput.textLength != e.target.value.length ) // only resize if text was changed
				fancyInput.inputResize(e.target);

			// The caret height should be set. only once after the first character was entered.
			if( !letterHeight ){
				// in case text was pasted, wait for it to actually render
				setTimeout(function(){ fancyInput.setCaretHeight(e.target) }, 150);
			}

			if( this.selectionStart == this.value.length )
				this.parentNode.scrollLeft = 999999; // this.parentNode.scrollLeftMax
		},

		setCaret : function(input){
			var caret = $(input.parentNode).find('.caret'),
				allChars =  $(input.nextElementSibling).children().not('b'),
				chars = allChars.not('.deleted'),
				pos = fancyInput.getCaretPosition(input);

				if( charDir.lastDir == 'rtl' ) // BIDI support
					pos = input.value.length - pos;

			var	insertPos = chars.eq(pos);

			if(pos == input.value.length ){
				//if( !chars.length )
				//	caret.prependTo( input.nextElementSibling );
				//else
					caret.appendTo( input.nextElementSibling );
			}
			else
				caret.insertBefore( insertPos );
		},

		getCaretPosition : function(input){
			var caretPos, direction = getSelectionDirection.direction || 'right';
			if( input.selectionStart || input.selectionStart == '0' )
				caretPos = direction == 'left' ? input.selectionStart : input.selectionEnd;

			return caretPos || 0;
		}
	},

	getSelectionDirection = {
		direction : null,
		lastOffset : null,
		set : function(e){
			var d;
			if( e.shiftKey && e.keyCode == 37 )
				d = 'left';
			else if( e.shiftKey && e.keyCode == 39 )
				d = 'right';
			if( e.type == 'mousedown' )
				getSelectionDirection.lastOffset = e.clientX;
			else if( e.type == 'mouseup' )
				d = e.clientX < getSelectionDirection.lastOffset ? 'left' : 'right';

			getSelectionDirection.direction = d;
		}
	}, 

	charDir = {
		lastDir : null,
		check : function(s){
			var ltrChars        = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF'+'\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF',
				rtlChars        = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC',
				ltrDirCheck     = new RegExp('^[^'+rtlChars+']*['+ltrChars+']'),
				rtlDirCheck     = new RegExp('^[^'+ltrChars+']*['+rtlChars+']');

			var dir = rtlDirCheck.test(s) ? 'rtl' : (ltrDirCheck.test(s) ? 'ltr' : '');
			if( dir ) this.lastDir = dir;
			return dir;
		}
	}

	function init(inputs){
		var selector = inputs.selector;

		inputs.each(function(){
			var className = 'fancyInput',
				template = $('<div><b class="caret">&#8203;</b></div>');

			if( this.tagName == 'TEXTAREA' )
				className += ' textarea';
			// add need DOM for the plugin to work
			$(this.parentNode).append(template).addClass(className);

			// populate the fake field if there was any text in the real input
			if( this.value )
				fancyInput.fillText(this.value, this);
		});

		// bind all the events to simulate an input type text (yes, alot)
    $('.fancyInput').off('keypress.fi')
      .off('keyup.fi select.fi mouseup.fi cut.fi paste.fi')
      .off('mousedown.fi mouseup.fi keydown.fi')
      .off('keydown.fi')

      $('.fancyInput')
      .on('keypress.fi', selector, fancyInput.keypress)
      .on('keyup.fi select.fi mouseup.fi cut.fi paste.fi',selector, fancyInput.allEvents)
      .on('mousedown.fi mouseup.fi keydown.fi',selector , getSelectionDirection.set)
      .on('keydown.fi', selector , fancyInput.keydown);
  }

	window.fancyInput = fancyInput;
})(jQuery);

/*
 * transform: A jQuery cssHooks adding cross-browser 2d transform capabilities to $.fn.css() and $.fn.animate()
 *
 * limitations:
 * - requires jQuery 1.4.3+
 * - Should you use the *translate* property, then your elements need to be absolutely positionned in a relatively positionned wrapper **or it will fail in IE678**.
 * - transformOrigin is not accessible
 *
 * latest version and complete README available on Github:
 * https://github.com/louisremi/jquery.transform.js
 *
 * Copyright 2011 @louis_remi
 * Licensed under the MIT license.
 *
 * This saved you an hour of work?
 * Send me music http://www.amazon.co.uk/wishlist/HNTU0468LQON
 *
 */
(function( $, window, document, Math, undefined ) {

/*
 * Feature tests and global variables
 */
var div = document.createElement("div"),
	divStyle = div.style,
	suffix = "Transform",
	testProperties = [
		"O" + suffix,
		"ms" + suffix,
		"Webkit" + suffix,
		"Moz" + suffix
	],
	i = testProperties.length,
	supportProperty,
	supportMatrixFilter,
	supportFloat32Array = "Float32Array" in window,
	propertyHook,
	propertyGet,
	rMatrix = /Matrix([^)]*)/,
	rAffine = /^\s*matrix\(\s*1\s*,\s*0\s*,\s*0\s*,\s*1\s*(?:,\s*0(?:px)?\s*){2}\)\s*$/,
	_transform = "transform",
	_transformOrigin = "transformOrigin",
	_translate = "translate",
	_rotate = "rotate",
	_scale = "scale",
	_skew = "skew",
	_matrix = "matrix";

// test different vendor prefixes of these properties
while ( i-- ) {
	if ( testProperties[i] in divStyle ) {
		$.support[_transform] = supportProperty = testProperties[i];
		$.support[_transformOrigin] = supportProperty + "Origin";
		continue;
	}
}
// IE678 alternative
if ( !supportProperty ) {
	$.support.matrixFilter = supportMatrixFilter = divStyle.filter === "";
}

// px isn't the default unit of these properties
$.cssNumber[_transform] = $.cssNumber[_transformOrigin] = true;

/*
 * fn.css() hooks
 */
if ( supportProperty && supportProperty != _transform ) {
	// Modern browsers can use jQuery.cssProps as a basic hook
	$.cssProps[_transform] = supportProperty;
	$.cssProps[_transformOrigin] = supportProperty + "Origin";

	// Firefox needs a complete hook because it stuffs matrix with "px"
	if ( supportProperty == "Moz" + suffix ) {
		propertyHook = {
			get: function( elem, computed ) {
				return (computed ?
					// remove "px" from the computed matrix
					$.css( elem, supportProperty ).split("px").join(""):
					elem.style[supportProperty]
				);
			},
			set: function( elem, value ) {
				// add "px" to matrices
				elem.style[supportProperty] = /matrix\([^)p]*\)/.test(value) ?
					value.replace(/matrix((?:[^,]*,){4})([^,]*),([^)]*)/, _matrix+"$1$2px,$3px"):
					value;
			}
		};
	/* Fix two jQuery bugs still present in 1.5.1
	 * - rupper is incompatible with IE9, see http://jqbug.com/8346
	 * - jQuery.css is not really jQuery.cssProps aware, see http://jqbug.com/8402
	 */
	} else if ( /^1\.[0-5](?:\.|$)/.test($.fn.jquery) ) {
		propertyHook = {
			get: function( elem, computed ) {
				return (computed ?
					$.css( elem, supportProperty.replace(/^ms/, "Ms") ):
					elem.style[supportProperty]
				);
			}
		};
	}
	/* TODO: leverage hardware acceleration of 3d transform in Webkit only
	else if ( supportProperty == "Webkit" + suffix && support3dTransform ) {
		propertyHook = {
			set: function( elem, value ) {
				elem.style[supportProperty] = 
					value.replace();
			}
		}
	}*/

} else if ( supportMatrixFilter ) {
	propertyHook = {
		get: function( elem, computed, asArray ) {
			var elemStyle = ( computed && elem.currentStyle ? elem.currentStyle : elem.style ),
				matrix, data;

			if ( elemStyle && rMatrix.test( elemStyle.filter ) ) {
				matrix = RegExp.$1.split(",");
				matrix = [
					matrix[0].split("=")[1],
					matrix[2].split("=")[1],
					matrix[1].split("=")[1],
					matrix[3].split("=")[1]
				];
			} else {
				matrix = [1,0,0,1];
			}

			if ( ! $.cssHooks[_transformOrigin] ) {
				matrix[4] = elemStyle ? parseInt(elemStyle.left, 10) || 0 : 0;
				matrix[5] = elemStyle ? parseInt(elemStyle.top, 10) || 0 : 0;

			} else {
				data = $._data( elem, "transformTranslate", undefined );
				matrix[4] = data ? data[0] : 0;
				matrix[5] = data ? data[1] : 0;
			}

			return asArray ? matrix : _matrix+"(" + matrix + ")";
		},
		set: function( elem, value, animate ) {
			var elemStyle = elem.style,
				currentStyle,
				Matrix,
				filter,
				centerOrigin;

			if ( !animate ) {
				elemStyle.zoom = 1;
			}

			value = matrix(value);

			// rotate, scale and skew
			Matrix = [
				"Matrix("+
					"M11="+value[0],
					"M12="+value[2],
					"M21="+value[1],
					"M22="+value[3],
					"SizingMethod='auto expand'"
			].join();
			filter = ( currentStyle = elem.currentStyle ) && currentStyle.filter || elemStyle.filter || "";

			elemStyle.filter = rMatrix.test(filter) ?
				filter.replace(rMatrix, Matrix) :
				filter + " progid:DXImageTransform.Microsoft." + Matrix + ")";

			if ( ! $.cssHooks[_transformOrigin] ) {

				// center the transform origin, from pbakaus's Transformie http://github.com/pbakaus/transformie
				if ( (centerOrigin = $.transform.centerOrigin) ) {
					elemStyle[centerOrigin == "margin" ? "marginLeft" : "left"] = -(elem.offsetWidth/2) + (elem.clientWidth/2) + "px";
					elemStyle[centerOrigin == "margin" ? "marginTop" : "top"] = -(elem.offsetHeight/2) + (elem.clientHeight/2) + "px";
				}

				// translate
				// We assume that the elements are absolute positionned inside a relative positionned wrapper
				elemStyle.left = value[4] + "px";
				elemStyle.top = value[5] + "px";

			} else {
				$.cssHooks[_transformOrigin].set( elem, value );
			}
		}
	};
}
// populate jQuery.cssHooks with the appropriate hook if necessary
if ( propertyHook ) {
	$.cssHooks[_transform] = propertyHook;
}
// we need a unique setter for the animation logic
propertyGet = propertyHook && propertyHook.get || $.css;

/*
 * fn.animate() hooks
 */
$.fx.step.transform = function( fx ) {
	var elem = fx.elem,
		start = fx.start,
		end = fx.end,
		pos = fx.pos,
		transform = "",
		precision = 1E5,
		i, startVal, endVal, unit;

	// fx.end and fx.start need to be converted to interpolation lists
	if ( !start || typeof start === "string" ) {

		// the following block can be commented out with jQuery 1.5.1+, see #7912
		if ( !start ) {
			start = propertyGet( elem, supportProperty );
		}

		// force layout only once per animation
		if ( supportMatrixFilter ) {
			elem.style.zoom = 1;
		}

		// replace "+=" in relative animations (-= is meaningless with transforms)
		end = end.split("+=").join(start);

		// parse both transform to generate interpolation list of same length
		$.extend( fx, interpolationList( start, end ) );
		start = fx.start;
		end = fx.end;
	}

	i = start.length;

	// interpolate functions of the list one by one
	while ( i-- ) {
		startVal = start[i];
		endVal = end[i];
		unit = +false;

		switch ( startVal[0] ) {

			case _translate:
				unit = "px";
			case _scale:
				unit || ( unit = "");

				transform = startVal[0] + "(" +
					Math.round( (startVal[1][0] + (endVal[1][0] - startVal[1][0]) * pos) * precision ) / precision + unit +","+
					Math.round( (startVal[1][1] + (endVal[1][1] - startVal[1][1]) * pos) * precision ) / precision + unit + ")"+
					transform;
				break;

			case _skew + "X":
			case _skew + "Y":
			case _rotate:
				transform = startVal[0] + "(" +
					Math.round( (startVal[1] + (endVal[1] - startVal[1]) * pos) * precision ) / precision +"rad)"+
					transform;
				break;
		}
	}

	fx.origin && ( transform = fx.origin + transform );

	propertyHook && propertyHook.set ?
		propertyHook.set( elem, transform, +true ):
		elem.style[supportProperty] = transform;
};

/*
 * Utility functions
 */

// turns a transform string into its "matrix(A,B,C,D,X,Y)" form (as an array, though)
function matrix( transform ) {
	transform = transform.split(")");
	var
			trim = $.trim
		, i = -1
		// last element of the array is an empty string, get rid of it
		, l = transform.length -1
		, split, prop, val
		, prev = supportFloat32Array ? new Float32Array(6) : []
		, curr = supportFloat32Array ? new Float32Array(6) : []
		, rslt = supportFloat32Array ? new Float32Array(6) : [1,0,0,1,0,0]
		;

	prev[0] = prev[3] = rslt[0] = rslt[3] = 1;
	prev[1] = prev[2] = prev[4] = prev[5] = 0;

	// Loop through the transform properties, parse and multiply them
	while ( ++i < l ) {
		split = transform[i].split("(");
		prop = trim(split[0]);
		val = split[1];
		curr[0] = curr[3] = 1;
		curr[1] = curr[2] = curr[4] = curr[5] = 0;

		switch (prop) {
			case _translate+"X":
				curr[4] = parseInt(val, 10);
				break;

			case _translate+"Y":
				curr[5] = parseInt(val, 10);
				break;

			case _translate:
				val = val.split(",");
				curr[4] = parseInt(val[0], 10);
				curr[5] = parseInt(val[1] || 0, 10);
				break;

			case _rotate:
				val = toRadian(val);
				curr[0] = Math.cos(val);
				curr[1] = Math.sin(val);
				curr[2] = -Math.sin(val);
				curr[3] = Math.cos(val);
				break;

			case _scale+"X":
				curr[0] = +val;
				break;

			case _scale+"Y":
				curr[3] = val;
				break;

			case _scale:
				val = val.split(",");
				curr[0] = val[0];
				curr[3] = val.length>1 ? val[1] : val[0];
				break;

			case _skew+"X":
				curr[2] = Math.tan(toRadian(val));
				break;

			case _skew+"Y":
				curr[1] = Math.tan(toRadian(val));
				break;

			case _matrix:
				val = val.split(",");
				curr[0] = val[0];
				curr[1] = val[1];
				curr[2] = val[2];
				curr[3] = val[3];
				curr[4] = parseInt(val[4], 10);
				curr[5] = parseInt(val[5], 10);
				break;
		}

		// Matrix product (array in column-major order)
		rslt[0] = prev[0] * curr[0] + prev[2] * curr[1];
		rslt[1] = prev[1] * curr[0] + prev[3] * curr[1];
		rslt[2] = prev[0] * curr[2] + prev[2] * curr[3];
		rslt[3] = prev[1] * curr[2] + prev[3] * curr[3];
		rslt[4] = prev[0] * curr[4] + prev[2] * curr[5] + prev[4];
		rslt[5] = prev[1] * curr[4] + prev[3] * curr[5] + prev[5];

		prev = [rslt[0],rslt[1],rslt[2],rslt[3],rslt[4],rslt[5]];
	}
	return rslt;
}

// turns a matrix into its rotate, scale and skew components
// algorithm from http://hg.mozilla.org/mozilla-central/file/7cb3e9795d04/layout/style/nsStyleAnimation.cpp
function unmatrix(matrix) {
	var
			scaleX
		, scaleY
		, skew
		, A = matrix[0]
		, B = matrix[1]
		, C = matrix[2]
		, D = matrix[3]
		;

	// Make sure matrix is not singular
	if ( A * D - B * C ) {
		// step (3)
		scaleX = Math.sqrt( A * A + B * B );
		A /= scaleX;
		B /= scaleX;
		// step (4)
		skew = A * C + B * D;
		C -= A * skew;
		D -= B * skew;
		// step (5)
		scaleY = Math.sqrt( C * C + D * D );
		C /= scaleY;
		D /= scaleY;
		skew /= scaleY;
		// step (6)
		if ( A * D < B * C ) {
			A = -A;
			B = -B;
			skew = -skew;
			scaleX = -scaleX;
		}

	// matrix is singular and cannot be interpolated
	} else {
		// In this case the elem shouldn't be rendered, hence scale == 0
		scaleX = scaleY = skew = 0;
	}

	// The recomposition order is very important
	// see http://hg.mozilla.org/mozilla-central/file/7cb3e9795d04/layout/style/nsStyleAnimation.cpp#l971
	return [
		[_translate, [+matrix[4], +matrix[5]]],
		[_rotate, Math.atan2(B, A)],
		[_skew + "X", Math.atan(skew)],
		[_scale, [scaleX, scaleY]]
	];
}

// build the list of transform functions to interpolate
// use the algorithm described at http://dev.w3.org/csswg/css3-2d-transforms/#animation
function interpolationList( start, end ) {
	var list = {
			start: [],
			end: []
		},
		i = -1, l,
		currStart, currEnd, currType;

	// get rid of affine transform matrix
	( start == "none" || isAffine( start ) ) && ( start = "" );
	( end == "none" || isAffine( end ) ) && ( end = "" );

	// if end starts with the current computed style, this is a relative animation
	// store computed style as the origin, remove it from start and end
	if ( start && end && !end.indexOf("matrix") && toArray( start ).join() == toArray( end.split(")")[0] ).join() ) {
		list.origin = start;
		start = "";
		end = end.slice( end.indexOf(")") +1 );
	}

	if ( !start && !end ) { return; }

	// start or end are affine, or list of transform functions are identical
	// => functions will be interpolated individually
	if ( !start || !end || functionList(start) == functionList(end) ) {

		start && ( start = start.split(")") ) && ( l = start.length );
		end && ( end = end.split(")") ) && ( l = end.length );

		while ( ++i < l-1 ) {
			start[i] && ( currStart = start[i].split("(") );
			end[i] && ( currEnd = end[i].split("(") );
			currType = $.trim( ( currStart || currEnd )[0] );

			append( list.start, parseFunction( currType, currStart ? currStart[1] : 0 ) );
			append( list.end, parseFunction( currType, currEnd ? currEnd[1] : 0 ) );
		}

	// otherwise, functions will be composed to a single matrix
	} else {
		list.start = unmatrix(matrix(start));
		list.end = unmatrix(matrix(end))
	}

	return list;
}

function parseFunction( type, value ) {
	var
		// default value is 1 for scale, 0 otherwise
		defaultValue = +(!type.indexOf(_scale)),
		scaleX,
		// remove X/Y from scaleX/Y & translateX/Y, not from skew
		cat = type.replace( /e[XY]/, "e" );

	switch ( type ) {
		case _translate+"Y":
		case _scale+"Y":

			value = [
				defaultValue,
				value ?
					parseFloat( value ):
					defaultValue
			];
			break;

		case _translate+"X":
		case _translate:
		case _scale+"X":
			scaleX = 1;
		case _scale:

			value = value ?
				( value = value.split(",") ) &&	[
					parseFloat( value[0] ),
					parseFloat( value.length>1 ? value[1] : type == _scale ? scaleX || value[0] : defaultValue+"" )
				]:
				[defaultValue, defaultValue];
			break;

		case _skew+"X":
		case _skew+"Y":
		case _rotate:
			value = value ? toRadian( value ) : 0;
			break;

		case _matrix:
			return unmatrix( value ? toArray(value) : [1,0,0,1,0,0] );
			break;
	}

	return [[ cat, value ]];
}

function isAffine( matrix ) {
	return rAffine.test(matrix);
}

function functionList( transform ) {
	return transform.replace(/(?:\([^)]*\))|\s/g, "");
}

function append( arr1, arr2, value ) {
	while ( value = arr2.shift() ) {
		arr1.push( value );
	}
}

// converts an angle string in any unit to a radian Float
function toRadian(value) {
	return ~value.indexOf("deg") ?
		parseInt(value,10) * (Math.PI * 2 / 360):
		~value.indexOf("grad") ?
			parseInt(value,10) * (Math.PI/200):
			parseFloat(value);
}

// Converts "matrix(A,B,C,D,X,Y)" to [A,B,C,D,X,Y]
function toArray(matrix) {
	// remove the unit of X and Y for Firefox
	matrix = /([^,]*),([^,]*),([^,]*),([^,]*),([^,p]*)(?:px)?,([^)p]*)(?:px)?/.exec(matrix);
	return [matrix[1], matrix[2], matrix[3], matrix[4], matrix[5], matrix[6]];
}

$.transform = {
	centerOrigin: "margin"
};

})( jQuery, window, document, Math );

jQuery.event.special.tap = {
    setup: function (a, b) {
        var c = this,
            d = jQuery(c);
        if (window.Touch) {
            d.bind("touchstart", jQuery.event.special.tap.onTouchStart);
            d.bind("touchmove", jQuery.event.special.tap.onTouchMove);
            d.bind("touchend", jQuery.event.special.tap.onTouchEnd)
        } else {
            d.bind("click", jQuery.event.special.tap.click)
        }
    },
    click: function (a) {
        a.type = "tap";
        jQuery.event.handle.apply(this, arguments)
    },
    teardown: function (a) {
        var c = this,
            d = jQuery(c);
        if (window.Touch) {
            d.unbind("touchstart", jQuery.event.special.tap.onTouchStart);
            d.unbind("touchmove", jQuery.event.special.tap.onTouchMove);
            d.unbind("touchend", jQuery.event.special.tap.onTouchEnd)
        } else {
            d.unbind("click", jQuery.event.special.tap.click)
        }
    },
    onTouchStart: function (a) {
        this.moved = false
    },
    onTouchMove: function (a) {
        this.moved = true
    },
    onTouchEnd: function (a) {
        if (!this.moved) {
            a.type = "tap";
            jQuery.event.handle.apply(this, arguments)
        }
    }
};

(function($) {
	"use strict";
	$.extend({
		simpleWeather: function(options){
			options = $.extend({
				location: '',
				woeid: '2357536',
				unit: 'f',
				success: function(weather){},
				error: function(message){}
			}, options);

			var now = new Date();

			var weatherUrl = '//query.yahooapis.com/v1/public/yql?format=json&rnd='+now.getFullYear()+now.getMonth()+now.getDay()+now.getHours()+'&diagnostics=true&callback=?&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&q=';
			if(options.location !== '') {
				weatherUrl += 'select * from weather.forecast where woeid in (select woeid from geo.placefinder where text="'+options.location+'" and gflags="R") and u="'+options.unit+'"';
			} else if(options.woeid !== '') {
				weatherUrl += 'select * from weather.forecast where woeid='+options.woeid+' and u="'+options.unit+'"';
      } else {
				options.error("Could not retrieve weather due to an invalid location.");
				return false;
			}

			$.getJSON(
				weatherUrl,
				function(data) {
          console.log(data);
					if(data !== null && data.query.results !== null && data.query.results.channel.description !== 'Yahoo! Weather Error') {
						$.each(data.query.results, function(i, result) {
							if (result.constructor.toString().indexOf("Array") !== -1) {
								result = result[0];
							}

							var compass = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'];
							var windDirection = compass[Math.round(result.wind.direction / 22.5)];

							if(result.item.condition.temp < 80 && result.atmosphere.humidity < 40) {
								var heatIndex = -42.379+2.04901523*result.item.condition.temp+10.14333127*result.atmosphere.humidity-0.22475541*result.item.condition.temp*result.atmosphere.humidity-6.83783*(Math.pow(10, -3))*(Math.pow(result.item.condition.temp, 2))-5.481717*(Math.pow(10, -2))*(Math.pow(result.atmosphere.humidity, 2))+1.22874*(Math.pow(10, -3))*(Math.pow(result.item.condition.temp, 2))*result.atmosphere.humidity+8.5282*(Math.pow(10, -4))*result.item.condition.temp*(Math.pow(result.atmosphere.humidity, 2))-1.99*(Math.pow(10, -6))*(Math.pow(result.item.condition.temp, 2))*(Math.pow(result.atmosphere.humidity,2));
							} else {
								var heatIndex = result.item.condition.temp;
							}

							if(options.unit === "f") {
								var unitAlt = "c";
								var tempAlt = Math.round((5.0/9.0)*(result.item.condition.temp-32.0));
								var highAlt = Math.round((5.0/9.0)*(result.item.forecast[0].high-32.0));
								var lowAlt = Math.round((5.0/9.0)*(result.item.forecast[0].low-32.0));
								var tomorrowHighAlt = Math.round((5.0/9.0)*(result.item.forecast[1].high-32.0));
								var tomorrowLowAlt = Math.round((5.0/9.0)*(result.item.forecast[1].low-32.0));
								var forecastOneHighAlt = Math.round((5.0/9.0)*(result.item.forecast[1].high-32.0));
								var forecastOneLowAlt = Math.round((5.0/9.0)*(result.item.forecast[1].low-32.0));
								var forecastTwoHighAlt = Math.round((5.0/9.0)*(result.item.forecast[2].high-32.0));
								var forecastTwoLowAlt = Math.round((5.0/9.0)*(result.item.forecast[2].low-32.0));
								var forecastThreeHighAlt = Math.round((5.0/9.0)*(result.item.forecast[3].high-32.0));
								var forecastThreeLowAlt = Math.round((5.0/9.0)*(result.item.forecast[3].low-32.0));
								var forecastFourHighAlt = Math.round((5.0/9.0)*(result.item.forecast[4].high-32.0));
								var forecastFourLowAlt = Math.round((5.0/9.0)*(result.item.forecast[4].low-32.0));
							} else {
								var unitAlt = "f";
								var tempAlt = Math.round((9.0/5.0)*result.item.condition.temp+32.0);
								var highAlt = Math.round((9.0/5.0)*result.item.forecast[0].high+32.0);
								var lowAlt = Math.round((9.0/5.0)*result.item.forecast[0].low+32.0);
								var tomorrowHighAlt = Math.round((5.0/9.0)*(result.item.forecast[1].high+32.0));
								var tomorrowLowAlt = Math.round((5.0/9.0)*(result.item.forecast[1].low+32.0));
								var forecastOneHighAlt = Math.round((5.0/9.0)*(result.item.forecast[1].high+32.0));
								var forecastOneLowAlt = Math.round((5.0/9.0)*(result.item.forecast[1].low+32.0));
								var forecastTwoHighAlt = Math.round((5.0/9.0)*(result.item.forecast[2].high+32.0));
								var forecastTwoLowAlt = Math.round((5.0/9.0)*(result.item.forecast[2].low+32.0));
								var forecastThreeHighAlt = Math.round((5.0/9.0)*(result.item.forecast[3].high+32.0));
								var forecastThreeLowAlt = Math.round((5.0/9.0)*(result.item.forecast[3].low+32.0));
								var forecastFourHighAlt = Math.round((5.0/9.0)*(result.item.forecast[4].high+32.0));
								var forecastFourLowAlt = Math.round((5.0/9.0)*(result.item.forecast[4].low+32.0));
							}

							var weather = {
								title: result.item.title,
								temp: result.item.condition.temp,
								tempAlt: tempAlt,
								code: result.item.condition.code,
								todayCode: result.item.forecast[0].code,
								units:{
									temp: result.units.temperature,
									distance: result.units.distance,
									pressure: result.units.pressure,
									speed: result.units.speed,
									tempAlt: unitAlt
								},
								currently: result.item.condition.text,
								high: result.item.forecast[0].high,
								highAlt: highAlt,
								low: result.item.forecast[0].low,
								lowAlt: lowAlt,
								forecast: result.item.forecast[0].text,
								wind:{
									chill: result.wind.chill,
									direction: windDirection,
									speed: result.wind.speed
								},
								humidity: result.atmosphere.humidity,
								heatindex: heatIndex,
								pressure: result.atmosphere.pressure,
								rising: result.atmosphere.rising,
								visibility: result.atmosphere.visibility,
								sunrise: result.astronomy.sunrise,
								sunset: result.astronomy.sunset,
								description: result.item.description,
								thumbnail: "//l.yimg.com/a/i/us/nws/weather/gr/"+result.item.condition.code+"ds.png",
								image: "//l.yimg.com/a/i/us/nws/weather/gr/"+result.item.condition.code+"d.png",
								tomorrow:{
									high: result.item.forecast[1].high,
									highAlt: tomorrowHighAlt,
									low: result.item.forecast[1].low,
									lowAlt: tomorrowLowAlt,
									forecast: result.item.forecast[1].text,
									code: result.item.forecast[1].code,
									date: result.item.forecast[1].date,
									day: result.item.forecast[1].day,
									image: "//l.yimg.com/a/i/us/nws/weather/gr/"+result.item.forecast[1].code+"d.png"
								},
								forecasts:{
									one:{
										high: result.item.forecast[1].high,
										highAlt: forecastOneHighAlt,
										low: result.item.forecast[1].low,
										lowAlt: forecastOneLowAlt,
										forecast: result.item.forecast[1].text,
										code: result.item.forecast[1].code,
										date: result.item.forecast[1].date,
										day: result.item.forecast[1].day,
										image: "//l.yimg.com/a/i/us/nws/weather/gr/"+result.item.forecast[1].code+"d.png"
									},
									two:{
										high: result.item.forecast[2].high,
										highAlt: forecastTwoHighAlt,
										low: result.item.forecast[2].low,
										lowAlt: forecastTwoLowAlt,
										forecast: result.item.forecast[2].text,
										code: result.item.forecast[2].code,
										date: result.item.forecast[2].date,
										day: result.item.forecast[2].day,
										image: "//l.yimg.com/a/i/us/nws/weather/gr/"+result.item.forecast[2].code+"d.png"
									},
									three:{
										high: result.item.forecast[3].high,
										highAlt: forecastThreeHighAlt,
										low: result.item.forecast[3].low,
										lowAlt: forecastThreeLowAlt,
										forecast: result.item.forecast[3].text,
										code: result.item.forecast[3].code,
										date: result.item.forecast[3].date,
										day: result.item.forecast[3].day,
										image: "//l.yimg.com/a/i/us/nws/weather/gr/"+result.item.forecast[3].code+"d.png"
									},
									four:{
										high: result.item.forecast[4].high,
										highAlt: forecastFourHighAlt,
										low: result.item.forecast[4].low,
										lowAlt: forecastFourLowAlt,
										forecast: result.item.forecast[4].text,
										code: result.item.forecast[4].code,
										date: result.item.forecast[4].date,
										day: result.item.forecast[4].day,
										image: "//l.yimg.com/a/i/us/nws/weather/gr/"+result.item.forecast[4].code+"d.png"
									},
								},
								city: result.location.city,
								country: result.location.country,
								region: result.location.region,
								updated: result.item.pubDate,
								link: result.item.link
							};

							options.success(weather);
						});
					} else {
						if (data.query.results === null) {
							options.error("An invalid WOEID or location was provided.");
						} else {
							options.error("There was an error retrieving the latest weather information. Please try again.");
						}
					}
				}
			);
			return this;
		}
	});
})(jQuery);


  //override the default window.setInterval() function
  window.setInterval = function (func, time) {
    //window.setInterval.count is used to assign a unique intervalId to each interval created
    //these IDs are used by the custom clearInterval() function
    var intervalId = window.setInterval.count ? ++window.setInterval.count : window.setInterval.count = 1;
    //store the arguments as a local variable so they can be used inside other functions
    var args = arguments;
    //create a property on the window.setInterval object for the current intervalId
    //this property will be a function that is called recursively with setTimeout()
    window.setInterval[intervalId] = function () {
      //check if the current interval is still active
      //this will be true unless clearInterval() has been called on this interval
      if (window.setInterval[intervalId].active) {
        //handle all three possible cases of arguments passed to setInterval
        //if a string is passed instead of a function, use eval() to run the string
        if (typeof func == "string") {
          eval(func);
        }
        //if arguments for the function are passed in addition to the function and time delay
        //call the function with the specified arguments
        else if (args.length > 2) {
          //the apply() method allows passing an array as different arguments to a function
          //create an array out of the original arguments after the time delay argument, and pass that array to apply()
          func.apply(this, Array.prototype.slice.call(args, 2));
        }
        //if neither special case applies, call the function directly
        else {
          func();
        }
        //call this function again after the specified time delay has passed
        setTimeout(window.setInterval[intervalId], time);
      }
    }
    //set the current interval to active
    window.setInterval[intervalId].active = true;
    //call the current interval after the specified time delay
    setTimeout(window.setInterval[intervalId], time);
    //return an object with the current intervalId, use it to clear this interval using clearInterval()
    return {intervalId: intervalId};
  }
  //override the default clearInterval() function so it works with the custom setInterval()
  window.clearInterval = function (obj) {
    //set the active status of the interval associated with the passed object to false
    window.setInterval[obj.intervalId].active = false;
  }


});
