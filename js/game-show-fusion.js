"use strict";

/*
    Author: Aaron Kaloti
    Release number: 0.1
*/

var gameShow = {};
gameShow.speakers = getSpeakerObjects();

gameShow.canvasStack = new CanvasStack();

gameShow.banker = new Banker("media/images/banker.png");

gameShow.moneyAmounts = getBeginningMoneyAmounts();
gameShow.briefcaseValue = undefined;

gameShow.moneyDisplay = new MoneyDisplay(
    CANVAS_IDS.MONEY_DISPLAY_BARS,
    CANVAS_IDS.MONEY_DISPLAY_TEXT,
    gameShow.moneyAmounts);

gameShow.briefcaseDisplay = new BriefcaseDisplay(
    CANVAS_IDS.BRIEFCASES,
    CANVAS_IDS.BRIEFCASES_TEXT,
    gameShow.moneyAmounts,
    "none");

gameShow.selectedBriefcaseNumber = undefined;

gameShow.questions = new Questions(
    CANVAS_IDS.CHOOSE_QUESTION_GRAPHICS,
    CANVAS_IDS.CHOOSE_QUESTION_TEXT,
    "none",
    CANVAS_IDS.QUESTIONING_GRAPHICS,
    CANVAS_IDS.QUESTIONING_TEXT);

gameShow.numberOfQuestionsCorrectlyAnswered = 0;
gameShow.millionDollarQuestion = false;

gameShow.turnVariables = {
    selectedQuestion : undefined,
    selectedAnswer : undefined,
    bankerOffer : undefined,
};

gameShow.keyActions = new KeyActions();

gameShow.soundPlayer = new SoundPlayer();
gameShow.musicPlayer = new MusicPlayer();

gameShow.quoteBubble = {};
gameShow.quoteBubble.x = 50;
gameShow.quoteBubble.y = 440;
gameShow.quoteBubble.width = 1000;
gameShow.quoteBubble.height = 85;
gameShow.quoteBubble.textIndent = new Vector2d(25, 35);
gameShow.maximumTextLengthInPixels = (gameShow.quoteBubble.width -
    (gameShow.quoteBubble.textIndent.x * 2));

gameShow.quotesToDraw = {
    // quotes with lower indexes will be displayed first
    storage : [],

    /*
        @param quote to put at end of storage
        @returns 'this' pointer (to allow chaining of calls
        (e.g. gameShow.quotesToDraw.add(...).add(...).add(...)
            .add(...).deployQuoteChain(...);))
    */
    add : function(quote) {
        this.storage.push(quote);
        return this;
    },

    /*
        @post storage of quotes has been emptied
    */
    clear : function() {
        this.storage = [];
    },

    /*
        @pre this.storage.length > 0
        @post things have been set up so that the user can go from
        one quote to the next by pressing Enter; after the last
        quote has been displayed, pressing Enter will result in
        the endCallback being called; this.storage.length = 0
        @hasTest no
        @param endCallback to call after all the quotes in this.storage
        have been displayed
        @returns nothing
        @throws nothing
    */
    deployQuoteChain : function(endCallback) {
        if (this.storage.length !== 0) {
            // more quotes to display; display the next one
            eraseQuoteBubbleText();
            drawQuoteTextAndCallFunction(this.storage.shift(),
                function() {
                gameShow.quotesToDraw.deployQuoteChain(endCallback);
            });
        }
        else {
            // no more quotes to call
            if (endCallback !== undefined)
                endCallback();
        }
    }
};

// @post title screen has been set up with prompt for user
function drawTitleScreenText() {
    var canvas = document.getElementById(CANVAS_IDS.TITLE_SCREEN);
    var ctx = canvas.getContext('2d');
    ctx.font = "30px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText("Press Enter to play", canvas.width / 2,
        canvas.height / 2);
}

// This is currently a trivial function made for the purpose of
// testing.
function drawTestGameText() {
    var canvas = document.getElementById("money-display-canvas");
    var ctx = canvas.getContext('2d');
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("Welcome to the game", canvas.width / 2,
        canvas.height / 2);
}

