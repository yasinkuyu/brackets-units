/*
 * Copyright (c) 2014 Yasin Kuyu - All rights reserved
 *               twitter.com/yasinkuyu & github.com/yasinkuyu
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window, Mustache */

define(function (require, exports, module) {
    'use strict';
 
    // Load Brackets modules
    var EditorManager           = brackets.getModule("editor/EditorManager"),
        DocumentManager         = brackets.getModule("document/DocumentManager"),
        InlineWidget            = brackets.getModule("editor/InlineWidget").InlineWidget;
    
    // Load tempalte
    var inlineEditorTemplate    = require("text!InlineUnitHelper.html"),
        UnitUtils               = require("UnitUtils");
    
    /**
     * @constructor
     */
    function InlineUnitHelper(value, unit, startBookmark, endBookmark) {
        
        this._value = value;
        this._unit = unit;
        this._startBookmark = startBookmark;
        this._endBookmark = endBookmark;
        
        InlineWidget.call(this);
        
    }
    
    InlineUnitHelper.prototype = Object.create(InlineWidget.prototype);
    InlineUnitHelper.prototype.constructor = InlineUnitHelper;
    InlineUnitHelper.prototype.parentClass = InlineWidget.prototype;
    
    InlineUnitHelper.prototype._value = null;
    InlineUnitHelper.prototype._unit = null;
    
    /**
     * Start of the range of code we're attached to; _startBookmark.find() may by null if sync is lost.
     * @type {!CodeMirror.Bookmark}
     */
    InlineUnitHelper.prototype._startBookmark = null;
    
    /**
     * End of the range of code we're attached to; _endBookmark.find() may by null if sync is lost or even
     * in some cases when it's not. Call getCurrentRange() for the definitive text range we're attached to.
     * @type {!CodeMirror.Bookmark}
     */
    InlineUnitHelper.prototype._endBookmark = null;
    
    InlineUnitHelper.prototype.$wrapperDiv = null;
    InlineUnitHelper.prototype.$image = null;
    
    InlineUnitHelper.prototype.load = function (hostEditor) {
        
        InlineUnitHelper.prototype.parentClass.load.apply(this, arguments);

        var _this = this;
        
        var templateVars = {
            units  : {
                      "units": [
                        { "unit": "px", "value": convert(_this._value, _this._unit, "px") },
                        { "unit": "em", "value": convert(_this._value, _this._unit, "em") },
                        { "unit": "rem", "value": convert(_this._value, _this._unit, "rem") },
                        { "unit": "%", "value": convert(_this._value, _this._unit, "%") },
                        { "unit": "in", "value": convert(_this._value, _this._unit, "in") },
                        { "unit": "cm", "value": convert(_this._value, _this._unit, "cm") },
                        { "unit": "mm", "value":convert(_this._value, _this._unit, "mm") },
                        { "unit": "pt", "value": convert(_this._value, _this._unit, "pt") },
                        { "unit": "pc", "value": convert(_this._value, _this._unit, "pc") }
                      ],
                      "name": function () {
                        return _this._value + _this._unit +" = "+ this.value + "" + this.unit;
                      },
                      "calc": function () {
                        return this.value;
                      }
                    }
        };
            
        var html = Mustache.render(inlineEditorTemplate, templateVars.units);
        
        this.$wrapperDiv = $(html);
        
        $(this.$wrapperDiv.find(".btnUnit")).on("click", function(){
             
             var getValue = $(this).attr("data-value");

             _handleUnitChange(getValue);
                 
         });

        this.$htmlContent.append(this.$wrapperDiv);
        this.$htmlContent.click(this.close.bind(this));
        
    };

    InlineUnitHelper.prototype.onAdded = function () {
        InlineUnitHelper.prototype.parentClass.onAdded.apply(this, arguments);
        window.setTimeout(this._sizeEditorToContent.bind(this));
    };
    
    InlineUnitHelper.prototype._sizeEditorToContent = function () {
        this.hostEditor.setInlineWidgetHeight(this, this.$wrapperDiv.height() + 20, true);
    };

    /**
     * Editor set select area or all text.
     * @param result content
     */
    var _handleUnitChange = function(result){
        
        var editor = EditorManager.getCurrentFullEditor();
        
        if (editor) {
            var isSelection = false;
            var selectedText = editor.getSelectedText();
            var selection = editor.getSelection();
    
            if (selectedText.length > 0) {
                isSelection = true;
            } else {
            }
            
            var doc = DocumentManager.getCurrentDocument();
            
            doc.batchOperation(function () {

                if (isSelection) {
                    doc.replaceRange(result, selection.start, selection.end);
                } else {
                    doc.setText(result);
                }

            });
        }        
    };

    /**
     * Round Function
     * @param number int
     * @param decimals decimal
     */
    var round = function (number, decimals) {
        return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
    };

    // Test it, ctrl+e
    // 18.75em
    // 200pc
    // .10em
    // 602.25rem
    // 720px

    /**
     * Convert function
     * @param value int
     * @param from unit string
     * @param to unit string
     */
    var convert = function (value, from, to) {
        var units = from + '-' + to,
            base = 16, dpi = 72, decimals = 2,
            result,
            formulas = {

                'px-cm': value * 2.54 / dpi,
                'px-em': value / base,
                'px-rem': value / 100, // ok
                'px-in': value / dpi,
                'px-mm': value * 2.54 / dpi * 10,
                'px-pc': value / base,
                'px-pt': value * 72 / 96,
                'px-%': value / base * 100,
 
                'em-cm': value * 0.42175176,
                'em-rem': value,
                'em-in': value * 0.166044,
                'em-mm': value / 0.237106301584,
                'em-pc': value,
                'em-pt': value * 11.955168,
                'em-%': value * 100,
                'em-px': value * base,

                '%-cm': value * base / 100 * 2.54 / dpi,
                '%-em': value / 100,
                '%-rem': value / 100,                
                '%-in': value * base / 100 / dpi,
                '%-mm': value * base / 100 * 2.54 / dpi * 10,
                '%-pc': value / 100,
                '%-pt': value * (base - 4) / 100,
                '%-px': value * base / 100,                

                'in-cm': value * 2.54,
                'in-em': value / 0.166044,
                'in-rem': value / 0.166044,
                'in-mm': value * 2.54 * 10,
                'in-pc': value / 0.166044,
                'in-pt': value / 0.014842519685,
                'in-%': value / base * 100 * dpi,
                'in-px': value * dpi,
                
                'cm-em': value / 0.42175176,
                'cm-in': value * 0.39,
                'cm-mm': value * 10,
                'cm-pc': value / 0.42175176,
                'cm-pt': value * 28.3464566929,
                'cm-%': value / base * 100 / 2.54 * dpi,
                'cm-px': value / 2.54 * dpi,

                'mm-cm': value / 10,
                'mm-em': value * 0.237106301584,
                'mm-rem': value * 0.237106301584,
                'mm-in': value * 0.39 / 10,
                'mm-pc': value / 4.42175176,
                'mm-pt': value / 0.352777777778,
                'mm-%': value / base * 100 / 2.54 * dpi / 10,
                'mm-px': value / 2.54 * dpi / 10,
                'mm-ex': value / 2.54 * dpi / 10,

                'pt-cm': value / 28.3464566929,
                'pt-em': value / 11.955168,
                'pt-rem': value * 96 / 72,
                'pt-in': value * 0.014842519685,
                'pt-mm': value * 0.352777777778,
                'pt-pc': value * 0.0836458341698,
                'pt-%': value / (base - 4) * 100,
                'pt-px': value * 96 / 72,

                'pc-cm': value * 0.42175176,
                'pc-em': value,
                'pc-rem': value,
                'pc-in': value * 0.166044,
                'pc-mm': value * 4.42175176,
                'pc-pt': value / 0.0836458341698,
                'pc-%': value * 100,
                'pc-px': value * base,
                
                'rem-cm': value * 0.42175176,
                'rem-em': value,
                'rem-in': value * 0.166044,
                'rem-mm': value * 4.42175176,
                'rem-pt': value / 0.0836458341698,
                'rem-%': value * 100,
                'rem-px': value * 100

            };

        result = formulas[units];

        return (isNaN(result) ? 'N/A ' + to : round(result, decimals) + to);
    };

    var _handleTooltip = function (e) {

        e.preventDefault();
        
        var $target = $(e.target);

        var unitRegEx = new RegExp(UnitUtils.UNITS_REGEX),
            match;
        
            match = unitRegEx.exec($target.text());
        
            if (match) {

                $($target).attr("data-tooltip", match[0]);
                $($target).trigger("mousemove");
            }
    };
    
    // ToDo handle tooltip
    //$(window.document).on("mousemove", _handleTooltip);
        
    module.exports = InlineUnitHelper;
});
