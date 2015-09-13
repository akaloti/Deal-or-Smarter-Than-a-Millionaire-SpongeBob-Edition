"use strict";

/*
    Author: Aaron Kaloti
    Release number: 0.1
*/

QUnit.module("utility.js");

QUnit.test("Vector2d.getSum()", function(assert) {
    var v = new Vector2d(20, 30);
    assert.deepEqual(v.getSum(new Vector2d(40, 40)),
        new Vector2d(60, 70),
        "Function successfully returns the correct " +
        "sum as a Vector2d object");
});

QUnit.test("Vector2d.getProduct()", function(assert) {
    var v = new Vector2d(70, 80);
    assert.deepEqual(v.getProduct(new Vector2d(3, 2)),
        new Vector2d(210, 160),
        "Function successfully returns the correct " +
        "product as a Vector2d object");
});

QUnit.module("briefcase-display.js");

QUnit.test("BriefcaseDisplay::getCasePosition()", function(assert) {
    assert.deepEqual(BriefcaseDisplay.getCasePosition(1),
        BriefcaseDisplay.firstCasePosition,
        "Correct position for first case");
    assert.deepEqual(BriefcaseDisplay.getCasePosition(4),
        BriefcaseDisplay.firstCasePosition.getSum(
            BriefcaseDisplay.marginalCasePosition.getProduct(
                new Vector2d(3, 0))),
        "Correct position for fourth case");
    assert.deepEqual(BriefcaseDisplay.getCasePosition(5),
        BriefcaseDisplay.firstCasePosition.getSum(
            BriefcaseDisplay.marginalCasePosition.getProduct(
                new Vector2d(4, 0))),
        "Correct position for fifth case");
    assert.deepEqual(BriefcaseDisplay.getCasePosition(6),
        BriefcaseDisplay.firstCasePosition.getSum(
            BriefcaseDisplay.marginalCasePosition.getProduct(
                new Vector2d(0, -1))),
        "Correct position for sixth case");
    assert.deepEqual(BriefcaseDisplay.getCasePosition(10),
        BriefcaseDisplay.firstCasePosition.getSum(
            BriefcaseDisplay.marginalCasePosition.getProduct(
                new Vector2d(4, -1))),
        "Correct position for tenth case");
});

QUnit.module("canvas-stack.js");

QUnit.test("CanvasStack.add()", function(assert) {
    // this test checks stack's length
    var canvasStack = new CanvasStack();
    assert.deepEqual(canvasStack.add(
        CANVAS_IDS.TITLE_SCREEN)._storage.length, 1,
        "A canvas was successfully stored");
    assert.deepEqual(canvasStack.add(
        CANVAS_IDS.MONEY_DISPLAY)._storage.length, 3,
        "After, two more canvas were successfully, simultaneously stored");
});

QUnit.test("CanvasStack.remove()", function(assert) {
    // this test checks storage's length
    var canvasStack = new CanvasStack();
    // add four canvas ids
    canvasStack.add(CANVAS_IDS.MONEY_DISPLAY)
        .add(CANVAS_IDS.QUOTE);
    assert.deepEqual(canvasStack.remove(
        CANVAS_IDS.QUOTE_TEXT)._storage.length, 3,
        "A canvas was successfully removed");
    assert.deepEqual(canvasStack.remove(
        CANVAS_IDS.MONEY_DISPLAY)._storage.length, 1,
        "After, two canvases were successfully removed");
});

/*
QUnit.test("CanvasStack::isCanvasOrCanvases()", function(assert) {
    var canvasStack = new CanvasStack();
    assert.deepEqual(CanvasStack.isCanvasOrCanvases("invalidParameter"),
        false, "Returns false if not valid canvas or array of canvases");
    assert.deepEqual(CanvasStack.isCanvasOrCanvases(
        CANVAS_IDS.SPEAKER), true,
        "Returns true if valid canvas");
    assert.deepEqual(CanvasStack.isCanvasOrCanvases(
        CANVAS_IDS.MONEY_DISPLAY), true,
        "Returns true if valid array canvases");
});
*/

QUnit.module("error-handling.js");

QUnit.test("parameterError()", function(assert) {
    assert.deepEqual(parameterError("This is a test"),
        ERROR_MESSAGES.PARAMETER, "Correct value is returned");
});

QUnit.module("game-show-fusion.js");

QUnit.test("convertStringToArrayOfStrings()", function(assert) {
    var testString = "abcdefghijk";
    var testMaxStringLength = 3;
    var textPieces = convertStringToArrayOfStrings(testString,
        testMaxStringLength);

    assert.equal(textPieces[0], 'abc', "Correct first piece made");
    assert.equal(textPieces[1], 'def', "Correct second piece made");
    assert.equal(textPieces[2], 'ghi', "Correct third piece made");
    assert.equal(textPieces[3], 'jk', "Correct fourth piece made");
});