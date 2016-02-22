(function() {

    // GRAY - CNES
    // BLUE - NASA
    // RED - OKB-1
    // YELLOW - SAC
    // WHITE - ISAS

    var version = '210216';

    // Utility variables
    var footer = document.querySelector('#footer');
    var mainContent = document.querySelector('#mainContent');

    var addAdvancementButton = document.querySelector('#addAdvancementButton');
    var showSettingsModalButton = document.querySelector('#showSettingsModalButton');

    var settingsModal = document.querySelector('#settingsModal');
    var normalViewButton = document.querySelector('#normalViewButton');
    var compactViewButton = document.querySelector('#compactViewButton');

    var resetButton = document.querySelector('#resetButton');
    var resetGameModal = document.querySelector('#resetGameModal');
    var resetModalYesButton = resetGameModal.querySelector('#resetModalYesButton');
    var resetModalCancelButton = resetGameModal.querySelector('#resetModalCancelButton');

    var newAdvancementModal = document.querySelector('#newAdvancementModal');
    var numberOfOutcomes = document.querySelector('#numberOfOutcomes');

    var outcomeResultModal = document.querySelector('#outcomeResultModal');
    var outcomeContent = outcomeResultModal.querySelector('#outcomeContent');
    var shuffleOutcomesButton = outcomeResultModal.querySelector('#shuffleOutcomesButton');
    var removeOutcomeButton = outcomeResultModal.querySelector('#removeOutcomeButton');

    var agencies = {
        nasa : {
            name : 'NASA',
            bgColor : '#0099ff',
            fgColor : '#fff'
        },
        okb1 : {
            name : '&#1054;&#1050;&#1041;-1',
            bgColor : '#ff4d4d',
            fgColor: '#fff'
        },
        sac : {
            name : 'SAC',
            bgColor : '#ffff66',
            fgColor : '#000'
        },
        cnes : {
            name : 'CNES',
            bgColor : '#737373',
            fgColor : '#fff'
        },
        isas : {
            name : 'ISAS',
            bgColor : '#f2f2f2',
            fgColor : '#000'
        }
    };

    var blanket = document.querySelector('#blanket');

    var clickEvent = navigator.userAgent.indexOf('iPhone') > -1 || navigator.userAgent.indexOf('iPad') > -1 ? 'touchend' : 'click';

    var activeAdvancements = {};
    var currentState;

    var shuffleArray = function (array) {
        var i, j, temp;
        for (i = array.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    };

    var initOutcomes = function () {
        var temp = [];
        var i;
        for (i = 1; i <= 90; i++) {
            temp.push(i);
        }
        return shuffleArray(temp);
    };

    var initCurrentState = function () {
        return {
            version: version,
            config: {
                mode: 'normal'
            },
            currentPlayer: 'nasa',
            outcomesDeck: initOutcomes(),
            discardDeck: [],
            players: {
                nasa: {
                    advancements: {}
                },
                okb1: {
                    advancements: {}
                },
                sac: {
                    advancements: {}
                },
                cnes: {
                    advancements: {}
                },
                isas: {
                    advancements: {}
                }
            }
        };
    };

    var setConfigValues = function () {
        var viewWidth = document.documentElement.clientWidth;
        var config = currentState.config;

        if (config.mode === 'normal') {
            config.containerWidth = viewWidth < 350 ? viewWidth - 25 : 325;
            config.outcomeMargin = 25;
            config.outcomeDimension = config.containerWidth / 2 - 60;
            config.advancementMargin = config.outcomeDimension + 40;
            config.advancementFontSize = '20px';
        }
        if (config.mode === 'compact') {
            config.containerWidth = viewWidth < 185 ? viewWidth - 25 : 160;
            config.outcomeMargin = 20;
            config.outcomeDimension = config.containerWidth / 2 - 50;
            config.advancementMargin = config.outcomeDimension + 25;
            config.advancementFontSize = '12px';
        }

        config.containerHeight = config.containerWidth / 2;
        config.dialogWidth = viewWidth < 350 ? viewWidth - 25 : 325;
        config.advancementHeight = config.containerHeight - 40;
        config.advancementWidth = config.containerWidth - 25;

        config.maximumOutcomes = {
            Surveying: 1
        };
    };

    var setupModal = function (modal) {
        modal.style.width = currentState.config.dialogWidth + 'px';
        modal.style.bottom = '50%';
        modal.style.left = '50%';
        modal.style.marginBottom = '-' + modal.offsetHeight / 2 + 'px';
        modal.style.marginLeft = '-' + modal.offsetWidth / 2 + 'px';
        modal.style.visibility = 'visible';
    };

    var disableUsedAdvancements = function (player) {
        var spans = newAdvancementModal.querySelectorAll('span');
        var prop, i;
        for (prop in player.advancements) {
            if (player.advancements.hasOwnProperty(prop)) {
                for (i = 0; i < spans.length; i++) {
                    if (player.advancements[prop].name === spans[i].getAttribute('data-name')) {
                        if (spans[i].className.indexOf('disabled') === -1) {
                            addClassName(spans[i], 'disabled');
                        }
                    }
                }
            }
        }
    };

    var createNewAdvancement = function () {
        blanket.style.visibility = 'visible';
        clearAdvancementModalSelections();
        addClassName(numberOfOutcomes.querySelector('[data-number="3"]'), 'selected');
        disableUsedAdvancements(currentState.players[currentState.currentPlayer]);
        setupModal(newAdvancementModal);
    };

    var resetGameSetup = function () {
        blanket.style.visibility = 'visible';
        setupModal(resetGameModal);
    };

    var removeStorageAndReset = function () {
        if (window.Storage) {
            window.localStorage.removeItem('storedState');
        }
        window.location.reload();
    };

    var removeClassName = function(el, classname) {
        el.className = el.className.replace(new RegExp(classname, 'g'), '').replace(/\s$/, '');
    };

    var addClassName = function(el, classname) {
        el.className += ' ' + classname;
    };

    var clearState = function() {
        var svgs = document.querySelectorAll('svg');
        var disabledAdvancements = document.querySelectorAll('#newAdvancementModal span.disabled');
        var i, len;
        for (i = 0, len = svgs.length; i < len; i++) {
            SVG(svgs[i]).remove();
        }
        for (i = 0, len = disabledAdvancements.length; i < len; i++) {
            removeClassName(disabledAdvancements[i], 'disabled');
        }
        activeAdvancements = {};
        updateStorage();
    };

    var changePlayer = function(e) {
        currentState.currentPlayer = e.target.id;
        cancelBlanket();
        clearState();
        initPage();
    };

    var cancelBlanket = function () {
        var i;
        var modals = document.querySelectorAll('.modal');
        for (i = 0; i < modals.length; i++) {
            modals[i].style.visibility = 'hidden';
        }
        blanket.style.visibility = 'hidden';
    };

    var guid = function () {
        var s4 = function () {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        };
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };

    var clearAdvancementModalSelections = function () {
        var selected = numberOfOutcomes.querySelector('span.selected');
        var warning = numberOfOutcomes.querySelector('span.warning');
        if (selected) {
            removeClassName(selected, 'selected');
        }
        if (warning) {
            removeClassName(warning, 'warning');
        }
    };

    var newAdvancementModalHandler = function (e) {
        var target = e.target;
        var id = guid();
        var selectedNumber = numberOfOutcomes.querySelector('span.selected');
        var temp, outcomes, maximum, advancement;

        if (target.className.indexOf('advancement') > -1 && target.className.indexOf('disabled') === -1) {
            maximum = currentState.config.maximumOutcomes[target.getAttribute('data-name')];
            outcomes = selectedNumber.getAttribute('data-number');

            if (maximum < outcomes) {
                temp = numberOfOutcomes.querySelector('[data-number="' + maximum + '"]');
                if (temp.className.indexOf('warning') === -1) {
                   addClassName(temp, 'warning');
                }
            } else {

                // If there are not enough outcomes in the outcome or discard deck
                if (currentState.outcomesDeck.length + currentState.discardDeck.length < outcomes) {
                    cancelBlanket();
                    clearAdvancementModalSelections();
                    return;
                }

                advancement = {
                    player: currentState.currentPlayer,
                    id: id,
                    name: target.getAttribute('data-name'),
                    outcomes: [],
                    maxLength: outcomes,
                    finalRevealed: false
                };
                currentState.players[currentState.currentPlayer].advancements[id] = advancement;
                activeAdvancements[id] = new Advancement(advancement);

                cancelBlanket();
                clearAdvancementModalSelections();
                updateStorage();
            }
        }

        if (target.className.indexOf('number') > -1 && target.className.indexOf('selected') === -1) {
            clearAdvancementModalSelections();
            addClassName(target, 'selected');
        }
    };

    var showSettingsModal = function() {
        changeViewModeSelection();
        blanket.style.visibility = 'visible';
        setupModal(settingsModal);
    };

    var changeViewModeSelection = function() {
        if (currentState.config.mode === 'normal') {
            removeClassName(normalViewButton, 'disabled');
            addClassName(compactViewButton, 'disabled');
        }
        if (currentState.config.mode === 'compact') {
            removeClassName(compactViewButton, 'disabled');
            addClassName(normalViewButton, 'disabled');
        }
        clearState();
        initPage();
    };

    var settingsModalHandler = function(e) {
        if (e.target.id === 'normalViewButton' && currentState.config.mode === 'compact') {
            currentState.config.mode = 'normal';
            changeViewModeSelection();
        }
        if (e.target.id === 'compactViewButton' && currentState.config.mode === 'normal') {
            currentState.config.mode = 'compact';
            changeViewModeSelection();
        }
        if (e.target.id in agencies) {
            if (e.target.id !== currentState.currentPlayer) {
                changePlayer(e);
            } else {
                cancelBlanket();
            }
        }
    };

    var setEventListeners = function () {
        addAdvancementButton.addEventListener(clickEvent, createNewAdvancement);

        showSettingsModalButton.addEventListener(clickEvent, showSettingsModal);

        newAdvancementModal.addEventListener(clickEvent, newAdvancementModalHandler);

        settingsModal.addEventListener(clickEvent, settingsModalHandler);

        resetButton.addEventListener(clickEvent, resetGameSetup);
        resetModalYesButton.addEventListener(clickEvent, removeStorageAndReset);
        resetModalCancelButton.addEventListener(clickEvent, cancelBlanket);

        blanket.addEventListener(clickEvent, cancelBlanket);
    };

    var createAdvancements = function () {
        var prop;
        var advancements = currentState.players[currentState.currentPlayer].advancements;
        for (prop in advancements) {
            if (advancements.hasOwnProperty(prop)) {
                activeAdvancements[prop] = new Advancement(advancements[prop]);
            }
        }
    };

    var redoOutcomesDeck = function () {
        currentState.outcomesDeck = shuffleArray(currentState.discardDeck);
        currentState.discardDeck = [];
    };

    var drawAdvancementContainer = function (name) {
        var container = SVG(mainContent).size(currentState.config.containerWidth, currentState.config.containerHeight);
        container.rect(currentState.config.advancementWidth, currentState.config.advancementHeight)
            .attr({
                x: 15,
                y: 15,
                fill: '#fff',
                stroke: '#000'
            })
            .radius(3);
        container.text(name)
            .attr({
                x: currentState.config.advancementMargin,
                y: currentState.config.outcomeMargin
            })
            .font({
                family: 'Helvetica',
                size : currentState.config.advancementFontSize
            });
        container.image('img/0.png')
            .attr({
                width: currentState.config.outcomeDimension,
                height: currentState.config.outcomeDimension,
                x: currentState.config.outcomeMargin,
                y: currentState.config.outcomeMargin
            });
        return container;
    };

    var drawOutcome = function (i, container, id) {
        var path;
        switch (i) {
            case 2:
                path = 'img/3.png';
                break;
            case 1:
                path = 'img/2.png';
                break;
            case 0:
                path = 'img/1.png';
                break;
        }
        return {
            outcomeCard: container.rect(currentState.config.outcomeDimension, currentState.config.outcomeDimension)
                .attr({
                    x: currentState.config.outcomeMargin,
                    y: currentState.config.outcomeMargin,
                    fill: '#fff',
                    stroke: '#000',
                    id: id
                })
                .radius(3),
            outcomeImage: container.image(path)
                .attr({
                    width: currentState.config.outcomeDimension,
                    height: currentState.config.outcomeDimension,
                    x: currentState.config.outcomeMargin,
                    y: currentState.config.outcomeMargin,
                    id: id
                })
        }
    };

    var styleOutcomeResultsModalButtons = function() {
        if (shuffleOutcomesButton.className.indexOf('disabled') > -1) {
            removeClassName(shuffleOutcomesButton, 'disabled');
        }
    };

    var Advancement = function(advancement) {
        var i, len, temp, tempGroup;
        var that = this;
        this.player = advancement.player;
        this.outcomes = advancement.outcomes;
        this.maxLength = advancement.maxLength;
        this.name = advancement.name;
        this.finalRevealed = advancement.finalRevealed;
        this.id = advancement.id;

        this.showOutcomeResult = function() {
            var topOutcome = that.outcomesDeck.last().attr('outcome');
            var final = that.outcomesDeck.members.length === 1;

            var outcomeSuccess = function() {
                outcomeContent.innerHTML = 'Success!';
                if (final) {
                    addClassName(shuffleOutcomesButton, 'disabled');
                    shuffleOutcomesButton.removeEventListener(clickEvent, shuffleOutcomes);
                    blanket.addEventListener(clickEvent, removeTopOutcome);
                } else {
                    blanket.addEventListener(clickEvent, shuffleOutcomes);
                }
            };

            var outcomeFailure = function() {
                blanket.addEventListener(clickEvent, shuffleOutcomes);
                if (topOutcome < 76) {
                    outcomeContent.innerHTML = 'Minor Failure!';
                } else if (topOutcome < 91) {
                    outcomeContent.innerHTML = 'Major Failure!';
                }
            };

            var shuffleOutcomes = function() {
                var id = that.id;
                var temp = [];
                var i = 0;
                if (final) {
                    that.showFinalCard();
                    currentState.players[currentState.currentPlayer].advancements[id].finalRevealed = true;
                }
                that.outcomesDeck.each(function() {
                    temp.push(this.attr('outcome'));
                });
                temp = shuffleArray(temp);
                that.outcomesDeck.each(function() {
                    this.attr({outcome : temp[i]});
                    i++;
                });
                updateStorage();
                resetOutcomeResults();
            };

            var removeTopOutcome = function() {
                var id = that.id;
                var members, i;
                var outcomes = [];
                var maxLength = 0;
                that.outcomesDeck.last().remove();
                that.outcomesDeck.members.pop();
                members = that.outcomesDeck.members;
                for (i = 0; i < members.length; i++) {
                    outcomes.push(members[i].attr('outcome'));
                    maxLength += 1;
                }
                currentState.players[currentState.currentPlayer].advancements[id].outcomes = outcomes;
                currentState.players[currentState.currentPlayer].advancements[id].maxLength = maxLength;
                currentState.discardDeck.push(topOutcome);
                updateStorage();
                resetOutcomeResults();
            };

            var resetOutcomeResults = function() {
                blanket.removeEventListener(clickEvent, shuffleOutcomes);
                blanket.removeEventListener(clickEvent, removeTopOutcome);
                outcomeResultModal.removeEventListener(clickEvent, removeTopOutcome);
                shuffleOutcomesButton.removeEventListener(clickEvent, shuffleOutcomes);
                removeOutcomeButton.removeEventListener(clickEvent, removeTopOutcome);
                blanket.addEventListener(clickEvent, cancelBlanket);
                cancelBlanket();
            };

            // Listeners on the outcome buttons
            shuffleOutcomesButton.addEventListener(clickEvent, shuffleOutcomes);
            removeOutcomeButton.addEventListener(clickEvent, removeTopOutcome);

            blanket.style.visibility = 'visible';

            styleOutcomeResultsModalButtons();
            setupModal(outcomeResultModal);

            // remove default behavior of clicking the blanket
            blanket.removeEventListener(clickEvent, cancelBlanket);

            if (topOutcome < 61) {
                outcomeSuccess();
            } else {
                outcomeFailure();
            }
        };

        this.showFinalCard = function() {
            var final = this.outcomesDeck.members.length === 1;
            var finalOutcome = this.outcomesDeck.last().attr('outcome');
            var path = finalOutcome < 76 ? 'img/minor.png' : 'img/major.png';
            if (final) {
                this.outcomesDeck.last().get(1).load(path);
            }
        };

        // Add cards until maxLength is reached
        while (this.outcomes.length < this.maxLength) {
            // If the outcomes deck runs out, reset it
            // Then, add first card in the outcomes deck to this advancement
            if (!currentState.outcomesDeck.length) {
                redoOutcomesDeck();
            }
            this.outcomes.push(currentState.outcomesDeck.shift());
        }

        this.outcomes = shuffleArray(this.outcomes);

        this.advancementContainer = drawAdvancementContainer(this.name);

        this.outcomesDeck = this.advancementContainer.set();

        for (i = 0, len = this.outcomes.length; i < len; i++) {
            temp = drawOutcome(i, this.advancementContainer, this.id);
            tempGroup = this.advancementContainer.group();
            tempGroup.add(temp.outcomeCard);
            tempGroup.add(temp.outcomeImage);
            tempGroup.attr({
                id : this.id,
                outcome : this.outcomes[i],
                x : temp.outcomeCard.x(),
                y : temp.outcomeImage.y()
            });
            this.outcomesDeck.add(tempGroup);
        }

        if (this.finalRevealed === true && this.outcomesDeck.members.length === 1) {
            this.showFinalCard();
        }

        this.outcomesDeck.on('click', this.showOutcomeResult);

        return {
            outcomesDeck : this.outcomesDeck,
            showFinalCard : this.showFinalCard,
            showOutcomeResult : this.showOutcomeResult
        }
    };

    var updateStorage = function() {
        if (window.Storage) {
            window.localStorage.removeItem('storedState');
            window.localStorage.setItem('storedState', JSON.stringify(currentState));
        }
    };

    var setFooter = function() {
        var bgColor = agencies[currentState.currentPlayer].bgColor;
        var fgColor = agencies[currentState.currentPlayer].fgColor;
        footer.style.backgroundColor = bgColor;
        footer.style.color = fgColor;
        showSettingsModalButton.innerHTML = agencies[currentState.currentPlayer].name;
    };

    var initPage = function() {
        currentState = window.Storage && window.localStorage.getItem('storedState') ? JSON.parse(window.localStorage.getItem('storedState')) : {};
        if (currentState.version !== version) {
            currentState = initCurrentState();
        }
        setFooter();
        setConfigValues();
        setEventListeners();
        createAdvancements();
        updateStorage();
    };

    initPage();
    FastClick.attach(document.body);
})();