// @post canvas that shows a speaker has been erased
function eraseSpeaker() {
    var canvas = document.getElementById(CANVAS_IDS.SPEAKER);
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// @post quote bubble has been drawn on its canvas
function drawQuoteBubble() {
    var canvas = document.getElementById(CANVAS_IDS.QUOTE_BUBBLE);
    var ctx = canvas.getContext('2d');
    var bubble = gameShow.quoteBubble;
    ctx.fillStyle = "rgba(240, 240, 240, 0.9)";
    ctx.fillRect(bubble.x, bubble.y, bubble.width, bubble.height);
}

// @post text in the quote bubble has been cleared
function eraseQuoteBubbleText() {
    var canvas = document.getElementById(CANVAS_IDS.QUOTE_TEXT);
    var ctx = canvas.getContext('2d');
    var bubble = gameShow.quoteBubble;

    // Note that this clears the text on the bubble, not the
    // bubble itself, because of the canvas we're affecting
    ctx.clearRect(bubble.x, bubble.y, bubble.width, bubble.height);
}

/*
    @pre canvases are set up
    @post old speaker (if any) has been erased;
    correct speaker has been drawn
    @hasTest no
    @param speakerName name of the person to draw; should be
    a constant in SPEAKERS
    @returns nothing
    @throws nothing
*/
function drawNewSpeaker(speakerName) {
    eraseSpeaker();
    gameShow.speakers[speakerName].draw();
}

/*
    @pre canvases are set up
    @post text has been drawn with appropriate wrap around and in quote
    bubble; endCallback is set up to be called when user wants;
    sound plays when user presses Enter on a quote
    @hasTest no
    @param text the text to draw
    @param endCallback to call after the user presses Enter (can
    be used for chaining quote bubbles together) (optional)
    @returns nothing
    @throws nothing
*/
function drawQuoteTextAndCallFunction(text, endCallback) {
    drawQuoteText(text);

    if (endCallback !== undefined) {
        // Allow the endCallback to be called
        gameShow.keyActions.set(KEY_CODES.ENTER, function() {
            gameShow.soundPlayer.play(SOUND_EFFECTS_IDS.NEXT_QUOTE);
            endCallback();
        });
    }
    else {
        gameShow.keyActions.set(KEY_CODES.ENTER, function() {
            gameShow.soundPlayer.play(SOUND_EFFECTS_IDS.NEXT_QUOTE);
        });
    }
}

/*
    @pre canvases are set up
    @post the text has been drawn in the quote bubble, with
    wrap around if necessary
    @hasTest no
    @param text the text to draw
    @returns nothing
    @throws nothing
*/
function drawQuoteText(text) {
    var canvas = document.getElementById(CANVAS_IDS.QUOTE_TEXT);
    var ctx = canvas.getContext('2d');
    var textPadding = 10;
    var fontSize = 30;
    ctx.font = fontSize + "px Arial";
    var bubble = gameShow.quoteBubble;
    var x = (bubble.x + gameShow.quoteBubble.textIndent.x);
    var y = (bubble.y + gameShow.quoteBubble.textIndent.y);

    // Convert the text into pieces so that the text can be put
    // into multiple lines, if necessary, so that the entire text
    // fits within the quote bubble's width
    var textPieces = convertCanvasTextIntoSmallerPieces(ctx, text,
        gameShow.maximumTextLengthInPixels);

    // Draw the text
    for (var textIndex in textPieces) {
        ctx.fillText(textPieces[textIndex], x, y);
        y += (fontSize + textPadding);
    }
}

/*
    @post quote bubble has been drawn on its canvas
*/
function setUpQuoteBubble() {
    drawQuoteBubble();
}

/*
    @post million dollar question label (i.e. "MILLION DOLLAR QUESTION")
    has been drawn on the appropriate canvas
*/
function setUpMillionDollarQuestionLabel() {
    // Prepare helpful variables
    var canvas = document.getElementById(CANVAS_IDS.MILLION_QUESTION);
    var ctx = canvas.getContext('2d');
    var width = 800;
    var height = 100;
    var leftX = (CANVAS_WIDTH - width) / 2;
    var topY = (CANVAS_HEIGHT - height) / 2;

    // Draw the label
    ctx.lineWidth = height;
    ctx.strokeStyle = "#FFDF00";
    ctx.lineCap = "round";
    ctx.moveTo(leftX, topY);
    ctx.lineTo(leftX + width, topY);
    ctx.stroke();

    // Draw the label's text
    ctx.fillStyle = "#c0c0c0";
    ctx.font = "bold 45px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MILLION DOLLAR QUESTION", leftX + (width / 2), topY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.strokeText("MILLION DOLLAR QUESTION", leftX + (width / 2), topY);
}

/*
    @param bool true to allow user to change which case is
    emphasized; false to remove this ability
*/
function allowCaseSelectorMovement(bool) {
    if (bool === true) {
        gameShow.keyActions.set(KEY_CODES.LEFT_ARROW, function() {
            gameShow.soundPlayer.play(
                SOUND_EFFECTS_IDS.MOVE_CASE_SELECTOR);
            gameShow.briefcaseDisplay.emphasizePreviousCase();
        })
        .set(KEY_CODES.RIGHT_ARROW, function() {
            gameShow.soundPlayer.play(
                SOUND_EFFECTS_IDS.MOVE_CASE_SELECTOR);
            gameShow.briefcaseDisplay.emphasizeNextCase();
        });
    }
    else {
        gameShow.keyActions.erase(KEY_CODES.LEFT_ARROW)
            .erase(KEY_CODES.RIGHT_ARROW);
    }
}

/*
    @pre parameter direction has any of the following values: "left",
    "right", "up", "down"
    @post if practical, the question selector has been moved in
    the indicated direction and a sound effect was played
    @param direction to try to move the question selector in
*/
function moveQuestionSelector(direction) {
    if (gameShow.questions.emphasizeDifferentLabel(direction)) {
        gameShow.soundPlayer.play(
            SOUND_EFFECTS_IDS.MOVE_QUESTION_SELECTOR);
    }
};

/*
    @param bool true to allow user to change which question's label
    is emphasized; false to remove this ability
*/
function allowQuestionSelectorMovement(bool) {
    if (bool === true) {
        gameShow.keyActions.set(KEY_CODES.LEFT_ARROW, function() {
            moveQuestionSelector("left");
        })
        .set(KEY_CODES.RIGHT_ARROW, function() {
            moveQuestionSelector("right");
        })
        .set(KEY_CODES.UP_ARROW, function() {
            moveQuestionSelector("up");
        })
        .set(KEY_CODES.DOWN_ARROW, function() {
            moveQuestionSelector("down");
        });
    }
    else {
        gameShow.keyActions.erase(KEY_CODES.LEFT_ARROW)
            .erase(KEY_CODES.RIGHT_ARROW)
            .erase(KEY_CODES.UP_ARROW)
            .erase(KEY_CODES.DOWN_ARROW);
    }
}

/*
    @param bool true to allow user to change which answer
    is emphasized; false to remove this ability
*/
function allowAnswerSelectorMovement(bool) {
    if (bool === true) {
        gameShow.keyActions.set(KEY_CODES.UP_ARROW, function() {
            gameShow.soundPlayer.play(
                SOUND_EFFECTS_IDS.MOVE_ANSWER_SELECTOR);
            gameShow.questions.emphasizeUpAnswer(
                gameShow.turnVariables.selectedQuestion);
        })
        .set(KEY_CODES.DOWN_ARROW, function() {
            gameShow.soundPlayer.play(
                SOUND_EFFECTS_IDS.MOVE_ANSWER_SELECTOR);
            gameShow.questions.emphasizeDownAnswer(
                gameShow.turnVariables.selectedQuestion);
        });
    }
    else {
        gameShow.keyActions.erase(KEY_CODES.UP_ARROW)
            .erase(KEY_CODES.DOWN_ARROW);
    }
}

/*
    @post the selection of a case has been performed; the
    selection has been set up to be announced by the host; the
    briefcase display has been updated; the
    continuation of the game has been set to start after the user
    presses Enter
*/
function handleCaseSelection() {
    gameShow.musicPlayer.stop();
    allowCaseSelectorMovement(false);

    // Record which case was selected and its value
    gameShow.selectedBriefcaseNumber =
        gameShow.briefcaseDisplay.numberToEmphasize;
    gameShow.briefcaseValue =
        getRandomMoneyAmount(gameShow.moneyAmounts, false,
        gameShow.moneyDislay);

    // Update the briefcase display
    gameShow.briefcaseDisplay.giveFade(
        gameShow.selectedBriefcaseNumber);

    // Have the host announce it and allow game continuation
    gameShow.quotesToDraw.add("You have selected case " +
        gameShow.selectedBriefcaseNumber + ".")
        .deployQuoteChain(function() {
            gameShow.musicPlayer.play(MUSIC_IDS.QUESTION_1_TO_5);
            selectQuestion();
        });
}

/*
    @pre arrayOfMoneyAmounts.length > 0
    @hasTest yes
    @param arrayOfMoneyAmounts array of instances of MoneyAmount from
    which to get an instance to return
    @param makeGrey true to use the given instance of MoneyDisplay to
    make grey the money bar of the removed
    money amount; false to not make the bar grey
    @param moneyDislay instance of MoneyDisplay with which the money bar can
    be greyed (only required if makeGrey is true)
    @returns a randomly chosen instance of MoneyAmount that was removed from
    arrayOfMoneyAmounts
*/
function getRandomMoneyAmount(arrayOfMoneyAmounts, makeGrey, moneyDisplay) {
    var randomIndex = Math.floor(Math.random() * arrayOfMoneyAmounts.length);
    var moneyAmount = arrayOfMoneyAmounts.splice(randomIndex, 1).pop();
    if (makeGrey) {
        // make grey the bar of the money amount to splice
        var index = gameShow.moneyDisplay.getBarIndex(moneyAmount);
        moneyDisplay.giveFade(index + 1);
    }
    return moneyAmount;
}

/*
    @post game has been updated so that the user can use the arrow
    keys to change which case is selected and can select a case
    by hitting Enter
*/
function selectFirstCase() {
    gameShow.canvasStack.set(CANVAS_IDS.BRIEFCASE_DISPLAY.concat(
        CANVAS_IDS.QUOTE));
    gameShow.briefcaseDisplay.setEmphasis(1);

    allowCaseSelectorMovement(true);

    gameShow.quotesToDraw.add("Now, you must use the left and " +
        "right arrow keys and the Enter key to choose a case.")
        .deployQuoteChain(function() {
            gameShow.soundPlayer.play(
                SOUND_EFFECTS_IDS.SELECT_CASE);
            handleCaseSelection();
        });
}

/*
    @pre gameShow.numberOfQuestionsCorrectlyAnswered is correct
    @post the question selected by the player has been presented
    to him/her
*/
function handleQuestionSelection() {
    allowQuestionSelectorMovement(false);

    // Play dramatic sound effect if user has answered enough
    // questions
    if (gameShow.numberOfQuestionsCorrectlyAnswered >= 5)
        gameShow.soundPlayer.play(SOUND_EFFECTS_IDS.PRESENT_QUESTION);

    // Present the question
    gameShow.turnVariables.selectedQuestion =
        gameShow.questions.numberOfLabelToEmphasize;
    gameShow.quotesToDraw.add("Here comes the question.")
        .deployQuoteChain(presentQuestionAndAnswers);
}

/*
    @pre gameShow.turnVariables.selectedQuestion has been updated
    @post the question, its answers, and the support options
    have been presented
*/
function presentQuestionAndAnswers() {
    // Update what the user sees and hears
    if (gameShow.millionDollarQuestion)
        gameShow.canvasStack.set(CANVAS_IDS.QUESTIONING,
            CanvasStack.EFFECTS.FADE_IN);
    else
        gameShow.canvasStack.set(CANVAS_IDS.QUESTIONING);
    gameShow.questions.drawQuestionAndAnswersText(
        gameShow.turnVariables.selectedQuestion);

    // Allow the user to pick an answer
    allowAnswerSelectorMovement(true);
    gameShow.keyActions.set(KEY_CODES.ENTER, handleAnswerSelection);
}

/*
    @post the game has responded appropriately to the user's
    choosing an answer
*/
function handleAnswerSelection() {
    allowAnswerSelectorMovement(false);

    // Save the answer
    gameShow.turnVariables.selectedAnswer =
        gameShow.questions.numberOfAnswerToEmphasize;

    // React to whether or not the answer was correct
    var question = gameShow.questions.getQuestion(
        gameShow.turnVariables.selectedQuestion);
    if (selectedCorrectAnswer(question,
        gameShow.turnVariables.selectedAnswer)) {
        if (gameShow.millionDollarQuestion)
            handleCorrectMillionAnswerSelection();
        else
            handleCorrectAnswerSelection();
    }
    else {
        if (gameShow.millionDollarQuestion)
            handleWrongMillionAnswerSelection();
        else
            handleWrongAnswerSelection();
    }
}

/*
    @pre gameShow.turnVariables.selectedQuestion and
    gameShow.turnVariables.selectedAnswer are updated;
    1 <= numberOfAnswer <= 4
    @hasTest yes
    @param question instance of Question that the user gave
    an answer for
    @param numberOfAnswer number of the answer selected by the user
    @returns true if user game correct answer; false, otherwise
*/
function selectedCorrectAnswer(question, numberOfAnswer) {
    return (question.answerData.correctIndex === (numberOfAnswer - 1));
}

/*
    @post the question and answer displays have been cleared;
    the questions' label display has been updated;
    the gameShow members have been updated
*/
function prepareForNextTurn() {
    // Prepare the canvases
    gameShow.questions.eraseQuestionAndAnswersText();
    gameShow.questions.setAnswered(gameShow.turnVariables.selectedQuestion);

    // Prepare gameShow members
    gameShow.turnVariables.selectedQuestion = undefined;
    gameShow.turnVariables.selectedAnswer = undefined;
    gameShow.turnVariables.bankerOffer = undefined;

    // Prepare the background music
    adjustBackgroundMusicBasedOnQuestionsAnswered();
}

/*
    @pre the music indicated by MUSIC_IDS.QUESTION_1_TO_5 is
    already playing if the user hasn't answered at least five
    questions; gameShow.numberOfQuestionsCorrectlyAnswered is correct
    and is less than 10
    @post background music has been changed depending on how
    many questions have been answered
*/
function adjustBackgroundMusicBasedOnQuestionsAnswered() {
    if (gameShow.numberOfQuestionsCorrectlyAnswered >= 5) {
        switch (gameShow.numberOfQuestionsCorrectlyAnswered) {
            case 5:
                gameShow.musicPlayer.play(MUSIC_IDS.QUESTION_6);
                break;
            case 6:
                gameShow.musicPlayer.play(MUSIC_IDS.QUESTION_7);
                break;
            case 7:
                gameShow.musicPlayer.play(MUSIC_IDS.QUESTION_8);
                break;
            case 8:
                gameShow.musicPlayer.play(MUSIC_IDS.QUESTION_9);
                break;
            case 9:
                gameShow.musicPlayer.play(MUSIC_IDS.QUESTION_10);
                break;
            case 10:
                gameShow.musicPlayer.play(MUSIC_IDS.QUESTION_MILLION);
                break;
        }
    }
    else
        gameShow.musicPlayer.play(MUSIC_IDS.QUESTION_1_TO_5);
}

/*
    @post the host has told the user what happened and concludes
    the game
*/
function handleCorrectMillionAnswerSelection() {
    // React visually and auditorily
    gameShow.canvasStack.set(CANVAS_IDS.SPEAKER_QUOTE);
    gameShow.musicPlayer.stop();

    // Tell the user what happened
    gameShow.quotesToDraw.add("That answer is: ")
        .deployQuoteChain(function() {
            gameShow.soundPlayer.play(
                SOUND_EFFECTS_IDS.CORRECT_ANSWER_MILLION);
            gameShow.quotesToDraw.add("CORRECT!")
                .add("Congratulations!")
                .add("You've beat the banker!")
                .add("And you go home a millionaire!")
                .deployQuoteChain(eraseQuoteBubbleText);
        });
}

/*
    @post the host has told the user what happened and concludes
    the game
*/
function handleWrongMillionAnswerSelection() {
    // React visually and auditorily
    gameShow.canvasStack.set(CANVAS_IDS.SPEAKER_QUOTE);
    gameShow.musicPlayer.stop();

    // Tell the user what happened
    gameShow.quotesToDraw.add("That answer is: ")
        .deployQuoteChain(function() {
            gameShow.soundPlayer.play(
                SOUND_EFFECTS_IDS.LOSS_MILLION);
            gameShow.quotesToDraw.add("INCORRECT!")
                .add("Now, you must leave with nothing.")
                .add("Good bye.")
                .deployQuoteChain(eraseQuoteBubbleText);
        });
}

/*
    @post the host has told the user what happened;
    the question's monetary value has been revealed;
    the number of correctly answered questions was updated;
    turn variables were reset;
    answered question can't be selected by user anymore;
    game reacted both visually and auditorily
*/
function handleCorrectAnswerSelection() {
    gameShow.numberOfQuestionsCorrectlyAnswered++;

    // React visually
    gameShow.canvasStack.set(CANVAS_IDS.SPEAKER_QUOTE);

    // Play special sound effect depending on how many questions
    // user has answered
    if (gameShow.numberOfQuestionsCorrectlyAnswered >= 5) {
        if (gameShow.numberOfQuestionsCorrectlyAnswered === 10)
            gameShow.soundPlayer.play(SOUND_EFFECTS_IDS.CORRECT_ANSWER_10);
        else
            gameShow.soundPlayer.play(SOUND_EFFECTS_IDS.CORRECT_ANSWER);
    }

    // Update what the host says
    gameShow.quotesToDraw.add("You have selected the correct answer.")
        .deployQuoteChain(function() {
            if (gameShow.numberOfQuestionsCorrectlyAnswered < 10) {
                gameShow.canvasStack.set(CANVAS_IDS.MONEY_DISPLAY.concat(
                    CANVAS_IDS.QUOTE));
                var questionValue =
                    getRandomMoneyAmount(gameShow.moneyAmounts, true,
                    gameShow.moneyDisplay);
                gameShow.quotesToDraw.add("The question was worth: $" +
                    questionValue.asString() + '.');
                if (gameShow.numberOfQuestionsCorrectlyAnswered === 9) {
                    gameShow.quotesToDraw.add("You now know what your " +
                        "case holds.")
                        .add("For the option to take it home, you must " +
                            "answer one more question.");
                }
                // The banker makes an offer after the second, fourth, sixth,
                // and eighth questions
                if (gameShow.numberOfQuestionsCorrectlyAnswered % 2 === 0)
                    gameShow.quotesToDraw.deployQuoteChain(makeBankerOffer);
                else
                    gameShow.quotesToDraw.deployQuoteChain(goToNextTurn);
            }
            else
                explainUserChooseMillionOrGoHome();
        });
}

/*
    @post the user has been offered a monetary amount by the banker
    that she can either accept (and leave the game) or reject
    (and continue the game)
*/
function makeBankerOffer() {
    gameShow.canvasStack.set(CANVAS_IDS.QUOTE.concat(
        CANVAS_IDS.BANKER), CanvasStack.EFFECTS.FADE_IN);
    gameShow.musicPlayer.play(MUSIC_IDS.BANKER);
    gameShow.turnVariables.bankerOffer = gameShow.banker.getOffer(
        gameShow.moneyAmounts.concat([gameShow.briefcaseValue]));

    gameShow.quotesToDraw.add("The banker is calling.")
        .add("He has an offer for you.")
        .add("Here's the offer.")
        .deployQuoteChain(function() {
            // Place special sound effect if big enough offer
            if (gameShow.turnVariables.bankerOffer.asNumber() >= 100000)
                gameShow.soundPlayer.play(
                    SOUND_EFFECTS_IDS.OFFERED_BIG_DEAL);

            gameShow.quotesToDraw.add("It is $" +
                gameShow.turnVariables.bankerOffer.asString() + '.')
                .deployQuoteChain(function() {
                    allowUserDealOrNoDeal(true);

                    gameShow.moneyDisplay.setBankerOffer(true,
                        gameShow.turnVariables.bankerOffer);
                    gameShow.canvasStack.set(CANVAS_IDS.MONEY_DISPLAY.concat(
                        CANVAS_IDS.QUOTE));

                    gameShow.quotesToDraw.add("Now, I must ask you: " +
                        "Deal or No Deal? (Press the 'y' key to accept " +
                        "the offer of $" +
                        gameShow.turnVariables.bankerOffer.asString() +
                        ". Press the 'n' key to reject it and continue.")
                        .deployQuoteChain();
            });
        });
}

/*
    @param bool true to enable the key actions that let the user
    choose whether or not she wishes to accept the banker's offer;
    false, otherwise
*/
function allowUserDealOrNoDeal(bool) {
    if (bool === true) {
        gameShow.keyActions.set(KEY_CODES.Y, function() {
            allowUserDealOrNoDeal(false);
            userAcceptsDeal();
        })
        .set(KEY_CODES.N, function() {
            allowUserDealOrNoDeal(false);
            userRejectsDeal();
        });
    }
    else {
        gameShow.keyActions.erase(KEY_CODES.Y).erase(KEY_CODES.N);
    }
}

/*
    @post game has properly reacted to the user's accepting the
    banker's deal; the host has stated whether or not it was
    a good deal
*/
function userAcceptsDeal() {
    gameShow.musicPlayer.play(MUSIC_IDS.ACCEPT_OR_REJECT_DEAL);

    // Host tells the user whether or not the deal was good
    // and concludes the game
    gameShow.canvasStack.set(CANVAS_IDS.SPEAKER_QUOTE);
    gameShow.quotesToDraw.add("You're taking home $" +
        gameShow.turnVariables.bankerOffer.asString() + '.')
        .deployQuoteChain(function() {
            gameShow.musicPlayer.play(MUSIC_IDS.WAS_A_GOOD_DEAL_ACCEPTED);
            gameShow.quotesToDraw.add(
                "Now the question is: did you get a good deal?")
            .add("The banker's offer was $" +
                gameShow.turnVariables.bankerOffer.asString() + '.')
            .add("You picked case number " +
                gameShow.selectedBriefcaseNumber + '.')
            .add("That case was worth: ")
            .deployQuoteChain(function() {
                if (gameShow.turnVariables.bankerOffer.asNumber() >
                    gameShow.briefcaseValue.asNumber())
                    userAcceptedGoodDeal();
                else
                    userAcceptedBadDeal();
            });
        });
}

/*
    @post host has explained that the deal was good and concluded
    the game
*/
function userAcceptedGoodDeal() {
    gameShow.soundPlayer.play(SOUND_EFFECTS_IDS.TOOK_GOOD_DEAL);
    gameShow.musicPlayer.stop();

    gameShow.quotesToDraw.add('$' + gameShow.briefcaseValue.asString() + '.')
        .deployQuoteChain(function() {
            gameShow.quotesToDraw.add("You got a good deal.")
                .add("Congratulations!")
                .add("That concludes this game.")
                .add("This is SpongeBob Squarepants signing off.")
                .add("See you next time.")
                .deployQuoteChain(eraseQuoteBubbleText);
        });
}

/*
    @post host has explained that the deal was bad and concluded
    the game
*/
function userAcceptedBadDeal() {
    gameShow.soundPlayer.play(SOUND_EFFECTS_IDS.TOOK_BAD_DEAL);
    gameShow.musicPlayer.stop();

    gameShow.quotesToDraw.add('$' + gameShow.briefcaseValue.asString() + '.')
        .deployQuoteChain(function() {
            gameShow.quotesToDraw.add("Oh! The banker " +
                "one-upped you this time.")
                .add("How unfortunate.")
                .add("That concludes this game.")
                .add("This is SpongeBob Squarepants signing off.")
                .add("See you next time.")
                .deployQuoteChain(eraseQuoteBubbleText);
        });
}

/*
    @post game has properly reacted to the user's rejecting the
    banker's deal; the game has been set up to continue
*/
function userRejectsDeal() {
    gameShow.musicPlayer.play(MUSIC_IDS.ACCEPT_OR_REJECT_DEAL);
    gameShow.moneyDisplay.setBankerOffer(false);

    gameShow.canvasStack.set(CANVAS_IDS.SPEAKER_QUOTE);
    gameShow.quotesToDraw.add("Let's hope you made the correct decision.")
        .deployQuoteChain(goToNextTurn);
}

/*
    @pre numberOfQuestionsCorrectlyAnswered < 10
    @post game has adjusted so that user can pick his next question
*/
function goToNextTurn() {
    prepareForNextTurn();

    // Update what the host says; call of selectQuestion starts
    // the next turn
    gameShow.canvasStack.set(CANVAS_IDS.SPEAKER_QUOTE);
    if (gameShow.numberOfQuestionsCorrectlyAnswered === 5)
        gameShow.quotesToDraw.add("You're halfway to the " +
            "million dollar question.");
    else
        gameShow.quotesToDraw.add("Get ready to pick a question.");
    gameShow.quotesToDraw.deployQuoteChain(selectQuestion);
}

/*
    @post the user has been presented the option of either taking
    her case home or facing the million dollar question; the host
    has told her the value of her case and the question's subject;
    key actions have been updated to allow her to choose
*/
function explainUserChooseMillionOrGoHome() {
    gameShow.quotesToDraw.add("You now have a tough choice.")
        .add("You can take home your case, which you know must " +
            "have a value of $" + gameShow.briefcaseValue.asString() + ".")
        .add("Or, you can face the million dollar question.")
        .add("If you choose to see the question, you must answer it.")
        .add("If you choose the wrong answer, you go home with nothing.")
        .add("However, if you choose the right answer, you go home " +
            "a millionaire.")
        .add("Remember: your helpers, lifelines, and cheats can't help " +
            "you on this question.")
        .add("Before I let you choose, I'll tell you the subject of " +
            "the question.")
        .add("It's subject is: " +
            gameShow.questions.getMillionDollarQuestion().subject + '.')
        .add("Now you must make your decision.")
        .deployQuoteChain(function() {
            allowUserChooseMillionOrGoHome(true);
            gameShow.canvasStack.set(CANVAS_IDS.QUOTE.concat(
                CANVAS_IDS.MILLION_QUESTION));
            gameShow.quotesToDraw.add("Press the 'y' key to see " +
                "the question. Press the 'n' key to quit.")
                .deployQuoteChain();
        });
}

/*
    @param bool true to enable the key actions that let the user
    choose whether or not she wishes to face the million dollar
    question; false, otherwise
*/
function allowUserChooseMillionOrGoHome(bool) {
    if (bool === true) {
        gameShow.keyActions.set(KEY_CODES.Y, function() {
            allowUserChooseMillionOrGoHome(false);
            gameShow.soundPlayer.play(SOUND_EFFECTS_IDS.PRESENT_QUESTION);

            // Host gives dramatic introduction to the question
            gameShow.canvasStack.set(CANVAS_IDS.SPEAKER_QUOTE);
            gameShow.quotesToDraw.add("Here it is.")
                .add("For one million dollars, here is the question.")
                .deployQuoteChain(presentMillionDollarQuestion);
        })
        .set(KEY_CODES.N, function() {
            allowUserChooseMillionOrGoHome(false);
            gameShow.canvasStack.set(CANVAS_IDS.SPEAKER_QUOTE);
            userTakesCaseHome();
        });
    }
    else {
        gameShow.keyActions.erase(KEY_CODES.Y).erase(KEY_CODES.N);
    }
}

/*
    @post the host explained what happened and concluded the game
*/
function userTakesCaseHome() {
    // React auditorily
    gameShow.musicPlayer.stop();

    // Make the host explain
    gameShow.quotesToDraw.add("Then, congratulations.")
        .add("You're going home with $" +
            gameShow.briefcaseValue.asString() + '.')
        .deployQuoteChain(function() {
            eraseQuoteBubbleText();
            gameShow.soundPlayer.play(SOUND_EFFECTS_IDS.GOOD_BYE);
        });
}

/*
    @post variables have been adjusted so that the million dollar
    question can be presented without any bugs involving class
    Questions; the question and its answers have been presented
    with appropriate music
*/
function presentMillionDollarQuestion() {
    // Reset the turn-specific variables and canvases; set the music
    prepareForNextTurn();

    gameShow.millionDollarQuestion = true;
    gameShow.turnVariables.selectedQuestion =
        Questions.MILLION_DOLLAR_QUESTION;

    presentQuestionAndAnswers();
}

/*
    @post the host has told the user that he/she has lost and has
    thus earned no money; the game has reacted visually and
    auditorily
*/
function handleWrongAnswerSelection() {
    // React visually and auditorily
    gameShow.canvasStack.set(CANVAS_IDS.SPEAKER_QUOTE);
    gameShow.soundPlayer.play(SOUND_EFFECTS_IDS.LOSS);
    gameShow.musicPlayer.stop();

    // Tell the user what happened
    gameShow.quotesToDraw.add("You have selected the wrong answer.")
        .add("Unfortunately, this means you'll go home with nothing.")
        .add("Good bye.")
        .deployQuoteChain(function() {
            eraseQuoteBubbleText();
            gameShow.soundPlayer.play(SOUND_EFFECTS_IDS.GOOD_BYE);
        });
}

/*
    @post game has been updated so that the user can use the arrow
    keys to change which question is selected and can select a question
    by hitting Enter
*/
function selectQuestion() {
    gameShow.canvasStack.set(CANVAS_IDS.CHOOSE_QUESTION.concat(
        CANVAS_IDS.QUOTE));
    gameShow.questions.emphasizeFirstAvailableLabel();

    allowQuestionSelectorMovement(true);

    gameShow.quotesToDraw.add("Use the four arrow keys " +
        "and the Enter key to select a question.")
        .deployQuoteChain(function() {
            gameShow.soundPlayer.play(
                SOUND_EFFECTS_IDS.SELECT_QUESTION);
            handleQuestionSelection()
        });
}

function setUpGame() {
    setUpQuoteBubble();
    setUpMillionDollarQuestionLabel();
    gameShow.banker.draw(CANVAS_IDS.BANKER);
    gameShow.moneyDisplay.setUp();
    gameShow.briefcaseDisplay.draw();
    gameShow.questions.drawInitialParts();

    // Show the appropriate canvases
    gameShow.canvasStack.set(CANVAS_IDS.SPEAKER_QUOTE);

    // Host's introductory text
    drawNewSpeaker(SPEAKERS.SPONGEBOB);
    gameShow.quotesToDraw.add("Welcome to the game. " +
        "Press Enter to go to the next quote.")
        .add("I'm your host, " +
            "SpongeBob Squarepants.")
        .add("Do you think you can beat the banker?")
        .add("If so, get ready to play this " +
            "combination of game shows.")
        .deployQuoteChain(explainRules);
}

function setUpTitleScreen() {
    gameShow.canvasStack.set(CANVAS_IDS.TITLE_SCREEN);
    drawTitleScreenText();
    gameShow.musicPlayer.play(MUSIC_IDS.OPENING);

    // Set up the user's ability to go to the game
    gameShow.keyActions.setUpEventHandler()
        .set(KEY_CODES.ENTER, setUpGame);
}

function setUpAudio() {
    gameShow.soundPlayer.storeElements();
    gameShow.musicPlayer.storeElements();
}

$(document).ready(function() {
    if (!isUnitTesting()) {
        setUpAudio();
        setUpTitleScreen();
    }
});