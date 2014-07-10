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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";
    
    // Brackets modules
    var EditorManager           = brackets.getModule("editor/EditorManager"),
        ExtensionUtils          = brackets.getModule("utils/ExtensionUtils");
    
    // Local modules
    var InlineUnitHelper        = require("InlineUnitHelper");
    
    /**
     * Prepare hostEditor for an InlineUnitEditor at pos if possible. Return
     * editor context if so; otherwise null.
     */
    function prepareEditorForProvider(hostEditor, pos) {
        var unitRegEx, cursorLine, match, sel, start, end, startBookmark, endBookmark;
        
        sel = hostEditor.getSelection();
        if (sel.start.line !== sel.end.line) {
            return null;
        }
        
        /*
         @Test & Contribution Pattern -> http://www.regexr.com/39424
         Javascript, Html, CSS etc. units matches
        */
        unitRegEx = new RegExp(/(\d*\.?\d+)\s?(px|em|ex|%|in|cm|mm|pt|pc+)/igm);
        //unitRegEx = new RegExp(/(\d*\.?\d+)\s?(\w+)/igm);
        
        cursorLine = hostEditor.document.getLine(pos.line);
        
        // Loop through each match of unitRegEx and stop when the one that contains pos is found.
        do {
            match = unitRegEx.exec(cursorLine);
            if (match) {
                start = match.index;
                end = start + match[0].length;
            }else{
            }
        } while (match && (pos.ch < start || pos.ch > end));
        
        if (!match) {
            return null;
        }
        
        // Adjust pos to the beginning of the match so that the inline editor won't get 
        pos.ch = start;
        
        startBookmark = hostEditor._codeMirror.setBookmark(pos);
        endBookmark = hostEditor._codeMirror.setBookmark({ line: pos.line, ch: end });
        
        hostEditor.setSelection(pos, { line: pos.line, ch: end });
        
        return {
            value: match[1],
            unit: match[2],
            start: startBookmark,
            end: endBookmark
        };
    }
    
    /**
     * This function is registered with EditManager as an inline editor provider. It creates an inline editor
     * when cursor is on a JavaScript function name, find all functions that match the name
     * and show (one/all of them) in an inline editor.
     *
     * @param {!Editor} editor
     * @param {!{line:Number, ch:Number}} pos
     * @return {$.Promise} a promise that will be resolved with an InlineWidget
     *      or null if we're not going to provide anything.
     */
    function inlineUnitHelperProvider(hostEditor, pos) {
        
        var context = prepareEditorForProvider(hostEditor, pos),
            inlineUnitEditor,
            result;
        
        if (!context) {
            return null;
        } else {
            inlineUnitEditor = new InlineUnitHelper(context.value, context.unit, context.start, context.end);
            inlineUnitEditor.load(hostEditor);
    
            result = new $.Deferred();
            result.resolve(inlineUnitEditor);
            return result.promise();
        }        
        
    }

    // Initialize extension
    ExtensionUtils.loadStyleSheet(module, "css/main.css");
    EditorManager.registerInlineEditProvider(inlineUnitHelperProvider);
});
