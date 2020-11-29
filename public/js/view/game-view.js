import ClientConfig from '../config/client-config.js';
import DomHelper from './dom-helper.js';

const ENTER_KEYCODE = 13;
const SPACE_BAR_KEYCODE = 32;
const UP_ARROW_KEYCODE = 38;
const DOWN_ARROW_KEYCODE = 40;

/**
 * Handles all requests related to the display of the game, not including the canvas
 */
export default class GameView {
    constructor(
        joinGameCallback, keyDownCallback, muteAudioCallback, playerColorChangeCallback, playerNameUpdatedCallback,
        spectateGameCallback, toggleGridLinesCallback) {
        this.isChangingName = false;
        this.joinGameCallback = joinGameCallback;
        this.keyDownCallback = keyDownCallback;
        this.muteAudioCallback = muteAudioCallback;
        this.playerNameUpdatedCallback = playerNameUpdatedCallback;
        this.spectateGameCallback = spectateGameCallback;
        this._initEventHandling(muteAudioCallback, playerColorChangeCallback,
              toggleGridLinesCallback);
    }

    ready() {
        // Show everything when ready
        DomHelper.showAllContent();
    }

    setKillMessageWithTimer(message) {
        DomHelper.setKillMessagesDivText(message);
        if (this.killMessagesTimeout) {
            clearTimeout(this.killMessagesTimeout);
        }
        this.killMessagesTimeout = setTimeout(DomHelper.clearKillMessagesDivText.bind(DomHelper),
            ClientConfig.TIME_TO_SHOW_KILL_MESSAGE_IN_MS);
    }

    setMuteStatus(isMuted) {
        let text;
        if (isMuted) {
            text = 'Unmute';
        } else {
            text = 'Mute';
        }
        DomHelper.setToggleSoundButtonText(text);
    }

    // showFoodAmount(foodAmount) {
    //     DomHelper.setCurrentFoodAmountLabelText(foodAmount);
    // }

    showKillMessage(killerName, victimName, killerColor, victimColor, victimLength) {
        this.setKillMessageWithTimer(`<span style='color: ${killerColor}'>${killerName}</span> killed ` +
            `<span style='color: ${victimColor}'>${victimName}</span>` +
            ` and grew by <span style='color: ${killerColor}'>${victimLength}</span>`);
    }

    showKilledEachOtherMessage(victimSummaries) {
        let victims = '';
        for (const victimSummary of victimSummaries) {
            victims += `<span style='color: ${victimSummary.color}'>${victimSummary.name}</span> `;
        }
        this.setKillMessageWithTimer(`${victims} have killed each other`);
    }

    showRanIntoWallMessage(playerName, playerColor) {
        this.setKillMessageWithTimer(`<span style='color: ${playerColor}'>${playerName}</span> ran into a wall`);
    }

    showSuicideMessage(victimName, victimColor) {
        this.setKillMessageWithTimer(`<span style='color: ${victimColor}'>${victimName}</span> committed suicide`);
    }

    showNotification(notification, playerColor) {
        const notificationDiv = DomHelper.getNotificationsDiv();
        const formattedNotification = `<div><span class='time-label'>${new Date().toLocaleTimeString()} - </span>` +
            `<span style='color: ${playerColor}'>${notification}<span/></div>`;
        notificationDiv.innerHTML = formattedNotification + notificationDiv.innerHTML;
    }

    updatePlayerName(playerName, playerColor) {
        DomHelper.setPlayerNameElementValue(playerName);
        if (playerColor) {
            DomHelper.setPlayerNameElementColor(playerColor);
        }
    }

    /*******************
     *  Event handling *
     *******************/

    _handleChangeNameButtonClick() {
        if (this.isChangingName) {
            this._saveNewPlayerName();
        } else {
            DomHelper.setChangeNameButtonText('Save');
            DomHelper.setPlayerNameElementReadOnly(false);
            DomHelper.getPlayerNameElement().select();
            this.isChangingName = true;
        }
    }

    _handleKeyDown(e) {
        // Prevent keyboard scrolling default behavior
        if ((e.keyCode === UP_ARROW_KEYCODE || e.keyCode === DOWN_ARROW_KEYCODE) ||
             (e.keyCode === SPACE_BAR_KEYCODE && e.target === DomHelper.getBody())) {
            e.preventDefault();
        }

        // When changing names, save new name on enter
        if (e.keyCode === ENTER_KEYCODE && this.isChangingName) {
            this._saveNewPlayerName();
            DomHelper.blurActiveElement();
            return;
        }

        if (!this.isChangingName) {
            this.keyDownCallback(e.keyCode);
        }
    }


    _handlePlayOrWatchButtonClick() {
        const command = DomHelper.getPlayOrWatchButton().textContent;
        if (command === 'Play') {
            DomHelper.setPlayOrWatchButtonText('Watch');
            this.joinGameCallback();
        } else {
            DomHelper.setPlayOrWatchButtonText('Play');
            this.spectateGameCallback();
        }
    }

    _saveNewPlayerName() {
        const playerName = DomHelper.getPlayerNameElement().value;
        if (playerName && playerName.trim().length > 0 && playerName.length <= ClientConfig.MAX_NAME_LENGTH) {
            this.playerNameUpdatedCallback(playerName);
            DomHelper.setChangeNameButtonText('Change Name');
            DomHelper.setPlayerNameElementReadOnly(true);
            this.isChangingName = false;
            DomHelper.hideInvalidPlayerNameLabel();
        } else {
            DomHelper.showInvalidPlayerNameLabel();
        }
    }

    _initEventHandling(muteAudioCallback, playerColorChangeCallback,
         toggleGridLinesCallback) {
        // Player controls
        DomHelper.getChangeColorButton().addEventListener('click', playerColorChangeCallback);
        DomHelper.getChangeNameButton().addEventListener('click', this._handleChangeNameButtonClick.bind(this));
        DomHelper.getPlayerNameElement().addEventListener('blur', this._saveNewPlayerName.bind(this));
        DomHelper.getPlayOrWatchButton().addEventListener('click', this._handlePlayOrWatchButtonClick.bind(this));
        DomHelper.getToggleGridLinesButton().addEventListener('click', toggleGridLinesCallback);
        DomHelper.getToggleSoundButton().addEventListener('click', muteAudioCallback);
        DomHelper.getFullScreenButton().addEventListener('click', DomHelper.toggleFullScreenMode);
        window.addEventListener('keydown', this._handleKeyDown.bind(this), true);
    }
}
